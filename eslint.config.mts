import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const obsidianRecommended = (() => {
	const recommended = obsidianmd.configs?.recommended;
	if (!recommended) {
		return [];
	}

	if (Array.isArray(recommended)) {
		return recommended;
	}

	if (
		typeof (recommended as { [Symbol.iterator]?: unknown })[
			Symbol.iterator
		] === "function"
	) {
		return Array.from(recommended as Iterable<unknown>);
	}

	return [];
})();

export default tseslint.config(
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
				projectService: {
					allowDefaultProject: ["eslint.config.js", "manifest.json"],
				},
				tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
				extraFileExtensions: [".json"],
			},
		},
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...(obsidianRecommended as any[]),
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"eslint.config.mts",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
