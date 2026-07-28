/**
 * icons/search.ts — The shared icon search.
 *
 * One matcher for every source, so "arrow right" behaves the same whether the
 * pack spells its ids `arrow_right` (Material) or `arrow-right` (Octicons,
 * Font Awesome). Words are ANDed, which is what makes progressive typing
 * narrow the grid instead of scattering it.
 */
import type { IconEntry, IconIndex } from "./types";

/** Split a query into the words that must all match. */
function queryWords(query: string): string[] {
	return query
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);
}

/**
 * The searchable text of one icon: its id both verbatim and with separators
 * turned into spaces, its label, and its keywords.
 */
function haystack(entry: IconEntry): string[] {
	const name = entry.name.toLowerCase();
	const parts = [name, name.replace(/[_-]/g, " ")];
	if (entry.label) parts.push(entry.label.toLowerCase());
	for (const keyword of entry.keywords) parts.push(keyword.toLowerCase());
	return parts;
}

/**
 * Filter an index by free text and, optionally, a category.
 *
 * Returns the index's own entry array untouched when nothing is being filtered,
 * so opening a source does no work at all beyond decoding it.
 */
export function filterIcons(
	index: IconIndex,
	query: string,
	category = "",
): readonly IconEntry[] {
	const words = queryWords(query);
	if (words.length === 0 && !category) return index.entries;

	return index.entries.filter((entry) => {
		if (category && !entry.categories.includes(category)) return false;
		if (words.length === 0) return true;
		const fields = haystack(entry);
		return words.every((word) => fields.some((f) => f.includes(word)));
	});
}
