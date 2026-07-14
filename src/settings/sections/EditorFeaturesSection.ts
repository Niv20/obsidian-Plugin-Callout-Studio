/**
 * settings/sections/EditorFeaturesSection.ts — Autocomplete and context-menu settings.
 *
 * Renders two sections: one for the in-editor callout autocomplete and one for
 * the right-click context menu. The context menu is always enabled and only
 * exposes menu-item customization; autocomplete exposes an enable/disable toggle.
 * Changes are saved immediately via ctx.plugin.saveSettings().
 */
import { Setting } from "obsidian";
import { t } from "../../i18n";
import { MenuCustomizationModal } from "../MenuCustomizationModal";
import type { SettingsSectionContext } from "./types";

export function renderContextMenuSettingsSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl).setName(t("settings.contextMenu")).setHeading();

	new Setting(containerEl)
		.setName(t("settings.customizeMenu"))
		.setDesc(t("settings.customizeMenuDesc"))
		.addButton((btn) =>
			btn.setButtonText(t("settings.customizeMenuButton")).onClick(() => {
				new MenuCustomizationModal(ctx.app, ctx.plugin).open();
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
