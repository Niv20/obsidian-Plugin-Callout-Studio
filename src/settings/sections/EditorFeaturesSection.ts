/**
 * settings/sections/EditorFeaturesSection.ts — Autocomplete and context-menu settings.
 *
 * Renders two sections: one for the in-editor callout autocomplete and one for
 * the right-click context menu. Each exposes a single enable/disable toggle;
 * their sub-features (icon/color previews, individual menu items) are always on.
 * Changes are saved immediately via ctx.plugin.saveSettings().
 */
import { Setting } from "obsidian";
import { t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

export function renderContextMenuSettingsSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { contextMenu } = ctx.plugin.settings;

	new Setting(containerEl).setName(t("settings.contextMenu")).setHeading();

	new Setting(containerEl)
		.setName(t("settings.enableContextMenu"))
		.setDesc(t("settings.enableContextMenuDesc"))
		.addToggle((tog) =>
			tog.setValue(contextMenu.enabled).onChange(async (v) => {
				contextMenu.enabled = v;
				await ctx.plugin.saveSettings();
			}),
		);
}

export function renderAutocompleteSettingsSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { autocomplete } = ctx.plugin.settings;

	new Setting(containerEl).setName(t("settings.autocomplete")).setHeading();

	new Setting(containerEl)
		.setName(t("settings.enableAutocomplete"))
		.setDesc(t("settings.enableAutocompleteDesc"))
		.addToggle((tog) =>
			tog.setValue(autocomplete.enabled).onChange(async (v) => {
				autocomplete.enabled = v;
				await ctx.plugin.saveSettings();
			}),
		);
}
