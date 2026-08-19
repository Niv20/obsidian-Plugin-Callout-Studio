/**
 * settings/quickInsertRow.ts — one row of the quick-insert window.
 *
 * Split from `QuickInsertModal` on the same line `CalloutRowRenderer` is split
 * from `CalloutListsSection`: the window owns the state — what is searched, what
 * is filtered, what the arrow keys are pointing at — and this owns what a single
 * callout looks like while that is going on. Neither needs to know how the other
 * works, and the row is a pure function of the definition plus two handlers.
 *
 * The classes are the settings list's own (`callout-studio-row…`), not a second
 * visual language: this is the same object in a different window, and the rules
 * are already written to survive inside a modal on mobile dark.
 */
import { setIcon } from "obsidian";
import { getLocale, t } from "../i18n";
import { renderIconInto, renderNoIcon } from "../icons/renderIcon";
import { createIconResolver } from "../icons/resolver";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import type { CalloutDefinition } from "../types";
import { getSortedCalloutIds } from "../utils/sorting";

export interface QuickInsertRowHandlers {
	onEdit: (def: CalloutDefinition) => void;
	onInsert: (def: CalloutDefinition) => void;
	onHover: (el: HTMLElement) => void;
	/** Whether an editor is available to insert into, for the button's state. */
	canInsert: boolean;
}

/** Draw `def` as a row inside `listEl` and return the row element. */
export function renderQuickInsertRow(
	listEl: HTMLElement,
	def: CalloutDefinition,
	registry: CalloutRegistry,
	handlers: QuickInsertRowHandlers,
): HTMLElement {
	const row = listEl.createDiv({ cls: "callout-studio-row" });
	const name = def.displayName;

	const iconEl = row.createDiv({ cls: "callout-studio-row-icon" });
	if (def.hideIcon === true) {
		// A blank slot would read as a stalled download; the dashed ring says
		// "no icon, on purpose".
		renderNoIcon(iconEl);
	} else {
		renderIconInto(iconEl, def.icon, createIconResolver(registry), {
			role: "regular",
			fill: "currentColor",
			missing: { kind: "placeholder", lucideId: "pencil" },
			errorText: "?",
		});
	}

	const infoEl = row.createDiv({ cls: "callout-studio-row-info" });
	const nameLine = infoEl.createDiv({ cls: "callout-studio-row-name-line" });
	nameLine.createSpan({
		cls: "callout-studio-row-name",
		text: name,
		attr: { title: name },
	});

	// Every id, not just the primary one: a search that matched an alias has to
	// show what it matched, and the chips double as the syntax to type by hand.
	const syntaxLine = infoEl.createDiv({ cls: "callout-studio-row-syntax-line" });
	for (const id of getSortedCalloutIds(def, getLocale())) {
		syntaxLine.createEl("code", {
			cls: "callout-studio-row-syntax",
			text: `[!${id}]`,
		});
	}

	const buttonsEl = row.createDiv({ cls: "callout-studio-row-buttons" });

	const editBtn = buttonsEl.createEl("button", {
		attr: { "aria-label": t("quickInsert.editAria", { name }) },
	});
	setIcon(editBtn, "pencil");
	editBtn.addEventListener("click", () => handlers.onEdit(def));

	const insertBtn = buttonsEl.createEl("button", {
		attr: { "aria-label": t("quickInsert.insertAria", { name }) },
	});
	setIcon(insertBtn, "between-horizontal-start");
	// Dimmed but still clickable, the same bargain the editor's Save button
	// strikes: a disabled button cannot say why it is disabled.
	insertBtn.toggleClass("cs-btn-disabled", !handlers.canInsert);
	insertBtn.setAttribute("aria-disabled", String(!handlers.canInsert));
	insertBtn.addEventListener("click", () => handlers.onInsert(def));

	// The pointer and the keyboard share one highlight rather than showing two
	// at once.
	row.addEventListener("mouseenter", () => handlers.onHover(row));
	return row;
}
