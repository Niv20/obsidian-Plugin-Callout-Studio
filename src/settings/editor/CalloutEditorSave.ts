/**
 * settings/editor/CalloutEditorSave.ts — Save logic for the callout editor modal.
 *
 * Handles the full save flow: writing the definition to the registry,
 * renaming callout IDs in vault files when the ID changes, updating fold
 * markers, and normalizing titles. Separated from CalloutEditor.ts to keep
 * the modal class focused on UI state.
 */
import { Notice } from "obsidian";
import { t } from "../../i18n";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../../types";
import type { CalloutEditorPlugin } from "./types";
import {
	countCalloutUsages,
	normalizeFoldMarkersInVault,
	replaceCalloutIdsInVault,
	replaceCalloutTitlesInVault,
} from "../../utils/vaultCalloutScanner";

export type CalloutEditorSaveState = {
	displayName: string;
	calloutId: string;
	icon: CalloutDefinition["icon"];
	colorLight: string;
	colorDark: string;
	bgColorLight: string;
	bgColorDark: string;
	textColorLight: string;
	textColorDark: string;
	foldable: boolean;
	defaultFolded: boolean;
	iconOffsetX: number;
	iconOffsetY: number;
	iconSize: number;
	aliases: string[];
	/** Id of the custom/preset palette these colors were applied from, if any. */
	paletteId?: string;
};

export type CalloutEditorSaveInput = {
	app: App;
	plugin: CalloutEditorPlugin;
	existingId: string | null;
	isBuiltIn: boolean;
	state: CalloutEditorSaveState;
	hasStyleChanges: boolean;
	saveAsFallback: boolean;
	overwriteAutoFallback: boolean;
	canUseCalloutId: (id: string, role: "primary" | "alias") => boolean;
	getFallbackBase: () => CalloutDefinition | undefined;
	onMaterialDownloadStart?: () => void;
};

