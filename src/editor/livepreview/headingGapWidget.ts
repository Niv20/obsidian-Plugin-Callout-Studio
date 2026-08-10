/**
 * editor/livepreview/headingGapWidget.ts — Live Preview equivalent of the
 * reading-view "gap above the bar" margin (Callout types → Heading → Global
 * callout style → Spacing between headers).
 *
 * A CSS margin-top can't safely target a CodeMirror .cm-line: CM6 measures
 * each line's rendered box to build its internal height map for
 * scroll/cursor placement, and margin sits outside that box, invisible to
 * the measurement — a mismatch that can desync the cursor. Padding is
 * measured correctly, but .cs-heading-callout paints its own background
 * across the full padding box, so extra padding-top would just make the
 * colored bar taller, not open a visible gap between two stacked bars.
 *
 * A block widget sidesteps both problems: it's a real sibling DOM node
 * CM6 treats as a first-class layout participant (correctly measured, no
 * cursor desync), and since it carries no background it renders as genuine
 * empty space rather than more bar.
 */
import { WidgetType } from "@codemirror/view";

/** Used when `--font-text-size` can't be read (Obsidian's own default). */
const FALLBACK_PX_PER_EM = 16;

/**
 * Pixels per `em` inside the editor's content, for {@link
 * HeadingGapWidget.estimatedHeight}.
 *
 * The spacer's painted height is an `em` against `.cm-content`, which inherits
 * `.markdown-source-view { font-size: var(--font-text-size) }` — the Appearance
 * → Font size setting, commonly 18-20px on a phone. Obsidian keeps that value
 * current as an inline custom property on `document.body` (`updateFontSize`),
 * so this is an inline-style read: no getComputedStyle, no layout.
 *
 * Hardcoding 16 here (as this did) left every gap CodeMirror had not painted
 * yet short by `(realPx - 16) x em` in its height map, always with the same
 * sign, accumulating over every heading callout outside the viewport — so the
 * scroll offset snapped whenever a fold or a scroll finally brought those
 * widgets in to be measured.
 *
 * Not cached: the value can change under the user at any time (font-size
 * slider, a pop-out window), and an inline-style lookup is cheaper than the
 * invalidation would be.
 */
function pxPerEm(): number {
	const raw = document.body?.style.getPropertyValue("--font-text-size");
	const px = raw ? Number.parseFloat(raw) : Number.NaN;
	return Number.isFinite(px) && px > 0 ? px : FALLBACK_PX_PER_EM;
}

export class HeadingGapWidget extends WidgetType {
	constructor(private readonly em: number) {
		super();
	}

	/**
	 * Keyed on `em` alone — the one value that drives the painted box. The
	 * estimate below is deliberately left out: it is a guess CodeMirror
	 * replaces with a real measurement the moment the widget is painted, so
	 * letting a font-size change break widget identity would cost DOM churn
	 * and buy nothing.
	 */
	override eq(other: HeadingGapWidget): boolean {
		return other.em === this.em;
	}

	override toDOM(): HTMLElement {
		const el = createDiv();
		el.style.height = `${this.em}em`; // no class, no background — pure empty space
		return el;
	}

	override get estimatedHeight(): number {
		return Math.round(this.em * pxPerEm());
	}

	override ignoreEvent(): boolean {
		return true;
	}
}
