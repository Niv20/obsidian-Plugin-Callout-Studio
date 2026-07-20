/**
 * manager/CSSInjector.ts — Generates and injects dynamic CSS for all callouts.
 *
 * Reads every CalloutDefinition from the registry and writes a single
 * `<style>` element into the document head with per-callout CSS custom
 * properties (colors, icon offsets, sizes). Debounces rapid successive calls
 * so the DOM is only updated once after a batch of registry changes.
 * Also manages the Material Symbols font link element when needed.
 */
import { setIcon } from "obsidian";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../types";
import {
	bgGradientCss,
	calloutColorValue,
	hexToRgbString,
} from "../utils/colorUtils";
import { ensureMaterialFontLoaded, svgToDataUri } from "../utils/iconLoader";
import {
	applyTitleGradient,
	clearGradientChars,
} from "../reading/gradientTitleText";
import {
	CSS_FOLD_ARROW,
	CSS_HEADING_LINE,
	CSS_HEADING_TITLE,
	CSS_HEADING_TOKEN,
	CSS_INLINE_TOKEN,
	CSS_REF_TOKEN,
	CSS_TOKEN_ICON,
	CSS_TOKEN_NAME,
	CSS_UNKNOWN,
	paintRoleIcon,
	resolveCalloutDef,
} from "../editor/renderShared";
import type { CalloutRegistry } from "./CalloutRegistry";
import { StartupStyleCache } from "./StartupStyleCache";

const DEBOUNCE_MS = 300;

const STYLE_SHEET_REGISTRY_KEY = "__calloutStudioStyleSheet";
type RegistryWindow = Window & {
	[STYLE_SHEET_REGISTRY_KEY]?: CSSStyleSheet;
};

const STYLE_EL_ID = "callout-studio-dynamic-css";

/** One `background-image` layer: a gradient sweep. */
interface BgLayer {
	image: string;
}

export class CSSInjector {
	private styleSheet: CSSStyleSheet | null = null;
	private styleDoc: Document | null = null;
	private styleEl: HTMLStyleElement | null = null;
	private debounceTimer: number | null = null;
	private injecting = false;
	private registry: CalloutRegistry;
	private app: App;
	private startupCache: StartupStyleCache;

	constructor(app: App, registry: CalloutRegistry) {
		this.app = app;
		this.registry = registry;
		this.startupCache = new StartupStyleCache(app);
	}

	initialize(): void {
		this.ensureStyleSheet();
		this.inject();
	}

	/**
	 * Startup fast path: synchronously re-apply the CSS snapshot cached by the
	 * previous session (see StartupStyleCache). Called as the very first step
	 * of plugin onload, BEFORE `loadData()` is awaited, so styling lands
	 * without waiting on disk IO or CSS generation. The registry is still
	 * empty at this point — no css-change is emitted and no icons are painted;
	 * the real inject() replaces this snapshot moments later.
	 */
	injectFromCache(): void {
		const cached = this.startupCache.loadCachedCss();
		if (!cached) return;
		this.ensureStyleSheet();
		if (this.styleSheet) this.styleSheet.replaceSync(cached);
		this.ensureStyleEl();
		if (this.styleEl) this.styleEl.textContent = cached;
	}

	private ensureStyleSheet(): void {
		if (this.styleSheet) return;
		if (!("adoptedStyleSheets" in activeDocument)) return;

		const registryWindow = window as RegistryWindow;
		const existing = registryWindow[STYLE_SHEET_REGISTRY_KEY];
		if (existing) {
			this.styleSheet = existing;
			return;
		}

		const doc = activeDocument;
		// Construct the sheet using the target document's window realm.
		// Using the global CSSStyleSheet constructor when activeDocument belongs
		// to a pop-out window (a different realm) causes a
		// "Sharing constructed stylesheets in multiple documents" error in older
		// Electron builds where cross-realm sheet adoption is not permitted.
		const win = doc.defaultView ?? window;
		const sheet = new win.CSSStyleSheet();

		try {
			doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
		} catch {
			// Fallback: existing sheets in adoptedStyleSheets may have been
			// adopted by a different document (e.g. orphaned from a closed
			// pop-out). Replace the array with only our sheet.
			doc.adoptedStyleSheets = [sheet];
		}

		registryWindow[STYLE_SHEET_REGISTRY_KEY] = sheet;
		this.styleSheet = sheet;
		this.styleDoc = doc;
	}

	/**
	 * Ensure a real `<style>` element exists in the MAIN window's <head>.
	 *
	 * This is the critical part for PDF export: Obsidian's "Export to PDF"
	 * renders in a context that honors `<style>`/snippet CSS in <head> but
	 * IGNORES `adoptedStyleSheets` (constructed stylesheets). So writing the same
	 * CSS into a `<style>` element is what makes callout colors and material/emoji
	 * icons actually appear in exported PDFs.
	 */
	private ensureStyleEl(): void {
		if (this.styleEl && this.styleEl.isConnected) return;
		// Use the main renderer document (where Export to PDF operates), not
		// activeDocument (which may transiently be a pop-out window). The
		// workspace container always lives in the main window, so its
		// ownerDocument is the main renderer document.
		const doc = this.app.workspace.containerEl.ownerDocument;
		const existing = doc.getElementById(STYLE_EL_ID);
		if (existing instanceof HTMLStyleElement) {
			this.styleEl = existing;
			return;
		}
		// createEl("style") is blocked by obsidianmd/no-forbidden-elements; this element holds
		// runtime-generated per-callout CSS (PDF export needs a real <style> tag, adoptedStyleSheets
		// isn't printed — see class doc above), not a static styles.css.
		const el = doc.createElement("style");
		el.id = STYLE_EL_ID;
		doc.head.appendChild(el);
		this.styleEl = el;
	}

	inject(emitCssChange = true): void {
		if (this.injecting) return;
		this.injecting = true;
		this.ensureStyleSheet();

		const callouts = this.registry.getAll();
		const rules: string[] = [
			"/* Auto-generated by Callout Studio — do not edit manually */",
		];

		// Global callout style rules
		rules.push(this.generateGlobalStyleCSS());

		// The DOM inline-SVG/emoji copies that paintIcons bakes in are the icons
		// shown in PDF export (print). Hide them on screen (live view uses the
		// ::after icon above); `@media screen` means they reveal themselves in
		// print, where they render far more reliably than a CSS mask.
		rules.push(
			"@media screen {\n" +
				".callout > .callout-title > .callout-icon > .cs-export-icon { display: none; }\n" +
				"}\n" +
				// Size the baked emoji copy via a class instead of an inline style;
				// this rule ships in the same <style> element Obsidian honors when
				// exporting to PDF (see bakeEmojiExportIcon).
				".callout > .callout-title > .callout-icon > span.cs-export-icon { font-size: var(--icon-size, 1.2em); line-height: 1; }",
		);

		const materialFonts = new Set<string>();

		for (const def of callouts) {
			rules.push(this.generateCalloutCSS(def));
		}

		// Fallback rule: style unrecognized callout IDs with the fallback callout
		rules.push(this.generateFallbackCSS(callouts));

		// Clean up any leftover material font links (no longer needed for rendering)
		this.updateMaterialFontLinks(materialFonts);

		const cssText = rules.join("\n\n");
		// Write the CSS to BOTH targets:
		//  1. adoptedStyleSheets — fast path for live Reading view / Live Preview
		//     (and pop-out windows).
		//  2. a real <style> in <head> — the ONLY one Obsidian's PDF export
		//     honors (it ignores adoptedStyleSheets), so this is what makes
		//     colors + material/emoji icons render correctly in exported PDFs.
		if (this.styleSheet) this.styleSheet.replaceSync(cssText);
		this.ensureStyleEl();
		if (this.styleEl) this.styleEl.textContent = cssText;

		// Snapshot the same text for next launch's startup fast path
		// (localStorage + CSS snippet — see StartupStyleCache).
		this.startupCache.persist(cssText);

		// Re-paint DOM icons: keeps Lucide icons in sync after edits, and bakes
		// the hidden material/emoji export fallback nodes (see paintIcon).
		this.paintIcons();

		// Trigger Obsidian to re-render callouts with updated styles — but only
		// when *we* are the source of the change. When reacting to an external
		// css-change (theme/snippet, or another plugin), re-emitting would create
		// a feedback loop with other css-change listeners that also re-emit
		// (e.g. Style Settings), causing its settings UI to flicker endlessly.
		if (emitCssChange) {
			this.app.workspace.trigger("css-change");
		}
		this.injecting = false;
	}

