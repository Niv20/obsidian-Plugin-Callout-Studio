/**
 * utils/colorPalettes.ts — Preset color palettes for the callout editor.
 *
 * Defines color palette objects (id, name, light/dark accent and background
 * colors) grouped into Obsidian-derived palettes and extra preset palettes.
 * Background colors are auto-computed from the accent color using blendHex
 * from colorUtils when not explicitly supplied.
 * Used by CalloutEditor to populate the color preset dropdown.
 */
import {
	bgTintFor,
	bgGradientsEqual,
	clampBgIntensity,
	DEFAULT_TEXT_COLOR_DARK,
	DEFAULT_TEXT_COLOR_LIGHT,
	derivePaletteFromColor,
	isValidHexColor,
	sanitizeBgGradient,
} from "./colorUtils";
import { dedupeColorName, normalizeName, suggestColorName } from "./colorNames";
import type { BgGradient, CalloutDefinition, CustomPalette } from "../types";
import { t } from "../i18n";

export interface ColorPalette {
	id: string;
	name: string;
	/**
	 * Ids this preset was saved under before it was renamed (e.g. the old
	 * callout-name-based id "note" for what is now "blue"). Checked before
	 * hex-matching so a callout saved under the old id still resolves to
	 * this preset by name instead of falling through as an unmatched/
	 * "deleted" color — see CalloutEditor.ts's palette-dropdown lookup.
	 */
	legacyIds?: string[];
	/** Group label for the dropdown */
	group: "obsidian" | "preset" | "custom";
	/** Accent / icon color – light mode */
	colorLight: string;
	/** Accent / icon color – dark mode */
	colorDark: string;
	/** Background – light mode (optional) */
	bgColorLight?: string;
	/** Background – dark mode (optional) */
	bgColorDark?: string;
	/** Content text – light mode (only custom palettes carry text colors) */
	textColorLight?: string;
	/** Content text – dark mode (only custom palettes carry text colors) */
	textColorDark?: string;
	/** Background gradient (only custom palettes carry gradients) */
	bgGradient?: BgGradient;
	/**
	 * Paint no background at all — see `CalloutDefinition.transparentBg`. Only a
	 * *custom* palette can set it, from the palette editor's "None" background
	 * style: transparency is deliberately not offered as a preset, so the one
	 * route to it is a palette the user made and named themselves.
	 *
	 * The six colors stay valid hexes beside it (see `CustomPalette.transparentBg`);
	 * `bakePaletteColors` is what keeps the backgrounds among them from reaching
	 * a callout while this is set.
	 */
	transparentBg?: true;
}

function makePalette(
	id: string,
	name: string,
	group: "obsidian" | "preset",
	colorLight: string,
	colorDark: string,
	bgColorLight?: string,
	bgColorDark?: string,
	legacyIds?: string[],
): ColorPalette {
	return {
		id,
		name,
		group,
		colorLight,
		colorDark,
		bgColorLight: bgColorLight ?? bgTintFor(colorLight, false),
		bgColorDark: bgColorDark ?? bgTintFor(colorDark, true),
		...(legacyIds ? { legacyIds } : {}),
	};
}

/**
 * There is deliberately no "Transparent" preset here, and none should be added.
 * A preset is a *colour*, and every consumer of this list — the editor's
 * dropdown, its swatches, `resolveCalloutManagerColor`'s hex matching — reads it
 * as one. Transparency is the absence of a background instead, and it reaches a
 * callout the one way the user can name and re-find it: a custom palette saved
 * from the palette editor's "None" background style.
 */

/**
 * Palettes derived from Obsidian's built-in callout types, named for the hue
 * itself rather than the callout role it happens to match (so the same
 * dropdown entry reads sensibly for a `[!bug]` as for a `[!failure]`).
 *
 * The six that mirror a built-in carry Obsidian's own hexes, per theme —
 * picking "Blue" gives the blue Obsidian would have given. `teal` and `crimson`
 * keep their Material values on purpose: Obsidian collapses tip onto the same
 * cyan as abstract and danger onto the same red as failure, so following it
 * exactly would leave two pairs of identical entries in the dropdown. They stay
 * as the near-hues they always were, and the dropdown keeps its variety.
 * `legacyIds` carries the old callout-name-based id each preset used to be
 * saved under, so a callout picked before this rename still resolves to the
 * right preset (see the palette-dropdown lookup in CalloutEditor.ts) instead
 * of appearing as an unmatched/"deleted" color.
 *
 * Built as a function (not a top-level const) so preset names are resolved
 * through `t()` at call time — the dropdown is rebuilt on every open, so this
 * keeps names in sync if the user switches the plugin's display language.
 */
