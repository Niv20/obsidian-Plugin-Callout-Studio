/**
 * editor/calloutTokens.ts — Single source of truth for callout token syntax.
 *
 * A `[!name]` token can play one of three render roles depending on where it
 * sits on the line (see CalloutRenderRole in types.ts):
 *
 * - regular: `> [!name]` — blockquote callout header (rendered natively by
 *   Obsidian; this plugin only restyles it via CSS).
 * - heading: `## [!name]` — `[!` is the first content after the `#` marks.
 * - inline:  any other `[!name]` mid-line — rendered as a small pill.
 *
 * The classifier here is shared by the vault scanner (discovery/statistics),
 * the Live Preview decoration builder, the reading-view post-processor, and
 * the autocomplete trigger, so all consumers agree on one grammar.
 *
 * Escapes: `\[!name]` is never a token. Wikilinks (`[[!name]]`) and markdown
 * links (`[!name](url)`) are also never tokens.
 */
import type { CalloutRenderRole } from "../types";

/**
 * Heading callout header: 1–6 hashes, at least one space/tab, then the token
 * as the first content. Captures: 1=hashes, 2=raw id, 3=fold mark, 4=title.
 * Lines with 7+ hashes or no space after the hashes are not headings in
 * markdown, so they fall through to the inline scan.
 */
export const HEADING_CALLOUT_RE =
	/^(#{1,6})[ \t]+\[!([^\]\n\r]+)\]([+-])?[ \t]*(.*)$/;

/**
 * Rewrites the fold mark of a heading callout header. Captures:
 * 1=everything up to and including `]`, 2=raw id, 3=existing mark (optional).
 * Group 3 being optional lets one `replace` both add and remove marks.
 */
export const HEADING_FOLD_MARK_RE = /^(#{1,6}[ \t]+\[!([^\]\n\r]+)\])([+-])?/;

/**
 * Native blockquote callout header prefix (any nesting depth). Lines matching
 * this belong to Obsidian's own callout rendering — the heading/inline logic
 * must leave them alone. Captures: 1=quote prefix.
 */
export const BLOCKQUOTE_CALLOUT_PREFIX_RE = /^(\s*(?:>[ \t]?)+)\[!/;

/**
 * Full blockquote callout header including the id.
 * Captures: 1=quote prefix, 2=raw id.
 */
export const BLOCKQUOTE_CALLOUT_HEADER_RE =
	/^(\s*(?:>[ \t]?)+)\[!([^\]\n\r]+)\]/;

/**
 * Matches the token at the start of a reading-view heading's rendered text
 * (`# [!id]± title` renders as an hN whose text starts with `[!id]± `).
 * Captures: 1=raw id, 2=fold mark.
 */
export const RENDERED_HEADING_TOKEN_RE = /^\[!([^\]\n\r]+)\]([+-])?[ \t]*/;

/** One `[!name]` token found on a line, with its role and exact position. */
export interface LineCalloutToken {
	role: CalloutRenderRole;
	/** Raw id exactly as written (pass through normalizeCalloutId to match). */
	rawId: string;
	/** Offset of `[` within the line. */
	from: number;
	/** Offset just past `]` — and past the fold mark for heading tokens. */
	to: number;
	/** Fold mark ("" for none; only heading tokens ever carry one). */
	foldMark: "" | "+" | "-";
	/** Heading tokens only: true when custom title text follows the token. */
	hasTitle: boolean;
	/** Heading level 1–6 for heading tokens, 0 otherwise. */
	headingLevel: number;
}

/**
 * Blanks out `inline code` spans with spaces, preserving string length so
 * token offsets computed on the result are valid in the original line.
 */
export function stripInlineCode(line: string): string {
	if (!line.includes("`")) return line;
	return line.replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length));
}

/**
 * Scans one raw markdown line and returns every callout token on it, already
 * classified by role. Cheap for the common case: bails immediately when the
 * line contains no `[!`. Inline-code spans are ignored. Does NOT know about
 * multi-line context (fenced code blocks, frontmatter, math) — callers that
 * scan whole documents must skip those lines themselves.
 */
