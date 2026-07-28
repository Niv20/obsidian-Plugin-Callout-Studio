/**
 * manager/CalloutRegistry.ts — Central in-memory store for all callout definitions.
 *
 * Holds the live Map of CalloutDefinitions (built-in defaults + user overrides +
 * auto-discovered fallbacks), exposes CRUD operations, handles data migration
 * from older saved formats, and fires onChange callbacks when the store mutates.
 * This is the single source of truth read by CSSInjector, AutoComplete,
 * SettingsTab, and the public API.
 */
import type {
	CalloutDefinition,
	ContextMenuItemConfig,
	ContextMenuItemId,
	ContextMenuSettings,
	IconPackId,
	IconSourceSettings,
	IconSvgCacheEntry,
	LegacyPopupSettings,
	PluginData,
	PluginSettings,
	UserImageIcon,
} from "../types";
import { CALLOUT_RENDER_ROLES } from "../types";
import {
	DEFAULT_CALLOUTS,
	DEFAULT_CONTEXT_MENU_ITEMS,
	DEFAULT_SETTINGS,
} from "../constants";
import { iconCacheKey, packFor } from "../icons/registry";
import { materialPack } from "../icons/packs/material";
import { obsidianCalloutAttrId } from "../utils/calloutId";
import { parseCssColorToHex } from "../utils/colorUtils";
import { sanitizeCustomPalettes } from "../utils/colorPalettes";
import { sanitizeUserImages } from "../utils/userImages";
import { setUserImages } from "../icons/packs/userImages";
import { sortCalloutsByDisplayName } from "../utils/sorting";

/**
 * Stamped into `data.json` for provenance. Migrations deliberately key on
 * whether a field is present rather than on this number — an imported or
 * hand-edited file can carry any version it likes, and a load that trusted the
 * stamp would skip work the data actually needs.
 *
 * 3: `materialSvgCache` → `iconSvgCache` (generic across icon packs).
 */
const CURRENT_DATA_VERSION = 3;
const SORTED_DEFAULT_CALLOUTS = sortCalloutsByDisplayName(DEFAULT_CALLOUTS);

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

/** Identifier stamped into v2 export files so the importer can recognize them. */
export const EXPORT_FORMAT_ID = "callout-studio";
export const EXPORT_FORMAT_VERSION = 2;

type LegacySavedSettings = Partial<PluginSettings> & {
	popup?: Partial<LegacyPopupSettings>;
	contextMenu?: Partial<ContextMenuSettings>;
};

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
		| Partial<PluginSettings["globalStyle"]>
		| undefined;
	const legacyPopup = savedSettings.popup;
	const savedMenuItems = savedSettings.contextMenu?.items;
	return {
		globalStyle: {
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
			heading: {
				...DEFAULT_SETTINGS.globalStyle.heading,
				...savedGlobal?.heading,
				borderSides: {
					...DEFAULT_SETTINGS.globalStyle.heading.borderSides,
					...(savedGlobal?.heading?.borderSides as
						| Record<string, boolean>
						| undefined),
				},
			},
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
		},
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
		},
		inlineCallouts: {
			enabled:
				savedSettings.inlineCallouts?.enabled ??
				DEFAULT_SETTINGS.inlineCallouts.enabled,
		},
		firstRunCompleted:
			savedSettings.firstRunCompleted ??
			DEFAULT_SETTINGS.firstRunCompleted,
		welcomeSeen:
			savedSettings.welcomeSeen ?? DEFAULT_SETTINGS.welcomeSeen,
		fallbackCalloutId:
			savedSettings.fallbackCalloutId ??
			DEFAULT_SETTINGS.fallbackCalloutId,
		language: savedSettings.language ?? DEFAULT_SETTINGS.language,
		customPalettes: sanitizeCustomPalettes(savedSettings.customPalettes),
		userImages: sanitizeUserImages(savedSettings.userImages),
	};
}

export type RegistryChangeCallback = () => void;

/**
 * Re-stamps a transient preview definition with the identity of the real
 * callout it shadows: *which* callout this entry is, as opposed to how it
 * currently looks.
 *
 * The settings editor builds its preview from form state alone
 * (`CalloutEditor.buildPreviewDefinition`), so it fabricates the ownership
 * fields — always `builtIn: false`, `source: "user"`, no aliases. Those values
 * are right for a brand-new draft (which shadows nothing) but wrong the moment
 * the preview stands in for an existing callout in the map: the settings lists
 * partition on `builtIn`, so a built-in row would re-home itself into "My
 * callout types" for as long as its editor is open, the row would drop its
 * alias badges and its fallback tag, and the CSS pipeline would stop emitting
 * rules for the aliases — un-styling open notes mid-edit.
 *
 * Everything the user is actively editing — display name, icon, colors,
 * gradient, fold and offset settings — still comes from the preview, so the
 * row and the rendered callout keep tracking the edit live.
 */
function withIdentityOf(
	real: CalloutDefinition,
	preview: CalloutDefinition,
): CalloutDefinition {
	return {
		...preview,
		builtIn: real.builtIn,
		source: real.source,
		customized: real.customized,
		aliases: real.aliases,
		metadata: real.metadata,
	};
}

