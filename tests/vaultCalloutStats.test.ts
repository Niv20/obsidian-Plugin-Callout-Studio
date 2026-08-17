/**
 * tests/vaultCalloutStats.test.ts — the vault usage report, and the id lookup
 * that used to call the user's own callouts "Unknown".
 *
 * Two things are pinned here, and both were broken in shipped builds:
 *
 * - **The per-role counts sum to the total they sit next to.** The breakdown is
 *   drawn beside `totalCount` in the same cell, so a role tally that counted a
 *   different set of tokens would not merely be wrong, it would contradict the
 *   number next to it. The subtle cases are the ones the tokenizer deliberately
 *   still yields: a token nested inside another's `{…}` payload, and an unclosed
 *   `{`. Both are counted, so both must be counted *per role* too.
 * - **A scanned id resolves to the definition it really belongs to.** The report
 *   built its own two exact-string maps from `def.id` and `def.aliases`, while
 *   the scan side keeps dashes (`normalizeCalloutId`) and the stored side folds
 *   them to spaces (`sanitizeCalloutIdInput`). So `> [!ep-ep]` never found the
 *   callout stored as `ep ep`, and every multi-word callout written in its
 *   dashed spelling rendered as a question mark with no name. Resolution now
 *   goes through the same ladder the three renderers use.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { asEl, el, fakeDom } from "./support/fakeDom";
import { CalloutRegistry } from "../src/manager/CalloutRegistry";
import { scanVaultCalloutStatistics } from "../src/utils/vaultCalloutStats";
import type { VaultCalloutStatistics } from "../src/utils/vaultCalloutStats";
import {
	renderStatsTypeRow,
	resolveStatsRows,
	undefinedRowIds,
} from "../src/utils/vaultStatsRow";
import type { CalloutDefinition, PluginData } from "../src/types";
import type { App } from "obsidian";

/** The slice of `App` the report touches: list the files, read one. */
function fakeApp(files: Record<string, string>): App {
	const store = new Map(Object.entries(files));
	const handles = Array.from(store.keys()).map((path) => ({ path }));
	return {
		vault: {
			getMarkdownFiles: () => handles,
			cachedRead: (file: { path: string }) =>
				Promise.resolve(store.get(file.path) ?? ""),
		},
	} as unknown as App;
}

const scan = (files: Record<string, string>): Promise<VaultCalloutStatistics> =>
	scanVaultCalloutStatistics(fakeApp(files));

/** The entry for one id, or a failure naming what the report did find. */
function typeOf(
	stats: VaultCalloutStatistics,
	id: string,
): VaultCalloutStatistics["types"][number] {
	const entry = stats.types.find((t) => t.id === id);
	assert.ok(
		entry,
		`no entry for "${id}" — found ${stats.types.map((t) => t.id).join(", ")}`,
	);
	return entry;
}

describe("scanVaultCalloutStatistics — per-role counts", () => {
	it("attributes each role to the token that carries it", async () => {
		const stats = await scan({
			"a.md": [
				"> [!note] A block",
				"> body",
				"",
				"### [!note] A heading",
				"",
				"Prose with a [!note] pill in it.",
			].join("\n"),
		});

		assert.deepStrictEqual(typeOf(stats, "note").roles, {
			regular: 1,
			heading: 1,
			inline: 1,
		});
		assert.strictEqual(typeOf(stats, "note").totalCount, 3);
	});

	it("counts a heading and the pill inside its own title separately", async () => {
		const stats = await scan({ "a.md": "## [!tip] see [!warning] first" });

		assert.deepStrictEqual(typeOf(stats, "tip").roles, {
			regular: 0,
			heading: 1,
			inline: 0,
		});
		assert.deepStrictEqual(typeOf(stats, "warning").roles, {
			regular: 0,
			heading: 0,
			inline: 1,
		});
	});

	it("counts a block header once, however long its body is", async () => {
		const stats = await scan({
			"a.md": ["> [!note] Title", "> one", "> two", "> three"].join("\n"),
		});

		assert.strictEqual(typeOf(stats, "note").totalCount, 1);
		assert.deepStrictEqual(stats.roleTotals, {
			regular: 1,
			heading: 0,
			inline: 0,
		});
	});

	it("keeps the roles summing to totalCount, nested payloads included", async () => {
		// `[!tip]{…}` is a content pill, and the tokenizer deliberately still
		// reports a token written inside its payload — everything that COUNTS
		// has to see it, or the numbers move when a payload is added.
		const stats = await scan({
			"a.md": [
				"> [!note] Block",
				"# [!success] Heading",
				"Text [!tip]{holding a [!bug] pill} more text.",
				"An unclosed [!quote]{payload",
			].join("\n"),
		});

		let summed = 0;
		for (const entry of stats.types) {
			const { regular, heading, inline } = entry.roles;
			assert.strictEqual(
				regular + heading + inline,
				entry.totalCount,
				`roles do not sum to totalCount for "${entry.id}"`,
			);
			summed += entry.totalCount;
		}
		assert.strictEqual(summed, stats.totalCount);

		const { regular, heading, inline } = stats.roleTotals;
		assert.strictEqual(regular + heading + inline, stats.totalCount);
		// The nested `[!bug]` and the unclosed `[!quote]` are both real.
		assert.strictEqual(typeOf(stats, "bug").roles.inline, 1);
		assert.strictEqual(typeOf(stats, "quote").roles.inline, 1);
	});

	it("skips frontmatter and fenced code, in every role", async () => {
		const stats = await scan({
			"a.md": [
				"---",
				"title: > [!note] not a callout",
				"---",
				"```",
				"> [!note] not a callout",
				"## [!note] not a callout",
				"```",
				"> [!note] the only one",
			].join("\n"),
		});

		assert.strictEqual(stats.totalCount, 1);
		assert.deepStrictEqual(typeOf(stats, "note").roles, {
			regular: 1,
			heading: 0,
			inline: 0,
		});
	});

	it("counts `[!note|purple]` under `note`, in the block role", async () => {
		const stats = await scan({ "a.md": "> [!note|purple] Tinted" });

		assert.deepStrictEqual(
			stats.types.map((t) => t.id),
			["note"],
		);
		assert.strictEqual(typeOf(stats, "note").roles.regular, 1);
	});

	it("reports files and role totals across the whole vault", async () => {
		const stats = await scan({
			"a.md": "> [!note] one\n\n### [!note] two",
			"b.md": "a [!note] pill",
			"c.md": "nothing here",
		});

		assert.strictEqual(stats.markdownFileCount, 3);
		assert.strictEqual(stats.filesWithCallouts, 2);
		assert.strictEqual(typeOf(stats, "note").fileCount, 2);
		assert.deepStrictEqual(stats.roleTotals, {
			regular: 1,
			heading: 1,
			inline: 1,
		});
	});
});

