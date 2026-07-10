/**
 * editor/headingFoldManager.ts — Applies heading-callout fold defaults.
 *
 * A heading callout can carry a fold mark: `## [!id]-` (closed by default)
 * or `## [!id]+` (open by default). By product decision the mark is applied
 * on EVERY file open and overrides the fold state Obsidian remembered for
 * that file; headings without a mark keep their remembered state. It never
 * re-applies mid-session, so manual folding is not fought while typing.
 *
 * Folding is delegated to Obsidian's own heading folding through the shared
 * helpers in headingFold.ts (the undocumented `getFoldInfo()/applyFoldInfo()`
 * pair). Applying is optional-chained and try/catch-guarded so a disabled
 * "Fold heading" core setting or a future API change degrades to "defaults not
 * applied" rather than an error.
 */
import { MarkdownView } from "obsidian";
import type { App, EventRef, TFile } from "obsidian";
import type { PluginSettings } from "../types";
import {
	type FoldCapableMode,
	type FoldRange,
	headingSectionEnd,
} from "./headingFold";

/** Narrow structural host type (satisfied by the plugin instance). */
export interface FoldManagerHost {
	app: App;
	settings: PluginSettings;
	registerEvent(eventRef: EventRef): void;
	/** Plugin.register — cleanup callback run on unload. */
	register(cb: () => void): void;
}

/**
 * Delay before applying, so Obsidian finishes restoring its remembered fold
 * state first — we must run AFTER it to override it.
 */
const APPLY_DELAY_MS = 150;

/**
 * Second apply for the startup path only. At layout-ready Obsidian restores
 * each pre-opened leaf's fold state asynchronously; a single 150ms apply can
 * lose the race on slower machines or large files, so we apply once more.
 */
const STARTUP_RETRY_MS = 600;

/** Matches a heading whose cached text starts with a marked callout token. */
const MARKED_HEADING_RE = /^\[!([^\]\n\r]+)\]([+-])/;

interface MarkedSection {
	/** 0-based line of the heading. */
	line: number;
	/** 0-based last line of the section (may exceed the file; clamped later). */
	endLine: number;
	mark: "+" | "-";
}

export function registerHeadingFoldManager(host: FoldManagerHost): void {
	const pendingTimers = new Set<number>();
	host.register(() => {
		for (const t of pendingTimers) window.clearTimeout(t);
		pendingTimers.clear();
	});

	const scheduleAt = (file: TFile, delay: number): void => {
		const timer = window.setTimeout(() => {
			pendingTimers.delete(timer);
			applyFoldDefaults(host, file, true);
		}, delay);
		pendingTimers.add(timer);
	};

	const schedule = (file: TFile | null, retryOnStartup = false): void => {
		if (!file || file.extension !== "md") return;
		if (!host.settings.headingCallouts.enabled) return;
		scheduleAt(file, APPLY_DELAY_MS);
		if (retryOnStartup) scheduleAt(file, STARTUP_RETRY_MS);
	};

	host.registerEvent(host.app.workspace.on("file-open", (f) => schedule(f)));

	// Startup: files restored into the workspace never fire file-open.
	host.app.workspace.onLayoutReady(() => {
		for (const leaf of host.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (view instanceof MarkdownView) schedule(view.file, true);
		}
	});
}

/**
 * Register a one-shot listener that re-applies once the metadata cache for
 * `file` is (re)built — covers brand-new files whose headings aren't cached
 * yet at the first apply. Self-removes after firing, and is also cleaned up on
 * unload if it never fires.
 */
function registerCacheRetry(host: FoldManagerHost, file: TFile): void {
	let ref: EventRef | null = null;
	const handler = (changed: TFile): void => {
		if (changed.path !== file.path) return;
		if (ref) host.app.metadataCache.offref(ref); // one-shot
		applyFoldDefaults(host, file, false);
	};
	ref = host.app.metadataCache.on("changed", handler);
	host.registerEvent(ref);
}

/**
 * Collect the marked heading-callout sections of a file from the metadata
 * cache and apply them to every markdown view showing that file. When the
 * cache has no headings yet and `allowCacheRetry` is set, schedule a one-shot
 * retry for when the cache resolves instead of silently giving up.
 */
function applyFoldDefaults(
	host: FoldManagerHost,
	file: TFile,
	allowCacheRetry: boolean,
): void {
	if (!host.settings.headingCallouts.enabled) return;
	const app = host.app;
	const cache = app.metadataCache.getFileCache(file);
	const headings = cache?.headings;
	if (!headings || headings.length === 0) {
		if (allowCacheRetry) registerCacheRetry(host, file);
		return;
	}

	const marked: MarkedSection[] = [];
	for (let i = 0; i < headings.length; i++) {
		const h = headings[i]!;
		// Escaped headings (`# \[!id]-`) keep the backslash in the cached
		// text, so they never match here.
		const m = MARKED_HEADING_RE.exec(h.heading);
		if (!m) continue;
		marked.push({
			line: h.position.start.line,
			endLine: headingSectionEnd(headings, i),
			mark: m[2] as "+" | "-",
		});
	}
	if (marked.length === 0) return;

	// Reading mode may report an empty editor; the last cached section's end
	// line is a reliable substitute for the document length.
	const sections = cache?.sections;
	const lastCachedLine =
		sections && sections.length > 0
			? sections[sections.length - 1]!.position.end.line
			: 0;

	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		if (view.file?.path !== file.path) continue;
		applyToView(view, marked, lastCachedLine);
	}
}

function applyToView(
	view: MarkdownView,
	marked: MarkedSection[],
	lastCachedLine: number,
): void {
	try {
		const mode = view.currentMode as unknown as FoldCapableMode;
		if (typeof mode?.applyFoldInfo !== "function") return;

		const editorLines = view.editor?.lineCount() ?? 0;
		const lastLine = Math.max(editorLines - 1, lastCachedLine, 0);

		let changed = false;
		// `+` overrides a remembered fold on that heading → drop it.
		const folds: FoldRange[] = (mode.getFoldInfo?.()?.folds ?? []).filter(
			(fold) => {
				const mk = marked.find((m) => m.line === fold.from);
				if (mk && mk.mark === "+") {
					changed = true;
					return false;
				}
				return true;
			},
		);
		// `-` folds the section unless the user's remembered state already
		// has a fold starting on that heading.
		for (const mk of marked) {
			if (mk.mark !== "-") continue;
			const to = Math.min(mk.endLine, lastLine);
			if (to <= mk.line) continue; // empty section — nothing to fold
			if (!folds.some((fold) => fold.from === mk.line)) {
				folds.push({ from: mk.line, to });
				changed = true;
			}
		}

		if (changed) {
			mode.applyFoldInfo?.({ folds, lines: lastLine + 1 });
		}
	} catch (e) {
		console.debug("[CalloutStudio] applying fold defaults failed", e);
	}
}
