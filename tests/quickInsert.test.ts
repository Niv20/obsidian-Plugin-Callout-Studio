/**
 * tests/quickInsert.test.ts — the ribbon's quick-insert window.
 *
 * Three separable things, and the split is deliberate:
 *
 * - **What the list shows.** Pure functions over definitions, so they are
 *   tested as functions: matching, the source partition, and the one sort that
 *   keeps built-ins and the user's own callouts *mixed* rather than grouped.
 * - **What the button writes.** The window calls `wrapSelectionInCallout` and
 *   nothing else, which is the point — the `Wrap in callout` command and every
 *   user-built wrap command call the same function, so a third answer to "what
 *   does a paragraph become" cannot exist. The cases below are the ones the
 *   window is *for* and that `calloutBlockTools.test.ts` does not already pin:
 *   a cursor sitting inside a paragraph, a blank line, a list, a blockquote,
 *   several paragraphs at once — plus the single-edit guarantee that makes one
 *   Undo put everything back.
 * - **Which editor it writes into.** The one piece with no precedent in this
 *   plugin: every other write arrives through an `editorCallback`, so Obsidian
 *   decides. A window opened from the ribbon has to decide for itself, and get
 *   it right some seconds later.
 *
 * The window itself is not constructed here. `Modal` in the stub is a bare
 * marker class and `Plugin` has no `addRibbonIcon`, so a test that built one
 * would be testing the stub.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import type { App, Editor, EditorPosition, WorkspaceLeaf } from "obsidian";
import { MarkdownView } from "obsidian";
import { wrapSelectionInCallout } from "../src/editor/CalloutBlockTools";
import {
	currentTargetEditor,
	isTargetStillValid,
	resolveTargetEditor,
	type TargetEditor,
} from "../src/editor/targetMarkdownEditor";
import { previewMarkdown } from "../src/settings/quickInsertPreview";
import { renderQuickInsertRow } from "../src/settings/quickInsertRow";
import { asEl, el } from "./support/fakeDom";
import { readRepoFile } from "./support/sourceScan";
import type { CalloutDefinition } from "../src/types";
import {
	calloutMatchesQuery,
	CALLOUT_SOURCE_FILTERS,
	filterCalloutList,
	isCalloutSourceFilter,
	matchesSourceFilter,
} from "../src/utils/calloutSearch";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A bubbling click whose `target` is the element the pointer really hit — the
 * only part of the event the row's handler reads, and the part that decides
 * whether the click was a button's or the row's.
 */
const clickOn = (target: unknown): Event =>
	({ type: "click", bubbles: true, target }) as unknown as Event;

const def = (over: Partial<CalloutDefinition> = {}): CalloutDefinition => ({
	id: "warning",
	displayName: "Warning",
	icon: { type: "lucide", value: "alert-triangle" },
	colorLight: "#ff0000",
	colorDark: "#ff0000",
	foldable: false,
	defaultFolded: false,
	builtIn: true,
	source: "builtin",
	...over,
});

const names = (defs: readonly CalloutDefinition[]): string[] =>
	defs.map((d) => d.displayName);

/* -------------------------------------------------------------------------- */
/* What the list shows                                                        */
/* -------------------------------------------------------------------------- */

describe("calloutMatchesQuery", () => {
	it("matches the display name, the id and any alias", () => {
		const d = def({
			id: "warn",
			displayName: "Heads up",
			aliases: ["caution", "careful"],
		});

		assert.ok(calloutMatchesQuery(d, "heads"));
		assert.ok(calloutMatchesQuery(d, "arn"), "substring, not prefix");
		assert.ok(calloutMatchesQuery(d, "caution"));
		assert.ok(calloutMatchesQuery(d, "careful"));
		assert.ok(!calloutMatchesQuery(d, "danger"));
	});

	it("is case-insensitive on both sides", () => {
		const d = def({ id: "ToDo", displayName: "To Do", aliases: ["TASK"] });

		assert.ok(calloutMatchesQuery(d, "todo"));
		assert.ok(calloutMatchesQuery(d, "to do"));
		assert.ok(calloutMatchesQuery(d, "task"));
	});

	it("matches everything when the query is empty", () => {
		assert.ok(calloutMatchesQuery(def(), ""));
	});

	it("treats punctuation and digits as ordinary characters", () => {
		// No regex anywhere in the path, so an id full of `-`, `_` and digits
		// needs no escaping and a query full of them cannot blow up.
		const d = def({ id: "step_2-of.3", displayName: "Step 2" });

		assert.ok(calloutMatchesQuery(d, "_2-of."));
		assert.ok(calloutMatchesQuery(d, "step_2"));
		assert.ok(!calloutMatchesQuery(d, "step-2"));
	});
});

