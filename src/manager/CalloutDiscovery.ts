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
import { normalizeCalloutId } from "../utils/calloutId";
import { scanLineForCalloutTokens } from "../editor/calloutTokens";
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
	/**
	 * Normalized ids of uncustomized fallback rows the last prune scan
	 * confirmed have zero usages anywhere in the vault. Kept in sync by
	 * {@link pruneUnused} and {@link addUnknownCalloutsAsFallback}; consulted
	 * by autocomplete so it can hide only *confirmed-gone* fallback rows
	 * instead of every unadopted one, without re-scanning the vault on every
	 * keystroke.
	 */
	private readonly zeroUsageFallbackIds = new Set<string>();

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

	/**
	 * True if `id` is an uncustomized fallback callout that the last prune
	 * scan confirmed has zero usages anywhere in the vault. Ids that were
	 * never scanned (just typed, or scanned but still in use) are NOT
	 * considered zero-usage — callers should treat "unknown" as "might be
	 * real" rather than excluding it.
	 */
	isKnownZeroUsageFallback(id: string): boolean {
		return this.zeroUsageFallbackIds.has(normalizeCalloutId(id));
	}

	/** Build a Set of all callout IDs and aliases currently known to the registry. */
	buildKnownIds(): Set<string> {
		const known = new Set<string>();
		for (const def of this.host.registry.getAll()) {
			known.add(normalizeCalloutId(def.id));
			for (const a of def.aliases ?? [])
				known.add(normalizeCalloutId(a));
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
			if (this.host.registry.add(def)) {
				added++;
				// Being (re)discovered means it currently appears in file
				// content — any stale "confirmed zero usage" verdict from an
				// earlier scan no longer applies.
				this.zeroUsageFallbackIds.delete(normalizeCalloutId(id));
			}
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
			const normalized = normalizeCalloutId(id);
			const stat = usage.get(normalized);
			const hasUsage = stat !== undefined && stat.fileCount > 0;
			if (hasUsage) {
				this.zeroUsageFallbackIds.delete(normalized);
				continue;
			}
			this.zeroUsageFallbackIds.add(normalized);
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
	 * If the active editor is editing this file, return the (lowercased) ids
	 * of every callout token — regular, heading, or inline — on the cursor's
	 * line. While the cursor stays on the line those ids are "in progress"
	 * and must not be auto-created yet: doing so would feed a half-typed name
	 * straight back into the autocomplete dropdown. Discovery happens once
	 * the cursor leaves the line (treated as the user having committed it).
	 */
	private getActiveTypingCalloutIds(file: TFile): Set<string> | null {
		const active = this.host.app.workspace.activeEditor;
		if (!active?.editor || active.file !== file) return null;
		const editor = active.editor;
		const line = editor.getLine(editor.getCursor().line); // live buffer
		const ids = new Set<string>();
		// Token ids are normalized exactly like the vault scanner's, so
		// multi-word IDs with spaces match identically.
		for (const token of scanLineForCalloutTokens(line)) {
			const id = normalizeCalloutId(token.rawId);
			if (id) ids.add(id);
		}
		return ids.size > 0 ? ids : null;
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
		// Skip tokens the user is actively typing — they get discovered once
		// they commit them (Enter, move off the line, or switch files).
		const inProgress = this.getActiveTypingCalloutIds(file);
		if (inProgress) unknown = unknown.filter((id) => !inProgress.has(id));
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
