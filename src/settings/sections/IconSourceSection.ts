import { Modal, Setting } from "obsidian";
import { t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

export function renderIconSourceSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { iconSources } = ctx.plugin.settings;

	new Setting(containerEl)
		.setName(t("settings.iconSources"))
		.setDesc(t("settings.iconSourcesDesc"))
		.setHeading();

	new Setting(containerEl)
		.setName(t("settings.materialStyleDefault"))
		.addDropdown((d) =>
			d
				.addOptions({
					outlined: t("settings.styleOutlined"),
					filled: t("settings.styleFilled"),
					rounded: t("settings.styleRounded"),
					sharp: t("settings.styleSharp"),
				})
				.setValue(iconSources.materialStyleDefault)
				.onChange(async (v: string) => {
					iconSources.materialStyleDefault =
						v as typeof iconSources.materialStyleDefault;
					await ctx.plugin.saveSettings();
				}),
		);

	new Setting(containerEl)
		.setName(t("settings.materialWeightDefault"))
		.setDesc(t("settings.materialWeightDefaultDesc"))
		.addDropdown((d) => {
			const weights: Record<string, string> = {
				"100": "100 (Thin)",
				"200": "200 (Extra Light)",
				"300": "300 (Light)",
				"400": "400 (Regular)",
				"500": "500 (Medium)",
				"600": "600 (Semi Bold)",
				"700": "700 (Bold)",
			};
			d.addOptions(weights)
				.setValue(String(iconSources.materialWeightDefault))
				.onChange(async (v: string) => {
					iconSources.materialWeightDefault = parseInt(v, 10);
					await ctx.plugin.saveSettings();
				});
		});

	const svgCount = ctx.plugin.registry.materialSvgCache.length;
	const svgSize = ctx.plugin.registry.getMaterialSvgCacheSize();
	const svgSizeStr =
		svgSize < 1024 ? `${svgSize} B` : `${(svgSize / 1024).toFixed(1)} KB`;

	const cacheSetting = new Setting(containerEl)
		.setName(t("settings.materialCache"))
		.setDesc(
			svgCount > 0
				? t("settings.svgCacheInfo", {
						count: String(svgCount),
						size: svgSizeStr,
					})
				: t("settings.svgCacheEmpty"),
		);
	cacheSetting.settingEl.addClass("callout-studio-cache-heading");

	if (svgCount > 0) {
		cacheSetting.addButton((btn) =>
			btn.setButtonText(t("settings.viewCachedSvgs")).onClick(() => {
				openSvgCacheModal(ctx);
			}),
		);
	}
}

function openSvgCacheModal(ctx: SettingsSectionContext): void {
	const modal = new Modal(ctx.app);
	modal.titleEl.setText(t("settings.cachedSvgsTitle"));
	modal.modalEl.addClass("callout-studio-cache-modal");

	const cache = ctx.plugin.registry.materialSvgCache;

	if (cache.length === 0) {
		modal.contentEl.createEl("p", {
			text: t("settings.svgCacheEmpty"),
		});
		modal.open();
		return;
	}

	const grid = modal.contentEl.createDiv({
		cls: "callout-studio-cache-grid",
	});
	for (const entry of cache) {
		const cell = grid.createDiv({ cls: "callout-studio-cache-cell" });

		const iconEl = cell.createDiv({
			cls: "callout-studio-cache-icon",
		});
		const parser = new DOMParser();
		const doc = parser.parseFromString(entry.svg, "image/svg+xml");
		const svgEl = doc.documentElement;
		svgEl.setAttribute("fill", "currentColor");
		iconEl.appendChild(iconEl.doc.importNode(svgEl, true));

		const label = cell.createDiv({
			cls: "callout-studio-cache-label",
		});
		label.setText(entry.name);
		const meta = cell.createDiv({
			cls: "callout-studio-cache-meta",
		});
		meta.setText(`${entry.style} · ${entry.weight}`);
	}

	modal.open();
}
