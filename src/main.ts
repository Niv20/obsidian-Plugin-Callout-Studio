import { Plugin, Notice, TFile } from "obsidian";
import type { CalloutIcon, PluginData, PluginSettings } from "./types";
import { CalloutRegistry } from "./manager/CalloutRegistry";
import { CSSInjector } from "./manager/CSSInjector";
import { DEFAULT_CALLOUTS } from "./constants";
import { CalloutStudioSettingsTab } from "./settings/SettingsTab";
import { CalloutEditor } from "./settings/CalloutEditor";
import { CalloutAutoComplete } from "./editor/AutoComplete";
import {
	unwrapCalloutAtSelection,
	wrapSelectionInCallout,
} from "./editor/CalloutBlockTools";
import { registerContextMenu } from "./editor/ContextMenu";
import { CalloutStudioAPI } from "./api/PluginAPI";
import { downloadMaterialSvg } from "./utils/iconLoader";
import {
	scanFileForUnknownCallouts,
	scanVaultForUnknownCallouts,
} from "./utils/vaultCalloutScanner";
import { setLocale, t } from "./i18n";

export default class CalloutStudioPlugin extends Plugin {
	registry!: CalloutRegistry;
	cssInjector!: CSSInjector;
	api!: CalloutStudioAPI;
	/** In-memory record of Material SVGs that failed to download after retries */
	failedMaterialSvgs: Set<string> = new Set();
	/** Listeners notified when a Material SVG download finishes (success or failure). */
	private materialSvgListeners: Set<() => void> = new Set();
	/** Pending per-file debounce timers for incremental callout scanning. */
	private fileScanTimers: Map<string, number> = new Map();

	/** Subscribe to Material SVG cache updates. Returns an unsubscribe function. */
	onMaterialSvgChange(cb: () => void): () => void {
		this.materialSvgListeners.add(cb);
		return () => {
			this.materialSvgListeners.delete(cb);
		};
	}

	private notifyMaterialSvgChange(): void {
		for (const cb of this.materialSvgListeners) {
			try {
				cb();
			} catch (e) {
				console.warn("[CalloutStudio] material svg listener error", e);
			}
		}
	}

	get settings(): PluginSettings {
		return this.registry.settings;
	}

	async onload() {
		// Initialize registry and load persisted data
		this.registry = new CalloutRegistry();
		const savedData = (await this.loadData()) as Partial<PluginData> | null;
		this.registry.load(savedData);

		// Set UI locale from saved preference
		setLocale("auto");

		// Initialize CSS injector
		this.cssInjector = new CSSInjector(this.app, this.registry);
		this.cssInjector.initialize();

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
		this.addCommand({
			id: "open-settings",
			name: t("cmd.openSettings"),
			callback: () => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				(this.app as any).setting.open();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				(this.app as any).setting.openTabById(this.manifest.id);
			},
		});

		this.addCommand({
			id: "create-callout",
			name: t("cmd.createCallout"),
			callback: () => {
				void new CalloutEditor(this).open();
			},
		});

		this.addCommand({
			id: "callout-wrap",
			name: t("cmd.calloutWrap"),
			editorCallback: (editor) => {
				wrapSelectionInCallout(editor);
			},
		});

		this.addCommand({
			id: "callout-wrap-selection",
			name: t("cmd.calloutWrapSelection"),
			editorCheckCallback: (checking, editor) => {
				if (!checking) {
					if (editor.somethingSelected()) {
						wrapSelectionInCallout(editor, {
							requireSelection: true,
						});
					} else {
						editor.replaceSelection(">");
					}
				}
				return true;
			},
			// eslint-disable-next-line obsidianmd/commands/no-default-hotkeys
			hotkeys: [{ modifiers: ["Shift"], key: ">" }],
		});

		this.addCommand({
			id: "callout-unwrap",
			name: t("cmd.calloutUnwrap"),
			editorCallback: (editor) => {
				unwrapCalloutAtSelection(editor);
			},
		});

