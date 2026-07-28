/**
 * settings/iconpicker/IconPickerModal.ts — The icon selection modal.
 *
 * A source menu rather than a tab row: there are more sources than a tab strip
 * fits, on mobile or in RTL, and the list keeps growing. The modal owns only
 * the source choice, the preview and Confirm; everything about a given source
 * lives in PackPanel.
 *
 * Nothing here reaches the network. Choosing a source shows either its grid or
 * a download prompt; only pressing Download, or confirming an icon whose
 * artwork is not local yet, causes a request.
 */
import { Menu, Modal, setIcon } from "obsidian";
import type { App } from "obsidian";
import type { CalloutIcon, IconSourceId, PluginSettings } from "../../types";
import type { IconVariantState } from "../../icons/types";
import { ICON_SOURCE_IDS, getSource, packFor } from "../../icons/registry";
import type { PackDataStore } from "../../icons/PackDataStore";
import {
	MATERIAL_DEFAULT_STYLE,
	MATERIAL_DEFAULT_WEIGHT,
} from "../../icons/packs/material";
import { FA_DEFAULT_STYLE, faStyleOf } from "../../icons/packs/fontAwesome";
import {
	ALL_SOURCES,
	ALL_SOURCES_META,
	availableSources,
	createAllSourcesPack,
	missingSources,
	type PickerSourceId,
} from "./allSources";
import { PackPanel } from "./PackPanel";
import { t } from "../../i18n";
import type { LocaleKey } from "../../i18n";

/** What the source menu needs to draw a row, pooled list included. */
interface SourceMeta {
	labelKey: LocaleKey;
	descriptionKey: LocaleKey;
	emblemIcon: string;
}

/**
 * Unicode skin-tone modifiers, light → dark (U+1F3FB…U+1F3FF). Reading the tone
 * off the glyph is exact and needs no dataset lookup, so re-opening the picker
 * highlights the toned glyph the callout actually uses.
 */
const SKIN_TONE_MODIFIERS = [
	"\u{1F3FB}",
	"\u{1F3FC}",
	"\u{1F3FD}",
	"\u{1F3FE}",
	"\u{1F3FF}",
];

function emojiToneOf(glyph: string): number {
	const index = SKIN_TONE_MODIFIERS.findIndex((m) => glyph.includes(m));
	return index >= 0 ? index + 1 : 0;
}

export interface IconPickerPlugin {
	app: App;
	settings: PluginSettings;
	saveSettings(): Promise<void>;
	ensureIconArtwork(icon: CalloutIcon): Promise<void>;
	icons: { packs: PackDataStore };
}

export class IconPicker extends Modal {
	private resolve: ((icon: CalloutIcon | null) => void) | null = null;
	private readonly currentIcon: CalloutIcon | null;
	private selectedIcon: CalloutIcon | null;
	private activeSource: PickerSourceId;
	private panel: PackPanel | null = null;

	private panelHostEl!: HTMLElement;
	private previewEl!: HTMLElement;
	private confirmBtn!: HTMLButtonElement;
	private sourceButtonEl!: HTMLButtonElement;
	/** How many icons each source offers; filled in the background on open. */
	private sourceCounts = new Map<IconSourceId, number>();

	constructor(
		private readonly plugin: IconPickerPlugin,
		currentIcon?: CalloutIcon,
	) {
		super(plugin.app);
		this.currentIcon = currentIcon ?? null;
		this.selectedIcon = currentIcon ? { ...currentIcon } : null;
		// Re-opening lands on the source the current icon came from, with that
		// icon selected and later scrolled into view. An icon from a source this
		// build does not know falls back to the default.
		this.activeSource = (currentIcon && packFor(currentIcon)?.id) ?? ALL_SOURCES;
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

		const container = this.contentEl.createDiv("icon-picker-container");
		this.buildSourcePicker(container);
		this.panelHostEl = container.createDiv("icon-picker-content");
		// Counts come from the bundled indexes, so this reaches no network and
		// is normally done long before the source menu is first opened.
		void this.loadSourceCounts();

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
		this.confirmBtn.addEventListener("click", () => void this.confirm());

		void this.openInitialPanel();
	}

