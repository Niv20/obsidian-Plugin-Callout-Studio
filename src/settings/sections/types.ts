/**
 * settings/sections/types.ts — Shared types for all settings section modules.
 *
 * Defines SettingsTabPlugin (what the settings tab needs from the plugin) and
 * SettingsSectionContext (the object passed to every render* function).
 * Using narrow structural interfaces here instead of the concrete plugin class
 * avoids tight coupling and potential import cycles.
 */
import type { App, Plugin, PluginManifest } from "obsidian";
import type { CalloutRegistry } from "../../manager/CalloutRegistry";
import type { CSSInjector } from "../../manager/CSSInjector";
import type {
	CalloutIcon,
	MaterialIconStyle,
	PluginSettings,
} from "../../types";

export type SettingsTabPlugin = Plugin & {
	registry: CalloutRegistry;
	cssInjector: CSSInjector;
	manifest: PluginManifest;
	settings: PluginSettings;
	pruneSuspended: boolean;
	onMaterialSvgChange(cb: () => void): () => void;
	schedulePruneUnusedFallbacks(delayMs?: number): void;
	addUnknownCalloutsAsFallback(unknownIds: string[]): number;
	saveSettings(): Promise<void>;
	refreshCallouts(): void;
	hasMaterialSvgFailed(
		name: string,
		style: MaterialIconStyle,
		weight: number,
	): boolean;
	restyleUncustomizedFallbackRows(): number;
	cacheMaterialSvg(icon: CalloutIcon): Promise<void>;
	runVaultScan(markFirstRun?: boolean): Promise<number>;
};

export type SettingsSectionContext = {
	app: App;
	plugin: SettingsTabPlugin;
	display: () => void;
};
