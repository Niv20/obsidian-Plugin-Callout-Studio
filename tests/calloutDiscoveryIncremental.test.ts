/**
 * tests/calloutDiscoveryIncremental.test.ts — the per-file scan and the
 * half-typed-id filter.
 *
 * Two debounces meet here, and they are sized for opposite reasons:
 *
 * - **The file scan waits 300 ms.** It is cheap — one cached read and one
 *   tokenizer pass — so it only has to outlast a keystroke burst.
 * - **The prune waits 1500 ms on desktop and 10 s on mobile.** It reads EVERY
 *   markdown file in the vault through `cachedRead` and tokenizes it, on the
 *   main thread. A short debounce puts that whole pass right where the user
 *   stops typing and looks at the screen, which on a phone reads as the editor
 *   freezing. Nothing about it is urgent: the only visible cost of waiting is
 *   an orphaned row lingering in the settings list a few seconds longer.
 *
 * On top of them sits the typing filter. `scanFileNow` reads the file from
 * cache, but `getActiveTypingCalloutIds` reads the *live CodeMirror buffer* line
 * under the cursor — and every callout token on it is treated as still being
 * typed. Auto-creating those would feed a half-finished name straight back into
 * the autocomplete dropdown the user is typing into. Committing is modelled as
 * the cursor leaving the line.
 *
 * The virtual clock is documented in tests/support/discoveryHarness.ts; note
 * that `advance()` only fires the timer callback, so every assertion about what
 * the resulting async scan *did* comes after an `await settle()`.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import {
	discovered,
	discoveryHarness,
	settle,
} from "./support/discoveryHarness";

/** `CalloutDiscovery.scheduleFileScan`'s debounce, which is a private literal. */
const FILE_SCAN_MS = 300;
/** `CalloutDiscovery.PRUNE_DELAY_MS` on desktop (`Platform.isMobile` is false). */
const PRUNE_MS = 1500;

/* ========================================================================== */
/* 93. getActiveTypingCalloutIds                                              */
/* ========================================================================== */

describe("getActiveTypingCalloutIds — when it has no answer", () => {
	it("is null when no editor is active at all", () => {
		const h = discoveryHarness({ "note.md": "> [!half]" });
		h.editor.none();
		assert.strictEqual(
			h.internals.getActiveTypingCalloutIds(h.vault.file("note.md")),
			null,
		);
	});

	it("is null when the active editor is on a different file", () => {
		// The cursor is in another note; nothing about this file is in progress.
		const h = discoveryHarness({ "note.md": "> [!half]", "other.md": "" });
		h.editor.typing("other.md", "> [!half]");
		assert.strictEqual(
			h.internals.getActiveTypingCalloutIds(h.vault.file("note.md")),
			null,
		);
	});

	it("is null when the cursor's line carries no callout token", () => {
		const h = discoveryHarness({ "note.md": "> [!half]" });
		h.editor.typing("note.md", "just some prose");
		assert.strictEqual(
			h.internals.getActiveTypingCalloutIds(h.vault.file("note.md")),
			null,
		);
	});

	it("is null for an empty line", () => {
		const h = discoveryHarness({ "note.md": "> [!half]" });
		h.editor.idle("note.md");
		assert.strictEqual(
			h.internals.getActiveTypingCalloutIds(h.vault.file("note.md")),
			null,
		);
	});
});

describe("getActiveTypingCalloutIds — what it reports", () => {
	const idsOn = (line: string): string[] => {
		const h = discoveryHarness({ "note.md": "" });
		h.editor.typing("note.md", line);
		const found = h.internals.getActiveTypingCalloutIds(
			h.vault.file("note.md"),
		);
		return found ? [...found].sort() : [];
	};

	it("reports a block callout header's id", () => {
		assert.deepStrictEqual(idsOn("> [!half] Title"), ["half"]);
	});

	it("reports a heading callout's id", () => {
		assert.deepStrictEqual(idsOn("### [!half] Title"), ["half"]);
	});

	it("reports every inline pill on the line", () => {
		assert.deepStrictEqual(idsOn("a [!alpha] and [!beta] pill"), [
			"alpha",
			"beta",
		]);
	});

	it("normalizes exactly as the vault scanner does", () => {
		// Same normalization on both sides is what lets `scanFileNow` filter one
		// list with the other — a multi-word id has to match identically.
		assert.deepStrictEqual(idsOn("> [!  My   ID  ] Title"), ["my id"]);
	});

	it("sees through |metadata", () => {
		// Obsidian splits the header at the first pipe, so `[!half|purple]` is
		// the `half` callout carrying metadata — and it is `half` the user is
		// still typing.
		assert.deepStrictEqual(idsOn("> [!half|purple] Title"), ["half"]);
	});

	it("ignores a token inside inline code", () => {
		assert.deepStrictEqual(idsOn("prose `[!half]` prose"), []);
	});
});

