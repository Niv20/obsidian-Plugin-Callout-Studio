/**
 * settings/sections/LanguageSection.ts — UI display language selector.
 *
 * Renders a dropdown that lets the user pick the plugin's display language.
 * The default ("auto") follows Obsidian's interface language; any other value
 * forces a specific locale. Each language is listed under its own native name
 * (e.g. "עברית", not "Hebrew"). The choice is persisted in PluginSettings and
 * re-rendering the tab refreshes every label in the new language.
 *
 * Only English is bundled, so picking a language may have to fetch it first
 * (see i18n/LocaleStore.ts). Every language is offered whether or not it is
 * downloaded: choosing one is what triggers the download, and the list would be
 * useless if it only showed what the user already had. When the fetch cannot
 * happen — offline, or a blocked CDN — the choice is still kept and the UI
 * stays English until it succeeds, which is the honest outcome. Silently
 * reverting the dropdown would look like the click had not registered.
 */
import { Setting } from "obsidian";
import { getSelectableLocales, resolveLocaleFile, setLocale, t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

export function renderLanguageSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl).setName(t("settings.language")).setHeading();

	const setting = new Setting(containerEl)
		.setName(t("settings.language"))
		.setDesc(t("settings.languageDesc"));

	setting.addDropdown((dd) => {
		dd.addOption("auto", t("settings.languageAuto"));
		for (const { code, name } of getSelectableLocales()) {
			dd.addOption(code, name);
		}
		dd.setValue(ctx.plugin.settings.language).onChange(async (val) => {
			ctx.plugin.settings.language = val;
			await ctx.plugin.saveSettings();

			// Nothing to fetch for English, or for a language already on disk —
			// the common case, and it must not flicker a spinner.
			if (ctx.plugin.locales.isReady(val)) {
				setLocale(val);
				ctx.display();
				ctx.plugin.applyLocaleChange();
				return;
			}

			dd.setDisabled(true);
			setting.setDesc(t("locale.downloading"));
			// ensureLocale applies the new language itself, including the
			// command names and the rendered notes, so there is nothing to do
			// here but redraw: on success every label has changed language, and
			// on failure the warning below has to replace the "Downloading…"
			// text this row is still showing.
			await ctx.plugin.ensureLocale();
			ctx.display();
		});
	});

	renderUnavailableWarning(ctx, containerEl);
}

/**
 * Explain a language that is selected but not downloaded, and offer a retry.
 *
 * Drawn from settings rather than from the download's failure path, so it is
 * still there after the tab is closed and reopened — the state it describes
 * outlives the click that produced it.
 */
function renderUnavailableWarning(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const pref = ctx.plugin.settings.language;
	if (!resolveLocaleFile(pref) || ctx.plugin.locales.isReady(pref)) return;

	const name =
		getSelectableLocales().find(({ code }) => code === pref)?.name ??
		t("settings.languageAuto");

	new Setting(containerEl)
		.setClass("callout-studio-locale-warning")
		.setName(t("locale.notDownloaded", { name }))
		.setDesc(t("locale.notDownloadedDesc"))
		.addButton((btn) =>
			btn
				.setButtonText(t("locale.retry"))
				.setCta()
				.onClick(async () => {
					btn.setDisabled(true);
					btn.setButtonText(t("locale.downloading"));
					await ctx.plugin.ensureLocale();
					ctx.display();
				}),
		);
}
