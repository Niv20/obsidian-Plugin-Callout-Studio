import { Plugin } from 'obsidian';
import type { PluginData, PluginSettings } from './types';
import { CalloutRegistry } from './manager/CalloutRegistry';
import { CSSInjector } from './manager/CSSInjector';
import { CalloutStudioSettingsTab } from './settings/SettingsTab';
import { CalloutEditor } from './settings/CalloutEditor';
import { CalloutAutoComplete } from './editor/AutoComplete';
import { registerContextMenu } from './editor/ContextMenu';
import { TransparentPopup } from './editor/TransparentPopup';

export default class CalloutStudioPlugin extends Plugin {
	registry!: CalloutRegistry;
	cssInjector!: CSSInjector;
	popup!: TransparentPopup;

	get settings(): PluginSettings {
		return this.registry.settings;
	}

	async onload() {
		// Initialize registry and load persisted data
		this.registry = new CalloutRegistry();
		const savedData = await this.loadData() as Partial<PluginData> | null;
		this.registry.load(savedData);

		// Initialize CSS injector
		this.cssInjector = new CSSInjector(this.app, this.registry);
		this.cssInjector.initialize();

		// Re-inject CSS when registry changes
		this.registry.onChange(() => {
			this.cssInjector.scheduleInject();
			this.saveSettings();
		});

		// Re-inject on theme change
		this.registerEvent(
			this.app.workspace.on('css-change', () => {
				this.cssInjector.inject();
			})
		);

		// Settings tab
		this.addSettingTab(new CalloutStudioSettingsTab(this.app, this));

		// Commands
		this.addCommand({
			id: 'open-settings',
			name: 'Open settings',
			callback: () => {
				(this.app as any).setting.open();
				(this.app as any).setting.openTabById(this.manifest.id);
			},
		});

		this.addCommand({
			id: 'create-callout',
			name: 'Create new callout type',
			callback: () => {
				new CalloutEditor(this).open();
			},
		});

		// Editor autocomplete on [! trigger
		this.registerEditorSuggest(new CalloutAutoComplete(this));

		// Right-click context menu for callout blocks
		registerContextMenu(this);

		// Transparent floating popup
		this.popup = new TransparentPopup(this);
	}

	onunload() {
		this.cssInjector.destroy();
		this.popup.destroy();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.registry.toSaveData());
	}
}
