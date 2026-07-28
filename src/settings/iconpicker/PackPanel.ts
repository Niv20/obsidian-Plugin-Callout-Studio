/**
 * settings/iconpicker/PackPanel.ts — One source's toolbar and grid.
 *
 * Entirely driven by the IconPack it is handed: which controls to show, what to
 * search, how to draw a cell, whether a download is needed first. Adding a
 * source therefore changes nothing in this file.
 *
 * Downloadable sources open on a prompt rather than a grid, and no request is
 * made until the user presses Download. That is a deliberate, visible property:
 * opening the icon picker never touches the network.
 */
import { setIcon } from "obsidian";
import type { CalloutIcon, IconPackId, IconSourceId } from "../../types";
import type {
	IconEntry,
	IconIndex,
	IconPack,
	IconVariantState,
} from "../../icons/types";
import { filterIcons } from "../../icons/search";
import { renderIconInto } from "../../icons/renderIcon";
import { getSource, packFor } from "../../icons/registry";
import {
	MATERIAL_DEFAULT_STYLE,
	ensureMaterialFontLoaded,
	materialFontFamily,
} from "../../icons/packs/material";
import type { PackDataStore } from "../../icons/PackDataStore";
import { isAllSources } from "./allSources";
import { IconGrid } from "./IconGrid";
import { t } from "../../i18n";

/**
 * Raised hand in each skin tone, indexed 0 = default, 1–5 = light → dark.
 * Used for the swatches, so each tone previews itself.
 */
const SKIN_TONE_SAMPLES = ["✋", "✋🏻", "✋🏼", "✋🏽", "✋🏾", "✋🏿"];

/**
 * Draws grid cells straight from pack data, bypassing the `data.json` cache.
 *
 * The picker is showing icons the user has not chosen yet, so none of them are
 * in that cache — asking it would return nothing for every cell.
 */
const previewResolver = {
	resolveSvg: (icon: CalloutIcon, role: "regular" | "heading" | "inline") =>
		packFor(icon)?.buildSvg?.(icon, role) ?? null,
	hasFailed: () => false,
};

export interface PackPanelHost {
	packs: PackDataStore;
	/** Persisted picker state (last category per source, last skin tone). */
	variantsFor(sourceId: IconSourceId): IconVariantState;
	saveVariants(sourceId: IconSourceId, variants: IconVariantState): void;
	lastCategoryFor(sourceId: IconSourceId): string;
	saveCategory(sourceId: IconSourceId, category: string): void;
	onSelect(icon: CalloutIcon, entry: IconEntry): void;
	/** The icon the picker opened on, so its cell starts highlighted. */
	selectedIcon(): CalloutIcon | null;
}

export class PackPanel {
	private readonly toolbarEl: HTMLElement;
	private readonly bodyEl: HTMLElement;
	private grid: IconGrid | null = null;
	private index: IconIndex | null = null;
	private query = "";
	private category = "";
	private variants: IconVariantState;
	private searchInput: HTMLInputElement | null = null;
	private categorySelect: HTMLSelectElement | null = null;
	/** Rebuilt on every variant change — Font Awesome's applies to Brands only. */
	private noticeEl: HTMLElement | null = null;
	/** Guards against a slow load painting into a panel the user has left. */
	private disposed = false;

	constructor(
		private readonly container: HTMLElement,
		private readonly pack: IconPack,
		private readonly host: PackPanelHost,
	) {
		this.variants = { ...host.variantsFor(pack.id) };
		this.category = host.lastCategoryFor(pack.id);
		this.toolbarEl = container.createDiv("icon-picker-toolbar");
		this.bodyEl = container.createDiv("icon-picker-body");
	}

	dispose(): void {
		this.disposed = true;
		this.container.empty();
	}

	/** Build the panel and show whatever state the source is in. */
	async render(): Promise<void> {
		this.buildToolbar();
		this.grid = new IconGrid(this.bodyEl, {
			renderCell: (cell, entry) => this.renderCell(cell, entry),
			isSelected: (entry) => this.isSelected(entry),
			onSelect: (entry) => this.select(entry),
			labelFor: (entry) => this.labelFor(entry),
			cellClass: this.cellClass(),
			emptyText: t("iconPicker.noResults"),
			loadMoreText: t("iconPicker.loadMore"),
		});
		this.renderAttribution();

		// Indexes are bundled, so this touches no network — and having it before
		// the download check is what lets the prompt quote a real icon count.
		this.index = await this.pack.loadIndex();
		if (this.disposed) return;

		if (this.needsDownload()) {
			this.showDownloadPrompt();
			return;
		}
		await this.loadAndShow();
	}

