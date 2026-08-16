/**
 * tests/publicApiContract.test.ts — the shape of the API, rather than what it
 * answers.
 *
 * API.md is the contract other plugins are told to code against, and nothing
 * else in the build checks it against the class. Two things can drift silently:
 *
 * - **A sixth member.** The surface is five members and is meant to stay five.
 *   The `registerCallout`/`unregisterCallout` pair that used to sit here was
 *   removed rather than fixed — it had no ownership model and leaked
 *   `source: "plugin"` rows into `data.json` forever — and the only thing
 *   stopping the next one is somebody noticing. So the whole reachable surface
 *   is enumerated here, and *anything* new fails this suite until a person
 *   decides whether it belongs.
 * - **`version` against the document that explains it.** `1` is written into
 *   the class, the header line of API.md and its stability section, and a
 *   consumer feature-detects on it. Three copies of one number.
 *
 * Note what "reachable" means below. `private` is a TypeScript keyword, not a
 * runtime one: a parameter property compiles to `this.plugin = plugin` and a
 * private method to a plain prototype method, so both are readable by any
 * consumer holding the api object. They are listed explicitly rather than
 * filtered away by a naming rule, so the list stays a decision somebody made.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { apiHarness } from "./support/apiHarness";

const API_DOC = readFileSync(join(process.cwd(), "API.md"), "utf8");
const MANIFEST = JSON.parse(
	readFileSync(join(process.cwd(), "manifest.json"), "utf8"),
) as { id: string };

/** The five members API.md declares, and the only five it may declare. */
const DOCUMENTED = [
	"getCallout",
	"getCallouts",
	"getCalloutsDetailed",
	"onChange",
	"version",
];

/**
 * Members that exist at runtime because TypeScript's `private` is erased.
 *
 * `plugin` is the constructor's parameter property; `usableDefinitions` is the
 * private list builder. Neither is documented, neither is API, and neither may
 * grow a third sibling without this test saying so.
 */
const TS_PRIVATE_INTERNALS = ["plugin", "usableDefinitions"];

/** Every property name a consumer can read off the api object. */
function reachableSurface(api: object): string[] {
	const names = new Set(Object.getOwnPropertyNames(api));
	for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(api))) {
		if (name !== "constructor") names.add(name);
	}
	return [...names].sort();
}

/* -------------------------------------------------------------------------- */
/* 101 — exactly five members                                                 */
/* -------------------------------------------------------------------------- */

describe("the API surface", () => {
	it("exposes the five documented members", () => {
		const { api } = apiHarness();
		for (const name of DOCUMENTED) {
			assert.ok(name in api, `${name} is missing from the api object`);
		}
	});

	it("gives each one the documented kind and arity", () => {
		const { api } = apiHarness();
		assert.equal(typeof api.version, "number");
		assert.equal(typeof api.getCallouts, "function");
		assert.equal(typeof api.getCalloutsDetailed, "function");
		assert.equal(typeof api.getCallout, "function");
		assert.equal(typeof api.onChange, "function");
		assert.equal(api.getCallouts.length, 0);
		assert.equal(api.getCalloutsDetailed.length, 0);
		assert.equal(api.getCallout.length, 1);
		assert.equal(api.onChange.length, 1);
	});

	it(
		"exposes exactly those five and nothing else",
		{
			todo: "`private` is erased — `plugin` and `usableDefinitions` ship on the object",
		},
		() => {
			// The contract as written. It does not hold: TypeScript's `private`
			// is a compile-time keyword, so the constructor's parameter property
			// and the private list builder are both ordinary runtime members.
			const { api } = apiHarness();
			assert.deepStrictEqual(reachableSurface(api), [...DOCUMENTED].sort());
		},
	);

	it(
		"hands out no live handle on the plugin",
		{ todo: "`api.plugin.registry` is the whole store, unfrozen and writable" },
		() => {
			// The consequence, and why the member count is worth caring about.
			// PluginAPI.ts exists to make sure nothing live escapes: every
			// return value is a frozen copy precisely because a consumer holding
			// a real definition could change styling with no re-inject and no
			// save. `api.plugin` hands over all of them at once, plus
			// `registry.update()`, `remove()` and `settings`.
			const { api } = apiHarness();
			assert.equal(
				(api as unknown as Record<string, unknown>).plugin,
				undefined,
			);
		},
	);

	it("has grown no member since the surface was last reviewed", () => {
		// The guard that actually runs green, so a sixth member arriving is a
		// red suite rather than a shrug. If this fails because something was
		// added on purpose, add it to API.md and to DOCUMENTED — or to
		// TS_PRIVATE_INTERNALS if it is genuinely internal — and say which in
		// the commit message.
		const { api } = apiHarness();
		assert.deepStrictEqual(
			reachableSurface(api),
			[...DOCUMENTED, ...TS_PRIVATE_INTERNALS].sort(),
		);
	});

	it("exposes no way to mutate anything", () => {
		// Every name API.md's "deliberately not exposed" table rules out, plus
		// the two that were actually shipped once and taken back.
		const { api } = apiHarness();
		const forbidden = [
			"registerCallout",
			"unregisterCallout",
			"addCallout",
			"createCallout",
			"updateCallout",
			"removeCallout",
			"deleteCallout",
			"setCallout",
			"registry",
			"openEditor",
			"openIconPicker",
			"wrapSelection",
			"unwrapSelection",
			"getIconSvg",
		];
		for (const name of forbidden) {
			assert.ok(!(name in api), `${name} must not be on the API`);
		}
	});

	it("keeps the four methods on the prototype, not per instance", () => {
		// One shared object, so two `api` handles behave identically and a
		// consumer cannot shadow a method for everybody else. `version` is the
		// only documented member that is an own data property.
		const { api } = apiHarness();
		const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(api));
		const own = Object.getOwnPropertyNames(api);
		for (const name of [
			"getCallouts",
			"getCalloutsDetailed",
			"getCallout",
			"onChange",
		]) {
			assert.ok(proto.includes(name), `${name} is not on the prototype`);
			assert.ok(!own.includes(name), `${name} was copied onto the instance`);
		}
		assert.ok(own.includes("version"));
	});
});

