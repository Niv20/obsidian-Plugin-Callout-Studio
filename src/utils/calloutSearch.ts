/**
 * utils/calloutSearch.ts — matching and filtering a list of callouts by hand.
 *
 * Two surfaces let the user narrow a callout list by typing: the `[!` popover
 * in the editor and the quick-insert window. They must agree about what "warn
 * matches" means, so the predicate lives here rather than inline in either —
 * the same reason {@link filterUsableCallouts} lives next door.
 *
 * Deliberately free of `obsidian` imports, so it can be tested without a DOM.
 *
 * The match is plain case-insensitive substring across the three things a user
 * could plausibly type — display name, id, any alias — and nothing more. Not
 * fuzzy, not ranked: a callout list is a dozen or two rows, where a fuzzy match
 * mostly manufactures wrong answers, and the caller already sorts by name so
 * the order never depends on the query.
 */
import type { CalloutDefinition } from "../types";
import { sortCalloutsByDisplayName } from "./sorting";

/**
 * Does `def` match `lowerQuery`?
 *
 * **The query must already be lowercased** — normalising it here would mean
 * re-lowercasing the same string once per row on every keystroke. Whether to
 * trim it is the caller's call too, and the two callers genuinely differ: the
 * autocomplete's query is text between `[!` and the cursor, where a space is a
 * real character the user typed into the document, while a search box's leading
 * spaces are an accident. An empty query matches everything.
 */
export function calloutMatchesQuery(
	def: CalloutDefinition,
	lowerQuery: string,
): boolean {
	return (
		def.id.toLowerCase().includes(lowerQuery) ||
		def.displayName.toLowerCase().includes(lowerQuery) ||
		(def.aliases ?? []).some((a) => a.toLowerCase().includes(lowerQuery))
	);
}

/** The three states of the quick-insert window's source filter. */
export const CALLOUT_SOURCE_FILTERS = ["all", "builtin", "user"] as const;

export type CalloutSourceFilter = (typeof CALLOUT_SOURCE_FILTERS)[number];

/**
 * Is this a filter the plugin still understands?
 *
 * The value is persisted, so it can come back from a `data.json` written by a
 * future build, hand-edited, or imported from another vault. Anything else
 * falls back to `"all"` at the two places that read it — the settings merge and
 * the window itself — rather than showing an empty list nobody can explain.
 */
export function isCalloutSourceFilter(
	value: unknown,
): value is CalloutSourceFilter {
	return (
		typeof value === "string" &&
		(CALLOUT_SOURCE_FILTERS as readonly string[]).includes(value)
	);
}

/**
 * Partition on `builtIn`, the same boolean `getBuiltIn()`/`getUserDefined()`
 * split on — not on `source`, which is provenance: a *customized* built-in is
 * still a built-in, and a discovered row the user adopted is still theirs.
 */
export function matchesSourceFilter(
	def: CalloutDefinition,
	filter: CalloutSourceFilter,
): boolean {
	if (filter === "builtin") return def.builtIn;
	if (filter === "user") return !def.builtIn;
	return true;
}

export interface CalloutListOptions {
	/** Raw text from the search box; trimmed and lowercased here. */
	query: string;
	filter: CalloutSourceFilter;
	locale?: string;
}

/**
 * Source filter, then text match, then one alphabetical order over the lot.
 *
 * Sorting last and once is what keeps built-ins and the user's own callouts
 * *mixed* rather than grouped: they are only ever two halves of one list, and
 * the filter picks which rows are in it, never how they are ordered.
 */
export function filterCalloutList(
	defs: readonly CalloutDefinition[],
	options: CalloutListOptions,
): CalloutDefinition[] {
	const query = options.query.trim().toLowerCase();
	const matched = defs.filter(
		(def) =>
			matchesSourceFilter(def, options.filter) &&
			(query === "" || calloutMatchesQuery(def, query)),
	);
	return sortCalloutsByDisplayName(matched, options.locale);
}
