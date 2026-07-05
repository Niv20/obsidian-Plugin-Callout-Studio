/**
 * editor/commands.ts — Registers all user-facing Obsidian commands.
 *
 * Calls plugin.addCommand() for each stable command ID (open-settings,
 * create-callout, callout-wrap, callout-unwrap). Command implementations
 * delegate to CalloutBlockTools or open the CalloutEditor modal.
 * Command IDs must never be renamed after release because users may have
 * them bound to hotkeys.
 */
import type { Plugin } from "obsidian";
import { CalloutEditor } from "../settings/CalloutEditor";
import type { CalloutAutoComplete } from "./AutoComplete";
import {
	insertEmptyCallout,
	unwrapCalloutAtSelection,
	wrapSelectionInCallout,
} from "./CalloutBlockTools";
import { t } from "../i18n";

interface SettingsApi {
	open?: () => void;
	openTabById?: (id: string) => void;
}

interface CommandHostPlugin extends Plugin {
	app: Plugin["app"] & { setting?: SettingsApi };
	autoComplete: CalloutAutoComplete;
}

/**
 * Registers all user-facing editor commands. Command IDs are stable and
 * must not change across releases.
 */
export function registerCalloutCommands(
	plugin: CommandHostPlugin,
	openEditor: () => CalloutEditor,
): void {
	plugin.addCommand({
		id: "open-settings",
		name: t("cmd.openSettings"),
		callback: () => {
			plugin.app.setting?.open?.();
			plugin.app.setting?.openTabById?.(plugin.manifest.id);
		},
	});

	plugin.addCommand({
		id: "create-callout",
		name: t("cmd.createCallout"),
		callback: () => {
			void openEditor().openAndWait();
		},
	});

	plugin.addCommand({
		id: "insert-empty-callout",
		name: t("cmd.insertEmptyCallout"),
		editorCallback: (editor) => {
			if (insertEmptyCallout(editor)) {
				plugin.autoComplete.triggerNow(
					editor,
					plugin.app.workspace.getActiveFile(),
				);
			}
		},
	});

	plugin.addCommand({
		id: "callout-wrap",
		name: t("cmd.calloutWrap"),
		editorCallback: (editor) => {
			if (wrapSelectionInCallout(editor)) {
				plugin.autoComplete.triggerNow(
					editor,
					plugin.app.workspace.getActiveFile(),
				);
			}
		},
	});

	plugin.addCommand({
		id: "callout-unwrap",
		name: t("cmd.calloutUnwrap"),
		editorCallback: (editor) => {
			unwrapCalloutAtSelection(editor);
		},
	});
}
