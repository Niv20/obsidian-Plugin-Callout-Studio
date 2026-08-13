/**
 * tests/hideIcon.test.ts — `CalloutDefinition.hideIcon`, the "draw no icon" flag.
 *
 * The flag is cheap to set and expensive to get wrong: it reaches the generated
 * stylesheet, the persistence gate and the built-in colour-deference gate, and
 * two of those three are invisible until a user reloads or switches theme. What
 * is pinned here is the reasoning, not the formatting:
 *
 * - the hide rule is emitted for the id *and every alias*, and lives OUTSIDE
 *   `@media screen`, so the icon is as absent in a PDF as it is on screen;
 * - the icon half of the per-callout block goes quiet with it (no
 *   `--callout-icon`, no ::after override), rather than being painted and then
 *   covered;
 * - the global "Align content with title" indent is undone per callout, and by
 *   specificity alone — an `!important` here would be a bug, because it would
 *   also outrank a snippet;
 * - hiding a built-in's icon persists (`isBuiltInModified`) WITHOUT costing it
 *   its deference to the theme's `--callout-*` (`isUnmodifiedBuiltIn`). Those
 *   two answers come from one comparison and have to disagree on this field.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { CalloutRegistry } from "../src/manager/CalloutRegistry";
import { CSSInjector } from "../src/manager/CSSInjector";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../src/types";

/**
 * `generateCalloutCSS` and `generateFallbackCSS` are private — they are internal
 * to one emission pass, not API. Reached through one cast in one place so the
 * production signatures stay honest.
 */
type InjectorInternals = {
	generateCalloutCSS(def: CalloutDefinition): string;
	generateFallbackCSS(callouts: CalloutDefinition[]): string;
};

/**
 * A registry plus an injector wired to it. `StartupStyleCache` only touches the
 * app on inject, which nothing here calls, so a bare object is app enough.
 */
function harness(): {
	registry: CalloutRegistry;
	css: InjectorInternals;
} {
	const registry = new CalloutRegistry();
	// The constructor only stocks `builtInDefaults`; `load(null)` is what seeds
	// the live map with the 13 shipped callouts, exactly as a first run does.
	registry.load(null);
	const injector = new CSSInjector({} as App, registry);
	return {
		registry,
		css: injector as unknown as InjectorInternals,
	};
}

function definition(over: Partial<CalloutDefinition> = {}): CalloutDefinition {
	return {
		id: "quiet",
		displayName: "Quiet",
		icon: { type: "lucide", value: "lucide-pencil" },
		colorLight: "#336699",
		colorDark: "#88bbee",
		foldable: true,
		defaultFolded: false,
		builtIn: false,
		source: "user",
		...over,
	};
}

