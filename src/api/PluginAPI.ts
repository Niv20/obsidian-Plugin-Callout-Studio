import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition, CalloutIcon } from "../types";
import { CalloutEditor } from "../settings/CalloutEditor";
import { IconPicker } from "../settings/IconPicker";

/**
 * Public API exposed at `app.plugins.plugins['callout-studio'].api`
 * for use by other Obsidian plugins.
 */
export class CalloutStudioAPI {
	private plugin: CalloutStudioPlugin;

	constructor(plugin: CalloutStudioPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Returns all registered callout definitions.
	 */
	getAllCallouts(): CalloutDefinition[] {
		return this.plugin.registry.getAll();
	}

	/**
	 * Returns a single callout by its ID, or undefined.
	 */
	getCallout(id: string): CalloutDefinition | undefined {
		return this.plugin.registry.get(id);
	}

	/**
	 * Returns only user-defined (non-built-in) callouts.
	 */
	getUserCallouts(): CalloutDefinition[] {
		return this.plugin.registry.getUserDefined();
	}

	/**
	 * Registers a new callout definition from an external plugin.
	 * Returns true if successfully added, false if the ID already exists.
	 */
	registerCallout(def: CalloutDefinition): boolean {
		return this.plugin.registry.add({
			...def,
			source: "plugin",
		});
	}

	/**
	 * Unregisters a previously registered callout by ID.
	 * Only callouts with source="plugin" can be unregistered.
	 * Returns true if removed, false otherwise.
	 */
	unregisterCallout(id: string): boolean {
		const existing = this.plugin.registry.get(id);
		if (!existing || existing.source !== "plugin") return false;
		return this.plugin.registry.remove(id);
	}

	/**
	 * Opens the icon picker modal and returns the selected icon, or null.
	 */
	async openIconPicker(
		currentIcon?: CalloutIcon,
	): Promise<CalloutIcon | null> {
		const picker = new IconPicker(this.plugin, currentIcon);
		return picker.open();
	}

	/**
	 * Opens the callout editor modal and returns the resulting definition, or null.
	 */
	async openCalloutEditor(
		existing?: CalloutDefinition,
	): Promise<CalloutDefinition | null> {
		const editor = new CalloutEditor(this.plugin, existing);
		return editor.open();
	}

	/**
	 * Subscribes to callout registry changes.
	 * Returns an unsubscribe function.
	 */
	onCalloutChange(callback: () => void): () => void {
		this.plugin.registry.onChange(callback);
		return () => this.plugin.registry.offChange(callback);
	}
}
