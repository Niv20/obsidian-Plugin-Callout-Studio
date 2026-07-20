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
import type { EditorView } from "@codemirror/view";

/** Rough estimate only — CM6 remeasures the real height once painted. */
const ESTIMATED_PX_PER_EM = 16;

export class HeadingGapWidget extends WidgetType {
	constructor(private readonly em: number) {
		super();
	}

	override eq(other: HeadingGapWidget): boolean {
		return other.em === this.em;
	}

	override toDOM(view: EditorView): HTMLElement {
		const el = view.dom.ownerDocument.createEl("div");
		el.style.height = `${this.em}em`; // no class, no background — pure empty space
		return el;
	}

	override get estimatedHeight(): number {
		return Math.round(this.em * ESTIMATED_PX_PER_EM);
	}

	override ignoreEvent(): boolean {
		return true;
	}
}
