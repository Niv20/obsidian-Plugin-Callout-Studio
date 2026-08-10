/**
 * settings/PaletteEditorModal.ts — Create/edit a custom color palette.
 *
 * Modal opened from the "Saved color palettes" settings section. Two-column
 * body (same panel classes as the callout editor): options on the left, a
 * sticky live preview on the right. Default (simple) mode: the user picks ONE
 * base color and the full palette — light/dark accents, backgrounds, text —
 * is auto-derived with contrast correction (see derivePaletteFromColor). The
 * background style is a 2-way choice: solid or a two-stop linear gradient
 * (preset directions). For the gradient, the user picks one "second color"
 * whose light/dark tints are derived like the background's, and an
 * off-by-default toggle extends the sweep through the title text of all three
 * render roles. Resolves the palette (without id) on save, or null on
 * cancel/close.
 */
import { Modal, Setting, setIcon } from "obsidian";
import type { App, SliderComponent } from "obsidian";
import type { BgGradient, CalloutDefinition, CustomPalette } from "../types";
import {
	bgTintFor,
	contrastRatio,
	DEFAULT_BG_INTENSITY_GRADIENT,
	DEFAULT_BG_INTENSITY_SOLID,
	derivePaletteFromColor,
	inferOppositeModeColor,
	MAX_BG_COLOR_AMOUNT,
	MIN_BG_COLOR_AMOUNT,
	rotateHue,
	type DerivedPalette,
} from "../utils/colorUtils";
import {
	createColorSwatchInput,
	setContrastWarning,
} from "../ui/ColorSwatchInput";
import { LiveCalloutPreview } from "./LiveCalloutPreview";
import {
	dedupeColorName,
	normalizeName,
	suggestColorName,
} from "../utils/colorNames";
import { getObsidianPalettes, getExtraPalettes } from "../utils/colorPalettes";
import { t } from "../i18n";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import type { CSSInjector } from "../manager/CSSInjector";
import { applyModalChrome, removeModalChrome } from "./modalChrome";

export type PaletteEditorResult = Omit<CustomPalette, "id">;

/** Minimal plugin surface the palette editor needs to drive the live preview. */
interface PaletteEditorPlugin {
	app: App;
	registry: CalloutRegistry;
	cssInjector: CSSInjector;
}

/**
 * Reserved id for the stand-in callout this modal previews the palette on, in
 * the same spirit as GlobalStyleModal's `STYLE_DEMO_ID`. Registered only while
 * the modal is open; if a user callout ever occupies the same id, the preview
 * slot shadows and later restores it.
 *
 * Deliberately NOT `PREVIEW_PLACEHOLDER_ID`: the registry's preview slot feeds
 * `getAll()`, which is what CSSInjector generates from, and it never consults
 * the `isDemo` flag (that only keeps the row out of the settings lists). So
 * whatever id this demo takes gets globally restyled for as long as the modal
 * is open — and that placeholder is `example`, a shipped built-in present in
 * every vault, so every real `[!example]` in the vault used to flicker through
 * each intermediate palette as the sliders moved.
 */
const PALETTE_DEMO_ID = "palette-demo";

const DEFAULT_BASE_COLOR = "#448aff";
/** Keeps the name readable in the dropdown/list rows, which truncate past this. */
const MAX_NAME_LENGTH = 30;

/** The preset linear-gradient directions, clockwise from "to top" (0°). */
const GRADIENT_DIRECTIONS: { deg: number; icon: string }[] = [
	{ deg: 45, icon: "arrow-up-right" },
	{ deg: 90, icon: "arrow-right" },
	{ deg: 135, icon: "arrow-down-right" },
];
/** Top-left → bottom-right, the classic presentation-software default. */
const DEFAULT_GRADIENT_ANGLE = 135;
/** Hue offset for the auto-suggested gradient second color. */
const GRADIENT_HUE_SHIFT = 45;

/**
 * How the palette paints its background. `"none"` is not a third way of
 * colouring one — it is the absence of a background (`transparentBg`), which is
 * why it lives here rather than at the bottom of the Intensity slider: an
 * intensity near zero is still an OPAQUE fill in the page's own colour, so it
 * looks transparent while quietly flattening the nesting step of every callout
 * stacked inside it (see `CalloutDefinition.transparentBg`).
 */
