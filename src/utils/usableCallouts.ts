/**
 * utils/usableCallouts.ts — Which callouts a user may pick right now.
 *
 * Discovery creates a row for every `[!id]` it has ever seen, so an unfiltered
 * list is full of ids the user deleted from their notes hours ago. Anything
 * that offers callouts to choose from — the autocomplete dropdown, the public
 * API, the command builder — has to drop those, and has to drop them the same
 * way, or the three surfaces disagree about what exists.
 *
 * A discovered row survives only once it has been customized (the user adopted
 * it) or while it is still written somewhere in the vault. The zero-usage check
 * is asked of the caller because only the plugin knows what Discovery's last
 * prune scan concluded.
 */
import type { CalloutDefinition } from "../types";

/**
 * Keep the rows a user could actually write today.
 *
 * `isKnownZeroUsageFallback` must report only rows a completed scan confirmed
 * are unused: a row that is genuinely in use but was never adopted through the
 * editor has to stay offerable.
 */
export function filterUsableCallouts(
	defs: readonly CalloutDefinition[],
	isKnownZeroUsageFallback: (id: string) => boolean,
): CalloutDefinition[] {
	return defs.filter(
		(def) =>
			def.source !== "fallback" ||
			def.customized === true ||
			!isKnownZeroUsageFallback(def.id),
	);
}
