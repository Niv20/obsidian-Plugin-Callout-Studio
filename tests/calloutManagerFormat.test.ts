/**
 * tests/calloutManagerFormat.test.ts — reading Callout Manager's own data.json.
 *
 * The cascade flattener is the part worth pinning down. `CalloutSettings` is an
 * ordered array of conditional patches that has to collapse into one light
 * result and one dark result, and every rule in it is the kind that breaks
 * silently: last-write-wins is *per property*, an unconditional entry has to
 * beat a theme-conditional one whichever came first in the file, and the
 * "we could not honour this condition" note must fire only when a conditional
 * value actually survived — a note on every theme-conditional entry, including
 * ones that were overridden anyway, is noise that buries the real rows.
 *
 * The colour strings stay raw here on purpose: turning "158, 158, 158" into a
 * hex is `toCalloutManagerEntries`' job, so these tests compare the strings the
 * file held and never depend on the colour maths.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import {
	parseCalloutManagerData,
	type CalloutManagerRaw,
} from "../src/utils/calloutManagerFormat";

/** The parsed entry for one id, or undefined — most assertions want just one. */
function one(
	raw: unknown,
	id: string,
): CalloutManagerRaw | undefined {
	return parseCalloutManagerData(raw)?.find((entry) => entry.id === id);
}

/** A whole data.json around one callout's settings array. */
function dataJson(
	settings: Record<string, unknown>,
	custom: string[] = [],
): unknown {
	return {
		callouts: { custom, settings },
		calloutDetection: { obsidian: true, theme: true, snippet: true },
	};
}

describe("parseCalloutManagerData — containers", () => {
	const settings = { note: [{ changes: { color: "1, 2, 3" } }] };

	it("reads a whole data.json", () => {
		const entries = parseCalloutManagerData(dataJson(settings));
		assert.equal(entries?.length, 1);
		assert.equal(entries?.[0]?.id, "note");
	});

	it("reads a bare callouts object", () => {
		const entries = parseCalloutManagerData({ custom: [], settings });
		assert.equal(entries?.length, 1);
	});

	it("reads a bare settings map", () => {
		const entries = parseCalloutManagerData(settings);
		assert.equal(entries?.length, 1);
	});

	it("rejects an unrelated object", () => {
		assert.equal(parseCalloutManagerData({ hello: 1 }), null);
		assert.equal(parseCalloutManagerData("nope"), null);
		assert.equal(parseCalloutManagerData(null), null);
	});

	it("rejects an Admonition userAdmonitions record", () => {
		// Its values are objects, not arrays — which is exactly the test that
		// keeps one plugin's file from being read as the other's.
		assert.equal(
			parseCalloutManagerData({
				warn: { type: "warn", title: "Warn", color: "200, 50, 50" },
			}),
			null,
		);
	});

	it("treats an empty but well-formed file as nothing to import", () => {
		assert.deepEqual(parseCalloutManagerData(dataJson({}, [])), []);
	});
});

describe("parseCalloutManagerData — the colour-scheme cascade", () => {
	it("applies an unconditional colour to both schemes", () => {
		const entry = one(dataJson({ note: [{ changes: { color: "1, 2, 3" } }] }), "note");
		assert.equal(entry?.colorLight, "1, 2, 3");
		assert.equal(entry?.colorDark, "1, 2, 3");
		assert.deepEqual(entry?.notes, []);
	});

	it("keeps a per-scheme override apart from its base", () => {
		const entry = one(
			dataJson({
				help: [
					{ changes: { color: "20, 120, 200" } },
					{ condition: { colorScheme: "dark" }, changes: { color: "120, 190, 255" } },
				],
			}),
			"help",
		);
		assert.equal(entry?.colorLight, "20, 120, 200");
		assert.equal(entry?.colorDark, "120, 190, 255");
		assert.deepEqual(entry?.notes, []);
	});

	it("leaves the other scheme unset when only one is stated", () => {
		const entry = one(
			dataJson({
				quote: [{ condition: { colorScheme: "dark" }, changes: { color: "9, 9, 9" } }],
			}),
			"quote",
		);
		assert.equal(entry?.colorLight, undefined);
		assert.equal(entry?.colorDark, "9, 9, 9");
	});

	it("wins last per property, not per entry", () => {
		// The second entry states only an icon, so it must not erase the colour
		// the first one set.
		const entry = one(
			dataJson({
				note: [
					{ changes: { color: "1, 2, 3", icon: "lucide-a" } },
					{ changes: { icon: "lucide-b" } },
				],
			}),
			"note",
		);
		assert.equal(entry?.colorLight, "1, 2, 3");
		assert.equal(entry?.icon, "lucide-b");
	});
});

