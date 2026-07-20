/**
 * settings/GlobalStyleModal.ts — Per-role "Global callout style" popup.
 *
 * Opened from the Global settings section's per-role buttons in the settings
 * tab, one modal per render role. Two-column layout: a live preview (left) of a neutral demo
 * callout — gray accent, solid Lucide square icon — and the role's style
 * control groups (right):
 *   - regular: borders, font scale, shape, align
 *   - heading: borders, shape, vertical text spacing, outline/link options
 *   - inline:  borders, shape
 *
 * The demo callout is registered through the registry's transient preview
 * slot (never persisted) so it renders through the real pipeline: injected
 * CSS, heading/inline decorations, icon painting.
 */
import { Component, MarkdownRenderer, Modal, Setting, setIcon } from "obsidian";
import { t } from "../i18n";
import type { CalloutDefinition, CalloutRenderRole } from "../types";
import { LiveCalloutPreview } from "./LiveCalloutPreview";
import {
	addStyleSlider,
	createControlGroup,
	renderBordersGroup,
} from "./styleControls";
import type { SettingsTabPlugin } from "./sections/types";
import { refreshAllMarkdownEditors } from "../editor/livepreview/refresh";

/**
 * Reserved id for the neutral demo callout rendered in the popups. Registered
 * only while a popup is open; if a user callout ever occupies the same id,
 * the preview slot shadows and later restores it.
 */
const STYLE_DEMO_ID = "global-style-demo";

/** Neutral gray accent used by the demo callout in both theme modes. */
const STYLE_DEMO_GRAY = "#808080";

/** Number of stacked demo headers in the "Spacing between headers" demo. */
const GAP_DEMO_COUNT = 4;

export class GlobalStyleModal extends Modal {
	private preview: LiveCalloutPreview | null = null;

	/** Preview column, toggled with `cs-showing-gap-demo` during a gap drag. */
	private previewCol: HTMLElement | null = null;
	/** Reading-view render host for the gap demo (heading role only). */
	private gapDemoRender: HTMLElement | null = null;
	/** Component owning the gap demo's MarkdownRenderer output. */
	private gapDemoComponent: Component | null = null;

	constructor(
		private readonly plugin: SettingsTabPlugin,
		private readonly role: CalloutRenderRole,
	) {
		super(plugin.app);
	}

	onOpen(): void {
		this.modalEl.addClass("cs-role-style-modal");
		this.titleEl.setText(
			`${t("settings.globalStyle")} — ${this.roleName()}`,
		);

		const panel = this.contentEl.createDiv({
			cls: "callout-studio-preview-panel",
		});

		const previewCol = panel.createDiv({
			cls: "callout-studio-preview-col",
		});
		this.previewCol = previewCol;
		this.preview = new LiveCalloutPreview(this.app, previewCol, {
			title: t("settings.previewTitle"),
			initialText: this.buildSampleText(),
			beforeRender: () => {
				// A neutral demo callout for previewing the vault-wide geometry,
				// never a real row — keep it out of the settings lists.
				this.plugin.registry.setPreviewDefinition(
					this.buildDemoDefinition(),
					true,
				);
				this.plugin.cssInjector.inject(false);
			},
			onDestroy: () => {
				this.plugin.registry.setPreviewDefinition(null);
				this.plugin.cssInjector.inject(false);
			},
		});

		const controlsCol = panel.createDiv({
			cls: "callout-studio-adjust-col",
		});
		switch (this.role) {
			case "regular":
				this.renderRegularControls(controlsCol);
				break;
			case "heading":
				// A reading-view demo (real hN, where the gap margin applies —
				// the Live Preview editor's .cm-line is excluded on purpose) that
				// takes over the preview while the gap slider is dragged.
				this.buildGapDemo(previewCol);
				this.renderHeadingControls(controlsCol);
				break;
			case "inline":
				this.renderInlineControls(controlsCol);
				break;
		}
	}

	onClose(): void {
		this.preview?.destroy();
		this.preview = null;
		this.gapDemoComponent?.unload();
		this.gapDemoComponent = null;
		this.gapDemoRender = null;
		this.previewCol = null;
		this.contentEl.empty();
	}

	// ── Per-role control columns ────────────────────────────────────

