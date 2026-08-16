/**
 * utils/settingsMerge.ts — rebuilding `PluginSettings` from saved or imported
 * data.
 *
 * One responsibility, and not the registry's: `mergeSavedSettings` answers
 * "what does this possibly-partial, possibly-ancient settings blob mean under
 * the current version", which the registry's `load()` asks on startup and
 * `settingsValidator` asks of every import file. It lived inside
 * `manager/CalloutRegistry.ts` for as long as the registry was its only caller;
 * it has had its own test file (`tests/settingsMerge.test.ts`) for far longer
 * than that.
 *
 * Every field is merged explicitly against `DEFAULT_SETTINGS` — a new settings
 * field MUST be handled here (and added to `DEFAULT_SETTINGS`) or it will be
 * silently dropped on load.
 */
import type {
	ContextMenuItemConfig,
	ContextMenuItemId,
	ContextMenuSettings,
	HeadingFrameStyleSettings,
	IconSourceSettings,
	LegacyPopupSettings,
	PluginSettings,
} from "../types";
import { DEFAULT_CONTEXT_MENU_ITEMS, DEFAULT_SETTINGS } from "../constants";
import { sanitizeCustomPalettes } from "./colorPalettes";
import { clampGlobalStyle, localePreference } from "./settingsGuards";
import { sanitizeUserImages } from "./userImages";
import { sanitizeCustomCommands } from "./customCommands";

/**
 * Merge saved icon-picker state over the defaults, folding the pre-2.4
 * `lastMaterialCategory` into `lastCategory`, which is keyed by icon source
 * now that there is more than one source with categories.
 */
function mergeIconSources(
	saved: Partial<IconSourceSettings> | undefined,
): IconSourceSettings {
	const merged: IconSourceSettings = {
		...DEFAULT_SETTINGS.iconSources,
		...saved,
	};
	const legacyCategory = saved?.lastMaterialCategory;
	if (legacyCategory) {
		merged.lastCategory = {
			...merged.lastCategory,
			material: legacyCategory,
		};
	}
	delete merged.lastMaterialCategory;
	return merged;
}

export type LegacySavedSettings = Partial<PluginSettings> & {
	popup?: Partial<LegacyPopupSettings>;
	contextMenu?: Partial<ContextMenuSettings>;
};

/** Saved heading frame style, plus fields removed by a later version. */
type LegacyHeadingStyle = Partial<HeadingFrameStyleSettings> & {
	/** The "Icon indent" slider (px start inset), removed in 2.7.0. */
	paddingStart?: number;
};

/**
 * Merge a saved heading frame style over the defaults. Needs its own helper
 * rather than a plain spread inside mergeSavedSettings because a spread keeps
 * keys the current version knows nothing about — and settings are written back
 * wholesale by both `toSaveData()` and `exportToJSONv2()`, so a stale key would
 * otherwise be re-saved forever and copied into every new export file. Deleting
 * it here is what makes settingsValidator's "unknown fields are dropped"
 * promise true for nested role styles too (same pattern as mergeIconSources's
 * `lastMaterialCategory`).
 */
function mergeHeadingStyle(
	saved: LegacyHeadingStyle | undefined,
): HeadingFrameStyleSettings {
	const merged: LegacyHeadingStyle = {
		...DEFAULT_SETTINGS.globalStyle.heading,
		...saved,
		borderSides: {
			...DEFAULT_SETTINGS.globalStyle.heading.borderSides,
			...(saved?.borderSides as Record<string, boolean> | undefined),
		},
	};
	// The bar's start inset is a static 10px in styles.css now; nothing reads
	// a saved value, so drop it instead of carrying it around inert.
	delete merged.paddingStart;
	return merged as HeadingFrameStyleSettings;
}

/**
 * Merges a saved per-role menu item list against that role's defaults:
 * keeps the user's order, drops unknown ids and duplicates, and appends
 * items introduced by newer plugin versions at the end. Tolerates arbitrary
 * junk (saved data and import files are untrusted).
 */
function mergeMenuItems(
	saved: unknown,
	defaults: ContextMenuItemConfig[],
): ContextMenuItemConfig[] {
	const knownIds = new Set<string>(defaults.map((d) => d.id));
	const merged: ContextMenuItemConfig[] = [];
	if (Array.isArray(saved)) {
		for (const entry of saved) {
			if (!entry || typeof entry !== "object") continue;
			const id = (entry as { id?: unknown }).id;
			if (typeof id !== "string" || !knownIds.has(id)) continue;
			if (merged.some((m) => m.id === id)) continue;
			merged.push({
				id: id as ContextMenuItemId,
				enabled: (entry as { enabled?: unknown }).enabled !== false,
			});
		}
	}
	for (const def of defaults) {
		if (!merged.some((m) => m.id === def.id)) merged.push({ ...def });
	}
	return merged;
}

