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
import { blendHex } from "../utils/colorUtils";

/**
 * Resolves the accent/background pair to display for the current theme mode.
 * When the source has no explicit background for that mode, falls back to the
 * same pale tint the callout editor derives by default.
 */
export function resolveCurrentModeColors(source: {
	colorLight: string;
	colorDark: string;
	bgColorLight?: string;
	bgColorDark?: string;
}): { accent: string; bg: string } {
	const isDark = activeDocument.body.classList.contains("theme-dark");
	const accent = isDark ? source.colorDark : source.colorLight;
	const bg =
		(isDark ? source.bgColorDark : source.bgColorLight) ??
		blendHex(accent, isDark ? "#1e1e1e" : "#ffffff", 0.88);
	return { accent, bg };
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
	options: { size?: number; ariaLabel?: string } = {},
): HTMLElement {
	const size = options.size ?? 16;
	const wrap = parent.createDiv({
		cls: "cs-color-circles",
		attr: options.ariaLabel
			? { "aria-label": options.ariaLabel, title: options.ariaLabel }
			: {},
	});
	wrap.style.setProperty("--cs-circle-size", `${size}px`);

	const left = wrap.createDiv({ cls: "cs-color-circle cs-color-circle-l" });
	left.style.backgroundColor = accentColor;

	const right = wrap.createDiv({ cls: "cs-color-circle cs-color-circle-r" });
	right.style.backgroundColor = bgColor;

	return wrap;
}
