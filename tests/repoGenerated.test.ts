/**
 * tests/repoGenerated.test.ts — the committed output of the two code
 * generators is what the generators actually produce.
 *
 * Both artefacts are committed, both are consumed as *verified* data, and both
 * fail in the same silent, total way when they drift from their sources:
 *
 * - `locales/*.json` + `src/i18n/localeManifest.ts` — the manifest's SHA-256 is
 *   compiled into `main.js`, and `LocaleStore` refuses a download that does not
 *   match it. A locale edited without regenerating means every download of that
 *   language, for that release, fails verification — for everyone, permanently.
 * - `packs/*.json` + `src/icons/data/*.index.ts` — the same contract, made
 *   worse by jsDelivr caching a tag forever. A pack file edited without a new
 *   tag and new checksums is not a degraded download; it is a download that can
 *   never succeed again.
 *
 * `locales.test.ts` and `iconPackData.test.ts` already check the *second* half
 * of each — that the file on disk hashes to what the compiled manifest expects.
 * That is a different question from the one here, and strictly weaker: it proves
 * the manifest and the file agree with each other, not that either agrees with
 * `src/i18n/*.ts` or with the upstream npm packages. A locale string edited and
 * then regenerated *incorrectly* satisfies both. This suite closes that by
 * re-running the generators and diffing.
 *
 * **They run in a sandbox, and never against the working tree.** Both scripts
 * derive their output directory from their own location and write in place, so
 * running `npm run i18n:generate` from a test would silently repair a drift
 * instead of reporting it — the tree would be clean, the test green, and the
 * commit still wrong. Copying the script and its inputs under `.test-out/`
 * inverts that: nothing the test does can touch a committed file, and the
 * comparison is between two directories rather than between a file and its own
 * past.
 *
 * The one thing borrowed from the real tree is `node_modules`, by symlink —
 * `generate-icon-packs.mjs` reads the upstream icon packages through an explicit
 * `join(ROOT, "node_modules/…")` path rather than by module resolution, so a
 * sandbox without one builds nothing.
 */
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import {
	cpSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	symlinkSync,
} from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PACK_MANIFEST } from "../src/icons/data/packManifest";
import { REPO_ROOT, repoFileExists } from "./support/sourceScan";

const SANDBOX = join(REPO_ROOT, ".test-out", "generator-sandbox");

/**
 * Built once, on the first test that needs it.
 *
 * A lazy function rather than a `before` hook because this project pins
 * `@types/node` at 16, whose `node:test` typings predate the hook exports —
 * and the runtime is Node 20+, so the hook would work and the typecheck in
 * `npm run build` would not.
 */
let sandboxError: string | null = null;
let sandboxBuilt = false;

function buildSandbox(): void {
	if (sandboxBuilt) return;
	sandboxBuilt = true;
	try {
		rmSync(SANDBOX, { recursive: true, force: true });
		mkdirSync(join(SANDBOX, "scripts", "lib"), { recursive: true });
		mkdirSync(join(SANDBOX, "src", "icons", "data"), { recursive: true });

		for (const script of ["generate-locales.mjs", "generate-icon-packs.mjs"]) {
			cpSync(join(REPO_ROOT, "scripts", script), join(SANDBOX, "scripts", script));
		}
		cpSync(
			join(REPO_ROOT, "scripts", "lib", "encodeIndex.mjs"),
			join(SANDBOX, "scripts", "lib", "encodeIndex.mjs"),
		);
		// The icon generator round-trips every index through the *real* decoder
		// before writing it, so the sandbox needs the codec too.
		cpSync(
			join(REPO_ROOT, "src", "icons", "data", "codec.ts"),
			join(SANDBOX, "src", "icons", "data", "codec.ts"),
		);
		// Inputs for the locale generator: the whole directory, because it
		// discovers locales by reading it (and skips the four modules that are
		// machinery rather than a table).
		cpSync(join(REPO_ROOT, "src", "i18n"), join(SANDBOX, "src", "i18n"), {
			recursive: true,
		});
		symlinkSync(
			join(REPO_ROOT, "node_modules"),
			join(SANDBOX, "node_modules"),
			"dir",
		);
	} catch (error) {
		sandboxError = String(error);
	}
}

/** Runs one of the copied generators inside the sandbox. */
function generate(script: string, args: string[] = []): void {
	execFileSync(process.execPath, [join(SANDBOX, "scripts", script), ...args], {
		cwd: SANDBOX,
		stdio: "pipe",
		encoding: "utf8",
	});
}

/** Reads a file from the sandbox and from the repo, and compares the bytes. */
function assertSameFile(relPath: string): void {
	const generated = readFileSync(join(SANDBOX, relPath), "utf8");
	const committed = readFileSync(join(REPO_ROOT, relPath), "utf8");
	if (generated === committed) return;
	// Byte-identical or not is the whole assertion, but a 1 MB diff is useless
	// in a terminal — so point at the first line that differs instead.
	const a = generated.split("\n");
	const b = committed.split("\n");
	const i = a.findIndex((line, k) => line !== b[k]);
	assert.fail(
		`${relPath} is not what the generator produces.\n` +
			`  first difference at line ${i + 1}\n` +
			`  generated: ${(a[i] ?? "<eof>").slice(0, 120)}\n` +
			`  committed: ${(b[i] ?? "<eof>").slice(0, 120)}\n` +
			`  (${committed.length} committed bytes vs ${generated.length} generated)`,
	);
}

