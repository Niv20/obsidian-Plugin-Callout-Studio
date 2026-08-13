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
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

// Minimal `obsidian` stand-in. Anything a test actually exercises should be
// pure; this exists so a transitive import doesn't fail the bundle.
const stubDir = mkdtempSync(path.join(tmpdir(), "cs-test-stub-"));
const obsidianStub = path.join(stubDir, "obsidian.js");
writeFileSync(
	obsidianStub,
	`export const Platform = { isMobile: false, isDesktop: true, isMacOS: false };
export class TFile {}
export class Plugin {}
export class Notice {}
export class Component {}
export class Modal {}
export class MarkdownRenderer { static render() { return Promise.resolve(); } }
export function setIcon() {}
export function getIconIds() { return []; }
export function normalizePath(p) { return p; }
export function requestUrl() { return Promise.reject(new Error("no network in tests")); }
export function requireApiVersion() { return true; }
export const Keymap = { isModEvent: () => false };
`,
);

rmSync(outDir, { recursive: true, force: true });

try {
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
} finally {
	rmSync(stubDir, { recursive: true, force: true });
}

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
