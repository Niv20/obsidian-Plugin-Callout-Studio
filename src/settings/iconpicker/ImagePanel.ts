/**
 * settings/iconpicker/ImagePanel.ts — The "Your images" source's panel.
 *
 * Every other source is a fixed library, so one PackPanel driven by the IconPack
 * covers them all. This one is a library the user writes to, and that needs
 * affordances the pack contract deliberately has no room for: adding files,
 * renaming, deleting, and choosing whether a picture follows the callout's
 * colour. Bending PackPanel to carry those for a single source would put a
 * branch in the file whose whole point is not having any, so this is a separate
 * panel that reuses IconGrid — the part that genuinely is shared.
 */
import { Notice, setIcon } from "obsidian";
import type { App } from "obsidian";
import type { CalloutDefinition, CalloutIcon, UserImageIcon } from "../../types";
import type { IconEntry } from "../../icons/types";
import { renderIconInto } from "../../icons/renderIcon";
import { userImagesPack } from "../../icons/packs/userImages";
import {
	USER_IMAGE_ACCEPT,
	importImageFile,
} from "../../icons/userImageImport";
import { formatByteSize, userImagesByteSize } from "../../utils/userImages";
import { ConfirmModal } from "../../utils/ConfirmModal";
import { IconGrid } from "./IconGrid";
import { t } from "../../i18n";

/**
 * Draws cells straight from the pack, like PackPanel's own preview resolver:
 * the grid shows pictures the user has not chosen yet, so the `data.json`
 * artwork cache has nothing to say about any of them.
 */
const previewResolver = {
	resolveSvg: (icon: CalloutIcon, role: "regular" | "heading" | "inline") =>
		userImagesPack.buildSvg?.(icon, role) ?? null,
	hasFailed: () => false,
};

export interface ImagePanelHost {
	app: App;
	/** Every callout, for warning that a picture about to go is in use. */
	allCallouts(): CalloutDefinition[];
	images(): readonly UserImageIcon[];
	/** The single writer — it re-syncs the pack and repaints open notes. */
	saveImages(images: readonly UserImageIcon[]): void;
	onSelect(icon: CalloutIcon, entry: IconEntry): void;
	selectedIcon(): CalloutIcon | null;
}

export class ImagePanel {
	private readonly toolbarEl: HTMLElement;
	private readonly bodyEl: HTMLElement;
	private readonly footerEl: HTMLElement;
	private grid: IconGrid | null = null;
	private query = "";
	private fileInput: HTMLInputElement | null = null;
	/** Which picture the action row acts on; null when nothing is selected. */
	private activeId: string | null = null;
	private disposed = false;

	constructor(
		private readonly container: HTMLElement,
		private readonly host: ImagePanelHost,
	) {
		const selected = host.selectedIcon();
		this.activeId = selected?.type === "image" ? selected.value : null;
		this.toolbarEl = container.createDiv("icon-picker-toolbar");
		this.bodyEl = container.createDiv("icon-picker-body");
		this.footerEl = container.createDiv("icon-picker-image-footer");
	}

	dispose(): void {
		this.disposed = true;
		this.container.empty();
	}

	render(): Promise<void> {
		this.buildToolbar();
		this.grid = new IconGrid(this.bodyEl, {
			renderCell: (cell, entry) => this.renderCell(cell, entry),
			isSelected: (entry) => this.isSelected(entry),
			onSelect: (entry) => this.select(entry),
			labelFor: (entry) => entry.label ?? entry.name,
			cellClass: () => "icon-picker-image-cell",
			// Only ever seen when the collection itself is empty; a search that
			// matches nothing is handled in refresh(), which knows the query.
			emptyText: t("iconPicker.imageEmpty"),
			loadMoreText: t("iconPicker.loadMore"),
		});
		this.enableDrop();
		this.refresh();
		this.grid.revealSelected();
		return Promise.resolve();
	}

	// ── Toolbar ─────────────────────────────────────────────────────────

