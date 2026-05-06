import { Modal } from "obsidian";
import type { App } from "obsidian";
import { t } from "../i18n";
import type { ValidationIssue } from "./importValidator";

export type ImportReportChoice = "cancel" | "importValid";

/**
 * Centered modal that lists every validation issue found in an imported JSON
 * file, grouped per entry. Lets the user cancel or import only the entries
 * that were fully valid.
 */
export class ImportReportModal extends Modal {
	private resolved = false;
	private resolve: (value: ImportReportChoice) => void = () => {};

	constructor(
		app: App,
		private issues: ValidationIssue[],
		private validCount: number,
		private totalCount: number,
		private fatal: boolean,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		modalEl.addClass("callout-studio-import-report-modal");
		contentEl.addClass("callout-studio-import-report");

		this.setTitle(t("import.title"));

		const lead = this.fatal
			? t("import.reportLeadInFatal")
			: t("import.reportLeadIn");
		contentEl.createEl("p", {
			text: lead,
			cls: "cs-import-report-lead",
		});

		// Group issues by entry index. -1 means top-level.
		const grouped = new Map<number, ValidationIssue[]>();
		const labels = new Map<number, string>();
		for (const issue of this.issues) {
			const arr = grouped.get(issue.index) ?? [];
			arr.push(issue);
			grouped.set(issue.index, arr);
			if (issue.entryLabel) labels.set(issue.index, issue.entryLabel);
		}

		const listEl = contentEl.createEl("div", {
			cls: "cs-import-report-list",
		});

		const sortedKeys = [...grouped.keys()].sort((a, b) => a - b);
		for (const key of sortedKeys) {
			const groupIssues = grouped.get(key) ?? [];
			const groupEl = listEl.createDiv({ cls: "cs-import-report-group" });

			if (key >= 0) {
				groupEl.createEl("div", {
					cls: "cs-import-report-group-heading",
					text: t("import.entryHeading", {
						index: key + 1,
						label: labels.get(key) ?? `#${key + 1}`,
					}),
				});
			}

			const ul = groupEl.createEl("ul", {
				cls: "cs-import-report-issues",
			});
			for (const issue of groupIssues) {
				const li = ul.createEl("li", {
					cls: `cs-import-issue cs-import-issue-${issue.level}`,
				});
				if (issue.field) {
					li.createEl("code", {
						cls: "cs-import-issue-field",
						text: issue.field,
					});
					li.appendText(" — ");
				}
				li.appendText(t(issue.messageKey, issue.params));
			}
		}

		// Summary line
		const summaryEl = contentEl.createEl("p", {
			cls: "cs-import-report-summary",
		});
		summaryEl.setText(
			t("import.summary", {
				valid: this.validCount,
				total: this.totalCount,
				issues: this.issues.length,
			}),
		);

		// Footer buttons
		const btnContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});

		btnContainer
			.createEl("button", { text: t("import.btnCancel") })
			.addEventListener("click", () => this.finish("cancel"));

		if (!this.fatal) {
			const importBtn = btnContainer.createEl("button", {
				text: t("import.btnImportValid", { count: this.validCount }),
				cls: "mod-cta",
			});
			if (this.validCount === 0) {
				importBtn.disabled = true;
			}
			importBtn.addEventListener("click", () =>
				this.finish("importValid"),
			);
		}
	}

	private finish(choice: ImportReportChoice): void {
		this.resolved = true;
		this.resolve(choice);
		this.close();
	}

	onClose(): void {
		if (!this.resolved) {
			this.resolve("cancel");
		}
		this.contentEl.empty();
	}

	prompt(): Promise<ImportReportChoice> {
		return new Promise<ImportReportChoice>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}
}
