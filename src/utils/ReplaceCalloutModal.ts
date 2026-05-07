import { Modal, setIcon } from "obsidian";
import type { App } from "obsidian";
import type { CalloutDefinition } from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import { t } from "../i18n";

export type DeleteAction =
	| { action: "replace"; replaceWith: string }
	| { action: "delete" }
	| { action: "cancel" };

export interface ReplaceCalloutModalOptions {
	/** "delete" preserves legacy behavior used by the trash flow (allows
	 * "delete without replacing" + warning copy). "replace" presents a pure
	 * replacement picker with no delete option. */
	mode?: "delete" | "replace";
	/** Heading paragraph above the picker. */
	message: string;
	/** Optional override for the confirm-button label. */
	confirmLabel?: string;
	/** Selectable callouts (the source callout should already be filtered out). */
	availableCallouts: CalloutDefinition[];
	registry: CalloutRegistry;
	fallbackId: string;
	/** Force-disable the "delete without replacing" row. Ignored in `replace`
	 * mode (which never shows that row). */
	disallowDeleteWithoutReplace?: boolean;
}

/**
 * Modal shown when deleting or replacing a callout. Renders a scrollable
 * list of callouts (with icons + colors) for the user to choose from.
 * Closing without confirming cancels the operation.
 */
export class ReplaceCalloutModal extends Modal {
	private resolved = false;
	private resolve: (value: DeleteAction) => void = () => {};
	private selectedId: string | null = null;
	private itemEls = new Map<string | null, HTMLElement>();
	private confirmBtn: HTMLButtonElement | null = null;

	private mode: "delete" | "replace";
	private message: string;
	private confirmLabel?: string;
	private availableCallouts: CalloutDefinition[];
	private registry: CalloutRegistry;
	private fallbackId: string;
	private disallowDeleteWithoutReplace: boolean;

	constructor(app: App, options: ReplaceCalloutModalOptions) {
		super(app);
		this.mode = options.mode ?? "delete";
		this.message = options.message;
		this.confirmLabel = options.confirmLabel;
		this.availableCallouts = options.availableCallouts;
		this.registry = options.registry;
		this.fallbackId = options.fallbackId;
		this.disallowDeleteWithoutReplace =
			this.mode === "replace"
				? true
				: (options.disallowDeleteWithoutReplace ?? false);
	}

	onOpen(): void {
		const { contentEl } = this;
		this.modalEl.addClass("callout-studio-replace-modal");

		contentEl.createEl("p", { text: this.message });

		contentEl.createEl("p", {
			text: t("vault.replaceWith"),
			cls: "callout-studio-replace-label",
		});

		// Scrollable list of callouts
		const listEl = contentEl.createDiv({
			cls: "callout-studio-replace-list",
		});

		// Pre-select fallback if available, otherwise first callout
		const hasCallouts = this.availableCallouts.length > 0;
		if (hasCallouts) {
			const fallbackExists = this.availableCallouts.some(
				(c) => c.id === this.fallbackId,
			);
			this.selectedId = fallbackExists
				? this.fallbackId
				: (this.availableCallouts[0]?.id ?? null);
		}

		for (const def of this.availableCallouts) {
			const item = this.renderCalloutItem(listEl, def);
			this.itemEls.set(def.id, item);
			if (def.id === this.selectedId) {
				item.addClass("is-selected");
			}
			item.addEventListener("click", () => this.selectItem(def.id));
		}

		// "Delete without replacing" option
		if (!this.disallowDeleteWithoutReplace) {
			const noReplaceItem = listEl.createDiv({
				cls: "callout-studio-replace-item callout-studio-replace-no-replace",
			});
			noReplaceItem.createDiv({
				cls: "callout-studio-replace-item-name callout-studio-replace-no-replace-name",
				text: `${t("vault.deleteWithout")} ${t("replaceModal.deleteWithoutReplaceSuffix")}`,
			});
			this.itemEls.set(null, noReplaceItem);
			if (!hasCallouts) {
				this.selectedId = null;
				noReplaceItem.addClass("is-selected");
			}
			noReplaceItem.addEventListener("click", () =>
				this.selectItem(null),
			);
		}

		// Single confirm button
		const btnContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});
		const confirmText =
			this.confirmLabel ??
			(this.mode === "replace"
				? t("vault.confirmReplace")
				: t("vault.confirmDelete"));
		this.confirmBtn = btnContainer.createEl("button", {
			text: confirmText,
			cls: this.mode === "replace" ? "mod-cta" : "mod-warning",
		});
		this.confirmBtn.addEventListener("click", () => {
			this.resolved = true;
			if (this.selectedId) {
				this.resolve({
					action: "replace",
					replaceWith: this.selectedId,
				});
			} else {
				this.resolve({ action: "delete" });
			}
			this.close();
		});
	}

	private selectItem(id: string | null): void {
		// Remove old selection
		for (const el of this.itemEls.values()) {
			el.removeClass("is-selected");
		}
		this.selectedId = id;
		const el = this.itemEls.get(id);
		if (el) el.addClass("is-selected");

		// Scroll selected item into view
		el?.scrollIntoView({ block: "nearest" });
	}

	private renderCalloutItem(
		container: HTMLElement,
		def: CalloutDefinition,
	): HTMLElement {
		const item = container.createDiv({
			cls: "callout-studio-replace-item",
		});

		const isDark = document.body.classList.contains("theme-dark");
		const color = isDark ? def.colorDark : def.colorLight;

		// Icon
		const iconEl = item.createDiv({
			cls: "callout-studio-replace-item-icon",
		});
		iconEl.style.color = color;
		this.renderIcon(iconEl, def);

		// Text: name + id
		const textEl = item.createDiv({
			cls: "callout-studio-replace-item-text",
		});
		const nameEl = textEl.createDiv({
			cls: "callout-studio-replace-item-name",
			text: def.displayName,
		});
		nameEl.style.color = color;
		textEl.createDiv({
			cls: "callout-studio-replace-item-id",
			text: def.id,
		});

		return item;
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
			iconEl.textContent = "📝";
		}
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