	/**
	 * Background declarations for one theme mode: the solid color plus, when a
	 * gradient is set, the image layered on top. The solid `background-color`
	 * doubles as the fallback if a renderer drops the image;
	 * `print-color-adjust: exact` keeps the image from being stripped when
	 * exporting to PDF / printing. Empty when the mode has no background
	 * color (a gradient alone has no base to render on).
	 */
	private bgProps(
		def: CalloutDefinition,
		mode: "light" | "dark",
		important = false,
	): string[] {
		const bg = mode === "dark" ? def.bgColorDark : def.bgColorLight;
		if (!bg) return [];
		const imp = important ? " !important" : "";
		const props = [`  background-color: ${bg}${imp};`];
		const layer = this.bgImageFor(def, mode);
		if (layer) {
			props.push(
				`  background-image: ${layer.image}${imp};`,
				`  -webkit-print-color-adjust: exact${imp};`,
				`  print-color-adjust: exact${imp};`,
			);
		}
		return props;
	}

	/**
	 * The `background-image` layer for one mode: the gradient sweep, or null
	 * when the def has no gradient, or when the mode has no background color
	 * to sweep from.
	 */
	private bgImageFor(
		def: CalloutDefinition,
		mode: "light" | "dark",
	): BgLayer | null {
		const bg = mode === "dark" ? def.bgColorDark : def.bgColorLight;
		if (!bg) return null;
		if (!def.bgGradient) return null;
		const to =
			mode === "dark"
				? def.bgGradient.toColorDark
				: def.bgGradient.toColorLight;
		return { image: bgGradientCss(bg, to, def.bgGradient) };
	}

	/**
	 * The text sweep for one mode, or null when the def has no gradient, its
	 * text sweep is off, or the accent-strength end color is missing.
	 *
	 * Runs from the mode's ACCENT color to `textToColor*` — deliberately not
	 * the background's own stops, which are pale tints designed to sit behind
	 * text and would be all but invisible painted through the glyphs.
	 */
	private textGradientCss(
		def: CalloutDefinition,
		mode: "light" | "dark",
	): string | null {
		const g = def.bgGradient;
		if (!g?.textGradient) return null;
		const to = mode === "dark" ? g.textToColorDark : g.textToColorLight;
		if (!to) return null;
		const from = mode === "dark" ? def.colorDark : def.colorLight;
		return bgGradientCss(from, to, g);
	}

	/**
	 * Declarations that paint `image` through an element's own glyphs while
	 * keeping what it already had behind them — two background layers: the
	 * sweep clipped to the text, over `under` clipped normally.
	 *
	 * The trailing `border-box` is load-bearing: `background-clip` governs
	 * `background-color` too (via the LAST layer's value), so a lone
	 * `background-clip: text` would clip an element's solid background to its
	 * text as well — erasing the heading bar and the inline pill. Keeping a
	 * final `none` layer gives the color a `border-box` clip to use.
	 *
	 * One sweep is declared per element, never per child, so it runs across
	 * the whole title in one pass instead of restarting on every glyph.
	 * `-webkit-text-fill-color` is what hides the flat text under the sweep;
	 * `color` is left alone so icons keep tracking it through `currentColor`.
	 */
	private textSweepProps(image: string, under: string | null): string[] {
		return [
			`  background-image: ${image}, ${under ?? "none"};`,
			`  -webkit-background-clip: text, border-box;`,
			`  background-clip: text, border-box;`,
			`  -webkit-text-fill-color: transparent;`,
			`  -webkit-print-color-adjust: exact;`,
			`  print-color-adjust: exact;`,
		];
	}

	/**
	 * The text-sweep rules for one render role, light + dark. Mirrors the
	 * background rules' explicit-undefined cascade: the light rule is left
	 * unscoped so it keeps applying in dark mode when the def has no
	 * dark-specific colors, and an identical dark rule is skipped as a no-op.
	 *
	 * `ownsBackground` must say whether the swept element is the one carrying
	 * the callout's background layer — the pill root does, a title span nested
	 * inside a painted bar does not. Re-declaring the layer under an element
	 * that never had it would squeeze a second copy of the gradient into that
	 * element's own (much narrower) box, on top of the real one.
	 */
	private textSweepRules(
		def: CalloutDefinition,
		selectorsFor: (themePrefix: string) => string,
		ownsBackground: boolean,
	): string[] {
		const light = this.textGradientCss(def, "light");
		if (!light) return [];
		const under = (mode: "light" | "dark"): string | null =>
			ownsBackground ? (this.bgImageFor(def, mode)?.image ?? null) : null;
		const lightProps = this.textSweepProps(light, under("light"));
		const rules = [`${selectorsFor("")} {\n${lightProps.join("\n")}\n}`];
		const dark = this.textGradientCss(def, "dark");
		if (dark) {
			const darkProps = this.textSweepProps(dark, under("dark"));
			if (darkProps.join("") !== lightProps.join("")) {
				rules.push(
					`${selectorsFor(".theme-dark ")} {\n${darkProps.join("\n")}\n}`,
				);
			}
		}
		// PDF export: Chromium's print engine does not support
		// `background-clip: text` — in print the sweep paints as an unclipped
		// block over the title instead of through the glyphs, and the
		// transparent text fill leaves garbage. There is no way to make the
		// technique itself print, so print drops the sweep entirely and the
		// per-grapheme solid colors take over (spans painted by
		// gradientTitleText.ts + the `.cs-grad-ch` print rule in styles.css).
		// The pill's own background gradient is restored by its print-only
		// ::before (see pillPrintGradientCSS), never by this element again.
		// Both theme prefixes are grouped so this later rule outranks the
		// screen rules above in either mode by source order / specificity.
		rules.push(
			`@media print {\n${selectorsFor("")},\n${selectorsFor(".theme-dark ")} {\n` +
				`  background-image: none;\n` +
				`  -webkit-background-clip: border-box;\n` +
				`  background-clip: border-box;\n` +
				`  -webkit-text-fill-color: currentColor;\n` +
				`}\n}`,
		);
		return rules;
	}

	/**
	 * True when the def needs a `.theme-dark` override block — any of its
	 * mode-dependent colors (accent, background, gradient end) differ.
	 */
	private needsDarkBlock(def: CalloutDefinition): boolean {
		return (
			def.colorLight !== def.colorDark ||
			def.bgColorLight !== def.bgColorDark ||
			(!!def.bgGradient &&
				def.bgGradient.toColorLight !== def.bgGradient.toColorDark)
		);
	}

