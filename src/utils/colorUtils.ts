/**
 * utils/colorUtils.ts — Color manipulation helpers.
 *
 * Stateless utility functions for converting between hex, RGB, and HSL color
 * formats, blending two hex colors together, and producing CSS rgb() strings.
 * Used by CSSInjector (for dynamic CSS generation), colorPalettes (for
 * auto-computed backgrounds), and CalloutEditor (for color field handling).
 */
import { requireApiVersion } from "obsidian";
import type { BgGradient } from "../types";

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

/** Default callout content text colors (shared by the editor and palette derivation). */
export const DEFAULT_TEXT_COLOR_LIGHT = "#1a1a1a";
export const DEFAULT_TEXT_COLOR_DARK = "#e0e0e0";

/** True for a normalized `#rrggbb` hex color string. */
export function isValidHexColor(value: unknown): value is string {
	return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

/** WCAG 2.x relative luminance (0..1) of an `#rrggbb` color. */
export function relativeLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	const channel = (c: number): number => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colors (1..21). */
export function contrastRatio(hex1: string, hex2: string): number {
	const l1 = relativeLuminance(hex1);
	const l2 = relativeLuminance(hex2);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Returns `hex` adjusted so it reads against `bg`: blends the ORIGINAL color
 * toward `towards` in 5% steps (non-compounding) until the contrast ratio
 * reaches `minRatio`, capping at fully-`towards`. Always terminates: the
 * endpoint (#000000 on a pale background / #ffffff on a dark one) exceeds any
 * ratio this plugin asks for.
 */
export function ensureContrast(
	hex: string,
	bg: string,
	towards: string,
	minRatio = 3,
): string {
	if (contrastRatio(hex, bg) >= minRatio) return hex;
	for (let step = 1; step <= 20; step++) {
		const candidate = blendHex(hex, towards, step * 0.05);
		if (contrastRatio(candidate, bg) >= minRatio) return candidate;
	}
	return towards;
}

/** HSL (h 0..360, s/l 0..100) of an `#rrggbb` color. Inverse of hslToRgb. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const { r, g, b } = hexToRgb(hex);
	const rN = r / 255;
	const gN = g / 255;
	const bN = b / 255;
	const max = Math.max(rN, gN, bN);
	const min = Math.min(rN, gN, bN);
	const l = (max + min) / 2;
	const d = max - min;
	let h = 0;
	let s = 0;
	if (d !== 0) {
		s = d / (1 - Math.abs(2 * l - 1));
		if (max === rN) {
			h = 60 * (((gN - bN) / d) % 6);
		} else if (max === gN) {
			h = 60 * ((bN - rN) / d + 2);
		} else {
			h = 60 * ((rN - gN) / d + 4);
		}
	}
	return { h: normalizeAngleDeg(h), s: s * 100, l: l * 100 };
}

/**
 * Rotates a color's hue by `deg`, keeping saturation and lightness. Used to
 * suggest a pleasant default gradient end color from the palette's base color.
 */
export function rotateHue(hex: string, deg: number): string {
	const { h, s, l } = hexToHsl(hex);
	const { r, g, b } = hslToRgb(normalizeAngleDeg(h + deg), s, l);
	return rgbToHex(r, g, b);
}

/** Normalizes any finite angle into [0, 360). */
export function normalizeAngleDeg(deg: number): number {
	return ((deg % 360) + 360) % 360;
}

/**
 * CSS background-image value for a two-stop gradient starting at `from`
 * (the solid bg color of the current mode) and ending at `to`. Radial
 * gradients are a centered ellipse; the angle only applies to linear ones.
 */
export function bgGradientCss(
	from: string,
	to: string,
	gradient: BgGradient,
): string {
	return gradient.type === "radial"
		? `radial-gradient(ellipse at center, ${from}, ${to})`
		: `linear-gradient(${normalizeAngleDeg(gradient.angleDeg)}deg, ${from}, ${to})`;
}

/**
 * Validates an untrusted `bgGradient` value (saved settings, imports).
 * Returns a clean copy — type narrowed, angle normalized to [0, 360), both
 * end colors verified `#rrggbb` — or `null` when the value is unusable, in
 * which case callers should fall back to a solid background.
 */
export function sanitizeBgGradient(raw: unknown): BgGradient | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const g = raw as Partial<BgGradient>;
	if (g.type !== "linear" && g.type !== "radial") return null;
	if (typeof g.angleDeg !== "number" || !Number.isFinite(g.angleDeg)) {
		return null;
	}
	if (!isValidHexColor(g.toColorLight) || !isValidHexColor(g.toColorDark)) {
		return null;
	}
	return {
		type: g.type,
		angleDeg: normalizeAngleDeg(g.angleDeg),
		toColorLight: g.toColorLight,
		toColorDark: g.toColorDark,
	};
}

/** True when both are the same gradient (or both absent). */
export function bgGradientsEqual(
	a: BgGradient | undefined,
	b: BgGradient | undefined,
): boolean {
	if (!a || !b) return !a && !b;
	return (
		a.type === b.type &&
		normalizeAngleDeg(a.angleDeg) === normalizeAngleDeg(b.angleDeg) &&
		a.toColorLight.toLowerCase() === b.toColorLight.toLowerCase() &&
		a.toColorDark.toLowerCase() === b.toColorDark.toLowerCase()
	);
}

/** The six callout colors derived from a single base color. */
export interface DerivedPalette {
	colorLight: string;
	colorDark: string;
	bgColorLight: string;
	bgColorDark: string;
	textColorLight: string;
	textColorDark: string;
}

/**
 * Derives a full palette from one base color. Backgrounds are pale tints of
 * the ORIGINAL color (same blend as makePalette in colorPalettes.ts) so the
 * hue is preserved; the accents are then auto-corrected per mode — a too-light
 * pick is darkened for light mode, a too-dark pick is lightened for dark mode
 * — so titles and icons always stay readable (>= 3:1, the WCAG non-text bar).
 */
export function derivePaletteFromColor(hex: string): DerivedPalette {
	const bgColorLight = blendHex(hex, "#ffffff", 0.88);
	const bgColorDark = blendHex(hex, "#1e1e1e", 0.88);
	return {
		colorLight: ensureContrast(hex, bgColorLight, "#000000", 3),
		colorDark: ensureContrast(hex, bgColorDark, "#ffffff", 3),
		bgColorLight,
		bgColorDark,
		textColorLight: DEFAULT_TEXT_COLOR_LIGHT,
		textColorDark: DEFAULT_TEXT_COLOR_DARK,
	};
}
