/**
 * ui/ColorCircles.ts — Two-circle accent/background color swatch widget.
 *
 * Shared renderer used by CalloutRowRenderer (settings list rows), the
 * custom palettes settings section, and the color preset dropdown inside
 * CalloutEditor. Renders two overlapping circles: the accent (title/icon)
 * color in front and the callout background color behind it — both resolved
 * for the CURRENT theme mode, so the swatch previews what the callout
 * actually looks like right now.
 */
import { bgGradientCss, blendHex } from "../utils/colorUtils";
import type { BgGradient } from "../types";

/**
 * Resolves the accent/background pair to display for the current theme mode.
 * When the source has no explicit background for that mode, falls back to the
 * same pale tint the callout editor derives by default. When the source has a
 * background gradient, `bgImage` carries its current-mode CSS so the swatch
 * can preview it on the background circle.
 */
export function resolveCurrentModeColors(source: {
	colorLight: string;
	colorDark: string;
	bgColorLight?: string;
	bgColorDark?: string;
	bgGradient?: BgGradient;
}): { accent: string; bg: string; bgImage?: string } {
	const isDark = activeDocument.body.classList.contains("theme-dark");
	const accent = isDark ? source.colorDark : source.colorLight;
	const bg =
		(isDark ? source.bgColorDark : source.bgColorLight) ??
		blendHex(accent, isDark ? "#1e1e1e" : "#ffffff", 0.88);
	const gradient = source.bgGradient;
	const bgImage = gradient
		? bgGradientCss(
				bg,
				isDark ? gradient.toColorDark : gradient.toColorLight,
				gradient,
			)
		: undefined;
	return { accent, bg, bgImage };
}

/**
 * Renders two overlapping circles: the accent (main) color in front, the
 * background color peeking out behind it. Callers resolve the pair for the
 * current mode via {@link resolveCurrentModeColors}.
 */
export function renderColorCircles(
	parent: HTMLElement,
	accentColor: string,
	bgColor: string,
	options: { size?: number; ariaLabel?: string; bgImage?: string } = {},
): HTMLElement {
	const size = options.size ?? 16;
	const wrap = parent.createDiv({
		cls: "cs-color-circles",
		attr: options.ariaLabel ? { "aria-label": options.ariaLabel } : {},
	});
	wrap.style.setProperty("--cs-circle-size", `${size}px`);

	const left = wrap.createDiv({ cls: "cs-color-circle cs-color-circle-l" });
	left.style.backgroundColor = accentColor;

	const right = wrap.createDiv({ cls: "cs-color-circle cs-color-circle-r" });
	right.style.backgroundColor = bgColor;
	if (options.bgImage) right.style.backgroundImage = options.bgImage;

	return wrap;
}