	private generateCalloutCSS(def: CalloutDefinition): string {
		const lightRgb = hexToRgbString(def.colorLight);
		const darkRgb = hexToRgbString(def.colorDark);
		const iconCSS = this.getIconCSS(def);

		const parts: string[] = [];

		// Light mode (default).
		// --callout-color: full color (Obsidian 1.13+) or RGB triplet (≤1.12),
		// for Obsidian's own callout chrome. --cs-color-rgb: always a triplet,
		// for our own rgb()/rgba() consumers (borders, Material icon fill).
		const lightProps: string[] = [
			`  --callout-color: ${calloutColorValue(def.colorLight)};`,
			`  --cs-color-rgb: ${lightRgb};`,
		];
		if (iconCSS) lightProps.push(`  --callout-icon: ${iconCSS};`);
		lightProps.push(...this.bgProps(def, "light"));
		parts.push(
			`.callout[data-callout="${def.id}"] {\n${lightProps.join("\n")}\n}`,
		);

		// Dark mode override
		if (this.needsDarkBlock(def)) {
			const darkProps: string[] = [
				`  --callout-color: ${calloutColorValue(def.colorDark)};`,
				`  --cs-color-rgb: ${darkRgb};`,
			];
			darkProps.push(...this.bgProps(def, "dark"));
			parts.push(
				`.theme-dark .callout[data-callout="${def.id}"] {\n${darkProps.join("\n")}\n}`,
			);
		}

		// Content text color overrides
		if (def.textColorLight) {
			parts.push(
				`.callout[data-callout="${def.id}"] > .callout-content {\n` +
					`  color: ${def.textColorLight};\n` +
					`}`,
			);
		}
		if (def.textColorDark && def.textColorDark !== def.textColorLight) {
			parts.push(
				`.theme-dark .callout[data-callout="${def.id}"] > .callout-content {\n` +
					`  color: ${def.textColorDark};\n` +
					`}`,
			);
		}

		// Material icon SVG override (uses mask-image with cached SVG data URI).
		// This drives the *live* (Reading view / Live Preview) rendering. A
		// hidden DOM copy is also baked in by paintIcons for PDF export, where
		// this adopted stylesheet is dropped.
		if (def.icon.type === "material") {
			const cached = this.registry.findMaterialSvg(
				def.icon.value,
				def.icon.style ?? "outlined",
				def.icon.weight ?? 400,
			);
			if (cached) {
				parts.push(
					this.generateMaterialSvgOverride(def.id, cached.svg),
				);
			}
		}

		// Emoji icon override (renders the glyph via ::after) for live view.
		if (def.icon.type === "emoji") {
			parts.push(this.generateEmojiOverride(def.id, def.icon.value));
		}

		// Icon position/size transform
		const iconTransform = this.getIconTransformCSS(def);
		if (iconTransform) {
			parts.push(iconTransform);
		}

		// Gradient title text, when the palette opted in. Scoped to
		// .callout-title-inner (which hugs the title) rather than the
		// full-width .callout-title, so the sweep spans the words themselves;
		// the sibling .callout-icon is outside it and stays solid. The
		// callout's background lives on the .callout root, not here.
		parts.push(
			...this.textSweepRules(
				def,
				(themePrefix) =>
					[def.id, ...(def.aliases ?? [])]
						.map(
							(id) =>
								`${themePrefix}.callout[data-callout="${id}"] > ` +
								`.callout-title > .callout-title-inner`,
						)
						.join(",\n"),
				false,
			),
		);

		// Heading-bar / inline-pill colors for this callout (both surfaces).
		parts.push(this.generateTokenColorCSS(def));

		// Fold chevron in the palette's second color (gradients only).
		const foldCSS = this.generateFoldArrowCSS(def);
		if (foldCSS) parts.push(foldCSS);

		// PDF-export repaint of the background gradient (covers aliases too):
		// Preview/CoreGraphics truncates the vector shading Chromium prints,
		// so print rasterizes the sweep on a ::before — see printGradientCSS.
		const calloutPrint = this.printGradientCSS(
			def,
			(themePrefix, suffix) =>
				[def.id, ...(def.aliases ?? [])]
					.map(
						(id) =>
							`${themePrefix}.callout[data-callout="${id}"]${suffix}`,
					)
					.join(",\n"),
			false,
		);
		if (calloutPrint) parts.push(calloutPrint);

		// Generate alias selectors that reference the same styles
		if (def.aliases && def.aliases.length > 0) {
			for (const alias of def.aliases) {
				parts.push(
					`/* alias: ${alias} → ${def.id} */\n` +
						`.callout[data-callout="${alias}"] {\n${lightProps.join("\n")}\n}`,
				);
				if (this.needsDarkBlock(def)) {
					const aliasDarkProps: string[] = [
						`  --callout-color: ${calloutColorValue(def.colorDark)};`,
						`  --cs-color-rgb: ${darkRgb};`,
					];
					aliasDarkProps.push(...this.bgProps(def, "dark"));
					parts.push(
						`.theme-dark .callout[data-callout="${alias}"] {\n${aliasDarkProps.join("\n")}\n}`,
					);
				}
				if (def.textColorLight) {
					parts.push(
						`.callout[data-callout="${alias}"] > .callout-content {\n  color: ${def.textColorLight};\n}`,
					);
				}
				if (
					def.textColorDark &&
					def.textColorDark !== def.textColorLight
				) {
					parts.push(
						`.theme-dark .callout[data-callout="${alias}"] > .callout-content {\n  color: ${def.textColorDark};\n}`,
					);
				}
				if (def.icon.type === "material") {
					const cachedAlias = this.registry.findMaterialSvg(
						def.icon.value,
						def.icon.style ?? "outlined",
						def.icon.weight ?? 400,
					);
					if (cachedAlias) {
						parts.push(
							this.generateMaterialSvgOverride(
								alias,
								cachedAlias.svg,
							),
						);
					}
				}
				if (def.icon.type === "emoji") {
					parts.push(
						this.generateEmojiOverride(alias, def.icon.value),
					);
				}
				const aliasTransform = this.getIconTransformCSS({
					...def,
					id: alias,
				});
				if (aliasTransform) {
					parts.push(aliasTransform);
				}
			}
		}

		return parts.join("\n\n");
	}

	/**
	 * Fold-chevron color for gradient palettes, across both foldable roles: the
	 * regular callout's disclosure arrow and the heading callout's chevron (the
	 * Live Preview widget and, in reading view, Obsidian's own collapse
	 * indicator). All three default to the accent color — where the palette's
	 * sweep STARTS — so they take the second color instead and the arrow closes
	 * the sweep the title opens.
	 *
	 * Gated on the `textGradient` (Gradient title text) option: the recoloring
	 * exists to echo the title's own sweep, so with that option off there is no
	 * title sweep to close and the arrow keeps the default accent color. This
	 * matches where the title sweep itself is honored (`textGradientCss`,
	 * `applyTitleGradient`), both of which also require `textGradient`.
	 *
	 * Uses the accent-strength second color (`textToColor*`), never the pale
	 * `toColor*` tints: those are the background's own end stop, and an arrow
	 * painted in one would disappear into the corner it sits on. Gradients
	 * carrying no accent-strength pair (pre-text-sweep or imported data) keep the
	 * accent-colored arrow rather than risking an invisible one.
	 *
	 * Empty when the def has no gradient or the title sweep is off — the
	 * styles.css defaults then stand.
	 */
	private generateFoldArrowCSS(def: CalloutDefinition): string {
		const g = def.bgGradient;
		if (!g?.textGradient) return "";
		const light = g.textToColorLight;
		if (!light) return "";
		const dark = g.textToColorDark ?? light;
		const ids = [def.id, ...(def.aliases ?? [])];

		const selectorsFor = (themePrefix: string): string =>
			ids
				.map(
					(id) =>
						`${themePrefix}.callout[data-callout="${id}"] > ` +
						`.callout-title > .callout-fold, ` +
						`${themePrefix}.${CSS_HEADING_LINE}[data-callout="${id}"] ` +
						`.${CSS_FOLD_ARROW}, ` +
						`${themePrefix}.${CSS_HEADING_LINE}[data-callout="${id}"] ` +
						`.heading-collapse-indicator`,
				)
				.join(",\n");

		// The chevrons are `currentColor` SVGs, so `color` alone repaints them.
		// Same explicit-undefined cascade as the background rules: the light rule
		// is left unscoped so it keeps applying in dark mode when the gradient has
		// no dark-specific end, and an identical dark rule is skipped as a no-op.
		const parts = [`${selectorsFor("")} {\n  color: ${light};\n}`];
		if (dark !== light) {
			parts.push(`${selectorsFor(".theme-dark ")} {\n  color: ${dark};\n}`);
		}
		return parts.join("\n\n");
	}

