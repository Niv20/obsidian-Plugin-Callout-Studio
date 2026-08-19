/**
 * settings/QuickInsertModal.ts — the ribbon's quick-insert window.
 *
 * One list of every block callout the user could write today, searchable,
 * filterable by source, each row offering exactly two things: edit it, or drop
 * it into the note.
 *
 * **Block callouts only, and the title says so.** The same definition also
 * renders as a heading callout and an inline one, so a window that just said
 * "insert callout" would be ambiguous in a way the user only discovers after
 * pressing the button. Heading and inline stay where they already are — the
 * `[!` popover and the user's own commands.
 *
 * It writes nothing itself. {@link wrapSelectionInCallout} is the one function
 * that turns a definition into block markdown, shared with the `Wrap in
 * callout` command and every user-built wrap command, so all three cannot
 * disagree about what a selection, a paragraph or a blank line becomes.
 */
import { Modal, Notice } from "obsidian";
import { wrapSelectionInCallout } from "../editor/CalloutBlockTools";
import {
	currentTargetEditor,
	resolveTargetEditor,
	type TargetEditor,
} from "../editor/targetMarkdownEditor";
import { getLocale, t } from "../i18n";
import type { CalloutDefinition } from "../types";
import {
	filterCalloutList,
	isCalloutSourceFilter,
	type CalloutSourceFilter,
} from "../utils/calloutSearch";
import { filterUsableCallouts } from "../utils/usableCallouts";
import { applyModalChrome, removeModalChrome } from "./modalChrome";
import { openCalloutEditorFor } from "./openCalloutEditor";
import { renderQuickInsertRow } from "./quickInsertRow";
import type { SettingsTabPlugin } from "./sections/types";

/** The three source choices, in the order they appear in the dropdown. */
const SOURCE_OPTIONS: readonly { value: CalloutSourceFilter; key: string }[] = [
	{ value: "all", key: "quickInsert.sourceAll" },
	{ value: "builtin", key: "quickInsert.sourceBuiltIn" },
	{ value: "user", key: "quickInsert.sourceUser" },
];

export class QuickInsertModal extends Modal {
	private query = "";
	private filter: CalloutSourceFilter;

	/**
	 * The editor this window was opened beside, resolved once, before any modal
	 * has taken focus. Re-checked rather than trusted at insert time.
	 */
	private readonly captured: TargetEditor | null;

	private listEl: HTMLElement | null = null;
	private searchEl: HTMLInputElement | null = null;
	/** Rows currently on screen, in view order — what the arrow keys walk. */
	private rows: { def: CalloutDefinition; el: HTMLElement }[] = [];
	private activeIndex = -1;

	private readonly onRegistryChange = (): void => {
		this.renderList();
	};
	private disposeIconListener: (() => void) | null = null;

