/**
 * editor/autoCompleteCursor.ts — where the cursor lands after a suggestion.
 *
 * Picking a callout from the popover is two separate jobs: writing the token
 * (calloutWriter, per role) and then putting the cursor where the user would
 * have put it. This is the second one, and it is deferred rather than immediate
 * — Obsidian closes the popover and restores its own selection first, so the
 * placement has to happen after that frame or it is simply overwritten.
 *
 * The block role is the fiddly one: the cursor belongs on the callout's *body*,
 * which means the next line has to carry a matching `>` prefix. It may already
 * have a deeper one (a nested callout continuing below), in which case the
 * deeper prefix wins and nothing is rewritten; a shallower one is widened to
 * match the header; and at end-of-document there is no next line at all, so one
 * is created carrying the prefix. The heading role wants the opposite — a plain
 * line with no prefix, because a heading callout has no body of its own.
 */
import type { Editor } from "obsidian";
import type { CalloutRenderRole } from "../types";

const CALLOUT_QUOTE_PREFIX_REGEX = /^((?:\s*> ?|\t)+)/;

const countQuoteTokens = (prefix: string): number =>
	(prefix.match(/>/g) ?? []).length;

/**
 * Move the cursor to the start of the line below `line`, creating a plain
 * new line at end-of-document. Used after a heading-callout selection.
 */
export function moveCursorToLineBelow(editor: Editor, line: number): void {
	const nextLine = line + 1;
	if (nextLine < editor.lineCount()) {
		editor.setCursor({ line: nextLine, ch: 0 });
		return;
	}
	editor.replaceRange("\n", { line, ch: editor.getLine(line).length });
	editor.setCursor({ line: nextLine, ch: 0 });
}

/**
 * Place the cursor for a pick on `line` that rendered as `role`, once the
 * popover has finished closing.
 */
export function placeCursorAfterPick(
	editor: Editor,
	line: number,
	role: CalloutRenderRole,
): void {
	window.requestAnimationFrame(() => {
		window.setTimeout(() => {
			if (role === "heading") {
				// Heading callout: Enter drops the cursor to the
				// START of the next line — plain, with NO `>` prefix
				// (a heading callout has no body of its own).
				moveCursorToLineBelow(editor, line);
				return;
			}

			const lineText = editor.getLine(line);
			const quoteMatch = CALLOUT_QUOTE_PREFIX_REGEX.exec(lineText);
			const quotePrefix = quoteMatch?.[1] ?? "> ";
			const quoteDepth = countQuoteTokens(quotePrefix);
			const nextLine = line + 1;

			if (nextLine < editor.lineCount()) {
				const nextLineText = editor.getLine(nextLine);
				const nextPrefix =
					CALLOUT_QUOTE_PREFIX_REGEX.exec(nextLineText)?.[1] ?? "";
				const nextDepth = countQuoteTokens(nextPrefix);
				const targetPrefix =
					nextDepth >= quoteDepth ? nextPrefix : quotePrefix;

				if (nextPrefix !== targetPrefix) {
					editor.replaceRange(
						targetPrefix,
						{ line: nextLine, ch: 0 },
						{ line: nextLine, ch: nextPrefix.length },
					);
				}

				editor.setCursor({
					line: nextLine,
					ch: targetPrefix.length,
				});
				return;
			}

			const endPos = { line, ch: lineText.length };
			editor.replaceRange("\n" + quotePrefix, endPos);
			editor.setCursor({
				line: line + 1,
				ch: quotePrefix.length,
			});
		}, 50);
	});
}
