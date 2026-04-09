import { Modal, setIcon } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutIcon, MaterialIconMeta, MaterialIconStyle, CustomSvgIcon } from "../types";
import {
	getLucideIcons,
	loadMaterialIcons,
	filterMaterialIcons,
	getMaterialCategories,
	sanitizeSVG,
	isValidSvgIconName,
	makeIcon,
} from "../utils/iconLoader";

const GRID_PAGE_SIZE = 120;

export class IconPicker extends Modal {
	private plugin: CalloutStudioPlugin;
	private resolve: ((icon: CalloutIcon | null) => void) | null = null;
	private currentIcon: CalloutIcon | null;

	// State
	private activeTab: "lucide" | "material" | "svg" = "lucide";
	private searchQuery = "";
	private selectedIcon: CalloutIcon | null = null;

	// Lucide state
	private lucideIcons: string[] = [];
	private lucideDisplayed = 0;

	// Material state
	private materialIcons: MaterialIconMeta[] = [];
	private materialFiltered: MaterialIconMeta[] = [];
	private materialStyle: MaterialIconStyle = "outlined";
	private materialCategory = "";
	private materialDisplayed = 0;
	private materialLoading = false;
	private materialError: string | null = null;

	// SVG state
	private customSvgs: CustomSvgIcon[] = [];

	// DOM refs
	private tabsEl!: HTMLElement;
	private tabContentEl!: HTMLElement;
	private previewEl!: HTMLElement;
	private confirmBtn!: HTMLButtonElement;

	constructor(plugin: CalloutStudioPlugin, currentIcon?: CalloutIcon) {
		super(plugin.app);
		this.plugin = plugin;
		this.currentIcon = currentIcon ?? null;
		this.selectedIcon = currentIcon ? { ...currentIcon } : null;
		this.materialStyle =
			plugin.settings.iconSources.materialStyleDefault ?? "outlined";
	}

