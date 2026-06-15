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
		files: ["src/**/*.ts"],
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
	globalIgnores([
		"node_modules",
		"dist",
		"scripts",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
