/**
 * editor/livepreview/fold.ts — heading-callout folding.
 *
 * The single fold path for every editor the in-bar fold arrow appears in:
 * real notes and the embedded settings preview alike. The section range comes
 * from `foldable()` of `@codemirror/language`, which queries the fold service
 * Obsidian registers for headings — so the arrow folds EXACTLY the range
 * Obsidian's own pre-heading fold arrow would fold.
 *
 * `@codemirror/language` is an esbuild external supplied by Obsidian at
 * runtime, so `foldable`/`foldEffect`/`foldedRanges` are the SAME service and
 * effect/field instances the native arrow uses: folds made here are
 * indistinguishable from native ones (persisted and restored the same way),
 * and reading `foldedRanges` reflects native-arrow folds too.
 *
 * The settings preview editor may lack Obsidian's fold service and even the
 * fold StateField. When `foldable()` returns null the range falls back to a
 * document-text scan, and if a dispatched fold effect is dropped because the
 * field is missing, `codeFolding()` is appended on demand; its parts are
 * module-level singletons, so re-adding is a deduped no-op in editors that
 * already fold.
 */
import {
	codeFolding,
	foldable,
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
export function getFoldedLines(view: EditorView): ReadonlySet<number> {
	const lines = new Set<number>();
	const doc = view.state.doc;
	foldedRanges(view.state).between(0, doc.length, (from) => {
		lines.add(doc.lineAt(from).number - 1);
	});
	return lines;
}

/** Toggle the fold of the heading section starting on the given 0-based line. */
export function toggleHeadingFold(
	view: EditorView,
	headingLine: number,
): void {
	const existing = foldStartingAt(view, headingLine);
	if (existing) {
		view.dispatch({ effects: unfoldEffect.of(existing) });
		return;
	}

	const doc = view.state.doc;
	const line = doc.line(headingLine + 1);
	let range = foldable(view.state, line.from, line.to);
	if (!range) {
		// No fold service in this editor (settings preview) — bound the
		// section by scanning the document text instead.
		const endLine = scanSectionEnd(view, headingLine);
		if (endLine <= headingLine) return; // empty section — nothing to fold
		range = {
			from: line.to,
			to: doc.line(Math.min(endLine, doc.lines - 1) + 1).to,
		};
	}
	if (range.to <= range.from) return;

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
 * line. Regex fallback for editors without Obsidian's fold service.
 */
function scanSectionEnd(view: EditorView, headingLine: number): number {
	const doc = view.state.doc;
	const headText = doc.line(headingLine + 1).text;
	const level = headText.match(/^(#{1,6})\s/)?.[1]?.length ?? 6;
	for (let ln = headingLine + 1; ln < doc.lines; ln++) {
		const m = doc.line(ln + 1).text.match(/^(#{1,6})\s/);
		if (m?.[1] && m[1].length <= level) return ln - 1;
	}
	return doc.lines - 1;
}