describe("isCalloutSourceFilter", () => {
	it("accepts exactly the three it declares", () => {
		for (const value of CALLOUT_SOURCE_FILTERS) {
			assert.ok(isCalloutSourceFilter(value), value);
		}
		assert.strictEqual(CALLOUT_SOURCE_FILTERS.length, 3);
	});

	it("rejects anything else, including near misses and non-strings", () => {
		// This value is persisted, so it can come back from a future build, a
		// hand-edit, or another vault's export.
		for (const junk of ["", "All", "builtIn", "mine", 0, null, undefined, {}]) {
			assert.ok(!isCalloutSourceFilter(junk), JSON.stringify(junk));
		}
	});
});

describe("matchesSourceFilter", () => {
	it("partitions on builtIn, not on source", () => {
		// A customized built-in is still a built-in, and a discovered row the
		// user adopted is still theirs — `source` says where a row came from,
		// which is a different question.
		const customizedBuiltIn = def({ builtIn: true, customized: true });
		const adoptedDiscovery = def({
			id: "mine",
			builtIn: false,
			source: "fallback",
			customized: true,
		});

		assert.ok(matchesSourceFilter(customizedBuiltIn, "builtin"));
		assert.ok(!matchesSourceFilter(customizedBuiltIn, "user"));
		assert.ok(matchesSourceFilter(adoptedDiscovery, "user"));
		assert.ok(!matchesSourceFilter(adoptedDiscovery, "builtin"));
	});

	it("keeps everything under `all`", () => {
		assert.ok(matchesSourceFilter(def({ builtIn: true }), "all"));
		assert.ok(matchesSourceFilter(def({ builtIn: false }), "all"));
	});
});

describe("filterCalloutList", () => {
	const list = [
		def({ id: "warning", displayName: "Warning", builtIn: true }),
		def({ id: "abstract", displayName: "Abstract", builtIn: true }),
		def({ id: "recipe", displayName: "Recipe", builtIn: false, source: "user" }),
		def({ id: "note", displayName: "Note", builtIn: true }),
		def({ id: "budget", displayName: "budget", builtIn: false, source: "user" }),
	];

	it("mixes built-ins and the user's own alphabetically, never grouped", () => {
		// The whole point of one list: a user looking for "Recipe" should not
		// have to know whether they made it.
		assert.deepStrictEqual(names(filterCalloutList(list, { query: "", filter: "all" })), [
			"Abstract",
			"budget",
			"Note",
			"Recipe",
			"Warning",
		]);
	});

	it("sorts case-insensitively, so lowercase does not sink to the bottom", () => {
		const sorted = names(filterCalloutList(list, { query: "", filter: "all" }));
		assert.ok(sorted.indexOf("budget") < sorted.indexOf("Note"));
	});

	it("narrows to one source without re-ordering what is left", () => {
		assert.deepStrictEqual(
			names(filterCalloutList(list, { query: "", filter: "user" })),
			["budget", "Recipe"],
		);
		assert.deepStrictEqual(
			names(filterCalloutList(list, { query: "", filter: "builtin" })),
			["Abstract", "Note", "Warning"],
		);
	});

	it("applies the filter and the query together", () => {
		assert.deepStrictEqual(
			names(filterCalloutList(list, { query: "e", filter: "user" })),
			["budget", "Recipe"],
		);
		assert.deepStrictEqual(
			names(filterCalloutList(list, { query: "e", filter: "builtin" })),
			["Note"],
		);
	});

	it("trims the query, so a stray space is not a failed search", () => {
		assert.deepStrictEqual(
			names(filterCalloutList(list, { query: "  NOTE  ", filter: "all" })),
			["Note"],
		);
	});

	it("treats a whitespace-only query as no query at all", () => {
		assert.strictEqual(
			filterCalloutList(list, { query: "   ", filter: "all" }).length,
			list.length,
		);
	});

	it("returns an empty list rather than everything when nothing matches", () => {
		assert.deepStrictEqual(
			filterCalloutList(list, { query: "zzz", filter: "all" }),
			[],
		);
	});

	it("orders numbered ids the way a person reads them", () => {
		const steps = [
			def({ id: "step-10", displayName: "Step 10" }),
			def({ id: "step-2", displayName: "Step 2" }),
		];

		assert.deepStrictEqual(
			names(filterCalloutList(steps, { query: "step", filter: "all" })),
			["Step 2", "Step 10"],
		);
	});

	it("does not mutate the list it was given", () => {
		const original = [...list];
		filterCalloutList(list, { query: "", filter: "all" });
		assert.deepStrictEqual(list, original);
	});
});