	/**
	 * Warms pack state from disk before the first render, so a source
	 * downloaded in an earlier session but not yet assigned to a callout
	 * still shows as downloaded instead of prompting again.
	 */
	private async openInitialPanel(): Promise<void> {
		await this.plugin.icons.packs.loadAllFromDisk();
		await this.showPanel();
	}

	onClose(): void {
		this.panel?.dispose();
		this.panel = null;
		if (this.resolve) {
			this.resolve(null);
			this.resolve = null;
		}
	}

	// ── Source selection ────────────────────────────────────────────────

	/**
	 * A button opening a menu, not a `<select>`: an `<option>` can hold text and
	 * nothing else, and a list of bare library names asks the reader to already
	 * know which one holds "swords".
	 */
	private buildSourcePicker(container: HTMLElement): void {
		const row = container.createDiv("icon-picker-source-row");
		row.createEl("label", {
			text: t("iconPicker.chooseSource"),
			cls: "icon-picker-source-label",
			attr: { for: "cs-icon-source" },
		});
		this.sourceButtonEl = row.createEl("button", {
			cls: "icon-picker-source-button",
			attr: {
				id: "cs-icon-source",
				type: "button",
				"aria-haspopup": "menu",
				"aria-expanded": "false",
			},
		});
		this.paintSourceButton();
		this.sourceButtonEl.addEventListener("click", (evt) => {
			this.openSourceMenu(evt);
		});
	}

	/** Metadata for one row of the source menu; the pooled list has no pack. */
	private sourceMeta(id: PickerSourceId): SourceMeta {
		return id === ALL_SOURCES ? ALL_SOURCES_META : getSource(id);
	}

	private paintSourceButton(): void {
		const meta = this.sourceMeta(this.activeSource);
		this.sourceButtonEl.empty();
		const emblem = this.sourceButtonEl.createSpan({
			cls: "icon-picker-source-emblem",
		});
		setIcon(emblem, meta.emblemIcon);
		this.sourceButtonEl.createSpan({
			cls: "icon-picker-source-current",
			text: t(meta.labelKey),
		});
		const chevron = this.sourceButtonEl.createSpan({
			cls: "icon-picker-source-chevron",
		});
		setIcon(chevron, "chevron-down");
	}

	private openSourceMenu(evt: MouseEvent): void {
		const menu = new Menu();
		// Desktop defaults to a native OS menu, which can only draw plain text —
		// our emblem icons and the hand-drawn checkmark below would silently
		// disappear. Mobile has no native menu, so this only matters here.
		menu.setUseNativeMenu(false);
		// Searching everything at once comes first, and is the default: with six
		// libraries, knowing which one holds "swords" is its own puzzle.
		const ids: PickerSourceId[] = [ALL_SOURCES, ...ICON_SOURCE_IDS];
		for (const id of ids) {
			const meta = this.sourceMeta(id);
			menu.addItem((item) =>
				item
					// Every emblem is a Lucide id, which Obsidian ships — so the
					// row draws even for a source that has never been downloaded.
					.setIcon(meta.emblemIcon)
					.setTitle(this.sourceMenuTitle(id, meta))
					.onClick(() => this.selectSource(id)),
			);
		}
		this.sourceButtonEl.setAttribute("aria-expanded", "true");
		menu.onHide(() => {
			this.sourceButtonEl.setAttribute("aria-expanded", "false");
		});
		menu.showAtMouseEvent(evt);
	}

	/**
	 * Name, then what the library holds and how many icons that is, always on
	 * its own line below the name — a fragment so the description can be styled
	 * down and given room to breathe instead of squeezing onto the name's line.
	 * The check sits outside the two-line text stack so it centers on the
	 * emblem icon's row rather than pinning to either line.
	 */
	private sourceMenuTitle(id: PickerSourceId, meta: SourceMeta): DocumentFragment {
		const frag = createFragment();
		const wrap = frag.createDiv("cs-source-item");
		const text = wrap.createDiv("cs-source-text");
		text.createSpan({ cls: "cs-source-name", text: t(meta.labelKey) });

		const count = this.countFor(id);
		const description = t(meta.descriptionKey);
		text.createSpan({
			cls: "cs-source-desc",
			text:
				count === undefined
					? `(${description})`
					: `(${description} · ${count.toLocaleString()})`,
		});

		if (id === this.activeSource) {
			const check = wrap.createSpan({ cls: "cs-source-check" });
			setIcon(check, "check");
		}
		return frag;
	}

