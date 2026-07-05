/**
 * editor/contextmenu/sectionOps.ts — Whole-section operations for heading
 * callouts.
 *
 * A heading callout "owns" its section: the heading line plus everything up
 * to (but not including) the next heading of the same or a higher level.
 * Cut / copy / delete act on that entire range. These are single editor
 * transactions, so Ctrl/Cmd+Z restores them — no confirmation modal is used
 * (unlike DEFINITION deletion, which is guarded elsewhere).
 */
import type { Editor, EditorPosition } from "obsidian";

const HEADING_LINE_RE = /^(#{1,6})[ \t]/;

export interface HeadingSectionRange {
	from: EditorPosition;
	to: EditorPosition;
	text: string;
}

/**
 * Compute the section range for a heading callout at `headingLine`.
 * The range starts at the heading line and ends just before the next
 * heading whose level ≤ `level` (or at end-of-document).
 */
export function getHeadingSectionRange(
	editor: Editor,
	headingLine: number,
	level: number,
): HeadingSectionRange {
	const lastLine = editor.lineCount() - 1;
	let endLine = lastLine;
	for (let line = headingLine + 1; line <= lastLine; line++) {
		const m = HEADING_LINE_RE.exec(editor.getLine(line));
		if (m && m[1] && m[1].length <= level) {
			endLine = line - 1;
			break;
		}
	}

	const from: EditorPosition = { line: headingLine, ch: 0 };
	// Include the trailing newline so the whole block (and the blank line it
	// leaves behind) is removed cleanly — except at end-of-document, where
	// there is no newline to consume.
	const to: EditorPosition =
		endLine < lastLine
			? { line: endLine + 1, ch: 0 }
			: { line: endLine, ch: editor.getLine(endLine).length };

	return { from, to, text: editor.getRange(from, to) };
}

/** Copy the whole section to the clipboard (trailing newline trimmed). */
export function copyHeadingSection(range: HeadingSectionRange): void {
	void navigator.clipboard.writeText(range.text.replace(/\n$/, ""));
}

/** Copy then delete the whole section. */
export function cutHeadingSection(
	editor: Editor,
	range: HeadingSectionRange,
): void {
	copyHeadingSection(range);
	editor.replaceRange("", range.from, range.to);
}

/** Delete the whole section (undoable via the editor's history). */
export function deleteHeadingSection(
	editor: Editor,
	range: HeadingSectionRange,
): void {
	editor.replaceRange("", range.from, range.to);
}
