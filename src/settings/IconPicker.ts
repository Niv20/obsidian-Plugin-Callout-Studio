/**
 * settings/IconPicker.ts — Icon selection modal.
 *
 * Shows a paginated grid of Obsidian's built-in Lucide icons and a separately
 * paginated grid of Material Symbols icons. Supports text search, category
 * filtering, and style/weight selection for Material icons. Returns a
 * CalloutIcon value to the caller (CalloutEditor) via a Promise.
 * Uses iconLoader utilities for data and triggers SVG pre-caching on selection.
 */
import { Modal, setIcon } from "obsidian";
import type { App } from "obsidian";
import type {
	CalloutIcon,
	MaterialIconMeta,
	MaterialIconStyle,
	PluginSettings,
} from "../types";
import {
	getLucideIcons,
	loadMaterialIcons,
	filterMaterialIcons,
	getMaterialCategories,
	makeIcon,
	materialFontFamily,
} from "../utils/iconLoader";
import { t } from "../i18n";

const GRID_PAGE_SIZE = 120;

interface IconPickerPlugin {
	app: App;
	settings: PluginSettings;
	saveSettings(): Promise<void>;
	cacheMaterialSvg(icon: CalloutIcon): Promise<void>;
}

export class IconPicker extends Modal {
	private plugin: IconPickerPlugin;
	private resolve: ((icon: CalloutIcon | null) => void) | null = null;
	private currentIcon: CalloutIcon | null;

	// State
	private activeTab: "lucide" | "material" = "lucide";
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
	private materialLoadPromise: Promise<void> | null = null;

	// DOM refs
	private tabsEl!: HTMLElement;
	private tabContentEl!: HTMLElement;
	private previewEl!: HTMLElement;
	private confirmBtn!: HTMLButtonElement;

	// Track font links added by this picker so we can clean up
	private addedFontLinks: HTMLLinkElement[] = [];
	// Track active loading timers so we can clean them up
	private loadingTimers: ReturnType<typeof setTimeout>[] = [];

	constructor(plugin: IconPickerPlugin, currentIcon?: CalloutIcon) {
		super(plugin.app);
		this.plugin = plugin;
		this.currentIcon = currentIcon ?? null;
		this.selectedIcon = currentIcon ? { ...currentIcon } : null;
		this.materialStyle =
			plugin.settings.iconSources.materialStyleDefault ?? "rounded";
		this.materialWeight =
			plugin.settings.iconSources.materialWeightDefault ?? 300;
		// Restore last-used category (defaults to "Actions" on first use)
		this.materialCategory =
			plugin.settings.iconSources.lastMaterialCategory ?? "Actions";
	}

	openAndWait(): Promise<CalloutIcon | null> {
		return new Promise<CalloutIcon | null>((resolve) => {
			this.resolve = resolve;
			super.open();
		});
	}

	onOpen(): void {
		this.modalEl.addClass("callout-studio-icon-picker");
		this.titleEl.setText(t("iconPicker.pickIcon"));

		// Preload Material icons metadata so it's ready when the tab is opened
		this.preloadMaterialIcons();

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

		const cancelBtn = footer.createEl("button", {
			text: t("iconPicker.cancel"),
		});
		cancelBtn.addEventListener("click", () => this.cancel());

		this.confirmBtn = footer.createEl("button", {
			text: t("iconPicker.confirm"),
			cls: "mod-cta",
		});
		this.confirmBtn.addEventListener("click", () => {
			void this.confirm();
		});

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
		// Clean up loading timers
		for (const timer of this.loadingTimers) {
			clearTimeout(timer);
		}
		this.loadingTimers = [];
	}

	/**
	 * Creates a loading element that becomes visible after a 1-second delay.
	 */
	private createDelayedLoading(
		parent: HTMLElement,
		text: string,
	): HTMLElement {
		const el = parent.createDiv("icon-picker-loading");
		el.setText(text);
		const timer = setTimeout(() => {
			el.addClass("is-visible");
		}, 1000);
		this.loadingTimers.push(timer);
		return el;
	}

	// ── Tabs ────────────────────────────────────────────────────────────

	private buildTabs(): void {
		this.tabsEl.empty();
		this.tabsEl.setAttribute("role", "tablist");

		const tabs: Array<{
			id: "lucide" | "material";
			label: string;
		}> = [
			{ id: "lucide", label: t("iconPicker.lucide") },
			{ id: "material", label: t("iconPicker.material") },
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
			grid.removeClass("is-loaded");
			this.appendLucideIcons(grid);
			grid.addClass("is-loaded");
			if (this.lucideIcons.length === 0 && this.searchQuery) {
				grid.createDiv("icon-picker-empty").setText(
					t("iconPicker.noResults"),
				);
			}
			if (this.lucideDisplayed >= this.lucideIcons.length) {
				loadMoreContainer.hide();
			} else {
				loadMoreContainer.show();
			}
		});

		this.lucideIcons = getLucideIcons(this.searchQuery);
		this.lucideDisplayed = 0;