export async function performCalloutEditorSave(
	input: CalloutEditorSaveInput,
): Promise<CalloutDefinition | null> {
	const {
		app,
		plugin,
		existingId,
		isBuiltIn,
		state,
		hasStyleChanges,
		saveAsFallback,
		overwriteAutoFallback,
		canUseCalloutId,
		getFallbackBase,
		onMaterialDownloadStart,
	} = input;

	if (!state.calloutId) return null;

	const isIdChanged = existingId !== null && state.calloutId !== existingId;
	const isNew = existingId === null;

	if (
		(isNew || isIdChanged) &&
		!canUseCalloutId(state.calloutId, "primary")
	) {
		return null;
	}
	for (const alias of state.aliases) {
		if (!canUseCalloutId(alias, "alias")) return null;
	}

	let removedIds: string[] = [];
	let oldDisplayName: string | null = null;
	let oldAllIds: string[] = [];
	let oldFoldable = false;
	let oldDefaultFolded = false;
	if (existingId) {
		const existingDef = plugin.registry.get(existingId);
		if (existingDef) {
			oldDisplayName = existingDef.displayName;
			oldAllIds = [existingDef.id, ...(existingDef.aliases ?? [])];
			oldFoldable = existingDef.foldable;
			oldDefaultFolded = existingDef.defaultFolded;
			const newIdSet = new Set(
				[state.calloutId, ...state.aliases].map((s) => s.toLowerCase()),
			);
			removedIds = oldAllIds.filter(
				(id) => !newIdSet.has(id.toLowerCase()),
			);
		}
	}

	const newDisplayName = state.displayName || state.calloutId;
	const existingDef = existingId
		? plugin.registry.get(existingId)
		: undefined;

	let nextSource: CalloutDefinition["source"] = "user";
	if (isBuiltIn) {
		nextSource = "builtin";
	} else if (existingDef) {
		if (
			existingDef.source === "fallback" &&
			existingDef.customized !== true &&
			!hasStyleChanges
		) {
			nextSource = "fallback";
		} else {
			nextSource = "user";
		}
	} else {
		nextSource = saveAsFallback ? "fallback" : "user";
	}

	let customized: boolean | undefined;
	if (!isBuiltIn) {
		if (existingId === null) {
			customized = !saveAsFallback;
		} else {
			const wasCustomized = existingDef?.customized === true;
			customized = wasCustomized || hasStyleChanges;
		}
	}

	const fallbackBase = saveAsFallback ? getFallbackBase() : undefined;

	const def: CalloutDefinition = {
		id: state.calloutId,
		displayName: newDisplayName,
		icon: { ...(fallbackBase?.icon ?? state.icon) },
		colorLight: fallbackBase?.colorLight ?? state.colorLight,
		colorDark: fallbackBase?.colorDark ?? state.colorDark,
		bgColorLight: fallbackBase?.bgColorLight ?? state.bgColorLight,
		bgColorDark: fallbackBase?.bgColorDark ?? state.bgColorDark,
		textColorLight: fallbackBase?.textColorLight ?? state.textColorLight,
		textColorDark: fallbackBase?.textColorDark ?? state.textColorDark,
		foldable: fallbackBase?.foldable ?? state.foldable,
		defaultFolded: fallbackBase?.defaultFolded ?? state.defaultFolded,
		builtIn: isBuiltIn,
		source: nextSource,
		iconOffsetX: fallbackBase?.iconOffsetX ?? state.iconOffsetX,
		iconOffsetY: fallbackBase?.iconOffsetY ?? state.iconOffsetY,
		iconSize: fallbackBase?.iconSize ?? state.iconSize,
		aliases: state.aliases.length > 0 ? [...state.aliases] : undefined,
		paletteId: fallbackBase ? fallbackBase.paletteId : state.paletteId,
		...(customized === true ? { customized: true } : {}),
	};

	let saved = false;
	if (existingId) {
		if (isIdChanged) {
			plugin.registry.remove(existingId);
			saved = plugin.registry.add(def);
		} else {
			saved = plugin.registry.update(existingId, def);
		}
	} else if (overwriteAutoFallback) {
		saved = plugin.registry.update(state.calloutId, def);
	} else {
		saved = plugin.registry.add(def);
	}

	if (!saved) {
		new Notice(t("editor.idConflict"));
		return null;
	}

	if (def.icon.type === "material") {
		onMaterialDownloadStart?.();
		try {
			await plugin.cacheMaterialSvg(def.icon);
			const cached = plugin.registry.findMaterialSvg(
				def.icon.value,
				def.icon.style ?? "outlined",
				def.icon.weight ?? 400,
			);
			console.debug(
				"[CalloutStudio] save: SVG cached?",
				!!cached,
				"cache size:",
				plugin.registry.materialSvgCache.length,
			);
		} catch (err) {
			console.warn("[CalloutStudio] save: SVG download failed", err);
		}
	}

	plugin.registry.cleanupUnusedMaterialSvgs();

	if (removedIds.length > 0) {
		const { fileCount } = await countCalloutUsages(app, removedIds);
		if (fileCount > 0) {
			const replaced = await replaceCalloutIdsInVault(
				app,
				removedIds,
				state.calloutId,
			);
			if (replaced > 0) {
				new Notice(
					t("vault.idsUpdated", {
						count: String(replaced),
						oldIds: removedIds.join(", "),
						newId: state.calloutId,
					}),
				);
			}
		}
	}

	if (
		oldDisplayName &&
		oldDisplayName !== newDisplayName &&
		oldAllIds.length > 0
	) {
		const allCurrentIds = [state.calloutId, ...state.aliases];
		const replaced = await replaceCalloutTitlesInVault(
			app,
			allCurrentIds,
			oldDisplayName,
			newDisplayName,
		);
		if (replaced > 0) {
			new Notice(
				t("vault.titlesUpdated", {
					count: String(replaced),
					oldTitle: oldDisplayName,
					newTitle: newDisplayName,
				}),
			);
		}
	}

	if (
		existingId &&
		(oldFoldable !== state.foldable ||
			oldDefaultFolded !== state.defaultFolded)
	) {
		const desiredMarker: "" | "+" | "-" = !state.foldable
			? ""
			: state.defaultFolded
				? "-"
				: "+";
		const allCurrentIds = [state.calloutId, ...state.aliases];
		await normalizeFoldMarkersInVault(app, allCurrentIds, desiredMarker);
	}

	return def;
}
