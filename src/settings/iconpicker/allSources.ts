/**
 * settings/iconpicker/allSources.ts — Searching every source at once.
 *
 * With eight sources and 8,900-odd icons, knowing *which* library holds the
 * icon you want is its own puzzle — you want "swords", not "the fantasy one".
 * This pools every source whose artwork is usable into one searchable list.
 *
 * It is itself an IconPack, so the picker panel needs no special case: it just
 * renders another source. Each pooled entry remembers where it came from, and
 * every per-icon operation is delegated back to that source.
 *
 * Only sources that can actually draw right now are included. A downloadable
 * source that has not been fetched would otherwise contribute a few hundred
 * blank cells, which is worse than not being there.
 */
import type { CalloutIcon, IconPackId } from "../../types";
import type {
	IconEntry,
	IconIndex,
	IconPack,
	IconVariantState,
} from "../../icons/types";
import { ICON_PACK_IDS, getPack, packFor } from "../../icons/registry";
import type { PackDataStore } from "../../icons/PackDataStore";

/** Marks the pooled option in the source dropdown; not a real pack id. */
export const ALL_SOURCES = "all";

export type PickerSourceId = IconPackId | typeof ALL_SOURCES;

/**
 * Whether a pack is the pooled list. It borrows the IconPack shape (and so the
 * IconPackId field) without being a real library, which is what lets the picker
 * panel render it with no special case.
 */
export function isAllSources(pack: IconPack): boolean {
	return (pack.id as string) === ALL_SOURCES;
}

/**
 * Sources whose icons can be drawn without downloading anything further.
 *
 * Material counts: its grid previews from a webfont rather than local artwork,
 * and picking one of its icons fetches that single drawing on confirm.
 */
export function availableSources(packs: PackDataStore): IconPack[] {
	return ICON_PACK_IDS.map(getPack).filter((pack) =>
		pack.kind === "bundledRemote" ? packs.state(pack.id) === "ready" : true,
	);
}

/** Sources left out of the pool because they have not been downloaded. */
export function missingSources(packs: PackDataStore): IconPack[] {
	return ICON_PACK_IDS.map(getPack).filter(
		(pack) =>
			pack.kind === "bundledRemote" && packs.state(pack.id) !== "ready",
	);
}

/**
 * Build the pooled source over `members`.
 *
 * Not memoized: which sources qualify changes as the user downloads them, and
 * rebuilding is a concat of already-decoded arrays.
 */
export function createAllSourcesPack(members: readonly IconPack[]): IconPack {
	return {
		id: ALL_SOURCES as IconPackId,
		kind: "builtin",
		labelKey: "iconPicker.allSources",
		searchPlaceholderKey: "iconPicker.searchAllSources",
		// Category taxonomies do not survive pooling — Font Awesome's 68 have
		// no counterpart in the other sources, so the filter would apply to a
		// fraction of the grid and silently hide the rest.
		hasCategories: false,

		attribution: {
			title: "",
			homepage: "",
			version: "",
			licenses: [],
		},

		async loadIndex(): Promise<IconIndex> {
			const indexes = await Promise.all(
				members.map(async (pack) => ({
					pack,
					index: await pack.loadIndex(),
				})),
			);
			const entries: IconEntry[] = [];
			for (const { pack, index } of indexes) {
				for (const entry of index.entries) {
					entries.push({ ...entry, pack: pack.id });
				}
			}
			return { entries, categories: [] };
		},

		makeIcon(entry: IconEntry, variants: IconVariantState): CalloutIcon {
			const owner = entry.pack ? getPack(entry.pack) : undefined;
			// An entry always carries its source here; the fallback keeps a
			// malformed one from throwing mid-render.
			return owner
				? owner.makeIcon(entry, variants)
				: { type: "lucide", value: entry.name };
		},

		cacheVariant(icon, role): string {
			return packFor(icon)?.cacheVariant(icon, role) ?? "";
		},

		buildSvg(icon, role): string | null {
			return packFor(icon)?.buildSvg?.(icon, role) ?? null;
		},
	};
}
