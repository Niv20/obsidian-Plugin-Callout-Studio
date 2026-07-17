/**
 * utils/colorPalettes.ts — Preset color palettes for the callout editor.
 *
 * Defines color palette objects (id, name, light/dark accent and background
 * colors) grouped into Obsidian-derived palettes and extra preset palettes.
 * Background colors are auto-computed from the accent color using blendHex
 * from colorUtils when not explicitly supplied.
 * Used by CalloutEditor to populate the color preset dropdown.
 */
import { blendHex, isValidHexColor, sanitizeBgGradient } from "./colorUtils";
import type { BgGradient, CustomPalette } from "../types";

export interface ColorPalette {
	id: string;
	name: string;
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
): ColorPalette {
	return {
		id,
		name,
		group,
		colorLight,
		colorDark,
		bgColorLight: bgColorLight ?? blendHex(colorLight, "#ffffff", 0.88),
		bgColorDark: bgColorDark ?? blendHex(colorDark, "#1e1e1e", 0.88),
	};
}

/** Palettes derived from Obsidian's built-in callout types */
export const OBSIDIAN_PALETTES: ColorPalette[] = [
	makePalette("note", "Note / Info / Todo", "obsidian", "#448aff", "#448aff"),
	makePalette("abstract", "Abstract", "obsidian", "#00bcd4", "#00bcd4"),
	makePalette("tip", "Tip", "obsidian", "#00bfa5", "#00bfa5"),
	makePalette("success", "Success", "obsidian", "#00c853", "#00c853"),
	makePalette(
		"question",
		"Question / Warning",
		"obsidian",
		"#ff9100",
		"#ff9100",
	),
	makePalette("failure", "Failure / Bug", "obsidian", "#ff5252", "#ff5252"),
	makePalette("danger", "Danger", "obsidian", "#ff1744", "#ff1744"),
	makePalette("example", "Example", "obsidian", "#7c4dff", "#7c4dff"),
	makePalette("quote", "Quote", "obsidian", "#9e9e9e", "#9e9e9e"),
];

/** Additional curated color presets */
export const EXTRA_PALETTES: ColorPalette[] = [
	makePalette("ocean", "Ocean", "preset", "#1a73e8", "#8ab4f8"),
	makePalette(
		"sky",
		"Sky",
		"preset",
		"#039be5",
		"#4fc3f7",
		"#e1f5fe",
		"#0a1929",
	),
	makePalette("cobalt", "Cobalt", "preset", "#304ffe", "#8c9eff"),
	makePalette("emerald", "Emerald", "preset", "#00897b", "#4db6ac"),
	makePalette(
		"forest",
		"Forest",
		"preset",
		"#2e7d32",
		"#66bb6a",
		"#e8f5e9",
		"#0d1f12",
	),
	makePalette("mint", "Mint", "preset", "#00bfa5", "#64ffda"),
	makePalette("rose", "Rose", "preset", "#d32f2f", "#ef5350"),
	makePalette(
		"crimson",
		"Crimson",
		"preset",
		"#b71c1c",
		"#e57373",
		"#fce4ec",
		"#1a0a0e",
	),
	makePalette("coral", "Coral", "preset", "#ff5722", "#ff8a65"),
	makePalette(
		"lavender",
		"Lavender",
		"preset",
		"#7c4dff",
		"#b388ff",
		"#ede7f6",
		"#1a0f29",
	),
	makePalette("grape", "Grape", "preset", "#9c27b0", "#ce93d8"),
	makePalette("plum", "Plum", "preset", "#6a1b9a", "#ab47bc"),
	makePalette("amber", "Amber", "preset", "#ff8f00", "#ffd54f"),
	makePalette(
		"sunset",
		"Sunset",
		"preset",
		"#e65100",
		"#ffb74d",
		"#fff3e0",
		"#1f1008",
	),
	makePalette("gold", "Gold", "preset", "#f9a825", "#fff176"),
	makePalette("slate", "Slate", "preset", "#546e7a", "#90a4ae"),
	makePalette(
		"graphite",
		"Graphite",
		"preset",
		"#37474f",
		"#78909c",
		"#eceff1",
		"#141a1e",
	),
	makePalette("storm", "Storm", "preset", "#455a64", "#b0bec5"),
	makePalette("bubblegum", "Bubblegum", "preset", "#e91e63", "#f48fb1"),
	makePalette(
		"teal",
		"Teal",
		"preset",
		"#00838f",
		"#4dd0e1",
		"#e0f7fa",
		"#0a1a1e",
	),
];

/** All available palettes */
export const COLOR_PALETTES: ColorPalette[] = [
	...OBSIDIAN_PALETTES,
	...EXTRA_PALETTES,
];

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
 * collision with the fixed preset ids ("note", "ocean", …).
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
		});
	}
	return result;
}
