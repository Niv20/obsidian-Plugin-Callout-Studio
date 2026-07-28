/**
 * icons/packs/octicons.ts — GitHub's Octicons.
 *
 * The one pack that draws the same icon at more than one size. Octicons ships
 * 16px and 24px artwork for almost everything — genuinely different drawings,
 * not one scaled — so the size is chosen from the surface the icon lands on,
 * never by the user: 16px art for inline pills, 24px for blockquote callouts
 * and heading bars.
 *
 * The coverage is lopsided (16px for 380 of 383 icons, 24px for 350, 12px for
 * nine, 48/96 for one), so the choice is a preference list with a fallback to
 * whatever the icon actually has rather than a strict lookup.
 */
import type { CalloutIcon, CalloutRenderRole } from "../../types";
import type { IconEntry, IconIndex, IconPack } from "../types";
import { buildPackSvg } from "../packData";
import { decodeIndex, memoizeIndex } from "../data/codec";
import { OCTICONS_INDEX } from "../data/octicons.index";

/**
 * Which drawing each surface wants, best first. Every list ends up covering all
 * five heights so no icon is ever unrenderable — `no-entry-fill` exists only at
 * 12px and `bookmark-fill` only at 24px.
 */
const SIZE_PREFERENCE: Record<CalloutRenderRole, readonly string[]> = {
	inline: ["16", "24", "12", "48", "96"],
	regular: ["24", "16", "48", "12", "96"],
	heading: ["24", "16", "48", "12", "96"],
};

/**
 * The size a role asks for, independent of what the pack turns out to hold.
 *
 * This is deliberately not "the size actually drawn": the cache key has to be
 * computable before the pack data is present, since its whole job is to find
 * artwork saved in `data.json` on a device that never downloaded the pack.
 */
function preferredSize(role: CalloutRenderRole): string {
	return role === "inline" ? "16" : "24";
}

const loadIndex = memoizeIndex(() => decodeIndex(OCTICONS_INDEX));

export const octiconsPack: IconPack = {
	id: "octicons",
	kind: "bundledRemote",
	labelKey: "iconPicker.octicons",
	searchPlaceholderKey: "iconPicker.searchOcticons",
	// Octicons has no category taxonomy upstream, so the picker hides the filter.
	hasCategories: false,

	attribution: {
		title: "Octicons",
		homepage: "https://primer.style/octicons",
		version: "19.31.0",
		licenses: [
			{
				name: "MIT License",
				spdx: "MIT",
				url: "https://github.com/primer/octicons/blob/main/LICENSE",
				holder: "GitHub, Inc.",
			},
		],
		modifications:
			"Path data extracted from the published SVGs and re-serialized; " +
			"fill colour is applied at render time. GitHub's own marks (such as " +
			"mark-github and logo-github) are GitHub trademarks — see " +
			"https://github.com/logos for their usage guidelines.",
	},

	loadIndex(): Promise<IconIndex> {
		return loadIndex();
	},

	makeIcon(entry: IconEntry): CalloutIcon {
		return { type: "octicons", value: entry.name };
	},

	cacheVariant(_icon: CalloutIcon, role: CalloutRenderRole): string {
		return preferredSize(role);
	},

	buildSvg(icon: CalloutIcon, role: CalloutRenderRole): string | null {
		return buildPackSvg("octicons", icon.value, SIZE_PREFERENCE[role]);
	},
};
