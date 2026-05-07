/**
 * settings/editor/types.ts — Narrow plugin interface required by the editor sub-modules.
 *
 * Defines CalloutEditorPlugin: a structural interface with only the properties
 * and methods that CalloutEditor, CalloutEditorSave, CalloutEditorValidation,
 * and CalloutEditorIconRenderer actually need. Using this interface instead of
 * the concrete plugin class breaks circular import chains.
 */
import type { App } from "obsidian";
import type { CalloutRegistry } from "../../manager/CalloutRegistry";
import type {
	CalloutIcon,
	MaterialIconStyle,
	PluginSettings,
} from "../../types";

export interface CalloutEditorPlugin {
	app: App;
	registry: CalloutRegistry;
	settings: PluginSettings;
	pruneSuspended: boolean;
	saveSettings(): Promise<void>;
	schedulePruneUnusedFallbacks(delayMs?: number): void;
	cacheMaterialSvg(icon: CalloutIcon): Promise<void>;
	hasMaterialSvgFailed(
		name: string,
		style: MaterialIconStyle,
		weight: number,
	): boolean;
}
