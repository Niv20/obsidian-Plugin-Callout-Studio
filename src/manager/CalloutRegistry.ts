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
	LegacyPopupSettings,
	MaterialIconStyle,
	MaterialSvgCacheEntry,
	PluginData,
	PluginSettings,
} from "../types";
import {
	DEFAULT_CALLOUTS,
	DEFAULT_CONTEXT_MENU_ITEMS,
	DEFAULT_SETTINGS,
} from "../constants";
import { parseCssColorToHex } from "../utils/colorUtils";
import { sanitizeCustomPalettes } from "../utils/colorPalettes";
import { sortCalloutsByDisplayName } from "../utils/sorting";

const CURRENT_DATA_VERSION = 2;
const SORTED_DEFAULT_CALLOUTS = sortCalloutsByDisplayName(DEFAULT_CALLOUTS);

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
		iconSources: {
			...DEFAULT_SETTINGS.iconSources,
			...savedSettings.iconSources,
		},
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
	};
}

export type RegistryChangeCallback = () => void;

export class CalloutRegistry {
	private callouts: Map<string, CalloutDefinition> = new Map();
	private builtInDefaults: Map<string, CalloutDefinition> = new Map();
	private changeCallbacks: RegistryChangeCallback[] = [];
	settings: PluginSettings;
	materialSvgCache: MaterialSvgCacheEntry[] = [];

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

	constructor() {
		this.settings = structuredClone(DEFAULT_SETTINGS);
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
			this.settings = mergeSavedSettings(
				data.settings as LegacySavedSettings,
			);
		}

		// Restore downloaded SVG data for Material icons selected by the user.
		if (data.materialSvgCache) {
			this.materialSvgCache = data.materialSvgCache;
		}
		// Migration: any callout that still references the removed `svg` icon
		// type falls back to a generic lucide pencil so renders don't crash.
		for (const def of this.callouts.values()) {
			const t = (def.icon?.type as string | undefined) ?? "lucide";
			if (t === "svg") {
				def.icon = { type: "lucide", value: "pencil" };
			}
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
			materialSvgCache:
				this.materialSvgCache.length > 0
					? this.materialSvgCache
					: undefined,
		};
	}

	private isModified(
		current: CalloutDefinition,
		original: CalloutDefinition,
	): boolean {
		const aliasesChanged =
			JSON.stringify(current.aliases ?? []) !==
			JSON.stringify(original.aliases ?? []);
		return (
			current.displayName !== original.displayName ||
			current.colorLight !== original.colorLight ||
			current.colorDark !== original.colorDark ||
			current.icon.type !== original.icon.type ||
			current.icon.value !== original.icon.value ||
			current.icon.style !== original.icon.style ||
			current.foldable !== original.foldable ||
			current.defaultFolded !== original.defaultFolded ||
			aliasesChanged
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
		return this.getAll().filter(
			(d) => !d.builtIn && !this.isUnshadowedPreview(d.id),
		);
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
		return this.getAll().filter((d) => d.builtIn);
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
	 * - {@link toSaveData} skips (or substitutes the shadowed original for) the
	 *   active preview ID, so the in-progress edit can never reach disk.
	 *
	 * Deliberately does NOT call `notifyChange()`: that would trigger the
	 * `onChange` → `saveSettings` write and force every open note to re-render.
	 * The caller instead requests a targeted `cssInjector.inject(false)`.
	 */
	setPreviewDefinition(def: CalloutDefinition | null): void {
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
		}

		if (def) {
			const existing = this.callouts.get(def.id);
			this.previewShadowedDef = existing ?? null;
			this.previewActiveId = def.id;
			this.callouts.set(def.id, def);
		}
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

	// ── Material SVG cache ───────────────────────────────────

	findMaterialSvg(
		name: string,
		style: MaterialIconStyle,
		weight: number = 400,
	): MaterialSvgCacheEntry | undefined {
		return this.materialSvgCache.find(
			(e) => e.name === name && e.style === style && e.weight === weight,
		);
	}

	addMaterialSvg(entry: MaterialSvgCacheEntry): void {
		this.materialSvgCache = this.materialSvgCache.filter(
			(e) =>
				!(
					e.name === entry.name &&
					e.style === entry.style &&
					e.weight === entry.weight
				),
		);
		this.materialSvgCache.push(entry);
	}

	/** Removes cached Material SVGs that are no longer used by any callout. */
	cleanupUnusedMaterialSvgs(): void {
		const usedKeys = new Set<string>();
		for (const def of this.callouts.values()) {
			if (def.icon.type === "material") {
				usedKeys.add(
					`${def.icon.style ?? "outlined"}/${def.icon.value}/${def.icon.weight ?? 400}`,
				);
			}
		}
		this.materialSvgCache = this.materialSvgCache.filter((entry) =>
			usedKeys.has(`${entry.style}/${entry.name}/${entry.weight}`),
		);
	}

	clearMaterialSvgCache(): void {
		this.materialSvgCache = [];
	}

	getMaterialSvgCacheSize(): number {
		return this.materialSvgCache.reduce(
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
		// Clear SVG caches
		this.materialSvgCache = [];
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

	private notifyChange(): void {
		for (const cb of this.changeCallbacks) {
			cb();
		}
	}
}
