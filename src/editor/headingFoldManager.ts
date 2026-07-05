/**
 * editor/headingFoldManager.ts — Applies heading-callout fold defaults.
 *
 * A heading callout can carry a fold mark: `## [!id]-` (closed by default)
 * or `## [!id]+` (open by default). By product decision the mark is applied
 * on EVERY file open and overrides the fold state Obsidian remembered for
 * that file; headings without a mark keep their remembered state. It never
 * re-applies mid-session, so manual folding is not fought while typing.
 *
 * Folding is delegated to Obsidian's own heading folding through the
 * undocumented-but-stable `view.currentMode.getFoldInfo()/applyFoldInfo()`
 * pair (the same API the Creases plugin uses; works for the editing mode,
 * and for reading mode when the core "Fold heading" setting is on). All
 * calls are optional-chained and try/catch-guarded so a future API change
 * degrades to "defaults not applied" rather than an error.
 */
import { MarkdownView } from "obsidian";
import type { App, EventRef, TFile } from "obsidian";
import type { PluginSettings } from "../types";

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

/** Matches a heading whose cached text starts with a marked callout token. */
const MARKED_HEADING_RE = /^\[!([^\]\n\r]+)\]([+-])/;

interface FoldRange {
	from: number;
	to: number;
}

/** Undocumented fold API on MarkdownView.currentMode. */
interface FoldCapableMode {
	getFoldInfo?: () => { folds: FoldRange[]; lines: number } | null;
	applyFoldInfo?: (info: { folds: FoldRange[]; lines: number }) => void;
}

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

	const schedule = (file: TFile | null): void => {
		if (!file || file.extension !== "md") return;
		if (!host.settings.headingCallouts.enabled) return;
		const timer = window.setTimeout(() => {
			pendingTimers.delete(timer);
			applyFoldDefaults(host.app, file);
		}, APPLY_DELAY_MS);
		pendingTimers.add(timer);
	};

	host.registerEvent(host.app.workspace.on("file-open", schedule));

	// Startup: files restored into the workspace never fire file-open.
	host.app.workspace.onLayoutReady(() => {
		for (const leaf of host.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (view instanceof MarkdownView) schedule(view.file);
		}
	});
}

/**
 * Collect the marked heading-callout sections of a file from the metadata
 * cache and apply them to every markdown view showing that file.
 */
function applyFoldDefaults(app: App, file: TFile): void {
	const cache = app.metadataCache.getFileCache(file);
	const headings = cache?.headings;
	if (!headings || headings.length === 0) return;

	const marked: MarkedSection[] = [];
	for (let i = 0; i < headings.length; i++) {
		const h = headings[i]!;
		// Escaped headings (`# \[!id]-`) keep the backslash in the cached
		// text, so they never match here.
		const m = MARKED_HEADING_RE.exec(h.heading);
		if (!m) continue;
		// Section = heading line through the line before the next heading of
		// the same or a higher level (∞ = end of file, clamped per view).
		let endLine = Number.MAX_SAFE_INTEGER;
		for (let j = i + 1; j < headings.length; j++) {
			if (headings[j]!.level <= h.level) {
				endLine = headings[j]!.position.start.line - 1;
				break;
			}
		}
		marked.push({
			line: h.position.start.line,
			endLine,
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
		const folds = (mode.getFoldInfo?.()?.folds ?? []).filter((fold) => {
			const mk = marked.find((m) => m.line === fold.from);
			if (mk && mk.mark === "+") {
				changed = true;
				return false;
			}
			return true;
		});
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
