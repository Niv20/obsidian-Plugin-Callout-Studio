/**
 * manager/CalloutDiscovery.ts — Vault scanning and auto-discovery of callouts.
 *
 * Watches for file-open and file-modify events and incrementally scans changed
 * files for unrecognized callout IDs, adding them as fallback rows in the
 * registry. Also runs debounced prune passes to remove auto-created rows that
 * are no longer used. Owned by main.ts; destroyed in onunload.
 * Depends on CalloutRegistry, vaultCalloutScanner utilities, and PluginSettings.
 */
import { TFile } from "obsidian";
import type { App, EventRef } from "obsidian";
import type { CalloutRegistry } from "./CalloutRegistry";
import type { PluginSettings } from "../types";
import { DEFAULT_CALLOUTS } from "../constants";
import {
	scanFileForUnknownCallouts,
	scanVaultForUnknownCallouts,
	countCalloutUsagesMap,
} from "../utils/vaultCalloutScanner";

interface DiscoveryHost {
	app: App;
	registry: CalloutRegistry;
	settings: PluginSettings;
	saveSettings(): Promise<void>;
	refreshCallouts(): void;
	registerEvent(eventRef: EventRef): void;
}

/**
 * Coordinates vault discovery of unrecognized callout IDs, debounced
 * pruning of unused auto-created rows, and incremental rescans on file
 * changes. Owns its own timers and is destroyed via {@link destroy}.
 */
export class CalloutDiscovery {
	/** When true, automatic prune passes are skipped (e.g. while the editor modal is open). */
	pruneSuspended = false;

	/** Pending per-file debounce timers for incremental callout scanning. */
	private readonly fileScanTimers: Map<string, number> = new Map();
	/** Debounce timer for {@link pruneUnused}. */
	private pruneTimer: number | undefined;

	constructor(private readonly host: DiscoveryHost) {}

	destroy(): void {
		for (const id of this.fileScanTimers.values()) {
			window.clearTimeout(id);
		}
		this.fileScanTimers.clear();
		if (this.pruneTimer !== undefined) {
			window.clearTimeout(this.pruneTimer);
			this.pruneTimer = undefined;
		}
	}

	/** Build a Set of all callout IDs and aliases currently known to the registry. */
	buildKnownIds(): Set<string> {
		const known = new Set<string>();
		for (const def of this.host.registry.getAll()) {
			known.add(def.id.toLowerCase());
			for (const a of def.aliases ?? []) known.add(a.toLowerCase());
		}
		return known;
	}

	/**
	 * Re-style all uncustomized `source: "fallback"` rows to mirror the
	 * current fallback callout's icon and colors.
	 */
	restyleUncustomizedFallbackRows(): number {
		return this.host.registry.restyleUncustomizedFallbackRows();
	}

	/**
	 * Add the given unknown callout IDs to the registry as fallback-source rows
	 * that mirror the current fallback style.
	 */
	addUnknownCalloutsAsFallback(unknownIds: string[]): number {
		if (unknownIds.length === 0) return 0;
		const fallbackId = this.host.settings.fallbackCalloutId || "note";
		const noteDefault =
			DEFAULT_CALLOUTS.find((c) => c.id === "note") ??
			DEFAULT_CALLOUTS[0]!;
		const fallback = this.host.registry.get(fallbackId) ?? noteDefault;
		let added = 0;
		for (const id of unknownIds) {
			if (this.host.registry.get(id)) continue;
			const def = {
				...fallback,
				icon: fallback.icon,
				id,
				displayName: id.charAt(0).toUpperCase() + id.slice(1),
				aliases: [],
				builtIn: false,
				source: "fallback" as const,
			};
			if (this.host.registry.add(def)) added++;
		}
		return added;
	}

	/**
	 * Schedule a debounced prune of auto-created (`source: "fallback"`) rows
	 * that have never been customized and have zero vault usages.
	 */
	schedulePrune(delayMs = 1500): void {
		if (this.pruneSuspended) return;
		if (this.pruneTimer !== undefined) {
			window.clearTimeout(this.pruneTimer);
		}
		this.pruneTimer = window.setTimeout(() => {
			this.pruneTimer = undefined;
			void this.pruneUnused();
		}, delayMs);
	}

