/**
 * settings/editor/CalloutEditorIconRenderer.ts — Icon preview inside CalloutEditor.
 *
 * Renders the currently selected icon into a container element, including the
 * loading and failure states for artwork that has not been downloaded yet.
 * Called by CalloutEditor whenever the selected icon changes.
 */
import type { CalloutIcon } from "../../types";
import { renderIconInto } from "../../icons/renderIcon";
import { createStatusIconResolver } from "../../icons/resolver";
import type { CalloutEditorPlugin } from "./types";

export function renderCalloutEditorIconPreview(
	plugin: CalloutEditorPlugin,
	icon: CalloutIcon,
	container: HTMLElement,
): void {
	container.empty();
	renderIconInto(container, icon, createStatusIconResolver(plugin), {
		role: "regular",
		fill: "currentColor",
		// The editor is where the user just picked the icon, so a pending or
		// failed download has to be visible rather than masked by a stand-in.
		missing: { kind: "status" },
		errorText: "?",
	});
}