	// ── Toolbar ─────────────────────────────────────────────────────────

	private buildToolbar(): void {
		this.searchInput = this.toolbarEl.createEl("input", {
			type: "text",
			cls: "icon-picker-search-input",
			placeholder: t(this.pack.searchPlaceholderKey),
			value: this.query,
		});
		this.searchInput.addEventListener("input", () => {
			this.query = this.searchInput?.value ?? "";
			this.applyFilter();
		});

		for (const spec of this.pack.variants ?? []) {
			if (spec.kind === "select") this.buildVariantSelect(spec);
			else this.buildSkinToneRow();
		}

		if (this.pack.hasCategories) {
			this.categorySelect = this.toolbarEl.createEl("select", {
				cls: "icon-picker-category-select",
			});
			// Populated once the index is decoded; the placeholder keeps the
			// toolbar from reflowing when it arrives.
			this.categorySelect.createEl("option", {
				text: t("iconPicker.allCategories"),
				value: "",
			});
			this.categorySelect.addEventListener("change", () => {
				this.category = this.categorySelect?.value ?? "";
				this.host.saveCategory(this.pack.id, this.category);
				this.applyFilter();
			});
		}
	}

	private buildVariantSelect(
		spec: Extract<
			NonNullable<IconPack["variants"]>[number],
			{ kind: "select" }
		>,
	): void {
		const select = this.toolbarEl.createEl("select", {
			cls: `icon-picker-variant-select icon-picker-${spec.key}-select`,
			attr: { "aria-label": t(spec.labelKey) },
		});
		const current = this.variants[spec.key];
		spec.options.forEach((option, i) => {
			const labelKey = spec.optionLabelKeys?.[i];
			const opt = select.createEl("option", {
				text: labelKey ? t(labelKey) : String(option),
				value: String(option),
			});
			if (String(option) === String(current)) opt.selected = true;
		});
		select.addEventListener("change", () => {
			const raw = select.value;
			this.variants = {
				...this.variants,
				[spec.key]: spec.key === "weight" ? parseInt(raw, 10) : raw,
			};
			this.host.saveVariants(this.pack.id, this.variants);
			void this.onVariantChanged();
		});
	}

	private buildSkinToneRow(): void {
		const row = this.toolbarEl.createDiv({
			cls: "icon-picker-skin-row",
			attr: { role: "group", "aria-label": t("iconPicker.skinTone") },
		});
		const buttons: HTMLButtonElement[] = [];
		SKIN_TONE_SAMPLES.forEach((sample, tone) => {
			const active = tone === (this.variants.emojiSkinTone ?? 0);
			const btn = row.createEl("button", {
				text: sample,
				cls: `icon-picker-skin-btn${active ? " is-active" : ""}`,
				attr: {
					"aria-label": t("iconPicker.skinTone"),
					"aria-pressed": String(active),
				},
			});
			buttons.push(btn);
			btn.addEventListener("click", () => {
				this.variants = { ...this.variants, emojiSkinTone: tone };
				this.host.saveVariants(this.pack.id, this.variants);
				buttons.forEach((b, i) => {
					b.toggleClass("is-active", i === tone);
					b.setAttribute("aria-pressed", String(i === tone));
				});
				// Only the glyphs change, so repaint in place: rebuilding would
				// throw away scroll position and every page loaded so far.
				this.grid?.repaintVisible();
			});
		});
	}

	/**
	 * A variant change can alter the artwork itself — and for Font Awesome which
	 * icons exist at all — so the grid is rebuilt. Material additionally has to
	 * wait for the webfont of the newly chosen style before its ligatures
	 * resolve into glyphs.
	 */
	private async onVariantChanged(): Promise<void> {
		if (this.pack.kind === "perIconRemote") {
			await ensureMaterialFontLoaded(
				this.variants.style ?? MATERIAL_DEFAULT_STYLE,
			).catch(() => {
				// An unreachable font must not block browsing; ligature names
				// simply show as text until it arrives.
			});
			if (this.disposed) return;
		}
		this.updateNotice();
		this.applyFilter();
		this.grid?.revealSelected();
	}

	// ── Loading ─────────────────────────────────────────────────────────