		const grid = this.tabContentEl.createDiv("icon-picker-grid");
		grid.setAttribute("role", "grid");
		this.appendLucideIcons(grid);
		grid.addClass("is-loaded");
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
	 * Starts loading Material icons metadata in the background.
	 * Called on open so data is ready when the user switches tabs.
	 */
	private preloadMaterialIcons(): void {
		if (this.materialIcons.length > 0 || this.materialLoading) return;

		this.materialLoading = true;
		this.materialLoadPromise = loadMaterialIcons()
			.then((icons) => {
				this.materialIcons = icons;
				this.materialLoading = false;
				this.materialError = null;
			})
			.catch((err: Error) => {
				this.materialLoading = false;
				this.materialError = err.message;
			});
	}

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
		// Default "All" option shown immediately while data loads
		categorySelect.createEl("option", {
			text: t("iconPicker.allCategories"),
			value: "",
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
			grid.removeClass("is-loaded");
			this.appendMaterialIcons(grid);
			grid.addClass("is-loaded");
			if (
				this.materialFiltered.length === 0 &&
				this.materialIcons.length > 0
			) {
				grid.createDiv("icon-picker-empty").setText(
					t("iconPicker.noResults"),
				);
			}
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
			grid.removeClass("is-loaded");
			this.createDelayedLoading(grid, t("iconPicker.iconsLoading"));
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
			this.plugin.settings.iconSources.lastMaterialCategory =
				this.materialCategory;
			void this.plugin.saveSettings();
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
			// Metadata cached – populate categories synchronously so the
			// dropdown shows the saved category from the very first frame,
			// with no intermediate flash of "All Categories".
			this.populateMaterialCategories(categorySelect);
			const loadingEl = this.createDelayedLoading(
				grid,
				t("iconPicker.iconsLoading"),
			);
			void this.ensureMaterialFont(this.materialStyle).then(() => {
				if (this.activeTab !== "material") return;
				loadingEl.remove();
				updateGrid();
				searchInput.focus();
			});
		} else if (this.materialError) {
			// Preload failed — show error immediately
			grid.createDiv("icon-picker-error").setText(
				t("iconPicker.loadFailed", { error: this.materialError }),
			);
		} else {
			// Metadata still loading (from preload) or not started — wait for it
			this.createDelayedLoading(grid, t("iconPicker.iconsLoading"));

			const fontPromise = this.ensureMaterialFont(this.materialStyle);
			const dataPromise =
				this.materialLoadPromise ??
				loadMaterialIcons().then((icons) => {
					this.materialIcons = icons;
					this.materialLoading = false;
					this.materialError = null;
				});

			Promise.all([fontPromise, dataPromise])
				.then(() => {
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
		// Honor preferred default category if it exists in the loaded list
		if (this.materialCategory && cats.includes(this.materialCategory)) {
			select.value = this.materialCategory;
		} else {
			this.materialCategory = "";
			select.value = "";
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

	// ── Preview & Confirm ───────────────────────────────────────────────

	private updatePreview(): void {
		this.previewEl.empty();

		if (!this.selectedIcon) {
			this.previewEl.setText(t("iconPicker.noIconSelected"));
			this.confirmBtn?.toggleClass("is-disabled", true);
			return;
		}

		this.confirmBtn?.toggleClass("is-disabled", false);

		const labelEl = this.previewEl.createDiv("icon-picker-preview-label");

		switch (this.selectedIcon.type) {
			case "lucide":
				labelEl.setText(`lucide: ${this.selectedIcon.value}`);
				break;
			case "material": {
				labelEl.setText(
					`material: ${this.selectedIcon.value} (${this.selectedIcon.style ?? "outlined"}, ${this.selectedIcon.weight ?? 400})`,
				);
				break;
			}
		}
	}

	private async confirm(): Promise<void> {
		if (!this.selectedIcon || !this.resolve) {
			this.close();
			return;
		}

		// For Material icons, download and cache the SVG BEFORE closing the
		// picker, so the user sees the loading state here (with the icon
		// preview already visible) instead of in the calling Edit Callout
		// dialog where the icon hasn't been rendered yet.
		if (this.selectedIcon.type === "material") {
			const originalText = this.confirmBtn.textContent ?? "";
			this.confirmBtn.disabled = true;
			this.confirmBtn.toggleClass("is-disabled", true);
			this.confirmBtn.empty();
			this.confirmBtn.addClass("callout-studio-icon-picker-loading");
			const spinner = this.confirmBtn.createSpan({
				cls: "callout-studio-spinner",
			});
			setIcon(spinner, "loader-2");
			this.confirmBtn.createSpan({
				text: t("editor.downloadingIcon"),
			});
			try {
				await this.plugin.cacheMaterialSvg(this.selectedIcon);
			} catch {
				// Errors are surfaced via the failure registry; proceed to
				// resolve so the user isn't stuck in the picker.
			} finally {
				this.confirmBtn.disabled = false;
				this.confirmBtn.removeClass(
					"callout-studio-icon-picker-loading",
				);
				this.confirmBtn.empty();
				this.confirmBtn.textContent = originalText;
			}
			// User may have cancelled while we were downloading.
			if (!this.resolve) return;
		}

		this.resolve(this.selectedIcon);
		this.resolve = null;
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