export class CalloutRegistry {
	private callouts: Map<string, CalloutDefinition> = new Map();
	private builtInDefaults: Map<string, CalloutDefinition> = new Map();
	private changeCallbacks: RegistryChangeCallback[] = [];
	/**
	 * Listeners for transient live-preview changes — a separate list from
	 * {@link changeCallbacks} precisely because a preview is NOT a mutation:
	 * it must never reach `saveSettings()` or force open notes to re-render.
	 * See {@link onPreviewChange}.
	 */
	private previewChangeCallbacks: RegistryChangeCallback[] = [];
	settings: PluginSettings;
	iconSvgCache: IconSvgCacheEntry[] = [];

	/**
	 * The callout ID currently occupied by the transient settings-preview
	 * definition (see {@link setPreviewDefinition}), or null when no preview is
	 * active. The preview registers under the *real* ID being edited so the live
	 * preview renders `> [!<real-id>]` with the in-progress style.
	 */
	private previewActiveId: string | null = null;
	/**
	 * When the preview ID collides with an existing real callout (editing an
	 * existing type), the original definition we shadowed — restored when the
	 * preview clears so the real callout is never lost.
	 */
	private previewShadowedDef: CalloutDefinition | null = null;
	/**
	 * True when the active preview is a *demo* placeholder — the palette editor,
	 * the per-role global-style popups, or a brand-new unnamed callout draft —
	 * rather than the in-progress edit of a real, existing callout. A demo must
	 * never affect the settings lists: it neither adds a phantom row nor hides
	 * the real callout it happens to overlay (e.g. the built-in `example`, whose
	 * id doubles as the preview placeholder `example`). See {@link definitionsForLists}.
	 */
	private previewIsDemo = false;

	constructor() {
		this.settings = structuredClone(DEFAULT_SETTINGS);
		this.syncUserImages();
		for (const def of SORTED_DEFAULT_CALLOUTS) {
			this.builtInDefaults.set(def.id, structuredClone(def));
		}
	}

	load(data: Partial<PluginData> | null): void {
		this.callouts.clear();

		// Always start with built-in defaults
		for (const def of SORTED_DEFAULT_CALLOUTS) {
			this.callouts.set(def.id, structuredClone(def));
		}

		if (!data) return;

		// Merge saved callouts (user overrides and custom callouts)
		if (data.callouts) {
			for (const saved of data.callouts) {
				if (this.callouts.has(saved.id) && saved.builtIn) {
					// Merge overrides onto built-in
					const existing = this.callouts.get(saved.id)!;
					this.callouts.set(saved.id, {
						...existing,
						...saved,
						builtIn: true,
						source: "builtin",
					});
				} else if (!saved.builtIn) {
					this.callouts.set(saved.id, saved);
				}
			}
		}

		// Merge settings (field-by-field against defaults; see mergeSavedSettings)
		if (data.settings) {
			this.settings = mergeSavedSettings(data.settings);
			this.syncUserImages();
		}

		// Restore cached artwork for the icons the vault actually uses.
		if (data.iconSvgCache) {
			this.iconSvgCache = data.iconSvgCache;
		}
		// Migration: fold the pre-2.4 Material-only cache into the generic one.
		// Keyed on the field being present rather than on `data.version`, since
		// an imported or hand-edited file can carry any version it likes.
		// This is the only place that may read `materialSvgCache`; it exists
		// precisely to retire it.
		if (data.materialSvgCache) {
			for (const entry of data.materialSvgCache) {
				this.addIconSvg({
					pack: "material",
					name: entry.name,
					variant: materialPack.cacheVariant(
						{
							type: "material",
							value: entry.name,
							style: entry.style,
							weight: entry.weight,
						},
						// Material draws the same artwork at every size, so any
						// role yields the same variant.
						"regular",
					),
					svg: entry.svg,
				});
			}
		}
		// Migration: any callout that still references the removed `svg` icon
		// type falls back to a generic lucide pencil so renders don't crash.
		for (const def of this.callouts.values()) {
			const t = (def.icon?.type as string | undefined) ?? "lucide";
			if (t === "svg") {
				def.icon = { type: "lucide", value: "pencil" };
			}
		}
		// Migration: `recolor` used to live on the picture, shared by every
		// callout pointing at it. Give each callout its own copy, taken from the
		// picture, so nothing changes appearance on the way over.
		for (const def of this.callouts.values()) {
			if (def.icon.type !== "image" || def.icon.recolor !== undefined) {
				continue;
			}
			const picture = this.settings.userImages.find(
				(image) => image.id === def.icon.value,
			);
			def.icon = { ...def.icon, recolor: picture?.monochrome === true };
		}
		// Migration: link any callout saved before `paletteId` existed but whose
		// baked colors still exactly match a saved custom palette, so an edit to
		// that palette (applyPaletteColors) cascades onto it too.
		if (this.settings.customPalettes.length > 0) {
			for (const def of this.callouts.values()) {
				if (def.paletteId) continue;
				const match = this.settings.customPalettes.find(
					(p) =>
						p.colorLight.toLowerCase() ===
							def.colorLight.toLowerCase() &&
						p.colorDark.toLowerCase() ===
							def.colorDark.toLowerCase() &&
						p.bgColorLight.toLowerCase() ===
							(def.bgColorLight ?? "").toLowerCase() &&
						p.bgColorDark.toLowerCase() ===
							(def.bgColorDark ?? "").toLowerCase() &&
						p.textColorLight.toLowerCase() ===
							(def.textColorLight ?? "").toLowerCase() &&
						p.textColorDark.toLowerCase() ===
							(def.textColorDark ?? "").toLowerCase(),
				);
				if (match) def.paletteId = match.id;
			}
		}
		this.reconcileAttrIdCollisions();
	}

