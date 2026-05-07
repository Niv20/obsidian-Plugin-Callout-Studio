import { Plugin } from "obsidian";
import type {
	CalloutIcon,
	MaterialIconStyle,
	PluginData,
	PluginSettings,
} from "./types";
import { CalloutRegistry } from "./manager/CalloutRegistry";
import { CSSInjector } from "./manager/CSSInjector";
import { MaterialSvgManager } from "./manager/MaterialSvgManager";
import { CalloutDiscovery } from "./manager/CalloutDiscovery";
import { CalloutStudioSettingsTab } from "./settings/SettingsTab";
import { CalloutEditor } from "./settings/CalloutEditor";
import { CalloutAutoComplete } from "./editor/AutoComplete";
import { registerContextMenu } from "./editor/ContextMenu";
import { registerCalloutCommands } from "./editor/commands";
import { CalloutStudioAPI } from "./api/PluginAPI";
import { setLocale } from "./i18n";

export default class CalloutStudioPlugin extends Plugin {
	registry!: CalloutRegistry;
	cssInjector!: CSSInjector;
	api!: CalloutStudioAPI;
	private materialSvg!: MaterialSvgManager;
	private discovery!: CalloutDiscovery;

	get settings(): PluginSettings {
		return this.registry.settings;
	}

	/** Backwards-compatible accessor used by SettingsTab/CalloutEditor. */
	get pruneSuspended(): boolean {
		return this.discovery.pruneSuspended;
	}
	set pruneSuspended(value: boolean) {
		this.discovery.pruneSuspended = value;
	}

	async onload() {
		// Initialize registry and load persisted data
		this.registry = new CalloutRegistry();
		const savedData = (await this.loadData()) as Partial<PluginData> | null;
		this.registry.load(savedData);

		// UI locale always follows Obsidian's interface language.
		setLocale("auto");

		// Initialize CSS injector
		this.cssInjector = new CSSInjector(this.app, this.registry);
		this.cssInjector.initialize();

		// Sub-managers (composition keeps main.ts focused on lifecycle).
		this.materialSvg = new MaterialSvgManager({
			registry: this.registry,
			cssInjector: this.cssInjector,
			saveSettings: () => this.saveSettings(),
		});
		this.discovery = new CalloutDiscovery({
			app: this.app,
			registry: this.registry,
			settings: this.settings,
			saveSettings: () => this.saveSettings(),
			refreshCallouts: () => this.refreshCallouts(),
			registerEvent: (ref) => this.registerEvent(ref),
		});

		// Re-inject CSS when registry changes
		this.registry.onChange(() => {
			this.cssInjector.scheduleInject();
			this.app.workspace.trigger("css-change");
			void this.saveSettings();
		});

		// Re-inject on theme change
		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				this.cssInjector.inject();
			}),
		);

		// Settings tab
		this.addSettingTab(new CalloutStudioSettingsTab(this.app, this));

		// Commands
		registerCalloutCommands(this, () => new CalloutEditor(this));

		// Editor autocomplete on [! trigger
		this.registerEditorSuggest(new CalloutAutoComplete(this));

		// Right-click context menu for callout blocks
		registerContextMenu(this);

		// Public API for other plugins
		this.api = new CalloutStudioAPI(this);

		// Download missing Material SVGs in background
		void this.materialSvg.ensureAll();

		// First-run vault scan for unrecognized callout IDs
		if (!this.settings.firstRunCompleted) {
			this.app.workspace.onLayoutReady(() => {
				void this.discovery.runVaultScan(true);
			});
		} else {
			// On subsequent loads, opportunistically prune any stale
			// auto-created rows the user accumulated while typing in a
			// previous session.
			this.app.workspace.onLayoutReady(() => {
				this.discovery.schedulePrune(2000);
			});
		}

		// Incremental tracking: discover new callout IDs as users save files
		// or as files arrive via sync / filesystem.
		this.app.workspace.onLayoutReady(() => {
			this.discovery.registerIncrementalWatchers();
		});
	}

	onunload() {
		this.discovery?.destroy();
		this.cssInjector?.destroy();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.registry.toSaveData());
	}

	/**
	 * Re-applies all callout styling and forces every open Markdown view to
	 * re-render. Use after any mutation that should be immediately visible.
	 */
	refreshCallouts(): void {
		this.cssInjector.inject();
		this.app.workspace.trigger("css-change");
	}

	// ── Forwarders that keep the public plugin surface stable ──

	restyleUncustomizedFallbackRows(): number {
		return this.discovery.restyleUncustomizedFallbackRows();
	}

	addUnknownCalloutsAsFallback(unknownIds: string[]): number {
		return this.discovery.addUnknownCalloutsAsFallback(unknownIds);
	}

	schedulePruneUnusedFallbacks(delayMs?: number): void {
		this.discovery.schedulePrune(delayMs);
	}

	async pruneUnusedFallbacks(): Promise<number> {
		return this.discovery.pruneUnused();
	}

	async runVaultScan(markFirstRun = false): Promise<number> {
		return this.discovery.runVaultScan(markFirstRun);
	}

	onMaterialSvgChange(cb: () => void): () => void {
		return this.materialSvg.onChange(cb);
	}

	async cacheMaterialSvg(icon: CalloutIcon): Promise<void> {
		return this.materialSvg.cacheOne(icon);
	}

	hasMaterialSvgFailed(
		name: string,
		style: MaterialIconStyle,
		weight: number,
	): boolean {
		return this.materialSvg.hasFailed(name, style, weight);
	}
}
