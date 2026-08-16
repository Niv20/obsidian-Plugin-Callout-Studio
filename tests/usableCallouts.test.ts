/**
 * tests/usableCallouts.test.ts — the one predicate three surfaces share.
 *
 * Discovery files a row for every `[!id]` it has ever seen, so the raw registry
 * list is full of ids the user deleted from their notes hours ago. The
 * autocomplete dropdown, the public API and the command builder all have to
 * drop those — and drop them *identically*, or the three disagree about what
 * exists and the user watches a callout they can insert fail to appear in the
 * API, or vice versa.
 *
 * The rule has exactly two escape hatches and both matter:
 *
 * - **Customizing a discovered row adopts it.** Once the user has given it a
 *   colour or an icon, it is theirs whether or not it is written anywhere.
 * - **Usage is asked of the caller, not computed here.** Only the plugin knows
 *   what Discovery's last prune scan concluded, and the predicate must report
 *   only rows a *completed* scan confirmed unused. A row that is genuinely in
 *   use but was never adopted through the editor has to stay offerable — which
 *   is why the callback is named `isKnownZeroUsageFallback` and not `isUnused`.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { filterUsableCallouts } from "../src/utils/usableCallouts";
import type { CalloutDefinition } from "../src/types";

function def(over: Partial<CalloutDefinition> = {}): CalloutDefinition {
	return {
		id: "x",
		displayName: "X",
		icon: { type: "lucide", value: "star" },
		colorLight: "#ff0000",
		colorDark: "#ff0000",
		foldable: true,
		defaultFolded: false,
		builtIn: false,
		source: "user",
		...over,
	};
}

const none = (): boolean => false;
const all = (): boolean => true;
const ids = (defs: CalloutDefinition[]): string[] => defs.map((d) => d.id);

describe("filterUsableCallouts — rows that are never dropped", () => {
	for (const source of ["builtin", "user", "theme", "plugin"] as const) {
		it(`keeps a ${source} row even when the scan says it is unused`, () => {
			// The zero-usage rule is about DISCOVERED rows only. A built-in the
			// user has never written is still a callout they may pick today.
			const defs = [def({ id: source, source })];
			assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), [source]);
		});
	}
});

describe("filterUsableCallouts — discovered rows", () => {
	it("keeps one that is still written somewhere in the vault", () => {
		const defs = [def({ id: "seen", source: "fallback" })];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, none)), ["seen"]);
	});

	it("drops one the scan confirmed is written nowhere", () => {
		const defs = [def({ id: "gone", source: "fallback" })];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), []);
	});

	it("keeps one the user adopted, even with zero usage", () => {
		// Customizing it is the adoption: the user gave it a look on purpose,
		// and taking it away because the note that prompted it was edited would
		// throw that work out.
		const defs = [def({ id: "mine", source: "fallback", customized: true })];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), ["mine"]);
	});

	it("treats `customized: false` as not adopted", () => {
		const defs = [def({ id: "row", source: "fallback", customized: false })];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), []);
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, none)), ["row"]);
	});

	it("treats an absent `customized` as not adopted", () => {
		const defs = [def({ id: "row", source: "fallback" })];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), []);
	});

	it("requires `customized` to be exactly true, not merely truthy", () => {
		const defs = [
			def({ id: "row", source: "fallback", customized: 1 as unknown as boolean }),
		];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), []);
	});

	it("asks about each row by its own id", () => {
		const asked: string[] = [];
		const defs = [
			def({ id: "a", source: "fallback" }),
			def({ id: "b", source: "fallback" }),
		];
		filterUsableCallouts(defs, (id) => {
			asked.push(id);
			return id === "b";
		});
		assert.deepStrictEqual(asked, ["a", "b"]);
	});

	it("never asks about a row the source check already settled", () => {
		// Short-circuit order matters: the usage lookup is a map read the
		// plugin only populates after a scan, and asking about a built-in
		// would be a question with no meaningful answer.
		const asked: string[] = [];
		filterUsableCallouts(
			[def({ id: "note", source: "builtin" }), def({ id: "mine", source: "fallback", customized: true })],
			(id) => {
				asked.push(id);
				return true;
			},
		);
		assert.deepStrictEqual(asked, []);
	});
});

describe("filterUsableCallouts — the list itself", () => {
	it("keeps the incoming order", () => {
		const defs = [
			def({ id: "z", source: "user" }),
			def({ id: "gone", source: "fallback" }),
			def({ id: "a", source: "user" }),
		];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), ["z", "a"]);
	});

	it("returns a new array and leaves the caller's alone", () => {
		const defs = [def({ id: "gone", source: "fallback" })];
		const out = filterUsableCallouts(defs, all);
		assert.notEqual(out, defs);
		assert.equal(defs.length, 1);
	});

	it("hands back the same definition objects, not copies", () => {
		// The API's freezing mappers run downstream of this; the filter itself
		// must not clone, or identity comparisons above it stop working.
		const one = def({ id: "one", source: "user" });
		assert.equal(filterUsableCallouts([one], all)[0], one);
	});

	it("handles the empty list", () => {
		assert.deepStrictEqual(filterUsableCallouts([], all), []);
	});

	it("drops every discovered row when the whole vault scan came back empty", () => {
		const defs = [
			def({ id: "a", source: "fallback" }),
			def({ id: "b", source: "fallback" }),
			def({ id: "kept", source: "fallback", customized: true }),
			def({ id: "note", source: "builtin" }),
		];
		assert.deepStrictEqual(ids(filterUsableCallouts(defs, all)), ["kept", "note"]);
	});
});