/**
 * Rebuilds a complete PluginSettings object from possibly-partial/legacy
 * saved data. Every field is merged explicitly against DEFAULT_SETTINGS —
 * a new settings field MUST be handled here (and added to DEFAULT_SETTINGS)
 * or it will be silently dropped on load. Shared by the registry loader and
 * the settings importer (import/export v2).
 */
export function mergeSavedSettings(
	savedSettings: LegacySavedSettings,
): PluginSettings {
	const savedGlobal = savedSettings.globalStyle as
		Partial<PluginSettings["globalStyle"]> | undefined;
	const legacyPopup = savedSettings.popup;
	const savedMenuItems = savedSettings.contextMenu?.items;
	return {
		globalStyle: clampGlobalStyle({
			...DEFAULT_SETTINGS.globalStyle,
			...savedGlobal,
			// Ensure borderSides is always a proper object
			borderSides: {
				...DEFAULT_SETTINGS.globalStyle.borderSides,
				...(savedGlobal?.borderSides as
					| Record<string, boolean>
					| undefined),
			},
			// Nested role frame styles need their own deep merge — a spread of
			// savedGlobal would replace them wholesale (dropping fields added
			// in newer versions) or leave them undefined on legacy data.
			heading: mergeHeadingStyle(savedGlobal?.heading),
			inline: {
				...DEFAULT_SETTINGS.globalStyle.inline,
				...savedGlobal?.inline,
				borderSides: {
					...DEFAULT_SETTINGS.globalStyle.inline.borderSides,
					...(savedGlobal?.inline?.borderSides as
						| Record<string, boolean>
						| undefined),
				},
			},
		}),
		contextMenu: {
			enabled:
				savedSettings.contextMenu?.enabled ??
				legacyPopup?.enabled ??
				DEFAULT_SETTINGS.contextMenu.enabled,
			items: {
				regular: mergeMenuItems(
					savedMenuItems?.regular,
					DEFAULT_CONTEXT_MENU_ITEMS.regular,
				),
				heading: mergeMenuItems(
					savedMenuItems?.heading,
					DEFAULT_CONTEXT_MENU_ITEMS.heading,
				),
				inline: mergeMenuItems(
					savedMenuItems?.inline,
					DEFAULT_CONTEXT_MENU_ITEMS.inline,
				),
			},
		},
		autocomplete: {
			enabled:
				savedSettings.autocomplete?.enabled ??
				DEFAULT_SETTINGS.autocomplete.enabled,
		},
		iconSources: mergeIconSources(savedSettings.iconSources),
		headingCallouts: {
			enabled:
				savedSettings.headingCallouts?.enabled ??
				DEFAULT_SETTINGS.headingCallouts.enabled,
			// Outline/link cleaning + icons are always on and no longer
			// user-configurable; ignore any saved-off value from old data.
			refCleanTitles: true,
			refShowIcon: true,
			showFoldArrow:
				savedSettings.headingCallouts?.showFoldArrow ??
				DEFAULT_SETTINGS.headingCallouts.showFoldArrow,
		},
		inlineCallouts: {
			enabled:
				savedSettings.inlineCallouts?.enabled ??
				DEFAULT_SETTINGS.inlineCallouts.enabled,
			allowContent:
				savedSettings.inlineCallouts?.allowContent ??
				DEFAULT_SETTINGS.inlineCallouts.allowContent,
		},
		firstRunCompleted:
			savedSettings.firstRunCompleted ??
			DEFAULT_SETTINGS.firstRunCompleted,
		welcomeSeen:
			savedSettings.welcomeSeen ?? DEFAULT_SETTINGS.welcomeSeen,
		fallbackCalloutId:
			savedSettings.fallbackCalloutId ??
			DEFAULT_SETTINGS.fallbackCalloutId,
		language: localePreference(savedSettings.language),
		customPalettes: sanitizeCustomPalettes(savedSettings.customPalettes),
		userImages: sanitizeUserImages(savedSettings.userImages),
		customCommands: sanitizeCustomCommands(savedSettings.customCommands),
		disabledFixedCommands: Array.isArray(savedSettings.disabledFixedCommands)
			? [
					...new Set(
						savedSettings.disabledFixedCommands.filter(
							(id): id is string => typeof id === "string",
						),
					),
				]
			: [],
	};
}
