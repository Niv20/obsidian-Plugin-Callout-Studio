/**
 * settings/sections/DataManagementSection.ts — Import, export, and reset settings.
 *
 * Renders the "Vault insights & maintenance" and "Import / Export" sections in
 * the settings tab. Handles JSON export of all user callouts, JSON import with
 * validation (via importValidator), vault re-scan, and full data reset.
 * Uses ImportReportModal to surface validation issues before import.
 */
import { Notice, Setting } from "obsidian";
import { t } from "../../i18n";
import { ConfirmModal } from "../../utils/ConfirmModal";
import { ImportReportModal } from "../../utils/ImportReportModal";
import { validateImportPayload } from "../../utils/importValidator";
import {
	countCalloutUsages,
	scanVaultCalloutStatistics,
	type VaultCalloutStatistics,
} from "../../utils/vaultCalloutScanner";
import { VaultCalloutStatisticsModal } from "../../utils/VaultCalloutStatisticsModal";
import type { App } from "obsidian";
import type { SettingsSectionContext } from "./types";

const scanVaultStats = (app: App): Promise<VaultCalloutStatistics> =>
	scanVaultCalloutStatistics(app);

export function renderImportExportSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl).setName(t("settings.importExport")).setHeading();

	new Setting(containerEl)
		.setName(t("settings.import"))
		.setDesc(t("settings.importDesc"))
		.addButton((btn) => {
			btn.setButtonText(t("settings.import"))
				.setIcon("download")
				.onClick(() => importFromJSON(ctx));
			btn.buttonEl.addClass("cs-settings-neutral-btn");
		});

	new Setting(containerEl)
		.setName(t("settings.export"))
		.setDesc(t("settings.exportDesc"))
		.addButton((btn) => {
			btn.setButtonText(t("settings.export"))
				.setIcon("upload")
				.onClick(() => exportCallouts(ctx));
			btn.buttonEl.addClass("cs-settings-neutral-btn");
		});
}

export function renderResetSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl)
		.setName(t("settings.vaultMaintenance"))
		.setHeading();

	new Setting(containerEl)
		.setName(t("settings.vaultStats"))
		.setDesc(t("settings.vaultStatsDesc"))
		.addButton((btn) => {
			btn.setButtonText(t("settings.vaultStatsButton")).onClick(
				async () => {
					btn.setDisabled(true);
					btn.setButtonText(t("settings.vaultStatsScanning"));
					try {
						await showVaultStatistics(ctx);
					} finally {
						btn.setDisabled(false);
						btn.setButtonText(t("settings.vaultStatsButton"));
					}
				},
			);
			btn.buttonEl.addClass("cs-settings-neutral-btn");
		});

	new Setting(containerEl)
		.setName(t("settings.rescanVault"))
		.setDesc(t("settings.rescanVaultDesc"))
		.addButton((btn) => {
			btn.setButtonText(t("settings.rescanVaultHintAction")).onClick(
				() => {
					void runVaultRescan(ctx);
				},
			);
			btn.buttonEl.addClass("cs-settings-neutral-btn");
		});

	new Setting(containerEl)
		.setName(t("settings.resetAll"))
		.setDesc(t("settings.resetAllDesc"))
		.addButton((btn) =>
			btn
				.setButtonText(t("settings.resetAllButton"))
				.setWarning()
				.onClick(async () => {
					const userCallouts = ctx.plugin.registry.getUserDefined();
					const userIds = userCallouts.flatMap((c) => [
						c.id,
						...(c.aliases ?? []),
					]);

					const messageFrag = createFragment();
					if (userIds.length > 0) {
						const { fileCount, totalCount } =
							await countCalloutUsages(ctx.app, userIds);
						if (fileCount > 0) {
							messageFrag.createEl("p", {
								text: t("vault.resetAllInUse", {
									count: String(totalCount),
									files: String(fileCount),
								}),
								cls: "cs-reset-warning",
							});
						}
					}
					messageFrag.createEl("p", {
						text: t("settings.resetAllConfirm"),
					});

					const confirmed = await new ConfirmModal(
						ctx.app,
						messageFrag,
					).confirm();
					if (!confirmed) return;
					ctx.plugin.registry.resetAll();
					ctx.plugin.cssInjector.inject();
					await ctx.plugin.saveSettings();
					new Notice(t("notice.resetAllDone"));
					ctx.display();
				}),
		);
}

