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
 * Escapes: `\[!name]` is never a token. Markdown links (`[!name](url)`) and
 * anything inside a wikilink (`[[#[!name] Title]]` — a heading reference, not
 * a callout) are also never tokens; wikilink heading references get their own
 * display cleanup via findWikilinkCalloutRefs / parseHeadingRefDisplayText.
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

/**
 * Matches the callout token at the start of an Outline-pane item's displayed
 * text. The outline renders HeadingCache.heading with brackets stripped, so
 * both `[!id]± Title` and `!id± Title` must parse. In the bracketless form an
 * id containing spaces cannot be delimited by syntax alone — see the resolver
 * extension in parseOutlineHeadingText.
 * Captures: 1=bracketed id, 2=bracketless id, 3=fold mark.
 */
const OUTLINE_HEADING_TOKEN_RE =
	/^(?:\[!([^\]\n\r]+)\]|!(\S+?))([+-])?(?:[ \t]+|$)/;

/** Longest space-separated id the bracketless extension will try to resolve. */
const OUTLINE_ID_MAX_EXTRA_WORDS = 5;

/** Parsed callout token from an Outline pane item's displayed text. */
export interface OutlineHeadingToken {
	/** Raw id exactly as written (pass through normalizeCalloutId to match). */
	rawId: string;
	foldMark: "" | "+" | "-";
	/** Displayed title text after the token ("" when the heading has none). */
	title: string;
}

/**
 * Parses the displayed text of an Outline pane item. Returns null when the
 * text does not start with a callout token — callers must then leave the
 * item untouched.
 *
 * Ids may legally contain spaces ("multi word callout"), which the
 * bracketless outline form cannot delimit. When `isKnownId` is provided and
 * the first word alone is not a known id, the id is greedily extended one
 * word at a time (up to a small cap) until a known id is found; otherwise the
 * single-word parse stands, matching how unknown ids render elsewhere.
 */
export function parseOutlineHeadingText(
	text: string,
	isKnownId?: (rawId: string) => boolean,
): OutlineHeadingToken | null {
	const m = text.match(OUTLINE_HEADING_TOKEN_RE);
	if (!m) return null;
	const bracketed = m[1] !== undefined;
	let rawId = m[1] ?? m[2] ?? "";
	if (!rawId.trim()) return null;
	let foldMark = (m[3] ?? "") as "" | "+" | "-";
	let title = text.slice(m[0].length);

	if (!bracketed && foldMark === "" && isKnownId && !isKnownId(rawId)) {
		const wordRe = /\S+/g;
		let word: RegExpExecArray | null;
		let extraWords = 0;
		while (
			(word = wordRe.exec(title)) !== null &&
			extraWords < OUTLINE_ID_MAX_EXTRA_WORDS
		) {
			extraWords++;
			let candidate = `${rawId} ${title.slice(0, word.index + word[0].length)}`;
			let mark: "" | "+" | "-" = "";
			const last = candidate.charAt(candidate.length - 1);
			if (last === "+" || last === "-") {
				mark = last;
				candidate = candidate.slice(0, -1);
			}
			if (isKnownId(candidate)) {
				rawId = candidate;
				foldMark = mark;
				title = title.slice(wordRe.lastIndex).replace(/^[ \t]+/, "");
				break;
			}
		}
	}

	return { rawId, foldMark, title };
}

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
 * Wikilink span, lazily matched. The lookahead rejects a `]]` that is
 * followed by another `]`: in `[[#[!22]]]` the first two `]` belong to the
 * token's close + link close only under a mis-parse — the real link close is
 * the LAST `]]` of the run (matching how a title-less heading reference is
 * written). Shared by stripWikilinks and findWikilinkCalloutRefs so both
 * agree on one link grammar.
 */
const WIKILINK_RE = /\[\[([^\n]*?)\]\](?!\])/g;

/**
 * Blanks out wikilink spans (`[[...]]`, including embeds) with spaces,
 * preserving string length. A trailing `[[` that never closes is blanked to
 * the end of the line too: that is a link mid-typing, and suppressing tokens
 * there prevents a pill from flashing while the user types the closing `]]`.
 */
