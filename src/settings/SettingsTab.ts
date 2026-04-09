import { Notice, PluginSettingTab, Setting, setIcon } from "obsidian";
import type { App } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition } from "../types";
import { CalloutEditor } from "./CalloutEditor";

export class CalloutStudioSettingsTab extends PluginSettingTab {
	plugin: CalloutStudioPlugin;
	private searchQuery = "";

	constructor(app: App, plugin: CalloutStudioPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("callout-studio-settings");

		this.renderCalloutTypesSection(containerEl);
		this.renderBuiltInCalloutsSection(containerEl);
		this.renderPopupSettings(containerEl);
		this.renderAutocompleteSettings(containerEl);
		this.renderIconSourceSettings(containerEl);
		this.renderColorModeSettings(containerEl);
	}

	// ─── Section A: My Callout Types ─────────────────────────

	private renderCalloutTypesSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("My callout types").setHeading();

		// Action buttons row
		const actionsEl = containerEl.createDiv({
			cls: "callout-studio-actions",
		});

		const addBtn = actionsEl.createEl("button", {
			text: "+ add new callout",
			cls: "mod-cta",
		});
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		addBtn.addEventListener("click", async () => {
			const editor = new CalloutEditor(this.plugin);
			await editor.open();
			this.display();
		});

		const importBtn = actionsEl.createEl("button", {
			text: "Import from CSS snippet",
		});
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		importBtn.addEventListener("click", async () => {
			await this.importFromSnippets();
			this.display();
		});

		const importJsonBtn = actionsEl.createEl("button", {
			text: "Import from JSON",
		});
		importJsonBtn.addEventListener("click", () => {
			this.importFromJSON();
		});

		const exportBtn = actionsEl.createEl("button", { text: "Export all" });
		exportBtn.addEventListener("click", () => {
			this.exportCallouts();
		});

		// Search
		new Setting(containerEl)
			.setName("Search callouts")
			.addSearch((search) => {
				search
					.setPlaceholder("Filter by name or ID...")
					.setValue(this.searchQuery)
					.onChange((value) => {
						this.searchQuery = value;
						this.display();
					});
			});

		// User-defined callout list
		const userCallouts = this.plugin.registry.getUserDefined();
		const filtered = this.filterCallouts(userCallouts);

