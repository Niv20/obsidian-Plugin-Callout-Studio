/**
 * settings/sections/LanguageSection.ts — UI display language selector.
 *
 * Renders a dropdown that lets the user pick the plugin's display language.
 * The default ("auto") follows Obsidian's interface language; any other value
 * forces a specific locale. Each language is listed under its own native name
 * (e.g. "עברית", not "Hebrew"). The choice is persisted in PluginSettings and
 * re-rendering the tab refreshes every label in the new language.
 */
import { Setting } from "obsidian";
import { getSelectableLocales, setLocale, t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

export function renderLanguageSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl).setName(t("settings.language")).setHeading();

	new Setting(containerEl)
		.setName(t("settings.language"))
		.setDesc(t("settings.languageDesc"))
		.addDropdown((dd) => {
			dd.addOption("auto", t("settings.languageAuto"));
			for (const { code, name } of getSelectableLocales()) {
				dd.addOption(code, name);
			}
			dd.setValue(ctx.plugin.settings.language).onChange(async (val) => {
				ctx.plugin.settings.language = val;
				setLocale(val);
				await ctx.plugin.saveSettings();
				// Re-render the whole tab so every label picks up the new locale.
				ctx.display();
			});
		});
}