	open(): Promise<CalloutIcon | null> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			super.open();
		});
	}

	onOpen(): void {
		this.modalEl.addClass("callout-studio-icon-picker");
		this.titleEl.setText("Pick an icon");

		// Load SVG gallery from plugin data
		this.customSvgs = [...(this.plugin.registry.customSvgIcons ?? [])];

		// Build layout
		const container = this.contentEl.createDiv("icon-picker-container");

		// Tabs
		this.tabsEl = container.createDiv("icon-picker-tabs");
		this.buildTabs();

		// Content area
		this.tabContentEl = container.createDiv("icon-picker-content");

		// Footer: preview + confirm
		const footer = container.createDiv("icon-picker-footer");
		this.previewEl = footer.createDiv("icon-picker-preview");
		this.updatePreview();

		this.confirmBtn = footer.createEl("button", {
			text: "Confirm",
			cls: "mod-cta",
		});
		this.confirmBtn.addEventListener("click", () => this.confirm());

		const cancelBtn = footer.createEl("button", {
			text: "Cancel",
		});
		cancelBtn.addEventListener("click", () => this.cancel());

		// Render initial tab
		this.renderTab();
	}

	onClose(): void {
		if (this.resolve) {
			this.resolve(null);
			this.resolve = null;
		}
	}

	// ── Tabs ────────────────────────────────────────────────────────────

	private buildTabs(): void {
		this.tabsEl.empty();
		this.tabsEl.setAttribute("role", "tablist");

		const tabs: Array<{ id: "lucide" | "material" | "svg"; label: string }> = [
			{ id: "lucide", label: "Lucide" },
			{ id: "material", label: "Material" },
			{ id: "svg", label: "Custom SVG" },
		];

		for (const tab of tabs) {
			const isActive = this.activeTab === tab.id;
			const btn = this.tabsEl.createEl("button", {
				text: tab.label,
				cls: `icon-picker-tab${isActive ? " is-active" : ""}`,
				attr: {
					role: "tab",
					"aria-selected": String(isActive),
					"aria-controls": `icon-picker-panel-${tab.id}`,
					tabindex: isActive ? "0" : "-1",
				},
			});
			btn.addEventListener("click", () => {
				this.activeTab = tab.id;
				this.searchQuery = "";
				this.buildTabs();
				this.renderTab();
			});
		}
	}

	// ── Tab Rendering ───────────────────────────────────────────────────

	private renderTab(): void {
		this.tabContentEl.empty();

		switch (this.activeTab) {
			case "lucide":
				this.renderLucideTab();
				break;
			case "material":
				this.renderMaterialTab();
				break;
			case "svg":
				this.renderSvgTab();
				break;
		}
	}

	// ── Lucide Tab ──────────────────────────────────────────────────────

	private renderLucideTab(): void {
		const searchContainer = this.tabContentEl.createDiv("icon-picker-search");
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Search Lucide icons...",
			value: this.searchQuery,
		});
		searchInput.addEventListener("input", () => {
			this.searchQuery = searchInput.value;
			this.lucideIcons = getLucideIcons(this.searchQuery);
			this.lucideDisplayed = 0;
			grid.empty();
			this.appendLucideIcons(grid);
		});

		this.lucideIcons = getLucideIcons(this.searchQuery);
		this.lucideDisplayed = 0;

		const grid = this.tabContentEl.createDiv("icon-picker-grid");
		grid.setAttribute("role", "grid");
		this.appendLucideIcons(grid);
		this.enableGridKeyNav(grid);

		// Load more button
		const loadMoreContainer = this.tabContentEl.createDiv("icon-picker-load-more");
		const loadMoreBtn = loadMoreContainer.createEl("button", { text: "Load more" });
		loadMoreBtn.addEventListener("click", () => {
			this.appendLucideIcons(grid);
			if (this.lucideDisplayed >= this.lucideIcons.length) {
				loadMoreContainer.hide();
			}
		});
		if (this.lucideDisplayed >= this.lucideIcons.length) {
			loadMoreContainer.hide();
		}

		// Focus search
		searchInput.focus();
	}

	private appendLucideIcons(grid: HTMLElement): void {
		const end = Math.min(
			this.lucideDisplayed + GRID_PAGE_SIZE,
			this.lucideIcons.length,
		);
		for (let i = this.lucideDisplayed; i < end; i++) {
			const iconId = this.lucideIcons[i];
			if (!iconId) continue;
			const cell = grid.createDiv({
				cls: "icon-picker-cell",
				attr: {
					"aria-label": iconId,
					tabindex: "0",
					role: "button",
				},
			});
			setIcon(cell, iconId);
			if (
				this.selectedIcon?.type === "lucide" &&
				this.selectedIcon.value === iconId
			) {
				cell.addClass("is-selected");
			}
			cell.addEventListener("click", () => this.selectLucide(iconId, grid));
			cell.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					this.selectLucide(iconId, grid);
				}
			});
		}
		this.lucideDisplayed = end;
	}

	private selectLucide(iconId: string, grid: HTMLElement): void {
		this.selectedIcon = makeIcon("lucide", iconId);
		grid.querySelectorAll(".is-selected").forEach((el) =>
			el.removeClass("is-selected"),
		);
		const cell = grid.querySelector(`[aria-label="${iconId}"]`);
		cell?.addClass("is-selected");
		this.updatePreview();
	}

	// ── Material Tab ────────────────────────────────────────────────────

	private renderMaterialTab(): void {
		if (!this.plugin.settings.iconSources.material) {
			this.tabContentEl.createDiv("icon-picker-notice").setText(
				"Material Icons are disabled in settings. Enable them under Icon Sources.",
			);
			return;
		}

		const toolbar = this.tabContentEl.createDiv("icon-picker-toolbar");

		// Search
		const searchInput = toolbar.createEl("input", {
			type: "text",
			placeholder: "Search Material icons...",
			value: this.searchQuery,
		});

		// Style selector
		const styleSelect = toolbar.createEl("select", { cls: "icon-picker-style-select" });
		const styles: MaterialIconStyle[] = ["outlined", "filled", "rounded", "sharp"];
		for (const s of styles) {
			const opt = styleSelect.createEl("option", { text: s, value: s });
			if (s === this.materialStyle) opt.selected = true;
		}

		// Category selector
		const categorySelect = toolbar.createEl("select", { cls: "icon-picker-category-select" });

		const grid = this.tabContentEl.createDiv("icon-picker-grid");
		grid.setAttribute("role", "grid");
		this.enableGridKeyNav(grid);
		const loadMoreContainer = this.tabContentEl.createDiv("icon-picker-load-more");

		const updateGrid = () => {
			this.materialFiltered = filterMaterialIcons(
				this.materialIcons,
				this.searchQuery,
				this.materialStyle,
				this.materialCategory || undefined,
			);
			this.materialDisplayed = 0;
			grid.empty();
			this.appendMaterialIcons(grid);
			if (this.materialDisplayed >= this.materialFiltered.length) {
				loadMoreContainer.hide();
			} else {
				loadMoreContainer.show();
			}
		};

		searchInput.addEventListener("input", () => {
			this.searchQuery = searchInput.value;
			updateGrid();
		});

		styleSelect.addEventListener("change", () => {
			this.materialStyle = styleSelect.value as MaterialIconStyle;
			updateGrid();
		});

		categorySelect.addEventListener("change", () => {
			this.materialCategory = categorySelect.value;
			updateGrid();
		});

		const loadMoreBtn = loadMoreContainer.createEl("button", { text: "Load more" });
		loadMoreBtn.addEventListener("click", () => {
			this.appendMaterialIcons(grid);
			if (this.materialDisplayed >= this.materialFiltered.length) {
				loadMoreContainer.hide();
			}
		});

		// Load icons
		if (this.materialIcons.length > 0) {
			this.populateMaterialCategories(categorySelect);
			updateGrid();
			searchInput.focus();
		} else {
			this.materialLoading = true;
			grid.createDiv("icon-picker-loading").setText("Loading Material icons...");

			const cacheData = this.plugin.registry.materialIconsCache;
			loadMaterialIcons(cacheData)
				.then((data) => {
					this.materialIcons = data.icons;
					this.plugin.registry.materialIconsCache = data;
					this.materialLoading = false;
					this.materialError = null;
					this.populateMaterialCategories(categorySelect);
					updateGrid();
					searchInput.focus();
				})
				.catch((err: Error) => {
					this.materialLoading = false;
					this.materialError = err.message;
					grid.empty();
					grid.createDiv("icon-picker-error").setText(
						`Failed to load Material icons: ${err.message}`,
					);
				});
		}
	}

	private populateMaterialCategories(select: HTMLSelectElement): void {
		select.empty();
		select.createEl("option", { text: "All categories", value: "" });
		const cats = getMaterialCategories(this.materialIcons);
		for (const cat of cats) {
			select.createEl("option", { text: cat, value: cat });
		}
	}

	private appendMaterialIcons(grid: HTMLElement): void {
		const end = Math.min(
			this.materialDisplayed + GRID_PAGE_SIZE,
			this.materialFiltered.length,
		);
		for (let i = this.materialDisplayed; i < end; i++) {
			const meta = this.materialFiltered[i];
			if (!meta) continue;
			const cell = grid.createDiv({
				cls: "icon-picker-cell icon-picker-material-cell",
				attr: {
					"aria-label": meta.name,
					tabindex: "0",
					role: "button",
				},
			});
			// Render material icon via font ligature
			const iconSpan = cell.createSpan({ cls: "material-symbols-outlined" });
			iconSpan.setText(meta.name);

			if (
				this.selectedIcon?.type === "material" &&
				this.selectedIcon.value === meta.name &&
				this.selectedIcon.style === this.materialStyle
			) {
				cell.addClass("is-selected");
			}
			cell.addEventListener("click", () => this.selectMaterial(meta.name, grid));
			cell.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					this.selectMaterial(meta.name, grid);
				}
			});
		}
		this.materialDisplayed = end;
	}

	private selectMaterial(name: string, grid: HTMLElement): void {
		this.selectedIcon = makeIcon("material", name, this.materialStyle);
		grid.querySelectorAll(".is-selected").forEach((el) =>
			el.removeClass("is-selected"),
		);
		const cell = grid.querySelector(`[aria-label="${name}"]`);
		cell?.addClass("is-selected");
		this.updatePreview();
	}

	// ── SVG Tab ─────────────────────────────────────────────────────────

	private renderSvgTab(): void {
		if (!this.plugin.settings.iconSources.customSvg) {
			this.tabContentEl.createDiv("icon-picker-notice").setText(
				"Custom SVG icons are disabled in settings. Enable them under Icon Sources.",
			);
			return;
		}

		// Input area
		const inputArea = this.tabContentEl.createDiv("icon-picker-svg-input");

		// Name input
		const nameRow = inputArea.createDiv("icon-picker-svg-name-row");
		nameRow.createSpan({ text: "Name:" });
		const nameInput = nameRow.createEl("input", {
			type: "text",
			placeholder: "my-icon-name",
		});

		// SVG textarea
		const textarea = inputArea.createEl("textarea", {
			cls: "icon-picker-svg-textarea",
			placeholder: "Paste SVG markup here, or drag and drop an SVG file...",
			attr: { rows: "6" },
		});

		// Drag-drop support
		textarea.addEventListener("dragover", (e) => {
			e.preventDefault();
			textarea.addClass("is-drag-over");
		});
		textarea.addEventListener("dragleave", () => {
			textarea.removeClass("is-drag-over");
		});
		textarea.addEventListener("drop", (e) => {
			e.preventDefault();
			textarea.removeClass("is-drag-over");
			const file = e.dataTransfer?.files[0];
			if (file && file.type === "image/svg+xml") {
				const reader = new FileReader();
				reader.onload = () => {
					textarea.value = reader.result as string;
				};
				reader.readAsText(file);
			}
		});

		// Error display
		const errorEl = inputArea.createDiv("icon-picker-svg-error");
		errorEl.hide();

		// Add button
		const addBtn = inputArea.createEl("button", {
			text: "Add SVG icon",
			cls: "mod-cta",
		});
		addBtn.addEventListener("click", () => {
			const name = nameInput.value.trim();
			const raw = textarea.value.trim();

			errorEl.hide();

			if (!name || !isValidSvgIconName(name)) {
				errorEl.setText("Name must contain only lowercase letters, numbers, and hyphens.");
				errorEl.show();
				return;
			}

			if (this.customSvgs.some((s) => s.name === name)) {
				errorEl.setText("An SVG icon with this name already exists.");
				errorEl.show();
				return;
			}

			const sanitized = sanitizeSVG(raw);
			if (!sanitized) {
				errorEl.setText("Invalid SVG markup. Please check the input.");
				errorEl.show();
				return;
			}

			this.customSvgs.push({ name, svg: sanitized });
			this.plugin.registry.customSvgIcons = [...this.customSvgs];
			this.plugin.saveSettings();

			nameInput.value = "";
			textarea.value = "";
			this.renderSvgGallery(gallery);
		});

		// Gallery of existing SVGs
		const galleryLabel = this.tabContentEl.createEl("h4", { text: "SVG gallery" });
		const gallery = this.tabContentEl.createDiv("icon-picker-svg-gallery");
		this.renderSvgGallery(gallery);
	}

	private renderSvgGallery(gallery: HTMLElement): void {
		gallery.empty();

		if (this.customSvgs.length === 0) {
			gallery.createDiv("icon-picker-empty").setText("No custom SVG icons yet.");
			return;
		}

		for (const svg of this.customSvgs) {
			const cell = gallery.createDiv({
				cls: "icon-picker-cell icon-picker-svg-cell",
				attr: {
					"aria-label": svg.name,
					tabindex: "0",
					role: "button",
				},
			});

			const iconEl = cell.createDiv("icon-picker-svg-preview");
			iconEl.innerHTML = svg.svg;

			const label = cell.createDiv("icon-picker-svg-label");
			label.setText(svg.name);

			if (
				this.selectedIcon?.type === "svg" &&
				this.selectedIcon.value === svg.name
			) {
				cell.addClass("is-selected");
			}

			cell.addEventListener("click", () => {
				this.selectedIcon = makeIcon("svg", svg.name);
				gallery.querySelectorAll(".is-selected").forEach((el) =>
					el.removeClass("is-selected"),
				);
				cell.addClass("is-selected");
				this.updatePreview();
			});

			// Delete button
			const deleteBtn = cell.createEl("button", {
				cls: "icon-picker-svg-delete",
				attr: { "aria-label": "Delete" },
			});
			setIcon(deleteBtn, "trash-2");
			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.customSvgs = this.customSvgs.filter((s) => s.name !== svg.name);
				this.plugin.registry.customSvgIcons = [...this.customSvgs];
				this.plugin.saveSettings();
				if (
					this.selectedIcon?.type === "svg" &&
					this.selectedIcon.value === svg.name
				) {
					this.selectedIcon = null;
					this.updatePreview();
				}
				this.renderSvgGallery(gallery);
			});
		}
	}

	// ── Preview & Confirm ───────────────────────────────────────────────

	private updatePreview(): void {
		this.previewEl.empty();

		if (!this.selectedIcon) {
			this.previewEl.setText("No icon selected");
			this.confirmBtn?.toggleClass("is-disabled", true);
			return;
		}

		this.confirmBtn?.toggleClass("is-disabled", false);

		const iconContainer = this.previewEl.createDiv("icon-picker-preview-icon");
		const labelEl = this.previewEl.createDiv("icon-picker-preview-label");

		switch (this.selectedIcon.type) {
			case "lucide":
				setIcon(iconContainer, this.selectedIcon.value);
				labelEl.setText(`lucide: ${this.selectedIcon.value}`);
				break;
			case "material":
				iconContainer.createSpan({
					cls: "material-symbols-outlined",
					text: this.selectedIcon.value,
				});
				labelEl.setText(
					`material: ${this.selectedIcon.value} (${this.selectedIcon.style ?? "outlined"})`,
				);
				break;
			case "svg": {
				const svgData = this.customSvgs.find(
					(s) => s.name === this.selectedIcon?.value,
				);
				if (svgData) {
					iconContainer.innerHTML = svgData.svg;
				}
				labelEl.setText(`svg: ${this.selectedIcon.value}`);
				break;
			}
		}
	}

	private confirm(): void {
		if (this.selectedIcon && this.resolve) {
			this.resolve(this.selectedIcon);
			this.resolve = null;
		}
		this.close();
	}

	private cancel(): void {
		if (this.resolve) {
			this.resolve(null);
			this.resolve = null;
		}
		this.close();
	}

	/**
	 * Adds arrow key navigation to an icon grid.
	 */
	private enableGridKeyNav(grid: HTMLElement): void {
		grid.addEventListener("keydown", (e) => {
			const cells = Array.from(grid.querySelectorAll<HTMLElement>(".icon-picker-cell"));
			const current = document.activeElement as HTMLElement | null;
			const idx = current ? cells.indexOf(current) : -1;
			if (idx < 0) return;

			// Compute approximate columns from grid layout
			const first = cells[0];
			const second = cells[1];
			let cols = 1;
			if (first && second) {
				const firstRect = first.getBoundingClientRect();
				const secondRect = second.getBoundingClientRect();
				if (Math.abs(firstRect.top - secondRect.top) < 2) {
					// Same row — count cells in first row
					cols = cells.filter((c) =>
						Math.abs(c.getBoundingClientRect().top - firstRect.top) < 2,
					).length;
				}
			}

			let next = -1;
			switch (e.key) {
				case "ArrowRight":
					next = idx + 1;
					break;
				case "ArrowLeft":
					next = idx - 1;
					break;
				case "ArrowDown":
					next = idx + cols;
					break;
				case "ArrowUp":
					next = idx - cols;
					break;
				default:
					return;
			}

			if (next >= 0 && next < cells.length) {
				e.preventDefault();
				cells[next]?.focus();
			}
		});
	}
}