type BgStyle = "solid" | "gradient" | "none";

export class PaletteEditorModal extends Modal {
	private existing: CustomPalette | null;
	/** Normalized names of every other palette (custom AND built-in presets). */
	private takenNames: Set<string>;
	private name: string;
	private baseColor: string;
	private colors: DerivedPalette;
	private bgStyle: BgStyle;
	/** How strongly the background color shows; steers all bg-tint derivation. */
	private bgIntensity: number;
	/** Once the user drags the slider, style toggles stop overwriting it with a per-style default. */
	private bgIntensityTouched: boolean;
	private bgIntensitySlider: SliderComponent | null = null;
	/** Row element for the Intensity slider, hidden while the advanced per-color grid is showing (it only steers derivation, which the advanced grid bypasses). */
	private bgIntensityRowEl: HTMLElement | null = null;
	/**
	 * Whether the color section shows the advanced per-color grid instead of
	 * the single Base color control. Only takes effect while `bgStyle` is
	 * "solid" (see renderColorSection); toggling it never changes any color
	 * value, only which controls are shown.
	 */
	private advancedColors: boolean;
	/** Container rebuilt by renderColorSection() whenever advancedColors or bgStyle changes. */
	private colorSectionEl: HTMLElement | null = null;
	// Gradient state. The end (stop-2) colors are tints of gradientToBase,
	// derived exactly like the six colors are derived from the base color.
	private angleDeg: number;
	private gradientToBase: string;
	/** Once the user picks a second color it stops auto-following the base. */
	private gradientToTouched: boolean;
	private toColorLight = "";
	private toColorDark = "";
	/** Opt-in: paint the gradient through the title text of all three roles. */
	private textGradient: boolean;
	// Accent-strength counterparts of toColor*, for the text sweep.
	private textToColorLight = "";
	private textToColorDark = "";
	private resolve: ((result: PaletteEditorResult | null) => void) | null =
		null;

	private previewEl: HTMLElement | null = null;
	private preview: LiveCalloutPreview | null = null;
	/** Preview the caller had registered before this modal took the slot. */
	private outerPreview: CalloutDefinition | null = null;
	private outerPreviewIsDemo = false;
	private nameInputEl: HTMLInputElement | null = null;
	private nameErrorEl: HTMLElement | null = null;
	private saveBtnEl: HTMLButtonElement | null = null;
	// Gradient UI refs for show/hide and programmatic color sync.
	private gradientRows: HTMLElement[] = [];
	private gradToInput: HTMLInputElement | null = null;

	constructor(
		private plugin: PaletteEditorPlugin,
		options: { existing?: CustomPalette; takenNames?: string[] } = {},
	) {
		super(plugin.app);
		this.existing = options.existing ?? null;
		// Callers pass the other CUSTOM palette names; the fixed preset names
		// are merged here so a custom palette can't shadow "Blue" etc. Read via
		// the getters (not a cached const) so the comparison is against the
		// names in the user's current display language.
		this.takenNames = new Set(
			[
				...(options.takenNames ?? []),
				...getObsidianPalettes().map((p) => p.name),
				...getExtraPalettes().map((p) => p.name),
			].map(normalizeName),
		);
		this.name = this.existing?.name ?? "";
		this.baseColor = this.existing?.colorLight ?? DEFAULT_BASE_COLOR;
		const g = this.existing?.bgGradient;
		// Transparency is checked first: a palette can carry a stale gradient
		// beside the flag (nothing clears it when the style switches, so a
		// switch back to Gradient finds it intact), and the flag is what
		// actually gets painted.
		this.bgStyle =
			this.existing?.transparentBg ? "none"
			: g ? "gradient"
			: "solid";
		// Set before any derivation below: deriveGradientEnd() and the new-palette
		// branch both read this to decide how strong the background reads. A
		// fresh palette seeds from the per-style default (gradients default
		// higher — a two-stop sweep reads fainter than a solid fill at the same
		// amount); a saved value is the user's own choice and always wins.
		this.bgIntensityTouched = this.existing?.bgIntensity !== undefined;
		this.bgIntensity =
			this.existing?.bgIntensity ??
			(this.bgStyle === "gradient"
				? DEFAULT_BG_INTENSITY_GRADIENT
				: DEFAULT_BG_INTENSITY_SOLID);
		this.colors = this.existing
			? {
					colorLight: this.existing.colorLight,
					colorDark: this.existing.colorDark,
					bgColorLight: this.existing.bgColorLight,
					bgColorDark: this.existing.bgColorDark,
					textColorLight: this.existing.textColorLight,
					textColorDark: this.existing.textColorDark,
				}
			: derivePaletteFromColor(this.baseColor, this.bgIntensity);
		this.advancedColors = this.existing?.colorMode === "advanced";
		this.angleDeg = g?.angleDeg ?? DEFAULT_GRADIENT_ANGLE;
		// A saved gradient's end colors are authoritative (derivation is not
		// invertible); a fresh gradient starts from a hue-shifted base color
		// so toggling it on is immediately visible.
		this.gradientToTouched = !!g;
		this.gradientToBase =
			g?.toColorLight ?? rotateHue(this.baseColor, GRADIENT_HUE_SHIFT);
		this.textGradient = g?.textGradient ?? false;
		// Derive first, then let a saved gradient's own colors win: derivation
		// is not invertible, so the stored values are authoritative wherever
		// they exist. Gradients saved before the text sweep existed carry no
		// text ends, and gradientToBase is then the pale toColorLight — the
		// derivation only darkens that tint to a readable strength instead of
		// recovering the original second color, which is enough to make the
		// toggle usable until the second color picker is touched.
		this.deriveGradientEnd();
		if (g) {
			this.toColorLight = g.toColorLight;
			this.toColorDark = g.toColorDark;
			this.textToColorLight = g.textToColorLight ?? this.textToColorLight;
			this.textToColorDark = g.textToColorDark ?? this.textToColorDark;
		}
	}

