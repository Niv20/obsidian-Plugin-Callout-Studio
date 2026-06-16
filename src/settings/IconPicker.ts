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
	EmojiEntry,
	MaterialIconMeta,
	MaterialIconStyle,
	PluginSettings,
} from "../types";
import {
	getLucideIcons,
	getEmojis,
	applyEmojiSkin,
	loadMaterialIcons,
	filterMaterialIcons,
	getMaterialCategories,
	makeIcon,
	materialFontFamily,
	ensureMaterialFontLoaded,
} from "../utils/iconLoader";
import { t } from "../i18n";

const GRID_PAGE_SIZE = 120;

/**
 * Representative glyph (raised hand) in each skin tone, indexed by tone:
 * 0 = default, 1–5 = light → dark. Used for the skin-tone selector swatches.
 */
const SKIN_TONE_SAMPLES = ["✋", "✋🏻", "✋🏼", "✋🏽", "✋🏾", "✋🏿"];

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
	private activeTab: "lucide" | "material" | "emoji" = "lucide";
	private searchQuery = "";
	private selectedIcon: CalloutIcon | null = null;

	// Lucide state
	private lucideIcons: string[] = [];
	private lucideDisplayed = 0;

	// Emoji state
	private emojiList: EmojiEntry[] = [];
	private emojiDisplayed = 0;
	private emojiSkinTone = 0;
	private selectedEmojiEntry: EmojiEntry | null = null;

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

	// Track active loading timers so we can clean them up
	private loadingTimers: number[] = [];

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
		// Restore last-used emoji skin tone (0 = default)
		this.emojiSkinTone =
			plugin.settings.iconSources.lastEmojiSkinTone ?? 0;

		// When re-opening with an existing icon, seed the picker so it lands on
		// the matching tab with that icon already selected (and later scrolled
		// into view — see revealSelected).
		if (this.currentIcon) {
			this.activeTab = this.currentIcon.type;

			if (this.currentIcon.type === "material") {
				// Match the grid's style/weight filter so the cell renders and
				// highlights…
				this.materialStyle =
					this.currentIcon.style ?? this.materialStyle;
				this.materialWeight =
					this.currentIcon.weight ?? this.materialWeight;
				// …and show "All categories" so the icon is never filtered out.
				// In-memory only — the saved lastMaterialCategory is untouched.
				this.materialCategory = "";
			} else if (this.currentIcon.type === "emoji") {
				// Find the dataset entry and the skin tone its glyph belongs to,
				// so the grid renders the exact glyph (highlight matches) and
				// skin re-tinting keeps tracking the selection.
				const value = this.currentIcon.value;
				const entry = getEmojis().find(
					(e) => e.emoji === value || e.skins?.includes(value),
				);
				if (entry) {
					this.selectedEmojiEntry = entry;
					const skinIdx = entry.skins?.indexOf(value) ?? -1;
					this.emojiSkinTone = skinIdx >= 0 ? skinIdx + 1 : 0;
				}
			}
		}
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
		// Clean up loading timers
		for (const timer of this.loadingTimers) {
			window.clearTimeout(timer);
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
		const timer = window.setTimeout(() => {
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
			id: "lucide" | "material" | "emoji";
			label: string;
		}> = [
			{ id: "lucide", label: t("iconPicker.lucide") },
			{ id: "material", label: t("iconPicker.material") },
			{ id: "emoji", label: t("iconPicker.emoji") },
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
				this.selectedEmojiEntry = null;
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
			case "emoji":
				this.renderEmojiTab();
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

		// Reveal a pre-selected icon (re-opening on an existing Lucide icon).
		if (this.selectedIcon?.type === "lucide") {
			this.revealSelected(
				grid,
				loadMoreContainer,
				this.lucideIcons.indexOf(this.selectedIcon.value),
				this.lucideIcons.length,
				() => this.appendLucideIcons(grid),
			);
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

	// ── Emoji Tab ───────────────────────────────────────────────────────

	private renderEmojiTab(): void {
		const toolbar = this.tabContentEl.createDiv("icon-picker-toolbar");

		const searchInput = toolbar.createEl("input", {
			type: "text",
			placeholder: t("iconPicker.searchEmoji"),
			value: this.searchQuery,
		});

		// Skin-tone selector: one swatch per tone, each previewing a sample
		// glyph in that tone (0 = default, 1–5 = light → dark).
		const skinRow = toolbar.createDiv({
			cls: "icon-picker-skin-row",
			attr: { role: "group", "aria-label": t("iconPicker.skinTone") },
		});
		const skinButtons: HTMLButtonElement[] = [];
		SKIN_TONE_SAMPLES.forEach((sample, tone) => {
			const isActive = tone === this.emojiSkinTone;
			const btn = skinRow.createEl("button", {
				text: sample,
				cls: `icon-picker-skin-btn${isActive ? " is-active" : ""}`,
				attr: {
					"aria-label": t("iconPicker.skinTone"),
					"aria-pressed": String(isActive),
				},
			});
			skinButtons.push(btn);
			btn.addEventListener("click", () => {
				this.emojiSkinTone = tone;
				this.plugin.settings.iconSources.lastEmojiSkinTone = tone;
				void this.plugin.saveSettings();
				skinButtons.forEach((b, i) => {
					b.toggleClass("is-active", i === tone);
					b.setAttribute("aria-pressed", String(i === tone));
				});
				// Retint the visible cells in place (preserves scroll position
				// and loaded pages) instead of rebuilding the grid.
				this.refreshEmojiTones(grid);
				// Keep the current selection on the same emoji, re-toned.
				if (this.selectedEmojiEntry) {
					this.selectedIcon = makeIcon(
						"emoji",
						applyEmojiSkin(this.selectedEmojiEntry, tone),
					);
					this.updatePreview();
				}
			});
		});

		const grid = this.tabContentEl.createDiv("icon-picker-grid");
		grid.setAttribute("role", "grid");
		this.enableGridKeyNav(grid);

		const loadMoreContainer = this.tabContentEl.createDiv(
			"icon-picker-load-more",
		);
		const loadMoreBtn = loadMoreContainer.createEl("button", {
			text: t("iconPicker.loadMore"),
		});
		loadMoreBtn.addEventListener("click", () => {
			this.appendEmojiIcons(grid);
			if (this.emojiDisplayed >= this.emojiList.length) {
				loadMoreContainer.hide();
			}
		});

		const updateGrid = () => {
			this.emojiList = getEmojis(this.searchQuery);
			this.emojiDisplayed = 0;
			grid.empty();
			grid.removeClass("is-loaded");
			this.appendEmojiIcons(grid);
			grid.addClass("is-loaded");
			if (this.emojiList.length === 0 && this.searchQuery) {
				grid.createDiv("icon-picker-empty").setText(
					t("iconPicker.noResults"),
				);
			}
			if (this.emojiDisplayed >= this.emojiList.length) {
				loadMoreContainer.hide();
			} else {
				loadMoreContainer.show();
			}
		};

		searchInput.addEventListener("input", () => {
			this.searchQuery = searchInput.value;
			updateGrid();
		});

		updateGrid();

		// Reveal a pre-selected emoji (re-opening on an existing emoji icon).
		if (this.selectedIcon?.type === "emoji") {
			this.revealSelected(
				grid,
				loadMoreContainer,
				this.emojiList.indexOf(this.selectedEmojiEntry as EmojiEntry),
				this.emojiList.length,
				() => this.appendEmojiIcons(grid),
			);
		}

		searchInput.focus();
	}

	private appendEmojiIcons(grid: HTMLElement): void {
		const end = Math.min(
			this.emojiDisplayed + GRID_PAGE_SIZE,
			this.emojiList.length,
		);
		for (let i = this.emojiDisplayed; i < end; i++) {
			const entry = this.emojiList[i];
			if (!entry) continue;
			const glyph = applyEmojiSkin(entry, this.emojiSkinTone);
			const cell = grid.createDiv({
				cls: "icon-picker-cell icon-picker-emoji-cell",
				attr: {
					"aria-label": entry.label,
					tabindex: "0",
					role: "button",
				},
			});
			cell.setText(glyph);
			if (
				this.selectedIcon?.type === "emoji" &&
				this.selectedIcon.value === glyph
			) {
				cell.addClass("is-selected");
			}
			cell.addEventListener("click", () =>
				this.selectEmoji(entry, cell, grid),
			);
			cell.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					this.selectEmoji(entry, cell, grid);
				}
			});
		}
		this.emojiDisplayed = end;
	}

	/**
	 * Re-applies the current skin tone to the already-rendered emoji cells
	 * without rebuilding the grid, so scroll position and loaded pages are
	 * preserved. Cells map to emojiList by index.
	 */
	private refreshEmojiTones(grid: HTMLElement): void {
		const cells = grid.querySelectorAll<HTMLElement>(
			".icon-picker-emoji-cell",
		);
		cells.forEach((cell, i) => {
			const entry = this.emojiList[i];
			if (!entry) return;
			cell.setText(applyEmojiSkin(entry, this.emojiSkinTone));
		});
	}

	private selectEmoji(
		entry: EmojiEntry,
		cell: HTMLElement,
		grid: HTMLElement,
	): void {
		this.selectedEmojiEntry = entry;
		this.selectedIcon = makeIcon(
			"emoji",
			applyEmojiSkin(entry, this.emojiSkinTone),
		);
		grid.querySelectorAll(".is-selected").forEach((el) =>
			el.removeClass("is-selected"),
		);
		cell.addClass("is-selected");
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
		return ensureMaterialFontLoaded(style).catch(() => {
			// Keep picker responsive even if the remote font fails to load.
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
			// Push the new style onto the current selection up front so the
			// preview updates instantly and the highlight survives the re-render
			// (the highlight check compares selectedIcon.style to materialStyle).
			this.syncSelectedMaterial();
			// Show loading while font downloads, then refresh grid
			grid.empty();
			grid.removeClass("is-loaded");
			this.createDelayedLoading(grid, t("iconPicker.iconsLoading"));
			void this.ensureMaterialFont(this.materialStyle).then(() => {
				if (this.activeTab !== "material") return;
				updateGrid();
				revealMaterial();
			});
		});

		weightSelect.addEventListener("change", () => {
			this.materialWeight = parseInt(weightSelect.value, 10);
			// Weight changes don't require re-loading fonts. Push the new weight
			// onto the current selection so Confirm saves it without a re-click,
			// then re-render and keep the selected cell in view.
			this.syncSelectedMaterial();
			updateGrid();
			revealMaterial();
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

		// Reveal a pre-selected Material icon once the grid is first populated.
		const revealMaterial = () => {
			if (this.selectedIcon?.type !== "material") return;
			this.revealSelected(
				grid,
				loadMoreContainer,
				this.materialFiltered.findIndex(
					(m) => m.name === this.selectedIcon?.value,
				),
				this.materialFiltered.length,
				() => this.appendMaterialIcons(grid),
			);
		};

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
				revealMaterial();
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
					revealMaterial();
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

	/**
	 * Re-applies the current style/weight controls to the existing Material
	 * selection (if any) and refreshes the preview. Lets weight/style changes
	 * update the active selection without forcing the user to re-click the icon.
	 */
	private syncSelectedMaterial(): void {
		if (this.selectedIcon?.type !== "material") return;
		this.selectedIcon.style = this.materialStyle;
		this.selectedIcon.weight = this.materialWeight;
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
			case "emoji":
				labelEl.setText(`emoji: ${this.selectedIcon.value}`);
				break;
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
	 * After a tab's first render, pages icons in until the pre-selected icon is
	 * rendered, then scrolls its (already `.is-selected`) cell into view. The
	 * scroll container is `.icon-picker-content`; centering keeps the cell clear
	 * of the sticky search/toolbar. No-op when nothing is pre-selected.
	 */
	private revealSelected(
		grid: HTMLElement,
		loadMore: HTMLElement,
		targetIndex: number,
		total: number,
		appendPage: () => void,
	): void {
		if (targetIndex < 0) return;
		// appendXIcons() renders GRID_PAGE_SIZE more cells each call; page until
		// the target index is on screen (guard caps it for safety).
		let guard = 0;
		while (
			grid.querySelectorAll(".icon-picker-cell").length <= targetIndex &&
			guard++ < 500
		) {
			appendPage();
		}
		// Re-evaluate "Load more" visibility after the extra pages.
		if (grid.querySelectorAll(".icon-picker-cell").length >= total) {
			loadMore.hide();
		}
		grid
			.querySelector<HTMLElement>(".icon-picker-cell.is-selected")
			?.scrollIntoView({ block: "center" });
	}

	/**
	 * Adds arrow key navigation to an icon grid.
	 */
	private enableGridKeyNav(grid: HTMLElement): void {
		grid.addEventListener("keydown", (e) => {
			const cells = Array.from(
				grid.querySelectorAll<HTMLElement>(".icon-picker-cell"),
			);
			const current = activeDocument.activeElement as HTMLElement | null;
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
