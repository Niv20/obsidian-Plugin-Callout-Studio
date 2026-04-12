import { Modal, Setting } from "obsidian";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../types";
import { t } from "../i18n";

export type DeleteAction =
	| { action: "replace"; replaceWith: string }
	| { action: "delete" }
	| { action: "cancel" };

/**
 * Modal shown when deleting a callout that is in use in vault files.
 * Gives the user options to replace with another callout, delete without
 * replacing, or cancel.
 */
export class ReplaceCalloutModal extends Modal {
	private resolved = false;
	private resolve: (value: DeleteAction) => void = () => {};

	constructor(
		app: App,
		private message: string,
		private availableCallouts: CalloutDefinition[],
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("p", { text: this.message });

		let selectedReplacement = "";
		let replaceBtn: HTMLButtonElement;

		new Setting(contentEl)
			.setName(t("vault.replaceWith"))
			.addDropdown((dd) => {
				dd.addOption("", t("vault.selectCallout"));
				for (const c of this.availableCallouts) {
					dd.addOption(c.id, `${c.displayName} (${c.id})`);
				}
				dd.onChange((val) => {
					selectedReplacement = val;
					replaceBtn.disabled = !val;
					replaceBtn.classList.toggle("cs-btn-disabled", !val);
				});
			});

		const btnContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});

		btnContainer
			.createEl("button", { text: t("confirm.cancel") })
			.addEventListener("click", () => {
				this.resolved = true;
				this.resolve({ action: "cancel" });
				this.close();
			});

		btnContainer
			.createEl("button", {
				text: t("vault.deleteWithout"),
				cls: "mod-warning",
			})
			.addEventListener("click", () => {
				this.resolved = true;
				this.resolve({ action: "delete" });
				this.close();
			});

		replaceBtn = btnContainer.createEl("button", {
			text: t("vault.replaceAndDelete"),
			cls: "mod-cta",
		});
		replaceBtn.disabled = true;
		replaceBtn.classList.add("cs-btn-disabled");
		replaceBtn.addEventListener("click", () => {
			if (!selectedReplacement) return;
			this.resolved = true;
			this.resolve({
				action: "replace",
				replaceWith: selectedReplacement,
			});
			this.close();
		});
	}

	onClose(): void {
		if (!this.resolved) {
			this.resolve({ action: "cancel" });
		}
		this.contentEl.empty();
	}

	prompt(): Promise<DeleteAction> {
		return new Promise<DeleteAction>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}
}
