/**
 * editor/commands.ts — Registers all user-facing Obsidian commands.
 *
 * Calls plugin.addCommand() for each stable command ID (open-settings,
 * create-callout, callout-wrap, callout-unwrap). Command implementations
 * delegate to CalloutBlockTools or open the CalloutEditor modal.
 * Command IDs must never be renamed after release because users may have
 * them bound to hotkeys.
 */
import type { Command, Plugin } from "obsidian";
import { CalloutEditor } from "../settings/CalloutEditor";
import type { CalloutAutoComplete } from "./AutoComplete";
import {
	insertEmptyCallout,
	unwrapCalloutAtSelection,
	wrapSelectionInCallout,
} from "./CalloutBlockTools";
import { t } from "../i18n";
import type { PluginSettings } from "../types";

interface SettingsApi {
	open?: () => void;
	openTabById?: (id: string) => void;
}

/**
 * The five commands the plugin always registers. Stable API — never rename one.
 */
export type FixedCommandId =
	| "open-settings"
	| "create-callout"
	| "insert-empty-callout"
	| "callout-wrap"
	| "callout-unwrap";

/**
 * The name key behind each fixed command.
 *
 * A total record, so a new fixed command cannot be declared without a name, and
 * the command builder can list all five without keeping a second copy of the
 * ids — a display list that drifted from what is really registered would
 * deep-link the user to a command that isn't there.
 */
export const FIXED_COMMAND_NAME_KEYS: Record<FixedCommandId, string> = {
	"open-settings": "cmd.openSettings",
	"create-callout": "cmd.createCallout",
	"insert-empty-callout": "cmd.insertEmptyCallout",
	"callout-wrap": "cmd.calloutWrap",
	"callout-unwrap": "cmd.calloutUnwrap",
};

/** The fixed commands in the order they are registered below. */
export const FIXED_COMMAND_IDS: readonly FixedCommandId[] = [
	"open-settings",
	"create-callout",
	"insert-empty-callout",
	"callout-wrap",
	"callout-unwrap",
];

interface CommandHostPlugin extends Plugin {
	app: Plugin["app"] & { setting?: SettingsApi };
	autoComplete: CalloutAutoComplete;
	settings: PluginSettings;
}

/**
 * Builds one fixed command's `addCommand` payload. Split out from
 * {@link registerCalloutCommands} so the same definition can be (re)handed to
 * `addCommand` from {@link setFixedCommandEnabled} when a single command is
 * switched back on, without the two falling out of sync.
 */
function buildFixedCommand(
	id: FixedCommandId,
	plugin: CommandHostPlugin,
	openEditor: () => CalloutEditor,
): Command {
	const name = t(FIXED_COMMAND_NAME_KEYS[id]);
	switch (id) {
		case "open-settings":
			return {
				id,
				name,
				callback: () => {
					plugin.app.setting?.open?.();
					plugin.app.setting?.openTabById?.(plugin.manifest.id);
				},
			};
		case "create-callout":
			return {
				id,
				name,
				callback: () => {
					void openEditor().openAndWait();
				},
			};
		case "insert-empty-callout":
			return {
				id,
				name,
				editorCallback: (editor) => {
					if (insertEmptyCallout(editor)) {
						plugin.autoComplete.triggerNow(
							editor,
							plugin.app.workspace.getActiveFile(),
						);
					}
				},
			};
		case "callout-wrap":
			return {
				id,
				name,
				editorCallback: (editor) => {
					if (wrapSelectionInCallout(editor)) {
						plugin.autoComplete.triggerNow(
							editor,
							plugin.app.workspace.getActiveFile(),
						);
					}
				},
			};
		case "callout-unwrap":
			return {
				id,
				name,
				editorCallback: (editor) => {
					unwrapCalloutAtSelection(editor);
				},
			};
	}
}

/**
 * Registers all user-facing editor commands. Command IDs are stable and
 * must not change across releases. A command the user turned off (see
 * {@link isFixedCommandEnabled}) is skipped here — it is only (re)registered
 * once the user switches it back on, through {@link setFixedCommandEnabled}.
 */
export function registerCalloutCommands(
	plugin: CommandHostPlugin,
	openEditor: () => CalloutEditor,
): void {
	for (const id of FIXED_COMMAND_IDS) {
		if (!isFixedCommandEnabled(plugin.settings, id)) continue;
		const command = buildFixedCommand(id, plugin, openEditor);
		registeredNames.set(id, command.name);
		plugin.addCommand(command);
	}
}

/**
 * The name each fixed command is currently registered under, so a refresh can
 * tell a real language change from a no-op.
 */
const registeredNames = new Map<FixedCommandId, string>();

/**
 * Re-register the fixed commands whose displayed name has changed.
 *
 * The command palette snapshots a name when the command is added, and
 * {@link registerCalloutCommands} only runs at startup — so without this, the
 * translations that arrive after a download (or when the user picks a different
 * language) leave the palette in the old language until Obsidian restarts.
 *
 * Re-adding under the **same id** is what makes this safe: Obsidian keys the
 * user's hotkey by command id, so the binding survives. Only a changed name
 * triggers the call, because `addCommand` mutates its argument and appends an
 * unload callback — doing it needlessly would accumulate both.
 */
export function refreshFixedCommandNames(
	plugin: CommandHostPlugin,
	openEditor: () => CalloutEditor,
): void {
	for (const id of FIXED_COMMAND_IDS) {
		if (!isFixedCommandEnabled(plugin.settings, id)) continue;
		const name = t(FIXED_COMMAND_NAME_KEYS[id]);
		if (registeredNames.get(id) === name) continue;
		registeredNames.set(id, name);
		plugin.addCommand(buildFixedCommand(id, plugin, openEditor));
	}
}

/** Whether a fixed command is currently switched on. */
export function isFixedCommandEnabled(
	settings: Pick<PluginSettings, "disabledFixedCommands">,
	id: FixedCommandId,
): boolean {
	return !settings.disabledFixedCommands.includes(id);
}

/**
 * Turn a single fixed command on or off at runtime, from the command
 * builder — the plugin's own save-on-change convention, so there is nothing
 * further for a caller to persist beyond the settings write this leaves to
 * do (`plugin.saveSettings()`).
 *
 * A disabled command is torn down with `removeCommand` rather than left
 * registered but hidden, so it also disappears from the command palette and
 * the hotkeys pane — not just from this window. Obsidian clears only a
 * removed command's *default* hotkeys, never the user's own, so whatever the
 * user bound is there again the moment {@link buildFixedCommand} re-registers
 * it under the same id.
 */
export function setFixedCommandEnabled(
	plugin: CommandHostPlugin,
	openEditor: () => CalloutEditor,
	id: FixedCommandId,
	enabled: boolean,
): void {
	const disabled = plugin.settings.disabledFixedCommands;
	const index = disabled.indexOf(id);
	if (enabled) {
		if (index >= 0) disabled.splice(index, 1);
		const command = buildFixedCommand(id, plugin, openEditor);
		registeredNames.set(id, command.name);
		plugin.addCommand(command);
	} else {
		if (index < 0) disabled.push(id);
		registeredNames.delete(id);
		plugin.removeCommand(id);
	}
}
