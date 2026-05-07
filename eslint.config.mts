import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

export default tseslint.config(
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			globals: {
				...globals.browser,
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
	...(obsidianmd.configs?.recommended
		? ([obsidianmd.configs.recommended].flat() as any[])
		: []),
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
