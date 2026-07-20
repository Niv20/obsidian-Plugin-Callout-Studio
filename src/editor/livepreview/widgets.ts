/**
 * editor/livepreview/widgets.ts — CodeMirror widget for `[!id]` tokens.
 *
 * CalloutTokenWidget serves the inline pill, the in-heading token, and the
 * in-link ref token; its DOM comes from the shared builder
 * (renderShared.buildCalloutTokenDom), so Live Preview and reading view
 * render identically. HeadingRefLinkWidget replaces a whole title-less
 * reference link (`[[#[!id]]]`) with a link-styled icon + display name.
 * HeadingFoldArrowWidget is a separate end-of-line chevron for heading
 * callouts (when the core "Fold heading" setting is on) that trails the title
 * text and toggles Obsidian's native heading fold for the section.
 */
import { WidgetType } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { Keymap, setIcon } from "obsidian";
import type { App } from "obsidian";
import type { CalloutRegistry } from "../../manager/CalloutRegistry";
import { findWikilinkCalloutRefs } from "../calloutTokens";
import { t } from "../../i18n";
import {
	CSS_ANIM_IN,
	CSS_FOLD_ARROW,
	CSS_REF_LINK,
	CSS_REF_TOKEN_LINK,
	buildCalloutTokenDom,
	isStartupEntranceActive,
	resolveCalloutDef,
	type CalloutTokenVariant,
} from "../renderShared";
import { resolveMarkdownView } from "../headingFold";
import { toggleHeadingFold } from "./fold";
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
		private readonly app: App,
		private readonly rawId: string,
		private readonly registry: CalloutRegistry,
		private readonly variant: CalloutTokenVariant,
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
		// LP ref tokens always sit inside a wikilink, so they carry the
		// click-to-navigate class (outline/popup tokens never do).
		if (this.variant === "ref") el.classList.add(CSS_REF_TOKEN_LINK);

		// Inline pills give no editing feedback on click. Left-clicking one
		// drops the caret just before the id's first char (right after `[!`),
		// which reveals the raw `[!id]` — the decoration is skipped while the
		// selection touches the token.
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

		// Heading tokens: clicking the icon/name drops the caret at the start
		// of the callout id. The token span may include a trailing fold mark
		// (`[!id]-`), so the inline offset math above would be off by one —
		// instead locate the `[!` on the line, which is exact because the
		// heading token is always the first `[!` (HEADING_CALLOUT_RE anchors
		// it right after the hashes). The event is NOT stopped from bubbling:
		// Obsidian's livePreviewState must see the mousedown so the raw-syntax
		// reveal stays deferred to mouseup, in the same paint as the `#` marks.
		if (this.variant === "heading") {
			el.addEventListener("mousedown", (evt) => {
				if (evt.button !== 0) return; // left click only; right-click → context menu
				evt.preventDefault(); // take over focus/selection ourselves
				const pos = view.posAtDOM(el);
				const line = view.state.doc.lineAt(pos);
				const idx = line.text.indexOf("[!");
				if (idx === -1) return;
				view.dispatch({
					selection: EditorSelection.cursor(line.from + idx + 2),
				});
				view.focus();
			});
		}

		// Ref tokens (inside wikilinks): clicking the icon follows the link,
		// like clicking the link itself (editing stays available through the
		// title text around the icon, which reveals the raw link on click).
		// The target is re-derived from the live document at click time —
		// posAtDOM may resolve to either edge of the replaced range, so the
		// ref is matched by token range (minus one: the range may include the
		// leading same-file `#`). Stopped from bubbling: nothing may move the
		// caret, we fully take over the click.
		if (this.variant === "ref") {
			el.addEventListener("mousedown", (evt) => {
				if (evt.button !== 0) return; // left click only; right-click → context menu
				evt.preventDefault();
				evt.stopPropagation();
				const pos = view.posAtDOM(el);
				const line = view.state.doc.lineAt(pos);
				const rel = pos - line.from;
				const ref = findWikilinkCalloutRefs(line.text).find(
					(r) => rel >= r.from - 1 && rel <= r.to,
				);
				if (!ref) return;
				const inner = line.text.slice(ref.linkFrom + 2, ref.linkTo - 2);
				const pipeIdx = inner.indexOf("|");
				const target =
					pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
				const mdView = resolveMarkdownView(this.app, view);
				void this.app.workspace.openLinkText(
					target,
					mdView?.file?.path ?? "",
					Keymap.isModEvent(evt),
				);
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
 * Whole-link replacement for a title-less heading-callout reference
 * (`[[#[!id]]]`) or for a bare-token alias (`[[#[!id]|[!id]]]`, the shape
 * TOC plugins generate). Obsidian's own parsers mishandle the trailing `]]]`
 * run (both the CM6 tokenizer and the reading parser cut the link at the
 * FIRST `]]`), so decorating just the token inside the link is not enough —
 * the entire link is replaced with this widget: prefix (`Note#`; a same-file
 * `#` is dropped, and an alias token has none), the callout's icon, and its
 * display name, styled like an internal link. Reading view produces the same
 * display via transformHeadingRefLinks.
 */
export class HeadingRefLinkWidget extends WidgetType {
	/** Snapshot for eq(); same strategy as CalloutTokenWidget.renderKey. */
	private readonly renderKey: string;

	constructor(
		private readonly app: App,
		private readonly rawId: string,
		private readonly registry: CalloutRegistry,
		/** Displayed link text before the token (`Note#`, …; "" when the
		 * raw prefix was a bare same-file `#`, which is hidden). */
		private readonly prefix: string,
		/** Full untruncated link target, for mod-click navigation. */
		private readonly target: string,
		private readonly showIcon: boolean,
	) {
		super();
		const { def, unknown } = resolveCalloutDef(registry, rawId);
		let iconKey = "";
		let materialReady = true;
		if (def) {
			const { icon } = def;
			iconKey = `${icon.type}:${icon.value}:${icon.style ?? ""}:${icon.weight ?? ""}`;
			if (icon.type === "material") {
				materialReady = !!registry.findMaterialSvg(
					icon.value,
					icon.style ?? "outlined",
					icon.weight ?? 400,
				);
			}
		}
		this.renderKey = [
			this.prefix,
			this.target,
			this.showIcon ? "i" : "",
			this.rawId,
			unknown ? "u" : "",
			def?.id ?? "",
			def?.displayName ?? "",
			iconKey,
			materialReady ? "m" : "",
		].join("|");
	}

	override eq(other: HeadingRefLinkWidget): boolean {
		return other.renderKey === this.renderKey;
	}

	override toDOM(view: EditorView): HTMLElement {
		const doc = view.dom.ownerDocument;
		const { def, unknown } = resolveCalloutDef(this.registry, this.rawId);
		const el = doc.createElement("span");
		el.className = CSS_REF_LINK;
		el.appendChild(doc.createTextNode(this.prefix));
		if (this.showIcon && def) {
			const iconEl = buildCalloutTokenDom(doc, {
				rawId: this.rawId,
				registry: this.registry,
				variant: "ref",
				showName: false,
			});
			iconEl.classList.add(CSS_REF_TOKEN_LINK);
			// The icon is the click-to-navigate surface (the name text keeps
			// the caret-drop editing behavior of the widget handler below).
			iconEl.addEventListener("mousedown", (evt) => {
				if (evt.button !== 0) return; // left click only; right-click → context menu
				evt.preventDefault();
				evt.stopPropagation();
				this.follow(view, evt);
			});
			el.appendChild(iconEl);
		}
		// The name is plain text inside the link-styled span (not a
		// cs-callout-name), mirroring reading view where it is ordinary
		// anchor text — link color, native underline.
		el.appendChild(
			doc.createTextNode(
				unknown || !def ? this.rawId.trim() : def.displayName,
			),
		);

		el.addEventListener("mousedown", (evt) => {
			if (evt.button !== 0) return; // left click only; right-click → context menu
			evt.preventDefault(); // take over focus/selection ourselves
			// Mod-click follows the link like a native internal link.
			if (evt.metaKey || evt.ctrlKey) {
				evt.stopPropagation();
				this.follow(view, evt);
				return;
			}
			// Plain click: caret into the id, which reveals the whole raw
			// link (the decoration is skipped while the selection touches
			// it). posAtDOM may resolve to either edge of the replaced
			// range; the widget starts at `[[`, so a position on `[[` means
			// the start edge (search forward), anything else the end edge
			// (search backward). Not stopped from bubbling: livePreviewState
			// must see the mousedown so the reveal defers to mouseup.
			const pos = view.posAtDOM(el);
			const line = view.state.doc.lineAt(pos);
			const rel = pos - line.from;
			const idx = line.text.startsWith("[[", rel)
				? line.text.indexOf("[!", rel)
				: line.text.lastIndexOf("[!", rel);
			if (idx === -1) return;
			view.dispatch({
				selection: EditorSelection.cursor(line.from + idx + 2),
			});
			view.focus();
		});
		return el;
	}

	/**
	 * Follow the reference using the untruncated target (Obsidian's own parse
	 * of the `]]]` run cuts the subpath short, so native navigation is broken
	 * here). Mod held opens a new tab, like a native link.
	 */
	private follow(view: EditorView, evt: MouseEvent): void {
		const mdView = resolveMarkdownView(this.app, view);
		void this.app.workspace.openLinkText(
			this.target,
			mdView?.file?.path ?? "",
			Keymap.isModEvent(evt),
		);
	}

	override ignoreEvent(): boolean {
		// Same contract as CalloutTokenWidget: the editor never handles
		// events on the widget; our own listener does.
		return true;
	}
}

/**
 * Standalone fold chevron for a heading callout, rendered as an end-of-line
 * widget so it trails the whole heading (icon + name/title) — mirroring a
 * regular callout's disclosure arrow, which follows the label. Built only when
 * the core "Fold heading" setting is on; clicking it folds the same section
 * Obsidian's native pre-heading arrow folds.
 */
export class HeadingFoldArrowWidget extends WidgetType {
	constructor(
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
		arrow.className = CSS_FOLD_ARROW;
		if (this.folded) arrow.classList.add("cs-collapsed");
		// Fade the chevron in during the startup entrance window (trails the
		// bar and token — see the staggered delays in styles.css).
		if (isStartupEntranceActive()) arrow.classList.add(CSS_ANIM_IN);
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
	 * Toggle the fold of the heading section this arrow trails, then dispatch
	 * the refresh effect so the chevron re-reflects the new state.
	 */
	private toggleFold(view: EditorView, el: HTMLElement): void {
		const pos = view.posAtDOM(el);
		const headingLine = view.state.doc.lineAt(pos).number - 1; // 0-based
		// Touch hit-testing can resolve the trailing widget to a neighboring
		// line; only fold when the resolved line really is an ATX heading.
		if (!/^#{1,6}\s/.test(view.state.doc.line(headingLine + 1).text)) {
			return;
		}
		toggleHeadingFold(view, headingLine);
		view.dispatch({ effects: calloutStudioRefresh.of(null) });
	}

	override ignoreEvent(): boolean {
		return true;
	}
}