	private renderRegularControls(col: HTMLElement): void {
		const { globalStyle } = this.plugin.settings;
		renderBordersGroup(this.plugin, col, globalStyle);

		const fontGroup = createControlGroup(col, t("settings.fontScaleGroup"));
		addStyleSlider(this.plugin, fontGroup, {
			label: t("settings.titleScale"),
			min: 0.5,
			max: 1.5,
			step: 0.05,
			decimals: 2,
			numberOptions: {
				prefix: "×",
				format: {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				},
			},
			get: () => globalStyle.titleScale,
			set: (v) => {
				globalStyle.titleScale = v;
			},
		});
		addStyleSlider(this.plugin, fontGroup, {
			label: t("settings.contentScale"),
			min: 0.5,
			max: 1.5,
			step: 0.05,
			decimals: 2,
			numberOptions: {
				prefix: "×",
				format: {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				},
			},
			get: () => globalStyle.contentScale,
			set: (v) => {
				globalStyle.contentScale = v;
			},
		});

		this.renderShapeGroup(
			col,
			() => globalStyle.borderRadius,
			(v) => {
				globalStyle.borderRadius = v;
			},
		);

		const alignGroup = createControlGroup(
			col,
			t("settings.alignGroup"),
			"cs-layout-group",
		);
		new Setting(alignGroup)
			.setName(t("settings.alignContent"))
			.addToggle((toggle) => {
				toggle
					.setValue(globalStyle.alignContentWithTitle)
					.onChange(async (v) => {
						globalStyle.alignContentWithTitle = v;
						await this.plugin.saveSettings();
						this.plugin.cssInjector.inject();
					});
			});
	}

	private renderHeadingControls(col: HTMLElement): void {
		const heading = this.plugin.settings.globalStyle.heading;
		renderBordersGroup(this.plugin, col, heading);

		this.renderShapeGroup(
			col,
			() => heading.borderRadius,
			(v) => {
				heading.borderRadius = v;
			},
		);

		// Vertical spacing of the text inside the bar. A single slider drives
		// both the top and bottom padding symmetrically, so the heading text
		// always stays vertically centered in the bar.
		const spacingGroup = createControlGroup(
			col,
			t("settings.headingSpacingGroup"),
		);
		addStyleSlider(this.plugin, spacingGroup, {
			label: t("settings.headingPadVertical"),
			min: 0,
			max: 1,
			step: 0.05,
			decimals: 2,
			numberOptions: {
				suffix: "em",
				format: {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				},
			},
			get: () => heading.paddingTop,
			set: (v) => {
				heading.paddingTop = v;
				heading.paddingBottom = v;
			},
		});

		// Horizontal inset pushing the icon in from the bar's start edge (px,
		// so it stays constant across heading levels).
		addStyleSlider(this.plugin, spacingGroup, {
			label: t("settings.headingIconIndent"),
			min: 0,
			max: 40,
			step: 1,
			decimals: 0,
			numberOptions: { suffix: "px" },
			get: () => heading.paddingStart,
			set: (v) => {
				heading.paddingStart = v;
			},
		});

		// Outer gap above each heading bar (em). Separates a heading callout
		// from what precedes it — chiefly from other heading callouts, which
		// otherwise stack glued together when collapsed. Distinct from the
		// vertical-spacing slider above, which is the padding *inside* the bar.
		addStyleSlider(this.plugin, spacingGroup, {
			label: t("settings.headingGap"),
			min: 0,
			max: 2,
			step: 0.05,
			decimals: 2,
			numberOptions: {
				suffix: "em",
				format: {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				},
			},
			get: () => heading.marginTop,
			set: (v) => {
				heading.marginTop = v;
				// Drive the demo straight off the slider value so it tracks
				// exactly — including a hard 0. Relying on the injected
				// `--cs-heading-gap-top` instead would leave the demo showing a
				// stale gap at 0, since the injector omits the variable at 0 and
				// the drag-time inject is RAF-coalesced (the reported "bars still
				// far apart at 0" bug).
				this.setGapDemoValue(v);
			},
			// The gap comes from a static CSS margin (reading view) and a CM6
			// block widget (Live Preview) — neither of which the modal's own
			// live editor preview shows moving in real time (the widget only
			// rebuilds on an explicit refresh, not on cssInjector's cheap
			// drag-time inject) — so swap in the stacked reading-view demo for
			// the duration of the drag (see buildGapDemo).
			onDragStart: () => this.showGapDemo(),
			onDragEnd: () => {
				this.hideGapDemo();
				// Rebuild this modal's own embedded editor's decorations (not
				// reached by refreshAllMarkdownEditors — it isn't a workspace
				// leaf) plus every open note's Live Preview, so the new gap
				// widget appears without needing to reopen the note.
				this.preview?.refresh();
				refreshAllMarkdownEditors(this.app);
			},
		});
	}