describe("the typing filter, through scanFileNow", () => {
	it("does not create a row for the id under the cursor", async () => {
		const h = discoveryHarness({
			"note.md": "> [!half]\n\n> [!settled] committed",
		});
		h.editor.typing("note.md", "> [!half]");
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.registry.get("half"), undefined);
		// Everything the user already committed elsewhere in the file still
		// lands — the filter is per-line, not per-file.
		assert.ok(h.registry.get("settled"));
	});

	it("creates it once the cursor leaves the line", async () => {
		const h = discoveryHarness({ "note.md": "> [!half]" });
		h.editor.typing("note.md", "> [!half]");
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.registry.get("half"), undefined);

		h.editor.typing("note.md", "a new paragraph");
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.ok(h.registry.get("half"));
	});

	it("creates it when the user switches to another file", async () => {
		const h = discoveryHarness({ "note.md": "> [!half]", "other.md": "" });
		h.editor.typing("other.md", "");
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.ok(h.registry.get("half"));
	});

	it("still schedules a prune when the filter emptied the list", async () => {
		// Everything unknown was in progress, so nothing was added — but an
		// earlier edit may still have orphaned a row, so the prune has to run.
		const h = discoveryHarness({ "note.md": "> [!half]" });
		h.editor.typing("note.md", "> [!half]");
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.clock.pending(), 1);
	});
});

/* ========================================================================== */
/* 94. scheduleFileScan (debounce) + scanFileNow                              */
/* ========================================================================== */

describe("scheduleFileScan — the debounce", () => {
	it("has not read anything before the delay elapses", async () => {
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		h.internals.scheduleFileScan(h.vault.file("note.md"));
		h.clock.advance(FILE_SCAN_MS - 1);
		await settle();
		assert.strictEqual(h.vault.reads(), 0);
		assert.strictEqual(h.registry.get("alpha"), undefined);
	});

	it("scans once the delay elapses", async () => {
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		h.internals.scheduleFileScan(h.vault.file("note.md"));
		h.clock.advance(FILE_SCAN_MS);
		await settle();
		assert.strictEqual(h.vault.reads(), 1);
		assert.ok(h.registry.get("alpha"));
	});

	it("collapses a burst of edits into a single scan", async () => {
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		const file = h.vault.file("note.md");
		for (let i = 0; i < 3; i++) {
			h.internals.scheduleFileScan(file);
			h.clock.advance(FILE_SCAN_MS - 100);
		}
		await settle();
		assert.strictEqual(h.vault.reads(), 0, "nothing fired mid-burst");

		h.clock.advance(FILE_SCAN_MS);
		await settle();
		assert.strictEqual(h.vault.reads(), 1);
	});

	it("debounces each file on its own timer", async () => {
		const h = discoveryHarness({
			"a.md": "> [!alpha] x",
			"b.md": "> [!beta] y",
		});
		h.internals.scheduleFileScan(h.vault.file("a.md"));
		h.clock.advance(200);
		h.internals.scheduleFileScan(h.vault.file("b.md"));
		h.clock.advance(100);
		await settle();
		assert.ok(h.registry.get("alpha"), "a.md fired at its own 300ms");
		assert.strictEqual(h.registry.get("beta"), undefined);

		h.clock.advance(200);
		await settle();
		assert.ok(h.registry.get("beta"));
	});

	it("forgets a fired timer, so the next edit schedules cleanly", async () => {
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		const file = h.vault.file("note.md");
		h.internals.scheduleFileScan(file);
		h.clock.advance(FILE_SCAN_MS);
		await settle();

		h.vault.write("note.md", "> [!alpha] x\n\n> [!beta] y");
		h.internals.scheduleFileScan(file);
		h.clock.advance(FILE_SCAN_MS);
		await settle();
		assert.ok(h.registry.get("beta"));
	});

	it("is cancelled wholesale by destroy()", async () => {
		// Every timer the manager owns is its own to clean up — main.ts calls
		// destroy() in onunload, and a scan firing after that would touch a
		// registry nobody is listening to any more.
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		h.internals.scheduleFileScan(h.vault.file("note.md"));
		h.discovery.schedulePrune();
		assert.strictEqual(h.clock.pending(), 2);

		h.discovery.destroy();
		assert.strictEqual(h.clock.pending(), 0);

		h.clock.advance(60_000);
		await settle();
		assert.strictEqual(h.vault.reads(), 0);
		assert.strictEqual(h.registry.get("alpha"), undefined);
	});
});