export function scanLineForCalloutTokens(rawLine: string): LineCalloutToken[] {
	if (rawLine.indexOf("[!") === -1) return [];
	const line = stripInlineCode(rawLine);

	// Native blockquote callout header → single regular token; the rest of the
	// line is the callout's title, which Obsidian renders — no pills inside it.
	const quoteHeader = line.match(BLOCKQUOTE_CALLOUT_HEADER_RE);
	if (quoteHeader) {
		const prefix = quoteHeader[1] ?? "";
		const rawId = quoteHeader[2] ?? "";
		if (!rawId.trim()) return [];
		return [
			{
				role: "regular",
				rawId,
				from: prefix.length,
				to: prefix.length + 2 + rawId.length + 1,
				foldMark: "",
				hasTitle: false,
				headingLevel: 0,
			},
		];
	}

	const tokens: LineCalloutToken[] = [];

	// Heading callout header → heading token; the trailing title text may
	// still contain inline tokens, so keep scanning after it.
	let inlineScanFrom = 0;
	const heading = line.match(HEADING_CALLOUT_RE);
	if (heading) {
		const rawId = heading[2] ?? "";
		const foldMark = (heading[3] ?? "") as "" | "+" | "-";
		const from = line.indexOf("[!");
		const to = from + 2 + rawId.length + 1 + foldMark.length;
		// `# [!text](url)` is a markdown link at heading start, not a callout.
		const isLink = line[to] === "(";
		if (rawId.trim() && !isLink) {
			tokens.push({
				role: "heading",
				rawId,
				from,
				to,
				foldMark,
				hasTitle: (heading[4] ?? "").trim().length > 0,
				headingLevel: (heading[1] ?? "").length,
			});
			inlineScanFrom = to;
		}
	}

	// Inline tokens: manual indexOf scan (no regex) so adjacent tokens,
	// escapes, and link syntax are handled exactly and cheaply.
	let searchFrom = inlineScanFrom;
	for (;;) {
		const idx = line.indexOf("[!", searchFrom);
		if (idx === -1) break;
		searchFrom = idx + 2;
		const before = idx > 0 ? line[idx - 1] : "";
		if (before === "\\") continue; // escaped: \[!name]
		if (before === "[") continue; // wikilink/embed: [[!name]]
		const close = line.indexOf("]", idx + 2);
		if (close === -1) break; // unclosed — nothing further can close either
		const rawId = line.slice(idx + 2, close);
		// The \n guard matters when scanning rendered multi-line text nodes
		// (reading view); raw markdown lines never contain newlines.
		if (!rawId.trim() || rawId.includes("[") || rawId.includes("\n"))
			continue;
		if (line[close + 1] === "(") {
			// Markdown link whose text starts with `!`: [!name](url)
			searchFrom = close + 1;
			continue;
		}
		tokens.push({
			role: "inline",
			rawId,
			from: idx,
			to: close + 1,
			foldMark: "",
			hasTitle: false,
			headingLevel: 0,
		});
		searchFrom = close + 1;
	}

	return tokens;
}

/**
 * Iterates every callout token in a full markdown document, skipping YAML
 * frontmatter and fenced code blocks (``` / ~~~, including fences nested in
 * blockquotes). Used by the vault scanners so discovery, statistics, and
 * prune-counting all see heading and inline usages, not just blockquotes.
 */
export function forEachCalloutToken(
	content: string,
	cb: (rawId: string, role: CalloutRenderRole, lineIndex: number) => void,
): void {
	if (content.indexOf("[!") === -1) return;

	const lines = content.split("\n");
	let i = 0;

	// Skip YAML frontmatter (opening --- must be the very first line).
	if (lines[0]?.trimEnd() === "---") {
		i = 1;
		while (i < lines.length) {
			const t = lines[i]?.trimEnd();
			i++;
			if (t === "---" || t === "...") break;
		}
	}

	// Fence state: marker char + minimum length required to close.
	const fenceOpenRe = /^(?:\s*>\s*)*\s*(`{3,}|~{3,})/;
	let fenceMarker: string | null = null;

	for (; i < lines.length; i++) {
		const line = lines[i] ?? "";

		const fence = line.match(fenceOpenRe);
		if (fenceMarker) {
			// Inside a fence: only a matching closer gets us out.
			if (
				fence &&
				fence[1] &&
				fence[1][0] === fenceMarker[0] &&
				fence[1].length >= fenceMarker.length
			) {
				fenceMarker = null;
			}
			continue;
		}
		if (fence && fence[1]) {
			fenceMarker = fence[1];
			continue;
		}

		if (line.indexOf("[!") === -1) continue;
		for (const token of scanLineForCalloutTokens(line)) {
			cb(token.rawId, token.role, i);
		}
	}
}
