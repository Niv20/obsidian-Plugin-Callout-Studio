/**
 * settings/SettingsTab.ts — Main plugin settings tab (Obsidian Settings pane).
 *
 * Composes all settings sections into a single scrollable tab:
 * callout lists (user + built-in), callout type cards (with the per-role
 * global style popups), editor features, fallback, hotkeys, data management
 * (import/export/reset), and the footer. Delegates each section to its own
 * module under sections/.
 * Holds a CalloutListsController for efficient list refresh without full
 * re-renders.
 */
import { MarkdownView, PluginSettingTab } from "obsidian";
import type { App, EventRef } from "obsidian";
import { CalloutEditor } from "./CalloutEditor";
import { scanStringForUnknownCallouts } from "../utils/vaultCalloutScanner";
import { renderHotkeySection } from "./sections/HotkeySection";
import { renderFooterSection } from "./sections/FooterSection";
import {
	renderImportExportSection,
	renderResetSection,
} from "./sections/DataManagementSection";
import {
	renderAutocompleteSettingsSection,
	renderContextMenuSettingsSection,
} from "./sections/EditorFeaturesSection";
import { renderFallbackSection } from "./sections/FallbackSection";
import { renderLanguageSection } from "./sections/LanguageSection";
import { renderCustomPalettesSection } from "./sections/CustomPalettesSection";
import { renderGlobalSettingsSection } from "./sections/GlobalSettingsSection";
import {
	createCalloutListsController,
	type CalloutListsController,
} from "./sections/CalloutListsSection";
import { renderCalloutRow as renderCalloutRowSection } from "./sections/CalloutRowRenderer";
import { openBuiltInRowMenu, openRowMenu } from "./sections/CalloutRowActions";
import type {
	SettingsSectionContext,
	SettingsTabPlugin,
} from "./sections/types";

const scanUnknownCalloutsInBuffer = (
	content: string,
	knownIds: Set<string>,
): string[] => scanStringForUnknownCallouts(content, knownIds);

export class CalloutStudioSettingsTab extends PluginSettingTab {
	plugin: SettingsTabPlugin;
	private registrySubscription: (() => void) | null = null;
	private materialSvgUnsubscribe: (() => void) | null = null;
	private cssChangeRef: EventRef | null = null;
	private refreshTimer: number | null = null;
	private calloutLists: CalloutListsController | null = null;
	private sectionDisposers: (() => void)[] = [];

	constructor(app: App, plugin: SettingsTabPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		// Tear down any resources from a previous render before rebuilding.
		this.runSectionDisposers();
		containerEl.empty();
		containerEl.addClass("callout-studio-settings");

		this.scanOpenEditorsForUnknownCallouts();
		this.plugin.schedulePruneUnusedFallbacks(0);

		if (!this.registrySubscription) {
			const sub = () => this.scheduleListRefresh();
			this.plugin.registry.onChange(sub);
			this.registrySubscription = sub;
		}

		if (!this.materialSvgUnsubscribe) {
			this.materialSvgUnsubscribe = this.plugin.onMaterialSvgChange(() =>
				this.scheduleListRefresh(),
			);
		}

		// Row swatches show the CURRENT theme mode's accent/background, so a
		// live theme flip must re-render them. Refresh only (never a full
		// display()): CSSInjector fires "css-change" after every inject.
		if (!this.cssChangeRef) {
			this.cssChangeRef = this.app.workspace.on("css-change", () =>
				this.scheduleListRefresh(),
			);
		}

		const sectionCtx = this.getSectionContext();
		this.calloutLists = createCalloutListsController(sectionCtx, {
			onAddNewCallout: async () => {
				const editor = new CalloutEditor(this.plugin);
				await editor.openAndWait();
				this.display();
			},
			renderRow: (rowContainerEl, def, isBuiltIn) => {
				renderCalloutRowSection(
					sectionCtx,
					rowContainerEl,
					def,
					isBuiltIn,
					{
						onEdit: (targetDef, targetIsBuiltIn) => {
							void this.handleRowEdit(
								targetDef.id,
								targetIsBuiltIn,
							);
						},
						onOpenBuiltInMenu: (event, targetDef) => {
							void openBuiltInRowMenu(
								sectionCtx,
								event,
								targetDef,
							);
						},
						onOpenUserMenu: (event, targetDef) => {
							void openRowMenu(sectionCtx, event, targetDef);
						},
					},
				);
			},
		});
		this.calloutLists.render(containerEl);

		renderFallbackSection(sectionCtx, containerEl);
		renderCustomPalettesSection(sectionCtx, containerEl);
		renderGlobalSettingsSection(sectionCtx, containerEl);
		renderAutocompleteSettingsSection(sectionCtx, containerEl);
		renderContextMenuSettingsSection(sectionCtx, containerEl);
		renderHotkeySection(sectionCtx, containerEl);
		renderImportExportSection(sectionCtx, containerEl);
		renderLanguageSection(sectionCtx, containerEl);
		renderResetSection(sectionCtx, containerEl);
		renderFooterSection(sectionCtx, containerEl);
	}

