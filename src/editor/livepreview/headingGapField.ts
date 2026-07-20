/**
 * editor/livepreview/headingGapField.ts — Live Preview "gap above the bar"
 * (Callout types → Heading → Global callout style → Spacing between headers).
 *
 * The gap is a block-level spacer above each heading-callout line. In CM6,
 * block decorations (block widgets, and replacing decorations spanning line
 * breaks) MAY NOT be supplied by a view plugin — the content-drawing code
 * needs them before it lays out, whereas a plugin's decorations are read
 * afterwards. Supplying one via the ViewPlugin throws
 * "Block decorations may not be specified via plugins". So the gap lives in a
 * StateField instead (the bar itself, a plain line decoration, stays in the
 * ViewPlugin — line decorations are fine from a plugin).
 *
 * Unlike the ViewPlugin, a StateField can't be viewport-limited: block
 * widgets affect the whole document's height map, so the set is computed over
 * the entire doc. Cost is gated hard — nothing is scanned unless the feature
 * is actually on (gap > 0 and heading callouts enabled) — and each line bails
 * on a cheap indexOf before any real parsing.
 */
import { RangeSetBuilder, StateField } from "@codemirror/state";
import type { EditorState, Extension } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { editorLivePreviewField } from "obsidian";
import { scanLineForCalloutTokens } from "../calloutTokens";
import { HeadingGapWidget } from "./headingGapWidget";
import { calloutStudioRefresh } from "./refresh";
import type { LivePreviewHost } from "./calloutViewPlugin";

/** Syntax-tree node names whose content must never be treated as a callout. */
const SKIP_NODE_RE = /codeblock|frontmatter|yaml|inline-code|math/i;

/** Build the block-gap decoration set for the whole document. */
function buildGaps(state: EditorState, host: LivePreviewHost): DecorationSet {
	const gapEm = host.settings.globalStyle.heading.marginTop;
	if (!host.settings.headingCallouts.enabled || gapEm <= 0) {
		return Decoration.none;
	}
	// Live Preview only (source mode shows raw markdown). The `false` default
	// matters: nested sub-editors may lack the field entirely.
	if (!state.field(editorLivePreviewField, false)) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();
	const tree = syntaxTree(state);
	const doc = state.doc;
	// One immutable decoration reused for every gap: same em, so identical.
	const gap = Decoration.widget({
		widget: new HeadingGapWidget(gapEm),
		block: true,
		side: -1,
	});

	for (let n = 1; n <= doc.lines; n++) {
		const line = doc.line(n);
		if (line.text.indexOf("[!") === -1) continue;
		// Skip fenced code / frontmatter, exactly as the bar decoration does.
		if (SKIP_NODE_RE.test(tree.resolveInner(line.from, 1).name)) continue;
		const tokens = scanLineForCalloutTokens(line.text);
		// Native `> [!id]` blockquote callouts belong to Obsidian's rendering.
		if (tokens.some((tk) => tk.role === "regular")) continue;
		if (tokens.some((tk) => tk.role === "heading")) {
			builder.add(line.from, line.from, gap);
		}
	}
	return builder.finish();
}

/**
 * The StateField providing the heading-gap block widgets. Rebuilds on document
 * changes and on the plugin's refresh effect (dispatched when settings change,
 * so moving the slider takes effect without reopening the note); otherwise the
 * widget positions are unchanged and the existing set is reused.
 */
export function createHeadingGapField(host: LivePreviewHost): Extension {
	return StateField.define<DecorationSet>({
		create: (state) => buildGaps(state, host),
		update(value, tr) {
			const refreshed = tr.effects.some((e) =>
				e.is(calloutStudioRefresh),
			);
			if (tr.docChanged || refreshed) return buildGaps(tr.state, host);
			return value;
		},
		provide: (f) => EditorView.decorations.from(f),
	});
}
