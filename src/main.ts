/**
 * main.ts — Plugin entry point.
 *
 * Bootstraps the entire plugin during Obsidian's `onload` lifecycle:
 * creates the CalloutRegistry, wires up CSSInjector, MaterialSvgManager,
 * and CalloutDiscovery, registers all commands, the settings tab, the
 * autocomplete provider, and the context menu.
 * Keep this file focused on lifecycle only — all feature logic lives in
 * the sub-modules under manager/, editor/, settings/, etc.
 */
import { MarkdownView, Notice, Plugin } from "obsidian";
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
import { WelcomeModal } from "./settings/WelcomeModal";
import { CalloutEditor } from "./settings/CalloutEditor";
import { CalloutAutoComplete } from "./editor/AutoComplete";
import { LinkSuggestDecorator } from "./editor/LinkSuggestDecorator";
import { registerContextMenu } from "./editor/contextmenu";
import { createCalloutViewPlugin } from "./editor/livepreview/calloutViewPlugin";
import { refreshAllMarkdownEditors } from "./editor/livepreview/refresh";
import { OutlineDecorator } from "./outline/OutlineDecorator";
import { createCalloutReadingPostProcessor } from "./reading/calloutPostProcessor";
import { registerCalloutCommands } from "./editor/commands";
import { CalloutStudioAPI } from "./api/PluginAPI";
import { FirstRunScanModal } from "./utils/FirstRunScanModal";
import { HEAVY_VAULT_FILE_THRESHOLD } from "./constants";
import { setLocale, t } from "./i18n";

export default class CalloutStudioPlugin extends Plugin {
	registry!: CalloutRegistry;
	cssInjector!: CSSInjector;
	api!: CalloutStudioAPI;
	autoComplete!: CalloutAutoComplete;
	outlineDecorator!: OutlineDecorator;
	private materialSvg!: MaterialSvgManager;
	private discovery!: CalloutDiscovery;
	private linkSuggestDecorator!: LinkSuggestDecorator;

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

		// Distinguish a brand-new install (no data.json yet) from an existing
		// user updating into this version. This drives WHERE the welcome screen
		// appears — see maybeShowWelcomeOnLaunch(). Computed once, cheaply, from
		// the data we already loaded.
		const isFreshInstall =
			savedData == null || Object.keys(savedData).length === 0;

		// UI locale follows the user's saved preference; "auto" (the default)
		// tracks Obsidian's interface language.
		setLocale(this.settings.language);

		// Initialize CSS injector
		this.cssInjector = new CSSInjector(this.app, this.registry);
		this.cssInjector.initialize();

		// Paint callout icons (Lucide/Material/emoji) directly into the DOM for
		// every rendered note. Material and emoji glyphs are baked into the DOM
		// here rather than drawn via CSS so they survive Obsidian's PDF export,
		// which clones the rendered DOM but drops our adopted stylesheet.
		this.registerMarkdownPostProcessor((el) => {
			this.cssInjector.paintIcons(el);
		});

		// Reading-view rendering for heading callouts and inline pills.
		this.registerMarkdownPostProcessor(
			createCalloutReadingPostProcessor(this),
		);

		// Live Preview rendering for heading callouts and inline pills.
		this.registerEditorExtension(createCalloutViewPlugin(this));

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

		// Clean heading-callout titles in the Outline pane.
		this.outlineDecorator = new OutlineDecorator(this);
		this.app.workspace.onLayoutReady(() => this.outlineDecorator.attachAll());
		this.registerEvent(
			this.app.workspace.on("layout-change", () =>
				this.outlineDecorator.attachAll(),
			),
		);
		this.register(() => this.outlineDecorator.destroy());

		// Re-inject CSS when registry changes
		this.registry.onChange(() => {
			this.cssInjector.scheduleInject();
			this.app.workspace.trigger("css-change");
			// Icon/color/display-name edits must repaint outline items too.
			this.outlineDecorator.refreshAll();
			void this.saveSettings();
		});

