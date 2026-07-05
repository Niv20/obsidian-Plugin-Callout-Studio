/**
 * editor/contextmenu/resolve.ts — Maps a right-click target to a callout
 * context, now role-aware.
 *
 * Resolution order (most specific first):
 *   1. inline pill  (`.cs-inline-callout` — same DOM on both surfaces)
 *   2. heading bar  (`.cs-heading-callout` line/hN or its `.cs-heading-token`)
 *   3. regular callout (native widget → editor coords → reading DOM),
 *      unchanged from the pre-role implementation.
 */
import { EditorView } from "@codemirror/view";
import {
	Editor,
	type MarkdownSectionInformation,
	MarkdownView,
} from "obsidian";
import type CalloutStudioPlugin from "../../main";
import { normalizeCalloutId } from "../../utils/calloutId";
import { scanLineForCalloutTokens } from "../calloutTokens";
import {
	CSS_HEADING_LINE,
	CSS_HEADING_TOKEN,
	CSS_INLINE_TOKEN,
} from "../renderShared";

// ─── Constants ───────────────────────────────────────────────────────────────

export const CALLOUT_HEADER_REGEX = /^(\s*>[\s>]*)\[!([^\]]+)\]/;
export const CALLOUT_FOLD_MARK_REGEX = /^(\s*>[\s>]*)\[!([^\]]+)\]([+-])?/;
const LIVE_PREVIEW_SELECTOR = ".markdown-source-view.is-live-preview";
const READING_CALLOUT_SELECTOR = ".callout[data-callout]";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CalloutInfo {
	id: string;
	headerLine: number;
	prefix: string;
	quoteDepth: number;
}

export interface PointerContext {
	targetEl: Element;
	clientX: number;
	clientY: number;
	timestamp: number;
	ownerDocument: Document;
}

interface BaseContext {
	/** Normalized callout id under the pointer. */
	id: string;
	editor: Editor;
	view: MarkdownView | null;
	surface: "source" | "live-preview" | "reading";
	targetEl: Element;
}

/** Discriminated by render role; menu items key off `role`. */
export type ResolvedCalloutContext =
	| (BaseContext & { role: "regular"; callout: CalloutInfo })
	| (BaseContext & {
			role: "heading";
			headingLine: number;
			headingLevel: number;
	  })
	| (BaseContext & { role: "inline" });

interface PreviewSectionLookup {
	getSectionInfo(el: HTMLElement): MarkdownSectionInformation | null;
}

interface CalloutWidgetElement extends HTMLElement {
	cmView?: {
		widget?: {
			editor?: { editor?: Editor };
			start?: number;
		};
	};
}

// ─── Top-level resolver ──────────────────────────────────────────────────────

export function resolveContext(
	plugin: CalloutStudioPlugin,
	trigger: PointerContext,
): ResolvedCalloutContext | null {
	return (
		resolveInlinePillContext(plugin, trigger.targetEl) ??
		resolveHeadingContext(plugin, trigger) ??
		resolveRegularContext(plugin, trigger)
	);
}

function resolveRegularContext(
	plugin: CalloutStudioPlugin,
	trigger: PointerContext,
): ResolvedCalloutContext | null {
	const widgetContext = resolveCalloutWidgetContext(plugin, trigger.targetEl);
	if (widgetContext) return widgetContext;

	const view = findMarkdownViewForTarget(plugin, trigger.targetEl);
	if (!view) return null;

	return (
		resolveEditorContext(view, trigger) ??
		resolveReadingContext(view, trigger.targetEl)
	);
}

// ─── Inline pill ─────────────────────────────────────────────────────────────

function resolveInlinePillContext(
	plugin: CalloutStudioPlugin,
	targetEl: Element,
): ResolvedCalloutContext | null {
	const pill = targetEl.closest(`.${CSS_INLINE_TOKEN}[data-callout]`);
	if (!pill) return null;
	const id = normalizeCalloutId(pill.getAttribute("data-callout") ?? "");
	if (!id) return null;

	const view = findMarkdownViewForTarget(plugin, targetEl);
	if (!view) return null;

	return {
		role: "inline",
		id,
		editor: view.editor,
		view,
		surface: resolveSurface(targetEl),
		targetEl,
	};
}

// ─── Heading callout ─────────────────────────────────────────────────────────