	/**
	 * Icons a source offers — distinct names, never style or weight
	 * combinations: one Font Awesome name drawn in three styles is one icon to
	 * choose from, and Material's 3,870 do not become 100,000 because the
	 * toolbar can restyle them.
	 */
	private countFor(id: PickerSourceId): number | undefined {
		if (id !== ALL_SOURCES) return this.sourceCounts.get(id);
		if (this.sourceCounts.size === 0) return undefined;
		// Only what the pool actually contains, which grows as sources download.
		return availableSources(this.plugin.icons.packs).reduce(
			(total, pack) => total + (this.sourceCounts.get(pack.id) ?? 0),
			0,
		);
	}

	private async loadSourceCounts(): Promise<void> {
		for (const id of ICON_SOURCE_IDS) {
			try {
				const index = await getSource(id).loadIndex();
				this.sourceCounts.set(id, index.entries.length);
			} catch (e) {
				// A source that cannot describe itself simply shows no count.
				console.warn(`[CalloutStudio] could not count icons in "${id}"`, e);
			}
		}
	}

	private selectSource(id: PickerSourceId): void {
		if (id === this.activeSource) return;
		this.activeSource = id;
		// Switching source clears the selection: an icon id only means anything
		// within the source it came from.
		this.selectedIcon = null;
		this.paintSourceButton();
		this.updatePreview();
		void this.showPanel();
	}

	private async showPanel(): Promise<void> {
		this.panel?.dispose();
		this.panelHostEl.empty();
		this.panel = new PackPanel(
			this.panelHostEl.createDiv("icon-picker-panel"),
			this.activePack(),
			{
				packs: this.plugin.icons.packs,
				variantsFor: (id) => this.variantsFor(id),
				saveVariants: (id, v) => this.saveVariants(id, v),
				lastCategoryFor: (id) => this.lastCategoryFor(id),
				saveCategory: (id, c) => this.saveCategory(id, c),
				selectedIcon: () => this.selectedIcon,
				onSelect: (icon) => {
					this.selectedIcon = icon;
					this.updatePreview();
				},
			},
		);
		await this.panel.render();
		if (this.activeSource === ALL_SOURCES) this.renderMissingSourcesHint();
	}

	private activePack() {
		if (this.activeSource !== ALL_SOURCES) return getSource(this.activeSource);
		// Rebuilt each time, because downloading a source mid-session should
		// fold it into the pooled list without reopening the picker.
		return createAllSourcesPack(availableSources(this.plugin.icons.packs));
	}

	/**
	 * Say which sources the pooled list is missing, rather than letting them
	 * silently not be in the results.
	 */
	private renderMissingSourcesHint(): void {
		const missing = missingSources(this.plugin.icons.packs);
		if (missing.length === 0) return;
		const hint = this.panelHostEl.createDiv("icon-picker-missing-sources");
		hint.setText(
			t("iconPicker.sourcesNotDownloaded", {
				names: missing.map((p) => t(p.labelKey)).join(", "),
			}),
		);
	}

	// ── Persisted picker state ──────────────────────────────────────────

	/**
	 * The toolbar values a source opens with. When re-opening on an existing
	 * icon they come from that icon, not from the saved defaults — otherwise
	 * its cell would be drawn in a different style and the highlight would be
	 * lost on the very icon the user is editing.
	 */
	private variantsFor(id: IconSourceId): IconVariantState {
		const sources = this.plugin.settings.iconSources;
		if (id === "fa") {
			// The style is the icon's own type, so an icon being re-edited opens
			// the grid it actually lives in.
			return {
				faStyle:
					(this.currentIcon ? faStyleOf(this.currentIcon) : undefined) ??
					sources.faStyleDefault ??
					FA_DEFAULT_STYLE,
			};
		}
		if (id === "material") {
			const current =
				this.currentIcon?.type === "material" ? this.currentIcon : null;
			return {
				style:
					current?.style ??
					sources.materialStyleDefault ??
					MATERIAL_DEFAULT_STYLE,
				weight:
					current?.weight ??
					sources.materialWeightDefault ??
					MATERIAL_DEFAULT_WEIGHT,
			};
		}
		if (id === "emoji") {
			return {
				emojiSkinTone:
					this.currentIcon?.type === "emoji"
						? emojiToneOf(this.currentIcon.value)
						: (sources.lastEmojiSkinTone ?? 0),
			};
		}
		return {};
	}

