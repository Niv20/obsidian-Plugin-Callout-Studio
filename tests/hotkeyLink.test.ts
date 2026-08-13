/**
 * tests/hotkeyLink.test.ts — reading every shortcut bound to a command.
 *
 * `hotkeysForCommand` exists because Obsidian's own `printHotkeyForCommand`
 * reports only the first binding, which means this plugin has to read the key
 * tables itself and re-implement the formatting. Both halves of that are silent
 * failure modes: a wrong resolution rule shows shortcuts that do not work, and
 * drifted formatting has the same chord read two ways in two windows. Neither
 * announces itself at runtime, so they are pinned here.
 *
 * The `obsidian` stub reports `Platform.isMacOS === false` (see
 * scripts/run-tests.mjs), so the expected output throughout is the spelled-out
 * Windows/Linux form rather than the macOS glyph stack.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import type { App } from "obsidian";
import { hotkeysForCommand } from "../src/settings/hotkeyLink";
import type { StoredHotkey } from "../src/types";

/** Just enough `App` for the reader: the two key tables and nothing else. */
function fakeApp(tables: {
	custom?: Record<string, StoredHotkey[]>;
	defaults?: Record<string, StoredHotkey[]>;
	throws?: boolean;
	/** Omit the table readers entirely, as an older build would. */
	legacy?: string;
}): App {
	const manager = tables.legacy
		? { printHotkeyForCommand: (): string => tables.legacy as string }
		: {
				getHotkeys: (id: string): StoredHotkey[] | undefined => {
					if (tables.throws) throw new Error("boom");
					return tables.custom?.[id];
				},
				getDefaultHotkeys: (id: string): StoredHotkey[] | undefined =>
					tables.defaults?.[id],
			};
	return { hotkeyManager: manager } as unknown as App;
}

describe("hotkeysForCommand — which table wins", () => {
	it("reads the defaults when the user has never customized the command", () => {
		const app = fakeApp({
			defaults: { "cs:wrap": [{ modifiers: ["Mod"], key: "K" }] },
		});
		assert.deepStrictEqual(hotkeysForCommand(app, "cs:wrap"), ["Ctrl + K"]);
	});

	it("lets a custom binding REPLACE the default rather than join it", () => {
		const app = fakeApp({
			custom: { "cs:wrap": [{ modifiers: ["Alt"], key: "J" }] },
			defaults: { "cs:wrap": [{ modifiers: ["Mod"], key: "K" }] },
		});
		assert.deepStrictEqual(hotkeysForCommand(app, "cs:wrap"), ["Alt + J"]);
	});

	// The reason the implementation uses `??` and not `||`. An empty custom list
	// is the user having deleted every shortcut; falling through to the defaults
	// would advertise a binding that no longer fires.
	it("treats an empty custom list as unassigned, not as absent", () => {
		const app = fakeApp({
			custom: { "cs:wrap": [] },
			defaults: { "cs:wrap": [{ modifiers: ["Mod"], key: "K" }] },
		});
		assert.deepStrictEqual(hotkeysForCommand(app, "cs:wrap"), []);
	});

	it("returns every binding, not just the first", () => {
		const app = fakeApp({
			custom: {
				"cs:wrap": [
					{ modifiers: ["Mod"], key: "K" },
					{ modifiers: ["Mod", "Shift"], key: "K" },
					{ modifiers: [], key: "F6" },
				],
			},
		});
		assert.deepStrictEqual(hotkeysForCommand(app, "cs:wrap"), [
			"Ctrl + K",
			"Ctrl + Shift + K",
			"F6",
		]);
	});

	it("reads as unassigned rather than throwing when the tables misbehave", () => {
		assert.deepStrictEqual(hotkeysForCommand(fakeApp({ throws: true }), "x"), []);
		assert.deepStrictEqual(hotkeysForCommand({} as App, "x"), []);
	});

	it("falls back to the one-shortcut helper on a build without the tables", () => {
		const app = fakeApp({ legacy: "Ctrl + K" });
		assert.deepStrictEqual(hotkeysForCommand(app, "cs:wrap"), ["Ctrl + K"]);
	});
});

describe("hotkeysForCommand — formatting", () => {
	const one = (hotkey: StoredHotkey): string => {
		const app = fakeApp({ custom: { id: [hotkey] } });
		return hotkeysForCommand(app, "id")[0] ?? "";
	};

	it("emits modifiers in Obsidian's order, not the stored order", () => {
		assert.strictEqual(
			one({ modifiers: ["Shift", "Alt", "Mod"], key: "K" }),
			"Ctrl + Alt + Shift + K",
		);
	});

	it("prefers the physical code and strips its Key prefix", () => {
		assert.strictEqual(one({ modifiers: ["Mod"], code: "KeyJ" }), "Ctrl + J");
		// Only a four-character "Key…" is a letter code. Anything longer keeps
		// every character, or a hypothetical "Keyboard" code would shorten to "b".
		assert.strictEqual(one({ modifiers: [], code: "Keyboard" }), "Keyboard");
		assert.strictEqual(one({ modifiers: [], code: "Numpad0" }), "Numpad0");
	});

	it("draws the arrow keys and Space as the pane draws them", () => {
		assert.strictEqual(one({ modifiers: [], key: "ArrowUp" }), "↑");
		assert.strictEqual(one({ modifiers: [], key: " " }), "Space");
	});

	it("splits a camel-cased key name and capitalizes a bare letter", () => {
		assert.strictEqual(one({ modifiers: [], key: "PageUp" }), "Page Up");
		assert.strictEqual(one({ modifiers: [], key: "a" }), "A");
	});

	it("drops a binding with no key at all", () => {
		assert.deepStrictEqual(
			hotkeysForCommand(fakeApp({ custom: { id: [{ modifiers: ["Mod"] }] } }), "id"),
			[],
		);
	});
});
