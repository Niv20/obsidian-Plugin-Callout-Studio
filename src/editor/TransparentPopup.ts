import { setIcon } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition, PopupAnimation } from "../types";
import { t } from "../i18n";

export class TransparentPopup {
	private plugin: CalloutStudioPlugin;
	private popupEl: HTMLElement | null = null;
	private dismissHandler: ((e: MouseEvent) => void) | null = null;
	private escHandler: ((e: KeyboardEvent) => void) | null = null;

	constructor(plugin: CalloutStudioPlugin) {
		this.plugin = plugin;
	}

	show(
		anchorRect: DOMRect,
		currentCalloutId: string | null,
		onConvert: (def: CalloutDefinition) => void,
		onAction?: (action: string) => void,
	): void {
		this.hide();

		const { popup } = this.plugin.settings;
		if (!popup.enabled) return;

		this.popupEl = document.createElement("div");
		this.popupEl.addClass("callout-studio-popup");
		this.applyStyles(this.popupEl);
		this.applyAnimation(this.popupEl, popup.animation);

		// Header
		const headerEl = this.popupEl.createDiv({
			cls: "callout-studio-popup-header",
		});
		headerEl.textContent = t("popup.convertTo");

		// Callout list
		const listEl = this.popupEl.createDiv({
			cls: "callout-studio-popup-list",
		});
		const allCallouts = this.plugin.registry.getAll();
		const maxItems = popup.maxItems;
		let count = 0;

		for (const def of allCallouts) {
			if (def.id === currentCalloutId) continue;
			if (count >= maxItems) break;

			const itemEl = listEl.createDiv({
				cls: "callout-studio-popup-item",
			});
			itemEl.setAttribute("tabindex", "0");
			itemEl.setAttribute("role", "button");
			itemEl.setAttribute("aria-label", t("popup.convertToAria", { name: def.displayName }));

			if (popup.showIcons) {
				const iconEl = itemEl.createDiv({
					cls: "callout-studio-popup-item-icon",
				});
				try {
					if (def.icon.type === "lucide") {
						setIcon(iconEl, def.icon.value);
					} else {
						setIcon(iconEl, "pencil");
					}
				} catch {
					iconEl.textContent = "📝";
				}
			}

			if (popup.showColorDots) {
				const dotEl = itemEl.createDiv({
					cls: "callout-studio-popup-item-dot",
				});
				const isDark = document.body.classList.contains("theme-dark");
				dotEl.style.backgroundColor = isDark
					? def.colorDark
					: def.colorLight;
			}

			const nameEl = itemEl.createDiv({
				cls: "callout-studio-popup-item-name",
			});
			nameEl.textContent = def.displayName;

			itemEl.addEventListener("click", () => {
				onConvert(def);
				this.hide();
			});

			itemEl.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onConvert(def);
					this.hide();
				}
			});

			count++;
		}

		// Divider
		this.popupEl.createDiv({ cls: "callout-studio-popup-divider" });

		// Quick actions
		const actionsEl = this.popupEl.createDiv({
			cls: "callout-studio-popup-actions",
		});

		if (onAction) {
			this.addActionItem(
				actionsEl,
				"clipboard-copy",
				t("popup.copyMarkdown"),
				() => {
					onAction("copy");
					this.hide();
				},
			);

			if (popup.showEditButton && currentCalloutId) {
				this.addActionItem(
					actionsEl,
					"palette",
					t("popup.customize"),
					() => {
						onAction("edit");
						this.hide();
					},
				);
			}

			this.addActionItem(
				actionsEl,
				"plus",
				t("popup.createNew"),
				() => {
					onAction("create-based");
					this.hide();
				},
			);
		}

		// Footer
		const footerEl = this.popupEl.createDiv({
			cls: "callout-studio-popup-footer",
		});
		footerEl.textContent = t("popup.openSettings");
		footerEl.addEventListener("click", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			(this.plugin.app as any).setting.open();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			(this.plugin.app as any).setting.openTabById(
				this.plugin.manifest.id,
			);
			this.hide();
		});

		// Add to DOM
		document.body.appendChild(this.popupEl);

		// Position
		this.position(this.popupEl, anchorRect);

		// Dismiss handlers
		this.dismissHandler = (e: MouseEvent) => {
			if (this.popupEl && !this.popupEl.contains(e.target as Node)) {
				this.hide();
			}
		};
		this.escHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				this.hide();
			}
		};

		// Delay adding click handler to avoid immediate dismiss
		setTimeout(() => {
			if (this.dismissHandler) {
				document.addEventListener("click", this.dismissHandler, true);
			}
		}, 50);
		document.addEventListener("keydown", this.escHandler);
	}

	private addActionItem(
		container: HTMLElement,
		icon: string,
		label: string,
		onClick: () => void,
	): void {
		const item = container.createDiv({
			cls: "callout-studio-popup-action",
		});
		item.setAttribute("tabindex", "0");
		item.setAttribute("role", "button");
		item.setAttribute("aria-label", label);

		const iconEl = item.createDiv({
			cls: "callout-studio-popup-action-icon",
		});
		setIcon(iconEl, icon);

		item.createSpan({ text: label });

		item.addEventListener("click", onClick);
		item.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onClick();
			}
		});
	}

	private applyStyles(el: HTMLElement): void {
		const { popup } = this.plugin.settings;
		const opacity = 1 - popup.transparency / 100;
		el.style.setProperty("--cs-popup-opacity", String(opacity));
		el.style.setProperty("--cs-popup-blur", `${popup.backdropBlur}px`);
	}

	private applyAnimation(el: HTMLElement, animation: PopupAnimation): void {
		switch (animation) {
			case "fade":
				el.addClass("callout-studio-popup-anim-fade");
				break;
			case "slide":
				el.addClass("callout-studio-popup-anim-slide");
				break;
			case "scale":
				el.addClass("callout-studio-popup-anim-scale");
				break;
			case "none":
				break;
		}
	}

	private position(el: HTMLElement, anchorRect: DOMRect): void {
		const { popup } = this.plugin.settings;
		const gap = 8;

		// First, make visible to measure
		el.addClass("is-measuring");

		const elRect = el.getBoundingClientRect();
		const viewW = window.innerWidth;
		const viewH = window.innerHeight;

		let top: number;
		let left: number;

		switch (popup.position) {
			case "top-left":
				top = anchorRect.top;
				left = anchorRect.left - elRect.width - gap;
				if (left < 0) left = anchorRect.right + gap;
				break;
			case "top-right":
				top = anchorRect.top;
				left = anchorRect.right + gap;
				if (left + elRect.width > viewW)
					left = anchorRect.left - elRect.width - gap;
				break;
			case "cursor":
			default:
				top = anchorRect.bottom + gap;
				left = anchorRect.left;
				break;
		}

		// Clamp to viewport
		if (top + elRect.height > viewH) {
			top = viewH - elRect.height - gap;
		}
		if (top < 0) top = gap;
		if (left < 0) left = gap;
		if (left + elRect.width > viewW) {
			left = viewW - elRect.width - gap;
		}

		el.setCssProps({
			"--cs-popup-top": `${top}px`,
			"--cs-popup-left": `${left}px`,
		});
		el.removeClass("is-measuring");
	}

	hide(): void {
		if (this.popupEl) {
			this.popupEl.remove();
			this.popupEl = null;
		}
		if (this.dismissHandler) {
			document.removeEventListener("click", this.dismissHandler, true);
			this.dismissHandler = null;
		}
		if (this.escHandler) {
			document.removeEventListener("keydown", this.escHandler);
			this.escHandler = null;
		}
	}

	destroy(): void {
		this.hide();
	}
}
