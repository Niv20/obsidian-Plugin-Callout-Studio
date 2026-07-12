/**
 * ui/ColorSwatchInput.ts — Native color input styled as a swatch box.
 *
 * The visible swatch is a wrapper whose background-color we fully control (so
 * it renders identically on desktop, iPhone and tablets); the native
 * <input type="color"> sits invisibly on top to keep the OS color-picker
 * behaviour. Each swatch also carries a hidden low-contrast warning badge
 * toggled via setContrastWarning. Shared by the callout editor's color grid
 * and the custom palette editor modal.
 */
import { setIcon } from "obsidian";
import { t } from "../i18n";

export interface ColorSwatchInput {
	/** The native color input (read/write its `.value` to sync the swatch). */
	input: HTMLInputElement;
	/** Grid-cell wrapper containing the swatch and the warning badge. */
	cell: HTMLElement;
	/** Warning badge, hidden until shown via setContrastWarning. */
	warnEl: HTMLElement;
}

export function createColorSwatchInput(
	parent: HTMLElement,
	value: string,
	onPick: (next: string) => void,
): ColorSwatchInput {
	const cell = parent.createDiv({ cls: "cs-color-cell" });
	const wrap = cell.createEl("label", {
		cls: "callout-studio-color-input-wrap",
	});
	wrap.style.backgroundColor = value;
	const input = wrap.createEl("input", {
		type: "color",
		value,
		cls: "callout-studio-color-input",
	});
	input.addEventListener("input", () => {
		wrap.style.backgroundColor = input.value;
		onPick(input.value);
	});
	const warnEl = cell.createSpan({ cls: "cs-contrast-warning" });
	setIcon(warnEl, "triangle-alert");
	return { input, cell, warnEl };
}

/** Shows or hides a swatch's low-contrast warning badge (never blocks saving). */
export function setContrastWarning(
	warnEl: HTMLElement,
	visible: boolean,
): void {
	warnEl.toggleClass("is-visible", visible);
	if (visible) {
		const label = t("editor.contrastWarning");
		warnEl.setAttribute("aria-label", label);
		warnEl.setAttribute("title", label);
	} else {
		warnEl.removeAttribute("aria-label");
		warnEl.removeAttribute("title");
	}
}
