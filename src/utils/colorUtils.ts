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

/**
 * How much of the accent color a derived background tint keeps (0..1); the rest
 * is the mode's base (white in light, near-black in dark). Higher = a bolder,
 * less transparent-looking background. The single source of truth for the tint
 * strength across the plugin (presets, per-callout defaults, palette editor).
 */
export const DEFAULT_BG_COLOR_AMOUNT = 0.18;
/** Bounds for the palette editor's background-intensity slider. */
export const MIN_BG_COLOR_AMOUNT = 0.1;
export const MAX_BG_COLOR_AMOUNT = 0.3;
/**
 * Default intensity-slider position for a brand-new palette in the Palette
 * Editor, split by background style: a two-stop gradient reads fainter than
 * a solid fill at the same blend amount, so it defaults higher. Only seeds a
 * fresh palette — an existing one always keeps its own saved intensity, and
 * the user can drag the slider to override either default.
 */
export const DEFAULT_BG_INTENSITY_SOLID = 0.1;
export const DEFAULT_BG_INTENSITY_GRADIENT = 0.2;

/**
 * The pale background tint for an accent color, resolved for one theme mode.
 * `amount` is the share of accent kept (see {@link DEFAULT_BG_COLOR_AMOUNT}).
 */
export function bgTintFor(
	accent: string,
	isDark: boolean,
	amount = DEFAULT_BG_COLOR_AMOUNT,
): string {
	return blendHex(accent, isDark ? "#1e1e1e" : "#ffffff", 1 - amount);
}

/**
 * Clamps an untrusted background-intensity value (saved settings, imports) into
 * the valid range, or returns `undefined` when it isn't a usable number so the
 * caller falls back to {@link DEFAULT_BG_COLOR_AMOUNT}.
 */
export function clampBgIntensity(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
	return Math.min(MAX_BG_COLOR_AMOUNT, Math.max(MIN_BG_COLOR_AMOUNT, value));
}

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
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
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
 * Mirrors a color's lightness (l → 100−l), keeping hue and saturation. A
 * plausible starting guess for "the same color in the opposite theme mode":
 * a pale light-mode tint becomes a deep dark-mode shade and vice versa.
 */
export function mirrorLightness(hex: string): string {
	const { h, s, l } = hexToHsl(hex);
	const { r, g, b } = hslToRgb(h, s, 100 - l);
	return rgbToHex(r, g, b);
}

/**
 * Infers a color for the OPPOSITE theme mode from one the user just picked
 * for one mode (the palette editor's advanced per-color rows use this to
 * keep the hidden mode in sync automatically). Mirrors lightness for a
 * plausible guess, then — when `minRatio` is given — nudges it toward
 * black/white against `oppositeBg` until it clears that contrast ratio,
 * exactly like {@link derivePaletteFromColor}'s own contrast fix.
 *
 * @param editingDark Whether `hex` is the color the user just set for DARK
 *   mode (so the inferred result is for LIGHT mode, and vice versa).
 * @param oppositeBg The background the inferred color will render against
 *   in the opposite mode; pass `null` together with `minRatio: null` for a
 *   channel with nothing to contrast against (the background channel).
 */
export function inferOppositeModeColor(
	hex: string,
	editingDark: boolean,
	oppositeBg: string | null,
	minRatio: number | null,
): string {
	const mirrored = mirrorLightness(hex);
	if (minRatio === null || oppositeBg === null) return mirrored;
	const towards = editingDark ? "#000000" : "#ffffff";
	return ensureContrast(mirrored, oppositeBg, towards, minRatio);
}

/**
 * CSS background-image value for a two-stop gradient starting at `from`
 * (the solid bg color of the current mode) and ending at `to`.
 */
export function bgGradientCss(
	from: string,
	to: string,
	gradient: BgGradient,
): string {
	return `linear-gradient(${normalizeAngleDeg(gradient.angleDeg)}deg, ${from}, ${to})`;
}

/**
 * Validates an untrusted `bgGradient` value (saved settings, imports).
 * Returns a clean copy — angle normalized to [0, 360), both end colors
 * verified `#rrggbb` — or `null` when the value is unusable, in which case
 * callers should fall back to a solid background.
 *
 * Gradients are always linear. Data written while a `type` field still existed
 * carries an angle either way, so a legacy `"radial"` value is simply dropped
 * and the gradient renders along its stored direction.
 *
 * The text-sweep fields degrade rather than reject: an unusable text end color
 * pair drops `textGradient` alone, leaving a working background gradient,
 * since a missing text sweep is a far smaller loss than no gradient at all.
 */
export function sanitizeBgGradient(raw: unknown): BgGradient | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const g = raw as Partial<BgGradient>;
	if (typeof g.angleDeg !== "number" || !Number.isFinite(g.angleDeg)) {
		return null;
	}
	if (!isValidHexColor(g.toColorLight) || !isValidHexColor(g.toColorDark)) {
		return null;
	}
	const clean: BgGradient = {
		angleDeg: normalizeAngleDeg(g.angleDeg),
		toColorLight: g.toColorLight,
		toColorDark: g.toColorDark,
	};
	// The text end colors are kept even while the toggle is off: they are the
	// user's own second color at accent strength, and re-deriving them from
	// the pale `toColor*` tints is not possible (that blend is lossy).
	if (isValidHexColor(g.textToColorLight) && isValidHexColor(g.textToColorDark)) {
		clean.textToColorLight = g.textToColorLight;
		clean.textToColorDark = g.textToColorDark;
		if (g.textGradient === true) clean.textGradient = true;
	}
	return clean;
}

/** True when both are the same gradient (or both absent). */
export function bgGradientsEqual(
	a: BgGradient | undefined,
	b: BgGradient | undefined,
): boolean {
	if (!a || !b) return !a && !b;
	const sameHex = (x?: string, y?: string): boolean =>
		(x ?? "").toLowerCase() === (y ?? "").toLowerCase();
	return (
		normalizeAngleDeg(a.angleDeg) === normalizeAngleDeg(b.angleDeg) &&
		a.toColorLight.toLowerCase() === b.toColorLight.toLowerCase() &&
		a.toColorDark.toLowerCase() === b.toColorDark.toLowerCase() &&
		!!a.textGradient === !!b.textGradient &&
		sameHex(a.textToColorLight, b.textToColorLight) &&
		sameHex(a.textToColorDark, b.textToColorDark)
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
 *
 * `amount` controls how strongly the background shows (see
 * {@link DEFAULT_BG_COLOR_AMOUNT}); the contrast auto-fix runs against the
 * resulting bg, so accents stay readable at any intensity.
 */
export function derivePaletteFromColor(
	hex: string,
	amount = DEFAULT_BG_COLOR_AMOUNT,
): DerivedPalette {
	const bgColorLight = bgTintFor(hex, false, amount);
	const bgColorDark = bgTintFor(hex, true, amount);
	return {
		colorLight: ensureContrast(hex, bgColorLight, "#000000", 3),
		colorDark: ensureContrast(hex, bgColorDark, "#ffffff", 3),
		bgColorLight,
		bgColorDark,
		textColorLight: DEFAULT_TEXT_COLOR_LIGHT,
		textColorDark: DEFAULT_TEXT_COLOR_DARK,
	};
}