/* -------------------------------------------------------------------------- */
/* What the Insert button writes                                              */
/* -------------------------------------------------------------------------- */

/**
 * The slice of `Editor` these transforms touch, over a plain string.
 *
 * `|` marks the cursor, `«…»` a selection — the same notation
 * `calloutBlockTools.test.ts` uses, because these are the same transforms seen
 * from a different button. It counts `replaceRange` calls, which the older
 * editor does not, because the Undo guarantee is a *quantity* of edits.
 */
class Buffer {
	private text: string;
	private anchor: EditorPosition = { line: 0, ch: 0 };
	private head: EditorPosition = { line: 0, ch: 0 };
	/** How many separate edits landed — one is what makes Undo atomic. */
	edits = 0;

	constructor(source: string) {
		const selStart = source.indexOf("«");
		const selEnd = source.indexOf("»");
		if (selStart !== -1 && selEnd !== -1) {
			this.text =
				source.slice(0, selStart) +
				source.slice(selStart + 1, selEnd) +
				source.slice(selEnd + 1);
			this.anchor = this.posOf(selStart);
			this.head = this.posOf(selEnd - 1);
			return;
		}
		const caret = source.indexOf("|");
		this.text = caret === -1 ? source : source.replace("|", "");
		if (caret !== -1) this.anchor = this.head = this.posOf(caret);
	}

	private posOf(offset: number): EditorPosition {
		const before = this.text.slice(0, offset);
		return {
			line: before.split("\n").length - 1,
			ch: offset - (before.lastIndexOf("\n") + 1),
		};
	}

	private offsetOf(pos: EditorPosition): number {
		const lines = this.text.split("\n");
		let offset = 0;
		for (let i = 0; i < pos.line; i++) offset += (lines[i]?.length ?? 0) + 1;
		return offset + pos.ch;
	}

	value(): string {
		return this.text;
	}

	valueWithCursor(): string {
		const offset = this.offsetOf(this.head);
		return `${this.text.slice(0, offset)}|${this.text.slice(offset)}`;
	}

	lineCount(): number {
		return this.text.split("\n").length;
	}

	getLine(n: number): string {
		return this.text.split("\n")[n] ?? "";
	}

	getCursor(which?: "anchor" | "head" | "from" | "to"): EditorPosition {
		if (which === "anchor") return this.anchor;
		if (which === "from" || which === "to") {
			const a = this.offsetOf(this.anchor);
			const h = this.offsetOf(this.head);
			return (which === "from" ? a <= h : a > h) ? this.anchor : this.head;
		}
		return this.head;
	}

	getSelection(): string {
		const a = this.offsetOf(this.anchor);
		const h = this.offsetOf(this.head);
		return this.text.slice(Math.min(a, h), Math.max(a, h));
	}

	replaceRange(
		replacement: string,
		from: EditorPosition,
		to?: EditorPosition,
	): void {
		this.edits++;
		const start = this.offsetOf(from);
		const end = to ? this.offsetOf(to) : start;
		this.text = this.text.slice(0, start) + replacement + this.text.slice(end);
	}

	setCursor(pos: EditorPosition): void {
		this.anchor = this.head = pos;
	}
}

const buffer = (source: string): Buffer => new Buffer(source);
const asEditor = (b: Buffer): Editor => b as unknown as Editor;

/** Exactly what the window's Insert button does, and nothing more. */
const insert = (b: Buffer, over: Partial<CalloutDefinition> = {}): boolean =>
	wrapSelectionInCallout(asEditor(b), { def: def(over) });

