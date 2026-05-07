/**
 * utils/VaultCalloutStatisticsModal.ts — Vault callout usage statistics modal.
 *
 * Displays a summary of how many markdown files and callout blocks were found,
 * broken down by callout type. Each row shows the callout's icon, name, and
 * counts. Aliases are resolved back to their primary definition via the
 * registry so duplicates are grouped correctly. Opened from DataManagementSection.
 */
import { Modal, setIcon } from "obsidian";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import { getLocale, t } from "../i18n";
import { createAnimatedNumberLabel } from "../ui/AnimatedNumberLabel";
import type {
	VaultCalloutStatistics,
	VaultCalloutTypeStatistics,
} from "./vaultCalloutScanner";

type DefinitionLookup = {
	def: CalloutDefinition;
	isAlias: boolean;
};

export class VaultCalloutStatisticsModal extends Modal {
	private readonly primaryIds = new Map<string, CalloutDefinition>();
	private readonly aliases = new Map<string, CalloutDefinition>();
	private readonly numberFormat = new Intl.NumberFormat(getLocale());

	constructor(
		app: App,
		private stats: VaultCalloutStatistics,
		private registry: CalloutRegistry,
	) {
		super(app);
		for (const def of registry.getAll()) {
			this.primaryIds.set(def.id.toLowerCase(), def);
			for (const alias of def.aliases ?? []) {
				this.aliases.set(alias.toLowerCase(), def);
			}
		}
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
			this.renderTypeList(contentEl);
		}

		const btnContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});
		btnContainer
			.createEl("button", { text: t("vaultStats.close") })
			.addEventListener("click", () => this.close());
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
		const valueEl = metricEl.createDiv({
			cls: "cs-vault-stats-metric-value",
		});
		const flow = createAnimatedNumberLabel(valueEl, {
			initialValue: 0,
			locales: getLocale(),
		});
		flow.el.classList.remove(
			"callout-studio-slider-value",
			"callout-studio-number-flow",
		);
		flow.el.transformTiming = { duration: 400, easing: "ease-out" };
		flow.el.spinTiming = { duration: 400, easing: "ease-out" };
		// Wait for the modal open animation to settle, then count up.
		window.setTimeout(() => {
			flow.update(value);
		}, 50);
		metricEl.createDiv({
			cls: "cs-vault-stats-metric-label",
			text: label,
		});
	}

	private renderTypeList(contentEl: HTMLElement): void {
		const listEl = contentEl.createDiv({ cls: "cs-vault-stats-list" });
		const headerEl = listEl.createDiv({
			cls: "cs-vault-stats-row cs-vault-stats-header",
		});
		for (const label of [
			t("vaultStats.columnType"),
			t("vaultStats.columnName"),
			t("vaultStats.columnSource"),
			t("vaultStats.columnCount"),
			t("vaultStats.columnFiles"),
		]) {
			headerEl.createDiv({ text: label });
		}

		for (const entry of this.stats.types) {
			this.renderTypeRow(listEl, entry);
		}
	}

	private renderTypeRow(
		containerEl: HTMLElement,
		entry: VaultCalloutTypeStatistics,
	): void {
		const lookup = this.findDefinition(entry.id);
		const rowEl = containerEl.createDiv({ cls: "cs-vault-stats-row" });

		const typeEl = rowEl.createDiv({ cls: "cs-vault-stats-type" });
		const iconEl = typeEl.createSpan({ cls: "cs-vault-stats-type-icon" });
		if (lookup) {
			iconEl.style.color = this.getCalloutColor(lookup.def);
			this.renderIcon(iconEl, lookup.def);
		} else {
			iconEl.addClass("is-unknown");
			setIcon(iconEl, "circle-help");
		}
		rowEl.createDiv({
			cls: "cs-vault-stats-name",
			text: lookup?.def.displayName ?? t("vaultStats.unknown"),
		});
		rowEl.createDiv({
			cls: "cs-vault-stats-source",
			text: this.getSourceLabel(lookup),
		});
		rowEl.createDiv({
			cls: "cs-vault-stats-count",
			text: this.format(entry.totalCount),
		});
		rowEl.createDiv({
			cls: "cs-vault-stats-files",
			text: this.format(entry.fileCount),
		});
	}

	private findDefinition(id: string): DefinitionLookup | null {
		const primary = this.primaryIds.get(id);
		if (primary) return { def: primary, isAlias: false };
		const alias = this.aliases.get(id);
		if (alias) return { def: alias, isAlias: true };
		return null;
	}

	private getSourceLabel(lookup: DefinitionLookup | null): string {
		if (!lookup) return t("vaultStats.sourceUnknown");
		if (lookup.isAlias) {
			return t("vaultStats.sourceAlias", { id: lookup.def.id });
		}
		if (lookup.def.builtIn) return t("vaultStats.sourceBuiltIn");
		if (
			lookup.def.source === "fallback" &&
			lookup.def.customized !== true
		) {
			return t("vaultStats.sourceAutoFallback");
		}
		if (lookup.def.source === "theme") return t("vaultStats.sourceTheme");
		return t("vaultStats.sourceCustom");
	}

	private renderIcon(iconEl: HTMLElement, def: CalloutDefinition): void {
		try {
			if (def.icon.type === "lucide") {
				setIcon(iconEl, def.icon.value);
			} else if (def.icon.type === "emoji") {
				iconEl.textContent = def.icon.value;
			} else if (def.icon.type === "material") {
				const cached = this.registry.findMaterialSvg(
					def.icon.value,
					def.icon.style ?? "outlined",
					def.icon.weight ?? 400,
				);
				if (cached) {
					const parser = new DOMParser();
					const doc = parser.parseFromString(
						cached.svg,
						"image/svg+xml",
					);
					const svgEl = doc.documentElement;
					svgEl.setAttribute("fill", "currentColor");
					iconEl.appendChild(iconEl.doc.importNode(svgEl, true));
				} else {
					setIcon(iconEl, "pencil");
				}
			} else {
				setIcon(iconEl, "pencil");
			}
		} catch {
			iconEl.textContent = "?";
		}
	}

	private getCalloutColor(def: CalloutDefinition): string {
		return document.body.classList.contains("theme-dark")
			? def.colorDark
			: def.colorLight;
	}

	private format(value: number): string {
		return this.numberFormat.format(value);
	}
}
