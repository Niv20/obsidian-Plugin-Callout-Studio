/**
 * editor/livepreview/calloutViewPlugin.ts — Live Preview rendering for the
 * heading and inline callout roles.
 *
 * A single ViewPlugin recomputes decorations for the VISIBLE ranges only, on
 * doc/viewport/selection changes and on the explicit refresh effect. Per-line
 * cost is dominated by an indexOf("[!") bail, so typing stays cheap even in
 * huge notes.
 *
 * Decoration strategy:
 * - Heading line  → Decoration.line adds the bar class + data-callout (kept
 *   even while the caret is on the line, mirroring how native callouts keep
 *   their frame during editing) + a replace widget over the `[!id]±` token
 *   when the caret is elsewhere.
 * - Inline token  → replace widget (pill) unless the selection touches it,
 *   in which case the raw text is revealed for editing.
 * - Native `> [!id]` headers, code, math and frontmatter are never touched.
 *
 * Active in Live Preview only (source mode shows raw markdown, matching how
 * Obsidian treats its own callouts).
 */
import {
	Decoration,
	ViewPlugin,
	type DecorationSet,
	type EditorView,
	type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder, type EditorSelection } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { editorLivePreviewField } from "obsidian";
import type { App } from "obsidian";
import type { PluginSettings } from "../../types";
import type { CalloutRegistry } from "../../manager/CalloutRegistry";
import { scanLineForCalloutTokens } from "../calloutTokens";
import { CSS_HEADING_LINE, CSS_UNKNOWN, resolveCalloutDef } from "../renderShared";
import {
	getFoldedHeadingLines,
	isHeadingFoldEnabled,
	resolveMarkdownView,
} from "../headingFold";
import { normalizeCalloutId } from "../../utils/calloutId";
import { CalloutTokenWidget, HeadingFoldArrowWidget } from "./widgets";
import { calloutStudioRefresh } from "./refresh";

/** Narrow structural host type (avoids importing the concrete plugin class). */
export interface LivePreviewHost {
	app: App;
	registry: CalloutRegistry;
	settings: PluginSettings;
}

const NO_FOLDS: ReadonlySet<number> = new Set();

/** Syntax-tree node names whose content must never be decorated. */
const SKIP_NODE_RE = /codeblock|frontmatter|yaml|inline-code|math/i;

export function createCalloutViewPlugin(host: LivePreviewHost) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, host);
			}

			update(update: ViewUpdate): void {
				const refreshed = update.transactions.some((tr) =>
					tr.effects.some((e) => e.is(calloutStudioRefresh)),
				);
				if (
					update.docChanged ||
					update.viewportChanged ||
					update.selectionSet ||
					refreshed
				) {
					this.decorations = buildDecorations(update.view, host);
				}
			}
		},
		{ decorations: (v) => v.decorations },
	);
}

function buildDecorations(
	view: EditorView,
	host: LivePreviewHost,
): DecorationSet {
	const headingEnabled = host.settings.headingCallouts.enabled;
	const inlineEnabled = host.settings.inlineCallouts.enabled;
	if (!headingEnabled && !inlineEnabled) return Decoration.none;
	// Live Preview only. The `false` default matters: nested sub-editors
	// (e.g. table cells) may lack the field entirely, and field() would
	// throw without it.
	if (!view.state.field(editorLivePreviewField, false)) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();
	const doc = view.state.doc;
	const selection = view.state.selection;
	const tree = syntaxTree(view.state);

	// Heading fold state: only relevant when heading callouts render AND the
	// core "Fold heading" setting is on (native folding is otherwise absent, so
	// we draw no chevron). Resolved once per rebuild.
	const foldEnabled = headingEnabled && isHeadingFoldEnabled(host.app);
	let foldedLines: ReadonlySet<number> = NO_FOLDS;
	if (foldEnabled) {
		const mdView = resolveMarkdownView(host.app, view);
		if (mdView) foldedLines = getFoldedHeadingLines(mdView);
	}

	for (const range of view.visibleRanges) {
		let pos = range.from;
		while (pos <= range.to) {
			const line = doc.lineAt(pos);
			if (line.text.indexOf("[!") !== -1) {
				decorateLine(
					builder,
					view,
					host,
					tree,
					selection,
					line.from,
					line.to,
					line.text,
					headingEnabled,
					inlineEnabled,
					foldEnabled,
					foldedLines,
				);
			}
			pos = line.to + 1;
		}
	}
	return builder.finish();
}

