/**
 * tests/repoTestGate.test.ts — where the suites sit relative to the build.
 *
 * `tsconfig.json` includes `tests/**` as well as `src/**`, so `tsc -noEmit` in
 * `npm run build` typechecks the suites. Both `CLAUDE.md` and
 * `scripts/run-tests.mjs` used to say the opposite — that tests live outside
 * `src/` precisely so they stay out of that gate — and a reader who believed it
 * would draw two wrong conclusions: that a broken test signature is a test-only
 * problem (it fails the build), and that a test file may use whatever syntax
 * Node accepts (it may not — `target: ES6` has no top-level `await`).
 *
 * A doc sentence cannot be checked directly, so this suite checks the two facts
 * the sentence is about, reading `tsconfig.json` and `package.json` rather than
 * restating them, and then refuses the retired claims by name. The last suite is
 * the ratchet that makes the syntax half real: no test file may rely on
 * top-level `await` while the target forbids it.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { readRepoJson, readRepoFile, testSourceFiles } from "./support/sourceScan";

interface TsConfig {
	compilerOptions?: { target?: string };
	include?: string[];
}

interface PackageJson {
	scripts?: Record<string, string>;
}

const tsconfig = readRepoJson<TsConfig>("tsconfig.json");
const pkg = readRepoJson<PackageJson>("package.json");

/* -------------------------------------------------------------------------- */
/* The gate                                                                   */
/* -------------------------------------------------------------------------- */

describe("the suites are inside the build's typecheck", () => {
	it("tsconfig includes the tests tree", () => {
		const include = tsconfig.include ?? [];
		assert.ok(
			include.some((glob) => glob.startsWith("tests/")),
			`tsconfig.json's include is ${JSON.stringify(include)} — with the ` +
				"tests tree out of it, every suite silently stops being typechecked " +
				"and the docs describing this gate become wrong again",
		);
	});

	it("the build is what runs that typecheck", () => {
		// The include only gates anything because `npm run build` compiles.
		assert.match(pkg.scripts?.build ?? "", /tsc\s+-{1,2}noEmit/);
	});

	it("the suites have a command of their own", () => {
		assert.match(pkg.scripts?.test ?? "", /run-tests\.mjs/);
	});
});

/* -------------------------------------------------------------------------- */
/* The retired claims                                                          */
/* -------------------------------------------------------------------------- */

describe("no document claims otherwise", () => {
	/**
	 * Sentences that were true once and are not now. Named literally, because
	 * that is the only form a stale claim has — there is nothing to derive it
	 * from, and the whole failure mode is that it reads perfectly well.
	 */
	const RETIRED = [
		{
			file: "CLAUDE.md",
			phrase: "No automated test suite",
			since: "there are ~90 suites and `npm test` runs them",
		},
		{
			file: "scripts/run-tests.mjs",
			phrase: "would join the `tsc -noEmit` gate",
			since: "they already have — the tests tree is in `include`",
		},
	];

	for (const { file, phrase, since } of RETIRED) {
		it(`${file} no longer says "${phrase}"`, () => {
			assert.ok(
				!readRepoFile(file).includes(phrase),
				`${file} still says "${phrase}", which stopped being true: ${since}`,
			);
		});
	}

	it("CLAUDE.md names the command that runs them", () => {
		// The reason the stale sentence mattered: it was the only thing that file
		// said about testing, so a reader concluded there was nothing to run.
		assert.ok(readRepoFile("CLAUDE.md").includes("npm test"));
	});
});

/* -------------------------------------------------------------------------- */
/* Top-level await                                                             */
/* -------------------------------------------------------------------------- */

describe("no suite relies on top-level await", () => {
	/**
	 * Targets that can emit a top-level `await`. Below these, TypeScript rejects
	 * one outright — so the rule here is the target's, not this suite's, and it
	 * lifts by itself the day the target moves.
	 */
	const TOP_LEVEL_AWAIT_TARGETS = ["es2017", "es2018", "es2019", "es2020", "es2021", "es2022", "es2023", "es2024", "esnext"];

	const target = (tsconfig.compilerOptions?.target ?? "").toLowerCase();
	const allowed = TOP_LEVEL_AWAIT_TARGETS.includes(target);

	/**
	 * `await` at column 0 in a file whose comments and string bodies are already
	 * blanked. Everything nested sits under at least one tab in this codebase, so
	 * column 0 is a good enough stand-in for brace depth 0 — and it cannot be
	 * fooled by the word appearing inside a comment or a test name.
	 */
	const TOP_LEVEL_AWAIT_RE = /^(?:await\b|(?:const|let|var)\s[^=\n]*=\s*await\b)/m;

	it("none of them does", () => {
		if (allowed) return; // the target grew up; nothing to enforce
		const offenders = testSourceFiles()
			.filter((f) => TOP_LEVEL_AWAIT_RE.test(f.code))
			.map((f) => f.path);
		assert.deepStrictEqual(
			offenders,
			[],
			`These test files use top-level \`await\`, which target "${target}" ` +
				"cannot emit — `npm run build` fails on them even though `npm test` " +
				`passes:\n  ${offenders.join("\n  ")}\n` +
				"Await inside the test body instead.",
		);
	});

	it("and the scan is looking at something", () => {
		// An empty file list would make the assertion above pass for free.
		assert.ok(testSourceFiles().length > 50);
	});
});