/* -------------------------------------------------------------------------- */

function def(over: Partial<CalloutDefinition> = {}): CalloutDefinition {
	return {
		id: "x",
		displayName: "X",
		icon: { type: "lucide", value: "star" },
		colorLight: "#336699",
		colorDark: "#88bbee",
		foldable: true,
		defaultFolded: false,
		builtIn: false,
		source: "user",
		...over,
	};
}

function registryWith(callouts: CalloutDefinition[]): CalloutRegistry {
	const registry = new CalloutRegistry();
	registry.load({ callouts } as Partial<PluginData>);
	return registry;
}

/** One report entry, as the scan would hand it over. */
const entry = (id: string) => ({
	id,
	fileCount: 1,
	totalCount: 1,
	roles: { regular: 1, heading: 0, inline: 0 },
});

describe("resolveStatsRows — a scanned id finds its definition", () => {
	it("matches a dashed spelling to the callout stored with spaces", () => {
		// The bug: `sanitizeCalloutIdInput` folds the user's dashes to spaces on
		// the way in, so `ep ep` is the only spelling that can be *stored* — and
		// `[!ep-ep]` in a note is the same callout, as Obsidian's own
		// `data-callout` form proves.
		const registry = registryWith([def({ id: "ep ep", displayName: "Ep ep" })]);

		const [row] = resolveStatsRows(registry, [entry("ep-ep")]);

		assert.strictEqual(row?.undefinedId, false);
		assert.strictEqual(row?.def?.id, "ep ep");
		assert.strictEqual(row?.isAlias, false, "a spelling is not an alias");
	});

	it("matches the spaced spelling too, and the id itself", () => {
		const registry = registryWith([def({ id: "ep ep" })]);

		assert.strictEqual(
			resolveStatsRows(registry, [entry("ep ep")])[0]?.def?.id,
			"ep ep",
		);
		assert.strictEqual(
			resolveStatsRows(registry, [entry("EP EP")])[0]?.def?.id,
			"ep ep",
		);
	});

	it("flags a real alias hit as an alias", () => {
		const registry = registryWith([]);

		const [row] = resolveStatsRows(registry, [entry("faq")]);

		assert.strictEqual(row?.def?.id, "question");
		assert.strictEqual(row?.isAlias, true);
	});

	it("resolves a built-in", () => {
		const [row] = resolveStatsRows(registryWith([]), [entry("success")]);

		assert.strictEqual(row?.undefinedId, false);
		assert.strictEqual(row?.def?.builtIn, true);
	});

	it("marks an id nothing defines, and hands over the fallback to draw with", () => {
		const registry = registryWith([]);

		const [row] = resolveStatsRows(registry, [entry("חתול")]);

		assert.strictEqual(row?.undefinedId, true);
		assert.strictEqual(row?.isAlias, false);
		// Not "no definition": the note renders that token with the fallback
		// callout, so the report draws the row the same way.
		assert.strictEqual(row?.def?.id, registry.settings.fallbackCalloutId);
	});

	it("collects exactly the undefined ids, in report order", () => {
		const rows = resolveStatsRows(registryWith([def({ id: "mine" })]), [
			entry("note"),
			entry("חתול"),
			entry("mine"),
			entry("typo"),
		]);

		assert.deepStrictEqual(undefinedRowIds(rows), ["חתול", "typo"]);
	});
});

/* -------------------------------------------------------------------------- */

