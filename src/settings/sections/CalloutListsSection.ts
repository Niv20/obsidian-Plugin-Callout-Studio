import { Setting } from "obsidian";
import { getLocale, t } from "../../i18n";
import { sortCalloutsByDisplayName } from "../../utils/sorting";
import type { CalloutDefinition } from "../../types";
import type { SettingsSectionContext } from "./types";

export type CalloutListsController = {
	render: (containerEl: HTMLElement) => void;
	refresh: () => void;
};

type CreateCalloutListsControllerOptions = {
	onAddNewCallout: () => Promise<void>;
	renderRow: (
		containerEl: HTMLElement,
		def: CalloutDefinition,
		isBuiltIn: boolean,
	) => void;
};

export function createCalloutListsController(
	ctx: SettingsSectionContext,
	options: CreateCalloutListsControllerOptions,
): CalloutListsController {
	let userListEl: HTMLElement | null = null;
	let builtInListEl: HTMLElement | null = null;

	const renderUserList = (): void => {
		if (!userListEl) return;
		userListEl.empty();

		const locale = getLocale();
		const userCallouts = sortCalloutsByDisplayName(
			ctx.plugin.registry.getUserDefined(),
			locale,
		);
		if (userCallouts.length === 0) {
			userListEl.createDiv({
				cls: "callout-studio-empty-state",
				text: t("settings.noCalloutsNow"),
			});
			return;
		}

		const listEl = userListEl.createDiv({
			cls: "callout-studio-callout-list",
		});
		for (const def of userCallouts) {
			options.renderRow(listEl, def, false);
		}
	};

	const renderBuiltInList = (): void => {
		if (!builtInListEl) return;
		builtInListEl.empty();

		const locale = getLocale();
		const builtInCallouts = sortCalloutsByDisplayName(
			ctx.plugin.registry.getBuiltIn(),
			locale,
		);
		const listEl = builtInListEl.createDiv({
			cls: "callout-studio-callout-list",
		});

		for (const def of builtInCallouts) {
			options.renderRow(listEl, def, true);
		}
	};

	return {
		render: (containerEl: HTMLElement) => {
			const headerSetting = new Setting(containerEl)
				.setName(t("settings.title"))
				.setHeading();
			headerSetting.settingEl.addClass("cs-header-row");

			const subSetting = new Setting(containerEl)
				.setName(t("settings.myCalloutTypes"))
				.setHeading();
			subSetting.settingEl.addClass("cs-subheader-row");
			subSetting.addButton((btn) =>
				btn
					.setButtonText(t("settings.addNewCallout"))
					.setCta()
					.onClick(() => {
						void options.onAddNewCallout();
					}),
			);

			userListEl = containerEl.createDiv();
			renderUserList();

			new Setting(containerEl)
				.setName(t("settings.builtInCallouts"))
				.setHeading();
			builtInListEl = containerEl.createDiv();
			renderBuiltInList();
		},
		refresh: () => {
			renderUserList();
			renderBuiltInList();
		},
	};
}
