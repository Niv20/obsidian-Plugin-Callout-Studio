/**
 * editor/livepreview/widgets.ts — CodeMirror widget for `[!id]` tokens.
 *
 * One widget class serves both the inline pill and the in-heading token; the
 * DOM comes from the shared builder (renderShared.buildCalloutTokenDom), so
 * Live Preview and reading view render identically.
 */
import { WidgetType } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";
import type { CalloutRegistry } from "../../manager/CalloutRegistry";
import { buildCalloutTokenDom, resolveCalloutDef } from "../renderShared";

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
		return buildCalloutTokenDom(view.dom.ownerDocument, {
			rawId: this.rawId,
			registry: this.registry,
			variant: this.variant,
			showName: this.showName,
		});
	}

	override ignoreEvent(): boolean {
		// The editor never handles events on the token; right-clicks reach
		// the document-level context-menu listener regardless.
		return true;
	}
}
