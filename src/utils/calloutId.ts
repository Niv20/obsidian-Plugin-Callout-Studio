/**
 * utils/calloutId.ts — Canonical callout-ID normalization helpers.
 *
 * Callout IDs may contain spaces (e.g. "multi word callout"). To keep stored
 * IDs, vault-scanned IDs, and CSS selectors in agreement, every producer and
 * consumer routes IDs through one of these three helpers:
 *
 * - normalizeCalloutId — permissive; used when *reading* an ID out of markdown
 *   or matching against the registry. Preserves all characters except for
 *   whitespace normalization.
 * - sanitizeCalloutIdInput — restrictive; used when the user *creates* an ID in
 *   the editor. Restricts the allowed character set.
 * - obsidianCalloutAttrId — the form Obsidian itself writes into a blockquote
 *   callout's `data-callout` attribute. Used *only* for `.callout[…]` selectors
 *   and when reading that attribute back.
 *
 * mergeDashSpaceVariants builds on the last of those to fold IDs that only a
 * vault scan can turn up in two spellings at once.
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
 * Lowercases, keeps only letters/numbers/space/dash, and folds dash runs into
 * the same single-space word separator as whitespace, trimming the result.
 * May return "" when the input has no usable characters (callers reject empty
 * IDs).
 *
 * Dashes are folded rather than preserved because Obsidian itself can never
 * tell the two apart: its own default callout title generation runs
 * `type.replace(/-/g, " ")` before capitalizing (verified in its bundled
 * renderer), so a literal hyphen typed here could never survive rendering as
 * a "real" character anyway. Treating it as a word separator from the start
 * avoids ever creating a dash/space pair that collides once Obsidian
 * dasherizes both spellings to the same `data-callout` attribute — see
 * obsidianCalloutAttrId below.
 */
export const sanitizeCalloutIdInput = (raw: string): string =>
	raw
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/[\s-]+/g, " ")
		.trim();

/**
 * The form Obsidian itself writes into a blockquote callout's `data-callout`
 * attribute. Obsidian parses `> [!My Multi Word]` as
 * `t.trim().toLowerCase().replace(/\s+/g, "-")` in BOTH its reading-view block
 * parser and its Live Preview CodeMirror mode, so the rendered DOM is always
 * `<div class="callout" data-callout="my-multi-word">` — dashes, never spaces.
 *
 * Use this ONLY for `.callout[data-callout=…]` selectors and when reading that
 * attribute back. The heading-bar / inline-pill / ref-token DOM is stamped by
 * US (buildCalloutTokenDom, calloutPostProcessor, calloutViewPlugin) with the
 * space-preserving `normalizeCalloutId` form — those must NOT go through here.
 *
 * Identity for any ID without whitespace, so IDs containing literal dashes are
 * untouched. Idempotent.
 */
export const obsidianCalloutAttrId = (raw: string): string =>
	raw
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-");

/**
 * The title Obsidian shows for a blockquote callout that carries no explicit
 * title text: `type.trim().replace(/-/g, " ").toLowerCase()`, first letter
 * capitalized (verified in its bundled renderer — see obsidianCalloutAttrId's
 * doc). Used when we generate a display name ourselves (auto-discovered
 * fallback rows) so it reads the same as what the regular role would show for
 * the identical raw text.
 */
export const obsidianDefaultTitle = (raw: string): string => {
	const lower = raw.trim().replace(/-/g, " ").toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/**
 * Collapse IDs that differ only by dash-versus-space to one representative
 * each, keeping the original array order.
 *
 * A vault where someone wrote both `[!a b]` and `[!a-b]` describes ONE callout
 * — Obsidian renders both as `data-callout="a-b"` — so discovery must offer one
 * row for the pair, not two rows that then fight over a single CSS rule.
 *
 * The spaced spelling wins when both were actually seen, because that is the
 * form the editor's ID field and display-name derivation produce. A spelling
 * seen only with dashes is kept verbatim: inventing a space for `a-b` would
 * quietly rename a callout its author deliberately hyphenated.
 */
export const mergeDashSpaceVariants = (ids: string[]): string[] => {
	// Map keeps first-insertion order, and re-setting a key does not move it,
	// so preferring a later spelling never reorders the result.
	const chosen = new Map<string, string>();
	for (const id of ids) {
		const attrForm = obsidianCalloutAttrId(id);
		if (!attrForm) continue;
		const current = chosen.get(attrForm);
		if (current === undefined) {
			chosen.set(attrForm, id);
		} else if (!current.includes(" ") && id.includes(" ")) {
			chosen.set(attrForm, id);
		}
	}
	return Array.from(chosen.values());
};
