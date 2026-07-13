/**
 * settings/GlobalStyleModal.ts — Per-role "Global callout style" popup.
 *
 * Opened from the Callout types cards in the settings tab, one modal per
 * render role. Two-column layout: a live preview (left) of a neutral demo
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
import { Modal, Setting } from "obsidian";
import { t } from "../i18n";
import type { CalloutDefinition, CalloutRenderRole } from "../types";
import { LiveCalloutPreview } from "./LiveCalloutPreview";
import {
	addStyleSlider,
	createControlGroup,
	renderBordersGroup,
} from "./styleControls";
import type { SettingsTabPlugin } from "./sections/types";

/**
 * Reserved id for the neutral demo callout rendered in the popups. Registered
 * only while a popup is open; if a user callout ever occupies the same id,
 * the preview slot shadows and later restores it.
 */
const STYLE_DEMO_ID = "global-style-demo";

/** Neutral gray accent used by the demo callout in both theme modes. */
const STYLE_DEMO_GRAY = "#808080";

export class GlobalStyleModal extends Modal {
	private preview: LiveCalloutPreview | null = null;

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
		this.preview = new LiveCalloutPreview(this.app, previewCol, {
			title: t("settings.previewTitle"),
			initialText: this.buildSampleText(),
			beforeRender: () => {
				this.plugin.registry.setPreviewDefinition(
					this.buildDemoDefinition(),
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