	openAndWait(): Promise<PaletteEditorResult | null> {
		return new Promise<PaletteEditorResult | null>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}

	onOpen(): void {
		this.setTitle(
			this.existing ? t("palette.editTitle") : t("palette.newTitle"),
		);
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("callout-studio-palette-editor");
		// Same shell and width as the callout editor: fixed title with a rule,
		// scrolling content (the sticky preview column relies on that scroll
		// container), and a fixed footer for the buttons.
		this.modalEl.addClass("callout-studio-editor-modal");
		const footer = applyModalChrome(this, { footer: true, wide: true });

		// Two-column body from the very first row: options (including the name)
		// on the left, sticky live preview on the right — the callout editor's
		// panel classes.
		const panel = contentEl.createDiv({
			cls: "callout-studio-preview-panel",
		});
		const adjustCol = panel.createDiv({ cls: "callout-studio-adjust-col" });
		const previewCol = panel.createDiv({
			cls: "callout-studio-preview-col",
		});

		const nameSetting = new Setting(adjustCol)
			.setName(t("palette.name"))
			// Shares one control width with the Style row directly below it, so
			// the field and the dropdown end on the same edge instead of each
			// taking whatever its own content asks for (see styles.css).
			.setClass("cs-palette-name-setting")
			.addText((text) => {
				this.nameInputEl = text.inputEl;
				text.inputEl.maxLength = MAX_NAME_LENGTH;
				text.setPlaceholder(t("palette.namePlaceholder"))
					.setValue(this.name)
					.onChange((v) => {
						this.name = v;
						this.updateNameValidity();
					});
			});
		// Error line in the info column, mirroring the callout IDs error.
		this.nameErrorEl = nameSetting.descEl.createDiv({ cls: "cs-tag-error" });

		this.buildBgStyleRow(adjustCol);
		// Always visible, regardless of Solid/Gradient. Every other row in this
		// column draws its own top border, but the first row of the color
		// section below is the first child of that wrapper and so matches
		// Obsidian's `:first-child { border-top: none }` modal rule — this div
		// puts the missing line back.
		adjustCol.createDiv({ cls: "cs-palette-divider" });

		this.colorSectionEl = adjustCol.createDiv({
			cls: "cs-palette-color-section",
		});
		this.renderColorSection();

		this.buildGradientToRow(adjustCol);

		this.buildBgIntensityRow(adjustCol);

		this.buildGradientDirectionAndTextRows(adjustCol);

		this.previewEl = previewCol.createDiv({
			cls: "cs-palette-live-preview",
		});
		// Capture any preview the caller already registered (e.g. the callout
		// editor's, when this modal is opened over it) so it can be restored on
		// close instead of clearing the registry's single preview slot to null.
		this.outerPreview = this.plugin.registry.getPreviewDefinition();
		this.outerPreviewIsDemo = this.plugin.registry.isPreviewDemo();
		this.preview = new LiveCalloutPreview(this.plugin.app, this.previewEl, {
			title: t("editor.livePreview"),
			initialText: this.buildSampleText(),
			// Push the derived palette into the registry under the reserved
			// preview ID and re-inject CSS so the callout renders live.
			beforeRender: () => {
				// A demo placeholder: the palette editor previews a derived
				// palette on a stand-in callout, it never edits a real one.
				this.plugin.registry.setPreviewDefinition(
					this.buildPreviewDefinition(),
					true,
				);
				this.plugin.cssInjector.inject(false);
			},
			onDestroy: () => {
				this.plugin.registry.setPreviewDefinition(
					this.outerPreview,
					this.outerPreviewIsDemo,
				);
				this.plugin.cssInjector.inject(false);
			},
		});

		const buttons = footer;
		buttons
			.createEl("button", { text: t("editor.cancel") })
			.addEventListener("click", () => this.finish(false));
		this.saveBtnEl = buttons.createEl("button", {
			text: t("palette.save"),
			cls: "mod-cta",
		});
		this.saveBtnEl.addEventListener("click", () => this.finish(true));
		this.updateNameValidity();
	}

