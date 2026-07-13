/**
 * editor/livepreview/previewFold.ts — heading fold for the settings live
 * preview.
 *
 * Heading callouts in real notes fold through Obsidian's view-level fold API
 * (headingFold.ts), which needs a workspace MarkdownView. The embedded editor
 * in the settings previews (settings/LiveCalloutPreview.ts) is a genuine
 * CodeMirror EditorView but NOT a workspace leaf, so that path can't reach it
 * and the in-bar fold arrow would no-op there.
 *
 * Instead the preview drives CodeMirror's own fold state directly with
 * `foldEffect`/`unfoldEffect`. `@codemirror/language` is an esbuild external
 * supplied by Obsidian at runtime, so these are the SAME effect/field
 * instances Obsidian's built-in pre-heading fold arrow dispatches — folding
 * here collapses the section exactly like that native arrow (which does work
 * in the embedded preview). If an editor ever lacks the fold field,
 * `codeFolding()` is appended on demand; its parts are module-level
 * singletons, so re-adding is a deduped no-op in editors that already fold.
 */
import {
	codeFolding,
	foldEffect,
	foldedRanges,
	unfoldEffect,
} from "@codemirror/language";
import { StateEffect } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

interface FoldRange {
	from: number;
	to: number;
}

/** The folded range that starts on the given 0-based line, if any. */
function foldStartingAt(
	view: EditorView,
	headingLine: number,
): FoldRange | null {
	let found: FoldRange | null = null;
	const doc = view.state.doc;
	foldedRanges(view.state).between(0, doc.length, (from, to) => {
		if (doc.lineAt(from).number - 1 === headingLine) {
			found = { from, to };
			return false; // stop iterating
		}
		return undefined;
	});
	return found;
}

/** The set of heading start-lines (0-based) currently folded in this editor. */
export function getPreviewFoldedLines(view: EditorView): ReadonlySet<number> {
	const lines = new Set<number>();
	const doc = view.state.doc;
	foldedRanges(view.state).between(0, doc.length, (from) => {
		lines.add(doc.lineAt(from).number - 1);
	});
	return lines;
}

/** Toggle the fold of one heading section in the preview editor. */
export function togglePreviewFold(
	view: EditorView,
	headingLine: number,
	endLine: number,
): void {
	if (endLine <= headingLine) return; // empty section — nothing to fold

	const existing = foldStartingAt(view, headingLine);
	if (existing) {
		view.dispatch({ effects: unfoldEffect.of(existing) });
		return;
	}

	// Same shape as a native heading fold: from the end of the heading line to
	// the end of the section's last line.
	const doc = view.state.doc;
	const range = {
		from: doc.line(headingLine + 1).to,
		to: doc.line(Math.min(endLine, doc.lines - 1) + 1).to,
	};
	view.dispatch({ effects: foldEffect.of(range) });
	if (!foldStartingAt(view, headingLine)) {
		// The fold StateField wasn't in this editor's config, so the effect
		// was dropped. Add the folding extension and retry (two dispatches:
		// a field appended mid-transaction doesn't see that transaction's
		// own effects).
		view.dispatch({ effects: StateEffect.appendConfig.of(codeFolding()) });
		view.dispatch({ effects: foldEffect.of(range) });
	}
}

/**
 * Last line (0-based) of a heading's section within the editor document: the
 * line before the next heading of the same or a higher level, else the last
 * line. Used in the preview where there is no metadataCache to consult.
 */
export function previewSectionEnd(
	view: EditorView,
	headingLine: number,
): number {
	const doc = view.state.doc;
	const headText = doc.line(headingLine + 1).text;
	const level = headText.match(/^(#{1,6})\s/)?.[1]?.length ?? 6;
	for (let ln = headingLine + 1; ln < doc.lines; ln++) {
		const m = doc.line(ln + 1).text.match(/^(#{1,6})\s/);
		if (m?.[1] && m[1].length <= level) return ln - 1;
	}
	return doc.lines - 1;
}
