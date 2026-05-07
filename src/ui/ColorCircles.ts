/**
 * ui/ColorCircles.ts — Two-circle light/dark color swatch widget.
 *
 * Shared renderer used by CalloutRowRenderer (settings list rows) and the
 * color preset dropdown inside CalloutEditor. Renders two overlapping
 * half-circles: the left half shows the light-mode accent color and the
 * right half shows the dark-mode accent color, giving a compact at-a-glance
 * preview of both values.
 *
 * Renders two overlapping circles where the left half-circle shows the
 * light-mode color and the right half-circle shows the dark-mode color.
 */
export function renderColorCircles(
	parent: HTMLElement,
	colorLight: string,
	colorDark: string,
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
	left.style.backgroundColor = colorLight;

	const right = wrap.createDiv({ cls: "cs-color-circle cs-color-circle-r" });
	right.style.backgroundColor = colorDark;

	return wrap;
}
