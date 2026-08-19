/**
 * settings/quickInsertToolbar.ts — the quick-insert window's search and filter.
 *
 * The two controls above the list, split out for the same reason the row is:
 * they own no state, only the widgets that report it. What a query means and
 * which source is stored stay with the window.
 */
import { t } from "../i18n";
import {
	isCalloutSourceFilter,
	type CalloutSourceFilter,
} from "../utils/calloutSearch";

/** The three source choices, in the order they appear in the dropdown. */
const SOURCE_OPTIONS: readonly { value: CalloutSourceFilter; key: string }[] = [
	{ value: "all", key: "quickInsert.sourceAll" },
	{ value: "builtin", key: "quickInsert.sourceBuiltIn" },
	{ value: "user", key: "quickInsert.sourceUser" },
];

export interface QuickInsertToolbarHandlers {
	/** The filter to show as selected — the one restored from settings. */
	filter: CalloutSourceFilter;
	onQuery: (query: string) => void;
	onFilter: (filter: CalloutSourceFilter) => void;
	/** Arrow and Enter keys, handled by the window's list. */
	onKey: (ev: KeyboardEvent) => void;
}

/** Build the toolbar into `parent` and return its search field to focus. */
export function buildQuickInsertToolbar(
	parent: HTMLElement,
	handlers: QuickInsertToolbarHandlers,
): HTMLInputElement {
	const toolbar = parent.createDiv({ cls: "cs-quick-insert-toolbar" });

	// Always empty on open: the filter is a standing preference, a query is
	// about one insertion.
	const search = toolbar.createEl("input", {
		type: "text",
		cls: "cs-quick-insert-search",
		placeholder: t("quickInsert.searchPlaceholder"),
	});
	search.addEventListener("input", () => handlers.onQuery(search.value));
	// Bound to the field rather than the window so typing and arrowing are the
	// same gesture. Left/Right are deliberately untouched — they move the caret,
	// and stealing them would break the search box itself.
	search.addEventListener("keydown", (ev) => handlers.onKey(ev));

	const select = toolbar.createEl("select", {
		cls: "cs-quick-insert-filter dropdown",
		attr: { "aria-label": t("quickInsert.sourceAria") },
	});
	for (const option of SOURCE_OPTIONS) {
		select.createEl("option", { value: option.value, text: t(option.key) });
	}
	select.value = handlers.filter;
	select.addEventListener("change", () => {
		handlers.onFilter(
			isCalloutSourceFilter(select.value) ? select.value : "all",
		);
	});
	return search;
}