describe("renderStatsTypeRow — what the row actually shows", () => {
	const deps = (registry: CalloutRegistry) => ({
		registry,
		format: (v: number) => String(v),
	});

	/** Renders the single row for `id` and hands back its element. */
	function renderRow(
		registry: CalloutRegistry,
		id: string,
		roles = { regular: 12, heading: 2, inline: 1 },
	) {
		const host = el();
		const rows = resolveStatsRows(registry, [
			{ id, fileCount: 3, totalCount: 15, roles },
		]);
		renderStatsTypeRow(asEl(host), rows[0]!, deps(registry));
		return host.querySelector(".cs-vault-stats-row")!;
	}

	const textOf = (row: ReturnType<typeof renderRow>, cls: string): string =>
		row.querySelector(cls)?.textContent ?? "";

	it("is three cells and no more: the id, the chips, the file count", () => {
		fakeDom.light();
		const registry = registryWith([
			def({ id: "bikee", displayName: "Bikee", colorLight: "#112233" }),
		]);

		const row = renderRow(registry, "bikee");

		assert.strictEqual(textOf(row, ".cs-vault-stats-type-id"), "bikee");
		assert.strictEqual(textOf(row, ".cs-vault-stats-files"), "3");
		// Name, Source and Count each had a column and lost it: a name is the id
		// title-cased in all but a handful of cases, "Custom" is not something
		// anyone acts on, and the chips already sum to the count.
		for (const gone of [".cs-vault-stats-name", ".cs-vault-stats-count"]) {
			assert.strictEqual(row.querySelector(gone), null, gone);
		}
		assert.strictEqual(row.querySelector(".cs-vault-stats-type-note"), null);
	});

	it("names an undefined id after itself and tags it — never 'Unknown'", () => {
		// The reported bug, end to end: a callout used in notes but absent from
		// the registry showed a question mark and the word "Unknown", with no
		// way to tell which `[!…]` the 15 uses even belonged to. The tag is also
		// what the footer's "Define N missing" button is pointing at, which is
		// why it outlived the Source column it used to sit in.
		const row = renderRow(registryWith([]), "חתול");

		assert.strictEqual(textOf(row, ".cs-vault-stats-type-id"), "חתול");
		assert.strictEqual(textOf(row, ".cs-vault-stats-type-note"), "Not defined");
		assert.ok(
			row.querySelector(".cs-vault-stats-type-icon")?.hasClass("is-unknown"),
			"an undefined row's icon is dimmed",
		);
	});

	it("tags an alias row with the id its counts are filed under", () => {
		const row = renderRow(registryWith([]), "faq");

		assert.strictEqual(textOf(row, ".cs-vault-stats-type-id"), "faq");
		assert.strictEqual(
			textOf(row, ".cs-vault-stats-type-note"),
			"Alias of question",
		);
	});

	it("leaves out the roles a type is never written in", () => {
		const row = renderRow(registryWith([]), "note", {
			regular: 4,
			heading: 0,
			inline: 0,
		});

		assert.deepStrictEqual(
			row.findAll(".cs-vault-stats-role-chip").map((c) => c.textContent),
			["Block 4"],
		);
	});

	it("keeps heading → inline → block order when a role is missing", () => {
		// Not "the first two of three": the order is fixed, and dropping the
		// middle one must not promote block above heading.
		const row = renderRow(registryWith([]), "note", {
			regular: 4,
			heading: 9,
			inline: 0,
		});

		assert.deepStrictEqual(
			row.findAll(".cs-vault-stats-role-chip").map((c) => c.textContent),
			["Heading 9", "Block 4"],
		);
	});

	it("shows the breakdown as a plain column, with nothing to expand", () => {
		const row = renderRow(registryWith([]), "note");

		// Heading, inline, block — display order, deliberately not the
		// CALLOUT_RENDER_ROLES order the CSS and import sweeps iterate.
		assert.deepStrictEqual(
			row.findAll(".cs-vault-stats-role-chip").map((c) => c.textContent),
			["Heading 2", "Inline 1", "Block 12"],
		);
		// The chips were once hidden behind hover, with the row expanding to a
		// second grid line to show them — which read as the row jumping under
		// the pointer. Nothing about the row is interactive now.
		assert.strictEqual(row.getAttribute("role"), null);
		assert.strictEqual(row.getAttribute("tabindex"), null);
		assert.strictEqual(row.getAttribute("aria-expanded"), null);
		// And the stacked proportion bar that stood beside the count is gone
		// with it — three numbers you can read beat a 48px line.
		assert.strictEqual(row.querySelector(".cs-vault-stats-bar"), null);
	});

	it("takes its icon colour from the active theme", () => {
		const registry = registryWith([
			def({ id: "mine", colorLight: "#112233", colorDark: "#aabbcc" }),
		]);
		const iconColor = () =>
			renderRow(registry, "mine").querySelector(".cs-vault-stats-type-icon")
				?.style.color;

		fakeDom.light();
		assert.strictEqual(iconColor(), "#112233");
		fakeDom.dark();
		assert.strictEqual(iconColor(), "#aabbcc");
		fakeDom.light();
	});
});