	/**
	 * Migration: merge any pre-existing definitions that only differ by a
	 * dash/space spelling of the same `data-callout` attribute form. Obsidian
	 * renders both spellings identically (see obsidianCalloutAttrId's doc), so
	 * two surviving rows would forever fight over one CSS selector. This can
	 * happen on a vault saved before findByAttrId/findAttrIdConflict existed,
	 * when discovery could auto-create a dash-form fallback row alongside an
	 * already-defined space-form callout.
	 *
	 * A built-in always survives (its id can't realistically collide, but never
	 * risk dropping one). Otherwise an uncustomized `fallback` row always
	 * loses — it's disposable auto-junk — and between two real rows the
	 * dash-free spelling wins, per the user's stated preference. A losing real
	 * row's id is folded in as an alias of the survivor so no customization or
	 * usage-matching is lost.
	 */
	private reconcileAttrIdCollisions(): void {
		const groups = new Map<string, Set<string>>();
		const addForm = (form: string, defId: string): void => {
			const attrForm = obsidianCalloutAttrId(form);
			if (!attrForm) return;
			let set = groups.get(attrForm);
			if (!set) groups.set(attrForm, (set = new Set()));
			set.add(defId);
		};
		for (const def of this.callouts.values()) {
			addForm(def.id, def.id);
			for (const alias of def.aliases ?? []) addForm(alias, def.id);
		}

		const isDisposable = (d: CalloutDefinition): boolean =>
			d.source === "fallback" && d.customized !== true;

		for (const defIds of groups.values()) {
			if (defIds.size < 2) continue;
			const defs = Array.from(defIds)
				.map((id) => this.callouts.get(id))
				.filter((d): d is CalloutDefinition => d !== undefined);
			// An earlier group in this same pass may already have resolved
			// (deleted) one side of this collision.
			if (defs.length < 2) continue;

			const survivor =
				defs.find((d) => d.builtIn) ??
				defs.find((d) => !isDisposable(d) && !d.id.includes("-")) ??
				defs.find((d) => !isDisposable(d)) ??
				defs[0]!;

			for (const loser of defs) {
				if (loser.id === survivor.id || loser.builtIn) continue;
				this.callouts.delete(loser.id);
				if (isDisposable(loser)) continue;
				const aliases = new Set(survivor.aliases ?? []);
				aliases.add(loser.id);
				for (const a of loser.aliases ?? []) aliases.add(a);
				aliases.delete(survivor.id);
				survivor.aliases = Array.from(aliases);
			}
		}
	}

	toSaveData(): PluginData {
		const calloutsToSave: CalloutDefinition[] = [];

		for (const [id, entry] of this.callouts) {
			// The transient settings-preview definition is never persisted. When
			// it shadows a real callout (editing an existing type), persist the
			// original we shadowed instead so a background save mid-edit can't
			// drop the real definition or leak the in-progress preview.
			let def = entry;
			if (id === this.previewActiveId) {
				if (!this.previewShadowedDef) continue;
				def = this.previewShadowedDef;
			}
			if (def.builtIn) {
				// Only save built-in if it was modified from default
				const original = this.builtInDefaults.get(id);
				if (original && this.isModified(def, original)) {
					calloutsToSave.push(def);
				}
			} else {
				calloutsToSave.push(def);
			}
		}

		return {
			version: CURRENT_DATA_VERSION,
			callouts: calloutsToSave,
			settings: this.settings,
			// `materialSvgCache` is deliberately not written back: the legacy
			// entries were folded into `iconSvgCache` on load, and writing both
			// would let them drift apart. Downgrading to a pre-2.4 build simply
			// re-downloads the Material SVGs.
			iconSvgCache:
				this.iconSvgCache.length > 0 ? this.iconSvgCache : undefined,
		};
	}

	private isModified(
		current: CalloutDefinition,
		original: CalloutDefinition,
	): boolean {
		const aliasesChanged =
			JSON.stringify(current.aliases ?? []) !==
			JSON.stringify(original.aliases ?? []);
		const gradientChanged =
			JSON.stringify(current.bgGradient ?? null) !==
			JSON.stringify(original.bgGradient ?? null);
		return (
			current.displayName !== original.displayName ||
			current.colorLight !== original.colorLight ||
			current.colorDark !== original.colorDark ||
			current.icon.type !== original.icon.type ||
			current.icon.value !== original.icon.value ||
			current.icon.style !== original.icon.style ||
			// Weight is a real axis of the Material artwork; without it,
			// changing only a built-in's weight looked unmodified and so was
			// never persisted.
			current.icon.weight !== original.icon.weight ||
			current.foldable !== original.foldable ||
			current.defaultFolded !== original.defaultFolded ||
			aliasesChanged ||
			gradientChanged
		);
	}

	add(def: CalloutDefinition): boolean {
		if (this.callouts.has(def.id)) {
			return false;
		}
		// Check if this ID is already an alias of another callout
		if (this.findByAlias(def.id)) {
			return false;
		}
		// Check if any of this callout's aliases conflict with existing IDs or aliases
		for (const alias of def.aliases ?? []) {
			if (this.callouts.has(alias)) return false;
			if (this.findByAlias(alias)) return false;
		}
		this.callouts.set(def.id, def);
		this.notifyChange();
		return true;
	}