describe("the Insert button writes block callouts", () => {
	it("wraps the whole paragraph the cursor is sitting inside", () => {
		// Not "split the line at the cursor" — the paragraph is the unit, which
		// is what makes clicking Insert with the cursor anywhere in a sentence
		// do the obvious thing.
		const b = buffer("first line\nsec|ond line\nthird line");
		assert.strictEqual(insert(b), true);

		assert.strictEqual(
			b.value(),
			"> [!warning] Warning\n> first line\n> second line\n> third line",
		);
	});

	it("wraps the paragraph from column 0 too", () => {
		// A cursor at the start of a line is not a request for an empty callout
		// — there is text right there to wrap.
		const b = buffer("|only line");
		insert(b);

		assert.strictEqual(b.value(), "> [!warning] Warning\n> only line");
	});

	it("stops at the blank line, leaving the next paragraph alone", () => {
		const b = buffer("one|\n\ntwo");
		insert(b);

		assert.strictEqual(b.value(), "> [!warning] Warning\n> one\n\ntwo");
	});

	it("builds an empty callout on a blank line, cursor ready to type", () => {
		const b = buffer("before\n\n|\n\nafter");
		insert(b);

		assert.strictEqual(
			b.valueWithCursor(),
			"before\n\n> [!warning] Warning|\n>\n\nafter",
		);
	});

	it("treats a whitespace-only line as blank", () => {
		const b = buffer("   |   ");
		insert(b);

		assert.strictEqual(b.value(), "> [!warning] Warning\n>");
	});

	it("carries several paragraphs into one callout, blank lines and all", () => {
		const b = buffer("«one\n\ntwo\n\nthree»");
		insert(b);

		assert.strictEqual(
			b.value(),
			"> [!warning] Warning\n> one\n>\n> two\n>\n> three",
		);
	});

	it("keeps list markers and their indentation", () => {
		const b = buffer("«- one\n  - nested\n1. numbered»");
		insert(b);

		assert.strictEqual(
			b.value(),
			"> [!warning] Warning\n> - one\n>   - nested\n> 1. numbered",
		);
	});

	it("nests inside an existing blockquote rather than doubling its marker", () => {
		// The quoted text keeps its quote and the callout goes *inside* it —
		// the cursor was in the quote, so that is what was asked to be wrapped.
		// Contrast the existing-callout case below, which encloses from outside.
		const b = buffer("> quo|ted");
		insert(b);

		assert.strictEqual(b.value(), "> > [!warning] Warning\n> > quoted");
	});

	it("leaves a fenced code block whole, and its contents untouched", () => {
		// The fence contains markdown-looking characters on purpose.
		const b = buffer("```js\n// > [!note] not a callout\nconst a = 1;\n```|");
		insert(b);

		assert.strictEqual(
			b.value(),
			"> [!warning] Warning\n> ```js\n> // > [!note] not a callout\n> const a = 1;\n> ```",
		);
	});

	it("encloses an existing callout instead of corrupting its header", () => {
		const b = buffer("> [!note] Note\n> in|ner");
		insert(b);

		assert.strictEqual(
			b.value(),
			"> [!warning] Warning\n> > [!note] Note\n> > inner",
		);
	});

	it("writes the fold mark the definition asks for", () => {
		const b = buffer("text|");
		insert(b, { foldable: true, defaultFolded: true });

		assert.strictEqual(b.value(), "> [!warning]- Warning\n> text");
	});

	it("uses the alias-free primary id, whatever the search matched", () => {
		// Unlike the `[!` popover, nothing was typed into the document here, so
		// there is no matched alias to honour — the row's own id is the answer.
		const b = buffer("text|");
		insert(b, { id: "warning", aliases: ["caution"] });

		assert.match(b.value(), /^> \[!warning\]/);
	});

	it("lands as ONE edit, so a single Undo puts everything back", () => {
		for (const source of ["|", "para|graph", "«a\n\nb»", "- li|st"]) {
			const b = buffer(source);
			insert(b);
			assert.strictEqual(b.edits, 1, `${JSON.stringify(source)} took ${b.edits}`);
		}
	});
});

