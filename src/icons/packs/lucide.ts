/**
 * icons/packs/lucide.ts — Obsidian's built-in icon set.
 *
 * The only pack with no data of its own: Obsidian ships both the list
 * (`getIconIds`) and the artwork (`setIcon`), so there is nothing to bundle,
 * nothing to download and nothing to cache. Third-party plugins can register
 * their own ids at runtime, which is why the index is read fresh every time
 * rather than memoized.
 */
import { getIconIds } from "obsidian";
import type { IconEntry, IconIndex, IconPack } from "../types";

export const lucidePack: IconPack = {
	id: "lucide",
	kind: "builtin",
	labelKey: "iconPicker.lucide",
	searchPlaceholderKey: "iconPicker.searchLucide",
	hasCategories: false,

	attribution: {
		title: "Lucide",
		homepage: "https://lucide.dev",
		version: "bundled with Obsidian",
		licenses: [
			{
				name: "ISC License",
				spdx: "ISC",
				url: "https://lucide.dev/license",
				holder: "Lucide Contributors",
			},
			{
				name: "MIT License",
				spdx: "MIT",
				url: "https://github.com/feathericons/feather/blob/main/LICENSE",
				holder: "Cole Bemis",
				scope: "icons derived from Feather",
			},
		],
	},

	loadIndex(): Promise<IconIndex> {
		const entries: IconEntry[] = getIconIds().map((name) => ({
			name,
			categories: [],
			keywords: [],
		}));
		return Promise.resolve({ entries, categories: [] });
	},

	makeIcon(entry: IconEntry) {
		return { type: "lucide" as const, value: entry.name };
	},

	cacheVariant(): string {
		return "";
	},
};
