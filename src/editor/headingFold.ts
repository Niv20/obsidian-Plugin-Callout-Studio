/**
 * editor/headingFold.ts — Shared primitives for heading-callout folding.
 *
 * Heading callouts (`## [!id] Title`) fold through Obsidian's own heading
 * folding, driven by the undocumented-but-stable
 * `view.currentMode.getFoldInfo()/applyFoldInfo()` pair (the same API the
 * Creases plugin uses). Two consumers share these helpers: the on-open default
 * applier (headingFoldManager.ts) and the in-bar fold arrow's click handler
 * (livepreview/widgets.ts).
 *
 * Native heading folding only exists when the core "Fold heading" setting is
 * on; every call here is optional-chained and try/catch-guarded so a disabled
 * setting or a future API change degrades to a no-op rather than an error.
 */
import { MarkdownView } from "obsidian";
import type { App, HeadingCache } from "obsidian";
import type { EditorView } from "@codemirror/view";

export interface FoldRange {
	from: number;
	to: number;
}

export interface FoldInfo {
	folds: FoldRange[];
	lines: number;
}

/** Undocumented fold API on MarkdownView.currentMode. */
export interface FoldCapableMode {
	getFoldInfo?: () => FoldInfo | null;
	applyFoldInfo?: (info: FoldInfo) => void;
}

/**
 * Whether Obsidian's core "Fold heading" setting is on. When it is off, native
 * heading folding does not exist, so the whole feature is a no-op and no arrow
 * is drawn. `getConfig` is undocumented; if it is unavailable we assume the
 * Obsidian default (on) rather than hide the feature.
 */
export function isHeadingFoldEnabled(app: App): boolean {
	try {
		const vault = app.vault as unknown as {
			getConfig?: (key: string) => unknown;
		};
		if (typeof vault.getConfig !== "function") return true;
		return vault.getConfig("foldHeading") !== false;
	} catch {
		return true;
	}
}

/**
 * Find the MarkdownView whose editor hosts a given CodeMirror EditorView. Used
 * by the in-widget click handler to reach the view's fold API from the CM
 * `view` it is handed. `editor.cm` is undocumented but stable.
 */
export function resolveMarkdownView(
	app: App,
	cm: EditorView,
): MarkdownView | null {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (view instanceof MarkdownView) {
			const editorCm = (view.editor as unknown as { cm?: EditorView }).cm;
			if (editorCm === cm) return view;
		}
	}
	return null;
}

/**
 * Last line (0-based) of a heading's section: the line before the next heading
 * of the same or a higher level, or Number.MAX_SAFE_INTEGER for the last
 * section (callers clamp to the document length).
 */
export function headingSectionEnd(
	headings: HeadingCache[],
	index: number,
): number {
	const level = headings[index]!.level;
	for (let j = index + 1; j < headings.length; j++) {
		if (headings[j]!.level <= level) {
			return headings[j]!.position.start.line - 1;
		}
	}
	return Number.MAX_SAFE_INTEGER;
}

/** The set of heading start-lines currently folded in a view (0-based). */
export function getFoldedHeadingLines(view: MarkdownView): Set<number> {
	const lines = new Set<number>();
	try {
		const mode = view.currentMode as unknown as FoldCapableMode;
		for (const fold of mode.getFoldInfo?.()?.folds ?? []) {
			lines.add(fold.from);
		}
	} catch {
		// Fold API unavailable — treat everything as expanded.
	}
	return lines;
}

/**
 * Toggle the fold of one heading section. `endLine` is the section's last line
 * (from headingSectionEnd), clamped here to the document length. Folding an
 * empty section (no lines below the heading) is a no-op, matching Obsidian.
 */
export function toggleHeadingFold(
	view: MarkdownView,
	headingLine: number,
	endLine: number,
): void {
	try {
		const mode = view.currentMode as unknown as FoldCapableMode;
		if (typeof mode?.applyFoldInfo !== "function") return;

		const lineCount = view.editor?.lineCount() ?? 0;
		const lastLine = Math.max(lineCount - 1, 0);
		const current = mode.getFoldInfo?.()?.folds ?? [];
		const alreadyFolded = current.some((fold) => fold.from === headingLine);

		let folds: FoldRange[];
		if (alreadyFolded) {
			folds = current.filter((fold) => fold.from !== headingLine);
		} else {
			const to = Math.min(endLine, lastLine);
			if (to <= headingLine) return; // empty section — nothing to fold
			folds = [...current, { from: headingLine, to }];
		}

		mode.applyFoldInfo?.({ folds, lines: lastLine + 1 });
	} catch (e) {
		console.debug("[CalloutStudio] toggleHeadingFold failed", e);
	}
}