	/** True when the typed name collides with another palette or a preset. */
	private isNameTaken(): boolean {
		return this.takenNames.has(normalizeName(this.name));
	}

	/**
	 * Duplicate names are hard-blocked: the input turns red, an error shows
	 * under the label, and Save is disabled until the name is unique.
	 */
	private updateNameValidity(): void {
		const taken = this.isNameTaken();
		this.nameInputEl?.toggleClass("cs-input-invalid", taken);
		if (this.nameErrorEl) {
			this.nameErrorEl.setText(taken ? t("palette.nameExists") : "");
			this.nameErrorEl.toggleClass("is-visible", taken);
		}
		if (this.saveBtnEl) this.saveBtnEl.disabled = taken;
	}

	/** Re-derives all six colors from the base color and refreshes the UI. */
	private applyDerived(): void {
		this.colors = derivePaletteFromColor(this.baseColor, this.bgIntensity);
		// The gradient end follows the base color until the user picks their
		// own second color; its tints are then re-derived either way (same
		// "re-derive overwrites manual tweaks" contract as the six colors).
		if (!this.gradientToTouched) {
			this.gradientToBase = rotateHue(
				this.baseColor,
				GRADIENT_HUE_SHIFT,
			);
		}
		this.deriveGradientEnd();
		this.syncGradientInputs();
		this.preview?.refresh();
	}

	/**
	 * Recomputes both end-color pairs from the second base color: the pale
	 * tints the background sweep ends on, and their accent-strength
	 * counterparts for the text sweep — derived exactly the way the palette's
	 * own accent is derived from its base color, so the two stops of a
	 * gradient title are as readable as any other accent in the palette.
	 */
	private deriveGradientEnd(): void {
		this.toColorLight = bgTintFor(this.gradientToBase, false, this.bgIntensity);
		this.toColorDark = bgTintFor(this.gradientToBase, true, this.bgIntensity);
		const accents = derivePaletteFromColor(this.gradientToBase);
		this.textToColorLight = accents.colorLight;
		this.textToColorDark = accents.colorDark;
	}

	/** The gradient to preview/persist, or null unless Gradient is selected. */
	private currentGradient(): BgGradient | null {
		if (this.bgStyle !== "gradient") return null;
		const gradient: BgGradient = {
			angleDeg: this.angleDeg,
			toColorLight: this.toColorLight,
			toColorDark: this.toColorDark,
			// Persisted even while the sweep is off, so turning it on later
			// paints with the user's real second color instead of a lossy
			// re-derivation from the pale tints above.
			textToColorLight: this.textToColorLight,
			textToColorDark: this.textToColorDark,
		};
		if (this.textGradient) gradient.textGradient = true;
		return gradient;
	}

