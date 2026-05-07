/**
 * utils/colorUtils.ts — Color manipulation helpers.
 *
 * Stateless utility functions for converting between hex, RGB, and HSL color
 * formats, blending two hex colors together, and producing CSS rgb() strings.
 * Used by CSSInjector (for dynamic CSS generation), colorPalettes (for
 * auto-computed backgrounds), and CalloutEditor (for color field handling).
 */
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
