/**
 * scripts/run-tests.mjs — `npm test`.
 *
 * Bundles every `tests/*.test.ts` with esbuild (already a devDependency, and
 * already how main.js is built) into `.test-out/`, then hands the directory to
 * Node's built-in test runner.
 *
 * The bundle step is not ceremony. Two things rule out running the TypeScript
 * directly under `node --test --experimental-strip-types`:
 *
 * - `tsconfig.json` uses `moduleResolution: "bundler"`, so the whole codebase
 *   imports without file extensions (`../utils/calloutId`). Node's ESM resolver
 *   requires them, and the flag that used to relax that was removed in Node 20.
 * - Some modules under test transitively import `obsidian`, which only exists
 *   inside the app. esbuild's `alias` swaps in the stub below instead.
 *
 * Tests live in `tests/` rather than `src/` on purpose: `tsconfig.json` includes
 * `src/**\/*.ts`, so a test file there would join the `tsc -noEmit` gate in
 * `npm run build` and drag `node:test` typings into the shipping typecheck.
 */
import { build } from "esbuild";
import { spawn } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testDir = path.join(root, "tests");
const outDir = path.join(root, ".test-out");

const entryPoints = readdirSync(testDir)
	.filter((f) => f.endsWith(".test.ts"))
	.map((f) => path.join(testDir, f));

if (entryPoints.length === 0) {
	console.error("No tests found in tests/");
	process.exit(1);
}

// Minimal `obsidian` stand-in — see tests/support/obsidianStub.ts, which
// documents what is in it and why. It lives in `tests/` rather than being
// written out here as a string because it has to import `@codemirror/state`
// (`editorLivePreviewField` must be a real StateField), and a file in
// `os.tmpdir()` cannot resolve this project's node_modules.
const obsidianStub = path.join(testDir, "support", "obsidianStub.ts");

rmSync(outDir, { recursive: true, force: true });

await build({
	entryPoints,
	outdir: outDir,
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node20",
	sourcemap: "inline",
	logLevel: "warning",
	alias: { obsidian: obsidianStub },
});

// Explicit file list rather than `--test <dir>` or a glob. The directory form
// silently refuses this output: Node's test walker skips dot-prefixed
// directories, then falls back to treating `.test-out` as a single test *file*
// and fails to require it. Glob arguments only landed in Node 22, and CI also
// builds on 20. Naming every file avoids all three.
const bundled = entryPoints.map((f) =>
	path.join(outDir, path.basename(f).replace(/\.ts$/, ".js")),
);
const child = spawn(process.execPath, ["--test", ...bundled], {
	stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 1));