	/**
	 * Per-callout accent color for the heading-bar and inline-pill DOM.
	 * The structural rules (layout, radius, background alpha) are static in
	 * styles.css; only `--cs-color-rgb` is per-callout. Covers the main id
	 * and every alias in one selector list.
	 */
	private generateTokenColorCSS(def: CalloutDefinition): string {
		const lightRgb = hexToRgbString(def.colorLight);
		const darkRgb = hexToRgbString(def.colorDark);
		const ids = [def.id, ...(def.aliases ?? [])];

		const selectorsFor = (themePrefix: string): string =>
			ids
				.map(
					(id) =>
						`${themePrefix}.${CSS_INLINE_TOKEN}[data-callout="${id}"], ` +
						`${themePrefix}.${CSS_HEADING_LINE}[data-callout="${id}"], ` +
						`${themePrefix}.${CSS_REF_TOKEN}[data-callout="${id}"]`,
				)
				.join(",\n");

		const parts: string[] = [
			`${selectorsFor("")} {\n  --cs-color-rgb: ${lightRgb};\n}`,
		];
		if (def.colorLight !== def.colorDark) {
			parts.push(
				`${selectorsFor(".theme-dark ")} {\n  --cs-color-rgb: ${darkRgb};\n}`,
			);
		}

		// The callout's background — solid color OR gradient — is applied to
		// heading bars and inline pills too, so all three render roles share the
		// exact same background. bgProps emits nothing when the def has no custom
		// bg, leaving those roles on the static accent tint from styles.css as
		// their default; ref tokens are bare icons with no surface to paint. The
		// [data-callout] attribute outranks the styles.css tint rule (2 selectors
		// vs 1), so no !important is needed.
		const bgSelectorsFor = (themePrefix: string): string =>
			ids
				.map(
					(id) =>
						`${themePrefix}.${CSS_INLINE_TOKEN}[data-callout="${id}"], ` +
						`${themePrefix}.${CSS_HEADING_LINE}[data-callout="${id}"]`,
				)
				.join(",\n");
		const lightBg = this.bgProps(def, "light");
		if (lightBg.length > 0) {
			parts.push(`${bgSelectorsFor("")} {\n${lightBg.join("\n")}\n}`);
		}
		const darkBg = this.bgProps(def, "dark");
		// Same explicit-undefined cascade as regular callouts: no dark bg set →
		// the light rule (unscoped, so it matches both themes) keeps applying in
		// dark mode; identical dark values → skip the no-op.
		if (darkBg.length > 0 && darkBg.join("") !== lightBg.join("")) {
			parts.push(
				`${bgSelectorsFor(".theme-dark ")} {\n${darkBg.join("\n")}\n}`,
			);
		}
		// Only gradient backgrounds need the PDF-export ::before repaint; the
		// method returns "" for solid backgrounds. The pill also hides its own
		// gradient in print (inline boxes print in the end color), the heading
		// bar keeps its as a fragmentation fallback — see printGradientCSS.
		const pillPrint = this.printGradientCSS(
			def,
			(themePrefix, suffix) =>
				ids
					.map(
						(id) =>
							`${themePrefix}.${CSS_INLINE_TOKEN}[data-callout="${id}"]${suffix}`,
					)
					.join(",\n"),
			true,
		);
		if (pillPrint) parts.push(pillPrint);
		const headingPrint = this.printGradientCSS(
			def,
			(themePrefix, suffix) =>
				ids
					.map(
						(id) =>
							`${themePrefix}.${CSS_HEADING_LINE}[data-callout="${id}"]${suffix}`,
					)
					.join(",\n"),
			false,
		);
		if (headingPrint) parts.push(headingPrint);

		// Gradient title text for the inline pill: ONE sweep on the pill root,
		// which hugs its own content, so the gradient runs edge to edge across
		// the pill. It carries the background layer, so that layer is restated
		// underneath. The class is repeated to reach 3 selectors, outranking
		// the bg rules above (2). Ref tokens are bare icons — nothing to sweep.
		parts.push(
			...this.textSweepRules(
				def,
				(themePrefix) =>
					ids
						.map(
							(id) =>
								`${themePrefix}.${CSS_INLINE_TOKEN}.${CSS_INLINE_TOKEN}[data-callout="${id}"]`,
						)
						.join(",\n"),
				true,
			),
		);

		// Gradient title text for the heading bar. The bar is a full-width
		// block, so sweeping it directly would stretch the gradient across the
		// whole line and leave the text showing only its opening slice —
		// instead each of the two text runs a bar can hold is swept on its own
		// hugging inline box, and the gradient lands its end color on the last
		// letter. The two are mutually exclusive: the token drops its name as
		// soon as the heading has a title of its own (`showName: !hasTitle`),
		// so only ever one of these rules paints, and the sweep never restarts
		// mid-bar. Neither element carries the bar's background.
		const headingTextSelectors = (themePrefix: string): string =>
			ids
				.map(
					(id) =>
						`${themePrefix}.${CSS_HEADING_LINE}[data-callout="${id}"] .${CSS_HEADING_TITLE},\n` +
						`${themePrefix}.${CSS_HEADING_TOKEN}[data-callout="${id}"] > .${CSS_TOKEN_NAME}`,
				)
				.join(",\n");
		parts.push(...this.textSweepRules(def, headingTextSelectors, false));

		return parts.join("\n\n");
	}

	/**
	 * PDF-export repaint of a background gradient, for every render role.
	 *
	 * Two print-pipeline problems force this, both invisible on screen:
	 *
	 * 1. Chromium resolves a degenerate gradient box for a gradient
	 *    `background-image` on an inline-level box (the pill is
	 *    `inline-flex`) and paints the whole pill in the gradient's END
	 *    color. Moving the gradient to an absolutely-positioned `::before` —
	 *    a block box with well-defined geometry — sidesteps that.
	 * 2. On ANY box, Chromium writes the gradient into the PDF as a vector
	 *    axial shading, which macOS CoreGraphics (Preview, Quick Look)
	 *    renders truncated: only about the first half of the ramp shows, so
	 *    pale sweeps collapse into a near-uniform start color. The
	 *    `filter: opacity(0.999)` is the fix — a filter cannot be expressed
	 *    in PDF vector operators, so Chromium rasterizes the `::before` and
	 *    the bitmap renders identically in every viewer. The value is not a
	 *    no-op, so the filter can't be optimized away, yet the alpha change
	 *    is invisible; text is above the `::before` and stays vector.
	 *
	 * `hideElementGradient` drops the element's own `background-image` in
	 * print: required for the pill (problem 1 paints it in the end color
	 * otherwise); left off for block roles (regular callout, heading bar) so
	 * a callout fragmented across pages keeps at least the vector gradient
	 * where the `::before` doesn't reach. The `background-color` (first
	 * stop) always stays on the element as the fallback. Empty when the mode
	 * has no bg color (then there is no gradient on screen either).
	 */
	private printGradientCSS(
		def: CalloutDefinition,
		selFor: (themePrefix: string, suffix: string) => string,
		hideElementGradient: boolean,
	): string {
		const light = this.bgImageFor(def, "light");
		if (!light) return "";
		const beforeProps = (image: string): string =>
			`  content: "";\n` +
			`  position: absolute;\n` +
			`  inset: 0;\n` +
			`  z-index: -1;\n` +
			`  border-radius: inherit;\n` +
			`  background-image: ${image};\n` +
			`  filter: opacity(0.999);\n` +
			`  -webkit-print-color-adjust: exact;\n` +
			`  print-color-adjust: exact;`;
		// z-index: 0 scopes the ::before's -1 to the element's own stacking
		// context, so it sits above the background-color but under text and
		// icon. Both theme prefixes are grouped so this later rule wins over
		// the screen bg rules in either mode; the ::before then follows the
		// usual explicit-undefined cascade (unscoped light rule, dark
		// override only when the gradient differs).
		const hostProps = [
			...(hideElementGradient ? ["  background-image: none;"] : []),
			"  position: relative;",
			"  z-index: 0;",
		].join("\n");
		const rules = [
			`${selFor("", "")},\n${selFor(".theme-dark ", "")} {\n${hostProps}\n}`,
			`${selFor("", "::before")} {\n${beforeProps(light.image)}\n}`,
		];
		const dark = this.bgImageFor(def, "dark");
		if (dark && dark.image !== light.image) {
			rules.push(
				`${selFor(".theme-dark ", "::before")} {\n${beforeProps(dark.image)}\n}`,
			);
		}
		return `@media print {\n${rules.join("\n\n")}\n}`;
	}

