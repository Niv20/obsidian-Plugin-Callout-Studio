/**
 * utils/ConfirmModal.ts — Generic yes/no confirmation dialog.
 *
 * A simple reusable modal that presents a message and two buttons (confirm /
 * cancel) and resolves a Promise<boolean>. Used throughout the settings
 * sections whenever a destructive action needs user confirmation before
 * proceeding (e.g. bulk vault edits, data reset).
 *
 * `title` is required rather than optional on purpose. This window is generic —
 * only the caller knows what is being confirmed — so a default heading would be
 * vague ("Confirm") on every one of them, and an optional one would quietly let
 * the next caller ship a headerless dialog. Making it a parameter the compiler
 * insists on is what keeps "every window carries a title" true going forward.
 */
import { Modal } from "obsidian";
import type { App } from "obsidian";
import { t } from "../i18n";
import { applyModalChrome } from "../settings/modalChrome";

export class ConfirmModal extends Modal {
	private resolved = false;
	private resolve: (value: boolean) => void = () => {};

	constructor(
		app: App,
		private title: string,
		private message: string | DocumentFragment,
		private confirmLabel?: string,
		private cancelLabel?: string,
		private confirmClass: string = "mod-warning",
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		const btnContainer = applyModalChrome(this, { footer: true });
		this.setTitle(this.title);
		if (typeof this.message === "string") {
			const paragraphs = this.message.split(/\n+/);
			for (const p of paragraphs) {
				contentEl.createEl("p", { text: p });
			}
		} else {
			contentEl.appendChild(this.message);
		}

		btnContainer
			.createEl("button", {
				text: this.cancelLabel ?? t("confirm.cancel"),
			})
			.addEventListener("click", () => {
				this.resolved = true;
				this.resolve(false);
				this.close();
			});

		btnContainer
			.createEl("button", {
				text: this.confirmLabel ?? t("confirm.ok"),
				cls: this.confirmClass,
			})
			.addEventListener("click", () => {
				this.resolved = true;
				this.resolve(true);
				this.close();
			});
	}

	onClose(): void {
		if (!this.resolved) {
			this.resolve(false);
		}
		this.contentEl.empty();
	}

	confirm(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}
}
