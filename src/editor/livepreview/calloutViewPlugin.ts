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
 *   their frame during editing) + a replace widget over the `[!id]` token
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
import { editorLivePreviewField, livePreviewState } from "obsidian";
import type { App } from "obsidian";
import type { PluginSettings } from "../../types";
import type { CalloutRegistry } from "../../manager/CalloutRegistry";
import {
	findWikilinkCalloutRefs,
	scanLineForCalloutTokens,
} from "../calloutTokens";
import { CSS_HEADING_LINE, CSS_UNKNOWN, resolveCalloutDef } from "../renderShared";
import {
	getFoldedHeadingLines,
	isHeadingFoldEnabled,
	resolveMarkdownView,
} from "../headingFold";
import { normalizeCalloutId } from "../../utils/calloutId";
import {
	CalloutTokenWidget,
	HeadingFoldArrowWidget,
	HeadingRefLinkWidget,
} from "./widgets";
import { getPreviewFoldedLines } from "./previewFold";
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
			/**
			 * Selection-driven rebuilds are frozen while the left mouse button
			 * is held (Obsidian's livePreviewState.mousedown). Core defers its
			 * own `#`-mark reveal to mouseup; without the freeze our raw
			 * `[!id]` reveal lands a beat earlier, producing a two-stage
			 * flash. Freezing also keeps widgets stable during drag-selection
			 * and stops an already-revealed line from re-collapsing mid-click.
			 * Known imperfection: a viewport scroll mid-drag still rebuilds
			 * with the live selection — rare, and it self-corrects at mouseup.
			 */
			private wasMousedown = false;
			private readonly ownerDoc: Document;
			private readonly onDocMouseUp: () => void;

			constructor(private readonly view: EditorView) {
				this.decorations = buildDecorations(view, host);
				this.ownerDoc = view.dom.ownerDocument;
				// Safety net for drags that end outside the editor (or over a
				// widget that swallowed the event): if no transaction cleared
				// the freeze by the next macrotask, force one via the no-op
				// refresh effect. When core already dispatched on mouseup this
				// is a no-op because wasMousedown is false by then.
				this.onDocMouseUp = () => {
					window.setTimeout(() => {
						if (!this.wasMousedown || !this.view.dom.isConnected)
							return;
						this.view.dispatch({
							effects: calloutStudioRefresh.of(null),
						});
					}, 0);
				};
				this.ownerDoc.addEventListener("mouseup", this.onDocMouseUp);
			}

			update(update: ViewUpdate): void {
				const mousedown =
					update.view.plugin(livePreviewState)?.mousedown ?? false;
				const refreshed = update.transactions.some((tr) =>
					tr.effects.some((e) => e.is(calloutStudioRefresh)),
				);
				const mouseReleased = this.wasMousedown && !mousedown;
				if (
					update.docChanged ||
					update.viewportChanged ||
					refreshed ||
					mouseReleased ||
					((update.selectionSet || update.focusChanged) &&
						!mousedown)
				) {
					this.decorations = buildDecorations(update.view, host);
				}
				this.wasMousedown = mousedown;
			}

			destroy(): void {
				this.ownerDoc.removeEventListener(
					"mouseup",
					this.onDocMouseUp,
				);
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
		// Real note → native fold state; settings preview (no workspace view) →
		// the CodeMirror-level preview fold state.
		foldedLines = mdView
			? getFoldedHeadingLines(mdView)
			: getPreviewFoldedLines(view);
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
	// Heading-callout refs inside wikilinks (`[[#[!id] Title]]`): never
	// callouts, but their token is hidden (optionally behind the callout's
	// icon) so the displayed link reads `#Title`.
	const refSettings = host.settings.headingCallouts;
	const refs =
		headingEnabled && refSettings.refCleanTitles
			? findWikilinkCalloutRefs(lineText)
			: [];
	if (tokens.length === 0 && refs.length === 0) return;

	// Native blockquote callouts belong to Obsidian's own rendering.
	if (tokens.some((t) => t.role === "regular")) return;

	// Raw-syntax reveal follows the caret only while the editor is focused,
	// matching core Live Preview (which re-collapses formatting on blur). This
	// also keeps unfocused embedded previews (settings cards) fully rendered:
	// their caret parks at position 0, which would otherwise permanently
	// reveal a token on the first line.
	const selectionTouches = (from: number, to: number): boolean =>
		view.hasFocus &&
		selection.ranges.some((r) => r.from <= to && r.to >= from);

	// The heading fold chevron sits at the end of the line, but the same line
	// can carry inline tokens after the heading token (e.g. a pill in the
	// title). RangeSetBuilder needs sorted insertion, so we remember the
	// chevron here and add it once, last, below the token loop.
	let pendingFoldArrow: HeadingFoldArrowWidget | null = null;

	// Mid-line replace decorations. Pills and wikilink refs interleave in
	// arbitrary order, so they are collected first and added sorted —
	// RangeSetBuilder requires sorted insertion.
	const replaces: Array<{ from: number; to: number; deco: Decoration }> = [];

	for (const token of tokens) {
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
				replaces.push({
					from,
					to,
					deco: Decoration.replace({
						widget: new CalloutTokenWidget(
							host.app,
							token.rawId,
							host.registry,
							"heading",
							!token.hasTitle,
						),
					}),
				});
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
		replaces.push({
			from,
			to,
			deco: Decoration.replace({
				widget: new CalloutTokenWidget(
					host.app,
					token.rawId,
					host.registry,
					"inline",
					true,
				),
			}),
		});
	}

	// Index into `replaces` where the current link's ref entries begin; a
	// whole-link replacement drops that link's earlier token entries, since
	// overlapping replace decorations are illegal in one RangeSet.
	let curLinkFrom = -1;
	let curLinkStartIdx = 0;

	for (const ref of refs) {
		if (ref.linkFrom !== curLinkFrom) {
			curLinkFrom = ref.linkFrom;
			curLinkStartIdx = replaces.length;
		}
		// Aliased links display only the alias — Obsidian hides the target,
		// so target-side tokens stay skipped; alias-side tokens (TOC-plugin
		// links) render like their target-side counterparts.
		if (ref.hasAlias && !ref.inAlias) continue;
		// The whole link reveals raw while the selection touches it (matching
		// Obsidian revealing the `[[`/`]]` brackets), so no token decoration.
		if (
			selectionTouches(lineFrom + ref.linkFrom, lineFrom + ref.linkTo)
		) {
			continue;
		}
		// Same-file reference (`[[#[!id] …]]`): the token opens the target, so
		// the leading `#` is swallowed into the replacement and the link
		// displays as just the title. `Note#` and nested-path `#` separators
		// stay visible.
		const hideHash = !ref.inAlias && ref.from === ref.linkFrom + 3 ? 1 : 0;
		const from = lineFrom + ref.from - hideHash;
		const to = lineFrom + ref.to;
		if (SKIP_NODE_RE.test(tree.resolveInner(from + 1, 0).name)) continue;

		// Title-less reference closing the target (`[[#[!id]]]`): the `]]]`
		// run confuses Obsidian's own parsers (link cut at the first `]]`),
		// so the ENTIRE link is replaced with a link-styled icon + display
		// name — the same output reading view produces.
		if (!ref.hasTitle && ref.to === ref.linkTo - 2) {
			// Same-file `#` prefix is dropped from the display (`Note#` stays),
			// matching the titled-ref hash hiding below. An alias token shows
			// nothing before itself.
			const rawPrefix = ref.inAlias
				? ""
				: lineText.slice(ref.linkFrom + 2, ref.from);
			// Navigation target is the inner up to the alias pipe — untruncated
			// even for `]]]` runs and nested `#[!a]#[!b]` paths.
			const inner = lineText.slice(ref.linkFrom + 2, ref.linkTo - 2);
			const pipeIdx = inner.indexOf("|");
			replaces.length = curLinkStartIdx;
			replaces.push({
				from: lineFrom + ref.linkFrom,
				to: lineFrom + ref.linkTo,
				deco: Decoration.replace({
					widget: new HeadingRefLinkWidget(
						host.app,
						ref.rawId,
						host.registry,
						rawPrefix === "#" ? "" : rawPrefix,
						pipeIdx === -1 ? inner : inner.slice(0, pipeIdx),
						refSettings.refShowIcon,
					),
				}),
			});
			continue;
		}

		// Icon (plus display name when the heading has no title of its own),
		// or a bare hide when reference icons are off.
		replaces.push({
			from,
			to,
			deco: refSettings.refShowIcon
				? Decoration.replace({
						widget: new CalloutTokenWidget(
							host.app,
							ref.rawId,
							host.registry,
							"ref",
							!ref.hasTitle,
						),
					})
				: Decoration.replace({}),
		});
	}

	replaces.sort((a, b) => a.from - b.from);
	for (const r of replaces) builder.add(r.from, r.to, r.deco);

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
