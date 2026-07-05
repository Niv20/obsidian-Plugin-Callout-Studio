/**
 * editor/livepreview/refresh.ts — Editor-wide refresh signal for the
 * heading/inline callout decorations.
 *
 * Registry changes (colors, icons, renames, new definitions) and settings
 * toggles do not change the document, so CodeMirror would never rebuild our
 * decorations on its own. Dispatching this no-op effect to every open
 * markdown editor forces the ViewPlugin's update() to rebuild.
 */
import { StateEffect } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { MarkdownView } from "obsidian";
import type { App } from "obsidian";

/** No-payload effect: "callout definitions or toggles changed — rebuild". */
export const calloutStudioRefresh = StateEffect.define<null>();

/**
 * Dispatch the refresh effect to every open markdown editor (including
 * pop-out windows — getLeavesOfType covers all workspace windows).
 * `editor.cm` is the community-standard bridge to the underlying
 * EditorView; guarded because it is not part of the public typings.
 */
export function refreshAllMarkdownEditors(app: App): void {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		const cm = (view.editor as unknown as { cm?: EditorView }).cm;
		try {
			cm?.dispatch({ effects: calloutStudioRefresh.of(null) });
		} catch {
			// A detached/mid-teardown editor must not break the sweep.
		}
	}
}