	/**
	 * Remove auto-created (`source: "fallback"`) callouts that the user has
	 * never edited and that no longer appear in any markdown file.
	 */
	async pruneUnused(): Promise<number> {
		if (this.pruneSuspended) return 0;
		const candidates = this.host.registry
			.getUserDefined()
			.filter((d) => d.source === "fallback" && d.customized !== true)
			.map((d) => d.id);
		if (candidates.length === 0) return 0;

		let usage: Map<string, { fileCount: number; totalCount: number }>;
		try {
			usage = await countCalloutUsagesMap(this.host.app, candidates);
		} catch (e) {
			console.debug("[CalloutStudio] prune usage scan failed", e);
			return 0;
		}

		let removed = 0;
		for (const id of candidates) {
			const stat = usage.get(id.toLowerCase());
			if (!stat || stat.fileCount > 0) continue;
			const def = this.host.registry.get(id);
			if (!def) continue;
			// Re-check: another flow (e.g. settings edit) may have
			// customized this row while the scan was in flight.
			if (def.source !== "fallback" || def.customized === true) continue;
			if (this.host.registry.remove(id)) removed++;
		}
		if (removed > 0) {
			await this.host.saveSettings();
			this.host.refreshCallouts();
			console.debug(
				"[CalloutStudio] pruned",
				removed,
				"unused fallback callout(s)",
			);
		}
		return removed;
	}

	/**
	 * Scan the vault for callout IDs that are not in the registry and add
	 * them as fallback-source rows that mirror the current fallback style.
	 */
	async runVaultScan(markFirstRun = false): Promise<number> {
		const known = this.buildKnownIds();
		const unknown = await scanVaultForUnknownCallouts(this.host.app, known);
		const added = this.addUnknownCalloutsAsFallback(unknown);
		if (markFirstRun) {
			this.host.registry.settings.firstRunCompleted = true;
		}
		await this.host.saveSettings();
		this.host.refreshCallouts();
		return added;
	}

	/**
	 * Subscribe to vault/metadata events for incremental discovery of new
	 * callout IDs. Should be called inside `onLayoutReady`.
	 */
	registerIncrementalWatchers(): void {
		this.host.registerEvent(
			this.host.app.metadataCache.on("changed", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.scheduleFileScan(file);
				}
			}),
		);
		this.host.registerEvent(
			this.host.app.vault.on("create", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.scheduleFileScan(file);
				}
			}),
		);
	}

	/**
	 * Debounced per-file incremental scan. Cheap: reads a single cached file
	 * and runs one regex.
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

	/**
	 * If the active editor is editing this file and the cursor sits on a
	 * `[!id]` header line, return that header's (lowercased) id. While the
	 * cursor stays on the line the id is "in progress" and must not be
	 * auto-created yet: doing so would feed the half-typed name straight back
	 * into the autocomplete dropdown. Discovery happens once the cursor leaves
	 * the line (treated as the user having committed the name).
	 */
	private getActiveTypingCalloutId(file: TFile): string | null {
		const active = this.host.app.workspace.activeEditor;
		if (!active?.editor || active.file !== file) return null;
		const editor = active.editor;
		const line = editor.getLine(editor.getCursor().line); // live buffer
		// Same id shape as the vault scanner (`[^\]\s]+` + closing `]`).
		const m = /^\s*>[\s>]*\[!([^\]\s]+)\]/.exec(line);
		return m ? m[1]!.toLowerCase() : null;
	}

	private async scanFileNow(file: TFile): Promise<void> {
		if (this.host.app.vault.getAbstractFileByPath(file.path) !== file)
			return;
		const known = this.buildKnownIds();
		let unknown: string[];
		try {
			unknown = await scanFileForUnknownCallouts(
				this.host.app,
				file,
				known,
			);
		} catch (e) {
			console.debug("[CalloutStudio] file scan failed", file.path, e);
			return;
		}
		// Skip the header the user is actively typing — it gets discovered once
		// they commit it (Enter, move past the header, or switch files).
		const inProgress = this.getActiveTypingCalloutId(file);
		if (inProgress) unknown = unknown.filter((id) => id !== inProgress);
		if (unknown.length === 0) {
			// Edit may have removed the last usage of a fallback row. Run
			// a prune so the settings list stays clean as the user types.
			this.schedulePrune();
			return;
		}
		const added = this.addUnknownCalloutsAsFallback(unknown);
		if (added > 0) {
			console.debug(
				"[CalloutStudio] auto-added callouts from",
				file.path,
				unknown,
			);
			await this.host.saveSettings();
			this.host.refreshCallouts();
		}
		// Always schedule a prune pass: even if no new rows were added,
		// existing fallback rows may now be unused after this edit.
		this.schedulePrune();
	}
}
