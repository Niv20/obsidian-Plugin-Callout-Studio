/**
 * tests/settingsMerge.test.ts — the "three places" a settings field has to
 * appear, and what happens when it appears in only two.
 *
 * `mergeSavedSettings` rebuilds a complete `PluginSettings` from possibly
 * partial, possibly ancient, possibly hand-edited saved data. It is not a
 * spread: every field is named explicitly, which is what lets a retired key be
 * dropped and a legacy one be folded into its replacement. The cost of that
 * design is the failure it invites — a field added to the interface and to the
 * editor UI, but never named here, is read back as `undefined` on the next
 * launch and then written over the user's real value by `toSaveData()`. It
 * looks like the setting simply does not stick.
 *
 * So a new field needs THREE places, and CLAUDE.md says so:
 *
 *   1. the `PluginSettings` interface   2. `DEFAULT_SETTINGS`   3. this merge
 *
 * A test can only see the second and third at runtime — an interface is gone by
 * then. `FIELD_KIND` below closes that: it is a **total** `Record` over
 * `keyof PluginSettings`, so declaring a field in the interface without listing
 * it here is a compile error (`tsconfig.json` includes `tests/`), and the three
 * key sets are then compared against each other at runtime. That is the whole
 * item, and the rest of the file is what each kind of field does once it is in
 * all three places.
 *
 * The generated per-leaf tests are the sharper half. Key-set equality catches a
 * field nobody merged at all; a leaf test catches the subtler version — a field
 * that IS named here but reads from the wrong place, or is fixed to its default,
 * so the user's saved value silently never comes back.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { mergeSavedSettings } from "../src/utils/settingsMerge";
import {
	DEFAULT_CONTEXT_MENU_ITEMS,
	DEFAULT_SETTINGS,
} from "../src/constants";
import type {
	ContextMenuItemConfig,
	CustomCommand,
	CustomPalette,
	PluginSettings,
} from "../src/types";

/* ────────────────────────────────────────────────────────────────────────────
 * Place 1 — the interface, pinned at compile time
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Every key of `PluginSettings`, and how the merge is expected to treat it.
 *
 * A total `Record` for the same reason `CalloutRegistry.COMPARED_FIELDS` and
 * `importValidator.KNOWN_FIELD_MAP` are: it turns "someone added a field and
 * forgot about this file" from a silent data-loss bug into a build failure.
 *
 * - `value` — a single value (or a tree of them) with no identity to merge on.
 *   An import replaces it wholesale; a save round-trips it unchanged.
 * - `list`  — one of the lists the user builds up. These come back as whatever
 *   the file said (empty when it said nothing), and merging them by id against
 *   what the vault already has is the *caller's* job — see
 *   `settingsValidator.test.ts` and `exportRoundTrip.test.ts`.
 */
const FIELD_KIND: Record<keyof PluginSettings, "value" | "list"> = {
	globalStyle: "value",
	contextMenu: "value",
	autocomplete: "value",
	iconSources: "value",
	headingCallouts: "value",
	inlineCallouts: "value",
	firstRunCompleted: "value",
	welcomeSeen: "value",
	fallbackCalloutId: "value",
	language: "value",
	customPalettes: "list",
	userImages: "list",
	customCommands: "list",
	disabledFixedCommands: "list",
};

const LIST_FIELDS = Object.entries(FIELD_KIND)
	.filter(([, kind]) => kind === "list")
	.map(([key]) => key)
	.sort();

/* ────────────────────────────────────────────────────────────────────────────
 * Walking the defaults
 * ──────────────────────────────────────────────────────────────────────────── */

type Scalar = string | number | boolean;

interface Leaf {
	/** Dotted path, e.g. `globalStyle.heading.borderWidth`. */
	name: string;
	path: string[];
	value: Scalar;
}

/**
 * Every scalar leaf of `DEFAULT_SETTINGS`, arrays excluded.
 *
 * Arrays are skipped rather than walked: the three lists and the per-role menu
 * item lists are merged by their own rules and are tested by name below. What
 * is left is exactly the set of values a `?? DEFAULT_SETTINGS.x` line in the
 * merge is responsible for.
 */
