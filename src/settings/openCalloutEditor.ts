/**
 * settings/openCalloutEditor.ts — the one way to open the editor for a callout
 * that already exists.
 *
 * A callout marked {@link CalloutDefinition.externalStyle} has nothing to edit:
 * every control in `CalloutEditor` writes a value the plugin has stopped
 * emitting, so the form would quietly collect settings that never reach the
 * screen. {@link ExternalStyleModal} explains that and offers the way back.
 *
 * This lives in its own module so the four callers that open the editor with an
 * existing definition — the settings rows, the callout context menu, and the
 * public API — route through one decision instead of four copies of it.
 * Create-new flows pass no definition and call `CalloutEditor` directly.
 */
import { CalloutEditor } from "./CalloutEditor";
import { ExternalStyleModal } from "./ExternalStyleModal";
import type { ExternalStylePlugin } from "./ExternalStyleModal";
import type { CalloutDefinition } from "../types";

/**
 * Open the right window for `def` and resolve with the saved definition, or
 * `null` when nothing was saved.
 *
 * Taking control back from the theme flows straight on into the real editor —
 * the button that does it is the one the user pressed to edit in the first
 * place, so stopping to make them click the pencil again would be a step for
 * its own sake. The definition is re-read from the registry first, because
 * `setExternalStyle` replaces the stored object rather than mutating it.
 */
export async function openCalloutEditorFor(
	plugin: ExternalStylePlugin,
	def: CalloutDefinition,
): Promise<CalloutDefinition | null> {
	if (def.externalStyle === true) {
		const resumed = await new ExternalStyleModal(plugin, def).openAndWait();
		if (!resumed) return null;
		const current = plugin.registry.get(def.id) ?? def;
		return new CalloutEditor(plugin, current).openAndWait();
	}
	return new CalloutEditor(plugin, def).openAndWait();
}
