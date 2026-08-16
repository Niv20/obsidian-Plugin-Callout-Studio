/**
 * manager/discoveredRow.ts — what "mirror the fallback callout" means.
 *
 * Two paths make a `source: "fallback"` row wear the configured fallback
 * callout's look, and they are written from opposite ends: `CalloutDiscovery`
 * mints a brand-new row for an id it just met, while
 * `CalloutRegistry.restyleUncustomizedFallbackRows` re-styles rows that already
 * exist when the user picks a different fallback. Nothing forces the two to
 * agree on *which* of the fallback's properties are "the look" — and when they
 * disagreed, the discovery side was the one carrying the fallback's own
 * bookkeeping (authorship flags, shared object references) onto every row it
 * created.
 *
 * So the answer lives here, in one function small enough to read in full, and
 * `CalloutDiscovery` does the deciding (which ids, which guards) rather than
 * the assembling. Depends on nothing but the type, the shipped defaults and the
 * title helper.
 */
import type { CalloutDefinition } from "../types";
import { DEFAULT_CALLOUTS } from "../constants";
import { obsidianDefaultTitle } from "../utils/calloutId";

/** The narrow slice of `CalloutRegistry` this module needs to look a row up. */
interface DefinitionLookup {
	get(id: string): CalloutDefinition | undefined;
}

/**
 * The definition a discovered row should be modelled on: the callout the user
 * chose under **Fallback callout**, or `note` when they chose nothing.
 *
 * The last step deliberately reaches past the registry to `constants.ts`: a
 * stale `fallbackCalloutId` naming a callout that has since been deleted must
 * still produce a styled row rather than a crash, and the SHIPPED `note` is the
 * right model there — not the user's possibly-edited one, which they never
 * pointed at.
 */
export function fallbackSourceFor(
	registry: DefinitionLookup,
	fallbackCalloutId: string,
): CalloutDefinition {
	const noteDefault =
		DEFAULT_CALLOUTS.find((c) => c.id === "note") ?? DEFAULT_CALLOUTS[0]!;
	return registry.get(fallbackCalloutId || "note") ?? noteDefault;
}

/**
 * Build the row discovery adds for a previously unseen `id`, styled after
 * `fallback`.
 *
 * The spread is the whole point — a fallback row is meant to look exactly like
 * the fallback callout, including fields nobody has thought to enumerate yet —
 * so what matters is the short list of keys overridden after it. Everything
 * below the spread is either this row's own identity, or a property of
 * `fallback` that is *not* part of its look.
 */
export function buildDiscoveredRow(
	id: string,
	fallback: CalloutDefinition,
): CalloutDefinition {
	return {
		...fallback,
		icon: fallback.icon,
		id,
		// Dash-to-space before capitalizing, matching Obsidian's own
		// default-title algorithm — see obsidianDefaultTitle.
		displayName: obsidianDefaultTitle(id),
		// An alias is an identity the fallback callout owns; two rows claiming
		// it would collide.
		aliases: [],
		builtIn: false,
		source: "fallback",
	};
}