export function getObsidianPalettes(): ColorPalette[] {
	return [
		makePalette(
			"blue",
			t("colorName.blue"),
			"obsidian",
			"#086ddd",
			"#027aff",
			undefined,
			undefined,
			["note"],
		),
		makePalette(
			"cyan",
			t("colorName.cyan"),
			"obsidian",
			"#00bfbc",
			"#53dfdd",
			undefined,
			undefined,
			["abstract"],
		),
		makePalette(
			"teal",
			t("colorName.teal"),
			"obsidian",
			"#00bfa5",
			"#00bfa5",
			undefined,
			undefined,
			["tip"],
		),
		makePalette(
			"green",
			t("colorName.green"),
			"obsidian",
			"#08b94e",
			"#44cf6e",
			undefined,
			undefined,
			["success"],
		),
		makePalette(
			"orange",
			t("colorName.orange"),
			"obsidian",
			"#ec7500",
			"#e9973f",
			undefined,
			undefined,
			["question"],
		),
		makePalette(
			"red",
			t("colorName.red"),
			"obsidian",
			"#e93147",
			"#fb464c",
			undefined,
			undefined,
			["failure"],
		),
		makePalette(
			"crimson",
			t("colorName.crimson"),
			"obsidian",
			"#ff1744",
			"#ff1744",
			undefined,
			undefined,
			["danger"],
		),
		makePalette(
			"violet",
			t("colorName.violet"),
			"obsidian",
			"#7852ee",
			"#a882ff",
			undefined,
			undefined,
			["example"],
		),
		makePalette(
			"gray",
			t("colorName.gray"),
			"obsidian",
			"#9e9e9e",
			"#9e9e9e",
			undefined,
			undefined,
			["quote"],
		),
	];
}

/**
 * Additional curated color presets. Deliberately kept to hues Obsidian's
 * built-in callouts don't already cover (chartreuse, brown, and the
 * warm/purple/pink family) so the presets add variety instead of duplicating
 * note-blue, tip-teal, success-green, failure-red or quote-gray.
 *
 * Same function-not-const shape as `getObsidianPalettes` and for the same
 * reason: names are localized, so they must be resolved at call time.
 */
export function getExtraPalettes(): ColorPalette[] {
	return [
		makePalette("coral", t("colorName.coral"), "preset", "#ff5722", "#ff8a65"),
		makePalette("amber", t("colorName.amber"), "preset", "#ff8f00", "#ffd54f"),
		makePalette("lime", t("colorName.lime"), "preset", "#afb42b", "#dce775"),
		makePalette("brown", t("colorName.brown"), "preset", "#795548", "#a1887f"),
		makePalette("grape", t("colorName.grape"), "preset", "#9c27b0", "#ce93d8"),
		makePalette("plum", t("colorName.plum"), "preset", "#6a1b9a", "#ab47bc"),
		makePalette(
			"bubblegum",
			t("colorName.bubblegum"),
			"preset",
			"#e91e63",
			"#f48fb1",
		),
	];
}

/** All available palettes */
export function getAllColorPalettes(): ColorPalette[] {
	return [...getObsidianPalettes(), ...getExtraPalettes()];
}

/** Adapts a user-saved palette to the dropdown's ColorPalette shape. */
export function customPaletteToColorPalette(p: CustomPalette): ColorPalette {
	return {
		id: p.id,
		name: p.name,
		group: "custom",
		colorLight: p.colorLight,
		colorDark: p.colorDark,
		bgColorLight: p.bgColorLight,
		bgColorDark: p.bgColorDark,
		textColorLight: p.textColorLight,
		textColorDark: p.textColorDark,
		bgGradient: p.bgGradient ? { ...p.bgGradient } : undefined,
		// The two background hexes above are copied even under the flag: they are
		// what a switch back to Solid restores (see `CustomPalette.transparentBg`),
		// and `bakePaletteColors` is what drops them on the way onto a callout.
		...(p.transparentBg === true ? { transparentBg: true as const } : {}),
	};
}