	/**
	 * Solid|Gradient|None picker — sits above the base color.
	 *
	 * A dropdown rather than the segmented switch this used to be: the options
	 * column is 240px, and three labelled buttons beside a name left the name
	 * itself ellipsised to "St…" in English and worse in every language with a
	 * longer word for "gradient". A `<select>` costs one fixed width no matter
	 * how many options it holds or how they translate. `cs-palette-bgstyle-setting`
	 * is what pins that width to the Name field's above it (see styles.css).
	 */
	private buildBgStyleRow(parent: HTMLElement): void {
		const bgStyleSetting = new Setting(parent)
			.setName(t("palette.bgStyle"))
			.setClass("cs-palette-bgstyle-setting");
		bgStyleSetting.addDropdown((dd) => {
			dd.addOption("solid", t("palette.bgSolid"))
				.addOption("gradient", t("palette.bgGradient"))
				.addOption("none", t("palette.bgTransparent"))
				.setValue(this.bgStyle)
				.onChange((raw) => {
					const v = raw as BgStyle;
					this.bgStyle = v;
					// Follow the per-style default until the user drags the
					// slider themselves; once touched, their chosen intensity
					// sticks across style changes instead of being overwritten.
					// "None" is skipped entirely: it paints no background, so it
					// has no strength of its own to default to, and re-seeding
					// here would silently rewrite the value a switch back to
					// Solid is meant to restore.
					if (!this.bgIntensityTouched && v !== "none") {
						this.bgIntensity =
							v === "gradient"
								? DEFAULT_BG_INTENSITY_GRADIENT
								: DEFAULT_BG_INTENSITY_SOLID;
						this.bgIntensitySlider?.setValue(
							Math.round(this.bgIntensity * 100),
						);
						this.applyDerived();
					} else {
						this.preview?.refresh();
					}
					this.updateGradientVisibility();
					// The advanced grid and the Intensity row are Solid-only; a
					// switch to Gradient or None hides them (colors/intensity
					// stay exactly as they were, ready to reappear if the user
					// switches back).
					this.renderColorSection();
				});
		});
	}

	/**
	 * Background-intensity slider: how strongly the color shows. Applies to
	 * BOTH solid and gradient backgrounds, so — unlike the gradient-only rows
	 * around it — it is always visible: sits right under Base color in Solid
	 * (the hidden Second color row above it takes no space), and under Second
	 * color in Gradient. Works in whole percent; the stored value is a 0..1
	 * fraction. Re-deriving on change overwrites the six colors and gradient
	 * tints (the same contract as changing the base color).
	 *
	 * Hidden while the advanced per-color grid is showing: intensity only
	 * steers the Base-color derivation, which the advanced grid bypasses
	 * (its rows write colors directly). Hidden under None too — see
	 * {@link syncBgIntensityRow}.
	 */
	private buildBgIntensityRow(parent: HTMLElement): void {
		const setting = new Setting(parent).setName(t("palette.bgIntensity"));
		this.bgIntensityRowEl = setting.settingEl;
		this.syncBgIntensityRow();
		setting.addSlider((slider) => {
			this.bgIntensitySlider = slider;
			slider
				.setLimits(
					Math.round(MIN_BG_COLOR_AMOUNT * 100),
					Math.round(MAX_BG_COLOR_AMOUNT * 100),
					1,
				)
				.setValue(Math.round(this.bgIntensity * 100))
				.setDynamicTooltip()
				.setInstant(true)
				.onChange((v) => {
					this.bgIntensity = v / 100;
					this.bgIntensityTouched = true;
					this.applyDerived();
				});
		});
	}

	/**
	 * Shows the Intensity row only where a strength is a real question: it is
	 * meaningless under None (nothing is painted) and bypassed by the advanced
	 * grid (whose rows write colors directly instead of deriving them). Both
	 * callers go through here so the two conditions can't drift apart.
	 */
	private syncBgIntensityRow(): void {
		this.bgIntensityRowEl?.toggleClass(
			"cs-row-hidden",
			(this.advancedColors && this.bgStyle === "solid") ||
				this.bgStyle === "none",
		);
	}

