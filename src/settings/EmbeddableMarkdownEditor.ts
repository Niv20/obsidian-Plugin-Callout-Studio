/**
 * settings/EmbeddableMarkdownEditor.ts — Thin wrapper around Obsidian's
 * INTERNAL markdown editor, so the settings preview can host a real, editable
 * Live Preview surface that is 1:1 with a note.
 *
 * ⚠️ Undocumented internals. It obtains the base `MarkdownEditor` constructor
 * via `app.embedRegistry.embedByExtension.md` + a prototype walk — the
 * community-standard "EmbeddableMarkdownEditor" pattern. It can break on
 * Obsidian updates, so ALL fragile access is isolated here: construction throws
 * on any unexpected shape and callers (LiveCalloutPreview) must catch and fall
 * back to a static `MarkdownRenderer` render.
 *
 * Why an embedded editor at all: extensions registered via
 * `registerEditorExtension` apply to EVERY markdown editor in the workspace, so
 * an embedded one automatically gets Obsidian's native `> [!id]` callout
 * rendering, our heading/inline ViewPlugin, and the injected per-callout CSS —
 * i.e. it renders exactly like a real note, in the active theme, for free.
 */
import { Component, type App, type Editor, type TFile } from "obsidian";
import { EditorView } from "@codemirror/view";
import {
	EditorSelection,
	EditorState,
	Prec,
	StateEffect,
} from "@codemirror/state";

/** Minimal shape of the internal edit view we touch. */
interface InternalMarkdownEditor extends Component {
	editable: boolean;
	editMode?: object;
	showEditor?(): void;
	set(content: string, focus?: boolean): void;
	destroy?(): void;
	editor?: Editor & { cm?: EditorView };
	cm?: EditorView;
}

/** The 3rd constructor arg the base editor stores as `this.owner`. */
interface EditorOwner {
	app: App;
	onMarkdownScroll: () => void;
	getMode: () => "source" | "preview";
	/**
	 * The real Obsidian editor. This owner becomes `app.workspace.activeEditor`
	 * whenever the embedded editor is focused/clicked, so it must expose a full
	 * `Editor`, for two independent consumers:
	 *
	 * - Word Count core plugin: listens on every `editor-selection-change` and
	 *   runs `info.editor.getSelection()`, where `info` is this owner. A missing
	 *   editor throws — surfaced asynchronously (and thus "uncaught") because
	 *   Obsidian's `tryTrigger` re-throws listener errors via `setTimeout`.
	 * - Command Palette: `listCommands()` runs every command's `checkCallback`,
	 *   and the editor commands (`editor:follow-link`, `editor:toggle-fold`, …)
	 *   call `activeEditor.editor.getCursor()` / `hasFocus()`. A partial shim
	 *   without those methods throws `TypeError: … is not a function`.
	 *
	 * So the owner exposes the genuine underlying `Editor` (see the `get editor`
	 * accessor in the constructor). Read-only is still enforced by
	 * `EditorState.readOnly`, so a command reaching the preview cannot mutate it.
	 */
	readonly editor: Editor;
}

type MarkdownEditorCtor = new (
	app: App,
	container: HTMLElement,
	owner: EditorOwner,
) => InternalMarkdownEditor;

/** `app` widened to the internal embed registry. */
interface EmbedRegistryApp extends App {
	embedRegistry?: {
		embedByExtension?: {
			md?: (
				ctx: { app: App; containerEl: HTMLElement },
				file: TFile | null,
				subpath: string,
			) => InternalMarkdownEditor;
		};
	};
}

/** Cached constructor — resolving it spins up (then unloads) a throwaway editor. */
let cachedCtor: MarkdownEditorCtor | null = null;

/**
 * Resolve the base `MarkdownEditor` constructor by instantiating a throwaway
 * embed and walking two prototype levels up from its concrete edit view (the
 * concrete `MarkdownEditView` → its base editor class). Throws if the internal
 * shape changed, so the caller can fall back.
 */
function resolveMarkdownEditorCtor(app: App): MarkdownEditorCtor {
	if (cachedCtor) return cachedCtor;

	const md = (app as EmbedRegistryApp).embedRegistry?.embedByExtension?.md;
	if (!md) {
		throw new Error("embedRegistry.embedByExtension.md unavailable");
	}

	const temp = md({ app, containerEl: createDiv() }, null, "");
	try {
		temp.editable = true;
		temp.showEditor?.();
		const editMode = temp.editMode;
		if (!editMode) {
			throw new Error("editMode unavailable after showEditor()");
		}
		const proto = Object.getPrototypeOf(Object.getPrototypeOf(editMode)) as
			| { constructor?: unknown }
			| null;
		const ctor = proto?.constructor;
		if (typeof ctor !== "function") {
			throw new Error("could not resolve MarkdownEditor constructor");
		}
		cachedCtor = ctor as MarkdownEditorCtor;
		return cachedCtor;
	} finally {
		temp.unload();
	}
}

export interface EmbeddableMarkdownEditorOptions {
	/** Initial markdown content. */
	value: string;
	/**
	 * When true the editor is read-only: the cursor can still move and click (so
	 * Live Preview reveals the raw markdown), but typing/paste/drop never change
	 * the document. Each blocked attempt invokes {@link onEditAttempt}.
	 */
	readOnly?: boolean;
	/** Invoked when the user attempts to edit while {@link readOnly}. */
	onEditAttempt?: () => void;
}

/**
 * A real, editable Obsidian markdown editor mounted into an arbitrary element.
 * The constructor THROWS if the internal API is unavailable — callers must
 * wrap it in try/catch and provide a fallback.
 */