function resolveHeadingContext(
	plugin: CalloutStudioPlugin,
	trigger: PointerContext,
): ResolvedCalloutContext | null {
	const headingEl = trigger.targetEl.closest(
		`.${CSS_HEADING_LINE}, .${CSS_HEADING_TOKEN}`,
	);
	if (!(headingEl instanceof HTMLElement)) return null;

	const view = findMarkdownViewForTarget(plugin, trigger.targetEl);
	if (!view) return null;

	// Locate the heading's source line: editor coords in LP, section info in
	// reading view.
	let headingLine: number | null = null;
	const cmRoot = trigger.targetEl.closest(".cm-editor");
	if (cmRoot instanceof HTMLElement) {
		const editorView = EditorView.findFromDOM(cmRoot);
		if (editorView) {
			const coords = { x: trigger.clientX, y: trigger.clientY };
			const offset =
				editorView.posAtCoords(coords) ??
				editorView.posAtCoords(coords, false);
			if (offset != null) {
				headingLine = view.editor.offsetToPos(offset).line;
			}
		}
	} else {
		const sectionInfo = getSectionInfo(view, headingEl);
		if (sectionInfo) headingLine = sectionInfo.lineStart;
	}
	if (headingLine == null) return null;

	// Re-verify against the source — the DOM class alone is not authoritative.
	const token = scanLineForCalloutTokens(
		view.editor.getLine(headingLine),
	).find((tk) => tk.role === "heading");
	if (!token) return null;

	return {
		role: "heading",
		id: normalizeCalloutId(token.rawId),
		headingLine,
		headingLevel: token.headingLevel,
		editor: view.editor,
		view,
		surface: resolveSurface(trigger.targetEl),
		targetEl: trigger.targetEl,
	};
}

// ─── Regular callout resolvers (pre-existing behavior) ──────────────────────

function resolveCalloutWidgetContext(
	plugin: CalloutStudioPlugin,
	targetEl: Element,
): ResolvedCalloutContext | null {
	const calloutEl = targetEl.closest<CalloutWidgetElement>(".cm-callout");
	const widget = calloutEl?.cmView?.widget;
	const editor = widget?.editor?.editor;
	if (!calloutEl || !editor || widget.start === undefined) return null;

	const headerLine = editor.offsetToPos(widget.start).line;
	const text = editor.getLine(headerLine);
	const match = CALLOUT_HEADER_REGEX.exec(text);
	if (!match || match[1] === undefined || match[2] === undefined) return null;

	const view = findMarkdownViewForTarget(plugin, targetEl);
	const prefix = match[1];
	const id = normalizeCalloutId(match[2]);
	return {
		role: "regular",
		id,
		callout: {
			id,
			headerLine,
			prefix,
			quoteDepth: countQuoteDepth(prefix),
		},
		editor,
		view,
		surface: targetEl.closest(LIVE_PREVIEW_SELECTOR)
			? "live-preview"
			: "source",
		targetEl,
	};
}

// Source mode and Live Preview: use the official CM6 API to map click
// coordinates to a document position, then walk up to the callout header.
function resolveEditorContext(
	view: MarkdownView,
	trigger: PointerContext,
): ResolvedCalloutContext | null {
	const cmRoot = trigger.targetEl.closest(".cm-editor");
	if (!(cmRoot instanceof HTMLElement)) return null;

	const editorView = EditorView.findFromDOM(cmRoot);
	if (!editorView) return null;

	const coords = { x: trigger.clientX, y: trigger.clientY };
	const offset =
		editorView.posAtCoords(coords) ?? editorView.posAtCoords(coords, false);
	if (offset == null) return null;

	const position = view.editor.offsetToPos(offset);
	const callout = findCalloutAtLine(view.editor, position.line);
	if (!callout) return null;

	return {
		role: "regular",
		id: callout.id,
		callout,
		editor: view.editor,
		view,
		surface: trigger.targetEl.closest(LIVE_PREVIEW_SELECTOR)
			? "live-preview"
			: "source",
		targetEl: trigger.targetEl,
	};
}