	/**
	 * Rebuilds the color section: the single Base color control, or — only
	 * while Solid and opted in — the advanced per-color grid. Called on open
	 * and whenever advancedColors or bgStyle changes; never touches any
	 * color value, purely a view switch (see the class-level doc on
	 * advancedColors).
	 */
	private renderColorSection(): void {
		if (!this.colorSectionEl) return;
		this.colorSectionEl.empty();
		const showAdvanced = this.advancedColors && this.bgStyle === "solid";
		this.syncBgIntensityRow();
		if (showAdvanced) {
			this.buildAdvancedColorRows(this.colorSectionEl);
		} else {
			this.buildSimpleColorRow(this.colorSectionEl);
		}
	}

	/**
	 * The default color control: one Base color swatch that derives all six
	 * colors (see applyDerived). While Solid, an inline hint explains the
	 * auto-matched background and offers the advanced per-color grid via a
	 * short link — hidden in Gradient mode, which has no advanced view
	 * (requirement: Gradient is never affected by this feature).
	 */
	private buildSimpleColorRow(parent: HTMLElement): void {
		const baseSetting = new Setting(parent).setName(t("palette.baseColor"));
		createColorSwatchInput(baseSetting.controlEl, this.baseColor, (hex) => {
			this.baseColor = hex;
			this.applyDerived();
		});
		if (this.bgStyle === "solid") {
			this.renderInlineLinkHint(
				baseSetting.descEl,
				"palette.baseColorHint",
				"palette.baseColorHintLink",
				() => {
					this.advancedColors = true;
					this.renderColorSection();
				},
			);
		}
	}

	/**
	 * Renders `t(textKey)` — which must contain a literal "{{link}}" token —
	 * as plain text with a single low-emphasis inline link standing in for
	 * the token, instead of a full-width button. Used for the Base color
	 * auto-background hint and the advanced grid's "revert to a single
	 * color" hint.
	 */
	private renderInlineLinkHint(
		parent: HTMLElement,
		textKey: string,
		linkKey: string,
		onClick: () => void,
	): void {
		const [before, after] = t(textKey).split("{{link}}");
		const line = parent.createDiv({ cls: "cs-inline-hint" });
		if (before) line.createSpan({ text: before });
		const link = line.createEl("button", {
			cls: "cs-link-btn cs-link-btn-inline",
			text: t(linkKey),
		});
		link.addEventListener("click", (e) => {
			e.preventDefault();
			onClick();
		});
		if (after) line.createSpan({ text: after });
	}

	/**
	 * Advanced per-color grid: independent Accent/Background/Text swatches
	 * for ONLY the current Obsidian theme mode. Editing one infers a
	 * matching value for the hidden mode via inferOppositeModeColor (mirror
	 * lightness, then contrast-correct for Accent/Text — see that
	 * function's doc). Deliberately per-channel: editing Accent never
	 * touches Background or Text. Contrast is enforced as a non-blocking
	 * warning badge, not an auto-fix, so an edit here never silently
	 * changes a value the user didn't touch.
	 */
	private buildAdvancedColorRows(parent: HTMLElement): void {
		const isDark = activeDocument.body.classList.contains("theme-dark");

		const header = new Setting(parent).setName(t("palette.advancedColors"));
		header.setDesc(
			t("palette.advancedColorsHint", {
				mode: isDark ? t("palette.darkMode") : t("palette.lightMode"),
			}),
		);
		this.renderInlineLinkHint(
			header.descEl,
			"palette.revertHint",
			"palette.revertHintLink",
			() => {
				this.advancedColors = false;
				this.renderColorSection();
			},
		);

		const accentKey: "colorLight" | "colorDark" = isDark
			? "colorDark"
			: "colorLight";
		const accentOppositeKey: "colorLight" | "colorDark" = isDark
			? "colorLight"
			: "colorDark";
		const bgKey: "bgColorLight" | "bgColorDark" = isDark
			? "bgColorDark"
			: "bgColorLight";
		const bgOppositeKey: "bgColorLight" | "bgColorDark" = isDark
			? "bgColorLight"
			: "bgColorDark";
		const textKey: "textColorLight" | "textColorDark" = isDark
			? "textColorDark"
			: "textColorLight";
		const textOppositeKey: "textColorLight" | "textColorDark" = isDark
			? "textColorLight"
			: "textColorDark";

		const accentSwatch = createColorSwatchInput(
			new Setting(parent).setName(t("palette.accentColor")).controlEl,
			this.colors[accentKey],
			(hex) => {
				this.colors[accentKey] = hex;
				this.colors[accentOppositeKey] = inferOppositeModeColor(
					hex,
					isDark,
					this.colors[bgOppositeKey],
					3,
				);
				refreshWarnings();
				this.preview?.refresh();
			},
		);

		createColorSwatchInput(
			new Setting(parent).setName(t("palette.backgroundColorChannel"))
				.controlEl,
			this.colors[bgKey],
			(hex) => {
				this.colors[bgKey] = hex;
				this.colors[bgOppositeKey] = inferOppositeModeColor(
					hex,
					isDark,
					null,
					null,
				);
				refreshWarnings();
				this.preview?.refresh();
			},
		);

		const textSwatch = createColorSwatchInput(
			new Setting(parent).setName(t("palette.textColorChannel")).controlEl,
			this.colors[textKey],
			(hex) => {
				this.colors[textKey] = hex;
				this.colors[textOppositeKey] = inferOppositeModeColor(
					hex,
					isDark,
					this.colors[bgOppositeKey],
					4.5,
				);
				refreshWarnings();
				this.preview?.refresh();
			},
		);

		// Re-checks the two contrast-dependent swatches (Accent >=3:1, Text
		// >=4.5:1) against the current mode's bg after any of the three rows
		// changes — a non-blocking heads-up, never a block on Save.
		const refreshWarnings = (): void => {
			const bg = this.colors[bgKey];
			setContrastWarning(
				accentSwatch.warnEl,
				contrastRatio(this.colors[accentKey], bg) < 3,
			);
			setContrastWarning(
				textSwatch.warnEl,
				contrastRatio(this.colors[textKey], bg) < 4.5,
			);
		};
		refreshWarnings();
	}

