import { Setting } from "obsidian";
import { t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

export function renderContextMenuSettingsSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { contextMenu } = ctx.plugin.settings;

	new Setting(containerEl).setName(t("settings.contextMenu")).setHeading();

	const itemsContainer = containerEl.createDiv();

	const renderItems = (): void => {
		itemsContainer.empty();
		if (!contextMenu.enabled) return;

		new Setting(itemsContainer)
			.setName(t("settings.showEditCallout"))
			.addToggle((tog) =>
				tog
					.setValue(contextMenu.showEditCallout)
					.onChange(async (v) => {
						contextMenu.showEditCallout = v;
						await ctx.plugin.saveSettings();
					}),
			);

		new Setting(itemsContainer)
			.setName(t("settings.showOpenSettings"))
			.addToggle((tog) =>
				tog
					.setValue(contextMenu.showOpenSettings)
					.onChange(async (v) => {
						contextMenu.showOpenSettings = v;
						await ctx.plugin.saveSettings();
					}),
			);

		new Setting(itemsContainer)
			.setName(t("settings.showCopyMarkdown"))
			.addToggle((tog) =>
				tog
					.setValue(contextMenu.showCopyMarkdown)
					.onChange(async (v) => {
						contextMenu.showCopyMarkdown = v;
						await ctx.plugin.saveSettings();
					}),
			);
	};

	new Setting(containerEl)
		.setName(t("settings.enableContextMenu"))
		.setDesc(t("settings.enableContextMenuDesc"))
		.addToggle((tog) =>
			tog.setValue(contextMenu.enabled).onChange(async (v) => {
				contextMenu.enabled = v;
				await ctx.plugin.saveSettings();
				renderItems();
			}),
		);

	containerEl.appendChild(itemsContainer);
	renderItems();
}

export function renderAutocompleteSettingsSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { autocomplete } = ctx.plugin.settings;

	new Setting(containerEl).setName(t("settings.autocomplete")).setHeading();

	const itemsContainer = containerEl.createDiv();

	const renderItems = (): void => {
		itemsContainer.empty();
		if (!autocomplete.enabled) return;

		new Setting(itemsContainer)
			.setName(t("settings.showIconPreviews"))
			.addToggle((tog) =>
				tog
					.setValue(autocomplete.showIconPreviews)
					.onChange(async (v) => {
						autocomplete.showIconPreviews = v;
						await ctx.plugin.saveSettings();
					}),
			);

		new Setting(itemsContainer)
			.setName(t("settings.showColorPreviews"))
			.addToggle((tog) =>
				tog
					.setValue(autocomplete.showColorPreviews)
					.onChange(async (v) => {
						autocomplete.showColorPreviews = v;
						await ctx.plugin.saveSettings();
					}),
			);
	};

	new Setting(containerEl)
		.setName(t("settings.enableAutocomplete"))
		.setDesc(t("settings.enableAutocompleteDesc"))
		.addToggle((tog) =>
			tog.setValue(autocomplete.enabled).onChange(async (v) => {
				autocomplete.enabled = v;
				await ctx.plugin.saveSettings();
				renderItems();
			}),
		);

	containerEl.appendChild(itemsContainer);
	renderItems();
}
