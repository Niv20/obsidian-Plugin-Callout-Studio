/**
 * editor/calloutCodeContext.ts — is this `[!` code, or is it callout syntax?
 *
 * Every other consumer of the syntax already answers this: the line scanner
 * blanks inline-code spans before it looks for tokens, and every whole-document
 * consumer (discovery, the statistics scan, the vault rewriters) walks
 * `createDocumentLineFilter`, which hides YAML frontmatter and fenced blocks. A
 * note that merely *documents* callout syntax is therefore not a note that uses
 * it — everywhere except the editor popover, which had no such check at all and
 * would rewrite a `[!` inside a code sample into a real callout.
 *
 * So this asks the same two questions through the same two functions rather
 * than growing a second opinion beside them.
 *
 * The caller passes a line accessor rather than an `Editor`: the fenced-block
 * half is multi-line state, and reading it through a plain function keeps this
 * testable without CodeMirror and reusable by anything else holding text.
 */
import { createDocumentLineFilter, stripInlineCode } from "./calloutTokens";

export interface CalloutCodeContextQuery {
	/** The line the token sits on, raw. */
	line: string;
	/** Index of the token's `[` within {@link line}. */
	tokenIndex: number;
	/** That line's index in the document. */
	lineIndex: number;
	/** Any line of the document, by index — `editor.getLine` in the app. */
	lineAt: (index: number) => string;
}

/**
 * Whether the `[!` at `tokenIndex` is inside inline code, a fenced code block,
 * or YAML frontmatter.
 *
 * Indentation is deliberately not one of the questions. Four spaces opens a code
 * block only at the top level; the identical line under a list item is an
 * ordinary blockquote, and no other consumer here reads indentation as code
 * either — answering yes would create the asymmetry rather than remove it.
 *
 * Cost is one pass over the line, then one pass over the lines above the cursor,
 * so callers should ask only once they know a token is really there.
 */
export function isCalloutTokenInCode(query: CalloutCodeContextQuery): boolean {
	const { line, tokenIndex, lineIndex, lineAt } = query;

	// Inline code: the span is blanked to spaces of the same length, so the
	// token's own offset still answers for it — and a token merely sitting on
	// the same line as a code span is untouched.
	if (line.includes("`") && stripInlineCode(line)[tokenIndex] !== "[") {
		return true;
	}

	// Fences and frontmatter are multi-line state, so the filter has to see
	// every line from the top, in order, with its real index. That is its
	// contract, and skipping lines desyncs it.
	const isContentLine = createDocumentLineFilter();
	let isContent = true;
	for (let i = 0; i <= lineIndex; i++) {
		isContent = isContentLine(lineAt(i), i);
	}
	return !isContent;
}