export function stripWikilinks(line: string): string {
	if (!line.includes("[[")) return line;
	let out = line.replace(WIKILINK_RE, (m) => " ".repeat(m.length));
	const open = out.indexOf("[[");
	if (open !== -1) {
		out = out.slice(0, open) + " ".repeat(out.length - open);
	}
	return out;
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
	const line = stripWikilinks(stripInlineCode(rawLine));

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
		if (before === "[") continue; // defensive; stripWikilinks blanks [[!name]]
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

/**
 * A `[!id]` token inside a wikilink's heading reference, e.g. the token in
 * `[[#[!tip] Title]]` or `[[Note#[!tip] Title]]`. These are never callouts
 * (scanLineForCalloutTokens excludes wikilink content); Live Preview instead
 * hides the token — optionally behind the callout's icon — so the displayed
 * link reads `#Title`.
 */
export interface WikilinkCalloutRef {
	/** Raw id exactly as written (pass through normalizeCalloutId to match). */
	rawId: string;
	foldMark: "" | "+" | "-";
	/** Offset of `[` of the token within the line. */
	from: number;
	/** Offset past `]`, fold mark, and the whitespace separating the title. */
	to: number;
	/** Offset of the opening `[[` within the line. */
	linkFrom: number;
	/** Offset just past the closing `]]`. */
	linkTo: number;
	/** True when the link carries a `|alias` (Obsidian displays only that). */
	hasAlias: boolean;
	/** True when the token sits in the alias (display) text, not the target. */
	inAlias: boolean;
	/** True when title text follows the token inside its subpath segment. */
	hasTitle: boolean;
}

/**
 * Finds every `[!id]` token inside the wikilinks of one raw markdown line.
 * In the target, only tokens directly after a `#` count — those sit in a
 * heading reference; a token elsewhere is part of a file name and stays
 * untouched. In the alias, only a token opening the alias of a link whose
 * target has a `#` counts (TOC plugins alias heading links with the bare
 * heading text) — mirroring what `parseHeadingRefDisplayText` accepts.
 * Inline-code spans are ignored; unclosed links (mid-typing) yield nothing.
 */
export function findWikilinkCalloutRefs(rawLine: string): WikilinkCalloutRef[] {
	if (rawLine.indexOf("[[") === -1) return [];
	if (rawLine.indexOf("#[!") === -1 && rawLine.indexOf("|[!") === -1) {
		return [];
	}
	const line = stripInlineCode(rawLine);
	const refs: WikilinkCalloutRef[] = [];
	// Fresh regex per call: WIKILINK_RE is shared and /g exec mutates lastIndex.
	const linkRe = new RegExp(WIKILINK_RE.source, "g");
	let link: RegExpExecArray | null;
	while ((link = linkRe.exec(line)) !== null) {
		const inner = link[1] ?? "";
		const innerStart = link.index + 2;
		const pipeIdx = inner.indexOf("|");
		const target = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
		let search = 0;
		for (;;) {
			const hashIdx = target.indexOf("#[!", search);
			if (hashIdx === -1) break;
			const tokenStart = hashIdx + 1;
			search = tokenStart + 2;
			const close = target.indexOf("]", tokenStart + 2);
			if (close === -1) break;
			const rawId = target.slice(tokenStart + 2, close);
			if (!rawId.trim() || rawId.includes("[")) continue;
			let to = close + 1;
			let foldMark: "" | "+" | "-" = "";
			const markCh = target[to];
			if (markCh === "+" || markCh === "-") {
				foldMark = markCh;
				to++;
			}
			while (to < target.length && (target[to] === " " || target[to] === "\t")) {
				to++;
			}
			// Title runs to the next subpath separator (nested heading paths).
			const nextHash = target.indexOf("#", to);
			const segEnd = nextHash === -1 ? target.length : nextHash;
			refs.push({
				rawId,
				foldMark,
				from: innerStart + tokenStart,
				to: innerStart + to,
				linkFrom: link.index,
				linkTo: link.index + link[0].length,
				hasAlias: pipeIdx !== -1,
				inAlias: false,
				hasTitle: target.slice(to, segEnd).trim().length > 0,
			});
			search = close + 1;
		}
		// Alias side: a token opening the alias of a heading link (the shape
		// TOC plugins generate — `[[#[!id]|[!id]]]`). Position 0 only and a
		// `#` in the target, matching parseHeadingRefDisplayText, so Live
		// Preview and reading view agree on what renders.
		if (pipeIdx === -1 || !target.includes("#")) continue;
		const alias = inner.slice(pipeIdx + 1);
		if (!alias.startsWith("[!")) continue;
		const aliasClose = alias.indexOf("]", 2);
		if (aliasClose === -1) continue;
		const aliasId = alias.slice(2, aliasClose);
		if (!aliasId.trim() || aliasId.includes("[")) continue;
		let aliasTo = aliasClose + 1;
		let aliasMark: "" | "+" | "-" = "";
		const aliasMarkCh = alias[aliasTo];
		if (aliasMarkCh === "+" || aliasMarkCh === "-") {
			aliasMark = aliasMarkCh;
			aliasTo++;
		}
		while (
			aliasTo < alias.length &&
			(alias[aliasTo] === " " || alias[aliasTo] === "\t")
		) {
			aliasTo++;
		}
		const aliasStart = innerStart + pipeIdx + 1;
		refs.push({
			rawId: aliasId,
			foldMark: aliasMark,
			from: aliasStart,
			to: aliasStart + aliasTo,
			linkFrom: link.index,
			linkTo: link.index + link[0].length,
			hasAlias: true,
			inAlias: true,
			// A `#` in an alias is literal text — the title runs to its end.
			hasTitle: alias.slice(aliasTo).trim().length > 0,
		});
	}
	return refs;
}

/** Parsed heading-callout token in a rendered link's display text. */
export interface HeadingRefDisplayToken {
	/** Display text before the token (`#`, `Note#`, or "") — kept verbatim. */
	prefix: string;
	/** Raw id exactly as written (pass through normalizeCalloutId to match). */
	rawId: string;
	foldMark: "" | "+" | "-";
	/** Display text after the token ("" when the heading has no title). */
	title: string;
	/**
	 * True when the token reached end-of-text without its closing `]`. That is
	 * how Obsidian renders a title-less reference: `[[#[!22]]]` parses as a
	 * link to `#[!22` (terminated at the FIRST `]]`) plus a stray `]` after
	 * the anchor — which the caller should strip.
	 */
	truncated: boolean;
}

/**
 * Token cut off by end-of-text before its `]`. Only a title-less reference
 * can produce this (the token's `]` must directly precede the link's `]]`),
 * so no fold mark or title can follow.
 */
const TRUNCATED_HEADING_TOKEN_RE = /^\[!([^\]\n\r]+)$/;

/**
 * Parses the display text of a rendered internal link that references a
 * heading callout. Covers the forms link text actually takes: `[!id] Title`
 * at the start (TOC plugins alias links with the bare heading text; Obsidian
 * strips the `#` of same-file links), `#[!id] Title` / `Note#[!id] Title`
 * (raw link text, e.g. inside Live-Preview-rendered widgets), and
 * `Note > [!id] Title` (reading view renders the subpath `#` as ` > `).
 * A title-less reference arrives truncated — `#[!id` with no closing `]` —
 * and is reported with the `truncated` flag set.
 * Returns null when the text carries no such token — callers must then leave
 * the link untouched.
 */
export function parseHeadingRefDisplayText(
	text: string,
): HeadingRefDisplayToken | null {
	// First `[!` that opens a heading segment: at the start, after `#`, or
	// after the ` > ` separator.
	let idx = -1;
	let search = 0;
	for (;;) {
		const cand = text.indexOf("[!", search);
		if (cand === -1) return null;
		search = cand + 2;
		if (
			cand === 0 ||
			text[cand - 1] === "#" ||
			(cand >= 3 && text.slice(cand - 3, cand) === " > ")
		) {
			idx = cand;
			break;
		}
	}
	const rest = text.slice(idx);
	const m = RENDERED_HEADING_TOKEN_RE.exec(rest);
	if (m) {
		const rawId = m[1] ?? "";
		if (!rawId.trim()) return null;
		return {
			prefix: text.slice(0, idx),
			rawId,
			foldMark: (m[2] ?? "") as "" | "+" | "-",
			title: text.slice(idx + m[0].length),
			truncated: false,
		};
	}
	// Title-less reference truncated by Obsidian's link parse (see the
	// HeadingRefDisplayToken.truncated doc).
	const cut = TRUNCATED_HEADING_TOKEN_RE.exec(rest);
	if (!cut) return null;
	const rawId = cut[1] ?? "";
	if (!rawId.trim()) return null;
	return {
		prefix: text.slice(0, idx),
		rawId,
		foldMark: "",
		title: "",
		truncated: true,
	};
}