function leaves(node: unknown, path: string[] = []): Leaf[] {
	const out: Leaf[] = [];
	for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
		if (Array.isArray(value)) continue;
		if (value !== null && typeof value === "object") {
			out.push(...leaves(value, [...path, key]));
			continue;
		}
		if (value === undefined) continue;
		out.push({
			name: [...path, key].join("."),
			path: [...path, key],
			value: value as Scalar,
		});
	}
	return out;
}

const LEAVES = leaves(DEFAULT_SETTINGS);

/**
 * The settings this merge is answerable for, spelled out.
 *
 * Deliberately duplicated rather than derived: the walk above is the mechanism,
 * and a mechanism that silently starts returning fewer paths would quietly stop
 * testing them. Adding a setting means adding a line here, which is the moment
 * to decide whether it also needs a hand-written test below.
 */
const EXPECTED_LEAVES: string[] = [
	"autocomplete.enabled",
	"contextMenu.enabled",
	"fallbackCalloutId",
	"firstRunCompleted",
	"globalStyle.alignContentWithTitle",
	"globalStyle.borderRadius",
	"globalStyle.borderSides.bottom",
	"globalStyle.borderSides.left",
	"globalStyle.borderSides.right",
	"globalStyle.borderSides.top",
	"globalStyle.borderWidth",
	"globalStyle.contentScale",
	"globalStyle.heading.borderRadius",
	"globalStyle.heading.borderSides.bottom",
	"globalStyle.heading.borderSides.left",
	"globalStyle.heading.borderSides.right",
	"globalStyle.heading.borderSides.top",
	"globalStyle.heading.borderWidth",
	"globalStyle.heading.marginTop",
	"globalStyle.heading.paddingBottom",
	"globalStyle.heading.paddingTop",
	"globalStyle.inline.borderRadius",
	"globalStyle.inline.borderSides.bottom",
	"globalStyle.inline.borderSides.left",
	"globalStyle.inline.borderSides.right",
	"globalStyle.inline.borderSides.top",
	"globalStyle.inline.borderWidth",
	"globalStyle.inline.fontScale",
	"globalStyle.titleScale",
	"headingCallouts.enabled",
	"headingCallouts.refCleanTitles",
	"headingCallouts.refShowIcon",
	"headingCallouts.showFoldArrow",
	"iconSources.lastCategory.material",
	"iconSources.lastEmojiSkinTone",
	"iconSources.materialStyleDefault",
	"iconSources.materialWeightDefault",
	"inlineCallouts.allowContent",
	"inlineCallouts.enabled",
	"language",
	"welcomeSeen",
];

/**
 * The two leaves the merge deliberately does NOT take from the file.
 *
 * Outline/link cleaning and heading icons stopped being user-configurable; a
 * saved `false` from a build where they were is ignored rather than migrated,
 * because the feature it switched off no longer exists to switch off.
 */
const FORCED = new Set(["headingCallouts.refCleanTitles", "headingCallouts.refShowIcon"]);

/** A value definitely different from `value`, of the same type. */
function twist(value: Scalar): Scalar {
	if (typeof value === "boolean") return !value;
	if (typeof value === "number") return value + 7;
	return `${value}-twisted`;
}

/** `{a: {b: {c: value}}}` from `["a","b","c"]`. */
function nest(path: readonly string[], value: unknown): Record<string, unknown> {
	const [head, ...rest] = path;
	if (head === undefined) throw new Error("empty path");
	return { [head]: rest.length === 0 ? value : nest(rest, value) };
}