	update(id: string, partial: Partial<CalloutDefinition>): boolean {
		const existing = this.callouts.get(id);
		if (!existing) return false;

		const newId = partial.id && partial.id !== id ? partial.id : id;

		// If the id is being changed, remove old and re-add
		if (partial.id && partial.id !== id) {
			if (this.callouts.has(partial.id)) return false;
			this.callouts.delete(id);
			this.callouts.set(partial.id, { ...existing, ...partial });
		} else {
			this.callouts.set(id, { ...existing, ...partial });
		}

		// If the user just edited the active fallback callout's appearance,
		// re-mirror it onto every uncustomized fallback-source row so the
		// change is visible immediately in settings and in the vault.
		if (newId === this.settings.fallbackCalloutId) {
			this.restyleUncustomizedFallbackRows();
		}

		this.notifyChange();
		return true;
	}

	remove(id: string): boolean {
		const def = this.callouts.get(id);
		if (!def || def.builtIn) return false;
		this.callouts.delete(id);
		// If the removed callout was the active fallback, reset to "note"
		// and re-mirror uncustomized fallback rows onto the new fallback.
		if (this.settings.fallbackCalloutId === id) {
			this.settings.fallbackCalloutId =
				DEFAULT_SETTINGS.fallbackCalloutId;
			this.restyleUncustomizedFallbackRows();
		}
		this.notifyChange();
		return true;
	}

	/**
	 * Re-style every uncustomized `source: "fallback"` row to mirror the
	 * current fallback callout's icon, colors, and icon transform. Called
	 * whenever the fallback selection changes (user-driven via the settings
	 * dropdown, or implicitly when the active fallback row is deleted and
	 * resets to the default) or when the fallback callout itself is edited.
	 * Returns the number of rows updated. Callers decide whether to flush
	 * (`notifyChange`) afterwards — we emit a notification only when at
	 * least one row actually changed so settings UI re-renders to reflect
	 * the new mirror style.
	 */
	restyleUncustomizedFallbackRows(): number {
		const fallbackId =
			this.settings.fallbackCalloutId ||
			DEFAULT_SETTINGS.fallbackCalloutId;
		const fallback = this.callouts.get(fallbackId);
		if (!fallback) return 0;
		let updated = 0;
		for (const def of this.callouts.values()) {
			if (def.builtIn) continue;
			if (def.source !== "fallback") continue;
			if (def.customized === true) continue;
			if (def.id === fallbackId) continue;
			this.callouts.set(def.id, {
				...def,
				icon: { ...fallback.icon },
				colorLight: fallback.colorLight,
				colorDark: fallback.colorDark,
				bgColorLight: fallback.bgColorLight,
				bgColorDark: fallback.bgColorDark,
				bgGradient: fallback.bgGradient
					? { ...fallback.bgGradient }
					: undefined,
				textColorLight: fallback.textColorLight,
				textColorDark: fallback.textColorDark,
				iconOffsetX: fallback.iconOffsetX,
				iconOffsetY: fallback.iconOffsetY,
				iconSize: fallback.iconSize,
			});
			updated++;
		}
		if (updated > 0) {
			this.notifyChange();
		}
		return updated;
	}

	/**
	 * Cascades an edited custom palette's colors onto every callout still
	 * linked to it (`paletteId` match), so a palette edit updates every
	 * callout using it instead of leaving them with a stale baked-in copy.
	 * If the active fallback callout is among them, also re-mirrors the
	 * uncustomized fallback rows that copy its appearance. Returns the
	 * number of callouts updated.
	 */
	applyPaletteColors(
		paletteId: string,
		colors: Pick<
			CalloutDefinition,
			| "colorLight"
			| "colorDark"
			| "bgColorLight"
			| "bgColorDark"
			// Callers pass bgGradient explicitly (possibly undefined) so the
			// spread below clears a stale value when the palette switched
			// background style.
			| "bgGradient"
			| "textColorLight"
			| "textColorDark"
		>,
	): number {
		let updated = 0;
		let touchedFallback = false;
		for (const def of this.callouts.values()) {
			if (def.paletteId !== paletteId) continue;
			this.callouts.set(def.id, { ...def, ...colors });
			updated++;
			if (def.id === this.settings.fallbackCalloutId) touchedFallback = true;
		}
		if (touchedFallback) {
			this.restyleUncustomizedFallbackRows();
		}
		if (updated > 0) {
			this.notifyChange();
		}
		return updated;
	}

	/**
	 * Re-attach a non-builtin callout to the global Default fallback so it
	 * mirrors the fallback's style going forward. Clears any sticky
	 * `customized` flag, flips `source` to `"fallback"`, then re-mirrors.
	 * Returns `true` when the row was converted.
	 */
	convertToFallback(id: string): boolean {
		const existing = this.callouts.get(id);
		if (!existing || existing.builtIn) return false;
		if (id === this.settings.fallbackCalloutId) return false;
		const next: CalloutDefinition = {
			...existing,
			source: "fallback",
		};
		delete next.customized;
		this.callouts.set(id, next);
		this.restyleUncustomizedFallbackRows();
		this.notifyChange();
		return true;
	}

