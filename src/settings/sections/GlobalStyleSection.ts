import { Setting, type SliderComponent } from "obsidian";
import { t } from "../../i18n";
import {
	createAnimatedNumberLabel,
	type AnimatedNumberLabel,
	type AnimatedNumberLabelOptions,
} from "../../ui/AnimatedNumberLabel";
import type { SettingsSectionContext } from "./types";

export function renderGlobalStyleSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { globalStyle } = ctx.plugin.settings;

	const heading = new Setting(containerEl)
		.setName(t("settings.globalStyle"))
		.setHeading();
	heading.descEl.setText(t("settings.globalStyleDesc"));

	const addSliderRow = (
		parentEl: HTMLElement,
		label: string,
		numberOptions: AnimatedNumberLabelOptions,
		configure: (
			slider: SliderComponent,
			valueLabel: AnimatedNumberLabel,
		) => void,
	): void => {
		const row = parentEl.createDiv({
			cls: "callout-studio-slider-row",
		});
		const labelEl = row.createDiv({
			cls: "callout-studio-slider-label",
		});
		labelEl.createSpan({ text: label });
		const valueLabel = createAnimatedNumberLabel(labelEl, numberOptions);

		new Setting(row).addSlider((slider) => configure(slider, valueLabel));
	};

	const wrapper = containerEl.createDiv({
		cls: "callout-studio-preview-panel cs-global-style-wrapper",
	});

	const previewCol = wrapper.createDiv({
		cls: "callout-studio-preview-col cs-global-preview-col",
	});
	const previewContainer = previewCol.createDiv({
		cls: "callout-studio-preview-container cs-global-preview-card",
	});
	const previewHeader = previewContainer.createDiv({
		cls: "callout-studio-preview-header",
	});
	previewHeader.createSpan({ text: t("settings.previewTitle") });

	const previewCard = previewContainer.createDiv({
		cls: "callout-studio-preview cs-global-preview-body",
	});

	const updatePreview = () => {
		previewCard.empty();
		const callout = previewCard.createDiv({
			cls: "callout cs-global-preview-callout cs-global-preview-locked",
			attr: { "data-callout": "cs-preview" },
		});

		callout.setCssProps({
			"--cs-preview-radius": `${globalStyle.borderRadius}px`,
			"--callout-color": "136, 136, 136",
		});

		const { top, right, bottom, left } = globalStyle.borderSides;
		const allSides = top && right && bottom && left;
		const anySide = top || right || bottom || left;
		const bStyle = `${globalStyle.borderWidth}px solid rgba(var(--callout-color), 0.45)`;

		if (allSides) {
			callout.setCssProps({
				"--cs-preview-border": bStyle,
				"--cs-preview-border-top": bStyle,
				"--cs-preview-border-right": bStyle,
				"--cs-preview-border-bottom": bStyle,
				"--cs-preview-border-left": bStyle,
			});
		} else if (anySide) {
			callout.setCssProps({
				"--cs-preview-border": "none",
				"--cs-preview-border-top": top ? bStyle : "none",
				"--cs-preview-border-right": right ? bStyle : "none",
				"--cs-preview-border-bottom": bottom ? bStyle : "none",
				"--cs-preview-border-left": left ? bStyle : "none",
			});
		} else {
			callout.setCssProps({
				"--cs-preview-border": "none",
				"--cs-preview-border-top": "none",
				"--cs-preview-border-right": "none",
				"--cs-preview-border-bottom": "none",
				"--cs-preview-border-left": "none",
			});
		}

		const titleRow = callout.createDiv({ cls: "callout-title" });
		titleRow.createDiv({
			cls: "callout-icon cs-preview-square-icon",
		});
		const titleInner = titleRow.createDiv({
			cls: "callout-title-inner",
		});
		titleInner.setText(t("settings.previewCalloutTitle"));
		titleInner.setCssProps({
			"--cs-preview-title-size": `${globalStyle.titleScale}em`,
		});

		const content = callout.createDiv({ cls: "callout-content" });
		const p = content.createEl("p");
		p.setText(t("settings.previewCalloutContent"));
		content.setCssProps({
			"--cs-preview-content-size": `${globalStyle.contentScale}em`,
		});
	};

	updatePreview();

	const controlsCol = wrapper.createDiv({
		cls: "callout-studio-adjust-col cs-global-controls-col",
	});

	const borderGroupEl = controlsCol.createDiv({
		cls: "callout-studio-adjust-section cs-settings-group",
	});
	borderGroupEl.createDiv({
		cls: "callout-studio-adjust-header cs-settings-group-header",
		text: t("settings.border"),
	});

	const borderSidesRow = borderGroupEl.createDiv({
		cls: "cs-border-sides-row",
	});

	const sides: {
		key: "top" | "right" | "bottom" | "left";
		label: string;
	}[] = [
		{ key: "top", label: t("settings.borderTop") },
		{ key: "right", label: t("settings.borderRight") },
		{ key: "bottom", label: t("settings.borderBottom") },
		{ key: "left", label: t("settings.borderLeft") },
	];

	const allActive =
		globalStyle.borderSides.top &&
		globalStyle.borderSides.right &&
		globalStyle.borderSides.bottom &&
		globalStyle.borderSides.left;

	const allBtn = borderSidesRow.createEl("button", {
		cls: `cs-border-side-btn${allActive ? " is-active" : ""}`,
		text: t("settings.borderAll"),
	});

	const sideButtons = new Map<string, HTMLButtonElement>();

	allBtn.addEventListener("click", () => {
		void (async () => {
			const nowAll =
				globalStyle.borderSides.top &&
				globalStyle.borderSides.right &&
				globalStyle.borderSides.bottom &&
				globalStyle.borderSides.left;
			const newVal = !nowAll;
			globalStyle.borderSides.top = newVal;
			globalStyle.borderSides.right = newVal;
			globalStyle.borderSides.bottom = newVal;
			globalStyle.borderSides.left = newVal;
			await ctx.plugin.saveSettings();
			ctx.plugin.cssInjector.inject();
			syncBorderUI();
			updatePreview();
		})();
	});

	for (const side of sides) {
		const active = globalStyle.borderSides[side.key];
		const btn = borderSidesRow.createEl("button", {
			cls: `cs-border-side-btn${active ? " is-active" : ""}`,
			text: side.label,
		});
		sideButtons.set(side.key, btn);
		btn.addEventListener("click", () => {
			void (async () => {
				globalStyle.borderSides[side.key] =
					!globalStyle.borderSides[side.key];
				await ctx.plugin.saveSettings();
				ctx.plugin.cssInjector.inject();
				syncBorderUI();
				updatePreview();
			})();
		});
	}

	const initialAnySideActive =
		globalStyle.borderSides.top ||
		globalStyle.borderSides.right ||
		globalStyle.borderSides.bottom ||
		globalStyle.borderSides.left;
	const borderWidthRow = borderGroupEl.createDiv({
		cls: initialAnySideActive ? "" : "cs-hidden",
	});
	addSliderRow(
		borderWidthRow,
		t("settings.borderWidth"),
		{
			initialValue: globalStyle.borderWidth,
			suffix: "px",
			format: { maximumFractionDigits: 1 },
		},
		(s, valueLabel) => {
			s.setLimits(1, 4, 0.5).setValue(globalStyle.borderWidth);
			s.sliderEl.addEventListener("input", () => {
				const v = Math.round(parseFloat(s.sliderEl.value) * 10) / 10;
				globalStyle.borderWidth = v;
				valueLabel.update(v);
				updatePreview();
				ctx.plugin.cssInjector.scheduleInject();
			});
			s.onChange(async (v) => {
				globalStyle.borderWidth = Math.round(v * 10) / 10;
				await ctx.plugin.saveSettings();
				ctx.plugin.cssInjector.inject();
			});
		},
	);

	const syncBorderUI = () => {
		const { top, right, bottom, left } = globalStyle.borderSides;
		const isAll = top && right && bottom && left;
		const isAny = top || right || bottom || left;
		allBtn.toggleClass("is-active", isAll);
		for (const side of sides) {
			sideButtons
				.get(side.key)
				?.toggleClass("is-active", globalStyle.borderSides[side.key]);
		}
		borderWidthRow.toggleClass("cs-hidden", !isAny);
	};

	const fontGroupEl = controlsCol.createDiv({
		cls: "callout-studio-adjust-section cs-settings-group",
	});
	fontGroupEl.createDiv({
		cls: "callout-studio-adjust-header cs-settings-group-header",
		text: t("settings.fontScaleGroup"),
	});

	addSliderRow(
		fontGroupEl,
		t("settings.titleScale"),
		{
			initialValue: globalStyle.titleScale,
			prefix: "×",
			format: {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			},
		},
		(s, valueLabel) => {
			s.setLimits(0.5, 1.5, 0.05).setValue(globalStyle.titleScale);
			s.sliderEl.addEventListener("input", () => {
				const v = Math.round(parseFloat(s.sliderEl.value) * 100) / 100;
				globalStyle.titleScale = v;
				valueLabel.update(v);
				updatePreview();
				ctx.plugin.cssInjector.scheduleInject();
			});
			s.onChange(async (v) => {
				globalStyle.titleScale = Math.round(v * 100) / 100;
				await ctx.plugin.saveSettings();
				ctx.plugin.cssInjector.inject();
			});
		},
	);

	addSliderRow(
		fontGroupEl,
		t("settings.contentScale"),
		{
			initialValue: globalStyle.contentScale,
			prefix: "×",
			format: {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			},
		},
		(s, valueLabel) => {
			s.setLimits(0.5, 1.5, 0.05).setValue(globalStyle.contentScale);
			s.sliderEl.addEventListener("input", () => {
				const v = Math.round(parseFloat(s.sliderEl.value) * 100) / 100;
				globalStyle.contentScale = v;
				valueLabel.update(v);
				updatePreview();
				ctx.plugin.cssInjector.scheduleInject();
			});
			s.onChange(async (v) => {
				globalStyle.contentScale = Math.round(v * 100) / 100;
				await ctx.plugin.saveSettings();
				ctx.plugin.cssInjector.inject();
			});
		},
	);

	const shapeGroupEl = controlsCol.createDiv({
		cls: "callout-studio-adjust-section cs-settings-group",
	});
	shapeGroupEl.createDiv({
		cls: "callout-studio-adjust-header cs-settings-group-header",
		text: t("settings.shapeGroup"),
	});

	addSliderRow(
		shapeGroupEl,
		t("settings.borderRadius"),
		{
			initialValue: globalStyle.borderRadius,
			suffix: "px",
			format: { maximumFractionDigits: 0 },
		},
		(s, valueLabel) => {
			s.setLimits(0, 24, 1).setValue(globalStyle.borderRadius);
			s.sliderEl.addEventListener("input", () => {
				const v = parseInt(s.sliderEl.value, 10);
				globalStyle.borderRadius = v;
				valueLabel.update(v);
				updatePreview();
				ctx.plugin.cssInjector.scheduleInject();
			});
			s.onChange(async (v) => {
				globalStyle.borderRadius = v;
				await ctx.plugin.saveSettings();
				ctx.plugin.cssInjector.inject();
			});
		},
	);
}
