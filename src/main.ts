import { Plugin } from "obsidian";
import type { CalloutIcon, PluginData, PluginSettings } from "./types";
import { CalloutRegistry } from "./manager/CalloutRegistry";
import { CSSInjector } from "./manager/CSSInjector";
import { CalloutStudioSettingsTab } from "./settings/SettingsTab";
import { CalloutEditor } from "./settings/CalloutEditor";
import { CalloutAutoComplete } from "./editor/AutoComplete";
import {
	unwrapCalloutAtSelection,
	wrapSelectionInCallout,
} from "./editor/CalloutBlockTools";
import { registerContextMenu } from "./editor/ContextMenu";
import { TransparentPopup } from "./editor/TransparentPopup";
import { CalloutStudioAPI } from "./api/PluginAPI";
import { downloadMaterialSvg } from "./utils/iconLoader";
import { setLocale, t } from "./i18n";

export default class CalloutStudioPlugin extends Plugin {
	registry!: CalloutRegistry;
	cssInjector!: CSSInjector;
	popup!: TransparentPopup;
	api!: CalloutStudioAPI;

	get settings(): PluginSettings {
		return this.registry.settings;
	}

	async onload() {
		// Initialize registry and load persisted data
		this.registry = new CalloutRegistry();
		const savedData = (await this.loadData()) as Partial<PluginData> | null;
		this.registry.load(savedData);

		// Set UI locale from saved preference
		setLocale(this.settings.language);

		// Initialize CSS injector
		this.cssInjector = new CSSInjector(this.app, this.registry);
		this.cssInjector.initialize();

		// Re-inject CSS when registry changes
		this.registry.onChange(() => {
			this.cssInjector.scheduleInject();
			void this.saveSettings();
		});

		// Re-inject on theme change
		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				this.cssInjector.inject();
			}),
		);

		// Settings tab
		this.addSettingTab(new CalloutStudioSettingsTab(this.app, this));

		// Commands
		this.addCommand({
			id: "open-settings",
			name: t("cmd.openSettings"),
			callback: () => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				(this.app as any).setting.open();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				(this.app as any).setting.openTabById(this.manifest.id);
			},
		});

		this.addCommand({
			id: "create-callout",
			name: t("cmd.createCallout"),
			callback: () => {
				void new CalloutEditor(this).open();
			},
		});

		this.addCommand({
			id: "callout-wrap",
			name: t("cmd.calloutWrap"),
			editorCallback: (editor) => {
				wrapSelectionInCallout(editor);
			},
		});

		this.addCommand({
			id: "callout-wrap-selection",
			name: t("cmd.calloutWrapSelection"),
			editorCheckCallback: (checking, editor) => {
				if (!checking) {
					if (editor.somethingSelected()) {
						wrapSelectionInCallout(editor, {
							requireSelection: true,
						});
					} else {
						editor.replaceSelection(">");
					}
				}
				return true;
			},
			// eslint-disable-next-line obsidianmd/commands/no-default-hotkeys
			hotkeys: [{ modifiers: ["Shift"], key: ">" }],
		});

		this.addCommand({
			id: "callout-unwrap",
			name: t("cmd.calloutUnwrap"),
			editorCallback: (editor) => {
				unwrapCalloutAtSelection(editor);
			},
		});

		this.addCommand({
			id: "callout-unwrap-selection",
			name: t("cmd.calloutUnwrapSelection"),
			editorCheckCallback: (checking, editor) => {
				if (!checking) {
					if (editor.somethingSelected()) {
						unwrapCalloutAtSelection(editor);
					} else {
						editor.replaceSelection("<");
					}
				}
				return true;
			},
			// eslint-disable-next-line obsidianmd/commands/no-default-hotkeys
			hotkeys: [{ modifiers: ["Shift"], key: "<" }],
		});

		// Editor autocomplete on [! trigger
		this.registerEditorSuggest(new CalloutAutoComplete(this));

		// Right-click context menu for callout blocks
		registerContextMenu(this);

		// Transparent floating popup
		this.popup = new TransparentPopup(this);

		// Public API for other plugins
		this.api = new CalloutStudioAPI(this);

		// Download missing Material SVGs in background
		void this.ensureMaterialSvgs();
	}

	onunload() {
		this.cssInjector.destroy();
		this.popup.destroy();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.registry.toSaveData());
	}

	/**
	 * Downloads an individual Material SVG for a callout icon and caches it.
	 * Also cleans up SVGs no longer used by any callout.
	 */
	async cacheMaterialSvg(icon: CalloutIcon): Promise<void> {
		if (icon.type !== "material") return;
		const style = icon.style ?? "outlined";
		const weight = icon.weight ?? 400;
		// Skip if already cached
		if (this.registry.findMaterialSvg(icon.value, style, weight)) return;
		try {
			const svg = await downloadMaterialSvg(icon.value, style, weight);
			this.registry.addMaterialSvg({
				name: icon.value,
				style,
				weight,
				svg,
			});
			this.registry.cleanupUnusedMaterialSvgs();
			this.cssInjector.inject();
			await this.saveSettings();
		} catch (err) {
			console.warn(
				"Callout Studio: failed to download Material SVG",
				err,
			);
		}
	}

	/**
	 * Ensures all callouts using Material icons have a cached SVG.
	 * Runs in background on plugin load.
	 */
	private async ensureMaterialSvgs(): Promise<void> {
		const callouts = this.registry.getAll();
		const missing = callouts.filter((def) => {
			if (def.icon.type !== "material") return false;
			return !this.registry.findMaterialSvg(
				def.icon.value,
				def.icon.style ?? "outlined",
				def.icon.weight ?? 400,
			);
		});

		if (missing.length === 0) return;

		let downloaded = 0;
		for (const def of missing) {
			try {
				const svg = await downloadMaterialSvg(
					def.icon.value,
					def.icon.style ?? "outlined",
					def.icon.weight ?? 400,
				);
				this.registry.addMaterialSvg({
					name: def.icon.value,
					style: def.icon.style ?? "outlined",
					weight: def.icon.weight ?? 400,
					svg,
				});
				downloaded++;
			} catch {
				// Silently skip failures — will retry next load
			}
		}

		if (downloaded > 0) {
			this.cssInjector.inject();
			await this.saveSettings();
		}
	}
}