export class EmbeddableMarkdownEditor {
	private readonly instance: InternalMarkdownEditor;
	private readonly readOnly: boolean;

	constructor(
		app: App,
		container: HTMLElement,
		options: EmbeddableMarkdownEditorOptions,
	) {
		const Ctor = resolveMarkdownEditorCtor(app);
		// Arrow closures so the `get editor` accessor (whose own `this` is the
		// owner object) can still reach this instance — without aliasing `this`.
		const instanceEditor = (): Editor | undefined => this.instance?.editor;
		const selectionText = (): string => this.currentSelectionText();
		// getMode "source" = an editing surface (Live-Preview vs. raw source
		// follows the vault's own setting, exactly like the user's notes), NOT
		// the reading view.
		const owner: EditorOwner = {
			app,
			onMarkdownScroll: () => {},
			getMode: () => "source",
			// Once mounted, expose the REAL Obsidian editor (see EditorOwner.editor
			// for why the owner must be a full editor: Word Count and the Command
			// Palette both call methods on `activeEditor.editor`). Before mount —
			// `this.instance` is still undefined during the base constructor — fall
			// back to a selection-only shim, which is enough for the Word Count
			// listener that fires on the initial `parkCursor` selection dispatch.
			get editor(): Editor {
				return (
					instanceEditor() ??
					({ getSelection: selectionText } as Editor)
				);
			},
		};
		this.instance = new Ctor(app, container, owner);
		this.instance.set(options.value, false);

		// A shape change could let construction "succeed" without mounting any
		// DOM (a silent-empty failure that would otherwise leave a blank box).
		// Treat that as a failure so the caller falls back to a static render.
		if (container.childElementCount === 0) {
			this.destroy();
			throw new Error("embedded editor did not mount");
		}

		this.readOnly = options.readOnly ?? false;
		if (this.readOnly) {
			this.applyReadOnly(options.onEditAttempt);
			this.parkCursor();
		}
	}

	/**
	 * Make the editor read-only while keeping it interactive: selection/cursor
	 * still work (so Obsidian's Live Preview reveals raw markdown on click), but
	 * every input attempt is swallowed and reported via `onEditAttempt`.
	 *
	 * `readOnly` is the real guarantee that nothing lands; the high-precedence
	 * DOM handlers exist to surface the notice and stop the browser's default.
	 *
	 * Focus policy for previews:
	 * - `tabindex="-1"` on the content element keeps Obsidian's modal
	 *   focus-first pass (which skips `[tabindex="-1"]`) from dropping the
	 *   caret into the preview when a popup opens. Clicking still focuses.
	 * - On blur the caret is parked at the end of the document (see
	 *   {@link parkCursor} for why it must not idle inside a callout).
	 */
	private applyReadOnly(onEditAttempt?: () => void): void {
		const cm = this.cm;
		if (!cm) return;
		const block = (event: Event): boolean => {
			event.preventDefault();
			onEditAttempt?.();
			return true;
		};
		cm.dispatch({
			effects: StateEffect.appendConfig.of([
				EditorState.readOnly.of(true),
				EditorView.contentAttributes.of({ tabindex: "-1" }),
				EditorView.domEventHandlers({
					blur: () => {
						// Deferred: let CodeMirror finish processing the focus
						// change before we move the selection.
						window.setTimeout(() => this.parkCursor(), 0);
						return false;
					},
				}),
				Prec.highest(
					EditorView.domEventHandlers({
						beforeinput: block,
						paste: block,
						drop: block,
					}),
				),
			]),
		});
	}

	/**
	 * Move the caret to the end of the document without scrolling or focusing.
	 *
	 * A read-only preview's caret must never idle INSIDE a `> [!id]` block
	 * while the editor is unfocused: Obsidian then collapses the callout into
	 * a widget but keeps a caret line whose hanging indent it measures against
	 * the widget's full width, and that bogus width is cached and applied to
	 * the raw source lines the next time a click reveals them (every wrapped
	 * row squeezed to ~one character). Sample texts therefore end outside any
	 * regular callout, and the caret is parked there on build, reseed and blur.
	 */
	private parkCursor(): void {
		const cm = this.cm;
		if (!cm) return;
		try {
			cm.dispatch({
				selection: EditorSelection.cursor(cm.state.doc.length),
			});
		} catch {
			/* editor mid-teardown — ignore */
		}
	}

	/** Underlying CM6 view, for dispatching state effects (may be null early). */
	get cm(): EditorView | null {
		return this.instance?.editor?.cm ?? this.instance?.cm ?? null;
	}

	/**
	 * Text of the current primary selection ("" if none / not ready). Consumed
	 * by the owner's `editor.getSelection()` shim (see {@link EditorOwner}).
	 * Fully defensive: it can be called mid-construction (before `this.instance`
	 * is assigned) or mid-teardown, and must never throw.
	 */
	private currentSelectionText(): string {
		try {
			const cm = this.cm;
			if (!cm) return "";
			const { from, to } = cm.state.selection.main;
			return cm.state.sliceDoc(from, to);
		} catch {
			return "";
		}
	}

	/** Replace the whole document. */
	setValue(value: string): void {
		this.instance.set(value, false);
		// set() leaves the caret at position 0 — inside a callout when the
		// sample starts with one (see parkCursor).
		if (this.readOnly) this.parkCursor();
	}

	destroy(): void {
		try {
			this.instance.destroy?.();
		} catch {
			/* ignore teardown errors */
		}
		try {
			this.instance.unload();
		} catch {
			/* ignore teardown errors */
		}
	}
}