	private getIconTransformCSS(def: CalloutDefinition): string {
		const ox = def.iconOffsetX ?? 0;
		const oy = def.iconOffsetY ?? 0;
		const scale = def.iconSize ?? 1;
		if (ox === 0 && oy === 0 && scale === 1) return "";

		const buildTransform = (extraY?: string): string => {
			const transforms: string[] = [];
			if (ox !== 0 || oy !== 0 || extraY) {
				const y = extraY ? `calc(${oy}px + ${extraY})` : `${oy}px`;
				transforms.push(`translate(${ox}px, ${y})`);
			}
			if (scale !== 1) transforms.push(`scale(${scale})`);
			return transforms.join(" ");
		};

		// The adjustment applies to every surface the callout's icon renders
		// on: the regular callout title, the heading-bar token, and the inline
		// pill (ref tokens in outline/links stay untouched — they are too
		// small for pixel offsets to make sense). The heading token also
		// bakes in the static default optical nudge from styles.css
		// (--cs-heading-icon-offset) — this rule has higher specificity than
		// that default and would otherwise silently cancel it out the moment
		// the user touches any offset/scale slider.
		const baseSelectors = [
			`.callout[data-callout="${def.id}"] > .callout-title > .callout-icon`,
			`.${CSS_INLINE_TOKEN}[data-callout="${def.id}"] > .${CSS_TOKEN_ICON}`,
		];
		const headingSelector = `.${CSS_HEADING_TOKEN}[data-callout="${def.id}"] > .${CSS_TOKEN_ICON}`;

		const parts: string[] = [
			`${headingSelector} {\n` +
				`  transform: ${buildTransform("var(--cs-heading-icon-offset, 0.06em)")};\n` +
				`  transform-origin: center;\n` +
				`}`,
		];
		const baseTransform = buildTransform();
		if (baseTransform) {
			parts.unshift(
				`${baseSelectors.join(",\n")} {\n` +
					`  transform: ${baseTransform};\n` +
					`  transform-origin: center;\n` +
					`}`,
			);
		}
		return parts.join("\n\n");
	}

	private getIconCSS(def: CalloutDefinition): string {
		switch (def.icon.type) {
			case "lucide":
				// getIconIds() already returns IDs with the "lucide-" prefix
				return def.icon.value;
			case "material":
			case "emoji":
				// Use a valid Lucide id as the placeholder --callout-icon so
				// Obsidian always renders *something* at first paint. The real
				// glyph is then painted into the DOM by paintIcons (which also
				// makes it survive PDF export).
				return `lucide-pencil`;
			default:
				return "";
		}
	}

	/**
	 * Generates CSS that renders a Material icon via a mask-image ::after, for
	 * the live (Reading view / Live Preview) rendering. Wrapped in `@media screen`
	 * so it does NOT apply to PDF export (print media): there, the inline-SVG copy
	 * baked into the DOM by paintIcons is shown instead, which is far more
	 * reliable in Chromium's print pipeline than a CSS mask.
	 */
	private generateMaterialSvgOverride(
		calloutId: string,
		svg: string,
	): string {
		const dataUri = svgToDataUri(svg);
		return (
			`@media screen {\n` +
			`.callout[data-callout="${calloutId}"] > .callout-title > .callout-icon > svg {\n` +
			`  display: none;\n` +
			`}\n` +
			`.callout[data-callout="${calloutId}"] > .callout-title > .callout-icon::after {\n` +
			`  content: "";\n` +
			`  display: inline-block;\n` +
			`  width: var(--icon-size, 1.2em);\n` +
			`  height: var(--icon-size, 1.2em);\n` +
			`  -webkit-mask-image: ${dataUri};\n` +
			`  mask-image: ${dataUri};\n` +
			`  -webkit-mask-size: contain;\n` +
			`  mask-size: contain;\n` +
			`  -webkit-mask-repeat: no-repeat;\n` +
			`  mask-repeat: no-repeat;\n` +
			`  background-color: rgb(var(--cs-color-rgb));\n` +
			`}\n` +
			`}`
		);
	}

	/**
	 * Generates CSS that renders an emoji glyph via the icon element's ::after,
	 * for live view. Wrapped in `@media screen` so it does not apply to PDF export
	 * (print): there the DOM <span> baked by paintIcons is shown instead. Emojis
	 * keep their own colors, so no mask/background-color is applied.
	 */
	private generateEmojiOverride(calloutId: string, emoji: string): string {
		// Defensive escaping for the CSS string literal (emojis contain neither
		// backslashes nor quotes, but keep it safe against future data changes).
		const safe = emoji.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		return (
			`@media screen {\n` +
			`.callout[data-callout="${calloutId}"] > .callout-title > .callout-icon > svg {\n` +
			`  display: none;\n` +
			`}\n` +
			`.callout[data-callout="${calloutId}"] > .callout-title > .callout-icon::after {\n` +
			`  content: "${safe}";\n` +
			`  display: inline-block;\n` +
			`  font-size: var(--icon-size, 1.2em);\n` +
			`  line-height: 1;\n` +
			`}\n` +
			`}`
		);
	}

	private updateMaterialFontLinks(needed: Set<string>): void {
		for (const style of needed) {
			if (
				style === "outlined" ||
				style === "rounded" ||
				style === "sharp" ||
				style === "filled"
			) {
				void ensureMaterialFontLoaded(style);
			}
		}
	}