function requireSandbox(): void {
	buildSandbox();
	assert.strictEqual(
		sandboxError,
		null,
		`could not build the generator sandbox: ${sandboxError}`,
	);
}

/* -------------------------------------------------------------------------- */
/* 151 — npm run i18n:generate                                                */
/* -------------------------------------------------------------------------- */

describe("i18n:generate output is committed", () => {
	it("regenerates every locale file byte-for-byte", () => {
		requireSandbox();
		generate("generate-locales.mjs");

		const generated = readdirSync(join(SANDBOX, "locales")).sort();
		const committed = readdirSync(join(REPO_ROOT, "locales")).sort();
		assert.deepStrictEqual(
			generated,
			committed,
			"the set of locale files changed — a language was added to or removed from src/i18n/ without regenerating",
		);
		assert.ok(generated.length > 0, "the generator produced nothing");

		for (const file of generated) assertSameFile(join("locales", file));
	});

	it("regenerates localeManifest.ts byte-for-byte", () => {
		requireSandbox();
		// Written by the same run as the files above; this is the half that is
		// compiled into main.js, so a stale one fails every download rather
		// than one.
		assertSameFile(join("src", "i18n", "localeManifest.ts"));
	});
});

/* -------------------------------------------------------------------------- */
/* 152 — npm run icons:generate                                               */
/* -------------------------------------------------------------------------- */

describe("icons:generate output is committed", () => {
	/**
	 * The packs with a downloadable artwork file — i.e. everything except
	 * Material Symbols, whose 100,000-plus style/weight variants are fetched one
	 * drawing at a time and so have only an index.
	 *
	 * Driven off `PACK_MANIFEST` rather than a second literal list, so a new
	 * pack is covered the moment it has a manifest entry.
	 */
	const FILE_BACKED = Object.keys(PACK_MANIFEST).sort();

	it("has a pack to check", () => {
		assert.ok(FILE_BACKED.length >= 7, `only ${FILE_BACKED.length} packs found`);
	});

	it("regenerates every pack file and search index byte-for-byte", () => {
		// ~3 seconds: it re-reads and re-encodes roughly four megabytes of
		// upstream path data. That is the price of catching a hand-edited pack
		// file, which is a defect no download can recover from.
		requireSandbox();
		generate(
			"generate-icon-packs.mjs",
			FILE_BACKED.map((id) => `--pack=${id}`),
		);
		for (const id of FILE_BACKED) {
			assertSameFile(join("packs", `${id}.json`));
			assertSameFile(join("src", "icons", "data", `${id}.index.ts`));
		}
	});

	/**
	 * Marked `todo`, and that is a statement about the repository, not about
	 * this test: **`npm run icons:generate` cannot run today.**
	 *
	 * Material has no pack file, so it sits outside the loop above — and it is
	 * the one builder whose input is not an npm package but a table that used to
	 * live here. `src/data/materialIconsMetadata.ts` was deleted in 078536a
	 * ("perf(icons): pack the Material Symbols index"), which committed the
	 * packed index and removed the 2.24 MB source it was built from.
	 * `buildMaterial()` was never updated, so the script throws
	 * MODULE_NOT_FOUND on that path — and because `main()` builds every pack in
	 * one pass with Material first, that failure takes *all eight* packs down,
	 * not just this one. The committed data is fine; the path back to
	 * regenerating it is not.
	 *
	 * `todo` keeps the finding printed on every run without holding CI hostage
	 * to a pre-existing break. Delete the option once the generator can read
	 * `src/icons/data/material.index.ts` back through the codec (or the table is
	 * restored) — from then on it guards for real.
	 */
	it("the Material Symbols index can still be regenerated", { todo: "npm run icons:generate is broken — buildMaterial() reads a file deleted in 078536a" }, () => {
		requireSandbox();
		assert.ok(
			repoFileExists("src/data/materialIconsMetadata.ts"),
			"scripts/generate-icon-packs.mjs reads src/data/materialIconsMetadata.ts, which is not in the repository — so `npm run icons:generate` cannot run at all. Either restore the table, or teach buildMaterial() to read src/icons/data/material.index.ts back through the codec.",
		);
		generate("generate-icon-packs.mjs", ["--pack=material"]);
		assertSameFile(join("src", "icons", "data", "material.index.ts"));
	});

	it("every generated index names the pack it belongs to", () => {
		// Cheap, and independent of the sandbox: the generator stamps the
		// upstream version into each file's header, and a copy-pasted index
		// (a real hazard with eight near-identical generated files) shows up
		// here rather than as the wrong icons in the picker.
		for (const id of FILE_BACKED) {
			const source = readFileSync(
				join(REPO_ROOT, "src", "icons", "data", `${id}.index.ts`),
				"utf8",
			);
			const constant = `${id.replace(/-/g, "_").toUpperCase()}_INDEX`;
			assert.ok(
				source.includes(`export const ${constant}`),
				`${id}.index.ts does not export ${constant}`,
			);
			assert.ok(
				source.includes(`--pack=${id}`),
				`${id}.index.ts's header points at a different pack`,
			);
		}
	});
});