		if (filtered.length === 0) {
			containerEl.createEl("p", {
				text:
					userCallouts.length === 0
						? 'No custom callouts yet. Click "+ Add new callout" to create one.'
						: "No callouts match your search.",
				cls: "callout-studio-empty-state",
			});
		} else {
			const listEl = containerEl.createDiv({
				cls: "callout-studio-callout-list",
			});
			for (const def of filtered) {
				this.renderCalloutRow(listEl, def, false);
			}
		}
	}

	// ─── Section B: Built-in Callouts ────────────────────────

	private renderBuiltInCalloutsSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Built-in callouts").setHeading();

		const builtInCallouts = this.plugin.registry.getBuiltIn();
		const filtered = this.filterCallouts(builtInCallouts);
		const listEl = containerEl.createDiv({
			cls: "callout-studio-callout-list",
		});

		for (const def of filtered) {
			this.renderCalloutRow(listEl, def, true);
		}
	}

	// ─── Callout Row Rendering ───────────────────────────────

	private renderCalloutRow(
		containerEl: HTMLElement,
		def: CalloutDefinition,
		isBuiltIn: boolean,
	): void {
		const row = containerEl.createDiv({ cls: "callout-studio-row" });

		// Icon preview
		const iconEl = row.createDiv({ cls: "callout-studio-row-icon" });
		try {
			setIcon(
				iconEl,
				def.icon.type === "lucide" ? def.icon.value : "pencil",
			);
		} catch {
			iconEl.textContent = "📝";
		}

		// Info
		const infoEl = row.createDiv({ cls: "callout-studio-row-info" });
		infoEl.createDiv({
			cls: "callout-studio-row-name",
			text: def.displayName,
		});
		infoEl.createDiv({ cls: "callout-studio-row-id", text: def.id });

		// Color swatches
		const colorsEl = row.createDiv({ cls: "callout-studio-row-colors" });
		const lightSwatch = colorsEl.createDiv({
			cls: "callout-studio-color-swatch",
			attr: {
				"aria-label": `Light: ${def.colorLight}`,
				title: `Light: ${def.colorLight}`,
			},
		});
		lightSwatch.style.backgroundColor = def.colorLight;
		lightSwatch.createSpan({
			cls: "callout-studio-swatch-label",
			text: "L",
		});

		const darkSwatch = colorsEl.createDiv({
			cls: "callout-studio-color-swatch",
			attr: {
				"aria-label": `Dark: ${def.colorDark}`,
				title: `Dark: ${def.colorDark}`,
			},
		});
		darkSwatch.style.backgroundColor = def.colorDark;
		darkSwatch.createSpan({
			cls: "callout-studio-swatch-label",
			text: "D",
		});

		// Buttons
		const buttonsEl = row.createDiv({ cls: "callout-studio-row-buttons" });

		const editBtn = buttonsEl.createEl("button", {
			attr: { "aria-label": `Edit ${def.displayName}` },
		});
		setIcon(editBtn, "pencil");
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		editBtn.addEventListener("click", async () => {
			if (isBuiltIn) {
				// For built-in: open editor with the current (possibly overridden) values
				const editorModal = new CalloutEditor(this.plugin, {
					...def,
					builtIn: false,
				});
				const result = await editorModal.open();
				if (result) {
					// Apply overrides to built-in
					this.plugin.registry.update(def.id, {
						displayName: result.displayName,
						icon: result.icon,
						colorLight: result.colorLight,
						colorDark: result.colorDark,
					});
				}
			} else {
				const editorModal = new CalloutEditor(this.plugin, def);
				await editorModal.open();
			}
			this.display();
		});

		if (isBuiltIn) {
			const resetBtn = buttonsEl.createEl("button", {
				attr: { "aria-label": `Reset ${def.displayName} to default` },
			});
			setIcon(resetBtn, "rotate-ccw");
			resetBtn.addEventListener("click", () => {
				this.plugin.registry.resetBuiltIn(def.id);
				this.display();
			});
		} else {
			const deleteBtn = buttonsEl.createEl("button", {
				cls: "callout-studio-delete-btn",
				attr: { "aria-label": `Delete ${def.displayName}` },
			});
			setIcon(deleteBtn, "trash-2");
			deleteBtn.addEventListener("click", () => {
				// eslint-disable-next-line no-alert -- Obsidian has no built-in confirm dialog
				if (confirm(`Delete callout "${def.displayName}"?`)) {
					this.plugin.registry.remove(def.id);
					this.display();
				}
			});
		}
	}

	// ─── Section C: Context Menu / Popup Settings ────────────

	private renderPopupSettings(containerEl: HTMLElement): void {
		const { popup } = this.plugin.settings;

		new Setting(containerEl).setName("Context menu popup").setHeading();

		new Setting(containerEl)
			.setName("Enable context menu popup")
			.setDesc(
				"Show a semi-transparent floating panel anchored to the right-click context menu. It shows all available callout types and lets you quickly insert, convert, or edit callouts without opening the settings panel.",
			)
			.addToggle((t) =>
				t.setValue(popup.enabled).onChange(async (v) => {
					popup.enabled = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl).setName("Popup position").addDropdown((d) =>
			d
				.addOptions({
					"top-left": "Top-left",
					"top-right": "Top-right",
					cursor: "Cursor",
				})
				.setValue(popup.position)
				.onChange(async (v: string) => {
					popup.position = v as typeof popup.position;
					await this.plugin.saveSettings();
				}),
		);

		new Setting(containerEl)
			.setName("Popup transparency")
			.setDesc("0% = fully opaque, 100% = fully transparent")
			.addSlider((s) =>
				s
					.setLimits(0, 100, 5)
					.setValue(popup.transparency)
					.setDynamicTooltip()
					.onChange(async (v) => {
						popup.transparency = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Backdrop blur")
			.setDesc("Blur amount in pixels (0–20)")
			.addSlider((s) =>
				s
					.setLimits(0, 20, 1)
					.setValue(popup.backdropBlur)
					.setDynamicTooltip()
					.onChange(async (v) => {
						popup.backdropBlur = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName("Show icons in popup").addToggle((t) =>
			t.setValue(popup.showIcons).onChange(async (v) => {
				popup.showIcons = v;
				await this.plugin.saveSettings();
			}),
		);

		new Setting(containerEl)
			.setName("Show color dots in popup")
			.addToggle((t) =>
				t.setValue(popup.showColorDots).onChange(async (v) => {
					popup.showColorDots = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Max items visible in popup")
			.addText((t) =>
				t.setValue(String(popup.maxItems)).onChange(async (v) => {
					const n = parseInt(v, 10);
					if (!isNaN(n) && n > 0) {
						popup.maxItems = n;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Show "convert to..." submenu')
			.addToggle((t) =>
				t.setValue(popup.showConvertSubmenu).onChange(async (v) => {
					popup.showConvertSubmenu = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show "edit callout" button')
			.addToggle((t) =>
				t.setValue(popup.showEditButton).onChange(async (v) => {
					popup.showEditButton = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl).setName("Popup animation").addDropdown((d) =>
			d
				.addOptions({
					fade: "Fade",
					slide: "Slide",
					scale: "Scale",
					none: "None",
				})
				.setValue(popup.animation)
				.onChange(async (v: string) => {
					popup.animation = v as typeof popup.animation;
					await this.plugin.saveSettings();
				}),
		);
	}

	// ─── Section D: Autocomplete Settings ────────────────────

	private renderAutocompleteSettings(containerEl: HTMLElement): void {
		const { autocomplete } = this.plugin.settings;

		new Setting(containerEl).setName("Autocomplete").setHeading();

		new Setting(containerEl)
			.setName("Enable [! Autocomplete")
			.setDesc('Show suggestions when you type "[!" in the editor')
			.addToggle((t) =>
				t.setValue(autocomplete.enabled).onChange(async (v) => {
					autocomplete.enabled = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Show icon previews in autocomplete")
			.addToggle((t) =>
				t
					.setValue(autocomplete.showIconPreviews)
					.onChange(async (v) => {
						autocomplete.showIconPreviews = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName("Show color previews").addToggle((t) =>
			t.setValue(autocomplete.showColorPreviews).onChange(async (v) => {
				autocomplete.showColorPreviews = v;
				await this.plugin.saveSettings();
			}),
		);

		new Setting(containerEl).setName("Max suggestions").addText((t) =>
			t
				.setValue(String(autocomplete.maxSuggestions))
				.onChange(async (v) => {
					const n = parseInt(v, 10);
					if (!isNaN(n) && n > 0) {
						autocomplete.maxSuggestions = n;
						await this.plugin.saveSettings();
					}
				}),
		);

		new Setting(containerEl)
			.setName("Trigger character")
			.setDesc(
				"The autocomplete is triggered when you type this sequence",
			)
			.addText((t) => {
				t.setValue("[!").setDisabled(true);
			});
	}

	// ─── Section E: Icon Source Settings ─────────────────────

	private renderIconSourceSettings(containerEl: HTMLElement): void {
		const { iconSources } = this.plugin.settings;

		new Setting(containerEl).setName("Icon sources").setHeading();

		new Setting(containerEl)
			.setName("Lucide icons")
			.setDesc("Built-in Obsidian icons (~1,300 icons)")
			.addToggle((t) =>
				t.setValue(iconSources.lucide).onChange(async (v) => {
					iconSources.lucide = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Google material icons")
			.setDesc("Requires internet or local cache (~3,000 icons)")
			.addToggle((t) =>
				t.setValue(iconSources.material).onChange(async (v) => {
					iconSources.material = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Custom SVG")
			.setDesc("User-uploaded SVG icons")
			.addToggle((t) =>
				t.setValue(iconSources.customSvg).onChange(async (v) => {
					iconSources.customSvg = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Material icons style default")
			.addDropdown((d) =>
				d
					.addOptions({
						outlined: "Outlined",
						filled: "Filled",
						rounded: "Rounded",
						sharp: "Sharp",
					})
					.setValue(iconSources.materialStyleDefault)
					.onChange(async (v: string) => {
						iconSources.materialStyleDefault =
							v as typeof iconSources.materialStyleDefault;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Cache material icons offline")
			.setDesc("Downloads icon metadata for offline use")
			.addToggle((t) =>
				t
					.setValue(iconSources.cacheMaterialOffline)
					.onChange(async (v) => {
						iconSources.cacheMaterialOffline = v;
						await this.plugin.saveSettings();
					}),
			);
	}

	// ─── Section F: Color Mode Settings ──────────────────────

	private renderColorModeSettings(containerEl: HTMLElement): void {
		const { colorMode } = this.plugin.settings;

		new Setting(containerEl).setName("Color mode").setHeading();

		new Setting(containerEl)
			.setName("Color application mode")
			.setDesc("Auto follows Obsidian's current theme (recommended)")
			.addDropdown((d) =>
				d
					.addOptions({
						auto: "Auto (recommended)",
						light: "Force light colors only",
						dark: "Force dark colors only",
					})
					.setValue(colorMode.mode)
					.onChange(async (v: string) => {
						colorMode.mode = v as typeof colorMode.mode;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName("Color format").addDropdown((d) =>
			d
				.addOptions({ hex: "HEX", hsl: "HSL", rgb: "RGB" })
				.setValue(colorMode.format)
				.onChange(async (v: string) => {
					colorMode.format = v as typeof colorMode.format;
					await this.plugin.saveSettings();
				}),
		);

		new Setting(containerEl)
			.setName("Show color contrast warning")
			.setDesc(
				"Warns if icon color has low contrast against callout background",
			)
			.addToggle((t) =>
				t
					.setValue(colorMode.showContrastWarning)
					.onChange(async (v) => {
						colorMode.showContrastWarning = v;
						await this.plugin.saveSettings();
					}),
			);
	}

	// ─── Helpers ─────────────────────────────────────────────

	private filterCallouts(callouts: CalloutDefinition[]): CalloutDefinition[] {
		if (!this.searchQuery) return callouts;
		const q = this.searchQuery.toLowerCase();
		return callouts.filter(
			(d) =>
				d.displayName.toLowerCase().includes(q) ||
				d.id.toLowerCase().includes(q),
		);
	}

	private async importFromSnippets(): Promise<void> {
		try {
			const snippetsPath = this.app.vault.configDir + "/snippets";
			const files = await this.app.vault.adapter.list(snippetsPath);
			let totalImported = 0;

			for (const file of files.files) {
				if (file.endsWith(".css")) {
					const content = await this.app.vault.adapter.read(file);
					const imported =
						this.plugin.registry.importFromCSS(content);
					totalImported += imported.length;
				}
			}

			if (totalImported > 0) {
				new Notice(
					`Imported ${totalImported} callout type(s) from CSS snippets.`,
				);
			} else {
				new Notice("No new callout types found in CSS snippets.");
			}
		} catch {
			new Notice("Failed to read CSS snippets folder.");
		}
	}

	private exportCallouts(): void {
		const json = this.plugin.registry.exportToJSON();
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "callout-studio-callouts.json";
		a.click();
		URL.revokeObjectURL(url);
		new Notice("Callouts exported to callout-studio-callouts.json");
	}

	private importFromJSON(): void {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		input.addEventListener("change", async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const text = await file.text();
				const defs = JSON.parse(text) as CalloutDefinition[];
				if (!Array.isArray(defs)) {
					new Notice("Invalid JSON format: expected an array.");
					return;
				}
				let imported = 0;
				for (const def of defs) {
					if (!def.id || !def.displayName) continue;
					const added = this.plugin.registry.add({
						...def,
						builtIn: false,
						source: "user",
					});
					if (added) imported++;
				}
				if (imported > 0) {
					new Notice(
						`Imported ${imported} callout type(s) from JSON.`,
					);
					this.display();
				} else {
					new Notice(
						"No new callout types were imported (ids may already exist).",
					);
				}
			} catch {
				new Notice("Failed to parse JSON file.");
			}
		});
		input.click();
	}
}
