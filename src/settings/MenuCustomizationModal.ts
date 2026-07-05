/**
 * settings/MenuCustomizationModal.ts — Customize the right-click menu.
 *
 * Presents three stacked sections (one per render role). Each lists that
 * role's menu items with an enable/disable toggle and up/down reorder
 * buttons. Reordering uses buttons rather than HTML5 drag because the plugin
 * also runs on mobile (isDesktopOnly: false), where drag-to-reorder is
 * awkward. Every change is saved immediately (matching the plugin's
 * save-on-change convention) — there is no OK/Cancel.
 */
import { Modal, Setting } from "obsidian";
import type { App } from "obsidian";
import { t } from "../i18n";
import type {
	CalloutRenderRole,
	ContextMenuItemConfig,
	ContextMenuItemId,
	PluginSettings,
} from "../types";

/** Narrow structural host — the plugin instance satisfies this. */
export interface MenuCustomizationHost {
	settings: PluginSettings;
	saveSettings(): Promise<void>;
}

const ROLE_ORDER: CalloutRenderRole[] = ["regular", "heading", "inline"];

/** i18n key for each role's section heading. */
const ROLE_TITLE_KEY: Record<CalloutRenderRole, string> = {
	regular: "menuCustomize.regular",
	heading: "menuCustomize.heading",
	inline: "menuCustomize.inline",
};

/** i18n key for each menu item's label. */
const ITEM_LABEL_KEY: Record<ContextMenuItemId, string> = {
	edit: "menuItem.edit",
	openSettings: "menuItem.openSettings",
	copyMarkdown: "menuItem.copyMarkdown",
	foldDefaults: "menuItem.foldDefaults",
	cutSection: "menuItem.cutSection",
	copySection: "menuItem.copySection",
	deleteSection: "menuItem.deleteSection",
};

export class MenuCustomizationModal extends Modal {
	constructor(
		app: App,
		private readonly host: MenuCustomizationHost,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(t("menuCustomize.title"));
		this.contentEl.createEl("p", {
			text: t("menuCustomize.desc"),
			cls: "setting-item-description",
		});
		for (const role of ROLE_ORDER) this.renderRole(role);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderRole(role: CalloutRenderRole): void {
		new Setting(this.contentEl).setName(t(ROLE_TITLE_KEY[role])).setHeading();
		const listEl = this.contentEl.createDiv({
			cls: "cs-menu-customize-list",
		});
		this.renderRoleList(role, listEl);
	}

	/** (Re)render a single role's item rows in place. */
	private renderRoleList(role: CalloutRenderRole, listEl: HTMLElement): void {
		listEl.empty();
		const items = this.host.settings.contextMenu.items[role];
		items.forEach((item, index) => {
			this.renderRow(role, listEl, item, index, items.length);
		});
	}

	private renderRow(
		role: CalloutRenderRole,
		listEl: HTMLElement,
		item: ContextMenuItemConfig,
		index: number,
		count: number,
	): void {
		const rerender = (): void => this.renderRoleList(role, listEl);
		const items = this.host.settings.contextMenu.items[role];

		new Setting(listEl)
			.setName(t(ITEM_LABEL_KEY[item.id]))
			.addExtraButton((btn) =>
				btn
					.setIcon("chevron-up")
					.setTooltip(t("menuCustomize.moveUp"))
					.setDisabled(index === 0)
					.onClick(async () => {
						if (index === 0) return;
						swap(items, index, index - 1);
						await this.host.saveSettings();
						rerender();
					}),
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("chevron-down")
					.setTooltip(t("menuCustomize.moveDown"))
					.setDisabled(index === count - 1)
					.onClick(async () => {
						if (index === count - 1) return;
						swap(items, index, index + 1);
						await this.host.saveSettings();
						rerender();
					}),
			)
			.addToggle((tog) =>
				tog.setValue(item.enabled).onChange(async (v) => {
					item.enabled = v;
					await this.host.saveSettings();
				}),
			);
	}
}

function swap<T>(arr: T[], a: number, b: number): void {
	const tmp = arr[a]!;
	arr[a] = arr[b]!;
	arr[b] = tmp;
}
