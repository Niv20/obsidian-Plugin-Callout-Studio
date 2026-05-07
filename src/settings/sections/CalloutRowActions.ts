import { Menu, Notice } from "obsidian";
import { ConfirmModal } from "../../utils/ConfirmModal";
import { DeleteCalloutModal } from "../../utils/DeleteCalloutModal";
import { ReplaceCalloutModal } from "../../utils/ReplaceCalloutModal";
import {
	convertCalloutsToPlainTextInVault,
	countCalloutUsages,
	replaceCalloutIdsInVault,
} from "../../utils/vaultCalloutScanner";
import { t } from "../../i18n";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../../types";
import type { SettingsSectionContext } from "./types";

const convertVaultCalloutsToPlainText = (
	app: App,
	ids: string[],
): Promise<{ files: number; blocks: number }> =>
	(
		convertCalloutsToPlainTextInVault as (
			app: App,
			ids: string[],
		) => Promise<{ files: number; blocks: number }>
	)(app, ids);

const convertRegistryCalloutToFallback = (
	ctx: SettingsSectionContext,
	id: string,
): boolean =>
	(ctx.plugin.registry.convertToFallback as (id: string) => boolean)(id);

export async function openBuiltInRowMenu(
	ctx: SettingsSectionContext,
	event: MouseEvent,
	def: CalloutDefinition,
): Promise<void> {
	const allIds = [def.id, ...(def.aliases ?? [])];
	const usage = await countCalloutUsages(ctx.app, allIds);
	const menu = new Menu();
	const modified = ctx.plugin.registry.isBuiltInModified(def.id);

	addUsageInfoMenuItem(menu, usage);
	menu.addSeparator();

	if (modified) {
		menu.addItem((item) =>
			item
				.setTitle(t("settings.resetAction"))
				.setIcon("rotate-ccw")
				.onClick(() => {
					void handleBuiltInReset(ctx, def);
				}),
		);
	}

	menu.addItem((item) =>
		item
			.setTitle(t("settings.replaceAction"))
			.setIcon("arrow-left-right")
			.onClick(() => {
				void handleCalloutReplace(ctx, def);
			}),
	);

	if (usage.fileCount > 0) {
		menu.addItem((item) =>
			item
				.setTitle(t("settings.deleteAction"))
				.setIcon("trash-2")
				.onClick(() => {
					void handleBuiltInCalloutDelete(ctx, def, usage);
				}),
		);
	}

	menu.showAtMouseEvent(event);
}

export async function openRowMenu(
	ctx: SettingsSectionContext,
	event: MouseEvent,
	def: CalloutDefinition,
): Promise<void> {
	const allIds = [def.id, ...(def.aliases ?? [])];
	const usage = await countCalloutUsages(ctx.app, allIds);
	const menu = new Menu();

	addUsageInfoMenuItem(menu, usage);
	menu.addSeparator();

	menu.addItem((item) =>
		item
			.setTitle(t("settings.replaceAction"))
			.setIcon("arrow-left-right")
			.onClick(() => {
				void handleCalloutReplace(ctx, def);
			}),
	);

	menu.addItem((item) =>
		item
			.setTitle(t("settings.deleteAction"))
			.setIcon("trash-2")
			.onClick(() => {
				void handleCalloutDelete(ctx, def, usage);
			}),
	);

	const isFallbackTarget = def.id === ctx.plugin.settings.fallbackCalloutId;
	const alreadyMirrors = def.source === "fallback" && def.customized !== true;
	if (!isFallbackTarget && !alreadyMirrors) {
		menu.addItem((item) =>
			item
				.setTitle(t("settings.makeFallbackAction"))
				.setIcon("sparkles")
				.onClick(() => {
					void handleConvertToFallback(ctx, def);
				}),
		);
	}

	menu.showAtMouseEvent(event);
}

function addUsageInfoMenuItem(
	menu: Menu,
	usage: { fileCount: number; totalCount: number },
): void {
	menu.addItem((item) =>
		item
			.setTitle(
				t("settings.usageInfo", {
					count: String(usage.totalCount),
					files: String(usage.fileCount),
				}),
			)
			.setIcon("info")
			.setDisabled(true),
	);
}

async function handleConvertToFallback(
	ctx: SettingsSectionContext,
	def: CalloutDefinition,
): Promise<void> {
	if (!convertRegistryCalloutToFallback(ctx, def.id)) {
		return;
	}
	await ctx.plugin.saveSettings();
	ctx.plugin.refreshCallouts();
	ctx.display();
}

