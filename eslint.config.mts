import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

export default tseslint.config(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...(obsidianmd.configs.recommended as any[]),
	{
		files: ["src/**/*.ts", "tests/**/*.ts"],
		languageOptions: {
			globals: {
				...globals.browser,
				// Obsidian global helpers (declared in obsidian.d.ts)
				activeWindow: "readonly",
				activeDocument: "readonly",
				createEl: "readonly",
				createDiv: "readonly",
				createSpan: "readonly",
				createFragment: "readonly",
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
			},
		},
	},
	{
		// The recommended config lints package.json/manifest.json (for
		// validate-manifest) but leaves them without a TS parser. Parse them so
		// the manifest rules can run, and turn off the type-aware obsidianmd
		// rules here — they require type info that JSON files don't have, and are
		// irrelevant to JSON anyway (otherwise they crash, see block scoped
		// `files: undefined` in the recommended config).
		files: ["package.json", "manifest.json"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: { extraFileExtensions: [".json"] },
		},
		rules: {
			"obsidianmd/no-plugin-as-component": "off",
			"obsidianmd/no-unsupported-api": "off",
			"obsidianmd/no-view-references-in-plugin": "off",
			"obsidianmd/prefer-file-manager-trash-file": "off",
			"obsidianmd/prefer-instanceof": "off",
		},
	},
	{
		// Tests run in Node, never in Obsidian — `npm test` bundles them
		// separately and nothing here reaches main.js. The mobile-availability
		// rule is about shipped plugin code, so it is scoped off here rather
		// than suppressed per-import (obsidianmd/* disables are blocked by
		// eslint-comments/no-restricted-disable, and rightly so for src/).
		files: ["tests/**/*.ts"],
		// Node globals for the same reason: a test that reads a generated file
		// off disk needs `process.cwd()`, which the browser globals above do
		// not cover.
		languageOptions: { globals: { ...globals.node } },
		rules: {
			"obsidianmd/no-nodejs-modules": "off",
			// A fake vault adapter has to be handed *some* config folder, and the
			// literal is the point: the assertion is that a pack lands under the
			// folder it was given. Nothing here reads a real vault.
			"obsidianmd/hardcoded-config-path": "off",
			// `window` and `activeWindow` are what a *plugin* must use; a test
			// runs in Node, where the only realm there is is `globalThis`.
			"obsidianmd/no-global-this": "off",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"scripts",
		// Bundled test output (npm test) — generated, and a copy of tests/.
		".test-out",
		"esbuild.config.mjs",
		"eslint.config.js",
		"eslint.config.mts",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
