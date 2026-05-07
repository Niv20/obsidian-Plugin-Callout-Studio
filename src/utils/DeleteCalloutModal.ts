import { Modal } from "obsidian";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../types";
import { t } from "../i18n";

export type DeleteCalloutAction = "cancel" | "delete" | "replace";

export interface DeleteCalloutModalOptions {
	def: CalloutDefinition;
	/** Vault usage stats for the callout (and its aliases). `fileCount === 0`
	 * triggers the "no usage, custom callout" copy variant. */
	usage: { fileCount: number; totalCount: number };
}

/**
 * Confirmation popup for the trash button on the "My callout types" list.
 *
 * - When the callout is used in the vault: warns about the conversion to plain
 *   text, offers a "Replace instead…" pivot, and a red "Delete" button.
 * - When the callout has no usages (a sticky customized row): explains that
 *   nothing references it and offers a red "Delete" button only.
 *
 * The modal returns a {@link DeleteCalloutAction}. Closing the modal without
 * choosing an action resolves to `"cancel"`.
 */
export class DeleteCalloutModal extends Modal {
	private resolved = false;
	private resolve: (value: DeleteCalloutAction) => void = () => {};

	constructor(
		app: App,
		private options: DeleteCalloutModalOptions,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		this.modalEl.addClass("callout-studio-delete-modal");

		const { def, usage } = this.options;
		const inUse = usage.fileCount > 0;

		this.setTitle(t("deleteModal.title", { name: def.displayName }));

		if (inUse) {
			contentEl.createEl("p", {
				text: t("deleteModal.bodyInUse", {
					name: def.displayName,
					count: String(usage.totalCount),
					files: String(usage.fileCount),
				}),
			});
			contentEl.createEl("p", {
				text: t("deleteModal.bodyInUseExplain"),
				cls: "callout-studio-delete-modal-warning",
			});
			contentEl.createEl("p", {
				text: t("deleteModal.replaceHint"),
				cls: "callout-studio-delete-modal-hint",
			});
		} else {
			contentEl.createEl("p", {
				text: t("deleteModal.bodyUnused", { name: def.displayName }),
			});
		}

		const btnContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});

		const cancelBtn = btnContainer.createEl("button", {
			text: t("confirm.cancel"),
		});
		cancelBtn.addEventListener("click", () => {
			this.resolveWith("cancel");
		});

		if (inUse) {
			const replaceBtn = btnContainer.createEl("button", {
				text: t("deleteModal.replaceInstead"),
			});
			replaceBtn.addEventListener("click", () => {
				this.resolveWith("replace");
			});
		}

		const deleteBtn = btnContainer.createEl("button", {
			text: inUse
				? t("deleteModal.deleteInUse")
				: t("deleteModal.deleteUnused"),
			cls: "mod-warning",
		});
		deleteBtn.addEventListener("click", () => {
			this.resolveWith("delete");
		});
	}

	private resolveWith(action: DeleteCalloutAction): void {
		if (this.resolved) return;
		this.resolved = true;
		this.resolve(action);
		this.close();
	}

	onClose(): void {
		if (!this.resolved) {
			this.resolved = true;
			this.resolve("cancel");
		}
		this.contentEl.empty();
	}

	prompt(): Promise<DeleteCalloutAction> {
		return new Promise<DeleteCalloutAction>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}
}