/** Follow a dotted path into a merged settings object. */
function read(node: unknown, path: readonly string[]): unknown {
	let cursor: unknown = node;
	for (const key of path) {
		if (cursor === null || typeof cursor !== "object") return undefined;
		cursor = (cursor as Record<string, unknown>)[key];
	}
	return cursor;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Places 2 and 3 — the key sets, compared against each other
 * ──────────────────────────────────────────────────────────────────────────── */

describe("mergeSavedSettings — the three places", () => {
	it("DEFAULT_SETTINGS carries every key the interface declares", () => {
		// The compile-time half is `FIELD_KIND` itself, which cannot be written
		// without naming every key of `PluginSettings`. This is the runtime half:
		// the one gap tsc leaves is an OPTIONAL key declared in the interface and
		// omitted from the defaults, which typechecks and then reads as
		// `undefined` forever.
		assert.deepStrictEqual(
			Object.keys(DEFAULT_SETTINGS).sort(),
			Object.keys(FIELD_KIND).sort(),
		);
	});

	it("a merge of nothing produces every one of those keys, and no other", () => {
		const merged = Object.keys(mergeSavedSettings({})).sort();
		const declared = Object.keys(FIELD_KIND).sort();

		assert.deepStrictEqual(
			declared.filter((k) => !merged.includes(k)),
			[],
			"declared but never merged — the value will not survive a reload",
		);
		assert.deepStrictEqual(
			merged.filter((k) => !declared.includes(k)),
			[],
			"merged but undeclared — a key no code understands, re-saved forever",
		);
	});

	it("a merge of nothing IS the defaults, value for value", () => {
		assert.deepStrictEqual(mergeSavedSettings({}), DEFAULT_SETTINGS);
	});

	it("the defaults round-trip through the merge unchanged", () => {
		// What every launch of an untouched vault does: save the defaults, read
		// them back. A field that normalizes on the way in but not on the way out
		// would drift a little further on each launch.
		assert.deepStrictEqual(
			mergeSavedSettings(structuredClone(DEFAULT_SETTINGS)),
			DEFAULT_SETTINGS,
		);
	});

	it("is a fixed point on rich data too", () => {
		const rich = mergeSavedSettings({
			globalStyle: { borderWidth: 9, heading: { marginTop: 2 } },
			contextMenu: { enabled: false, items: { regular: [{ id: "edit", enabled: false }] } },
			language: "he",
			customPalettes: [palette()],
			customCommands: [command()],
		} as Partial<PluginSettings>);

		assert.deepStrictEqual(mergeSavedSettings(rich), rich);
	});
});

/* ────────────────────────────────────────────────────────────────────────────
 * Every leaf, generated
 * ──────────────────────────────────────────────────────────────────────────── */

describe("mergeSavedSettings — every saved value comes back", () => {
	it("the walk still finds exactly the settings this file knows about", () => {
		assert.deepStrictEqual(LEAVES.map((l) => l.name).sort(), EXPECTED_LEAVES);
	});

	for (const leaf of LEAVES) {
		if (FORCED.has(leaf.name)) continue;
		it(`${leaf.name}`, () => {
			const wanted = twist(leaf.value);
			const merged = mergeSavedSettings(
				nest(leaf.path, wanted) as Partial<PluginSettings>,
			);
			assert.deepStrictEqual(
				read(merged, leaf.path),
				wanted,
				`${leaf.name} was dropped or overwritten by its default`,
			);
		});
	}

	for (const name of FORCED) {
		it(`${name} is forced on, whatever the file says`, () => {
			const path = name.split(".");
			const merged = mergeSavedSettings(
				nest(path, false) as Partial<PluginSettings>,
			);
			assert.strictEqual(read(merged, path), true);
		});
	}

	it("filling one leaf leaves every other at its default", () => {
		// The merge is a rebuild, so a partial file must not blank the fields it
		// says nothing about — the failure mode that made `paddingStart`-era data
		// worth this whole design.
		const merged = mergeSavedSettings({
			globalStyle: { borderWidth: 9 },
		} as Partial<PluginSettings>);

		assert.strictEqual(merged.globalStyle.borderWidth, 9);
		assert.deepStrictEqual(
			{ ...merged, globalStyle: { ...merged.globalStyle, borderWidth: 2.5 } },
			DEFAULT_SETTINGS,
		);
	});
});

/* ────────────────────────────────────────────────────────────────────────────
 * Keys the merge exists to retire
 * ──────────────────────────────────────────────────────────────────────────── */

describe("mergeSavedSettings — keys that must NOT survive", () => {
	it("drops a nested field a later version removed (`heading.paddingStart`)", () => {
		// The bar's start inset is a static 10px in styles.css now. Settings are
		// written back wholesale by `toSaveData()` AND copied into every export,
		// so a key that survived the merge would ride along forever — which is
		// what `mergeHeadingStyle` exists to prevent, and what makes
		// settingsValidator's "unknown fields are dropped" promise true at depth.
		const merged = mergeSavedSettings({
			globalStyle: { heading: { paddingStart: 12, borderWidth: 3 } },
		} as unknown as Partial<PluginSettings>);

		assert.ok(!("paddingStart" in merged.globalStyle.heading));
		assert.strictEqual(merged.globalStyle.heading.borderWidth, 3, "the rest is kept");
	});

	it("drops an unknown TOP-LEVEL field — that literal is total", () => {
		const merged = mergeSavedSettings({
			fromTheFuture: true,
		} as Parameters<typeof mergeSavedSettings>[0]);
		assert.ok(!("fromTheFuture" in merged));
	});

	it("…but KEEPS one nested inside a spread section — pinned as found", () => {
		// The retirement above is by name, not by shape: `mergeHeadingStyle`
		// spreads the saved object and then `delete`s the one key it knows about.
		// Every other unknown key rides through — and settings are written back
		// wholesale by `toSaveData()` and copied into every export, so it rides
		// through forever. That is the exact outcome the doc comment on
		// `mergeHeadingStyle` says the helper exists to prevent, and it is true
		// only of `paddingStart`.
		//
		// The sections that spread rather than rebuild are `globalStyle`, its
		// `heading` / `inline` / `borderSides` children, and `iconSources`;
		// `contextMenu`, `autocomplete`, `headingCallouts` and `inlineCallouts`
		// name their fields and so really are total. Pinned as found rather than
		// asserted the other way: the fix is to spell out the role frame styles
		// the way the top level is spelled out, and these are the assertions to
		// flip when it lands.
		const merged = mergeSavedSettings({
			globalStyle: {
				fromTheFuture: 1,
				heading: { fromTheFuture: 2 },
				inline: { fromTheFuture: 3 },
			},
			iconSources: { fromTheFuture: 4 },
		} as unknown as Partial<PluginSettings>);

		const style = merged.globalStyle as unknown as Record<string, unknown>;
		assert.strictEqual(style.fromTheFuture, 1);
		assert.strictEqual(
			(merged.globalStyle.heading as unknown as Record<string, unknown>)
				.fromTheFuture,
			2,
		);
		assert.strictEqual(
			(merged.globalStyle.inline as unknown as Record<string, unknown>)
				.fromTheFuture,
			3,
		);
		assert.strictEqual(
			(merged.iconSources as unknown as Record<string, unknown>).fromTheFuture,
			4,
		);
	});

	it("folds `lastMaterialCategory` into `lastCategory` and deletes it", () => {
		// Pre-2.4 the picker had one source with categories, so the field named
		// Material directly. `lastCategory` is keyed by source now.
		const merged = mergeSavedSettings({
			iconSources: { lastMaterialCategory: "Actions" },
		} as Partial<PluginSettings>);

		assert.strictEqual(merged.iconSources.lastCategory?.material, "Actions");
		assert.ok(!("lastMaterialCategory" in merged.iconSources));
	});

	it("lets the legacy category win over an absent new one, and lose to a present one", () => {
		const both = mergeSavedSettings({
			iconSources: {
				lastMaterialCategory: "Actions",
				lastCategory: { material: "Social" },
			},
		} as Partial<PluginSettings>);
		// The legacy fold runs last, so it overwrites — pinned as found. Only
		// reachable in data written by a build that had both, which no released
		// version did.
		assert.strictEqual(both.iconSources.lastCategory?.material, "Actions");
	});

	it("takes `contextMenu.enabled` from the pre-1.0 `popup` block", () => {
		// The one legacy settings key still honoured: the context menu used to
		// be a floating popup, and its on/off switch is the only part of it that
		// still means anything.
		assert.strictEqual(
			mergeSavedSettings({ popup: { enabled: false } } as Parameters<
				typeof mergeSavedSettings
			>[0]).contextMenu.enabled,
			false,
		);
	});

	it("prefers a real `contextMenu.enabled` over the legacy one", () => {
		assert.strictEqual(
			mergeSavedSettings({
				contextMenu: { enabled: true },
				popup: { enabled: false },
			} as Parameters<typeof mergeSavedSettings>[0]).contextMenu.enabled,
			true,
		);
	});
});

/* ────────────────────────────────────────────────────────────────────────────
 * The per-role menu item lists
 * ──────────────────────────────────────────────────────────────────────────── */

const ids = (items: ContextMenuItemConfig[]): string[] => items.map((i) => i.id);

describe("mergeSavedSettings — the context menu's item lists", () => {
	it("defaults every role when the file says nothing", () => {
		assert.deepStrictEqual(
			mergeSavedSettings({}).contextMenu.items,
			DEFAULT_CONTEXT_MENU_ITEMS,
		);
	});

	it("keeps the user's own order", () => {
		// The list is drag-reorderable, so its order is the setting.
		const merged = mergeSavedSettings({
			contextMenu: {
				items: {
					regular: [
						{ id: "openSettings", enabled: true },
						{ id: "edit", enabled: true },
						{ id: "foldDefaults", enabled: true },
						{ id: "copyMarkdown", enabled: true },
					],
				},
			},
		} as Partial<PluginSettings>);

		assert.deepStrictEqual(ids(merged.contextMenu.items.regular), [
			"openSettings",
			"edit",
			"foldDefaults",
			"copyMarkdown",
		]);
	});

	it("appends items introduced by a newer version, at the end", () => {
		// So an upgrade adds the new entry without discarding the arrangement
		// the user made, and without hiding the new item entirely.
		const merged = mergeSavedSettings({
			contextMenu: { items: { regular: [{ id: "edit", enabled: false }] } },
		} as Partial<PluginSettings>);

		assert.strictEqual(ids(merged.contextMenu.items.regular)[0], "edit");
		assert.deepStrictEqual(
			ids(merged.contextMenu.items.regular).sort(),
			ids(DEFAULT_CONTEXT_MENU_ITEMS.regular).sort(),
			"every default item is present exactly once",
		);
		assert.strictEqual(merged.contextMenu.items.regular[0]?.enabled, false);
	});

	it("drops an id this version does not have", () => {
		const merged = mergeSavedSettings({
			contextMenu: {
				items: { regular: [{ id: "retiredThing", enabled: true }] },
			},
		} as unknown as Partial<PluginSettings>);

		assert.ok(!ids(merged.contextMenu.items.regular).includes("retiredThing"));
	});

	it("drops a duplicate rather than showing the item twice", () => {
		const merged = mergeSavedSettings({
			contextMenu: {
				items: {
					regular: [
						{ id: "edit", enabled: true },
						{ id: "edit", enabled: false },
					],
				},
			},
		} as Partial<PluginSettings>);

		assert.strictEqual(
			ids(merged.contextMenu.items.regular).filter((id) => id === "edit").length,
			1,
		);
	});

	it("reads a missing `enabled` as on", () => {
		const merged = mergeSavedSettings({
			contextMenu: { items: { regular: [{ id: "edit" }] } },
		} as Partial<PluginSettings>);
		assert.strictEqual(merged.contextMenu.items.regular[0]?.enabled, true);
	});

	it("tolerates arbitrary junk in place of the list", () => {
		// Saved data and import files are both untrusted.
		for (const junk of [null, 42, "items", { id: "edit" }, [null, 7, {}, { id: 3 }]]) {
			const merged = mergeSavedSettings({
				contextMenu: { items: { regular: junk } },
			} as unknown as Partial<PluginSettings>);
			assert.deepStrictEqual(
				ids(merged.contextMenu.items.regular).sort(),
				ids(DEFAULT_CONTEXT_MENU_ITEMS.regular).sort(),
				JSON.stringify(junk),
			);
		}
	});

	it("merges each role independently", () => {
		const merged = mergeSavedSettings({
			contextMenu: { items: { inline: [{ id: "openSettings", enabled: true }] } },
		} as Partial<PluginSettings>);

		assert.deepStrictEqual(ids(merged.contextMenu.items.inline), [
			"openSettings",
			"edit",
		]);
		assert.deepStrictEqual(
			merged.contextMenu.items.regular,
			DEFAULT_CONTEXT_MENU_ITEMS.regular,
		);
	});
});

/* ────────────────────────────────────────────────────────────────────────────
 * The three lists
 * ──────────────────────────────────────────────────────────────────────────── */

function palette(over: Partial<CustomPalette> = {}): CustomPalette {
	return {
		id: "cp-1",
		name: "Mine",
		colorLight: "#336699",
		colorDark: "#88bbee",
		bgColorLight: "#eef4fa",
		bgColorDark: "#16202b",
		textColorLight: "#111111",
		textColorDark: "#eeeeee",
		...over,
	};
}

function command(over: Partial<CustomCommand> = {}): CustomCommand {
	return {
		id: "cmd-1",
		calloutId: "note",
		role: "inline",
		...over,
	} as CustomCommand;
}

describe("mergeSavedSettings — the lists the user builds up", () => {
	for (const field of LIST_FIELDS) {
		it(`${field} is an empty array when the file carries none`, () => {
			// NOT the user's existing list. Everything here is a pure function of
			// the file; merging by id against the vault's own is the caller's job
			// (DataManagementSection), and reading this function alone is exactly
			// what makes `Object.assign` look safe.
			assert.deepStrictEqual(
				(mergeSavedSettings({}) as unknown as Record<string, unknown>)[field],
				[],
			);
		});

		it(`${field} is a fresh array, never DEFAULT_SETTINGS' own`, () => {
			const a = mergeSavedSettings({}) as unknown as Record<string, unknown[]>;
			const b = mergeSavedSettings({}) as unknown as Record<string, unknown[]>;
			const mine = a[field];
			assert.ok(Array.isArray(mine));
			mine.push("scribble");

			assert.deepStrictEqual(b[field], [], "a second merge is unaffected");
			assert.deepStrictEqual(
				(DEFAULT_SETTINGS as unknown as Record<string, unknown[]>)[field],
				[],
				"and so are the defaults",
			);
		});
	}

	it("carries the file's palettes through, sanitized", () => {
		const merged = mergeSavedSettings({
			customPalettes: [palette(), { id: "broken" }],
		} as Partial<PluginSettings>);

		assert.deepStrictEqual(
			merged.customPalettes.map((p) => p.id),
			["cp-1"],
		);
	});

	it("carries the file's commands through, sanitized", () => {
		const merged = mergeSavedSettings({
			customCommands: [command(), { id: "no-callout", role: "inline" }],
		} as Partial<PluginSettings>);

		assert.deepStrictEqual(
			merged.customCommands.map((c) => c.id),
			["cmd-1"],
		);
	});

	it("de-duplicates `disabledFixedCommands` and drops non-strings", () => {
		const merged = mergeSavedSettings({
			disabledFixedCommands: [
				"insert-empty",
				"insert-empty",
				7,
				null,
				"wrap-selection",
			],
		} as unknown as Partial<PluginSettings>);

		assert.deepStrictEqual(merged.disabledFixedCommands, [
			"insert-empty",
			"wrap-selection",
		]);
	});

	it("reads a non-array as none, for every list", () => {
		const merged = mergeSavedSettings({
			customPalettes: "nope",
			userImages: 7,
			customCommands: { id: "x" },
			disabledFixedCommands: "insert-empty",
		} as unknown as Partial<PluginSettings>);

		assert.deepStrictEqual(merged.customPalettes, []);
		assert.deepStrictEqual(merged.userImages, []);
		assert.deepStrictEqual(merged.customCommands, []);
		assert.deepStrictEqual(merged.disabledFixedCommands, []);
	});
});

/* ────────────────────────────────────────────────────────────────────────────
 * Nothing handed back may alias the defaults
 * ──────────────────────────────────────────────────────────────────────────── */

describe("mergeSavedSettings — what the caller is handed", () => {
	it("rebuilds every nested object it returns", () => {
		// `DEFAULT_SETTINGS` is a plain module-level object, not frozen. The
		// merged result becomes `registry.settings`, which the settings UI writes
		// to directly — so any piece shared with the defaults would be corrupted
		// vault-wide by the first slider drag, for the rest of the session.
		const merged = mergeSavedSettings({});

		assert.notStrictEqual(merged.globalStyle, DEFAULT_SETTINGS.globalStyle);
		assert.notStrictEqual(
			merged.globalStyle.borderSides,
			DEFAULT_SETTINGS.globalStyle.borderSides,
		);
		assert.notStrictEqual(
			merged.globalStyle.heading,
			DEFAULT_SETTINGS.globalStyle.heading,
		);
		assert.notStrictEqual(
			merged.globalStyle.inline,
			DEFAULT_SETTINGS.globalStyle.inline,
		);
		assert.notStrictEqual(merged.contextMenu, DEFAULT_SETTINGS.contextMenu);
		assert.notStrictEqual(merged.contextMenu.items, DEFAULT_CONTEXT_MENU_ITEMS);
		assert.notStrictEqual(
			merged.contextMenu.items.regular,
			DEFAULT_CONTEXT_MENU_ITEMS.regular,
		);
		assert.notStrictEqual(merged.iconSources, DEFAULT_SETTINGS.iconSources);
	});

	it("two merges never share a single object between them", () => {
		const a = mergeSavedSettings({});
		const b = mergeSavedSettings({});
		a.globalStyle.borderSides.top = true;
		a.contextMenu.items.regular.length = 0;

		assert.strictEqual(b.globalStyle.borderSides.top, false);
		assert.strictEqual(b.contextMenu.items.regular.length, 4);
		assert.strictEqual(DEFAULT_SETTINGS.globalStyle.borderSides.top, false);
	});

	it("`iconSources.lastCategory` is the ONE piece still shared — pinned as found", () => {
		// `mergeIconSources` spreads `DEFAULT_SETTINGS.iconSources` and then
		// replaces `lastCategory` only when the pre-2.4 field is present, so a
		// file that names no category is handed the defaults' own object.
		//
		// Safe today only by the writer's convention: `IconPickerModal` does
		// `sources.lastCategory = { ...sources.lastCategory, [id]: category }` —
		// it REPLACES the object rather than assigning into it. The day someone
		// writes `lastCategory[id] = category` instead, the picker's last-opened
		// category leaks into `DEFAULT_SETTINGS` and from there into every merge
		// for the rest of the session, including the "reset to defaults" path.
		// The fix is one spread in `mergeIconSources`; this is the assertion to
		// flip when it lands.
		const merged = mergeSavedSettings({});
		assert.strictEqual(
			merged.iconSources.lastCategory,
			DEFAULT_SETTINGS.iconSources.lastCategory,
		);
	});

	it("…and is not shared once the file names a category", () => {
		const merged = mergeSavedSettings({
			iconSources: { lastCategory: { material: "Social" } },
		} as Partial<PluginSettings>);
		assert.notStrictEqual(
			merged.iconSources.lastCategory,
			DEFAULT_SETTINGS.iconSources.lastCategory,
		);
	});
});