		// Re-inject on theme/snippet change. Pass `false` so we don't re-emit
		// css-change in response to css-change — that would loop with other
		// plugins that also listen and re-emit (e.g. Style Settings). The
		// external css-change already re-renders open notes, so re-emitting is
		// both redundant and harmful here.
		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				this.cssInjector.inject(false);
			}),
		);

		// Settings tab
		this.addSettingTab(new CalloutStudioSettingsTab(this.app, this));

		// Dev/test convenience: from a terminal, `open "obsidian://callout-studio-welcome"`
		// re-opens the welcome modal on demand (bypasses the welcomeSeen flag).
		this.registerObsidianProtocolHandler("callout-studio-welcome", () => {
			void this.openWelcome();
		});

		// Commands
		registerCalloutCommands(this, () => new CalloutEditor(this));

		// Editor autocomplete on [! trigger
		this.autoComplete = new CalloutAutoComplete(this);
		this.registerEditorSuggest(this.autoComplete);

		// Clean heading-callout titles in the [[# link suggestion popup.
		// Installed on layout-ready so the core link suggester exists; our own
		// autocomplete is skipped (it renders callout suggestions itself).
		this.linkSuggestDecorator = new LinkSuggestDecorator(this);
		this.app.workspace.onLayoutReady(() =>
			this.linkSuggestDecorator.install([this.autoComplete]),
		);
		this.register(() => this.linkSuggestDecorator.uninstall());

		// Right-click context menu for callout blocks
		registerContextMenu(this);

		// Public API for other plugins
		this.api = new CalloutStudioAPI(this);

		// Download missing Material SVGs in background
		void this.materialSvg.ensureAll();

		// First-run vault discovery.
		//
		// Decoupled from initial render so onload stays fast. The flag is
		// only flipped *after* the chosen path completes, so an interrupted
		// startup (crash / reload mid-scan) safely re-runs next launch.
		//
		// - Small vaults: silent auto-scan in the background.
		// - Large vaults (>= HEAVY_VAULT_FILE_THRESHOLD): one-time modal
		//   asks the user before doing anything.
		//
		// On subsequent loads (firstRunCompleted=true) we just opportunistically
		// prune stale auto-created rows accumulated while typing in a previous
		// session.
		this.app.workspace.onLayoutReady(async () => {
			try {
				// Welcome first, so it never stacks on top of the first-run
				// scan modal (which only appears for large vaults).
				await this.maybeShowWelcomeOnLaunch(isFreshInstall);
				if (!this.settings.firstRunCompleted) {
					await this.runFirstRunDiscovery();
				} else {
					this.discovery.schedulePrune(2000);
				}
			} finally {
				this.discovery.registerIncrementalWatchers();
			}
		});
	}

	/**
	 * Open the welcome/splash screen on demand, ignoring the `welcomeSeen`
	 * flag. Handy for testing — call it from the DevTools console:
	 *   app.plugins.plugins["callout-studio"].openWelcome()
	 */
	openWelcome(): Promise<void> {
		return new WelcomeModal(this).prompt();
	}

	/**
	 * First-run welcome routing, evaluated once at launch. The screen greets
	 * a brand-new install immediately, right after layout is ready — and only
	 * a brand-new install. A user who merely updated into this version (they
	 * already have a `data.json`) never sees it. It appears exactly once per
	 * fresh install: once `welcomeSeen` is persisted it is never shown again.
	 */
	private async maybeShowWelcomeOnLaunch(
		isFreshInstall: boolean,
	): Promise<void> {
		if (this.settings.welcomeSeen || !isFreshInstall) return;
		await this.showWelcomeOnce();
	}

	/**
	 * Open the welcome screen once. The `welcomeSeen` flag is persisted
	 * *before* opening (synchronously, ahead of any await) so an interrupted
	 * startup won't re-show it.
	 */
	private async showWelcomeOnce(): Promise<void> {
		this.registry.settings.welcomeSeen = true;
		await this.saveSettings();
		await new WelcomeModal(this).prompt();
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
		// Rebuild Live Preview heading/inline decorations: registry changes
		// don't touch the document, so CodeMirror won't rebuild them itself.
		refreshAllMarkdownEditors(this.app);
	}

	/**
	 * Fully re-render both preview modes. Used when a render-role toggle
	 * flips: unlike refreshCallouts(), this also re-runs reading-view
	 * post-processors (via previewMode.rerender) so already-baked pills and
	 * heading bars are added or stripped immediately.
	 */
	refreshRenderModes(): void {
		refreshAllMarkdownEditors(this.app);
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (view instanceof MarkdownView) view.previewMode?.rerender(true);
		}
	}

	// ── Forwarders that keep the public plugin surface stable ──

	restyleUncustomizedFallbackRows(): number {
		return this.discovery.restyleUncustomizedFallbackRows();
	}

	isKnownZeroUsageFallback(id: string): boolean {
		return this.discovery.isKnownZeroUsageFallback(id);
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

	/**
	 * One-time post-install discovery. Picks between a silent auto-scan
	 * (small vaults) and a consent modal (large vaults). The
	 * `firstRunCompleted` flag is only persisted after the chosen path
	 * finishes, so an interrupted run will retry on the next launch.
	 */
	private async runFirstRunDiscovery(): Promise<void> {
		// Re-check the flag — onLayoutReady can fire after another flow
		// (e.g. an import) already ran a scan and flipped the flag.
		if (this.settings.firstRunCompleted) return;

		const fileCount = this.app.vault.getMarkdownFiles().length;

		if (fileCount < HEAVY_VAULT_FILE_THRESHOLD) {
			// Small vault — auto-scan silently.
			try {
				const added = await this.runVaultScan(false);
				if (added > 0) {
					new Notice(
						t("firstRun.autoScanComplete", {
							count: String(added),
						}),
					);
				}
			} catch (e) {
				console.error("[CalloutStudio] first-run auto scan failed", e);
			}
			this.registry.settings.firstRunCompleted = true;
			await this.saveSettings();
			return;
		}

		// Large vault — ask the user first.
		await new FirstRunScanModal(this.app, fileCount, async () => {
			const added = await this.runVaultScan(false);
			new Notice(
				t("settings.rescanComplete", {
					count: String(added),
				}),
			);
		}).prompt();
		this.registry.settings.firstRunCompleted = true;
		await this.saveSettings();
	}
}
