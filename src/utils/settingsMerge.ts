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
 *
 * "Explicitly" reaches all the way down, and has to. The nested sections used
 * to be built by spreading the saved object over the defaults, which is total
 * in *shape* and blind to anything extra the file carried: a key the current
 * version knows nothing about rode straight through, and since settings are
 * written back wholesale by both `toSaveData()` and `exportToJSONv2()`, it was
 * then re-saved forever and copied into every export file made afterwards.
 * Retiring a field by `delete`ing it by name only worked for the one field
 * anybody remembered to name. Naming the fields that *stay* is what makes
 * `settingsValidator`'s "unknown fields are dropped" promise true at depth.
 */
import type {
	BorderSidesSettings,
	ContextMenuItemConfig,
	ContextMenuItemId,
	ContextMenuSettings,
	GlobalStyleSettings,
	HeadingFrameStyleSettings,
	IconSourceSettings,
	InlineFrameStyleSettings,
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
 *
 * Field by field rather than `{...defaults, ...saved}` for the reason spelled
 * out on {@link mergeSavedSettings}: a spread carries every key the current
 * version knows nothing about straight back into `data.json` and into every
 * export. The two optional style defaults are only written when the file
 * actually names them, since the defaults object has no key for them at all
 * and an `undefined` one is still a key.
 */
function mergeIconSources(
	saved: Partial<IconSourceSettings> | undefined,
): IconSourceSettings {
	const defaults = DEFAULT_SETTINGS.iconSources;
	const merged: IconSourceSettings = {
		materialStyleDefault:
			saved?.materialStyleDefault ?? defaults.materialStyleDefault,
		materialWeightDefault:
			saved?.materialWeightDefault ?? defaults.materialWeightDefault,
		// Its own object on every merge, whatever the file said. A plain spread
		// of the defaults copies the *reference*, so a file that names no
		// category — every fresh install, and every "reset to defaults" — was
		// handed `DEFAULT_SETTINGS`' own map. Nothing writes into it in place
		// today, by the picker's convention alone; the day something does, the
		// last-opened category would be stuck in the defaults for the rest of
		// the session and leak into every later merge.
		lastCategory: {
			...defaults.lastCategory,
			...saved?.lastCategory,
		},
		lastEmojiSkinTone:
			saved?.lastEmojiSkinTone ?? defaults.lastEmojiSkinTone,
	};
	if (saved?.faStyleDefault !== undefined) {
		merged.faStyleDefault = saved.faStyleDefault;
	}
	if (saved?.tablerStyleDefault !== undefined) {
		merged.tablerStyleDefault = saved.tablerStyleDefault;
	}
	// Pre-2.4: one source had categories, so the field named Material directly.
	const legacyCategory = saved?.lastMaterialCategory;
	if (legacyCategory) {
		merged.lastCategory = {
			...merged.lastCategory,
			material: legacyCategory,
		};
	}
	return merged;
}

export type LegacySavedSettings = Partial<PluginSettings> & {
	popup?: Partial<LegacyPopupSettings>;
	contextMenu?: Partial<ContextMenuSettings>;
};

/**
 * Merge the four per-side border booleans over a role's defaults.
 *
 * Shared by all three frame styles, which is the only reason it is a helper —
 * the point is the same one the rest of this file makes: the sides are named,
 * so a fifth key a file happens to carry is not one of them.
 */
function mergeBorderSides(
	saved: Partial<BorderSidesSettings> | undefined,
	defaults: BorderSidesSettings,
): BorderSidesSettings {
	return {
		top: saved?.top ?? defaults.top,
		right: saved?.right ?? defaults.right,
		bottom: saved?.bottom ?? defaults.bottom,
		left: saved?.left ?? defaults.left,
	};
}

/**
 * Merge a saved heading frame style over the defaults, field by field.
 *
 * Spelled out rather than spread for the reason on {@link mergeSavedSettings}:
 * a spread keeps every key the current version knows nothing about, and
 * settings are written back wholesale by both `toSaveData()` and
 * `exportToJSONv2()`, so such a key would be re-saved forever and copied into
 * every new export file. Naming the fields is what retires `paddingStart` (the
 * "Icon indent" slider, a static 10px in styles.css since 2.7.0) — and, unlike
 * the `delete` it replaced, everything else a future version drops too.
 */
function mergeHeadingStyle(
	saved: Partial<HeadingFrameStyleSettings> | undefined,
): HeadingFrameStyleSettings {
	const defaults = DEFAULT_SETTINGS.globalStyle.heading;
	return {
		borderSides: mergeBorderSides(saved?.borderSides, defaults.borderSides),
		borderWidth: saved?.borderWidth ?? defaults.borderWidth,
		borderRadius: saved?.borderRadius ?? defaults.borderRadius,
		paddingTop: saved?.paddingTop ?? defaults.paddingTop,
		paddingBottom: saved?.paddingBottom ?? defaults.paddingBottom,
		marginTop: saved?.marginTop ?? defaults.marginTop,
	};
}

/** Merge a saved inline frame style over the defaults. See mergeHeadingStyle. */
function mergeInlineStyle(
	saved: Partial<InlineFrameStyleSettings> | undefined,
): InlineFrameStyleSettings {
	const defaults = DEFAULT_SETTINGS.globalStyle.inline;
	return {
		borderSides: mergeBorderSides(saved?.borderSides, defaults.borderSides),
		borderWidth: saved?.borderWidth ?? defaults.borderWidth,
		borderRadius: saved?.borderRadius ?? defaults.borderRadius,
		fontScale: saved?.fontScale ?? defaults.fontScale,
	};
}

/** Merge a saved global (block callout) style over the defaults. */
function mergeGlobalStyle(
	saved: Partial<GlobalStyleSettings> | undefined,
): GlobalStyleSettings {
	const defaults = DEFAULT_SETTINGS.globalStyle;
	return {
		borderSides: mergeBorderSides(saved?.borderSides, defaults.borderSides),
		borderWidth: saved?.borderWidth ?? defaults.borderWidth,
		titleScale: saved?.titleScale ?? defaults.titleScale,
		contentScale: saved?.contentScale ?? defaults.contentScale,
		borderRadius: saved?.borderRadius ?? defaults.borderRadius,
		alignContentWithTitle:
			saved?.alignContentWithTitle ?? defaults.alignContentWithTitle,
		heading: mergeHeadingStyle(saved?.heading),
		inline: mergeInlineStyle(saved?.inline),
	};
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
		globalStyle: clampGlobalStyle(mergeGlobalStyle(savedGlobal)),
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