async function handleCalloutDelete(
	ctx: SettingsSectionContext,
	def: CalloutDefinition,
	knownUsage?: { fileCount: number; totalCount: number },
): Promise<void> {
	const allIds = [def.id, ...(def.aliases ?? [])];
	const usage = knownUsage ?? (await countCalloutUsages(ctx.app, allIds));

	const action = await new DeleteCalloutModal(ctx.app, {
		def,
		usage,
	}).prompt();

	if (action === "cancel") return;

	if (action === "replace") {
		await handleCalloutReplace(ctx, def);
		return;
	}

	if (usage.fileCount > 0) {
		const result = await convertVaultCalloutsToPlainText(ctx.app, allIds);
		new Notice(
			t("vault.convertedToPlainText", {
				blocks: String(result.blocks),
				files: String(result.files),
			}),
		);
	}
	ctx.plugin.registry.remove(def.id);
	ctx.plugin.registry.cleanupUnusedMaterialSvgs();
	ctx.display();
}

async function handleBuiltInCalloutDelete(
	ctx: SettingsSectionContext,
	def: CalloutDefinition,
	knownUsage?: { fileCount: number; totalCount: number },
): Promise<void> {
	const allIds = [def.id, ...(def.aliases ?? [])];
	const usage = knownUsage ?? (await countCalloutUsages(ctx.app, allIds));
	if (usage.fileCount === 0) return;

	const action = await new DeleteCalloutModal(ctx.app, {
		def,
		usage,
	}).prompt();

	if (action === "cancel") return;

	if (action === "replace") {
		await handleCalloutReplace(ctx, def);
		return;
	}

	const result = await convertVaultCalloutsToPlainText(ctx.app, allIds);
	new Notice(
		t("vault.convertedToPlainText", {
			blocks: String(result.blocks),
			files: String(result.files),
		}),
	);
	ctx.display();
}

async function handleCalloutReplace(
	ctx: SettingsSectionContext,
	def: CalloutDefinition,
): Promise<void> {
	const allIds = [def.id, ...(def.aliases ?? [])];
	const { fileCount, totalCount } = await countCalloutUsages(ctx.app, allIds);
	const otherCallouts = ctx.plugin.registry
		.getAll()
		.filter((c) => c.id !== def.id);
	if (otherCallouts.length === 0) {
		new Notice(t("vault.noReplacementAvailable"));
		return;
	}

	const message =
		fileCount > 0
			? t("vault.replacePromptInUse", {
					name: def.displayName,
					count: String(totalCount),
					files: String(fileCount),
				})
			: t("vault.replacePromptUnused", { name: def.displayName });

	const result = await new ReplaceCalloutModal(ctx.app, {
		mode: "replace",
		message,
		availableCallouts: otherCallouts,
		registry: ctx.plugin.registry,
		fallbackId: ctx.plugin.settings.fallbackCalloutId,
	}).prompt();

	if (result.action !== "replace") return;

	if (fileCount > 0) {
		const replaced = await replaceCalloutIdsInVault(
			ctx.app,
			allIds,
			result.replaceWith,
		);
		new Notice(t("vault.filesUpdated", { count: String(replaced) }));
	} else {
		new Notice(t("vault.filesUpdated", { count: "0" }));
	}
	ctx.display();
}

async function handleBuiltInReset(
	ctx: SettingsSectionContext,
	def: CalloutDefinition,
): Promise<void> {
	const original = ctx.plugin.registry.getBuiltInDefault(def.id);
	if (original) {
		const currentAliases = def.aliases ?? [];
		const originalAliasSet = new Set(
			(original.aliases ?? []).map((a) => a.toLowerCase()),
		);
		const customAliases = currentAliases.filter(
			(a) => !originalAliasSet.has(a.toLowerCase()),
		);

		if (customAliases.length > 0) {
			const { fileCount, totalCount } = await countCalloutUsages(
				ctx.app,
				customAliases,
			);
			if (fileCount > 0) {
				const confirmed = await new ConfirmModal(
					ctx.app,
					t("vault.resetAliasWarning", {
						count: String(totalCount),
						files: String(fileCount),
						aliases: customAliases.join(", "),
					}),
					t("vault.resetConfirm"),
				).confirm();
				if (!confirmed) return;
			}
		}
	}

	ctx.plugin.registry.resetBuiltIn(def.id);
	ctx.display();
}