	private renderInlineControls(col: HTMLElement): void {
		const inline = this.plugin.settings.globalStyle.inline;
		renderBordersGroup(this.plugin, col, inline);

		const fontGroup = createControlGroup(col, t("settings.fontScaleGroup"));
		addStyleSlider(this.plugin, fontGroup, {
			label: t("settings.inlineTextScale"),
			min: 0.5,
			max: 1.5,
			step: 0.05,
			decimals: 2,
			numberOptions: {
				prefix: "×",
				format: {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				},
			},
			get: () => inline.fontScale,
			set: (v) => {
				inline.fontScale = v;
			},
		});

		// Inline pills are small; corner rounding above ~10px has no visible
		// effect, so cap the slider there instead of the default 24.
		this.renderShapeGroup(
			col,
			() => inline.borderRadius,
			(v) => {
				inline.borderRadius = v;
			},
			10,
		);
	}

	private renderShapeGroup(
		col: HTMLElement,
		get: () => number,
		set: (v: number) => void,
		max = 24,
	): void {
		const shapeGroup = createControlGroup(col, t("settings.shapeGroup"));
		addStyleSlider(this.plugin, shapeGroup, {
			label: t("settings.borderRadius"),
			min: 0,
			max,
			step: 1,
			decimals: 0,
			numberOptions: {
				suffix: "px",
				format: { maximumFractionDigits: 0 },
			},
			get,
			set,
		});
	}

	// ── Gap demo (heading role) ─────────────────────────────────────

	/**
	 * Build the "Spacing between headers" demo: several stacked heading
	 * callouts rendered in reading view (real `<hN>`), where the gap margin
	 * actually applies. Hidden until the gap slider is grabbed.
	 *
	 * The bars carry no body — consecutive collapsed heading callouts, exactly
	 * as they'd stack in a note. Nothing between two bars but the gap margin
	 * itself, so the slider reads 1:1 (no body wrappers, fold animation, or
	 * theme heading margins to add invisible slack). A static chevron gives
	 * each the look of a collapsed callout.
	 */
	private buildGapDemo(previewCol: HTMLElement): void {
		// Live *inside* the preview card (its frame + "Preview" header stay put),
		// swapping only the editor body — so the demo reads as the same Preview
		// box, not a bare panel. Fall back to the column if the card isn't there.
		const host =
			previewCol.querySelector<HTMLElement>(
				".cs-live-preview-container",
			) ?? previewCol;
		// `.markdown-preview-view` + `.markdown-rendered` make Obsidian's own
		// reading-view CSS and the injected per-callout rules resolve as in a
		// note — same combo LiveCalloutPreview's fallback uses.
		const demo = host.createDiv({
			cls: "cs-gap-demo markdown-preview-view",
		});
		const rendered = demo.createDiv({
			cls: "markdown-rendered cs-gap-demo-render",
		});
		this.gapDemoRender = rendered;

		const component = new Component();
		component.load();
		this.gapDemoComponent = component;

		// The demo callout (STYLE_DEMO_ID) is already registered for the modal's
		// lifetime by the LiveCalloutPreview built just above, so these headers
		// resolve to the neutral gray demo style.
		const name = t("settings.styleDemoName");
		const block = `## [!${STYLE_DEMO_ID}] ${name}`;
		const md = Array(GAP_DEMO_COUNT).fill(block).join("\n\n");

		void MarkdownRenderer.render(this.app, md, rendered, "", component).then(
			() => {
				if (this.gapDemoRender !== rendered) return; // modal closed
				this.addDemoChevrons(rendered);
				// Seed each bar's inline gap so the demo is already correct the
				// instant it's revealed, before the first slider move.
				this.setGapDemoValue(
					this.plugin.settings.globalStyle.heading.marginTop,
				);
			},
		);
	}

