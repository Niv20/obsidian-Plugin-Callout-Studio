/**
 * utils/colorNames.ts — Human-friendly name suggestions for hex colors.
 *
 * Maps an arbitrary `#rrggbb` color to the nearest of ~19 anchor colors
 * (red, blue, teal, …) by RGB distance, returning the localized label via
 * `t("colorName.*")`. Used to prefill the name field when the user saves a
 * picked color as a custom palette.
 */
import { hexToRgb, relativeLuminance } from "./colorUtils";
import { t } from "../i18n";

/** Anchor reference points; key doubles as the `colorName.<key>` i18n suffix. */
const COLOR_ANCHORS: { key: string; hex: string }[] = [
	{ key: "red", hex: "#f44336" },
	{ key: "orange", hex: "#ff9800" },
	{ key: "amber", hex: "#ffc107" },
	{ key: "yellow", hex: "#ffeb3b" },
	{ key: "lime", hex: "#cddc39" },
	{ key: "green", hex: "#4caf50" },
	{ key: "teal", hex: "#009688" },
	{ key: "cyan", hex: "#00bcd4" },
	{ key: "sky", hex: "#03a9f4" },
	{ key: "blue", hex: "#2962ff" },
	{ key: "indigo", hex: "#3f51b5" },
	{ key: "violet", hex: "#7c4dff" },
	{ key: "purple", hex: "#9c27b0" },
	{ key: "pink", hex: "#e91e63" },
	{ key: "rose", hex: "#f06292" },
	{ key: "brown", hex: "#795548" },
	{ key: "gray", hex: "#9e9e9e" },
	{ key: "black", hex: "#000000" },
	{ key: "white", hex: "#ffffff" },
];

/**
 * Suggests a user-facing name for a color, e.g. "#1a73e8" → "Blue".
 * Near-achromatic colors (tiny channel spread) snap to black/white/gray by
 * luminance instead of whichever hue anchor happens to be closest.
 */
export function suggestColorName(hex: string): string {
	const { r, g, b } = hexToRgb(hex);
	const spread = Math.max(r, g, b) - Math.min(r, g, b);
	if (spread < 24) {
		const lum = relativeLuminance(hex);
		const key = lum < 0.05 ? "black" : lum > 0.8 ? "white" : "gray";
		return t(`colorName.${key}`);
	}

	let bestKey = COLOR_ANCHORS[0]?.key ?? "gray";
	let bestDist = Infinity;
	for (const anchor of COLOR_ANCHORS) {
		const a = hexToRgb(anchor.hex);
		const dist =
			(a.r - r) ** 2 + (a.g - g) ** 2 + (a.b - b) ** 2;
		if (dist < bestDist) {
			bestDist = dist;
			bestKey = anchor.key;
		}
	}
	return t(`colorName.${bestKey}`);
}
