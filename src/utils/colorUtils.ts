/**
 * utils/colorUtils.ts — Color manipulation helpers.
 *
 * Stateless utility functions for converting between hex, RGB, and HSL color
 * formats, blending two hex colors together, and producing CSS rgb() strings.
 * Used by CSSInjector (for dynamic CSS generation), colorPalettes (for
 * auto-computed backgrounds), and CalloutEditor (for color field handling).
 */
import { requireApiVersion } from "obsidian";

export interface RGB {
	r: number;
	g: number;
	b: number;
}

export function hexToRgb(hex: string): RGB {
	const cleaned = hex.replace(/^#/, "");
	const num = parseInt(cleaned, 16);
	return {
		r: (num >> 16) & 255,
		g: (num >> 8) & 255,
		b: num & 255,
	};
}

export function rgbToHex(r: number, g: number, b: number): string {
	return (
		"#" +
		[r, g, b]
			.map((c) =>
				Math.max(0, Math.min(255, Math.round(c)))
					.toString(16)
					.padStart(2, "0"),
			)
			.join("")
	);
}

export function hslToRgb(h: number, s: number, l: number): RGB {
	const sNorm = s / 100;
	const lNorm = l / 100;
	const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = lNorm - c / 2;

	let rP: number, gP: number, bP: number;
	if (h < 60) {
		[rP, gP, bP] = [c, x, 0];
	} else if (h < 120) {
		[rP, gP, bP] = [x, c, 0];
	} else if (h < 180) {
		[rP, gP, bP] = [0, c, x];
	} else if (h < 240) {
		[rP, gP, bP] = [0, x, c];
	} else if (h < 300) {
		[rP, gP, bP] = [x, 0, c];
	} else {
		[rP, gP, bP] = [c, 0, x];
	}

	return {
		r: Math.round((rP + m) * 255),
		g: Math.round((gP + m) * 255),
		b: Math.round((bP + m) * 255),
	};
}

export function hexToRgbString(hex: string): string {
	const { r, g, b } = hexToRgb(hex);
	return `${r}, ${g}, ${b}`;
}

/**
 * Cached result of the Obsidian version check used by `calloutColorValue`.
 * `null` until first computed; avoids calling `requireApiVersion` for every
 * callout on every CSS inject.
 */
let calloutColorIsRaw: boolean | null = null;

/**
 * Returns the value to assign to Obsidian's `--callout-color` variable for the
 * current Obsidian version.
 *
 * Obsidian 1.13 changed `--callout-color` from a raw RGB triplet
 * (`255, 0, 0`, wrapped by Obsidian in `rgb(...)`) to a full CSS color
 * (`#ff0000`, used directly). We emit the right format for the running version
 * so a single release works on both ≤1.12 and 1.13+.
 */
export function calloutColorValue(hex: string): string {
	if (calloutColorIsRaw === null) {
		calloutColorIsRaw = !requireApiVersion("1.13.0");
	}
	return calloutColorIsRaw ? hexToRgbString(hex) : hex;
}

function rgbTripletToHex(r: string, g: string, b: string): string {
	return rgbToHex(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10));
}

/**
 * Parses a CSS color value as it may appear in a `--callout-color` declaration
 * into a `#rrggbb` hex string. Handles the formats that occur in callout CSS
 * snippets across Obsidian versions:
 *   - hex: `#rgb`, `#rrggbb`
 *   - functional: `rgb(255, 0, 0)`, `rgba(255 0 0 / 0.5)`
 *   - bare RGB triplet (pre-1.13): `255, 0, 0`
 *
 * Returns `null` for anything else (named colors, `oklch()`, etc.), which the
 * caller should skip rather than import with a broken color.
 */
export function parseCssColorToHex(value: string): string | null {
	const v = value.trim();

	// #rgb or #rrggbb
	const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
	if (hexMatch && hexMatch[1]) {
		let h = hexMatch[1].toLowerCase();
		if (h.length === 3) {
			h = h
				.split("")
				.map((c) => c + c)
				.join("");
		}
		return "#" + h;
	}

	// rgb()/rgba() with comma- or space-separated channels (alpha ignored)
	const fnMatch =
		/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i.exec(v);
	if (fnMatch && fnMatch[1] && fnMatch[2] && fnMatch[3]) {
		return rgbTripletToHex(fnMatch[1], fnMatch[2], fnMatch[3]);
	}

	// Bare RGB triplet (pre-1.13 format): 255, 0, 0
	const tripletMatch = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/.exec(v);
	if (tripletMatch && tripletMatch[1] && tripletMatch[2] && tripletMatch[3]) {
		return rgbTripletToHex(tripletMatch[1], tripletMatch[2], tripletMatch[3]);
	}

	return null;
}

/**
 * Linearly blend two hex colours.
 * amount = 0 → hex1, amount = 1 → hex2.
 */
export function blendHex(hex1: string, hex2: string, amount: number): string {
	const c1 = hexToRgb(hex1);
	const c2 = hexToRgb(hex2);
	return rgbToHex(
		c1.r + (c2.r - c1.r) * amount,
		c1.g + (c2.g - c1.g) * amount,
		c1.b + (c2.b - c1.b) * amount,
	);
}
