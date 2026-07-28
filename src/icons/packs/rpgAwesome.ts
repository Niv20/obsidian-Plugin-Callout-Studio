/**
 * icons/packs/rpgAwesome.ts — RPG Awesome, a fantasy/tabletop icon set.
 *
 * The only source with no SVG distribution at all: upstream publishes a webfont
 * and a stylesheet, nothing else. Its artwork is extracted from the font's
 * `<glyph>` outlines at build time, including the flip out of font coordinate
 * space — see the RPG Awesome section of scripts/generate-icon-packs.mjs, which
 * checks every glyph lands inside the em square afterwards.
 *
 * Licensing is genuinely contradictory upstream, so this pack states the
 * strictest reading. LICENSE.md is BSD 2-Clause; the README claims SIL OFL 1.1
 * for the font, MIT for the stylesheets and CC BY 3.0 for the docs; the font's
 * own embedded metadata says MIT. All four are permissive and compatible with
 * this plugin, and complying with BSD 2-Clause — reproducing the copyright
 * notice, both conditions and the disclaimer — satisfies every one of them.
 * THIRD-PARTY-NOTICES.md records the ambiguity rather than papering over it.
 */
import type { CalloutIcon } from "../../types";
import type { IconEntry, IconIndex, IconPack } from "../types";
import { buildPackSvg } from "../packData";
import { decodeIndex, memoizeIndex } from "../data/codec";
import { RPG_AWESOME_INDEX } from "../data/rpg-awesome.index";

/** One drawing per icon, on the font's 1024-unit em square. */
const RPG_SIZES = ["1024"] as const;

const loadIndex = memoizeIndex(() => decodeIndex(RPG_AWESOME_INDEX));

export const rpgAwesomePack: IconPack = {
	id: "rpg-awesome",
	kind: "bundledRemote",
	labelKey: "iconPicker.rpgAwesome",
	searchPlaceholderKey: "iconPicker.searchRpgAwesome",
	// No taxonomy upstream; the names carry the meaning instead.
	hasCategories: false,

	attribution: {
		title: "RPG Awesome",
		homepage: "https://nagoshiashumari.github.io/Rpg-Awesome/",
		version: "0.2.0",
		licenses: [
			{
				name: "BSD 2-Clause License",
				spdx: "BSD-2-Clause",
				url: "https://github.com/nagoshiashumari/Rpg-Awesome/blob/master/LICENSE.md",
				holder: "Daniela Howe",
			},
		],
		modifications:
			"Outlines extracted from the RPG Awesome webfont and converted to " +
			"SVG path data, including the flip from font coordinates (y-up, " +
			"baseline origin) to SVG coordinates; the fill colour is applied at " +
			"render time. Upstream states its licence inconsistently — see " +
			"THIRD-PARTY-NOTICES.md.",
	},

	loadIndex(): Promise<IconIndex> {
		return loadIndex();
	},

	makeIcon(entry: IconEntry): CalloutIcon {
		return { type: "rpg-awesome", value: entry.name };
	},

	cacheVariant(): string {
		return "";
	},

	buildSvg(icon: CalloutIcon): string | null {
		return buildPackSvg("rpg-awesome", icon.value, RPG_SIZES);
	},
};
