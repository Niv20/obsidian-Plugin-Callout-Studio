/**
 * editor/livepreview/refresh.ts — Editor-wide refresh signal for the
 * heading/inline callout decorations.
 *
 * Registry changes (colors, icons, renames, new definitions) and settings
 * toggles do not change the document, so CodeMirror would never rebuild our
 * decorations on its own. Dispatching this no-op effect to every editor that
 * carries them forces each ViewPlugin's update() to rebuild.
 */
import { StateEffect } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/** No-payload effect: "callout definitions or toggles changed — rebuild". */
export const calloutStudioRefresh = StateEffect.define<null>();

/**
 * Every EditorView our ViewPlugin is currently mounted in.
 *
 * The plugin registers itself here from its constructor and drops out in
 * destroy(), so membership tracks CodeMirror's own lifecycle exactly and the
 * set can never hold a torn-down view.
 *
 * This replaced walking `getLeavesOfType("markdown")` for `editor.cm`, which
 * only ever found the ONE top-level editor per markdown tab. Obsidian applies
 * a registered editor extension to every CM6 instance it builds, and several
 * of those are not workspace leaves: table cells and canvas cards in Live
 * Preview, an editable `![[note]]` transclusion, and this plugin's own
 * settings preview. Their pills and heading bars are widget DOM the icon sweep
 * deliberately will not touch (see CSS_CM_WIDGET), so missing them here left
 * them with no refresh path at all — they kept the old icon until the next
 * keystroke in that editor. GlobalStyleModal had already grown a local
 * workaround for its own preview; this removes the need for one.
 */
const liveViews = new Set<EditorView>();

/** Start tracking `view` (called from the ViewPlugin's constructor). */
export function registerCalloutEditorView(view: EditorView): void {
	liveViews.add(view);
}

/** Stop tracking `view` (called from the ViewPlugin's destroy()). */
export function unregisterCalloutEditorView(view: EditorView): void {
	liveViews.delete(view);
}

/**
 * Dispatch the refresh effect to every editor carrying our decorations —
 * every window, and nested editors as well as workspace leaves.
 *
 * Iterated over a copy: a dispatch can synchronously tear an editor down (and
 * so mutate the set) through the update it triggers.
 */
export function refreshAllCalloutEditors(): void {
	for (const view of Array.from(liveViews)) {
		try {
			view.dispatch({ effects: calloutStudioRefresh.of(null) });
		} catch {
			// A detached/mid-teardown editor must not break the sweep.
		}
	}
}