	/**
	 * Gradient-only row for the second color. Built separately from the rest
	 * of the gradient controls so the always-visible Intensity row can sit
	 * directly below it (falls back to right after Base color when Solid is
	 * selected, since this row is hidden and takes no space then).
	 */
	private buildGradientToRow(parent: HTMLElement): void {
		const toSetting = new Setting(parent).setName(t("palette.gradientTo"));
		this.gradToInput = createColorSwatchInput(
			toSetting.controlEl,
			this.gradientToBase,
			(hex) => {
				this.gradientToBase = hex;
				this.gradientToTouched = true;
				this.deriveGradientEnd();
				this.syncGradientInputs();
				this.preview?.refresh();
			},
		).input;
		this.gradientRows.push(toSetting.settingEl);
	}

	/**
	 * Gradient-only rows, shown while the Gradient style is selected: the
	 * direction picker and the title-text sweep toggle.
	 */
	private buildGradientDirectionAndTextRows(parent: HTMLElement): void {
		const dirSetting = new Setting(parent).setName(
			t("palette.gradientDirection"),
		);
		this.buildDirectionPicker(dirSetting.controlEl, this.angleDeg, (deg) => {
			this.angleDeg = deg;
			this.preview?.refresh();
		});
		this.gradientRows.push(dirSetting.settingEl);

		const textSetting = new Setting(parent)
			.setName(t("palette.gradientText"))
			.addToggle((toggle) => {
				toggle.setValue(this.textGradient).onChange((on) => {
					this.textGradient = on;
					this.preview?.refresh();
				});
			});
		this.gradientRows.push(textSetting.settingEl);
		this.updateGradientVisibility();
	}