	isBuiltInModified(id: string): boolean {
		const current = this.callouts.get(id);
		const original = this.builtInDefaults.get(id);
		if (!current || !original) return false;
		return this.isModified(current, original);
	}

	resetBuiltIn(id: string): boolean {
		const original = this.builtInDefaults.get(id);
		if (!original) return false;
		this.callouts.set(id, structuredClone(original));
		this.notifyChange();
		return true;
	}

	get(id: string): CalloutDefinition | undefined {
		return this.callouts.get(id);
	}

	getAll(): CalloutDefinition[] {
		return Array.from(this.callouts.values());
	}

	getUserDefined(): CalloutDefinition[] {
		return this.definitionsForLists().filter(
			(d) => !d.builtIn && !this.isUnshadowedPreview(d.id),
		);
	}

	/**
	 * {@link getAll} as the settings lists should see it. The transient
	 * live-preview stand-in is an implementation detail of the preview pane; for
	 * a *demo* preview ({@link previewIsDemo}) it must not surface as a row nor
	 * displace the real callout it overlays. So for a demo we present the reality
	 * it shadows — the shadowed built-in/user callout, or nothing when it shadows
	 * a fresh id — leaving `getAll()` (used by the CSS/render pipeline) untouched
	 * so the demo still renders live in the preview pane. Non-demo previews (an
	 * in-progress edit of an existing callout) pass through as-is: that row
	 * *should* reflect the live edit. Such a row can still never change sections,
	 * because a preview shadowing a real callout inherits that callout's identity
	 * on the way into the map — see {@link withIdentityOf}.
	 */
	private definitionsForLists(): CalloutDefinition[] {
		if (this.previewActiveId === null || !this.previewIsDemo) {
			return this.getAll();
		}
		const out: CalloutDefinition[] = [];
		for (const def of this.callouts.values()) {
			if (def.id !== this.previewActiveId) {
				out.push(def);
			} else if (this.previewShadowedDef) {
				// Show the real callout the demo overlays (e.g. built-in example).
				out.push(this.previewShadowedDef);
			}
			// else: demo occupies a fresh id → omit it entirely.
		}
		return out;
	}

	/**
	 * True for the transient settings-preview definition when it does NOT
	 * stand in for a real callout (nothing shadowed): a brand-new callout
	 * being drafted in the editor, or the style popups' neutral demo callout.
	 * Such entries must render through the CSS/preview pipeline (getAll) but
	 * must not surface as rows in the settings lists.
	 */
	private isUnshadowedPreview(id: string): boolean {
		return id === this.previewActiveId && this.previewShadowedDef === null;
	}

	getBuiltIn(): CalloutDefinition[] {
		return this.definitionsForLists().filter((d) => d.builtIn);
	}

	has(id: string): boolean {
		return this.callouts.has(id);
	}

	getBuiltInDefault(id: string): CalloutDefinition | undefined {
		return this.builtInDefaults.get(id);
	}

	findByAlias(alias: string): CalloutDefinition | undefined {
		for (const def of this.callouts.values()) {
			if (def.aliases && def.aliases.includes(alias)) return def;
		}
		return undefined;
	}

	/**
	 * Resolve the ID Obsidian wrote into a blockquote callout's `data-callout`
	 * back to a definition. That attribute is the DASH form of whatever the user
	 * typed (see obsidianCalloutAttrId), so a definition stored as
	 * `multi word callout` must be findable from `multi-word-callout`.
	 *
	 * Precedence runs most-literal-first, so an ID that IS literally
	 * `multi-word-callout` always beats a `multi word callout` that merely
	 * dasherizes to it:
	 *   1. exact ID   2. exact alias   3. attr-form ID   4. attr-form alias
	 * Steps 3 and 4 are separate passes so an attr-form ID beats an attr-form
	 * alias regardless of Map insertion order.
	 *
	 * This is the RENDERING lookup, so it deliberately sees the callout editor's
	 * live-preview draft. Validation wants the opposite and asks a different
	 * question — see {@link findAttrIdConflict}.
	 *
	 * Returns undefined when nothing matches — callers decide whether to fall
	 * back. A linear scan rather than a maintained index: `findByAlias` above
	 * already scans on every rendered token, and the Map is mutated from a dozen
	 * places (including setPreviewDefinition, which deliberately skips
	 * notifyChange), so an index would have no safe invalidation point.
	 */
	findByAttrId(rawAttr: string): CalloutDefinition | undefined {
		const key = obsidianCalloutAttrId(rawAttr);
		const exact = this.callouts.get(key) ?? this.findByAlias(key);
		if (exact) return exact;
		for (const def of this.callouts.values()) {
			if (obsidianCalloutAttrId(def.id) === key) return def;
		}
		for (const def of this.callouts.values()) {
			if (def.aliases?.some((a) => obsidianCalloutAttrId(a) === key)) {
				return def;
			}
		}
		return undefined;
	}