describe("hideIcon — the generated block-callout CSS", () => {
	it("takes the icon box out of the layout, not just out of sight", () => {
		const { css } = harness();
		const out = css.generateCalloutCSS(definition({ hideIcon: true }));

		assert.match(
			out,
			/\.callout\[data-callout="quiet"\] > \.callout-title > \.callout-icon \{\s*display: none;/,
		);
	});

	it("keeps the hide rule out of @media screen, so PDF export drops the icon too", () => {
		const { css } = harness();
		const out = css.generateCalloutCSS(definition({ hideIcon: true }));

		// Everything before the first `@media screen` (if any) is all-media. The
		// hide rule has to be in that half — the ::after overrides are the ones
		// that are screen-only, because a baked DOM copy replaces them in print,
		// and here there is nothing to replace them with.
		const allMedia = out.split("@media screen")[0] ?? "";
		assert.ok(
			allMedia.includes("> .callout-icon {\n  display: none;\n}"),
			"hide rule must not be nested inside @media screen",
		);
	});

	it("emits nothing that would paint the icon it just hid", () => {
		const { css } = harness();
		const shown = css.generateCalloutCSS(definition());
		const hidden = css.generateCalloutCSS(definition({ hideIcon: true }));

		assert.match(shown, /--callout-icon:/);
		assert.doesNotMatch(hidden, /--callout-icon:/);
		assert.doesNotMatch(hidden, /callout-icon::after/);
	});

	it("skips the emoji ::after glyph as well", () => {
		const { css } = harness();
		const icon = { type: "emoji" as const, value: "🌵" };
		assert.match(css.generateCalloutCSS(definition({ icon })), /🌵/);
		assert.doesNotMatch(
			css.generateCalloutCSS(definition({ icon, hideIcon: true })),
			/🌵/,
		);
	});

	it("covers every alias, not just the primary id", () => {
		const { css } = harness();
		const out = css.generateCalloutCSS(
			definition({ hideIcon: true, aliases: ["hush", "still"] }),
		);

		for (const id of ["quiet", "hush", "still"]) {
			assert.ok(
				out.includes(
					`.callout[data-callout="${id}"] > .callout-title > .callout-icon {\n  display: none;\n}`,
				),
				`missing hide rule for "${id}"`,
			);
		}
	});
});

describe("hideIcon — the 'Align content with title' indent", () => {
	it("is undone for a no-icon callout, since there is nothing to align past", () => {
		const { registry, css } = harness();
		registry.settings.globalStyle.alignContentWithTitle = true;

		const out = css.generateCalloutCSS(definition({ hideIcon: true }));
		assert.match(
			out,
			/\.callout\[data-callout="quiet"\] > \.callout-content \{\s*padding-inline-start: 0;/,
		);
	});

	it("wins on specificity alone — an !important here would outrank a snippet", () => {
		const { registry, css } = harness();
		registry.settings.globalStyle.alignContentWithTitle = true;

		const out = css.generateCalloutCSS(definition({ hideIcon: true }));
		const reset = out
			.split("\n\n")
			.find((rule) => rule.includes("padding-inline-start: 0"));

		assert.ok(reset, "expected an align reset rule");
		assert.doesNotMatch(reset, /!important/);
	});

	it("is not emitted at all while the global setting is off", () => {
		const { registry, css } = harness();
		registry.settings.globalStyle.alignContentWithTitle = false;

		const out = css.generateCalloutCSS(definition({ hideIcon: true }));
		assert.doesNotMatch(out, /padding-inline-start/);
	});
});

describe("hideIcon — theme-owned callouts", () => {
	it("still emits nothing at all for an external-style callout that keeps its icon", () => {
		const { css } = harness();
		assert.strictEqual(
			css.generateCalloutCSS(definition({ externalStyle: true })),
			"",
		);
	});

	it("makes one exception: the user's explicit 'no icon' is honoured", () => {
		const { css } = harness();
		const out = css.generateCalloutCSS(
			definition({ externalStyle: true, hideIcon: true }),
		);

		// The exception is narrow on purpose — the hide rule and nothing else.
		// A theme cannot express "no icon" for the user, but it must still own
		// every colour, and none of those may reappear here.
		assert.match(out, /display: none;/);
		assert.doesNotMatch(out, /--cs-accent/);
		assert.doesNotMatch(out, /--callout-color/);
		assert.doesNotMatch(out, /background/);
	});
});

describe("hideIcon — the unknown-id fallback", () => {
	const unknownIdRule = (out: string, needle: string): boolean =>
		out
			.split("\n\n")
			.some((rule) => rule.startsWith("body .callout:not(") && rule.includes(needle));

	it("propagates from the fallback template to every unknown callout", () => {
		const { registry, css } = harness();
		const fallback = definition({ id: "note", hideIcon: true });
		registry.settings.fallbackCalloutId = "note";

		const out = css.generateFallbackCSS([fallback]);
		assert.ok(
			unknownIdRule(out, "display: none !important"),
			"expected the fallback chain to hide the icon",
		);
		assert.doesNotMatch(out, /--callout-icon:/);
	});

	it("leaves unknown callouts alone when the template keeps its icon", () => {
		const { registry, css } = harness();
		registry.settings.fallbackCalloutId = "note";

		const out = css.generateFallbackCSS([definition({ id: "note" })]);
		assert.ok(!unknownIdRule(out, "> .callout-icon {"));
		assert.match(out, /--callout-icon:/);
	});
});

describe("hideIcon — persistence vs. colour deference", () => {
	/** The shipped `[!note]`, straight out of the registry's own defaults. */
	function builtInNote(registry: CalloutRegistry): CalloutDefinition {
		const note = registry.get("note");
		assert.ok(note, "expected a built-in [!note]");
		return note;
	}

	it("counts as a modification, so a built-in that only hid its icon is saved", () => {
		const { registry } = harness();
		const note = builtInNote(registry);

		assert.strictEqual(registry.isBuiltInModified("note"), false);
		registry.update("note", { hideIcon: true });
		assert.strictEqual(
			registry.isBuiltInModified("note"),
			true,
			"toSaveData only persists a built-in this reports on",
		);
		assert.ok(note.builtIn);
	});

	it("does NOT count as a colour edit, so the theme keeps deciding the accent", () => {
		const { registry } = harness();
		registry.update("note", { hideIcon: true });
		const note = builtInNote(registry);

		assert.strictEqual(
			registry.isUnmodifiedBuiltIn(note),
			true,
			"hiding an icon must not pin [!note] to a hard-coded hex",
		);
	});

	it("still lets a real colour edit drop the deference", () => {
		const { registry } = harness();
		registry.update("note", { hideIcon: true, colorLight: "#ff0000" });

		assert.strictEqual(
			registry.isUnmodifiedBuiltIn(builtInNote(registry)),
			false,
		);
	});
});