	/**
	 * Arrow direction picker for the linear gradient's angle. Manages its
	 * own active-button state.
	 */
	private buildDirectionPicker(
		parent: HTMLElement,
		initialDeg: number,
		onPick: (deg: number) => void,
	): void {
		const dirWrap = parent.createDiv({
			cls: "cs-gradient-dir-row",
		});
		const dirBtns = new Map<number, HTMLButtonElement>();
		for (const { deg, icon } of GRADIENT_DIRECTIONS) {
			const btn = dirWrap.createEl("button", {
				cls: "cs-gradient-dir-btn",
				attr: { "aria-label": `${deg}°`, title: `${deg}°` },
			});
			setIcon(btn, icon);
			if (deg === initialDeg) btn.addClass("is-active");
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				for (const b of dirBtns.values()) b.removeClass("is-active");
				btn.addClass("is-active");
				onPick(deg);
			});
			dirBtns.set(deg, btn);
		}
	}

	/** Shows/hides the gradient rows to match the current style choice. */
	private updateGradientVisibility(): void {
		const off = this.bgStyle !== "gradient";
		for (const row of this.gradientRows) {
			row.toggleClass("cs-gradient-hidden", off);
		}
	}

	/** Pushes gradient colors into their swatches after a programmatic change. */
	private syncGradientInputs(): void {
		const entries: [HTMLInputElement | null | undefined, string][] = [
			[this.gradToInput, this.gradientToBase],
		];
		for (const [input, value] of entries) {
			if (!input) continue;
			input.value = value;
			if (input.parentElement) {
				input.parentElement.style.backgroundColor = value;
			}
		}
	}

	/**
	 * The sample markdown seeding the read-only preview: the same mini-document
	 * as the callout editor's preview — a titled heading callout, an inline pill,
	 * then the regular callout — all in the palette's colors, so a saved palette
	 * can be checked against every render role at once. The title is a fixed
	 * placeholder, deliberately not tied to the "Name" field above (that field
	 * names the *palette*, e.g. "Ocean", not this demo callout). The trailing
	 * blank line keeps the read-only caret parked outside the last block (see
	 * LiveCalloutPreview's focus policy).
	 */
	private buildSampleText(): string {
		const id = PALETTE_DEMO_ID;
		const name = t("editor.untitledCallout");
		return [
			`## [!${id}] ${name}`,
			"",
			t("editor.sampleInlineText").replace("{id}", id),
			"",
			`> [!${id}] ${name}`,
			`> ${t("editor.loremIpsumShort")}`,
			"",
		].join("\n");
	}

	/** Snapshot the derived palette colors as a transient preview definition. */
	private buildPreviewDefinition(): CalloutDefinition {
		return {
			id: PALETTE_DEMO_ID,
			displayName: t("editor.untitledCallout"),
			icon: { type: "lucide", value: "palette" },
			colorLight: this.colors.colorLight,
			colorDark: this.colors.colorDark,
			bgColorLight: this.colors.bgColorLight,
			bgColorDark: this.colors.bgColorDark,
			bgGradient: this.currentGradient() ?? undefined,
			// The flag beats the two hexes above wherever both are present
			// (CSSInjector.bgProps returns before reading them), so the preview
			// shows what a saved None palette will actually paint without the
			// derivation having to be torn down and rebuilt on every toggle.
			...(this.bgStyle === "none" ? { transparentBg: true as const } : {}),
			textColorLight: this.colors.textColorLight,
			textColorDark: this.colors.textColorDark,
			foldable: false,
			defaultFolded: false,
			aliases: [],
			builtIn: false,
			source: "user",
		};
	}

	private finish(save: boolean): void {
		// Save stays disabled on a duplicate name, but guard anyway.
		if (save && this.isNameTaken()) return;
		const resolve = this.resolve;
		this.resolve = null;
		let result: PaletteEditorResult | null = null;
		if (save) {
			const typed = this.name.trim();
			const name =
				typed ||
				dedupeColorName(
					suggestColorName(this.colors.colorLight),
					this.takenNames,
				);
			const gradient = this.currentGradient();
			result = {
				name,
				...this.colors,
				bgIntensity: this.bgIntensity,
				...(gradient ? { bgGradient: gradient } : {}),
				// The six colors above are saved unchanged under None: the
				// backgrounds among them are what a later switch back to Solid
				// restores, and `bakePaletteColors` is what keeps them from
				// reaching a callout meanwhile.
				...(this.bgStyle === "none"
					? { transparentBg: true as const }
					: {}),
				// Saved regardless of the current bgStyle so a palette left in
				// advanced mode while Gradient was selected still reopens
				// advanced if the user switches back to Solid later.
				...(this.advancedColors ? { colorMode: "advanced" as const } : {}),
			};
		}
		this.close();
		resolve?.(result);
	}

	onClose(): void {
		// Destroys the embedded editor and, via onDestroy, restores the outer
		// preview registration (if any) and re-injects CSS.
		this.preview?.destroy();
		this.preview = null;
		this.contentEl.empty();
		// The button bar is a sibling of contentEl, so emptying that misses it.
		removeModalChrome(this);
		if (this.resolve) {
			this.resolve(null);
			this.resolve = null;
		}
	}
}