	/**
	 * The OTHER definition that already owns `rawId`'s `data-callout` attribute
	 * form, or undefined when the form is free. Validation-only counterpart to
	 * {@link findByAttrId}, and deliberately different from it in two ways:
	 *
	 * - It asks "does anyone else own this form?" rather than "who wins the
	 *   lookup race", so there is no precedence ladder — the first other owner
	 *   is reported. That keeps the answer symmetric: `a b` sees `a-b` and
	 *   `a-b` sees `a b`, where a precedence-ordered search would let the
	 *   literal ID win and hide the conflict in one of the two directions.
	 * - It sees through the live-preview shadow exactly as {@link getReal}
	 *   does. The callout editor registers its in-progress draft in this very
	 *   map under the ID being typed (see setPreviewDefinition), so a raw scan
	 *   finds the draft and reports it as its own conflict.
	 *
	 * `excludeId` is the definition being edited — it can never conflict with
	 * itself, and skipping it wholesale also stops one of its own aliases from
	 * conflicting with its ID.
	 */
	findAttrIdConflict(
		rawId: string,
		excludeId: string | null,
	): CalloutDefinition | undefined {
		const key = obsidianCalloutAttrId(rawId);
		if (!key) return undefined;
		for (const def of this.realDefinitions()) {
			if (def.id === excludeId) continue;
			if (obsidianCalloutAttrId(def.id) === key) return def;
			if (def.aliases?.some((a) => obsidianCalloutAttrId(a) === key)) {
				return def;
			}
		}
		return undefined;
	}

	/**
	 * Every raw ID form that may appear in the vault for `def` and belongs to
	 * `def` alone: its ID and aliases, plus each one's `data-callout` attribute
	 * form when that differs and no OTHER definition owns it.
	 *
	 * Callers that rewrite or count usages across the vault (rename, delete,
	 * usage counts, the discovery prune pass) must use this rather than
	 * `[def.id, ...aliases]`, or `> [!a-b]` written by hand is orphaned when the
	 * `a b` row is renamed away — the same class of bug as leaving heading and
	 * inline usages behind.
	 *
	 * The "no other owner" condition is what keeps a legacy vault safe: where
	 * `a b` and `a-b` both exist as separate rows, neither claims the other's
	 * usages.
	 *
	 * `forms` narrows the question to a subset of what `def` owns — the
	 * built-in reset flow asks only about the aliases it is about to drop.
	 */
	vaultIdFormsFor(
		def: CalloutDefinition,
		forms: string[] = [def.id, ...(def.aliases ?? [])],
	): string[] {
		const out = [...forms];
		for (const form of forms) {
			const attrForm = obsidianCalloutAttrId(form);
			if (!attrForm || attrForm === form) continue;
			if (out.includes(attrForm)) continue;
			if (this.findAttrIdConflict(attrForm, def.id)) continue;
			out.push(attrForm);
		}
		return out;
	}

	/**
	 * The committed definitions, with the transient live-preview entry replaced
	 * by the real callout it shadows (and dropped entirely when it shadows
	 * nothing). The iteration equivalent of {@link getReal} — for the callers
	 * that must only ever see reality, never the callout editor's draft.
	 */
	private *realDefinitions(): Generator<CalloutDefinition> {
		for (const [id, def] of this.callouts) {
			if (id === this.previewActiveId) {
				if (this.previewShadowedDef) yield this.previewShadowedDef;
				continue;
			}
			yield def;
		}
	}

	/**
	 * Register (or clear, with `null`) the transient live-preview definition
	 * under its own `def.id` — the *real* callout ID being edited — so the
	 * settings live preview renders `> [!<real-id>]` with the in-progress style
	 * through the real pipeline (CSS + reading post-processors).
	 *
	 * Bookkeeping keeps this safe:
	 * - The previous transient entry is always undone first (restoring any
	 *   shadowed real callout), so rapid ID changes while typing a name leave no
	 *   orphan rows.
	 * - If the new ID collides with a real callout, the original is remembered in
	 *   {@link previewShadowedDef} and restored on clear.
	 * - A preview that collides that way also inherits the shadowed callout's
	 *   identity ({@link withIdentityOf}), so an in-progress edit can restyle a
	 *   row but never re-home it between the settings lists, strip its aliases,
	 *   or make a built-in look deletable.
	 * - {@link toSaveData} skips (or substitutes the shadowed original for) the
	 *   active preview ID, so the in-progress edit can never reach disk.
	 *
	 * `isDemo` marks a placeholder preview (palette editor, global-style popups,
	 * or an unnamed new-callout draft) whose id is not a real callout the user is
	 * editing. Such previews are hidden from the settings lists entirely, so a
	 * demo whose id collides with an existing callout — notably the built-in
	 * `example`, reused as the preview placeholder id — can't leak a phantom
	 * "My callout types" row while the modal is open. See {@link definitionsForLists}.
	 *
	 * Deliberately does NOT call `notifyChange()`: that would trigger the
	 * `onChange` → `saveSettings` write and force every open note to re-render.
	 * The caller instead requests a targeted `cssInjector.inject(false)`.
	 *
	 * It DOES fire {@link onPreviewChange} whenever the settings lists could
	 * look different afterwards, so the open settings tab repaints its rows in
	 * the next frame. Without that signal the tab has no way to learn about a
	 * preview at all, and only caught up ~2s later when the debounced startup
	 * snippet write made Obsidian emit its own `css-change` — a disk write
	 * standing in for an event.
	 *
	 * `notifyLists: false` suppresses exactly that signal for a preview the
	 * user has not chosen — the callout editor's palette menu previewing a
	 * merely hovered colour. The rows then keep rendering the last committed
	 * state, which is what the modal's own swatches and labels still show. The
	 * map does hold the hovered colours meanwhile, so a list refresh from an
	 * unrelated source would surface them; that resolves itself on the next
	 * committed change or when the menu closes and re-notifies.
	 */
	setPreviewDefinition(
		def: CalloutDefinition | null,
		isDemo = false,
		notifyLists = true,
	): void {
		// A demo preview is hidden from the settings lists entirely (see
		// definitionsForLists), so only a NON-demo preview — the in-progress
		// edit of a real callout — can change what those lists render. Capture
		// the outgoing state before the bookkeeping below clears it.
		const wasListVisible = this.previewActiveId !== null && !this.previewIsDemo;

		// Undo the previous transient registration first, restoring any real
		// callout it shadowed.
		if (this.previewActiveId !== null) {
			if (this.previewShadowedDef) {
				this.callouts.set(this.previewActiveId, this.previewShadowedDef);
			} else {
				this.callouts.delete(this.previewActiveId);
			}
			this.previewActiveId = null;
			this.previewShadowedDef = null;
			this.previewIsDemo = false;
		}

		if (def) {
			const existing = this.callouts.get(def.id);
			this.previewShadowedDef = existing ?? null;
			this.previewActiveId = def.id;
			this.previewIsDemo = isDemo;
			// A preview never owns the identity of the callout it shadows —
			// see withIdentityOf. Applied to demos too: they are already hidden
			// from the lists, but it keeps the map entry a faithful stand-in for
			// the CSS pipeline (notably the built-in `example`, whose id doubles
			// as the demo placeholder, keeping its aliases styled).
			this.callouts.set(
				def.id,
				existing ? withIdentityOf(existing, def) : def,
			);
		}

		// Notify when either end of the transition was list-visible: taking a
		// non-demo preview down restores the real row just as surely as putting
		// one up replaces it. A demo → demo swap changes nothing on screen.
		if (notifyLists && (wasListVisible || (def !== null && !isDemo))) {
			this.notifyPreviewChange();
		}
	}