	/**
	 * Walk rendered callouts and (re)apply DOM-level icon work.
	 *
	 * For Lucide this keeps the visible SVG in sync after edits. For material and
	 * emoji it bakes a *hidden* self-contained copy of the icon (see paintIcon)
	 * that only appears in Obsidian's PDF export clone, where our adopted
	 * stylesheet — and thus the CSS that draws the live icon — is dropped.
	 *
	 * `root` may be the document (full sweep, on inject), a rendered container
	 * (from a markdown post-processor), or a single callout element.
	 */
	paintIcons(root: ParentNode = activeDocument): void {
		const calloutEls: HTMLElement[] = [];
		// A post-processor can hand us the callout element itself.
		if (
			(root as Element).nodeType === 1 &&
			(root as Element).matches(".callout[data-callout]")
		) {
			calloutEls.push(root as HTMLElement);
		}
		calloutEls.push(
			...Array.from(
				root.querySelectorAll<HTMLElement>(".callout[data-callout]"),
			),
		);

		for (const calloutEl of calloutEls) {
			const id = calloutEl.getAttribute("data-callout");
			if (!id) continue;
			const def = this.resolveDef(id);
			if (!def) continue;
			const iconEl = calloutEl.querySelector<HTMLElement>(
				".callout-title .callout-icon",
			);
			if (iconEl) this.paintIcon(iconEl, def);
			// Per-grapheme print colors for a gradient title (PDF export
			// support — see gradientTitleText.ts).
			const titleInner = calloutEl.querySelector<HTMLElement>(
				".callout-title .callout-title-inner",
			);
			if (titleInner) this.syncTitleGradient(titleInner, def);
		}

		// Heading-bar title spans: reading view wraps the heading's own
		// title in .cs-heading-title (see calloutPostProcessor), the element
		// the title sweep runs on. Live Preview heading bars are CodeMirror's
		// own .cm-line DOM — its text nodes must never be rewrapped (CM owns
		// them, and Live Preview never reaches PDF export anyway). Unknown
		// ids get no sweep CSS, so they must not get print colors either.
		const headingEls = root.querySelectorAll<HTMLElement>(
			`.${CSS_HEADING_LINE}[data-callout]`,
		);
		for (const headingEl of Array.from(headingEls)) {
			if (headingEl.classList.contains("cm-line")) continue;
			const id = headingEl.getAttribute("data-callout");
			if (!id) continue;
			const { def, unknown } = resolveCalloutDef(this.registry, id);
			if (!def || unknown) continue;
			const titleEl = headingEl.querySelector<HTMLElement>(
				`.${CSS_HEADING_TITLE}`,
			);
			if (titleEl) this.syncTitleGradient(titleEl, def);
		}

		// Heading/inline token DOM (Live Preview widgets and reading-view
		// pills share these classes; see renderShared.buildCalloutTokenDom).
		// Keeps icons and display names in sync after definition edits and
		// after Material SVG downloads complete.
		const tokenEls = root.querySelectorAll<HTMLElement>(
			`.${CSS_INLINE_TOKEN}[data-callout], .${CSS_HEADING_TOKEN}[data-callout]`,
		);
		for (const tokenEl of Array.from(tokenEls)) {
			this.paintTokenEl(tokenEl);
		}
	}

	/** Repaint one heading/inline token's icon (and name, for known ids). */
	private paintTokenEl(tokenEl: HTMLElement): void {
		const id = tokenEl.getAttribute("data-callout");
		if (!id) return;
		const { def, unknown } = resolveCalloutDef(this.registry, id);
		if (!def) return;
		const iconEl = tokenEl.querySelector<HTMLElement>(
			`.${CSS_TOKEN_ICON}`,
		);
		if (iconEl) paintRoleIcon(iconEl, def, this.registry);
		const nameEl = tokenEl.querySelector<HTMLElement>(`.${CSS_TOKEN_NAME}`);
		if (!nameEl) return;
		// Unknown tokens keep showing the raw id the user typed. (The
		// comparison reads through any char spans — textContent concatenates
		// descendants — while a real rename rewrites the node and strips
		// them, which is why the gradient sync below runs after it.)
		if (!unknown && nameEl.textContent !== def.displayName) {
			nameEl.textContent = def.displayName;
		}
		// Per-grapheme print colors for the swept name (PDF export — see
		// gradientTitleText.ts). The pill root carries the sweep but its name
		// holds the text; the heading token sweeps its name directly. Unknown
		// ids get no sweep CSS, so they must not get print colors either.
		if (unknown) {
			clearGradientChars(nameEl);
		} else {
			this.syncTitleGradient(nameEl, def);
		}
	}

	/** Per-grapheme PDF-export colors for one swept title (see
	 * gradientTitleText.applyTitleGradient, shared with the reading
	 * post-processor). */
	private syncTitleGradient(el: HTMLElement, def: CalloutDefinition): void {
		applyTitleGradient(el, def);
	}

	/**
	 * Resolve a callout id to its definition: direct id, then alias, then the
	 * configured fallback callout (so unknown ids paint the fallback icon, the
	 * DOM equivalent of generateFallbackCSS).
	 */
	private resolveDef(id: string): CalloutDefinition | undefined {
		return (
			this.registry.get(id) ??
			this.registry.findByAlias(id) ??
			this.registry.get(this.registry.settings.fallbackCalloutId)
		);
	}

	/**
	 * Prepare a `.callout-icon` for PDF export.
	 *
	 * Live view (Reading view / Live Preview = screen media) renders material/emoji
	 * via CSS `::after` (see generateMaterialSvgOverride/generateEmojiOverride),
	 * which we wrap in `@media screen`. Here we bake a self-contained, concretely
	 * coloured copy of the icon into the DOM. The hide rules are screen-only, so in
	 * PDF export (print media) those CSS icons disappear and this DOM copy becomes
	 * the visible icon — an inline SVG / text node renders far more reliably in
	 * Chromium's print pipeline than a CSS mask, and carries its own colour.
	 *
	 * Lucide icons are visible DOM SVGs and already survive export, so they are
	 * painted normally.
	 */
	private paintIcon(iconEl: HTMLElement, def: CalloutDefinition): void {
		switch (def.icon.type) {
			case "lucide":
				// Visible icon; works in PDF natively. setIcon is an Obsidian
				// helper — guard against an export realm where it is unavailable.
				try {
					setIcon(iconEl, def.icon.value);
				} catch {
					/* leave Obsidian's own rendering in place */
				}
				break;
			case "material":
				this.bakeMaterialExportIcon(iconEl, def);
				break;
			case "emoji":
				this.bakeEmojiExportIcon(
					iconEl,
					def.icon.value,
					iconEl.ownerDocument,
				);
				break;
		}
	}

	/**
	 * Bake a hidden, self-contained Material SVG copy as a DOM-level fallback for
	 * export paths that carry the rendered DOM but not our CSS. The callout color
	 * is baked as an **inline style with `!important`** on the root and every
	 * shape — a presentation `fill` attribute would lose to core/theme CSS (which
	 * colors the icon via `currentColor` → `--callout-color`, defaulting to blue
	 * in an export that lacks our stylesheet), whereas an inline `!important`
	 * declaration outranks any selector rule. Native DOM only, for realm safety.
	 *
	 * If the SVG is not cached yet, leaves Obsidian's pencil placeholder; the
	 * download later triggers a re-inject which repaints.
	 */
	private bakeMaterialExportIcon(
		iconEl: HTMLElement,
		def: CalloutDefinition,
	): void {
		if (def.icon.type !== "material") return;
		const cached = this.registry.findMaterialSvg(
			def.icon.value,
			def.icon.style ?? "outlined",
			def.icon.weight ?? 400,
		);
		if (!cached) return; // leave pencil placeholder; repaint on download
		const doc = iconEl.ownerDocument;
		const parsed = new DOMParser().parseFromString(
			cached.svg,
			"image/svg+xml",
		);
		const svgEl = parsed.documentElement;
		if (
			parsed.querySelector("parsererror") ||
			svgEl.nodeName.toLowerCase() !== "svg"
		) {
			return;
		}
		const imported = doc.importNode(svgEl, true);
		imported.classList.add("cs-export-icon");
		const isDark = doc.body?.classList.contains("theme-dark") ?? false;
		const color = isDark ? def.colorDark : def.colorLight;
		// Root: size + color (inline !important beats core/theme CSS).
		imported.setAttribute(
			"style",
			`width:var(--icon-size, 1.2em);height:var(--icon-size, 1.2em);fill:${color} !important`,
		);
		// Every shape: inline !important fill so a core rule targeting paths
		// directly can't override it.
		for (const shape of Array.from(
			imported.querySelectorAll(
				"path, circle, rect, polygon, ellipse, line, polyline, g",
			),
		)) {
			shape.setAttribute("style", `fill:${color} !important`);
		}
		// Replaces Obsidian's pencil <svg> (and any prior copy) with our hidden one.
		iconEl.replaceChildren(imported);
	}