// Reading view: find the rendered callout element, look up its source section,
// then match back to the raw markdown line.
function resolveReadingContext(
	view: MarkdownView,
	targetEl: Element,
): ResolvedCalloutContext | null {
	const calloutEl = targetEl.closest(READING_CALLOUT_SELECTOR);
	if (!(calloutEl instanceof HTMLElement)) return null;

	const sectionInfo = getSectionInfo(view, calloutEl);
	if (!sectionInfo) return null;

	const calloutId = normalizeCalloutId(
		calloutEl.getAttribute("data-callout") ?? "",
	);
	if (!calloutId) return null;

	const callout = findCalloutInSection(
		sectionInfo,
		calloutId,
		getCalloutDomDepth(calloutEl),
	);
	if (!callout) return null;

	return {
		role: "regular",
		id: callout.id,
		callout,
		editor: view.editor,
		view,
		surface: "reading",
		targetEl,
	};
}

// ─── Callout finders ─────────────────────────────────────────────────────────

// Walk up from startLine until we hit a callout header or a non-quote line.
function findCalloutAtLine(
	editor: Editor,
	startLine: number,
): CalloutInfo | null {
	for (let line = startLine; line >= 0; line--) {
		const text = editor.getLine(line);
		const match = CALLOUT_HEADER_REGEX.exec(text);
		if (match && match[1] !== undefined && match[2] !== undefined) {
			return {
				id: normalizeCalloutId(match[2]),
				headerLine: line,
				prefix: match[1],
				quoteDepth: countQuoteDepth(match[1]),
			};
		}
		if (!/^\s*>/.test(text)) return null;
	}
	return null;
}

// Scan a rendered section's source text for a callout header matching the
// given id and quote depth. Falls back: same id → same depth → first callout.
function findCalloutInSection(
	sectionInfo: MarkdownSectionInformation,
	calloutId: string,
	quoteDepth: number,
): CalloutInfo | null {
	let sameIdMatch: CalloutInfo | null = null;
	let sameDepthMatch: CalloutInfo | null = null;
	let firstCallout: CalloutInfo | null = null;

	for (const [index, lineText] of sectionInfo.text.split("\n").entries()) {
		const match = CALLOUT_HEADER_REGEX.exec(lineText);
		if (!match || match[1] === undefined || match[2] === undefined) {
			continue;
		}

		const callout: CalloutInfo = {
			id: normalizeCalloutId(match[2]),
			headerLine: sectionInfo.lineStart + index,
			prefix: match[1],
			quoteDepth: countQuoteDepth(match[1]),
		};

		if (!firstCallout) firstCallout = callout;

		if (callout.id === calloutId && callout.quoteDepth === quoteDepth) {
			return callout;
		}

		if (!sameIdMatch && callout.id === calloutId) sameIdMatch = callout;
		if (!sameDepthMatch && callout.quoteDepth === quoteDepth)
			sameDepthMatch = callout;
	}

	return sameIdMatch ?? sameDepthMatch ?? firstCallout;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function resolveSurface(
	targetEl: Element,
): "source" | "live-preview" | "reading" {
	if (!targetEl.closest(".cm-editor")) return "reading";
	return targetEl.closest(LIVE_PREVIEW_SELECTOR) ? "live-preview" : "source";
}

export function findMarkdownViewForTarget(
	plugin: CalloutStudioPlugin,
	targetEl: Element,
): MarkdownView | null {
	for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
		const { view } = leaf;
		if (
			view instanceof MarkdownView &&
			view.containerEl.contains(targetEl)
		) {
			return view;
		}
	}
	return null;
}

function getSectionInfo(
	view: MarkdownView,
	targetEl: HTMLElement,
): MarkdownSectionInformation | null {
	const previewMode = view.previewMode as MarkdownView["previewMode"] &
		Partial<PreviewSectionLookup>;
	let current: HTMLElement | null = targetEl;

	while (current && view.previewMode.containerEl.contains(current)) {
		const info = previewMode.getSectionInfo?.(current) ?? null;
		if (info) return info;
		current = current.parentElement;
	}

	return null;
}

function getCalloutDomDepth(calloutEl: HTMLElement): number {
	let depth = 0;
	let current: HTMLElement | null = calloutEl;

	while (current) {
		if (current.matches(READING_CALLOUT_SELECTOR)) depth += 1;
		current =
			current.parentElement?.closest(READING_CALLOUT_SELECTOR) ?? null;
	}

	return depth;
}

function countQuoteDepth(prefix: string): number {
	return prefix.match(/>/g)?.length ?? 0;
}
