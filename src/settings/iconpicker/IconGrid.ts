/**
 * settings/iconpicker/IconGrid.ts — The paged, keyboard-navigable icon grid.
 *
 * Pack-agnostic: it owns paging, selection highlighting, arrow-key navigation
 * and scrolling a pre-selected icon into view, and delegates the one thing that
 * differs between sources — how a single cell is drawn — to a callback.
 *
 * Paging exists because a source can hold thousands of icons (Material has
 * 3,870) and rendering them all would stall the modal on open.
 */
import type { IconEntry } from "../../icons/types";

const GRID_PAGE_SIZE = 120;

/** Cap on paging-to-reveal, so a bad index can never spin the UI forever. */
const MAX_REVEAL_PAGES = 500;

export interface IconGridOptions {
	/** Draws one icon into its cell. */
	renderCell(cell: HTMLElement, entry: IconEntry): void;
	/** Whether this entry is the current selection (drives the highlight). */
	isSelected(entry: IconEntry): boolean;
	onSelect(entry: IconEntry, cell: HTMLElement): void;
	/** Tooltip / accessible name. */
	labelFor(entry: IconEntry): string;
	/**
	 * Extra class for this entry's cell (emoji sizing, Material font preview).
	 *
	 * Per entry rather than per grid, because the pooled "All sources" list mixes
	 * sources that need different cell treatments in one grid.
	 */
	cellClass?(entry: IconEntry): string | undefined;
	/**
	 * A heading to place before this entry, or undefined for no break.
	 *
	 * Called with the entry that precedes it, so the grid stays ignorant of what
	 * a group even is — the pooled list heads each run of entries from one
	 * source, and every other source returns nothing and gets a flat grid.
	 */
	groupLabelFor?(entry: IconEntry, previous: IconEntry | undefined): string | undefined;
	emptyText: string;
	loadMoreText: string;
}

export class IconGrid {
	private readonly gridEl: HTMLElement;
	private readonly loadMoreEl: HTMLElement;
	private entries: readonly IconEntry[] = [];
	private displayed = 0;

	constructor(
		parent: HTMLElement,
		private readonly options: IconGridOptions,
	) {
		this.gridEl = parent.createDiv("icon-picker-grid");
		this.gridEl.setAttribute("role", "grid");
		this.enableKeyNav();

		this.loadMoreEl = parent.createDiv("icon-picker-load-more");
		const btn = this.loadMoreEl.createEl("button", {
			text: options.loadMoreText,
		});
		btn.addEventListener("click", () => {
			this.appendPage();
			this.syncLoadMore();
		});
		this.loadMoreEl.hide();
	}

	/** Replace the contents, resetting paging and scroll. */
	setEntries(entries: readonly IconEntry[]): void {
		this.entries = entries;
		this.displayed = 0;
		this.gridEl.empty();
		this.gridEl.removeClass("is-loaded");
		this.appendPage();
		this.gridEl.addClass("is-loaded");
		if (entries.length === 0) {
			this.gridEl.createDiv("icon-picker-empty").setText(
				this.options.emptyText,
			);
		}
		this.syncLoadMore();
	}

	/** Replace the grid with a message (download prompt, error, spinner). */
	showMessage(build: (host: HTMLElement) => void): void {
		this.entries = [];
		this.displayed = 0;
		this.gridEl.empty();
		this.gridEl.addClass("is-loaded");
		build(this.gridEl.createDiv("icon-picker-notice"));
		this.loadMoreEl.hide();
	}

	/**
	 * Re-run the cell renderer over what is already on screen, without
	 * rebuilding. Used when a control changes only the artwork — the emoji skin
	 * tone — so scroll position and loaded pages survive.
	 */
	repaintVisible(): void {
		const cells = Array.from(
			this.gridEl.querySelectorAll<HTMLElement>(".icon-picker-cell"),
		);
		cells.forEach((cell, i) => {
			const entry = this.entries[i];
			if (!entry) return;
			cell.empty();
			this.options.renderCell(cell, entry);
		});
	}

	/** Move the highlight without rebuilding the grid. */
	markSelected(cell: HTMLElement): void {
		this.gridEl
			.querySelectorAll(".is-selected")
			.forEach((el) => el.removeClass("is-selected"));
		cell.addClass("is-selected");
	}

	/**
	 * Page in icons until the pre-selected one exists, then centre it. Centring
	 * (rather than nearest) keeps the cell clear of the sticky toolbar above.
	 */
	revealSelected(): void {
		const target = this.entries.findIndex((e) => this.options.isSelected(e));
		if (target < 0) return;
		let guard = 0;
		while (this.cellCount() <= target && guard++ < MAX_REVEAL_PAGES) {
			if (this.displayed >= this.entries.length) break;
			this.appendPage();
		}
		this.syncLoadMore();
		this.gridEl
			.querySelector<HTMLElement>(".icon-picker-cell.is-selected")
			?.scrollIntoView({ block: "center" });
	}

	private cellCount(): number {
		return this.gridEl.querySelectorAll(".icon-picker-cell").length;
	}

	private syncLoadMore(): void {
		if (this.displayed >= this.entries.length) this.loadMoreEl.hide();
		else this.loadMoreEl.show();
	}

	private appendPage(): void {
		const end = Math.min(this.displayed + GRID_PAGE_SIZE, this.entries.length);
		for (let i = this.displayed; i < end; i++) {
			const entry = this.entries[i];
			if (!entry) continue;

			// Headings live in the same grid as the cells and span its full
			// width, so a group always starts on a fresh row and paging can add
			// one mid-flight without disturbing what is already laid out.
			const heading = this.options.groupLabelFor?.(entry, this.entries[i - 1]);
			if (heading !== undefined) {
				this.gridEl
					.createDiv("icon-picker-group-header")
					.setText(heading);
			}

			const cellClass = this.options.cellClass?.(entry);
			const cell = this.gridEl.createDiv({
				cls: `icon-picker-cell${cellClass ? ` ${cellClass}` : ""}`,
				attr: {
					"aria-label": this.options.labelFor(entry),
					tabindex: "0",
					role: "button",
				},
			});
			this.options.renderCell(cell, entry);
			if (this.options.isSelected(entry)) cell.addClass("is-selected");

			const select = () => {
				this.markSelected(cell);
				this.options.onSelect(entry, cell);
			};
			cell.addEventListener("click", select);
			cell.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					select();
				}
			});
		}
		this.displayed = end;
	}

	/**
	 * Arrow-key movement. The column count is measured from the rendered cells
	 * rather than assumed, because the grid is responsive and its width depends
	 * on the modal size and the platform.
	 */
	private enableKeyNav(): void {
		this.gridEl.addEventListener("keydown", (e) => {
			const cells = Array.from(
				this.gridEl.querySelectorAll<HTMLElement>(".icon-picker-cell"),
			);
			const current = activeDocument.activeElement as HTMLElement | null;
			const idx = current ? cells.indexOf(current) : -1;
			if (idx < 0) return;

			const cols = countColumns(cells);
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

/** Cells sharing the first row's top edge, i.e. the current column count. */
function countColumns(cells: readonly HTMLElement[]): number {
	const first = cells[0];
	if (!first || cells.length < 2) return 1;
	const top = first.getBoundingClientRect().top;
	const sameRow = cells.filter(
		(c) => Math.abs(c.getBoundingClientRect().top - top) < 2,
	);
	return Math.max(sameRow.length, 1);
}
