/**
 * utils/sorting.ts — Locale-aware sorting helpers for callout lists.
 *
 * Exports comparators and sort functions (sortCalloutsByDisplayName,
 * sortCalloutsById, getSortedCalloutIds) that use Intl.Collator with a
 * locale chain fallback. Used by CalloutRegistry (initial sort on load),
 * CalloutListsSection (display order), and AutoComplete (suggestion order).
 */
import type { CalloutDefinition } from "../types";

const FALLBACK_LOCALE = "en";

const buildLocaleChain = (locale?: string): string[] => {
	const trimmed = locale?.trim();
	if (!trimmed) return [FALLBACK_LOCALE];

	const base = trimmed.split("-")[0] ?? "";
	const chain = [trimmed, base, FALLBACK_LOCALE].filter(Boolean);
	return Array.from(new Set(chain));
};

const createBaseCollator = (locale?: string): Intl.Collator =>
	new Intl.Collator(buildLocaleChain(locale), {
		numeric: true,
		sensitivity: "base",
		usage: "sort",
	});

const createTieBreakerCollator = (locale?: string): Intl.Collator =>
	new Intl.Collator(buildLocaleChain(locale), {
		numeric: true,
		sensitivity: "variant",
		usage: "sort",
	});

export const compareText = (a: string, b: string, locale?: string): number => {
	const base = createBaseCollator(locale).compare(a, b);
	if (base !== 0) return base;
	return createTieBreakerCollator(locale).compare(a, b);
};

export const sortCalloutsByDisplayName = (
	callouts: CalloutDefinition[],
	locale?: string,
): CalloutDefinition[] => {
	return [...callouts].sort((a, b) => {
		const byName = compareText(a.displayName, b.displayName, locale);
		if (byName !== 0) return byName;
		return compareText(a.id, b.id, locale);
	});
};

export const sortCalloutsById = (
	callouts: CalloutDefinition[],
	locale?: string,
): CalloutDefinition[] => {
	return [...callouts].sort((a, b) => {
		const byId = compareText(a.id, b.id, locale);
		if (byId !== 0) return byId;
		return compareText(a.displayName, b.displayName, locale);
	});
};

export const sortIds = (ids: string[], locale?: string): string[] =>
	[...ids].sort((a, b) => compareText(a, b, locale));

export const getSortedCalloutIds = (
	def: CalloutDefinition,
	locale?: string,
): string[] => sortIds([def.id, ...(def.aliases ?? [])], locale);
