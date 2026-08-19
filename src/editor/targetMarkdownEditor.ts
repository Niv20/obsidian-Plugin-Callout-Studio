/**
 * editor/targetMarkdownEditor.ts — which editor a window writes into.
 *
 * Every other write in this plugin arrives through an `editorCallback` or a
 * CodeMirror event, so Obsidian hands it the right `Editor` and there is
 * nothing to decide. A window opened from the ribbon has no such handle: it is
 * opened *beside* the note, acts some seconds later, and by then the thing that
 * had focus is a button in a modal.
 *
 * Two rules make that safe, and both are load-bearing:
 *
 * **Never `workspace.activeEditor`.** It is the closest-looking API and it is
 * the wrong one: `EmbeddableMarkdownEditor` installs *itself* as `activeEditor`
 * while the callout editor's live preview is on screen, so a plugin window that
 * trusted it could type into a preview widget instead of the user's note.
 * `getActiveViewOfType(MarkdownView)` only ever answers with a real markdown
 * leaf.
 *
 * **Capture, then re-check.** Resolving once at open time is what makes "the
 * note I opened this from" mean anything across split panes and a dozen tabs;
 * re-checking at write time is what stops a leaf that has since been closed,
 * re-used for another file or flipped into Reading view from being written to
 * anyway.
 */
import { MarkdownView } from "obsidian";
import type { App, Editor } from "obsidian";

export interface TargetEditor {
	view: MarkdownView;
	editor: Editor;
}

/**
 * The markdown editor the user is looking at, or `null` when there isn't one.
 *
 * `null` covers every "nothing to write into" case with one answer: no note
 * open, a canvas or graph or the settings tab in front, or a note being *read*
 * rather than edited. Reading view is deliberately refused rather than silently
 * flipped to source — changing what the user is looking at is not this
 * feature's call to make.
 */
export function resolveTargetEditor(app: App): TargetEditor | null {
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) return null;
	if (view.getMode() !== "source") return null;
	return { view, editor: view.editor };
}

/**
 * Is a captured target still the live editor it was when it was captured?
 *
 * The leaf identity check is the one that matters: Obsidian re-uses a
 * `WorkspaceLeaf` for a different view rather than destroying it, so a leaf
 * that now hosts something else still holds a perfectly usable — and completely
 * wrong — `Editor`.
 */
export function isTargetStillValid(app: App, target: TargetEditor): boolean {
	const { view } = target;
	// `leaf` is typed non-nullable but a detached view really can be missing it.
	if (!view.leaf) return false;
	if (view.leaf.view !== view) return false;
	if (!app.workspace.getLeavesOfType("markdown").includes(view.leaf)) {
		return false;
	}
	if (view.getMode() !== "source") return false;
	return view.file !== null;
}

/**
 * The captured target if it still holds, otherwise whatever is active now,
 * otherwise `null`.
 *
 * Preferring the capture is what makes the window predictable — it writes where
 * it was opened from — while the fallback keeps it useful when the user opened
 * it with nothing focused and then clicked into a note behind it.
 */
export function currentTargetEditor(
	app: App,
	captured: TargetEditor | null,
): TargetEditor | null {
	if (captured && isTargetStillValid(app, captured)) return captured;
	return resolveTargetEditor(app);
}
