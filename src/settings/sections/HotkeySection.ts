import { Notice, Setting } from "obsidian";
import { t } from "../../i18n";
import type { App } from "obsidian";
import type { SettingsSectionContext } from "./types";

type ObsidianSettingsPane = {
	open?: () => void;
	openTabById?: (id: string) => void;
};

type AppWithSettingsPane = App & {
	setting?: ObsidianSettingsPane;
};

const HOTKEY_SEARCH_MAX_ATTEMPTS = 12;
const HOTKEY_SEARCH_RETRY_MS = 50;

export function renderHotkeySection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl)
		.setName(t("settings.keyboardShortcuts"))
		.setHeading();

	new Setting(containerEl)
		.setName(t("settings.openHotkeys"))
		.setDesc(t("settings.openHotkeysDesc"))
		.addButton((btn) => {
			btn.setButtonText(t("settings.openHotkeysButton")).onClick(() =>
				openObsidianHotkeys(ctx),
			);
			btn.buttonEl.addClass("cs-settings-neutral-btn");
		});
}

function openObsidianHotkeys(ctx: SettingsSectionContext): void {
	const settingsPane = (ctx.app as AppWithSettingsPane).setting;

	if (!settingsPane?.openTabById) {
		new Notice(t("notice.openHotkeysFailed"));
		return;
	}

	try {
		settingsPane.open?.();
		settingsPane.openTabById("hotkeys");
		filterHotkeysToPlugin(ctx, 1);
	} catch {
		new Notice(t("notice.openHotkeysFailed"));
	}
}

function filterHotkeysToPlugin(
	ctx: SettingsSectionContext,
	attempt: number,
): void {
	if (applyHotkeySearchFilter(ctx.plugin.manifest.name)) return;

	if (attempt >= HOTKEY_SEARCH_MAX_ATTEMPTS) {
		new Notice(t("notice.filterHotkeysFailed"));
		return;
	}

	window.setTimeout(() => {
		filterHotkeysToPlugin(ctx, attempt + 1);
	}, HOTKEY_SEARCH_RETRY_MS);
}

function applyHotkeySearchFilter(query: string): boolean {
	const settingsModal = document.querySelector<HTMLElement>(
		".modal.mod-settings",
	);
	const searchRoot =
		settingsModal?.querySelector<HTMLElement>(
			".vertical-tab-content-container",
		) ?? settingsModal;

	if (!searchRoot) return false;

	const searchInput = findVisibleInput(searchRoot, [
		"input[type='search']",
		".search-input-container input",
		"input[placeholder]",
	]);

	if (!searchInput) return false;

	searchInput.focus();
	searchInput.value = query;
	searchInput.dispatchEvent(new Event("input", { bubbles: true }));
	searchInput.dispatchEvent(new Event("change", { bubbles: true }));
	searchInput.select();
	return true;
}

function findVisibleInput(
	root: HTMLElement,
	selectors: string[],
): HTMLInputElement | null {
	for (const selector of selectors) {
		const inputs = Array.from(
			root.querySelectorAll<HTMLInputElement>(selector),
		);
		const visibleInput = inputs.find(
			(input) =>
				!input.disabled &&
				!input.readOnly &&
				input.getClientRects().length > 0,
		);

		if (visibleInput) return visibleInput;
	}

	return null;
}