	/** The pack files this source draws from; empty for sources with none. */
	private dataPacks(): readonly IconPackId[] {
		if (this.pack.kind !== "bundledRemote") return [];
		return this.pack.dataPacks ?? [];
	}

	private missingPacks(): IconPackId[] {
		return this.dataPacks().filter(
			(id) => this.host.packs.state(id) !== "ready",
		);
	}

	private needsDownload(): boolean {
		return this.missingPacks().length > 0;
	}

	private async loadAndShow(): Promise<void> {
		// Material previews its grid with the webfont rather than SVGs, since
		// its artwork is fetched one icon at a time and none of it is local
		// yet. The pooled list contains Material cells too, so it waits as well.
		if (this.pack.kind === "perIconRemote" || isAllSources(this.pack)) {
			await ensureMaterialFontLoaded(
				this.variants.style ?? MATERIAL_DEFAULT_STYLE,
			).catch(() => undefined);
			if (this.disposed) return;
		}

		this.index = await this.pack.loadIndex();
		if (this.disposed) return;

		this.populateCategories();
		this.applyFilter();
		this.grid?.revealSelected();
		this.searchInput?.focus();
	}

	private populateCategories(): void {
		const select = this.categorySelect;
		const categories = this.index?.categories ?? [];
		if (!select || categories.length === 0) return;
		select.empty();
		select.createEl("option", {
			text: t("iconPicker.allCategories"),
			value: "",
		});
		for (const category of categories) {
			select.createEl("option", { text: category, value: category });
		}
		// A remembered category that no longer exists falls back to "all"
		// rather than silently filtering everything out.
		if (this.category && categories.includes(this.category)) {
			select.value = this.category;
		} else {
			this.category = "";
			select.value = "";
		}
	}

	private applyFilter(): void {
		if (!this.index) return;
		const entries = filterIcons(this.index, this.query, this.category);
		// A pack may also rule entries out by variant — Font Awesome's style
		// picks which icons exist, not just how they are drawn.
		const matches = this.pack.entryMatches?.bind(this.pack);
		this.grid?.setEntries(
			matches
				? entries.filter((entry) => matches(entry, this.variants))
				: entries,
		);
	}

	// ── Download states ─────────────────────────────────────────────────

	/**
	 * One prompt for the source, however many files it is made of. The size is
	 * of what is actually missing, so someone who already has Font Awesome Solid
	 * is quoted the two remaining files rather than all three.
	 */
	private showDownloadPrompt(): void {
		const missing = this.missingPacks();
		const failed = missing.some(
			(id) => this.host.packs.state(id) === "failed",
		);
		const bytes = missing.reduce(
			(total, id) => total + (this.host.packs.info(id)?.bytes ?? 0),
			0,
		);
		// The index's own length, not the manifest's: one Font Awesome name
		// drawn in two styles is one icon to choose from, not two.
		const count = this.index?.entries.length ?? 0;

		this.grid?.showMessage((host) => {
			host.createDiv("icon-picker-notice-title").setText(
				failed
					? t("iconPack.downloadFailed", {
							name: this.pack.attribution.title,
						})
					: t("iconPack.downloadTitle", {
							name: this.pack.attribution.title,
						}),
			);
			if (count > 0 && bytes > 0) {
				host.createDiv("icon-picker-notice-detail").setText(
					t("iconPack.downloadDetail", {
						count: String(count),
						size: formatBytes(bytes),
					}),
				);
			}

			const btn = host.createEl("button", {
				text: failed ? t("iconPack.retry") : t("iconPack.download"),
				cls: "mod-cta",
			});
			btn.addEventListener("click", () => void this.startDownload());
		});
	}

	private async startDownload(): Promise<void> {
		this.grid?.showMessage((host) => {
			const row = host.createDiv("icon-picker-notice-loading");
			const spinner = row.createSpan({ cls: "callout-studio-spinner" });
			setIcon(spinner, "loader-2");
			row.createSpan({
				text: t("iconPack.downloading", {
					name: this.pack.attribution.title,
				}),
			});
		});

		// One at a time: three parallel requests to the same CDN gain nothing
		// and make a failure harder to attribute.
		for (const id of this.missingPacks()) {
			const ok = await this.host.packs.download(id);
			if (this.disposed) return;
			if (!ok) {
				this.showDownloadPrompt();
				return;
			}
		}
		await this.loadAndShow();
	}

	// ── Cells ───────────────────────────────────────────────────────────