	private saveVariants(id: IconSourceId, variants: IconVariantState): void {
		const sources = this.plugin.settings.iconSources;
		if (id === "material") {
			if (variants.style) sources.materialStyleDefault = variants.style;
			if (variants.weight) sources.materialWeightDefault = variants.weight;
		} else if (id === "fa") {
			if (variants.faStyle) sources.faStyleDefault = variants.faStyle;
		} else if (id === "emoji" && variants.emojiSkinTone !== undefined) {
			sources.lastEmojiSkinTone = variants.emojiSkinTone;
		}
		void this.plugin.saveSettings();
	}

	private lastCategoryFor(id: IconSourceId): string {
		// Re-opening on an existing icon shows all categories, so the icon can
		// never be filtered out of its own grid. In-memory only — the saved
		// category is left alone.
		const current = this.currentIcon ? packFor(this.currentIcon) : undefined;
		if (current?.id === id) return "";
		return this.plugin.settings.iconSources.lastCategory?.[id] ?? "";
	}

	private saveCategory(id: IconSourceId, category: string): void {
		const sources = this.plugin.settings.iconSources;
		sources.lastCategory = { ...sources.lastCategory, [id]: category };
		void this.plugin.saveSettings();
	}

	// ── Preview & confirm ───────────────────────────────────────────────

	private updatePreview(): void {
		this.previewEl.empty();
		if (!this.selectedIcon) {
			this.previewEl.setText(t("iconPicker.noIconSelected"));
			this.confirmBtn?.toggleClass("is-disabled", true);
			return;
		}
		this.confirmBtn?.toggleClass("is-disabled", false);
		this.previewEl
			.createDiv("icon-picker-preview-label")
			.setText(describeIcon(this.selectedIcon));
	}

	/**
	 * Fetch the artwork before handing the icon back, so any wait happens here —
	 * where the icon is on screen — rather than in the editor behind the modal.
	 * Sources whose artwork is already local return immediately.
	 */
	private async confirm(): Promise<void> {
		if (!this.selectedIcon || !this.resolve) {
			this.close();
			return;
		}

		const originalText = this.confirmBtn.textContent ?? "";
		this.confirmBtn.disabled = true;
		this.confirmBtn.toggleClass("is-disabled", true);
		this.confirmBtn.empty();
		this.confirmBtn.addClass("callout-studio-icon-picker-loading");
		const spinner = this.confirmBtn.createSpan({
			cls: "callout-studio-spinner",
		});
		setIcon(spinner, "loader-2");
		this.confirmBtn.createSpan({ text: t("editor.downloadingIcon") });
		try {
			await this.plugin.ensureIconArtwork(this.selectedIcon);
		} catch {
			// Failures surface through the icon's own error state; never trap
			// the user in the picker over one.
		} finally {
			this.confirmBtn.disabled = false;
			this.confirmBtn.removeClass("callout-studio-icon-picker-loading");
			this.confirmBtn.empty();
			this.confirmBtn.textContent = originalText;
		}
		// The user may have closed the modal while the fetch was in flight.
		if (!this.resolve) return;

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
}

/** Human-readable summary of a selection, for the footer. */
function describeIcon(icon: CalloutIcon): string {
	const pack = packFor(icon);
	const source = pack ? t(pack.labelKey) : icon.type;
	if (icon.type === "material") {
		return (
			`${source}: ${icon.value} ` +
			`(${icon.style ?? MATERIAL_DEFAULT_STYLE}, ${icon.weight ?? MATERIAL_DEFAULT_WEIGHT})`
		);
	}
	// Font Awesome's three styles share one source, so the name alone would not
	// say which drawing is about to be saved.
	const faStyle = faStyleOf(icon);
	if (faStyle) return `${source}: ${icon.value} (${faStyle})`;
	return `${source}: ${icon.value}`;
}
