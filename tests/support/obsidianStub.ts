/**
 * tests/support/obsidianStub.ts — the `obsidian` module, as far as the tests
 * are concerned.
 *
 * `scripts/run-tests.mjs` aliases every `import … from "obsidian"` to this file.
 * It is not a *mock* of Obsidian: nothing here pretends to render, fetch or
 * store anything. It exists so a module under test can be bundled at all, and
 * so the handful of Obsidian values that are read as **data** rather than
 * called for effect have a truthful stand-in.
 *
 * It used to be a string written into a temp directory by the runner. It is a
 * real file now for one reason: `editorLivePreviewField` has to be an actual
 * `StateField`. `EditorState.field(f, false)` looks the field up by `f.id` in
 * the state's own config, so a plain object can only ever answer `undefined` —
 * which is indistinguishable from "this sub-editor has no such field", the very
 * distinction `calloutViewPlugin` and `headingGapField` branch on. A file can
 * import `@codemirror/state`; a string in `os.tmpdir()` cannot resolve it.
 *
 * Three exports are *seedable* — they are read as data, so an always-empty
 * default would leave half of each caller untestable. Each is driven by a
 * global a test sets before the code under test runs, following the convention
 * `getIconIds` established:
 *
 * - `__CS_ICON_IDS__`   — the Lucide id list (`icons/lucideId.ts`, `nameCheck.ts`)
 * - `__CS_LIVE_PREVIEW__` — whether a state created with `editorLivePreviewField`
 *   reports Live Preview (`false` models source mode)
 * - `__CS_NOTICES__`    — an array collecting every `new Notice(...)` message,
 *   so a suite can assert the user was told something. Absent by default, in
 *   which case `Notice` records nothing.
 *
 * Everything else is the smallest shape that lets `instanceof` and `super(...)`
 * work. Nothing here has behaviour worth asserting, and no test should assert
 * on it.
 */
import { StateField } from "@codemirror/state";

/* -------------------------------------------------------------------------- */
/* Seams                                                                      */
/* -------------------------------------------------------------------------- */

interface TestGlobals {
	__CS_ICON_IDS__?: string[];
	__CS_LIVE_PREVIEW__?: boolean;
	__CS_NOTICES__?: string[];
}

const seams = globalThis as unknown as TestGlobals;

/* -------------------------------------------------------------------------- */
/* Platform / misc                                                            */
/* -------------------------------------------------------------------------- */

export const Platform = { isMobile: false, isDesktop: true, isMacOS: false };

export const Keymap = { isModEvent: () => false };

export function setIcon(): void {
	/* no-op: nothing here draws */
}

export function getIconIds(): string[] {
	return seams.__CS_ICON_IDS__ ?? [];
}

export function normalizePath(p: string): string {
	return p;
}

export function requestUrl(): Promise<never> {
	return Promise.reject(new Error("no network in tests"));
}

export function requireApiVersion(): boolean {
	return true;
}

/* -------------------------------------------------------------------------- */
/* Classes                                                                    */
/* -------------------------------------------------------------------------- */

export class TFile {}
export class Plugin {}
export class Component {}
export class Modal {}
export class Editor {}

/**
 * Settings-pane and menu constructors. These exist so the *bundle links*, and
 * for no other reason: `AutoComplete` imports `CalloutEditor` as a value (it
 * opens one for "Create new"), which drags the whole settings UI into any suite
 * that touches the popover. None of it is constructed there, and a suite that
 * did construct one would need real implementations rather than these.
 */
export class Setting {}
export class SliderComponent {}
export class ToggleComponent {}
export class PluginSettingTab {}
export class Menu {}
export class WorkspaceLeaf {}

/** Records its message when `__CS_NOTICES__` is an array; inert otherwise. */
export class Notice {
	constructor(message?: string) {
		if (Array.isArray(seams.__CS_NOTICES__) && message !== undefined) {
			seams.__CS_NOTICES__.push(message);
		}
	}
}

export class MarkdownRenderer {
	static render(): Promise<void> {
		return Promise.resolve();
	}
}

/**
 * Bare on purpose: every field the code under test reads (`editor`,
 * `containerEl`, `previewMode`, `file`) is assigned by the suite that needs it.
 * What matters is that it is a real class, so `info instanceof MarkdownView`
 * and `view instanceof MarkdownView` mean something.
 */
export class MarkdownView {}

/**
 * `CalloutAutoComplete extends EditorSuggest`, so this has to carry the two
 * things the subclass inherits rather than defines: `app` (set by `super(app)`)
 * and `close()` (called through `super.close()`). `context` is a property
 * Obsidian assigns before `selectSuggestion` runs; suites set it themselves.
 */
export class EditorSuggest<T> {
	context: unknown = null;
	/** Marks that `super.close()` ran, which is otherwise unobservable. */
	closedCount = 0;

	constructor(public app: unknown) {}

	close(): void {
		this.closedCount++;
	}

	/** Present so `EditorSuggest<T>` is not an unused type parameter. */
	protected declare readonly __suggestion?: T;
}

/* -------------------------------------------------------------------------- */
/* CodeMirror-facing values                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Obsidian's "is this editor in Live Preview" field. A real `StateField`, so a
 * state that includes it answers `true`/`false` and one that does not answers
 * `undefined` — the three-way distinction the callers actually branch on.
 */
export const editorLivePreviewField = StateField.define<boolean>({
	create: () => seams.__CS_LIVE_PREVIEW__ !== false,
	update: (value) => value,
});

/**
 * Obsidian's Live Preview ViewPlugin, read only as the key to
 * `view.plugin(livePreviewState)`. A fake view answers that call however its
 * suite wants, so the key needs no behaviour — only identity.
 */
export const livePreviewState = {};
