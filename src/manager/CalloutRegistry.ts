import type { CalloutDefinition, CustomSvgIcon, MaterialIconsCacheData, PluginData, PluginSettings } from "../types";
import { DEFAULT_CALLOUTS, DEFAULT_SETTINGS } from "../constants";

const CURRENT_DATA_VERSION = 1;

export type RegistryChangeCallback = () => void;

export class CalloutRegistry {
	private callouts: Map<string, CalloutDefinition> = new Map();
	private builtInDefaults: Map<string, CalloutDefinition> = new Map();
	private changeCallbacks: RegistryChangeCallback[] = [];
	settings: PluginSettings;
	materialIconsCache?: MaterialIconsCacheData;
	customSvgIcons: CustomSvgIcon[] = [];

	constructor() {
		this.settings = structuredClone(DEFAULT_SETTINGS);
		for (const def of DEFAULT_CALLOUTS) {
			this.builtInDefaults.set(def.id, structuredClone(def));
		}
	}

	load(data: Partial<PluginData> | null): void {
		this.callouts.clear();

		// Always start with built-in defaults
		for (const def of DEFAULT_CALLOUTS) {
			this.callouts.set(def.id, structuredClone(def));
		}

		if (!data) return;

		// Merge saved callouts (user overrides and custom callouts)
		if (data.callouts) {
			for (const saved of data.callouts) {
				if (this.callouts.has(saved.id) && saved.builtIn) {
					// Merge overrides onto built-in
					const existing = this.callouts.get(saved.id)!;
					this.callouts.set(saved.id, { ...existing, ...saved, builtIn: true, source: "builtin" });
				} else if (!saved.builtIn) {
					this.callouts.set(saved.id, saved);
				}
			}
		}

		// Merge settings
		if (data.settings) {
			this.settings = {
				popup: { ...DEFAULT_SETTINGS.popup, ...data.settings.popup },
				autocomplete: { ...DEFAULT_SETTINGS.autocomplete, ...data.settings.autocomplete },
				iconSources: { ...DEFAULT_SETTINGS.iconSources, ...data.settings.iconSources },
				colorMode: { ...DEFAULT_SETTINGS.colorMode, ...data.settings.colorMode },
			};
		}

		// Restore icon data
		if (data.materialIconsCache) {
			this.materialIconsCache = data.materialIconsCache;
		}
		if (data.customSvgIcons) {
			this.customSvgIcons = data.customSvgIcons;
		}
	}

	toSaveData(): PluginData {
		const calloutsToSave: CalloutDefinition[] = [];

		for (const [id, def] of this.callouts) {
			if (def.builtIn) {
				// Only save built-in if it was modified from default
				const original = this.builtInDefaults.get(id);
				if (original && this.isModified(def, original)) {
					calloutsToSave.push(def);
				}
			} else {
				calloutsToSave.push(def);
			}
		}

		return {
			version: CURRENT_DATA_VERSION,
			callouts: calloutsToSave,
			settings: this.settings,
			materialIconsCache: this.materialIconsCache,
			customSvgIcons: this.customSvgIcons.length > 0 ? this.customSvgIcons : undefined,
		};
	}

	private isModified(current: CalloutDefinition, original: CalloutDefinition): boolean {
		return (
			current.displayName !== original.displayName ||
			current.colorLight !== original.colorLight ||
			current.colorDark !== original.colorDark ||
			current.icon.type !== original.icon.type ||
			current.icon.value !== original.icon.value ||
			current.icon.style !== original.icon.style ||
			current.foldable !== original.foldable ||
			current.defaultFolded !== original.defaultFolded
		);
	}

	add(def: CalloutDefinition): boolean {
		if (this.callouts.has(def.id)) {
			return false;
		}
		this.callouts.set(def.id, def);
		this.notifyChange();
		return true;
	}

	update(id: string, partial: Partial<CalloutDefinition>): boolean {
		const existing = this.callouts.get(id);
		if (!existing) return false;

		// If the id is being changed, remove old and re-add
		if (partial.id && partial.id !== id) {
			if (this.callouts.has(partial.id)) return false;
			this.callouts.delete(id);
			this.callouts.set(partial.id, { ...existing, ...partial });
		} else {
			this.callouts.set(id, { ...existing, ...partial });
		}

		this.notifyChange();
		return true;
	}

	remove(id: string): boolean {
		const def = this.callouts.get(id);
		if (!def || def.builtIn) return false;
		this.callouts.delete(id);
		this.notifyChange();
		return true;
	}

	resetBuiltIn(id: string): boolean {
		const original = this.builtInDefaults.get(id);
		if (!original) return false;
		this.callouts.set(id, structuredClone(original));
		this.notifyChange();
		return true;
	}

	get(id: string): CalloutDefinition | undefined {
		return this.callouts.get(id);
	}

	getAll(): CalloutDefinition[] {
		return Array.from(this.callouts.values());
	}

	getUserDefined(): CalloutDefinition[] {
		return this.getAll().filter((d) => !d.builtIn);
	}

	getBuiltIn(): CalloutDefinition[] {
		return this.getAll().filter((d) => d.builtIn);
	}

	has(id: string): boolean {
		return this.callouts.has(id);
	}

	importFromCSS(cssText: string): CalloutDefinition[] {
		const imported: CalloutDefinition[] = [];
		// Match patterns like: .callout[data-callout="name"] { --callout-color: R, G, B; }
		const regex = /\.callout\[data-callout=["']([^"']+)["']\]\s*\{[^}]*--callout-color:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(cssText)) !== null) {
			const id = match[1];
			const r = match[2];
			const g = match[3];
			const b = match[4];
			if (!id || !r || !g || !b) continue;
			if (this.callouts.has(id)) continue;

			const rN = parseInt(r, 10);
			const gN = parseInt(g, 10);
			const bN = parseInt(b, 10);

			const hex = "#" + [rN, gN, bN].map((c) => c.toString(16).padStart(2, "0")).join("");
			const def: CalloutDefinition = {
				id,
				displayName: id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
				icon: { type: "lucide", value: "pencil" },
				colorLight: hex,
				colorDark: hex,
				foldable: true,
				defaultFolded: false,
				builtIn: false,
				source: "theme",
			};

			this.callouts.set(id, def);
			imported.push(def);
		}

		if (imported.length > 0) {
			this.notifyChange();
		}
		return imported;
	}

	exportToJSON(): string {
		return JSON.stringify(this.getUserDefined(), null, 2);
	}

	onChange(callback: RegistryChangeCallback): void {
		this.changeCallbacks.push(callback);
	}

	offChange(callback: RegistryChangeCallback): void {
		const idx = this.changeCallbacks.indexOf(callback);
		if (idx >= 0) {
			this.changeCallbacks.splice(idx, 1);
		}
	}

	private notifyChange(): void {
		for (const cb of this.changeCallbacks) {
			cb();
		}
	}
}