/* -------------------------------------------------------------------------- */
/* 100 — version                                                              */
/* -------------------------------------------------------------------------- */

describe("version", () => {
	it("is 1", () => {
		const { api } = apiHarness();
		assert.equal(api.version, 1);
		assert.ok(Number.isInteger(api.version));
	});

	it("does not move when callouts do", () => {
		// It is the contract's version, not the data's. Nothing a user does may
		// change it, or feature detection stops meaning anything.
		const { api, registry } = apiHarness();
		const before = api.version;
		registry.add({
			id: "quiet",
			displayName: "Quiet",
			icon: { type: "lucide", value: "pencil" },
			colorLight: "#336699",
			colorDark: "#88bbee",
			foldable: false,
			defaultFolded: false,
			builtIn: false,
			source: "user",
		});
		registry.remove("quiet");
		assert.equal(api.version, before);
	});

	it("matches the number in API.md's header line", () => {
		const { api } = apiHarness();
		const match = /\*\*API version:\s*(\d+)\*\*/.exec(API_DOC);
		assert.ok(match, "API.md no longer states an API version");
		assert.equal(Number(match[1]), api.version);
	});

	it("matches the number in API.md's stability section", () => {
		const { api } = apiHarness();
		const match = /Version `(\d+)` guarantees/.exec(API_DOC);
		assert.ok(match, "API.md no longer has a stability guarantee");
		assert.equal(Number(match[1]), api.version);
	});
});

describe("API.md describes the object that actually ships", () => {
	it("declares exactly the five members, and no others", () => {
		// The interface in API.md is what consumers copy into their own project
		// — there is no published .d.ts — so a member that exists in one place
		// and not the other is a compile error in somebody else's plugin.
		const block = /export interface CalloutStudioApi \{([\s\S]*?)\n\}/.exec(
			API_DOC,
		);
		assert.ok(block, "API.md no longer declares CalloutStudioApi");
		const declared = [...(block[1] ?? "").matchAll(/^\t(?:readonly\s+)?(\w+)/gm)]
			.map((m) => m[1] as string)
			.sort();
		assert.deepStrictEqual(declared, [...DOCUMENTED].sort());
	});

	it("names the plugin id manifest.json really registers", () => {
		// The id is the vault folder name and the community-plugin registry key,
		// so API.md's `app.plugins.plugins[...]` lookup is only correct while
		// the two agree — and the id can never change to make them agree later.
		const stated = /Plugin id: `([^`]+)`/.exec(API_DOC);
		assert.ok(stated, "API.md no longer states the plugin id");
		assert.equal(stated[1], MANIFEST.id);
		assert.ok(
			API_DOC.includes(`app.plugins.plugins["${MANIFEST.id}"]`),
			"the getting-the-handle snippet looks up a different id",
		);
	});
});
