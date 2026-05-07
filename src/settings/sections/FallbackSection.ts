import { Setting } from "obsidian";
import { getLocale, t } from "../../i18n";
import { sortCalloutsById } from "../../utils/sorting";
import type { SettingsSectionContext } from "./types";

export function renderFallbackSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl)
		.setName(t("settings.fallbackCallout"))
		.setHeading();

	new Setting(containerEl)
		.setName(t("settings.fallbackCallout"))
		.setDesc(t("settings.fallbackCalloutDesc"))
		.addDropdown((dd) => {
			const allCallouts = sortCalloutsById(
				ctx.plugin.registry.getAll(),
				getLocale(),
			);
			for (const c of allCallouts) {
				dd.addOption(c.id, `${c.displayName} (${c.id})`);
			}
			dd.setValue(ctx.plugin.settings.fallbackCalloutId).onChange(
				async (val) => {
					ctx.plugin.settings.fallbackCalloutId = val;
					ctx.plugin.restyleUncustomizedFallbackRows();
					await ctx.plugin.saveSettings();
					ctx.plugin.refreshCallouts();
				},
			);
		});
}