	/**
	 * Bake a hidden emoji copy (self-colored) for PDF export. Uses textContent,
	 * never innerHTML, since the emoji is untrusted data; native DOM only.
	 * Sizing comes from the `span.cs-export-icon` rule injected in inject(),
	 * which ships in the <style> element Obsidian honors during PDF export.
	 */
	private bakeEmojiExportIcon(
		iconEl: HTMLElement,
		emoji: string,
		doc: Document,
	): void {
		const span = doc.createEl("span");
		span.classList.add("cs-export-icon");
		span.textContent = emoji;
		iconEl.replaceChildren(span);
	}

	scheduleInject(): void {
		if (this.debounceTimer !== null) {
			window.clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = window.setTimeout(() => {
			this.inject();
			this.debounceTimer = null;
		}, DEBOUNCE_MS);
	}

	private generateGlobalStyleCSS(): string {
		const gs = this.registry.settings.globalStyle;
		const parts: string[] = ["/* Global callout style */"];

		const props: string[] = [];

		if (gs.borderRadius !== 4) {
			props.push(`  border-radius: ${gs.borderRadius}px;`);
		}

		// Border sides
		const { top, right, bottom, left } = gs.borderSides;
		const allSides = top && right && bottom && left;
		const anySide = top || right || bottom || left;
		const bStyle = `${gs.borderWidth}px solid rgba(var(--cs-color-rgb), 0.45)`;

		if (allSides) {
			props.push(`  border: ${bStyle};`);
		} else if (anySide) {
			// Reset any default border first
			props.push(`  border: none;`);
			if (top) props.push(`  border-top: ${bStyle};`);
			if (right) props.push(`  border-right: ${bStyle};`);
			if (bottom) props.push(`  border-bottom: ${bStyle};`);
			if (left) props.push(`  border-left: ${bStyle};`);
		}

		if (props.length > 0) {
			parts.push(`.callout {\n${props.join("\n")}\n}`);
		}

		// Title scale
		if (gs.titleScale !== 1) {
			parts.push(
				`.callout > .callout-title > .callout-title-inner {\n` +
					`  font-size: ${gs.titleScale}em;\n` +
					`}`,
			);
		}

		// Content scale
		if (gs.contentScale !== 1) {
			parts.push(
				`.callout > .callout-content {\n` +
					`  font-size: ${gs.contentScale}em;\n` +
					`}`,
			);
		}

		// Indent the body so it lines up under the title text (icon width +
		// title gap) instead of under the icon. Logical property keeps it
		// correct in RTL; written to both adoptedStyleSheets and the <style>
		// element so it applies in Reading view, Live Preview, and PDF export.
		if (gs.alignContentWithTitle) {
			parts.push(
				`.callout > .callout-content {\n` +
					`  padding-inline-start: calc(var(--icon-size, 1.2em) + 0.2em);\n` +
					`}`,
			);
		}

		// Heading-bar frame. Borders are drawn directly; radius and vertical
		// text spacing go through CSS variables consumed by the static
		// .cs-heading-callout rule in styles.css (whose fallbacks are the
		// defaults, so nothing is emitted while a value is untouched).
		const headingProps = this.roleBorderProps(gs.heading);
		if (gs.heading.borderRadius !== 4) {
			headingProps.push(
				`  --cs-heading-radius: ${gs.heading.borderRadius}px;`,
			);
		}
		if (gs.heading.paddingTop !== 0.25) {
			headingProps.push(
				`  --cs-heading-pad-top: ${gs.heading.paddingTop}em;`,
			);
		}
		if (gs.heading.paddingBottom !== 0.25) {
			headingProps.push(
				`  --cs-heading-pad-bottom: ${gs.heading.paddingBottom}em;`,
			);
		}
		if (gs.heading.paddingStart !== 10) {
			headingProps.push(
				`  --cs-heading-pad-start: ${gs.heading.paddingStart}px;`,
			);
		}
		// Gap above the bar (the outer margin, reading view only — see the
		// static .cs-heading-callout:not(.cm-line) rule in styles.css; Live
		// Preview gets the same visual effect from HeadingGapWidget, a real
		// block-level DOM node, since a margin can't safely reach .cm-line).
		// Rides this same variable-then-static-fallback rule as its siblings
		// above so the default (0) is an explicit, enforced value rather than
		// "whatever the theme's own heading margin happens to be".
		if (gs.heading.marginTop !== 0) {
			headingProps.push(
				`  --cs-heading-gap-top: ${gs.heading.marginTop}em;`,
			);
		}
		if (headingProps.length > 0) {
			parts.push(
				`.${CSS_HEADING_LINE} {\n${headingProps.join("\n")}\n}`,
			);
		}

		// Inline-pill frame. Radius 16px ≈ the default 1em pill shape, so the
		// static rule's fallback keeps the classic pill until the user moves it.
		const inlineProps = this.roleBorderProps(gs.inline);
		if (gs.inline.borderRadius !== 16) {
			inlineProps.push(
				`  --cs-inline-radius: ${gs.inline.borderRadius}px;`,
			);
		}
		if (gs.inline.fontScale !== 1) {
			inlineProps.push(`  --cs-inline-scale: ${gs.inline.fontScale};`);
		}
		if (inlineProps.length > 0) {
			parts.push(`.${CSS_INLINE_TOKEN} {\n${inlineProps.join("\n")}\n}`);
		}

		return parts.join("\n\n");
	}

	/**
	 * Border declarations for a role frame (heading bar / inline pill),
	 * mirroring the regular-callout border logic: tinted by the element's own
	 * per-callout accent (--cs-color-rgb). Empty when no side is enabled.
	 */
	private roleBorderProps(frame: {
		borderSides: {
			top: boolean;
			right: boolean;
			bottom: boolean;
			left: boolean;
		};
		borderWidth: number;
	}): string[] {
		const { top, right, bottom, left } = frame.borderSides;
		const anySide = top || right || bottom || left;
		if (!anySide) return [];
		const bStyle = `${frame.borderWidth}px solid rgba(var(--cs-color-rgb, 68, 138, 255), 0.45)`;
		if (top && right && bottom && left) {
			return [`  border: ${bStyle};`];
		}
		const props: string[] = [`  border: none;`];
		if (top) props.push(`  border-top: ${bStyle};`);
		if (right) props.push(`  border-right: ${bStyle};`);
		if (bottom) props.push(`  border-bottom: ${bStyle};`);
		if (left) props.push(`  border-left: ${bStyle};`);
		return props;
	}

	/**
	 * Generates a CSS rule that applies the fallback callout's styles to any
	 * callout whose data-callout ID is not explicitly defined.
	 * Uses `:not()` selectors to exclude all known IDs/aliases.
	 */
	private generateFallbackCSS(callouts: CalloutDefinition[]): string {
		const fallbackId = this.registry.settings.fallbackCalloutId;
		if (!fallbackId) return "";

		const fallbackDef = callouts.find((c) => c.id === fallbackId);
		if (!fallbackDef) return "";

		// Collect all known callout IDs and aliases. The transient settings-
		// preview definition is registered under its real ID, so it is already
		// included here and thus excluded from the fallback tint.
		const knownIds: string[] = [];
		for (const def of callouts) {
			knownIds.push(def.id);
			if (def.aliases) knownIds.push(...def.aliases);
		}

		const notSelectors = knownIds
			.map((id) => `:not([data-callout="${id}"])`)
			.join("");

		const lightRgb = hexToRgbString(fallbackDef.colorLight);
		const darkRgb = hexToRgbString(fallbackDef.colorDark);
		const iconCSS = this.getIconCSS(fallbackDef);

		const parts: string[] = [
			"/* Fallback callout style for unrecognized types */",
		];

		// Use `body` prefix + `!important` so the fallback wins over Obsidian's
		// built-in callout color/icon definitions.
		const lightProps: string[] = [
			`  --callout-color: ${calloutColorValue(fallbackDef.colorLight)} !important;`,
			`  --cs-color-rgb: ${lightRgb} !important;`,
		];
		if (iconCSS)
			lightProps.push(`  --callout-icon: ${iconCSS} !important;`);
		lightProps.push(...this.bgProps(fallbackDef, "light", true));
		parts.push(
			`body .callout${notSelectors} {\n${lightProps.join("\n")}\n}`,
		);

		if (this.needsDarkBlock(fallbackDef)) {
			const darkProps: string[] = [
				`  --callout-color: ${calloutColorValue(fallbackDef.colorDark)} !important;`,
				`  --cs-color-rgb: ${darkRgb} !important;`,
			];
			darkProps.push(...this.bgProps(fallbackDef, "dark", true));
			parts.push(
				`body.theme-dark .callout${notSelectors} {\n${darkProps.join("\n")}\n}`,
			);
		}

		if (fallbackDef.textColorLight) {
			parts.push(
				`body .callout${notSelectors} > .callout-content {\n  color: ${fallbackDef.textColorLight} !important;\n}`,
			);
		}
		if (
			fallbackDef.textColorDark &&
			fallbackDef.textColorDark !== fallbackDef.textColorLight
		) {
			parts.push(
				`body.theme-dark .callout${notSelectors} > .callout-content {\n  color: ${fallbackDef.textColorDark} !important;\n}`,
			);
		}

		// Material SVG icon override for fallback (live view; PDF uses the hidden
		// DOM copy baked by paintIcons via resolveDef).
		if (fallbackDef.icon.type === "material") {
			const cached = this.registry.findMaterialSvg(
				fallbackDef.icon.value,
				fallbackDef.icon.style ?? "outlined",
				fallbackDef.icon.weight ?? 400,
			);
			if (cached) {
				const dataUri = svgToDataUri(cached.svg);
				parts.push(
					`@media screen {\n` +
						`body .callout${notSelectors} > .callout-title > .callout-icon > svg {\n  display: none !important;\n}\n` +
						`body .callout${notSelectors} > .callout-title > .callout-icon::after {\n` +
						`  content: "";\n` +
						`  display: inline-block;\n` +
						`  width: var(--icon-size, 1.2em);\n` +
						`  height: var(--icon-size, 1.2em);\n` +
						`  -webkit-mask-image: ${dataUri} !important;\n` +
						`  mask-image: ${dataUri} !important;\n` +
						`  -webkit-mask-size: contain;\n` +
						`  mask-size: contain;\n` +
						`  -webkit-mask-repeat: no-repeat;\n` +
						`  mask-repeat: no-repeat;\n` +
						`  background-color: rgb(var(--cs-color-rgb)) !important;\n` +
						`}\n` +
						`}`,
				);
			}
		}

		// Emoji icon override for fallback (live view).
		if (fallbackDef.icon.type === "emoji") {
			const safe = fallbackDef.icon.value
				.replace(/\\/g, "\\\\")
				.replace(/"/g, '\\"');
			parts.push(
				`@media screen {\n` +
					`body .callout${notSelectors} > .callout-title > .callout-icon > svg {\n  display: none !important;\n}\n` +
					`body .callout${notSelectors} > .callout-title > .callout-icon::after {\n` +
					`  content: "${safe}";\n` +
					`  display: inline-block;\n` +
					`  font-size: var(--icon-size, 1.2em);\n` +
					`  line-height: 1;\n` +
					`}\n` +
					`}`,
			);
		}

		// Unknown heading/inline tokens: the token renderer tags unresolved ids
		// with .cs-unknown, so a plain class rule suffices — no :not() chain.
		parts.push(
			`.${CSS_INLINE_TOKEN}.${CSS_UNKNOWN}, .${CSS_HEADING_LINE}.${CSS_UNKNOWN}, .${CSS_REF_TOKEN}.${CSS_UNKNOWN} {\n  --cs-color-rgb: ${lightRgb};\n}`,
		);
		if (fallbackDef.colorLight !== fallbackDef.colorDark) {
			parts.push(
				`.theme-dark .${CSS_INLINE_TOKEN}.${CSS_UNKNOWN}, .theme-dark .${CSS_HEADING_LINE}.${CSS_UNKNOWN}, .theme-dark .${CSS_REF_TOKEN}.${CSS_UNKNOWN} {\n  --cs-color-rgb: ${darkRgb};\n}`,
			);
		}

		// Fallback background (solid OR gradient) on unknown heading bars /
		// inline pills, mirroring generateTokenColorCSS for registered ids so all
		// three roles share one background (ref tokens have no surface to paint).
		// The .cs-unknown class doubles the class count, so this outranks the
		// static styles.css tint without !important. bgProps emits nothing when
		// the fallback has no custom bg, leaving the static tint in place.
		const unknownBgSelectors = (themePrefix: string): string =>
			`${themePrefix}.${CSS_INLINE_TOKEN}.${CSS_UNKNOWN}, ` +
			`${themePrefix}.${CSS_HEADING_LINE}.${CSS_UNKNOWN}`;
		const unknownLightBg = this.bgProps(fallbackDef, "light");
		if (unknownLightBg.length > 0) {
			parts.push(
				`${unknownBgSelectors("")} {\n${unknownLightBg.join("\n")}\n}`,
			);
		}
		const unknownDarkBg = this.bgProps(fallbackDef, "dark");
		if (
			unknownDarkBg.length > 0 &&
			unknownDarkBg.join("") !== unknownLightBg.join("")
		) {
			parts.push(
				`${unknownBgSelectors(".theme-dark ")} {\n${unknownDarkBg.join("\n")}\n}`,
			);
		}
		// Only gradient backgrounds need the PDF-export ::before repaint; the
		// method returns "" for solid backgrounds. Mirrors the known-id calls:
		// pill hides its own gradient in print, block roles keep theirs.
		const unknownPillPrint = this.printGradientCSS(
			fallbackDef,
			(themePrefix, suffix) =>
				`${themePrefix}.${CSS_INLINE_TOKEN}.${CSS_UNKNOWN}${suffix}`,
			true,
		);
		if (unknownPillPrint) parts.push(unknownPillPrint);
		const unknownHeadingPrint = this.printGradientCSS(
			fallbackDef,
			(themePrefix, suffix) =>
				`${themePrefix}.${CSS_HEADING_LINE}.${CSS_UNKNOWN}${suffix}`,
			false,
		);
		if (unknownHeadingPrint) parts.push(unknownHeadingPrint);
		// Unknown regular callouts: the fallback tint carries the gradient too,
		// so it needs the same Preview-safe raster repaint. The selector mirrors
		// the fallback rules above (`body` prefix + :not() list).
		const unknownCalloutPrint = this.printGradientCSS(
			fallbackDef,
			(themePrefix, suffix) =>
				`body${themePrefix ? ".theme-dark" : ""} .callout${notSelectors}${suffix}`,
			false,
		);
		if (unknownCalloutPrint) parts.push(unknownCalloutPrint);

		return parts.join("\n\n");
	}

	destroy(): void {
		this.startupCache.destroy();
		if (this.debounceTimer !== null) {
			window.clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		const doc = this.styleDoc ?? activeDocument;
		if (this.styleSheet && "adoptedStyleSheets" in doc) {
			doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter(
				(sheet) => sheet !== this.styleSheet,
			);
			this.styleSheet = null;
			this.styleDoc = null;
		}
		const registryWindow = window as RegistryWindow;
		delete registryWindow[STYLE_SHEET_REGISTRY_KEY];

		this.styleEl?.remove();
		this.styleEl = null;
	}
}