async function runVaultRescan(ctx: SettingsSectionContext): Promise<void> {
	const added = await ctx.plugin.runVaultScan(false);
	new Notice(
		t("settings.rescanComplete", {
			count: String(added),
		}),
	);
	ctx.display();
}

async function showVaultStatistics(ctx: SettingsSectionContext): Promise<void> {
	new VaultCalloutStatisticsModal(
		ctx.app,
		await scanVaultStats(ctx.app),
		ctx.plugin.registry,
	).open();
}

function exportCallouts(ctx: SettingsSectionContext): void {
	// v2 export: callouts + all plugin settings (menu config, role toggles, …).
	const json = ctx.plugin.registry.exportToJSONv2();
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = createEl("a");
	a.href = url;
	a.download = "callout-studio-export.json";
	a.click();
	URL.revokeObjectURL(url);
	new Notice(t("notice.exported"));
}

function importFromJSON(ctx: SettingsSectionContext): void {
	const input = createEl("input");
	input.type = "file";
	input.accept = ".json";
	// eslint-disable-next-line @typescript-eslint/no-misused-promises -- DOM change handler is fire-and-forget; async errors are handled inside the callback.
	input.addEventListener("change", async () => {
		const file = input.files?.[0];
		if (!file) return;

		let parsed: unknown;
		try {
			const text = await file.text();
			parsed = JSON.parse(text);
		} catch {
			await new ImportReportModal(
				ctx.app,
				[
					{
						index: -1,
						entryLabel: "",
						level: "error",
						messageKey: "import.err.parseFailed",
					},
				],
				0,
				0,
				true,
			).prompt();
			return;
		}

		const result = validateImportPayload(parsed, ctx.plugin.registry);

		if (result.issues.length > 0 || result.fatal) {
			const total = countImportedCallouts(parsed);
			const choice = await new ImportReportModal(
				ctx.app,
				result.issues,
				result.validDefs.length,
				total,
				result.fatal,
			).prompt();
			if (choice === "cancel") return;
		}

		const defs = result.validDefs;

		let imported = 0;
		let overwritten = 0;
		for (const def of defs) {
			if (ctx.plugin.registry.has(def.id)) {
				ctx.plugin.registry.update(def.id, def);
				overwritten++;
				imported++;
			} else {
				const added = ctx.plugin.registry.add(def);
				if (added) imported++;
			}
		}

		// v2 files also carry plugin settings; apply them field-by-field
		// (result.settings is already merged against defaults, so unknown
		// fields are impossible here).
		const settingsImported = !!result.settings;
		if (result.settings) {
			// Merge saved palettes by id rather than letting Object.assign
			// replace the array wholesale — otherwise importing a file with
			// no palettes would silently wipe the user's existing ones. This
			// mirrors how callouts are merged (add new / overwrite same id).
			const { customPalettes: importedPalettes, ...restSettings } =
				result.settings;
			Object.assign(ctx.plugin.registry.settings, restSettings);
			if (importedPalettes) {
				const byId = new Map(
					ctx.plugin.registry.settings.customPalettes.map((p) => [
						p.id,
						p,
					]),
				);
				for (const palette of importedPalettes) {
					byId.set(palette.id, palette);
				}
				ctx.plugin.registry.settings.customPalettes = [
					...byId.values(),
				];
			}
			await ctx.plugin.saveSettings();
			ctx.plugin.refreshRenderModes();
		}

		if (imported > 0) {
			if (overwritten > 0) {
				new Notice(
					t("settings.importConflictNotice", {
						count: imported,
						overwritten,
					}),
				);
			} else {
				new Notice(t("notice.importedJSON", { count: imported }));
			}
			ctx.display();
			for (const def of defs) {
				if (def.icon.type === "material") {
					void ctx.plugin.cacheMaterialSvg(def.icon);
				}
			}
		} else if (settingsImported) {
			new Notice(t("notice.importedSettings"));
			ctx.display();
		} else {
			new Notice(t("notice.noNewJSON"));
		}
	});
	input.click();
}

/** Number of callout entries in either import shape (for the report modal). */
function countImportedCallouts(parsed: unknown): number {
	if (Array.isArray(parsed)) return parsed.length;
	if (
		parsed &&
		typeof parsed === "object" &&
		Array.isArray((parsed as { callouts?: unknown }).callouts)
	) {
		return (parsed as { callouts: unknown[] }).callouts.length;
	}
	return 0;
}