function decorateLine(
	builder: RangeSetBuilder<Decoration>,
	view: EditorView,
	host: LivePreviewHost,
	tree: ReturnType<typeof syntaxTree>,
	selection: EditorSelection,
	lineFrom: number,
	lineTo: number,
	lineText: string,
	headingEnabled: boolean,
	inlineEnabled: boolean,
	foldEnabled: boolean,
	foldedLines: ReadonlySet<number>,
): void {
	// Skip whole lines inside fenced code / frontmatter.
	if (SKIP_NODE_RE.test(tree.resolveInner(lineFrom, 1).name)) return;

	const tokens = scanLineForCalloutTokens(lineText);
	if (tokens.length === 0) return;

	const selectionTouches = (from: number, to: number): boolean =>
		selection.ranges.some((r) => r.from <= to && r.to >= from);

	// The heading fold chevron sits at the end of the line, but the same line
	// can carry inline tokens after the heading token (e.g. a pill in the
	// title). RangeSetBuilder needs sorted insertion, so we remember the
	// chevron here and add it once, last, below the token loop.
	let pendingFoldArrow: HeadingFoldArrowWidget | null = null;

	for (const token of tokens) {
		// Native blockquote callouts belong to Obsidian's own rendering.
		if (token.role === "regular") return;

		const from = lineFrom + token.from;
		const to = lineFrom + token.to;

		if (token.role === "heading") {
			if (!headingEnabled) continue;
			const { unknown } = resolveCalloutDef(host.registry, token.rawId);
			const cls = unknown
				? `${CSS_HEADING_LINE} ${CSS_UNKNOWN}`
				: CSS_HEADING_LINE;
			// The bar stays on the line even while editing it…
			builder.add(
				lineFrom,
				lineFrom,
				Decoration.line({
					attributes: {
						class: cls,
						"data-callout": normalizeCalloutId(token.rawId),
					},
				}),
			);
			// …but the token collapses to icon(+name) only while the caret
			// is elsewhere, so the raw syntax is editable in place.
			if (!selectionTouches(lineFrom, lineTo)) {
				const headingLine = view.state.doc.lineAt(lineFrom).number - 1;
				builder.add(
					from,
					to,
					Decoration.replace({
						widget: new CalloutTokenWidget(
							token.rawId,
							host.registry,
							"heading",
							!token.hasTitle,
						),
					}),
				);
				// The fold chevron trails the whole heading (after the title
				// text), so it is a separate end-of-line widget rather than part
				// of the token. Only drawn when native "Fold heading" is on;
				// added after the loop to keep builder insertion sorted.
				if (foldEnabled) {
					pendingFoldArrow = new HeadingFoldArrowWidget(
						host.app,
						token.rawId,
						foldedLines.has(headingLine),
					);
				}
			}
			continue;
		}

		// Inline pill.
		if (!inlineEnabled) continue;
		if (selectionTouches(from, to)) continue;
		// Per-token guard for constructs the line-level check can't see
		// (inline code via multi-backtick spans, inline math, …).
		if (SKIP_NODE_RE.test(tree.resolveInner(from + 1, 0).name)) continue;
		builder.add(
			from,
			to,
			Decoration.replace({
				widget: new CalloutTokenWidget(
					token.rawId,
					host.registry,
					"inline",
					true,
				),
			}),
		);
	}

	// End-of-line fold chevron, added last so it never precedes an inline token
	// that also sits on this heading line.
	if (pendingFoldArrow) {
		builder.add(
			lineTo,
			lineTo,
			Decoration.widget({ side: 1, widget: pendingFoldArrow }),
		);
	}
}