	/** Grid tooltip; the pooled list names the source too. */
	private labelFor(entry: IconEntry): string {
		const base = entry.label ?? entry.name;
		if (!entry.pack) return base;
		return `${base} — ${t(this.packOf(entry).labelKey)}`;
	}

	private cellClass(): string | undefined {
		if (this.pack.kind === "glyph") return "icon-picker-emoji-cell";
		if (this.pack.kind === "perIconRemote") {
			return "icon-picker-material-cell";
		}
		return undefined;
	}

	/**
	 * The source an entry belongs to. Normally this panel's own, but the pooled
	 * "All sources" list carries entries from several, each of which knows how
	 * to draw and store its own icons.
	 */
	private packOf(entry: IconEntry): IconPack {
		if (!entry.pack) return this.pack;
		return getSource(entry.pack) ?? this.pack;
	}

	/** The toolbar values that apply to an entry's own source. */
	private variantsOf(entry: IconEntry): IconVariantState {
		const owner = this.packOf(entry);
		return owner.id === this.pack.id
			? this.variants
			: this.host.variantsFor(owner.id);
	}

	private renderCell(cell: HTMLElement, entry: IconEntry): void {
		const owner = this.packOf(entry);
		const variants = this.variantsOf(entry);

		// Material's artwork is fetched per icon, so nothing is local to draw
		// from. Its webfont renders those cells instead, by ligature name.
		if (owner.kind === "perIconRemote") {
			const span = cell.createSpan({ cls: "icon-picker-material-icon" });
			span.setText(entry.name);
			const style = variants.style ?? MATERIAL_DEFAULT_STYLE;
			span.setCssProps({
				"--cs-material-font": `"${materialFontFamily(style)}"`,
				"--cs-material-weight": String(variants.weight ?? 400),
			});
			if (style === "filled") span.setCssProps({ "--cs-material-fill": "1" });
			return;
		}

		renderIconInto(cell, owner.makeIcon(entry, variants), previewResolver, {
			role: "regular",
			fill: "currentColor",
			missing: { kind: "placeholder", lucideId: "circle-dashed" },
			errorText: "?",
		});
	}

	/**
	 * Compared against the icon this entry would produce, rather than against
	 * the source it belongs to: one source can own several icon types (Font
	 * Awesome's three styles), and only the produced icon says which one this
	 * cell is currently offering.
	 */
	private isSelected(entry: IconEntry): boolean {
		const selected = this.host.selectedIcon();
		if (!selected) return false;
		const owner = this.packOf(entry);
		const candidate = owner.makeIcon(entry, this.variantsOf(entry));
		return (
			candidate.type === selected.type &&
			candidate.value === selected.value &&
			candidate.style === selected.style
		);
	}

	private select(entry: IconEntry): void {
		const owner = this.packOf(entry);
		this.host.onSelect(owner.makeIcon(entry, this.variantsOf(entry)), entry);
	}

	// ── Attribution ─────────────────────────────────────────────────────

	/**
	 * The credit line for this source, and any standing notice it carries.
	 *
	 * Font Awesome's icons are CC BY 4.0, which requires attribution wherever
	 * the work is used — this is that surface, alongside the settings credits.
	 */
	private renderAttribution(): void {
		const { attribution } = this.pack;
		// The pooled source credits nothing itself; each icon's own source is
		// credited on its own panel and in the settings credits section.
		if (attribution.licenses.length === 0) return;
		this.noticeEl = this.bodyEl.createDiv("icon-picker-pack-notice");
		this.updateNotice();
		const line = this.bodyEl.createDiv("icon-picker-pack-credit");
		const licenses = attribution.licenses.map((l) => l.spdx).join(", ");
		line.setText(`${attribution.title} — ${licenses}`);
		line.createEl("a", {
			text: attribution.homepage.replace(/^https?:\/\//, ""),
			href: attribution.homepage,
			attr: { target: "_blank", rel: "noopener" },
		});
	}

	/**
	 * A pack that scopes its notice to certain toolbar states decides here;
	 * everything else shows its standing notice, or none.
	 */
	private updateNotice(): void {
		const el = this.noticeEl;
		if (!el) return;
		const key = this.pack.pickerNotice
			? this.pack.pickerNotice(this.variants)
			: this.pack.attribution.noticeKey;
		el.setText(key ? t(key) : "");
		el.toggleClass("is-hidden", !key);
	}
}

function formatBytes(bytes: number): string {
	const kb = bytes / 1024;
	return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}
