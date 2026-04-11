import { Modal, setIcon } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type {
	CalloutIcon,
	MaterialIconMeta,
	MaterialIconStyle,
	CustomSvgIcon,
} from "../types";
import {
	getLucideIcons,
	loadMaterialIcons,
	filterMaterialIcons,
	getMaterialCategories,
	sanitizeSVG,
	isValidSvgIconName,
	makeIcon,
	materialFontFamily,
	MAX_CUSTOM_SVG_BYTES,
} from "../utils/iconLoader";
import { t } from "../i18n";

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
	private materialWeight: number = 400;
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

	// Track font links added by this picker so we can clean up
	private addedFontLinks: HTMLLinkElement[] = [];

	constructor(plugin: CalloutStudioPlugin, currentIcon?: CalloutIcon) {
		super(plugin.app);
		this.plugin = plugin;
		this.currentIcon = currentIcon ?? null;
		this.selectedIcon = currentIcon ? { ...currentIcon } : null;
		this.materialStyle =
			plugin.settings.iconSources.materialStyleDefault ?? "outlined";
		this.materialWeight =
			plugin.settings.iconSources.materialWeightDefault ?? 400;
	}

	// eslint-disable-next-line @typescript-eslint/no-misused-promises -- intentional Promise-returning override for modal result
	open(): Promise<CalloutIcon | null> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			super.open();
		});
	}

	onOpen(): void {
		this.modalEl.addClass("callout-studio-icon-picker");
		this.titleEl.setText(t("iconPicker.pickIcon"));

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
			text: t("iconPicker.confirm"),
			cls: "mod-cta",
		});
		this.confirmBtn.addEventListener("click", () => this.confirm());

		const cancelBtn = footer.createEl("button", {
			text: t("iconPicker.cancel"),
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
		// Clean up font links we added
		for (const link of this.addedFontLinks) {
			link.remove();
		}
		this.addedFontLinks = [];
	}

	// ── Tabs ────────────────────────────────────────────────────────────

	private buildTabs(): void {
		this.tabsEl.empty();
		this.tabsEl.setAttribute("role", "tablist");

		const tabs: Array<{
			id: "lucide" | "material" | "svg";
			label: string;
		}> = [
			{ id: "lucide", label: t("iconPicker.lucide") },
			{ id: "material", label: t("iconPicker.material") },
			{ id: "svg", label: t("iconPicker.customSvg") },
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
				this.selectedIcon = null;
				this.buildTabs();
				this.renderTab();
				this.updatePreview();
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
		const searchContainer =
			this.tabContentEl.createDiv("icon-picker-search");
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: t("iconPicker.searchLucide"),
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
		const loadMoreContainer = this.tabContentEl.createDiv(
			"icon-picker-load-more",
		);
		const loadMoreBtn = loadMoreContainer.createEl("button", {
			text: t("iconPicker.loadMore"),
		});
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
			cell.addEventListener("click", () =>
				this.selectLucide(iconId, grid),
			);
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

	/**
	 * Ensures the Google Font <link> for a given Material style is loaded.
	 * Returns a Promise that resolves once the font is usable.
	 * Tracks added links so they can be removed on close.
	 */
	private ensureMaterialFont(style: MaterialIconStyle): Promise<void> {
		const family = materialFontFamily(style);
		const encodedFamily = family.replace(/ /g, "+");
		// Check if a link for this family already exists in the document
		const selector = `link[href*="family=${encodedFamily}"]`;
		if (document.querySelector(selector)) {
			// Link exists – still wait for the font to be usable
			return document.fonts.ready.then(() => {});
		}

		return new Promise<void>((resolve) => {
			// eslint-disable-next-line obsidianmd/no-forbidden-elements -- dynamic font loading requires a link element
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:opsz,wght,FILL,GRAD@24,100..700,0..1,0`;
			link.onload = () => {
				void document.fonts.ready.then(() => resolve());
			};
			link.onerror = () => resolve(); // don't block on error
			document.head.appendChild(link);
			this.addedFontLinks.push(link);
		});
	}

	private renderMaterialTab(): void {
		const toolbar = this.tabContentEl.createDiv("icon-picker-toolbar");

		// Search
		const searchInput = toolbar.createEl("input", {
			type: "text",
			placeholder: t("iconPicker.searchMaterial"),
			value: this.searchQuery,
		});

		// Style selector
		const styleSelect = toolbar.createEl("select", {
			cls: "icon-picker-style-select",
		});
		const styles: MaterialIconStyle[] = [
			"outlined",
			"filled",
			"rounded",
			"sharp",
		];
		for (const s of styles) {
			const opt = styleSelect.createEl("option", { text: s, value: s });
			if (s === this.materialStyle) opt.selected = true;
		}

		// Weight selector
		const weightSelect = toolbar.createEl("select", {
			cls: "icon-picker-weight-select",
		});
		const weights = [100, 200, 300, 400, 500, 600, 700];
		for (const w of weights) {
			const opt = weightSelect.createEl("option", {
				text: String(w),
				value: String(w),
			});
			if (w === this.materialWeight) opt.selected = true;
		}

		// Category selector
		const categorySelect = toolbar.createEl("select", {
			cls: "icon-picker-category-select",
		});

		const grid = this.tabContentEl.createDiv("icon-picker-grid");
		grid.setAttribute("role", "grid");
		this.enableGridKeyNav(grid);
		const loadMoreContainer = this.tabContentEl.createDiv(
			"icon-picker-load-more",
		);

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
			// Show loading while font downloads, then refresh grid
			grid.empty();
			const loadingEl = grid.createDiv("icon-picker-loading");
			loadingEl.setText(t("iconPicker.iconsLoading"));
			void this.ensureMaterialFont(this.materialStyle).then(() => {
				if (this.activeTab !== "material") return;
				updateGrid();
			});
		});

		weightSelect.addEventListener("change", () => {
			this.materialWeight = parseInt(weightSelect.value, 10);
			// Weight changes don't require re-loading fonts; just refresh selection
			updateGrid();
		});

		categorySelect.addEventListener("change", () => {
			this.materialCategory = categorySelect.value;
			updateGrid();
		});

		const loadMoreBtn = loadMoreContainer.createEl("button", {
			text: t("iconPicker.loadMore"),
		});
		loadMoreBtn.addEventListener("click", () => {
			this.appendMaterialIcons(grid);
			if (this.materialDisplayed >= this.materialFiltered.length) {
				loadMoreContainer.hide();
			}
		});

		// Load icons — wait for both metadata AND font before showing the grid
		if (this.materialIcons.length > 0) {
			// Metadata cached – just need font
			const loadingEl = grid.createDiv("icon-picker-loading");
			loadingEl.setText(t("iconPicker.iconsLoading"));
			void this.ensureMaterialFont(this.materialStyle).then(() => {
				if (this.activeTab !== "material") return;
				loadingEl.remove();
				this.populateMaterialCategories(categorySelect);
				updateGrid();
				searchInput.focus();
			});
		} else {
			this.materialLoading = true;
			grid.createDiv("icon-picker-loading").setText(
				t("iconPicker.iconsLoading"),
			);

			const cacheData = this.plugin.registry.materialIconsCache;
			const fontPromise = this.ensureMaterialFont(this.materialStyle);
			const dataPromise = loadMaterialIcons(cacheData);

			Promise.all([fontPromise, dataPromise])
				.then(([, data]) => {
					this.materialIcons = data.icons;
					this.plugin.registry.materialIconsCache = data;
					this.materialLoading = false;
					this.materialError = null;
					if (this.activeTab !== "material") return;
					this.populateMaterialCategories(categorySelect);
					updateGrid();
					searchInput.focus();
				})
				.catch((err: Error) => {
					this.materialLoading = false;
					this.materialError = err.message;
					grid.empty();
					grid.createDiv("icon-picker-error").setText(
						t("iconPicker.loadFailed", { error: err.message }),
					);
				});
		}
	}

	private populateMaterialCategories(select: HTMLSelectElement): void {
		select.empty();
		select.createEl("option", {
			text: t("iconPicker.allCategories"),
			value: "",
		});
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
			const iconSpan = cell.createSpan({
				cls: "icon-picker-material-icon",
			});
			iconSpan.setText(meta.name);
			const fontFamily = materialFontFamily(this.materialStyle);
			iconSpan.setCssProps({
				"--cs-material-font": `"${fontFamily}"`,
				"--cs-material-weight": String(this.materialWeight),
			});
			if (this.materialStyle === "filled") {
				iconSpan.setCssProps({ "--cs-material-fill": "1" });
			}

			if (
				this.selectedIcon?.type === "material" &&
				this.selectedIcon.value === meta.name &&
				this.selectedIcon.style === this.materialStyle
			) {
				cell.addClass("is-selected");
			}
			cell.addEventListener("click", () =>
				this.selectMaterial(meta.name, grid),
			);
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
		const icon = makeIcon("material", name, this.materialStyle);
		icon.weight = this.materialWeight;
		this.selectedIcon = icon;
		grid.querySelectorAll(".is-selected").forEach((el) =>
			el.removeClass("is-selected"),
		);
		const cell = grid.querySelector(`[aria-label="${name}"]`);
		cell?.addClass("is-selected");
		this.updatePreview();
	}

	// ── SVG Tab ─────────────────────────────────────────────────────────

	private renderSvgTab(): void {
		// Input area
		const inputArea = this.tabContentEl.createDiv("icon-picker-svg-input");

		// Name input
		const nameRow = inputArea.createDiv("icon-picker-svg-name-row");
		nameRow.createSpan({ text: t("iconPicker.nameLabel") });
		const nameInput = nameRow.createEl("input", {
			type: "text",
			placeholder: t("iconPicker.namePlaceholder"),
		});

		// SVG textarea
		const textarea = inputArea.createEl("textarea", {
			cls: "icon-picker-svg-textarea",
			placeholder: t("iconPicker.svgPlaceholder"),
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
			text: t("iconPicker.addSvg"),
			cls: "mod-cta",
		});
		addBtn.addEventListener("click", () => {
			const name = nameInput.value.trim();
			const raw = textarea.value.trim();

			errorEl.hide();

			if (!name || !isValidSvgIconName(name)) {
				errorEl.setText(t("iconPicker.nameInvalid"));
				errorEl.show();
				return;
			}

			if (this.customSvgs.some((s) => s.name === name)) {
				errorEl.setText(t("iconPicker.nameExists"));
				errorEl.show();
				return;
			}

			// Check size limit
			if (new Blob([raw]).size > MAX_CUSTOM_SVG_BYTES) {
				errorEl.setText(t("iconPicker.svgTooLarge"));
				errorEl.show();
				return;
			}

			const sanitized = sanitizeSVG(raw);
			if (!sanitized) {
				errorEl.setText(t("iconPicker.invalidSvg"));
				errorEl.show();
				return;
			}

			this.customSvgs.push({ name, svg: sanitized });
			this.plugin.registry.customSvgIcons = [...this.customSvgs];
			void this.plugin.saveSettings();

			nameInput.value = "";
			textarea.value = "";
			this.renderSvgGallery(gallery);
		});

		// Gallery of existing SVGs
		this.tabContentEl.createEl("h4", {
			text: t("iconPicker.svgGallery"),
		});
		const gallery = this.tabContentEl.createDiv("icon-picker-svg-gallery");
		this.renderSvgGallery(gallery);
	}

	private renderSvgGallery(gallery: HTMLElement): void {
		gallery.empty();

		if (this.customSvgs.length === 0) {
			gallery
				.createDiv("icon-picker-empty")
				.setText(t("iconPicker.noSvgIcons"));
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
			const parser = new DOMParser();
			const doc = parser.parseFromString(svg.svg, "image/svg+xml");
			const svgEl = doc.documentElement;
			iconEl.appendChild(iconEl.doc.importNode(svgEl, true));

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
				gallery
					.querySelectorAll(".is-selected")
					.forEach((el) => el.removeClass("is-selected"));
				cell.addClass("is-selected");
				this.updatePreview();
			});

			// Delete button
			const deleteBtn = cell.createEl("button", {
				cls: "icon-picker-svg-delete",
				attr: { "aria-label": t("iconPicker.delete") },
			});
			setIcon(deleteBtn, "trash-2");
			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.customSvgs = this.customSvgs.filter(
					(s) => s.name !== svg.name,
				);
				this.plugin.registry.customSvgIcons = [...this.customSvgs];
				void this.plugin.saveSettings();
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
			this.previewEl.setText(t("iconPicker.noIconSelected"));
			this.confirmBtn?.toggleClass("is-disabled", true);
			return;
		}

		this.confirmBtn?.toggleClass("is-disabled", false);

		const iconContainer = this.previewEl.createDiv(
			"icon-picker-preview-icon",
		);
		const labelEl = this.previewEl.createDiv("icon-picker-preview-label");

		switch (this.selectedIcon.type) {
			case "lucide":
				setIcon(iconContainer, this.selectedIcon.value);
				labelEl.setText(`lucide: ${this.selectedIcon.value}`);
				break;
			case "material": {
				const span = iconContainer.createSpan({
					cls: "callout-studio-material-icon",
					text: this.selectedIcon.value,
				});
				const fontFamily = materialFontFamily(
					this.selectedIcon.style ?? "outlined",
				);
				span.setCssProps({
					"--cs-material-font": `"${fontFamily}"`,
					"--cs-material-weight": String(
						this.selectedIcon.weight ?? 400,
					),
				});
				if (this.selectedIcon.style === "filled") {
					span.setCssProps({ "--cs-material-fill": "1" });
				}
				labelEl.setText(
					`material: ${this.selectedIcon.value} (${this.selectedIcon.style ?? "outlined"}, ${this.selectedIcon.weight ?? 400})`,
				);
				break;
			}
			case "svg": {
				const svgData = this.customSvgs.find(
					(s) => s.name === this.selectedIcon?.value,
				);
				if (svgData) {
					const parser = new DOMParser();
					const doc = parser.parseFromString(
						svgData.svg,
						"image/svg+xml",
					);
					const svgEl = doc.documentElement;
					iconContainer.appendChild(
						iconContainer.doc.importNode(svgEl, true),
					);
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
			const cells = Array.from(
				grid.querySelectorAll<HTMLElement>(".icon-picker-cell"),
			);
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
					cols = cells.filter(
						(c) =>
							Math.abs(
								c.getBoundingClientRect().top - firstRect.top,
							) < 2,
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