describe("schedulePrune — the other debounce", () => {
	it("waits the full desktop delay", async () => {
		const h = discoveryHarness({ "note.md": "plain" });
		h.registry.add(discovered("orphan"));
		h.discovery.schedulePrune();

		h.clock.advance(PRUNE_MS - 1);
		await settle();
		assert.ok(h.registry.get("orphan"), "not yet");

		h.clock.advance(1);
		await settle();
		assert.strictEqual(h.registry.get("orphan"), undefined);
	});

	it("collapses repeated requests into one pass", () => {
		const h = discoveryHarness({ "note.md": "plain" });
		h.discovery.schedulePrune();
		h.discovery.schedulePrune();
		h.discovery.schedulePrune();
		assert.strictEqual(h.clock.pending(), 1);
	});

	it("honours an explicit delay", async () => {
		const h = discoveryHarness({ "note.md": "plain" });
		h.registry.add(discovered("orphan"));
		h.discovery.schedulePrune(2000);
		h.clock.advance(PRUNE_MS);
		await settle();
		assert.ok(h.registry.get("orphan"));
		h.clock.advance(500);
		await settle();
		assert.strictEqual(h.registry.get("orphan"), undefined);
	});

	it("schedules nothing at all while pruning is suspended", () => {
		const h = discoveryHarness({ "note.md": "plain" });
		h.discovery.pruneSuspended = true;
		h.discovery.schedulePrune();
		assert.strictEqual(h.clock.pending(), 0);
	});
});

describe("scanFileNow", () => {
	it("adds the unknown ids it finds and persists them", async () => {
		const h = discoveryHarness({ "note.md": "> [!alpha] x\n\n[!beta] pill" });
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.ok(h.registry.get("alpha"));
		assert.ok(h.registry.get("beta"));
		assert.strictEqual(h.saves(), 1);
	});

	it("never refreshes the editors itself", async () => {
		// The batch's single onChange already injected — and that ends in
		// refreshAllCalloutEditors — so a second pass would only regenerate
		// identical CSS.
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.refreshes(), 0);
		assert.strictEqual(h.changes(), 1);
	});

	it("schedules a prune whether or not it added anything", async () => {
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.clock.pending(), 1, "after an add");

		h.clock.reset();
		h.vault.write("note.md", "> [!note] only known ids now");
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.clock.pending(), 1, "after finding nothing new");
	});

	it("writes nothing when there was nothing new", async () => {
		const h = discoveryHarness({ "note.md": "> [!note] known" });
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.saves(), 0);
		assert.strictEqual(h.changes(), 0);
	});

	it("ignores a file that has since moved away from its path", async () => {
		// The debounce means the scan runs 300ms after the edit, and the file may
		// have been renamed or deleted in between; the queued handle would then
		// read a path that now belongs to something else.
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		const file = h.vault.file("note.md");
		h.vault.detach("note.md");
		await h.internals.scanFileNow(file);
		assert.strictEqual(h.vault.reads(), 0);
		assert.strictEqual(h.registry.get("alpha"), undefined);
		assert.strictEqual(h.clock.pending(), 0, "no prune either");
	});

	it("swallows a read failure without adding or pruning", async () => {
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		h.vault.breakRead("note.md");
		await h.internals.scanFileNow(h.vault.file("note.md"));
		assert.strictEqual(h.registry.get("alpha"), undefined);
		assert.strictEqual(h.saves(), 0);
		// A failed read is not evidence that anything became unused, so the
		// prune is skipped along with the add.
		assert.strictEqual(h.clock.pending(), 0);
	});

	it("drives the whole loop from a scheduled scan", async () => {
		// The end-to-end shape: an edit introduces an id, the debounced scan
		// creates its row, the edit that removes it again lets the prune take
		// the row back out.
		const h = discoveryHarness({ "note.md": "> [!alpha] x" });
		const file = h.vault.file("note.md");

		h.internals.scheduleFileScan(file);
		h.clock.advance(FILE_SCAN_MS);
		await settle();
		assert.ok(h.registry.get("alpha"));

		h.vault.write("note.md", "the callout is gone now");
		h.internals.scheduleFileScan(file);
		h.clock.advance(FILE_SCAN_MS);
		await settle();
		assert.ok(h.registry.get("alpha"), "still there until the prune runs");

		h.clock.advance(PRUNE_MS);
		await settle();
		assert.strictEqual(h.registry.get("alpha"), undefined);
	});
});
