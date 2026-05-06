/**
 * Shared renderer for the two-circle "light + dark" color visualization
 * used by the settings row and the color preset dropdown.
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
