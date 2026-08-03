/**
 * settings/CalloutManagerImportModal.ts — Paste box for the competing
 * "Obsidian Callout Manager" plugin's clipboard export.
 *
 * Parses the pasted CSS text (utils/calloutManagerImport.ts) and, whenever
 * anything needs the user's attention (or nothing was recognized at all),
 * shows the same ImportReportModal the JSON importer uses before applying
 * anything. A clean paste with no issues applies straight away.
 */
import { Modal, Notice } from "obsidian";
import { t } from "../i18n";
import {
	parseCalloutManagerExport,
	planCalloutManagerImport,
} from "../utils/calloutManagerImport";
import { ImportReportModal } from "../utils/ImportReportModal";
import { applyModalChrome } from "./modalChrome";
import type { SettingsSectionContext } from "./sections/types";

export class CalloutManagerImportModal extends Modal {
	private textareaEl!: HTMLTextAreaElement;
	private importBtn!: HTMLButtonElement;

	constructor(private readonly ctx: SettingsSectionContext) {
		super(ctx.app);
	}

	onOpen(): void {
		this.modalEl.addClass("callout-studio-cm-import-modal");
		this.setTitle(t("import.cmTitle"));

		this.contentEl.createEl("p", {
			text: t("import.cmInstructions"),
			cls: "cs-cm-import-instructions",
		});

		this.textareaEl = this.contentEl.createEl("textarea", {
			cls: "cs-cm-import-textarea",
			attr: { placeholder: t("import.cmPlaceholder") },
		});
		this.textareaEl.addEventListener("input", () =>
			this.updateImportState(),
		);

		const btnContainer = applyModalChrome(this, { footer: true });
		btnContainer
			.createEl("button", { text: t("import.cmBtnCancel") })
			.addEventListener("click", () => this.close());

		this.importBtn = btnContainer.createEl("button", {
			text: t("import.cmBtnImport"),
			cls: "mod-cta",
		});
		this.importBtn.disabled = true;
		this.importBtn.addEventListener("click", () => void this.runImport());

		this.textareaEl.focus();
	}

	private updateImportState(): void {
		this.importBtn.disabled = this.textareaEl.value.trim().length === 0;
	}

	private async runImport(): Promise<void> {
		const entries = parseCalloutManagerExport(this.textareaEl.value);
		const { toApply, issues } = planCalloutManagerImport(
			entries,
			this.ctx.plugin.registry,
		);
		const fatal = entries.length === 0;

		if (issues.length > 0 || fatal) {
			const choice = await new ImportReportModal(
				this.ctx.app,
				issues,
				toApply.length,
				entries.length,
				fatal,
			).prompt();
			if (choice === "cancel") return;
		}
		if (toApply.length === 0) return;

		const { created, updated } =
			this.ctx.plugin.registry.applyCalloutManagerImport(toApply);
		new Notice(t("notice.importedCalloutManager", { created, updated }));
		this.ctx.display();
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
