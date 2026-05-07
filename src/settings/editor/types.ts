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
