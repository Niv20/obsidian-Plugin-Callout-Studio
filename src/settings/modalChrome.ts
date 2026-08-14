/**
 * settings/modalChrome.ts — the one modal shell every Callout Studio window wears.
 *
 * Obsidian hands a plugin a few boxes — `modalEl > (closeEl, headerEl > titleEl,
 * contentEl)` — and no opinion about what to do with them, so each of this
 * plugin's windows had grown its own answer: two carried a sticky title with a
 * rule under it and a pinned button bar, one drew its rule on a toolbar instead
 * of the title, and the rest had neither and let their buttons scroll away with
 * the content.
 *
 * Note the nesting: the title is a grandchild of `modalEl`, so the header band
 * is `headerEl`. Styling `modalEl > .modal-title` selects nothing.
 *
 * The standard is three bands:
 *
 *   ┌───────────────────────────────┐
 *   │ title                       ✕ │  header  — fixed, rule along its bottom
 *   ├───────────────────────────────┤
 *   │ content …                     │  body    — the ONLY scroll container
 *   ├───────────────────────────────┤
 *   │              [Cancel] [Save]  │  footer  — fixed, rule along its top; optional
 *   └───────────────────────────────┘
 *
 * Both rules run edge to edge, which is why the geometry lives here rather than
 * in each modal: `.modal` gives up its own padding to `.cs-modal` so the rules
 * can reach the window's sides, and every band re-applies that inset itself.
 *
 * Everything visual is in `styles.css` under "Modal chrome" — this module only
 * hangs the classes and returns the footer to fill.
 */
import type { Modal } from "obsidian";

export interface ModalChromeOptions {
	/** Build the pinned bottom bar and return it. Omit for windows with no actions. */
	footer?: boolean;
	/** Wider window with a roomier inset — the callout and palette editors. */
	wide?: boolean;
	/** Set false for windows that never call `setTitle`/`titleEl.setText` — the
	 * confirmation and replace-picker modals. Obsidian hides the empty title
	 * itself but not the header band around it; this hides that band outright
	 * instead of leaving a padded rule over nothing. Defaults to true. */
	title?: boolean;
}

/**
 * Dress `modal` in the standard chrome.
 *
 * Safe to call again on a modal that is being reopened: Obsidian reuses `modalEl`
 * across open/close, so a previous footer is cleared rather than duplicated.
 *
 * @returns the footer element when `footer` is set, otherwise `null`.
 */
export function applyModalChrome(
	modal: Modal,
	options: ModalChromeOptions & { footer: true },
): HTMLElement;
export function applyModalChrome(
	modal: Modal,
	options?: ModalChromeOptions,
): HTMLElement | null;
export function applyModalChrome(
	modal: Modal,
	options: ModalChromeOptions = {},
): HTMLElement | null {
	const { modalEl, containerEl } = modal;
	modalEl.addClass("cs-modal");
	modalEl.toggleClass("cs-modal-wide", options.wide === true);
	modalEl.toggleClass("cs-modal-no-title", options.title === false);
	detachFooter(modalEl);

	// Marks the window's backdrop layer for styles.css, which paints the dim
	// behind a stacked window on mobile itself (see "Stacked windows on mobile"
	// there for why Obsidian's own backdrop can't be relied on).
	//
	// The count is trustworthy here: `Modal.open()` appends `containerEl` to the
	// document BEFORE it calls `onOpen()`, and this runs from `onOpen()`, so this
	// window is already in the tally and `> 1` means one was open underneath it.
	// `toggleClass` rather than `addClass` because Obsidian reuses `containerEl`
	// across open/close — a window reopened over nothing must lose the class.
	containerEl.addClass("cs-modal-container");
	containerEl.toggleClass(
		"cs-modal-stacked",
		containerEl.ownerDocument.querySelectorAll(".modal-container").length > 1,
	);

	if (!options.footer) return null;
	return modalEl.createDiv({ cls: "cs-modal-footer" });
}

/**
 * Undo {@link applyModalChrome}. Worth calling from `onClose()` on a modal whose
 * footer holds listeners, since the bar is a sibling of `.modal-content` and so
 * survives the usual `contentEl.empty()`.
 */
export function removeModalChrome(modal: Modal): void {
	const { modalEl, containerEl } = modal;
	detachFooter(modalEl);
	modalEl.removeClasses(["cs-modal", "cs-modal-wide", "cs-modal-no-title"]);
	containerEl.removeClasses(["cs-modal-container", "cs-modal-stacked"]);
}

function detachFooter(modalEl: HTMLElement): void {
	modalEl.findAll(":scope > .cs-modal-footer").forEach((el) => el.detach());
}
