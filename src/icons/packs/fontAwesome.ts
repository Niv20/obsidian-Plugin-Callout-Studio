/**
 * icons/packs/fontAwesome.ts — Font Awesome Free, in its three styles.
 *
 * Solid, Regular and Brands are separate sources rather than one source with a
 * style control, because they are barely the same set: Regular is 169 outline
 * variants of Solid icons, and Brands is 572 company marks with nothing in
 * common with either. Treating them as one would put a style dropdown on a
 * grid where two of its three positions are almost always empty.
 *
 * Licensing is the reason this file carries so much attribution detail. Font
 * Awesome's icons are CC BY 4.0, which requires visible credit and a note that
 * the work was modified — and it was: the path data is extracted from the
 * published SVGs and re-serialized, which drops the attribution comment those
 * files carry. Brands adds a trademark question the icon licence does not
 * cover, so it also carries a standing notice in the picker.
 */
import type { CalloutIcon, IconPackId } from "../../types";
import type { IconAttribution, IconEntry, IconIndex, IconPack } from "../types";
import type { LocaleKey } from "../../i18n";
import { buildPackSvg } from "../packData";
import { decodeIndex, memoizeIndex } from "../data/codec";
import type { EncodedIndex } from "../data/codec";
import { FA_SOLID_INDEX } from "../data/fa-solid.index";
import { FA_REGULAR_INDEX } from "../data/fa-regular.index";
import { FA_BRANDS_INDEX } from "../data/fa-brands.index";

const FA_VERSION = "7.3.1";
const FA_HOMEPAGE = "https://fontawesome.com";

/**
 * Every Font Awesome icon is 512 units tall, so each has exactly one drawing
 * and the size preference has nothing to choose between.
 */
const FA_SIZES = ["512"] as const;

const FA_LICENSES: IconAttribution["licenses"] = [
	{
		name: "Creative Commons Attribution 4.0 International",
		spdx: "CC-BY-4.0",
		url: "https://creativecommons.org/licenses/by/4.0/",
		holder: "Fonticons, Inc.",
		scope: "icons",
	},
	{
		name: "MIT License",
		spdx: "MIT",
		url: "https://fontawesome.com/license/free",
		holder: "Fonticons, Inc.",
		scope: "code",
	},
	{
		name: "SIL Open Font License 1.1",
		spdx: "OFL-1.1",
		url: "https://scripts.sil.org/OFL",
		holder: "Fonticons, Inc.",
		scope: "fonts (not shipped by this plugin)",
	},
];

const FA_MODIFICATIONS =
	"Path data extracted from the official Font Awesome Free SVGs and " +
	"re-serialized; the fill colour is applied at render time rather than " +
	"baked in.";

interface FontAwesomeStyle {
	id: IconPackId;
	labelKey: LocaleKey;
	searchPlaceholderKey: LocaleKey;
	title: string;
	index: EncodedIndex;
	noticeKey?: LocaleKey;
}

function createFontAwesomePack(style: FontAwesomeStyle): IconPack {
	const loadIndex = memoizeIndex(() => decodeIndex(style.index));
	return {
		id: style.id,
		kind: "bundledRemote",
		labelKey: style.labelKey,
		searchPlaceholderKey: style.searchPlaceholderKey,
		hasCategories: true,

		attribution: {
			title: style.title,
			homepage: FA_HOMEPAGE,
			version: FA_VERSION,
			licenses: FA_LICENSES,
			modifications: FA_MODIFICATIONS,
			noticeKey: style.noticeKey,
		},

		loadIndex(): Promise<IconIndex> {
			return loadIndex();
		},

		makeIcon(entry: IconEntry): CalloutIcon {
			return { type: style.id, value: entry.name };
		},

		cacheVariant(): string {
			return "";
		},

		buildSvg(icon: CalloutIcon): string | null {
			return buildPackSvg(style.id, icon.value, FA_SIZES);
		},
	};
}

export const faSolidPack = createFontAwesomePack({
	id: "fa-solid",
	labelKey: "iconPicker.faSolid",
	searchPlaceholderKey: "iconPicker.searchFaSolid",
	title: "Font Awesome Free — Solid",
	index: FA_SOLID_INDEX,
});

export const faRegularPack = createFontAwesomePack({
	id: "fa-regular",
	labelKey: "iconPicker.faRegular",
	searchPlaceholderKey: "iconPicker.searchFaRegular",
	title: "Font Awesome Free — Regular",
	index: FA_REGULAR_INDEX,
});

export const faBrandsPack = createFontAwesomePack({
	id: "fa-brands",
	labelKey: "iconPicker.faBrands",
	searchPlaceholderKey: "iconPicker.searchFaBrands",
	title: "Font Awesome Free — Brands",
	index: FA_BRANDS_INDEX,
	// Trademarks are not covered by the icons' CC BY licence, and Font Awesome
	// asks that brand marks only be used to represent the thing they refer to.
	// Passing that on is the whole point of the notice.
	noticeKey: "iconPack.faBrandsNotice",
});
