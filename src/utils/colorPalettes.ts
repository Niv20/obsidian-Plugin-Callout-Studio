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
	clampBgIntensity,
	isValidHexColor,
	sanitizeBgGradient,
} from "./colorUtils";
import type { BgGradient, CustomPalette } from "../types";
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
 * Palettes derived from Obsidian's built-in callout types, named for the hue
 * itself rather than the callout role it happens to match (so the same
 * dropdown entry reads sensibly for a `[!bug]` as for a `[!failure]`).
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
			"#448aff",
			"#448aff",
			undefined,
			undefined,
			["note"],
		),
		makePalette(
			"cyan",
			t("colorName.cyan"),
			"obsidian",
			"#00bcd4",
			"#00bcd4",
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
			"#00c853",
			"#00c853",
			undefined,
			undefined,
			["success"],
		),
		makePalette(
			"orange",
			t("colorName.orange"),
			"obsidian",
			"#ff9100",
			"#ff9100",
			undefined,
			undefined,
			["question"],
		),
		makePalette(
			"red",
			t("colorName.red"),
			"obsidian",
			"#ff5252",
			"#ff5252",
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
			"#7c4dff",
			"#7c4dff",
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
			...(bgIntensity !== undefined ? { bgIntensity } : {}),
			...(p.colorMode === "advanced" ? { colorMode: "advanced" as const } : {}),
		});
	}
	return result;
}