	constructor(private readonly plugin: SettingsTabPlugin) {
		super(plugin.app);
		this.filter = isCalloutSourceFilter(plugin.settings.quickInsertSource)
			? plugin.settings.quickInsertSource
			: "all";
		this.captured = resolveTargetEditor(plugin.app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		// On `modalEl`: `--dialog-width` is read by `.modal` itself.
		this.modalEl.addClass("cs-quick-insert");
		// No footer — every row carries its own actions, like the import and
		// export choosers.
		applyModalChrome(this);
		this.titleEl.setText(t("quickInsert.title"));
		contentEl.createEl("p", {
			text: t("quickInsert.desc"),
			cls: "setting-item-description",
		});

		this.buildToolbar(contentEl);
		if (!this.captured) {
			contentEl.createDiv({
				cls: "cs-quick-insert-hint",
				text: t("quickInsert.noEditorHint"),
			});
		}

		this.listEl = contentEl.createDiv({ cls: "callout-studio-callout-list" });
		this.renderList();

		this.plugin.registry.onChange(this.onRegistryChange);
		// Artwork that lands after the window is up must repaint the rows it
		// belongs to; without this a freshly picked icon stays a spinner.
		this.disposeIconListener = this.plugin.onIconCacheChange(() => {
			this.renderList();
		});

		this.searchEl?.focus();
	}

	onClose(): void {
		this.plugin.registry.offChange(this.onRegistryChange);
		this.disposeIconListener?.();
		this.disposeIconListener = null;
		this.contentEl.empty();
		removeModalChrome(this);
		this.modalEl.removeClass("cs-quick-insert");
	}

	// ── Toolbar ─────────────────────────────────────────────────────────

	private buildToolbar(parent: HTMLElement): void {
		const toolbar = parent.createDiv({ cls: "cs-quick-insert-toolbar" });

		// Always empty on open: the filter is a standing preference, a query is
		// about one insertion.
		this.searchEl = toolbar.createEl("input", {
			type: "text",
			cls: "cs-quick-insert-search",
			placeholder: t("quickInsert.searchPlaceholder"),
		});
		this.searchEl.addEventListener("input", () => {
			this.query = this.searchEl?.value ?? "";
			this.renderList();
		});
		// Bound to the field rather than the window so typing and arrowing are
		// the same gesture. Left/Right are deliberately untouched — they move
		// the caret, and stealing them would break the search box itself.
		this.searchEl.addEventListener("keydown", (ev) => this.onSearchKey(ev));

		const select = toolbar.createEl("select", {
			cls: "cs-quick-insert-filter dropdown",
			attr: { "aria-label": t("quickInsert.sourceAria") },
		});
		for (const option of SOURCE_OPTIONS) {
			select.createEl("option", { value: option.value, text: t(option.key) });
		}
		select.value = this.filter;
		select.addEventListener("change", () => {
			this.filter = isCalloutSourceFilter(select.value) ? select.value : "all";
			this.plugin.settings.quickInsertSource = this.filter;
			void this.plugin.saveSettings();
			this.renderList();
		});
	}

	private onSearchKey(ev: KeyboardEvent): void {
		if (ev.key === "ArrowDown") {
			ev.preventDefault();
			this.setActive(Math.min(this.activeIndex + 1, this.rows.length - 1));
		} else if (ev.key === "ArrowUp") {
			ev.preventDefault();
			this.setActive(Math.max(this.activeIndex - 1, 0));
		} else if (ev.key === "Enter") {
			ev.preventDefault();
			// With nothing arrowed to, Enter takes the top row — the one the
			// query is most plausibly about.
			const row = this.rows[this.activeIndex >= 0 ? this.activeIndex : 0];
			if (row) this.insert(row.def);
		}
	}

	private setActive(index: number): void {
		this.rows[this.activeIndex]?.el.removeClass("is-active");
		if (index < 0 || index >= this.rows.length) {
			this.activeIndex = -1;
			return;
		}
		this.activeIndex = index;
		const row = this.rows[index];
		row?.el.addClass("is-active");
		row?.el.scrollIntoView({ block: "nearest" });
	}

	// ── List ────────────────────────────────────────────────────────────

	/**
	 * Every callout the user could write right now, re-read from the registry.
	 *
	 * `filterUsableCallouts` is the gate every callout-offering surface shares:
	 * a row discovery auto-created for an id that has since left the vault is
	 * not something to offer back.
	 */
	private usableCallouts(): CalloutDefinition[] {
		return filterUsableCallouts(this.plugin.registry.getAll(), (id) =>
			this.plugin.isKnownZeroUsageFallback(id),
		);
	}

	private renderList(): void {
		const listEl = this.listEl;
		if (!listEl) return;
		listEl.empty();
		this.rows = [];
		this.activeIndex = -1;

		const visible = filterCalloutList(this.usableCallouts(), {
			query: this.query,
			filter: this.filter,
			locale: getLocale(),
		});

		if (visible.length === 0) {
			// Two different nothings: a query that found none, and a filter with
			// none to find. The second is not a failed search.
			const empty =
				this.query.trim() === "" && this.filter === "user"
					? t("quickInsert.noUserCallouts")
					: t("quickInsert.noResults");
			listEl.createDiv({ cls: "callout-studio-empty-state", text: empty });
			return;
		}

		for (const def of visible) {
			const el = renderQuickInsertRow(listEl, def, this.plugin.registry, {
				canInsert: this.captured !== null,
				onEdit: (target) => void this.edit(target),
				onInsert: (target) => this.insert(target),
				onHover: (rowEl) =>
					this.setActive(this.rows.findIndex((r) => r.el === rowEl)),
			});
			this.rows.push({ def, el });
		}
	}

	// ── Actions ─────────────────────────────────────────────────────────

	/**
	 * Open the real callout editor above this window.
	 *
	 * The list stays open underneath and re-reads the registry when the editor
	 * closes, so a rename, a recolour or a delete is reflected without the user
	 * having to close this, go to Settings and come back.
	 */
	private async edit(def: CalloutDefinition): Promise<void> {
		await openCalloutEditorFor(this.plugin, def);
		this.renderList();
	}

	/**
	 * Write the callout into the note and get out of the way.
	 *
	 * Resolved again here rather than trusting the capture: the note may have
	 * been closed, its leaf re-used, or flipped into Reading view since the
	 * window opened.
	 */
	private insert(def: CalloutDefinition): void {
		const target = currentTargetEditor(this.plugin.app, this.captured);
		if (!target) {
			new Notice(t("quickInsert.noEditor"));
			return;
		}
		this.close();
		// Focus first, so the edit lands in a view that is already scrolled to
		// the cursor. The write itself is a single `replaceRange`, which is what
		// makes one Undo put everything back.
		target.editor.focus();
		wrapSelectionInCallout(target.editor, { def });
	}
}