describe("the window writes no markdown of its own", () => {
	// The executable half of "one source of truth". The transformation lives in
	// CalloutBlockTools and is shared with the `Wrap in callout` command and
	// every user-built wrap command; a window that started assembling `[!…]`
	// headers itself would be a second implementation nobody would notice had
	// drifted until the two disagreed.
	const modal = readRepoFile("src/settings/QuickInsertModal.ts");

	it("delegates to the shared block transform", () => {
		assert.match(modal, /wrapSelectionInCallout\(\s*target\.editor,\s*\{ def \}/);
	});

	it("contains no callout syntax at all", () => {
		const code = modal.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
		assert.ok(!code.includes("[!"), "the window is building a header by hand");
	});

	it("reads committed state, not the raw map", () => {
		// `getAll()` carries the callout editor's live-preview stand-in, and this
		// window re-renders the moment that editor closes — the one moment a
		// half-typed draft would be on screen. Same two steps the public API
		// takes, for the same reason.
		assert.match(modal, /registry\.getBuiltIn\(\)/);
		assert.match(modal, /registry\.getUserDefined\(\)/);
		assert.match(modal, /registry\.getReal\(def\.id\)/);
		const code = modal.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
		assert.ok(!code.includes("getAll("), "reading the raw map");
	});

	it("never reaches for workspace.activeEditor", () => {
		// It can be an embedded editor inside one of this plugin's own modals,
		// so a window that trusted it could type into a live preview.
		for (const file of [
			"src/settings/QuickInsertModal.ts",
			"src/editor/targetMarkdownEditor.ts",
		]) {
			const code = readRepoFile(file).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
			assert.ok(!code.includes("activeEditor"), file);
		}
	});
});

/* -------------------------------------------------------------------------- */
/* Which editor it writes into                                                */
/* -------------------------------------------------------------------------- */

interface FakeLeaf {
	view: unknown;
}

/** A `MarkdownView` complete enough for the checks the resolver makes. */
function view(options: {
	mode?: "source" | "preview";
	file?: unknown;
	leaf?: FakeLeaf | null;
}): MarkdownView {
	const v = new MarkdownView(
		undefined as unknown as WorkspaceLeaf,
	) as unknown as Record<string, unknown>;
	v.editor = { marker: "the editor" };
	v.file = "file" in options ? options.file : { path: "note.md" };
	v.getMode = () => options.mode ?? "source";
	const leaf = options.leaf === undefined ? ({ view: v } as FakeLeaf) : options.leaf;
	v.leaf = leaf;
	return v as unknown as MarkdownView;
}

/** An `App` whose workspace answers only what the resolver asks it. */
function app(options: {
	active?: MarkdownView | null;
	markdownLeaves?: unknown[];
}): App {
	return {
		workspace: {
			getActiveViewOfType: () => options.active ?? null,
			getLeavesOfType: () => options.markdownLeaves ?? [],
		},
	} as unknown as App;
}

describe("resolveTargetEditor", () => {
	it("answers with the active markdown view's editor", () => {
		const v = view({});
		const target = resolveTargetEditor(app({ active: v }));

		assert.strictEqual(target?.view, v);
		assert.deepStrictEqual(target?.editor, { marker: "the editor" });
	});

	it("answers null when nothing markdown is in front", () => {
		// A canvas, the graph, the settings tab, or no leaf at all — one answer
		// covers them, because `getActiveViewOfType` returns null for each.
		assert.strictEqual(resolveTargetEditor(app({ active: null })), null);
	});

	it("refuses a note that is being read rather than edited", () => {
		// Refused, not silently flipped to source: changing what the user is
		// looking at is not this feature's call to make.
		assert.strictEqual(
			resolveTargetEditor(app({ active: view({ mode: "preview" }) })),
			null,
		);
	});
});

describe("isTargetStillValid", () => {
	const capture = (v: MarkdownView): TargetEditor => ({
		view: v,
		editor: { marker: "the editor" } as unknown as Editor,
	});

	it("holds while the leaf is still open and still showing that view", () => {
		const v = view({});
		const leaf = (v as unknown as { leaf: FakeLeaf }).leaf;

		assert.ok(isTargetStillValid(app({ markdownLeaves: [leaf] }), capture(v)));
	});

	it("fails once the leaf has been re-used for another view", () => {
		// Obsidian re-uses a leaf rather than destroying it, so the stale view
		// still holds a perfectly usable — and completely wrong — editor.
		const v = view({});
		const leaf = (v as unknown as { leaf: FakeLeaf }).leaf;
		leaf.view = { somethingElse: true };

		assert.ok(!isTargetStillValid(app({ markdownLeaves: [leaf] }), capture(v)));
	});

	it("fails once the leaf is no longer among the open markdown leaves", () => {
		const v = view({});

		assert.ok(!isTargetStillValid(app({ markdownLeaves: [] }), capture(v)));
	});

	it("fails when the note has been flipped into Reading view", () => {
		const v = view({ mode: "preview" });
		const leaf = (v as unknown as { leaf: FakeLeaf }).leaf;

		assert.ok(!isTargetStillValid(app({ markdownLeaves: [leaf] }), capture(v)));
	});

	it("fails when the view has no file left", () => {
		const v = view({ file: null });
		const leaf = (v as unknown as { leaf: FakeLeaf }).leaf;

		assert.ok(!isTargetStillValid(app({ markdownLeaves: [leaf] }), capture(v)));
	});

	it("fails when the view has been detached from its leaf", () => {
		const v = view({ leaf: null });

		assert.ok(!isTargetStillValid(app({ markdownLeaves: [] }), capture(v)));
	});
});

describe("currentTargetEditor", () => {
	it("prefers the note the window was opened from", () => {
		// With two panes open, "the one you opened this from" is the only
		// answer that is not a guess.
		const opened = view({});
		const other = view({});
		const openedLeaf = (opened as unknown as { leaf: FakeLeaf }).leaf;
		const otherLeaf = (other as unknown as { leaf: FakeLeaf }).leaf;
		const captured: TargetEditor = {
			view: opened,
			editor: { marker: "the editor" } as unknown as Editor,
		};

		const resolved = currentTargetEditor(
			app({ active: other, markdownLeaves: [openedLeaf, otherLeaf] }),
			captured,
		);

		assert.strictEqual(resolved?.view, opened);
	});

	it("falls back to whatever is active once the capture goes stale", () => {
		const closed = view({});
		const nowActive = view({});
		const activeLeaf = (nowActive as unknown as { leaf: FakeLeaf }).leaf;
		const captured: TargetEditor = {
			view: closed,
			editor: { marker: "gone" } as unknown as Editor,
		};

		const resolved = currentTargetEditor(
			app({ active: nowActive, markdownLeaves: [activeLeaf] }),
			captured,
		);

		assert.strictEqual(resolved?.view, nowActive);
	});

	it("resolves from scratch when nothing was captured", () => {
		const v = view({});
		assert.strictEqual(currentTargetEditor(app({ active: v }), null)?.view, v);
	});

	it("answers null when the capture is stale and nothing else is open", () => {
		// What makes the Insert button raise a notice instead of writing into
		// some arbitrary editor that merely happens to exist.
		const closed = view({});
		const captured: TargetEditor = {
			view: closed,
			editor: { marker: "gone" } as unknown as Editor,
		};

		assert.strictEqual(currentTargetEditor(app({}), captured), null);
	});
});

/* -------------------------------------------------------------------------- */
/* The row is a real callout                                                  */
/* -------------------------------------------------------------------------- */

describe("the preview is the callout, not a drawing of one", () => {
	const preview = readRepoFile("src/settings/quickInsertPreview.ts");
	const row = readRepoFile("src/settings/quickInsertRow.ts");

	it("shows exactly the line Insert would write", () => {
		// The anti-drift property, executable. Both sides come from
		// `buildBlockHeaderToken`, so a change to the fold mark, the title policy
		// or the id form moves the preview and the insertion together or not at
		// all. `> [!x]- X` — mark and title included.
		for (const candidate of [
			def({ id: "warning", displayName: "Warning" }),
			def({ id: "warning", displayName: "Warning", foldable: true }),
			def({
				id: "warning",
				displayName: "Warning",
				foldable: true,
				defaultFolded: true,
			}),
			def({ id: "multi word", displayName: "Multi word" }),
		]) {
			const b = buffer("|");
			wrapSelectionInCallout(asEditor(b), { def: candidate });
			const written = b.value().split("\n")[0];
			assert.strictEqual(previewMarkdown(candidate), written);
		}
	});

	it("folds a newline out so rows cannot shift onto the wrong callout", () => {
		// The batch render maps blocks back to definitions by position, and an
		// imported display name really can carry a newline.
		const md = previewMarkdown(def({ id: "x", displayName: "two\nlines" }));
		assert.ok(!md.includes("\n"), md);
	});

	it("hands the markdown to Obsidian rather than building callout DOM", () => {
		assert.match(preview, /MarkdownRenderer\.render\(/);
		// The ancestry themes and core CSS are written against.
		assert.match(preview, /markdown-preview-view/);
		assert.match(preview, /markdown-rendered/);
		const code = preview.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
		for (const forged of ["callout-title", "callout-icon", "callout-content"]) {
			assert.ok(!code.includes(forged), `hand-building ${forged}`);
		}
	});

	it("never builds a header by hand either", () => {
		const code = preview.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
		assert.ok(code.includes("buildBlockHeaderToken"), "not using the writer");
		assert.ok(!/\[!\w/.test(code), "assembling a token itself");
	});

	it("paints no appearance of its own in either module", () => {
		// A colour, border or radius written here would be the second appearance
		// that drifts from the note's.
		for (const [name, text] of [
			["quickInsertPreview.ts", preview],
			["quickInsertRow.ts", row],
		] as const) {
			const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
			for (const bad of ["colorLight", "colorDark", "--callout-", "style."]) {
				assert.ok(!code.includes(bad), `${name} sets ${bad}`);
			}
		}
	});
});

describe("the row keeps its controls outside the callout", () => {
	function renderRow(hasPreview: boolean) {
		const list = asEl(el());
		const rendered = asEl(el({ cls: "cs-qi-preview" }));
		const inserted: string[] = [];
		const edited: string[] = [];
		const rowEl = renderQuickInsertRow(
			list,
			def({ id: "warning", displayName: "Warning", aliases: ["caution"] }),
			{
				canInsert: true,
				preview: () => (hasPreview ? rendered : null),
				onInsert: (d) => void inserted.push(d.id),
				onEdit: (d) => void edited.push(d.id),
				onHover: () => {},
			},
		);
		return { rowEl, rendered, inserted, edited };
	}

	it("puts the buttons beside the preview, never inside it", () => {
		const { rowEl, rendered } = renderRow(true);
		const buttons = rowEl.querySelectorAll("button");
		assert.strictEqual(buttons.length, 2);
		for (const button of Array.from(buttons)) {
			assert.ok(
				!rendered.contains(button),
				"a control rendered inside the callout reads as its content",
			);
		}
		// And the preview really is in the row, in its own slot.
		const slot = rowEl.querySelector(".cs-qi-slot");
		assert.ok(slot?.contains(rendered));
	});

	it("falls back to the name until the render lands", () => {
		const { rowEl } = renderRow(false);
		assert.ok(rowEl.querySelector(".cs-qi-pending"));
		assert.strictEqual(rowEl.querySelectorAll("button").length, 2);
	});

	it("never draws a native tooltip", () => {
		// The row used to carry its `[!id]` list as a `title`. That attribute is
		// inherited for hover, so it fired over the buttons too — a raw token in
		// the OS's tooltip style, beside the button's own label in Obsidian's.
		// The two aria-labels are the only hover text the row has now.
		const { rowEl } = renderRow(true);
		assert.strictEqual(rowEl.getAttribute("title"), null);
		assert.deepStrictEqual(Array.from(rowEl.querySelectorAll("[title]")), []);
		const labels = Array.from(rowEl.querySelectorAll("button")).map((b) =>
			b.getAttribute("aria-label"),
		);
		assert.strictEqual(labels.length, 2);
		for (const label of labels) {
			assert.ok(label?.includes("Warning"), `unlabelled: ${label}`);
		}
	});

	it("inserts on a click anywhere but a button", () => {
		const { rowEl, inserted, edited } = renderRow(true);
		rowEl.dispatchEvent(clickOn(rowEl.querySelector(".cs-qi-slot")));
		assert.deepEqual(inserted, ["warning"]);
		// A click that landed on Edit is Edit's, not the row's.
		const editBtn = rowEl.querySelectorAll("button")[0];
		rowEl.dispatchEvent(clickOn(editBtn ?? null));
		assert.deepEqual(inserted, ["warning"], "row stole the Edit click");
		assert.deepEqual(edited, []);
	});
});
