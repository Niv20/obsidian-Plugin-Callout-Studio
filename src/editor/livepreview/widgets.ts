/**
 * editor/livepreview/widgets.ts — CodeMirror widget for `[!id]` tokens.
 *
 * CalloutTokenWidget serves both the inline pill and the in-heading token; its
 * DOM comes from the shared builder (renderShared.buildCalloutTokenDom), so
 * Live Preview and reading view render identically. HeadingFoldArrowWidget is a
 * separate end-of-line chevron for heading callouts (when the core "Fold
 * heading" setting is on) that trails the title text and toggles Obsidian's
 * native heading fold for the section.
 */
import { WidgetType } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { setIcon } from "obsidian";
import type { App } from "obsidian";
import type { CalloutRegistry } from "../../manager/CalloutRegistry";
import { t } from "../../i18n";
import { buildCalloutTokenDom, resolveCalloutDef } from "../renderShared";
import {
	headingSectionEnd,
	resolveMarkdownView,
	toggleHeadingFold,
} from "../headingFold";
import { calloutStudioRefresh } from "./refresh";

export class CalloutTokenWidget extends WidgetType {
	/**
	 * Snapshot of everything that affects the rendered DOM, taken at build
	 * time. eq() compares snapshots so CodeMirror reuses the DOM while
	 * nothing visible changed, and swaps it after icon/name/registry edits
	 * (the refresh effect rebuilds decorations, producing new snapshots).
	 */
	private readonly renderKey: string;

	constructor(
		private readonly rawId: string,
		private readonly registry: CalloutRegistry,
		private readonly variant: "inline" | "heading",
		private readonly showName: boolean,
	) {
		super();
		this.renderKey = this.computeRenderKey();
	}

	private computeRenderKey(): string {
		const { def, unknown } = resolveCalloutDef(this.registry, this.rawId);
		let iconKey = "";
		let materialReady = true;
		if (def) {
			const { icon } = def;
			iconKey = `${icon.type}:${icon.value}:${icon.style ?? ""}:${icon.weight ?? ""}`;
			if (icon.type === "material") {
				materialReady = !!this.registry.findMaterialSvg(
					icon.value,
					icon.style ?? "outlined",
					icon.weight ?? 400,
				);
			}
		}
		return [
			this.variant,
			this.showName ? "n" : "",
			this.rawId,
			unknown ? "u" : "",
			def?.id ?? "",
			def?.displayName ?? "",
			iconKey,
			materialReady ? "m" : "",
		].join("|");
	}

	override eq(other: CalloutTokenWidget): boolean {
		return other.renderKey === this.renderKey;
	}

	override toDOM(view: EditorView): HTMLElement {
		const el = buildCalloutTokenDom(view.dom.ownerDocument, {
			rawId: this.rawId,
			registry: this.registry,
			variant: this.variant,
			showName: this.showName,
		});

		// Inline pills give no editing feedback on click. Left-clicking one
		// drops the caret just before the id's first char (right after `[!`),
		// which reveals the raw `[!id]` — the decoration is skipped while the
		// selection touches the token. Heading tokens already show a caret
		// from the line click, so they keep the default behavior.
		if (this.variant === "inline") {
			el.addEventListener("mousedown", (evt) => {
				if (evt.button !== 0) return; // left click only; right-click → context menu
				evt.preventDefault(); // take over focus/selection ourselves
				// posAtDOM may resolve to either edge of the replaced range;
				// normalize to the `[` that opens `[!id]` before offsetting.
				const pos = view.posAtDOM(el);
				const doc = view.state.doc;
				const tokenLen = this.rawId.length + 3; // `[!` + id + `]`
				const from =
					doc.sliceString(pos, pos + 2) === "[!"
						? pos
						: pos - tokenLen;
				view.dispatch({ selection: EditorSelection.cursor(from + 2) });
				view.focus();
			});
		}
		return el;
	}

	override ignoreEvent(): boolean {
		// The editor never handles events on the token; right-clicks reach
		// the document-level context-menu listener regardless.
		return true;
	}
}

/**
 * Standalone fold chevron for a heading callout, rendered as an end-of-line
 * widget so it trails the whole heading (icon + name/title) — mirroring a
 * regular callout's disclosure arrow, which follows the label. Built only when
 * the core "Fold heading" setting is on; clicking it toggles Obsidian's native
 * heading fold for the section.
 */
export class HeadingFoldArrowWidget extends WidgetType {
	constructor(
		private readonly app: App,
		/** Normalized callout id — part of eq() so id edits refresh the arrow. */
		private readonly rawId: string,
		/** Current fold state — rotates the chevron. */
		private readonly folded: boolean,
	) {
		super();
	}

	override eq(other: HeadingFoldArrowWidget): boolean {
		return this.folded === other.folded && this.rawId === other.rawId;
	}

	override toDOM(view: EditorView): HTMLElement {
		const arrow = view.dom.ownerDocument.createElement("span");
		arrow.className = "cs-fold-arrow";
		if (this.folded) arrow.classList.add("cs-collapsed");
		setIcon(arrow, "chevron-down");
		arrow.setAttribute("aria-label", t("heading.toggleFold"));
		arrow.setAttribute("title", t("heading.toggleFold"));
		arrow.addEventListener("mousedown", (evt) => {
			if (evt.button !== 0) return; // left click only
			// Take over the event so the caret does not land on the line
			// (which would reveal the raw heading syntax).
			evt.preventDefault();
			evt.stopPropagation();
			this.toggleFold(view, arrow);
		});
		return arrow;
	}

	/**
	 * Toggle the fold of the heading section this arrow trails. Resolves the
	 * MarkdownView hosting this editor, locates the heading line from the
	 * widget's document position, and delegates to Obsidian's native fold; then
	 * dispatches the refresh effect so the chevron re-reflects the new state.
	 */
	private toggleFold(view: EditorView, el: HTMLElement): void {
		const mdView = resolveMarkdownView(this.app, view);
		if (!mdView?.file) return;
		const pos = view.posAtDOM(el);
		const headingLine = view.state.doc.lineAt(pos).number - 1; // 0-based
		const headings =
			this.app.metadataCache.getFileCache(mdView.file)?.headings ?? [];
		const idx = headings.findIndex(
			(h) => h.position.start.line === headingLine,
		);
		const endLine =
			idx >= 0 ? headingSectionEnd(headings, idx) : Number.MAX_SAFE_INTEGER;
		toggleHeadingFold(mdView, headingLine, endLine);
		view.dispatch({ effects: calloutStudioRefresh.of(null) });
	}

	override ignoreEvent(): boolean {
		return true;
	}
}
