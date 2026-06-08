/**
 * utils/calloutId.ts — Canonical callout-ID normalization helpers.
 *
 * Callout IDs may contain spaces (e.g. "multi word callout"). To keep stored
 * IDs, vault-scanned IDs, and CSS selectors in agreement, every producer and
 * consumer routes IDs through one of these two helpers:
 *
 * - normalizeCalloutId — permissive; used when *reading* an ID out of markdown
 *   or matching against the registry. Preserves all characters except for
 *   whitespace normalization.
 * - sanitizeCalloutIdInput — restrictive; used when the user *creates* an ID in
 *   the editor. Restricts the allowed character set.
 */

/**
 * Canonicalize an ID read from markdown (or any external source) for matching:
 * collapse internal whitespace runs to a single space, trim, lowercase. All
 * other characters are preserved so unusual existing IDs still resolve.
 */
export const normalizeCalloutId = (raw: string): string =>
	raw.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Sanitize raw text typed into the editor's ID field into a valid callout ID.
 * Lowercases, keeps only letters/numbers/space/dash, collapses whitespace and
 * dash runs, and trims leading/trailing spaces and dashes. May return "" when
 * the input has no usable characters (callers reject empty IDs).
 */
export const sanitizeCalloutIdInput = (raw: string): string =>
	raw
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s+/g, " ")
		.replace(/-+/g, "-")
		.replace(/^[\s-]+|[\s-]+$/g, "");