		this.addCommand({
			id: "callout-unwrap-selection",
			name: t("cmd.calloutUnwrapSelection"),
			editorCheckCallback: (checking, editor) => {
				if (!checking) {
					if (editor.somethingSelected()) {
						unwrapCalloutAtSelection(editor);
					} else {
						editor.replaceSelection("<");
					}
				}
				return true;
			},
			// eslint-disable-next-line obsidianmd/commands/no-default-hotkeys
			hotkeys: [{ modifiers: ["Shift"], key: "<" }],
		});

		// Editor autocomplete on [! trigger
		this.registerEditorSuggest(new CalloutAutoComplete(this));

		// Right-click context menu for callout blocks
		registerContextMenu(this);

		// Public API for other plugins
		this.api = new CalloutStudioAPI(this);

		// Download missing Material SVGs in background
		void this.ensureMaterialSvgs();

		// First-run vault scan for unrecognized callout IDs
		if (!this.settings.firstRunCompleted) {
			this.app.workspace.onLayoutReady(() => {
				void this.runVaultScan(true);
			});
		}

		// Incremental tracking: discover new callout IDs as users save files
		// or as files arrive via sync / filesystem.
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.metadataCache.on("changed", (file) => {
					if (file instanceof TFile && file.extension === "md") {
						this.scheduleFileScan(file);
					}
				}),
			);
			this.registerEvent(
				this.app.vault.on("create", (file) => {
					if (file instanceof TFile && file.extension === "md") {
						this.scheduleFileScan(file);
					}
				}),
			);
		});
	}

	onunload() {
		for (const id of this.fileScanTimers.values()) {
			window.clearTimeout(id);
		}
		this.fileScanTimers.clear();
		this.cssInjector.destroy();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.registry.toSaveData());
	}

	/**
	 * Centralized helper that re-applies all callout styling and forces every
	 * open Markdown view to re-render. Use after any mutation that should be
	 * immediately visible (palette change, slider commit, fallback swap, …).
	 */
	refreshCallouts(): void {
		this.cssInjector.inject();
		this.app.workspace.trigger("css-change");
	}

	/** Build a Set of all callout IDs and aliases currently known to the registry. */
	private buildKnownCalloutIds(): Set<string> {
		const known = new Set<string>();
		for (const def of this.registry.getAll()) {
			known.add(def.id.toLowerCase());
			for (const a of def.aliases ?? []) known.add(a.toLowerCase());
		}
		return known;
	}

	/**
	 * Add the given unknown callout IDs to the registry as fallback-source rows
	 * that mirror the current fallback style. Returns the number of new rows
	 * actually added (some IDs may already exist by the time this runs).
	 */
	addUnknownCalloutsAsFallback(unknownIds: string[]): number {
		if (unknownIds.length === 0) return 0;
		const fallbackId = this.settings.fallbackCalloutId || "note";
		const noteDefault =
			DEFAULT_CALLOUTS.find((c) => c.id === "note") ??
			DEFAULT_CALLOUTS[0]!;
		const fallback = this.registry.get(fallbackId) ?? noteDefault;
		let added = 0;
		for (const id of unknownIds) {
			if (this.registry.get(id)) continue;
			const def = {
				...fallback,
				icon: fallback.icon,
				id,
				displayName: id.charAt(0).toUpperCase() + id.slice(1),
				aliases: [],
				builtIn: false,
				source: "fallback" as const,
			};
			if (this.registry.add(def)) added++;
		}
		return added;
	}

	/**
	 * Scan the vault for callout IDs that are not in the registry and add
	 * them as fallback-source rows that mirror the current fallback style.
	 * Returns the number of new rows added.
	 */
	async runVaultScan(markFirstRun = false): Promise<number> {
		const known = this.buildKnownCalloutIds();
		const unknown = await scanVaultForUnknownCallouts(this.app, known);
		const added = this.addUnknownCalloutsAsFallback(unknown);
		if (markFirstRun) {
			this.registry.settings.firstRunCompleted = true;
		}
		await this.saveSettings();
		this.refreshCallouts();
		return added;
	}

	/**
	 * Debounced per-file incremental scan. Triggered on metadataCache.changed
	 * and vault.create. Cheap: reads a single cached file and runs one regex.
	 */
	private scheduleFileScan(file: TFile): void {
		const path = file.path;
		const existing = this.fileScanTimers.get(path);
		if (existing !== undefined) window.clearTimeout(existing);
		const timerId = window.setTimeout(() => {
			this.fileScanTimers.delete(path);
			void this.scanFileNow(file);
		}, 300);
		this.fileScanTimers.set(path, timerId);
	}

	private async scanFileNow(file: TFile): Promise<void> {
		if (this.app.vault.getAbstractFileByPath(file.path) !== file) return;
		const known = this.buildKnownCalloutIds();
		let unknown: string[];
		try {
			unknown = await scanFileForUnknownCallouts(this.app, file, known);
		} catch (e) {
			console.debug("[CalloutStudio] file scan failed", file.path, e);
			return;
		}
		if (unknown.length === 0) return;
		const added = this.addUnknownCalloutsAsFallback(unknown);
		if (added > 0) {
			console.debug(
				"[CalloutStudio] auto-added callouts from",
				file.path,
				unknown,
			);
			await this.saveSettings();
			this.refreshCallouts();
		}
	}

	/**
	 * Downloads an individual Material SVG for a callout icon and caches it.
	 * Also cleans up SVGs no longer used by any callout.
	 */
	async cacheMaterialSvg(icon: CalloutIcon): Promise<void> {
		if (icon.type !== "material") return;
		const style = icon.style ?? "outlined";
		const weight = icon.weight ?? 400;
		// Skip if already cached
		if (this.registry.findMaterialSvg(icon.value, style, weight)) return;
		const failKey = `${icon.value}|${style}|${weight}`;
		// Retry up to 3 times with a 2s gap between attempts
		const maxAttempts = 3;
		let lastErr: unknown;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const svg = await downloadMaterialSvg(
					icon.value,
					style,
					weight,
				);
				this.registry.addMaterialSvg({
					name: icon.value,
					style,
					weight,
					svg,
				});
				this.failedMaterialSvgs.delete(failKey);
				// Note: do NOT call cleanupUnusedMaterialSvgs() here.
				// The icon may have just been chosen in the picker and not yet
				// attached to a callout in the registry — cleanup would
				// immediately delete the SVG we just downloaded. Cleanup runs
				// at proper save points (CalloutEditor save, SettingsTab).
				this.cssInjector.inject();
				await this.saveSettings();
				this.notifyMaterialSvgChange();
				return;
			} catch (err) {
				lastErr = err;
				if (attempt < maxAttempts) {
					await new Promise((r) => setTimeout(r, 2000));
				}
			}
		}
		this.failedMaterialSvgs.add(failKey);
		new Notice(t("notice.iconDownloadFailed", { name: icon.value }));
		this.notifyMaterialSvgChange();
		console.warn(
			"Callout Studio: failed to download Material SVG after retries",
			lastErr,
		);
	}

	/** Returns true when a Material SVG download has permanently failed (after retries). */
	hasMaterialSvgFailed(
		name: string,
		style: import("./types").MaterialIconStyle,
		weight: number,
	): boolean {
		return this.failedMaterialSvgs.has(`${name}|${style}|${weight}`);
	}

	/**
	 * Ensures all callouts using Material icons have a cached SVG.
	 * Runs in background on plugin load.
	 */
	private async ensureMaterialSvgs(): Promise<void> {
		const callouts = this.registry.getAll();
		const missing = callouts.filter((def) => {
			if (def.icon.type !== "material") return false;
			return !this.registry.findMaterialSvg(
				def.icon.value,
				def.icon.style ?? "outlined",
				def.icon.weight ?? 400,
			);
		});

		if (missing.length === 0) return;

		let downloaded = 0;
		for (const def of missing) {
			try {
				const svg = await downloadMaterialSvg(
					def.icon.value,
					def.icon.style ?? "outlined",
					def.icon.weight ?? 400,
				);
				this.registry.addMaterialSvg({
					name: def.icon.value,
					style: def.icon.style ?? "outlined",
					weight: def.icon.weight ?? 400,
					svg,
				});
				downloaded++;
			} catch {
				// Silently skip failures — will retry next load
			}
		}

		if (downloaded > 0) {
			this.cssInjector.inject();
			await this.saveSettings();
			this.notifyMaterialSvgChange();
		}
	}
}