/**
 * Unique id for a new custom palette. The `cp-` prefix guarantees no
 * collision with the fixed preset ids ("blue", "coral", …).
 */
export function generatePaletteId(): string {
	return `cp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Validates untrusted saved/imported palette data: keeps only entries with a
 * non-empty string id + name and six valid `#rrggbb` colors, deduped by id
 * (first wins). Invalid entries are dropped silently, matching the tolerance
 * of the rest of the settings loader.
 */
export function sanitizeCustomPalettes(raw: unknown): CustomPalette[] {
	if (!Array.isArray(raw)) return [];
	const result: CustomPalette[] = [];
	const seenIds = new Set<string>();
	for (const entry of raw) {
		if (!entry || typeof entry !== "object") continue;
		const p = entry as Partial<CustomPalette>;
		if (typeof p.id !== "string" || p.id.length === 0) continue;
		if (typeof p.name !== "string" || p.name.length === 0) continue;
		if (seenIds.has(p.id)) continue;
		if (
			!isValidHexColor(p.colorLight) ||
			!isValidHexColor(p.colorDark) ||
			!isValidHexColor(p.bgColorLight) ||
			!isValidHexColor(p.bgColorDark) ||
			!isValidHexColor(p.textColorLight) ||
			!isValidHexColor(p.textColorDark)
		) {
			continue;
		}
		seenIds.add(p.id);
		// A malformed gradient degrades the palette to solid instead of
		// dropping it — the six colors are still perfectly usable.
		const bgGradient = sanitizeBgGradient(p.bgGradient);
		// A bad intensity is dropped (undefined), not fatal: the baked bg colors
		// already carry the palette's look; the editor then shows the default.
		const bgIntensity = clampBgIntensity(p.bgIntensity);
		result.push({
			id: p.id,
			name: p.name,
			colorLight: p.colorLight,
			colorDark: p.colorDark,
			bgColorLight: p.bgColorLight,
			bgColorDark: p.bgColorDark,
			textColorLight: p.textColorLight,
			textColorDark: p.textColorDark,
			...(bgGradient ? { bgGradient } : {}),
			// Only `true` survives, the same normalization the import validator
			// applies to a definition's copy of this flag: the field is `?: true`,
			// where "off" is an absent key rather than `false`.
			...(p.transparentBg === true ? { transparentBg: true as const } : {}),
			...(bgIntensity !== undefined ? { bgIntensity } : {}),
			...(p.colorMode === "advanced" ? { colorMode: "advanced" as const } : {}),
		});
	}
	return result;
}

/** The `CalloutDefinition` fields a resolved palette bakes onto a callout. */
export type CalloutManagerBakedColors = Pick<
	CalloutDefinition,
	| "colorLight"
	| "colorDark"
	| "bgColorLight"
	| "bgColorDark"
	| "textColorLight"
	| "textColorDark"
	| "bgGradient"
	| "transparentBg"
>;

export interface CalloutManagerColorResolution {
	/** The palette (existing or newly created) this color now links to. */
	paletteId: string;
	colors: CalloutManagerBakedColors;
	/**
	 * Set only when no existing palette matched the imported color — the
	 * caller (`CalloutRegistry.applyCalloutManagerImport`) is responsible for
	 * pushing this onto `settings.customPalettes`.
	 */
	createdPalette?: CustomPalette;
}

/**
 * The colors a palette bakes onto a callout that applies it — the one place
 * that decides what a `ColorPalette` means as a `CalloutDefinition`. Every
 * field is set explicitly, `undefined` included, so spreading the result over
 * an existing definition clears whatever the previous palette left behind
 * (`CalloutRegistry.applyPaletteColors` relies on exactly that).
 */
export function bakePaletteColors(
	palette: ColorPalette,
): CalloutManagerBakedColors {
	// A transparent palette bakes to the flag ALONE. The tint fallbacks below
	// fire on a missing background, which is precisely the state transparency
	// leaves the palette in — running them would hand the callout an opaque
	// colour the palette never had.
	if (palette.transparentBg) {
		return {
			colorLight: palette.colorLight,
			colorDark: palette.colorDark,
			bgColorLight: undefined,
			bgColorDark: undefined,
			textColorLight: palette.textColorLight ?? DEFAULT_TEXT_COLOR_LIGHT,
			textColorDark: palette.textColorDark ?? DEFAULT_TEXT_COLOR_DARK,
			bgGradient: undefined,
			transparentBg: true,
		};
	}
	return {
		colorLight: palette.colorLight,
		colorDark: palette.colorDark,
		bgColorLight: palette.bgColorLight ?? bgTintFor(palette.colorLight, false),
		bgColorDark: palette.bgColorDark ?? bgTintFor(palette.colorDark, true),
		textColorLight: palette.textColorLight ?? DEFAULT_TEXT_COLOR_LIGHT,
		textColorDark: palette.textColorDark ?? DEFAULT_TEXT_COLOR_DARK,
		bgGradient: palette.bgGradient ? { ...palette.bgGradient } : undefined,
		// Spelled out rather than omitted, like `bgGradient` beside it: a palette
		// edited from the "None" background style back to Solid has to actually
		// un-transparent the callouts linked to it, and a key that isn't there
		// clears nothing when this is spread over an existing definition.
		transparentBg: undefined,
	};
}

/**
 * Resolves one imported Callout Manager color (a single hex, since that
 * plugin has no separate light/dark accents) against everything already
 * known: Obsidian/preset palettes and the user's saved custom palettes.
 * `customPalettes` should be the caller's live, growing array: the caller is
 * expected to push `createdPalette` onto it before resolving the next entry,
 * so two imported callouts sharing a brand-new color see each other and
 * share one saved palette instead of getting one each.
 *
 * A color that already matches a known palette (by the same 4-field
 * accent+background / gradient equality `CalloutEditor`'s dropdown and
 * `CalloutRegistry`'s paletteId migration already use) links to that palette
 * as-is. Otherwise the color is "unknown": a new named `CustomPalette` is
 * derived from it (same derivation as the editor's "New color…" flow) for
 * the caller to save, instead of the callout ending up with baked colors
 * that match nothing — which the editor would otherwise show as a
 * "Deleted color".
 */
export function resolveCalloutManagerColor(
	hex: string,
	customPalettes: CustomPalette[],
): CalloutManagerColorResolution {
	const derived = derivePaletteFromColor(hex);
	const candidates: ColorPalette[] = [
		...getAllColorPalettes(),
		...customPalettes.map(customPaletteToColorPalette),
	];

	const match = candidates.find(
		(p) =>
			// An imported colour is always an opaque background, so it can never
			// mean a transparent palette. The hex comparisons below cannot rule
			// one out on their own: a custom palette keeps its six colors beside
			// the flag, so a "None" palette can match every hex here and would
			// otherwise bake transparency onto a callout that asked for a fill.
			!p.transparentBg &&
			p.colorLight.toLowerCase() === derived.colorLight.toLowerCase() &&
			p.colorDark.toLowerCase() === derived.colorDark.toLowerCase() &&
			(p.bgColorLight ?? "").toLowerCase() ===
				derived.bgColorLight.toLowerCase() &&
			(p.bgColorDark ?? "").toLowerCase() ===
				derived.bgColorDark.toLowerCase() &&
			bgGradientsEqual(p.bgGradient, undefined),
	);
	if (match) {
		return { paletteId: match.id, colors: bakePaletteColors(match) };
	}

	const takenNames = new Set(
		[...getAllColorPalettes(), ...customPalettes].map((p) =>
			normalizeName(p.name),
		),
	);
	const createdPalette: CustomPalette = {
		id: generatePaletteId(),
		name: dedupeColorName(suggestColorName(hex), takenNames),
		...derived,
	};
	return {
		paletteId: createdPalette.id,
		colors: bakePaletteColors(customPaletteToColorPalette(createdPalette)),
		createdPalette,
	};
}