	/**
	 * True while a transient live-preview definition stands in for (or adds to)
	 * the real callouts. Callers use it to skip work that must only ever see
	 * committed state — persisting the startup CSS snapshot, above all.
	 */
	hasPreviewDefinition(): boolean {
		return this.previewActiveId !== null;
	}

	/**
	 * The transient preview definition currently registered, or null. Lets a
	 * nested modal (e.g. the palette editor opened over the callout editor)
	 * capture the outer preview on open and restore it on close, rather than
	 * clearing the single preview slot to null.
	 */
	getPreviewDefinition(): CalloutDefinition | null {
		return this.previewActiveId !== null
			? (this.callouts.get(this.previewActiveId) ?? null)
			: null;
	}

	/**
	 * Whether the currently registered preview is a demo placeholder. Lets a
	 * nested modal capture the outer preview's demo state alongside its
	 * definition (see {@link getPreviewDefinition}) so restoring it on close
	 * keeps it hidden from the settings lists.
	 */
	isPreviewDemo(): boolean {
		return this.previewIsDemo;
	}

	/**
	 * Like `get`, but sees through the transient live-preview shadow: if `id`
	 * is the one currently being drafted in the callout editor, returns the
	 * real callout it is shadowing (or undefined if nothing was there) instead
	 * of the in-progress preview stand-in. Used by ID-conflict validation so
	 * the editor's own draft never counts as a conflict with itself.
	 */
	getReal(id: string): CalloutDefinition | undefined {
		if (id === this.previewActiveId) {
			return this.previewShadowedDef ?? undefined;
		}
		return this.callouts.get(id);
	}

	// ── Icon SVG cache ───────────────────────────────────────

	findIconSvg(
		pack: IconPackId,
		name: string,
		variant: string,
	): IconSvgCacheEntry | undefined {
		return this.iconSvgCache.find(
			(e) => e.pack === pack && e.name === name && e.variant === variant,
		);
	}

	addIconSvg(entry: IconSvgCacheEntry): void {
		this.iconSvgCache = this.iconSvgCache.filter(
			(e) =>
				!(
					e.pack === entry.pack &&
					e.name === entry.name &&
					e.variant === entry.variant
				),
		);
		this.iconSvgCache.push(entry);
	}

	/**
	 * Drop cached artwork no callout references any more.
	 *
	 * A single icon can occupy several entries at once, because a pack may draw
	 * it differently per render role — so every role's variant has to be
	 * collected, not just the one the blockquote uses. Miss that and each save
	 * would evict the artwork the inline pills are rendering from.
	 */
	cleanupUnusedIconSvgs(): void {
		const usedKeys = new Set<string>();
		for (const def of this.callouts.values()) {
			const pack = packFor(def.icon);
			if (!pack) continue;
			for (const role of CALLOUT_RENDER_ROLES) {
				usedKeys.add(
					iconCacheKey(
						def.icon.type,
						def.icon.value,
						pack.cacheVariant(def.icon, role),
					),
				);
			}
		}
		this.iconSvgCache = this.iconSvgCache.filter((entry) =>
			usedKeys.has(iconCacheKey(entry.pack, entry.name, entry.variant)),
		);
	}

	clearIconSvgCache(): void {
		this.iconSvgCache = [];
	}

	getIconSvgCacheSize(): number {
		return this.iconSvgCache.reduce(
			(acc, e) => acc + new Blob([e.svg]).size,
			0,
		);
	}