describe("parseCalloutManagerData — conditions we cannot honour", () => {
	it("keeps a theme-only colour and says so", () => {
		const entry = one(
			dataJson({
				watch: [{ condition: { theme: "Minimal" }, changes: { color: "4, 5, 6" } }],
			}),
			"watch",
		);
		assert.equal(entry?.colorLight, "4, 5, 6");
		assert.equal(entry?.colorDark, "4, 5, 6");
		assert.deepEqual(entry?.notes, ["conditional"]);
	});

	it("treats CM's <default> sentinel as theme-conditional too", () => {
		const entry = one(
			dataJson({
				watch: [{ condition: { theme: "<default>" }, changes: { color: "4, 5, 6" } }],
			}),
			"watch",
		);
		assert.equal(entry?.colorLight, "4, 5, 6");
		assert.deepEqual(entry?.notes, ["conditional"]);
	});

	it("stays silent when an unconditional entry overrode the theme one", () => {
		// Nothing was lost, so nothing is reported — whichever order they came in.
		for (const reversed of [false, true]) {
			const rules = [
				{ condition: { theme: "Minimal" }, changes: { color: "4, 5, 6" } },
				{ changes: { color: "1, 2, 3" } },
			];
			const entry = one(
				dataJson({ note: reversed ? [...rules].reverse() : rules }),
				"note",
			);
			assert.equal(entry?.colorLight, "1, 2, 3");
			assert.deepEqual(entry?.notes, []);
		}
	});

	it("resolves and/or by ordinary boolean algebra", () => {
		// dark AND theme: excluded outright in light, a fallback in dark.
		const entry = one(
			dataJson({
				note: [
					{
						condition: { and: [{ colorScheme: "dark" }, { theme: "Minimal" }] },
						changes: { color: "7, 7, 7" },
					},
				],
			}),
			"note",
		);
		assert.equal(entry?.colorLight, undefined);
		assert.equal(entry?.colorDark, "7, 7, 7");
		assert.deepEqual(entry?.notes, ["conditional"]);
	});

	it("resolves an or per scheme, and reports only the scheme that guessed", () => {
		// "light OR Minimal" is a plain fact in light mode — it matches outright.
		// In dark mode it matches only under one theme, so the colour is applied
		// as a fallback there, and the note is what says so. The note is on the
		// callout, so one conditional side is enough to raise it.
		const entry = one(
			dataJson({
				note: [
					{
						condition: { or: [{ colorScheme: "light" }, { theme: "Minimal" }] },
						changes: { color: "7, 7, 7" },
					},
				],
			}),
			"note",
		);
		assert.equal(entry?.colorLight, "7, 7, 7");
		assert.equal(entry?.colorDark, "7, 7, 7");
		assert.deepEqual(entry?.notes, ["conditional"]);
	});

	it("stays silent when an or matches both schemes outright", () => {
		const entry = one(
			dataJson({
				note: [
					{
						condition: { or: [{ colorScheme: "light" }, { colorScheme: "dark" }] },
						changes: { color: "7, 7, 7" },
					},
				],
			}),
			"note",
		);
		assert.equal(entry?.colorLight, "7, 7, 7");
		assert.equal(entry?.colorDark, "7, 7, 7");
		assert.deepEqual(entry?.notes, []);
	});

	it("reports custom CSS and never mines it", () => {
		const entry = one(
			dataJson({
				note: [
					{ changes: { color: "1, 2, 3", customStyles: "--callout-color: 9,9,9;" } },
				],
			}),
			"note",
		);
		assert.equal(entry?.colorLight, "1, 2, 3");
		assert.deepEqual(entry?.notes, ["customStyles"]);
	});
});

describe("parseCalloutManagerData — which callouts survive", () => {
	it("keeps a declared callout that has no settings at all", () => {
		const entry = one(dataJson({}, ["naked"]), "naked");
		assert.equal(entry?.declared, true);
		assert.equal(entry?.colorLight, undefined);
		assert.equal(entry?.icon, undefined);
	});

	it("drops an undeclared callout that states nothing", () => {
		assert.deepEqual(parseCalloutManagerData(dataJson({ button: [{ changes: {} }] })), []);
	});

	it("keeps an undeclared callout the user restyled", () => {
		const entry = one(dataJson({ note: [{ changes: { icon: "lucide-a" } }] }), "note");
		assert.equal(entry?.declared, false);
		assert.equal(entry?.icon, "lucide-a");
	});

	it("lists the user's own callouts before the ones they only restyled", () => {
		const entries = parseCalloutManagerData(
			dataJson({ note: [{ changes: { color: "1, 2, 3" } }], mine: [] }, ["mine"]),
		);
		assert.deepEqual(
			entries?.map((entry) => entry.id),
			["mine", "note"],
		);
	});

	it("does not list a declared callout twice when it also has settings", () => {
		const entries = parseCalloutManagerData(
			dataJson({ mine: [{ changes: { color: "1, 2, 3" } }] }, ["mine"]),
		);
		assert.equal(entries?.length, 1);
		assert.equal(entries?.[0]?.declared, true);
	});
});
