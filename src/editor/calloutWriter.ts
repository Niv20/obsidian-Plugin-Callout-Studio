/**
 * editor/calloutWriter.ts — Builds the `[!id]` token text for each render role.
 *
 * The one place that turns a callout definition into markdown. Both the
 * autocomplete popover (which knows the id from what the user picked) and the
 * user-built commands (which know it from their stored config) write through
 * here, so the fold mark, the title policy and the `|metadata` carry-over can't
 * drift between them.
 *
 * These return the token only — never the `>` quote prefix or the `#` hashes.
 * Placing the token in the document is the caller's job, because that is where
 * the nesting and selection math lives (see CalloutBlockTools).
 */
import type { CalloutDefinition } from "../types";
import { splitCalloutMetadata } from "../utils/calloutId";

export interface TokenBuildOptions {
	/**
	 * Written in place of `def.id` — the alias the user actually typed, so
	 * picking a suggestion by alias keeps that spelling.
	 */
	matchedId?: string;
	/** `|metadata` carried over from the token being replaced. */
	metaSuffix?: string;
	/** Whatever already followed the `]`, which may be a title worth keeping. */
	existingTitle?: string;
	/**
	 * Whether a title is merely some callout's display name rather than
	 * something the user wrote. Such a title is replaced instead of preserved,
	 * so switching type doesn't leave the old type's name behind.
	 */
	isKnownDisplayName?: (title: string) => boolean;
}

/** `|metadata` for a token, read off the raw text between `[!` and `]`. */
export function metadataSuffixOf(line: string, startCh: number): string {
	const afterTrigger = line.slice(startCh + 2);
	const closeIdx = afterTrigger.indexOf("]");
	if (closeIdx === -1) return "";
	const parts = splitCalloutMetadata(afterTrigger.slice(0, closeIdx));
	return parts.hasMetadata ? `|${parts.metadata}` : "";
}

/** The fold marker a definition's header carries, if any. */
export function foldMarkFor(def: CalloutDefinition): string {
	if (!def.foldable) return "";
	return def.defaultFolded ? "-" : "+";
}

/**
 * The title to write: a genuine user title survives, an empty one or one that
 * only echoes a known callout's display name is replaced by this callout's.
 */
function resolveTitle(
	def: CalloutDefinition,
	options: TokenBuildOptions,
): string {
	const existing = (options.existingTitle ?? "").trim();
	if (existing === "") return def.displayName;
	if (options.isKnownDisplayName?.(existing) === true) return def.displayName;
	return existing;
}

const tokenId = (def: CalloutDefinition, options: TokenBuildOptions): string =>
	`[!${options.matchedId ?? def.id}${options.metaSuffix ?? ""}]`;

/**
 * Block callout header, without its `>` prefix: `[!warning]- Warning`.
 * Always titled — the block header renders the text it is given.
 */
export function buildBlockHeaderToken(
	def: CalloutDefinition,
	options: TokenBuildOptions = {},
): string {
	return `${tokenId(def, options)}${foldMarkFor(def)} ${resolveTitle(def, options)}`;
}

/**
 * Heading callout token, without its `#` hashes: `[!note]` or `[!note] Title`.
 *
 * No title is invented and no fold mark is written: the rendered heading widget
 * already shows the display name, and this role has no fold syntax of its own.
 * A title the user already wrote on the line is kept.
 */
export function buildHeadingToken(
	def: CalloutDefinition,
	options: TokenBuildOptions = {},
): string {
	const existing = (options.existingTitle ?? "").trim();
	const token = tokenId(def, options);
	if (existing === "") return token;
	if (options.isKnownDisplayName?.(existing) === true) return token;
	return `${token} ${existing}`;
}

/** Inline pill token: `[!important]`. Never titled — the pill draws itself. */
export function buildInlineToken(
	def: CalloutDefinition,
	options: TokenBuildOptions = {},
): string {
	return tokenId(def, options);
}

/**
 * Inline pill carrying its own label: `[!important]{text}`.
 *
 * Only valid while `inlineCallouts.allowContent` is on — with it off the braces
 * stay literal markdown, so callers must check before reaching for this.
 */
export function buildInlineContentToken(
	def: CalloutDefinition,
	content: string,
	options: TokenBuildOptions = {},
): string {
	return `${tokenId(def, options)}{${content}}`;
}