	/**
	 * Append a static (collapsed-look) chevron after each demo header's title,
	 * mirroring the real trailing `.cs-fold-arrow` used in Live Preview
	 * (widgets.ts's HeadingFoldArrowWidget) rather than reading view's native
	 * `.heading-collapse-indicator`, which sits before the title but only
	 * renders inside a real workspace leaf (MarkdownRenderer.render() here
	 * never gets one) and is hover-only besides — unusable in this demo,
	 * since the slider drag that reveals it is exactly what steals hover
	 * away from the heading.
	 */
	private addDemoChevrons(container: HTMLElement): void {
		container.querySelectorAll<HTMLElement>(".cs-heading-callout").forEach(
			(h) => {
				const arrow = createSpan({ cls: "cs-fold-arrow" });
				setIcon(arrow, "chevron-right");
				h.append(arrow);
			},
		);
	}

	/**
	 * Point the demo's gap at an exact em value. The shared
	 * `.cs-heading-callout:not(.cm-line)` rule reads `--cs-heading-gap-top`, so
	 * the value is set inline on each demo bar — inline wins over the injected
	 * sheet's own element-level declaration, so the demo tracks the slider 1:1
	 * (including a hard 0, where the injector omits the variable entirely).
	 */
	private setGapDemoValue(em: number): void {
		this.gapDemoRender
			?.querySelectorAll<HTMLElement>(".cs-heading-callout")
			.forEach((bar) => {
				bar.style.setProperty("--cs-heading-gap-top", `${em}em`);
			});
	}

	/** Instantly swap the live editor out for the stacked gap demo. */
	private showGapDemo(): void {
		// Sync the demo to the current value before it's revealed, so a fresh
		// grab shows the right gap even before the first move fires `set`.
		this.setGapDemoValue(this.plugin.settings.globalStyle.heading.marginTop);
		this.previewCol?.addClass("cs-showing-gap-demo");
	}

	/** Restore the live editor. */
	private hideGapDemo(): void {
		this.previewCol?.removeClass("cs-showing-gap-demo");
	}

	// ── Demo callout + samples ──────────────────────────────────────

	private roleName(): string {
		switch (this.role) {
			case "regular":
				return t("settings.calloutTypeRegular");
			case "heading":
				return t("settings.calloutTypeHeading");
			case "inline":
				return t("settings.calloutTypeInline");
		}
	}

	/** Sample markdown for the role being styled. */
	private buildSampleText(): string {
		const name = t("settings.styleDemoName");
		switch (this.role) {
			case "regular":
				// The trailing blank line gives the preview's parked caret a
				// home outside the callout (see EmbeddableMarkdownEditor.parkCursor).
				return [
					`> [!${STYLE_DEMO_ID}] ${name}`,
					`> ${t("editor.loremIpsum")}`,
					"",
				].join("\n");
			case "heading":
				// Two body paragraphs so the fold arrow visibly hides content.
				return [
					`## [!${STYLE_DEMO_ID}] ${name}`,
					"",
					t("editor.loremIpsum"),
					"",
					t("editor.loremIpsum"),
				].join("\n");
			case "inline":
				return t("editor.sampleInlineText").replace(
					"{id}",
					STYLE_DEMO_ID,
				);
		}
	}

	/**
	 * The neutral demo definition: gray accent in both theme modes, and a
	 * Lucide square as the icon. A static styles.css rule keyed on the
	 * reserved id fills the square with the accent color, so it reads as a
	 * solid swatch instead of an outline.
	 */
	private buildDemoDefinition(): CalloutDefinition {
		return {
			id: STYLE_DEMO_ID,
			displayName: t("settings.styleDemoName"),
			icon: { type: "lucide", value: "square" },
			colorLight: STYLE_DEMO_GRAY,
			colorDark: STYLE_DEMO_GRAY,
			foldable: false,
			defaultFolded: false,
			builtIn: false,
			source: "user",
			aliases: [],
		};
	}
}