	private buildToolbar(): void {
		const addBtn = this.toolbarEl.createEl("button", {
			cls: "icon-picker-image-add mod-cta",
			attr: { type: "button" },
		});
		setIcon(addBtn.createSpan("icon-picker-image-add-icon"), "image-plus");
		addBtn.createSpan({ text: t("iconPicker.imageAdd") });
		addBtn.addEventListener("click", () => this.fileInput?.click());

		// The real input stays out of the layout; the styled button drives it.
		this.fileInput = this.toolbarEl.createEl("input", {
			cls: "icon-picker-image-input",
			type: "file",
			attr: { accept: USER_IMAGE_ACCEPT, multiple: "" },
		});
		this.fileInput.addEventListener("change", () => {
			const files = Array.from(this.fileInput?.files ?? []);
			// Clear first, so picking the same file twice in a row still fires.
			if (this.fileInput) this.fileInput.value = "";
			void this.addFiles(files);
		});

		const search = this.toolbarEl.createEl("input", {
			type: "text",
			cls: "icon-picker-search-input",
			placeholder: t("iconPicker.searchImage"),
			value: this.query,
		});
		search.addEventListener("input", () => {
			this.query = search.value;
			this.refresh();
		});
	}

	/**
	 * Accept pictures dropped anywhere on the panel.
	 *
	 * Listeners sit on the panel's own element, which `dispose` destroys, so they
	 * need no separate teardown — the same arrangement PackPanel uses.
	 */
	private enableDrop(): void {
		this.container.addEventListener("dragover", (ev) => {
			if (!ev.dataTransfer?.types.includes("Files")) return;
			ev.preventDefault();
			this.container.addClass("is-drop-target");
		});
		this.container.addEventListener("dragleave", (ev) => {
			// Moving between children fires dragleave on the parent; only a
			// pointer that has actually left the panel should clear the state.
			if (this.container.contains(ev.relatedTarget as Node | null)) return;
			this.container.removeClass("is-drop-target");
		});
		this.container.addEventListener("drop", (ev) => {
			const files = Array.from(ev.dataTransfer?.files ?? []);
			if (files.length === 0) return;
			ev.preventDefault();
			this.container.removeClass("is-drop-target");
			void this.addFiles(files);
		});
	}

	// ── Adding ──────────────────────────────────────────────────────────

	/**
	 * Read a batch of files, keeping whatever works.
	 *
	 * One bad file in a drop of ten must not cost the other nine, so each is
	 * reported on its own and the rest carry on.
	 */
	private async addFiles(files: readonly File[]): Promise<void> {
		if (files.length === 0) return;
		const added: UserImageIcon[] = [];
		for (const file of files) {
			const result = await importImageFile(file);
			if (result.ok) added.push(result.image);
			else new Notice(t(result.reason, { name: file.name }));
		}
		if (this.disposed || added.length === 0) return;

		this.host.saveImages([...this.host.images(), ...added]);
		// Land on the first new picture, so it is previewed and confirmable
		// without hunting for it in the grid.
		const first = added[0];
		if (first) this.activeId = first.id;
		this.refresh();
		if (first) {
			this.host.onSelect(
				{ type: "image", value: first.id },
				this.entryFor(first),
			);
			this.grid?.revealSelected();
		}
	}

	// ── Grid ────────────────────────────────────────────────────────────

	/** Rebuild the grid and the action row from the current picture list. */
	private refresh(): void {
		const images = this.matching();
		// "No pictures yet" and "nothing matches that search" are different
		// situations, and the grid's own empty text only knows the first.
		if (images.length === 0 && this.query.trim().length > 0) {
			this.grid?.showMessage((host) =>
				host.setText(t("iconPicker.noResults")),
			);
		} else {
			this.grid?.setEntries(images.map((image) => this.entryFor(image)));
		}
		this.renderFooter();
	}

	private matching(): UserImageIcon[] {
		const images = [...this.host.images()].sort((a, b) => b.addedAt - a.addedAt);
		const query = this.query.trim().toLowerCase();
		if (!query) return images;
		return images.filter((image) => image.name.toLowerCase().includes(query));
	}

	private entryFor(image: UserImageIcon): IconEntry {
		return {
			name: image.id,
			label: image.name,
			categories: [],
			keywords: [image.name],
		};
	}

	private renderCell(cell: HTMLElement, entry: IconEntry): void {
		renderIconInto(
			cell,
			{ type: "image", value: entry.name },
			previewResolver,
			{
				role: "regular",
				// A picture keeps its own colours in the grid whatever its
				// recolour setting: the cell has no callout colour to follow.
				fill: "currentColor",
				missing: { kind: "placeholder", lucideId: "image-off" },
				errorText: "?",
			},
		);
	}

	private isSelected(entry: IconEntry): boolean {
		return entry.name === this.activeId;
	}