	resetAll(): void {
		this.callouts.clear();
		for (const def of DEFAULT_CALLOUTS) {
			this.callouts.set(def.id, structuredClone(def));
		}
		// Reset global style to defaults
		this.settings.globalStyle = structuredClone(
			DEFAULT_SETTINGS.globalStyle,
		);
		this.settings.contextMenu = structuredClone(
			DEFAULT_SETTINGS.contextMenu,
		);
		this.settings.headingCallouts = structuredClone(
			DEFAULT_SETTINGS.headingCallouts,
		);
		this.settings.inlineCallouts = structuredClone(
			DEFAULT_SETTINGS.inlineCallouts,
		);
		// Reset fallback callout – the previously-selected callout may no
		// longer exist after the reset, which would leave the dropdown blank.
		this.settings.fallbackCalloutId = DEFAULT_SETTINGS.fallbackCalloutId;
		this.settings.customPalettes = [];
		// The user's own pictures go with everything else they made — leaving
		// them behind would keep the largest thing in `data.json` after a reset
		// that is meant to empty it.
		this.settings.userImages = [];
		this.syncUserImages();
		// Clear SVG caches
		this.clearIconSvgCache();
		this.notifyChange();
	}

	importFromCSS(cssText: string): CalloutDefinition[] {
		const imported: CalloutDefinition[] = [];
		// Match patterns like: .callout[data-callout="name"] { --callout-color: <color> }
		// The color is captured raw and parsed below, so both the pre-1.13 RGB
		// triplet (255, 0, 0) and the 1.13+ formats (#ff0000, rgb(255,0,0)) work.
		const regex =
			/\.callout\[data-callout=["']([^"']+)["']\]\s*\{[^}]*--callout-color:\s*([^;}]+)/g;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(cssText)) !== null) {
			const id = match[1];
			const rawColor = match[2];
			if (!id || !rawColor) continue;
			if (this.callouts.has(id)) continue;
			// Skip if ID conflicts with an existing alias
			if (this.findByAlias(id)) continue;

			// Skip colors we can't safely convert to hex (named colors, oklch(), …)
			// rather than importing a callout with a broken color value.
			const hex = parseCssColorToHex(rawColor);
			if (!hex) continue;

			const def: CalloutDefinition = {
				id,
				displayName: id
					.split("-")
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join(" "),
				icon: { type: "lucide", value: "pencil" },
				colorLight: hex,
				colorDark: hex,
				foldable: true,
				defaultFolded: false,
				builtIn: false,
				source: "theme",
			};

			this.callouts.set(id, def);
			imported.push(def);
		}

		if (imported.length > 0) {
			this.notifyChange();
		}
		return imported;
	}

	exportToJSON(): string {
		return JSON.stringify(this.getUserDefined(), null, 2);
	}

	/**
	 * v2 export: callout definitions plus the full plugin settings, wrapped
	 * in a versioned envelope. The legacy `exportToJSON()` (flat definitions
	 * array) is kept because it is part of the public plugin API surface;
	 * the importer accepts both shapes.
	 */
	exportToJSONv2(): string {
		return JSON.stringify(
			{
				format: EXPORT_FORMAT_ID,
				formatVersion: EXPORT_FORMAT_VERSION,
				callouts: this.getUserDefined(),
				settings: this.settings,
			},
			null,
			2,
		);
	}

	onChange(callback: RegistryChangeCallback): void {
		this.changeCallbacks.push(callback);
	}

	offChange(callback: RegistryChangeCallback): void {
		const idx = this.changeCallbacks.indexOf(callback);
		if (idx >= 0) {
			this.changeCallbacks.splice(idx, 1);
		}
	}

	/** The user's own pictures, newest first. */
	getUserImages(): readonly UserImageIcon[] {
		return this.settings.userImages;
	}

	/**
	 * Replace the picture list and tell everything that draws to catch up.
	 *
	 * The single writer, so the pack's snapshot can never drift from settings.
	 * Callers still own persistence — `notifyChange` reaches the CSS injector,
	 * but `saveSettings()` is the plugin's to call, exactly as for callouts.
	 */
	setUserImages(images: readonly UserImageIcon[]): void {
		this.settings.userImages = [...images];
		this.syncUserImages();
		this.notifyChange();
	}

	/**
	 * Hand the pack the current pictures. It reads a module-level snapshot
	 * rather than settings, because `buildSvg` is synchronous and is called from
	 * render paths with no route back to the plugin.
	 */
	private syncUserImages(): void {
		setUserImages(this.settings.userImages);
	}

	private notifyChange(): void {
		for (const cb of this.changeCallbacks) {
			cb();
		}
	}

	/**
	 * Subscribe to transient live-preview changes (see
	 * {@link setPreviewDefinition}). Deliberately separate from
	 * {@link onChange}: a preview is not a mutation, so these listeners must
	 * stay off the `saveSettings` / re-render-every-note path. The settings tab
	 * uses it to keep its row swatches in step with the editor modal's preview.
	 */
	onPreviewChange(callback: RegistryChangeCallback): void {
		this.previewChangeCallbacks.push(callback);
	}

	offPreviewChange(callback: RegistryChangeCallback): void {
		const idx = this.previewChangeCallbacks.indexOf(callback);
		if (idx >= 0) {
			this.previewChangeCallbacks.splice(idx, 1);
		}
	}

	private notifyPreviewChange(): void {
		for (const cb of this.previewChangeCallbacks) {
			cb();
		}
	}
}