	private getSectionContext(): SettingsSectionContext {
		return {
			app: this.app,
			plugin: this.plugin,
			display: () => this.display(),
			registerDisposer: (dispose) => this.sectionDisposers.push(dispose),
		};
	}

	private runSectionDisposers(): void {
		for (const dispose of this.sectionDisposers) {
			try {
				dispose();
			} catch {
				/* ignore disposer failures */
			}
		}
		this.sectionDisposers = [];
	}

	hide(): void {
		this.runSectionDisposers();
		if (this.registrySubscription) {
			this.plugin.registry.offChange(this.registrySubscription);
			this.registrySubscription = null;
		}
		if (this.materialSvgUnsubscribe) {
			this.materialSvgUnsubscribe();
			this.materialSvgUnsubscribe = null;
		}
		if (this.cssChangeRef) {
			this.app.workspace.offref(this.cssChangeRef);
			this.cssChangeRef = null;
		}
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}
		this.calloutLists = null;
		super.hide();
	}

	private async handleRowEdit(id: string, isBuiltIn: boolean): Promise<void> {
		const def = this.plugin.registry.get(id);
		if (!def) return;

		if (isBuiltIn) {
			const editorModal = new CalloutEditor(this.plugin, def);
			const result = await editorModal.openAndWait();
			if (result) {
				this.plugin.registry.update(def.id, {
					displayName: result.displayName,
					icon: result.icon,
					colorLight: result.colorLight,
					colorDark: result.colorDark,
					bgColorLight: result.bgColorLight,
					bgColorDark: result.bgColorDark,
					textColorLight: result.textColorLight,
					textColorDark: result.textColorDark,
					foldable: result.foldable,
					defaultFolded: result.defaultFolded,
					iconOffsetX: result.iconOffsetX,
					iconOffsetY: result.iconOffsetY,
					iconSize: result.iconSize,
					aliases: result.aliases,
				});
			}
		} else {
			const editorModal = new CalloutEditor(this.plugin, def);
			await editorModal.openAndWait();
		}
		this.display();
	}

	private refreshLists(): void {
		this.calloutLists?.refresh();
	}

	/** Debounced list refresh shared by all change subscriptions. */
	private scheduleListRefresh(): void {
		if (!this.containerEl.isConnected) return;
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
		}
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			if (this.containerEl.isConnected) this.refreshLists();
		}, 60);
	}

	private scanOpenEditorsForUnknownCallouts(): void {
		const known = new Set<string>();
		for (const def of this.plugin.registry.getAll()) {
			known.add(def.id.toLowerCase());
			for (const a of def.aliases ?? []) known.add(a.toLowerCase());
		}
		const seen = new Set<string>();
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) continue;
			const content = view.editor.getValue();
			if (!content) continue;
			for (const id of scanUnknownCalloutsInBuffer(content, known)) {
				seen.add(id);
			}
		}
		if (seen.size === 0) return;
		const added = this.plugin.addUnknownCalloutsAsFallback(
			Array.from(seen),
		);
		if (added > 0) {
			void this.plugin.saveSettings();
			this.plugin.refreshCallouts();
		}
	}
}