	private select(entry: IconEntry): void {
		this.activeId = entry.name;
		this.host.onSelect({ type: "image", value: entry.name }, entry);
		this.renderFooter();
	}

	// ── Action row ──────────────────────────────────────────────────────

	/**
	 * The rename / recolour / delete controls for the selected picture, plus how
	 * much of `data.json` the collection is taking up.
	 *
	 * Acting on the selection rather than hanging buttons off every cell keeps
	 * the grid a grid — and IconGrid has no per-cell affordance to hang them on.
	 */
	private renderFooter(): void {
		this.footerEl.empty();
		const active = this.activeImage();

		if (active) {
			const actions = this.footerEl.createDiv("icon-picker-image-actions");

			const nameInput = actions.createEl("input", {
				type: "text",
				cls: "icon-picker-image-name",
				value: active.name,
				attr: { "aria-label": t("iconPicker.imageRename") },
			});
			nameInput.addEventListener("change", () => {
				this.rename(active.id, nameInput.value);
			});

			const recolorLabel = actions.createEl("label", {
				cls: "icon-picker-image-recolor",
			});
			const recolor = recolorLabel.createEl("input", { type: "checkbox" });
			recolor.checked = active.recolor;
			// A mask discards colour, so only a flat drawing can follow the
			// callout — recolouring a photo would leave a silhouette.
			recolor.disabled = active.format !== "svg";
			recolorLabel.createSpan({ text: t("iconPicker.imageRecolor") });
			if (recolor.disabled) {
				recolorLabel.setAttribute(
					"aria-label",
					t("iconPicker.imageRecolorRasterHint"),
				);
				recolorLabel.addClass("is-disabled");
			}
			recolor.addEventListener("change", () => {
				this.setRecolor(active.id, recolor.checked);
			});

			const deleteBtn = actions.createEl("button", {
				cls: "icon-picker-image-delete mod-warning",
				text: t("iconPicker.imageDelete"),
				attr: { type: "button" },
			});
			deleteBtn.addEventListener("click", () => {
				void this.confirmDelete(active);
			});
		}

		const images = this.host.images();
		this.footerEl.createDiv("icon-picker-image-storage").setText(
			t("iconPicker.imageStorage", {
				count: String(images.length),
				size: formatByteSize(userImagesByteSize(images)),
			}),
		);
	}

	private activeImage(): UserImageIcon | undefined {
		if (!this.activeId) return undefined;
		return this.host.images().find((image) => image.id === this.activeId);
	}

	// ── Mutations ───────────────────────────────────────────────────────

	private rename(id: string, name: string): void {
		const trimmed = name.trim();
		if (trimmed.length === 0) {
			// An unnamed picture is unfindable in search; put the old name back.
			this.renderFooter();
			return;
		}
		this.update(id, (image) => ({ ...image, name: trimmed }));
	}

	private setRecolor(id: string, recolor: boolean): void {
		// `rev` moves because the artwork now draws differently, and that is what
		// the render key watches — without it an open note keeps the old paint.
		this.update(id, (image) => ({
			...image,
			recolor,
			rev: image.rev + 1,
		}));
	}

	private update(
		id: string,
		change: (image: UserImageIcon) => UserImageIcon,
	): void {
		this.host.saveImages(
			this.host.images().map((image) =>
				image.id === id ? change(image) : image,
			),
		);
		this.refresh();
	}

	/**
	 * Delete, saying first how many callouts are about to lose their icon.
	 *
	 * They are not repointed or blocked — a callout whose picture is gone falls
	 * back to a placeholder, which is recoverable, whereas silently rewriting
	 * someone's callouts is not.
	 */
	private async confirmDelete(image: UserImageIcon): Promise<void> {
		const inUse = this.host
			.allCallouts()
			.filter(
				(def) => def.icon.type === "image" && def.icon.value === image.id,
			).length;

		const message = createFragment();
		message.createEl("p", {
			text: t("iconPicker.imageDeleteConfirm", { name: image.name }),
		});
		if (inUse > 0) {
			message.createEl("p", {
				text: t("iconPicker.imageDeleteInUse", { count: String(inUse) }),
				cls: "cs-reset-warning",
			});
		}

		const confirmed = await new ConfirmModal(this.host.app, message).confirm();
		if (!confirmed || this.disposed) return;

		this.host.saveImages(
			this.host.images().filter((entry) => entry.id !== image.id),
		);
		if (this.activeId === image.id) this.activeId = null;
		this.refresh();
	}
}
