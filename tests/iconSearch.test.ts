/**
 * tests/iconSearch.test.ts — `filterIcons`, the one matcher every source shares.
 *
 * The property worth pinning is not "it finds things" but *what counts as one
 * word*. Eight libraries spell the same idea three ways — `arrow_right`,
 * `arrow-right`, `arrowright` — and a picker that made the user learn which is
 * which would be a picker nobody could search. So a name is matched twice:
 * verbatim, and with its separators turned into spaces. Everything else here
 * follows from two more decisions: words are ANDed (typing narrows, never
 * scatters), and a query that filters nothing returns the index's own array
 * *by identity*, so opening a source costs one comparison rather than a copy of
 * five thousand entries.
 *
 * NOTE ON SCOPE. This filter does not rank and does not float an exact match to
 * the front — it is `Array.prototype.filter`, so results come back in the
 * index's own (alphabetical) order and `home` lands wherever the alphabet puts
 * it among `home-storage`, `smart-home` and the rest. That is tested below as
 * the behaviour it is, not asserted away; see the note in the session summary.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { filterIcons } from "../src/icons/search";
import type { IconEntry, IconIndex } from "../src/icons/types";
import { decodeIndex } from "../src/icons/data/codec";
import { OCTICONS_INDEX } from "../src/icons/data/octicons.index";

function entry(over: Partial<IconEntry> & { name: string }): IconEntry {
	return { categories: [], keywords: [], ...over };
}

const INDEX: IconIndex = {
	entries: [
		entry({ name: "arrow_right", categories: ["nav"], keywords: ["forward"] }),
		entry({ name: "arrow-left", categories: ["nav"], keywords: ["back"] }),
		entry({ name: "home", categories: ["places"], keywords: ["house", "roof"] }),
		entry({ name: "home_work", categories: ["places"], keywords: ["office"] }),
		entry({ name: "SmileFace", label: "Smile face", categories: [], keywords: [] }),
	],
	categories: ["nav", "places"],
};

const names = (result: readonly IconEntry[]): string[] =>
	result.map((e) => e.name);

describe("filterIcons — the no-op query", () => {
	it("hands back the index's own array, not a copy", () => {
		// Identity, deliberately: opening a source with 5,130 icons must not
		// allocate a second array of them before a single character is typed.
		assert.strictEqual(filterIcons(INDEX, ""), INDEX.entries);
	});

	it("treats a whitespace-only query as no query at all", () => {
		assert.strictEqual(filterIcons(INDEX, "   "), INDEX.entries);
		assert.strictEqual(filterIcons(INDEX, "\t\n "), INDEX.entries);
	});

	it("stops taking the shortcut as soon as a category is named", () => {
		const result = filterIcons(INDEX, "", "nav");
		assert.notStrictEqual(result, INDEX.entries);
		assert.deepStrictEqual(names(result), ["arrow_right", "arrow-left"]);
	});
});

describe("filterIcons — one word", () => {
	it("matches the name verbatim", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "arrow")), [
			"arrow_right",
			"arrow-left",
		]);
	});

	it("matches anywhere in the name, not only at the front", () => {
		// A substring match, so "right" finds `arrow_right`. Prefix search is
		// the special case of this, not a separate rule.
		assert.deepStrictEqual(names(filterIcons(INDEX, "right")), ["arrow_right"]);
	});

	it("ignores case on both sides", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "SMILE")), ["SmileFace"]);
		assert.deepStrictEqual(names(filterIcons(INDEX, "smileface")), ["SmileFace"]);
	});

	it("searches the label", () => {
		// "Smile face" is spelled with a space only in the label; the name has
		// none, so this can only come from the label field.
		assert.deepStrictEqual(names(filterIcons(INDEX, "face")), ["SmileFace"]);
	});

	it("searches the keywords", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "house")), ["home"]);
		assert.deepStrictEqual(names(filterIcons(INDEX, "office")), ["home_work"]);
	});

	it("finds nothing for a word no field carries", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "zzzz")), []);
	});
});

describe("filterIcons — separators are spaces", () => {
	it("matches an underscore name typed with a space", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "arrow right")), [
			"arrow_right",
		]);
	});

	it("matches a hyphen name typed with a space", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "arrow left")), [
			"arrow-left",
		]);
	});

	it("still matches the separator spelled out", () => {
		// Both spellings are in the haystack, so neither library's own idiom is
		// the one you have to know.
		assert.deepStrictEqual(names(filterIcons(INDEX, "arrow_right")), [
			"arrow_right",
		]);
		assert.deepStrictEqual(names(filterIcons(INDEX, "arrow-left")), [
			"arrow-left",
		]);
	});
});

describe("filterIcons — several words are ANDed", () => {
	it("narrows as more words are typed", () => {
		assert.equal(filterIcons(INDEX, "home").length, 2);
		assert.deepStrictEqual(names(filterIcons(INDEX, "home work")), ["home_work"]);
	});

	it("lets the words come from different fields", () => {
		// "home" is in the name, "roof" only in the keywords. Each word has to
		// match *some* field, not all of them the same one.
		assert.deepStrictEqual(names(filterIcons(INDEX, "home roof")), ["home"]);
	});

	it("takes the words in any order", () => {
		assert.deepStrictEqual(
			names(filterIcons(INDEX, "roof home")),
			names(filterIcons(INDEX, "home roof")),
		);
	});

	it("drops the entry as soon as one word misses", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "home zzzz")), []);
	});

	it("collapses runs of whitespace rather than searching for an empty word", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "  home   work  ")), [
			"home_work",
		]);
	});
});

describe("filterIcons — the category filter", () => {
	it("keeps only entries carrying that category", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "", "places")), [
			"home",
			"home_work",
		]);
	});

	it("ANDs with the query", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "home", "places")), [
			"home",
			"home_work",
		]);
		assert.deepStrictEqual(names(filterIcons(INDEX, "home", "nav")), []);
	});

	it("is exact — a category is a member test, not a substring one", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "", "plac")), []);
	});

	it("finds nothing for a category no entry declares", () => {
		assert.deepStrictEqual(names(filterIcons(INDEX, "", "nope")), []);
	});
});

describe("filterIcons — order and ranking", () => {
	it("returns matches in the index's own order, unranked", () => {
		// Pinned as behaviour, not endorsed as design: there is no scoring pass,
		// so an exact hit sits wherever the alphabet left it. `home` comes
		// before `home_work` here only because the index does.
		assert.deepStrictEqual(names(filterIcons(INDEX, "home")), [
			"home",
			"home_work",
		]);
	});

	it("does not float an exact name match to the front", () => {
		const shuffled: IconIndex = {
			entries: [entry({ name: "home_work" }), entry({ name: "home" })],
			categories: [],
		};
		assert.deepStrictEqual(names(filterIcons(shuffled, "home")), [
			"home_work",
			"home",
		]);
	});
});

describe("filterIcons — against a real bundled index", () => {
	const octicons = decodeIndex(OCTICONS_INDEX);

	it("narrows a real library down as words are added", () => {
		const one = filterIcons(octicons, "arrow");
		const two = filterIcons(octicons, "arrow up");
		assert.ok(one.length > two.length, "the second word must narrow");
		assert.ok(two.length > 0, "arrow up must find something");
		for (const e of two) assert.ok(one.includes(e), "AND must be a subset");
	});

	it("finds a hyphenated Octicons name typed with a space", () => {
		assert.ok(
			names(filterIcons(octicons, "arrow up")).includes("arrow-up"),
			"arrow-up must answer to `arrow up`",
		);
	});

	it("never invents an entry the index does not hold", () => {
		for (const e of filterIcons(octicons, "git")) {
			assert.ok(octicons.entries.includes(e));
		}
	});
});
