/**
 * utils/VaultCalloutStatisticsModal.ts — Vault callout usage statistics modal.
 *
 * Four metric tiles, then one row per callout type: its icon and id, how it is
 * written (block / heading / inline) and the number of files it appears in. The
 * row rendering — and the resolution of a scanned id back to a definition —
 * lives in vaultStatsRow.ts. Opened from DataManagementSection.
 *
 * This is also the only surface that reads the WHOLE vault on demand, so it is
 * where an id no discovery pass has reached yet shows up. Those rows are named
 * and labelled rather than dressed as broken, and the footer offers the same
 * vault scan the settings tab does, so a callout used in notes but missing from
 * the registry can be turned into a real row from here.
 */
import { Modal, Notice } from "obsidian";
import { getLocale, t } from "../i18n";
import { applyModalChrome } from "../settings/modalChrome";
import {
	resolveStatsRows,
	renderStatsTypeRow,
	undefinedRowIds,
	type StatsRow,
} from "./vaultStatsRow";
import type { SettingsSectionContext } from "../settings/sections/types";
import type { VaultCalloutStatistics } from "./vaultCalloutStats";

export class VaultCalloutStatisticsModal extends Modal {
	private readonly numberFormat = new Intl.NumberFormat(getLocale());
	private rows: StatsRow[] = [];
	private listEl: HTMLElement | null = null;

	constructor(
		private ctx: SettingsSectionContext,
		private stats: VaultCalloutStatistics,
	) {
		super(ctx.app);
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		modalEl.addClass("callout-studio-vault-stats-modal");
		contentEl.addClass("callout-studio-vault-stats");

		this.setTitle(t("vaultStats.title"));
		this.renderSummary(contentEl);

		if (this.stats.totalCount === 0) {
			contentEl.createEl("p", {
				cls: "cs-vault-stats-empty",
				text: t("vaultStats.empty"),
			});
		} else {
			this.listEl = contentEl.createDiv({ cls: "cs-vault-stats-list" });
			this.renderTypeList();
		}

		// Dismiss first, action last — the footer is right-aligned, so the
		// rightmost button is the primary one (see ConfirmModal).
		const btnContainer = applyModalChrome(this, { footer: true });
		btnContainer
			.createEl("button", { text: t("vaultStats.close") })
			.addEventListener("click", () => this.close());
		this.renderDefineButton(btnContainer);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderSummary(contentEl: HTMLElement): void {
		const summaryEl = contentEl.createDiv({
			cls: "cs-vault-stats-summary",
		});
		this.createMetric(
			summaryEl,
			t("vaultStats.totalCallouts"),
			this.stats.totalCount,
		);
		this.createMetric(
			summaryEl,
			t("vaultStats.typesFound"),
			this.stats.types.length,
		);
		this.createMetric(
			summaryEl,
			t("vaultStats.filesWithCallouts"),
			this.stats.filesWithCallouts,
		);
		this.createMetric(
			summaryEl,
			t("vaultStats.filesScanned"),
			this.stats.markdownFileCount,
		);
	}

	private createMetric(
		containerEl: HTMLElement,
		label: string,
		value: number,
	): void {
		const metricEl = containerEl.createDiv({
			cls: "cs-vault-stats-metric",
		});
		metricEl.createDiv({
			cls: "cs-vault-stats-metric-value",
			// Grouped per the user's locale — a five-digit vault count is much
			// easier to read as 12,480 than as 12480.
			text: value.toLocaleString(getLocale()),
		});
		metricEl.createDiv({
			cls: "cs-vault-stats-metric-label",
			text: label,
		});
	}

	/**
	 * (Re)build the table. Resolution happens here, once per render, so the
	 * footer button and the rows always agree on which ids are undefined — and
	 * so a scan that defines them can simply re-render.
	 */
	private renderTypeList(): void {
		const listEl = this.listEl;
		if (!listEl) return;
		listEl.empty();
		this.rows = resolveStatsRows(this.ctx.plugin.registry, this.stats.types);

		const headerEl = listEl.createDiv({
			cls: "cs-vault-stats-row cs-vault-stats-header",
		});
		for (const label of [
			t("vaultStats.columnType"),
			t("vaultStats.byRole"),
			t("vaultStats.columnFiles"),
		]) {
			headerEl.createDiv({ text: label });
		}

		const deps = {
			registry: this.ctx.plugin.registry,
			format: (value: number) => this.format(value),
		};
		for (const row of this.rows) {
			renderStatsTypeRow(listEl, row, deps);
		}
	}

	/**
	 * Offers the vault scan when — and only when — the report found ids nothing
	 * defines. `runVaultScan` is the same path the settings tab's "Re-scan
	 * vault" button takes: it clears the rediscovery hold (a user-requested scan
	 * may bring anything back), derives the known set including attribute-form
	 * spellings, saves, and re-injects. Calling it rather than adding the rows
	 * from the list here keeps that one code path.
	 */
	private renderDefineButton(footerEl: HTMLElement): void {
		const undefinedIds = undefinedRowIds(this.rows);
		if (undefinedIds.length === 0) return;
		const btn = footerEl.createEl("button", {
			cls: "mod-cta",
			text: t("vaultStats.defineUndefined", {
				count: this.format(undefinedIds.length),
			}),
		});
		btn.addEventListener("click", () => void this.defineUndefined(btn));
	}

	private async defineUndefined(btn: HTMLButtonElement): Promise<void> {
		btn.disabled = true;
		btn.setText(t("vaultStats.defineRunning"));
		let added = 0;
		try {
			added = await this.ctx.plugin.runVaultScan(false);
		} finally {
			// Either way: the counts cannot have moved — the vault was read, not
			// edited — so only each row's *resolution* can differ. Re-render in
			// place, and never leave the button reading "Scanning" if the scan
			// threw.
			btn.disabled = false;
			this.renderTypeList();
			const left = undefinedRowIds(this.rows).length;
			if (left === 0) btn.remove();
			else {
				btn.setText(
					t("vaultStats.defineUndefined", {
						count: this.format(left),
					}),
				);
			}
		}
		new Notice(t("vaultStats.defineDone", { count: this.format(added) }));
		this.ctx.display();
	}

	private format(value: number): string {
		return this.numberFormat.format(value);
	}
}
