import { Menu, Notice, PluginSettingTab, Setting, setIcon } from "obsidian";
import type { App } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition } from "../types";
import { CalloutEditor } from "./CalloutEditor";
import { materialFontFamily } from "../utils/iconLoader";
import { t, setLocale, getAvailableLocales } from "../i18n";

export class CalloutStudioSettingsTab extends PluginSettingTab {
	plugin: CalloutStudioPlugin;
	private searchQuery = "";
	private userListEl: HTMLElement | null = null;
	private builtInListEl: HTMLElement | null = null;

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
		this.renderLanguageSettings(containerEl);
	}

	// ─── Section A: My Callout Types ─────────────────────────

	private renderCalloutTypesSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("settings.myCalloutTypes"))
			.setHeading();

		// Toolbar: search + add button + kebab menu
		const toolbar = containerEl.createDiv({
			cls: "callout-studio-toolbar",
		});

		const searchWrap = toolbar.createDiv({
			cls: "callout-studio-toolbar-search",
		});
		new Setting(searchWrap).addSearch((search) => {
			search
				.setPlaceholder(t("settings.searchPlaceholder"))
				.setValue(this.searchQuery)
				.onChange((value) => {
					this.searchQuery = value;
					this.refreshLists();
				});
		});

		const addBtn = toolbar.createEl("button", {
			text: t("settings.addNewCallout"),
			cls: "mod-cta",
		});
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		addBtn.addEventListener("click", async () => {
			const editor = new CalloutEditor(this.plugin);
			await editor.open();
			this.display();
		});

		const kebabBtn = toolbar.createEl("button", {
			cls: "clickable-icon callout-studio-kebab-btn",
			attr: { "aria-label": t("settings.moreActions") },
		});
		setIcon(kebabBtn, "more-vertical");
		kebabBtn.addEventListener("click", (evt) => {
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle(t("settings.importCSS"))
					.setIcon("file-code")
					.onClick(async () => {
						await this.importFromSnippets();
						this.display();
					}),
			);
			menu.addItem((item) =>
				item
					.setTitle(t("settings.importJSON"))
					.setIcon("file-json")
					.onClick(() => this.importFromJSON()),
			);
			menu.addItem((item) =>
				item
					.setTitle(t("settings.exportAll"))
					.setIcon("download")
					.onClick(() => this.exportCallouts()),
			);
			menu.showAtMouseEvent(evt);
		});

		// User-defined callout list container
		this.userListEl = containerEl.createDiv();
		this.renderUserList();
	}

	private renderUserList(): void {
		if (!this.userListEl) return;
		this.userListEl.empty();

		const userCallouts = this.plugin.registry.getUserDefined();
		const filtered = this.filterCallouts(userCallouts);

		if (filtered.length === 0) {
			this.userListEl.createEl("p", {
				text:
					userCallouts.length === 0
						? t("settings.noCalloutsYet")
						: t("settings.noMatch"),
				cls: "callout-studio-empty-state",
			});
		} else {
			const listEl = this.userListEl.createDiv({
				cls: "callout-studio-callout-list",
			});
			for (const def of filtered) {
				this.renderCalloutRow(listEl, def, false);
			}
		}
	}

	// ─── Section B: Built-in Callouts ────────────────────────

	private renderBuiltInCalloutsSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("settings.builtInCallouts"))
			.setHeading();

		this.builtInListEl = containerEl.createDiv();
		this.renderBuiltInList();
	}

	private renderBuiltInList(): void {
		if (!this.builtInListEl) return;
		this.builtInListEl.empty();

		const builtInCallouts = this.plugin.registry.getBuiltIn();
		const filtered = this.filterCallouts(builtInCallouts);
		const listEl = this.builtInListEl.createDiv({
			cls: "callout-studio-callout-list",
		});

		for (const def of filtered) {
			this.renderCalloutRow(listEl, def, true);
		}
	}

	/**
	 * Re-render only the callout lists without rebuilding the whole tab.
	 * This preserves search input focus.
	 */
	private refreshLists(): void {
		this.renderUserList();
		this.renderBuiltInList();
	}

	// ─── Callout Row Rendering ───────────────────────────────

	private renderCalloutRow(
		containerEl: HTMLElement,
		def: CalloutDefinition,
		isBuiltIn: boolean,
	): void {
		const row = containerEl.createDiv({ cls: "callout-studio-row" });

		// Icon preview — supports all icon types
		const iconEl = row.createDiv({ cls: "callout-studio-row-icon" });
		this.renderRowIcon(iconEl, def);

		// Info: name + > [!id] syntax
		const infoEl = row.createDiv({ cls: "callout-studio-row-info" });
		infoEl.createSpan({
			cls: "callout-studio-row-name",
			text: def.displayName,
		});
		infoEl.createEl("code", {
			cls: "callout-studio-row-syntax",
			text: `> [!${def.id}]`,
		});

		// Color swatches
		const colorsEl = row.createDiv({ cls: "callout-studio-row-colors" });
		const lightSwatch = colorsEl.createDiv({
			cls: "callout-studio-color-swatch",
			attr: {
				"aria-label": t("settings.lightColorAria", {
					color: def.colorLight,
				}),
				title: t("settings.lightColorAria", { color: def.colorLight }),
			},
		});
		lightSwatch.style.backgroundColor = def.colorLight;
		lightSwatch.createSpan({
			cls: "callout-studio-swatch-label",
			text: t("settings.lightLabel"),
		});

		const darkSwatch = colorsEl.createDiv({
			cls: "callout-studio-color-swatch",
			attr: {
				"aria-label": t("settings.darkColorAria", {
					color: def.colorDark,
				}),
				title: t("settings.darkColorAria", { color: def.colorDark }),
			},
		});
		darkSwatch.style.backgroundColor = def.colorDark;
		darkSwatch.createSpan({
			cls: "callout-studio-swatch-label",
			text: t("settings.darkLabel"),
		});

		// Buttons
		const buttonsEl = row.createDiv({ cls: "callout-studio-row-buttons" });

		const editBtn = buttonsEl.createEl("button", {
			attr: {
				"aria-label": t("settings.editAria", { name: def.displayName }),
			},
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
				attr: {
					"aria-label": t("settings.resetAria", {
						name: def.displayName,
					}),
				},
			});
			setIcon(resetBtn, "rotate-ccw");
			resetBtn.addEventListener("click", () => {
				this.plugin.registry.resetBuiltIn(def.id);
				this.display();
			});
		} else {
			const deleteBtn = buttonsEl.createEl("button", {
				cls: "callout-studio-delete-btn",
				attr: {
					"aria-label": t("settings.deleteAria", {
						name: def.displayName,
					}),
				},
			});
			setIcon(deleteBtn, "trash-2");
			deleteBtn.addEventListener("click", () => {
				// eslint-disable-next-line no-alert -- Obsidian has no built-in confirm dialog
				if (
					confirm(
						t("settings.deleteConfirm", { name: def.displayName }),
					)
				) {
					this.plugin.registry.remove(def.id);
					this.display();
				}
			});
		}
	}

	private renderRowIcon(
		container: HTMLElement,
		def: CalloutDefinition,
	): void {
		switch (def.icon.type) {
			case "lucide":
				try {
					setIcon(container, def.icon.value);
				} catch {
					container.textContent = "?";
				}
				break;
			case "material": {
				const span = container.createSpan({
					cls: "callout-studio-material-icon",
					text: def.icon.value,
				});
				const fontFamily = materialFontFamily(
					def.icon.style ?? "outlined",
				);
				span.setCssProps({
					"--cs-material-font": `"${fontFamily}"`,
				});
				if (def.icon.style === "filled") {
					span.setCssProps({ "--cs-material-fill": "1" });
				}
				break;
			}
			case "svg": {
				const svgData = this.plugin.registry.customSvgIcons.find(
					(s) => s.name === def.icon.value,
				);
				if (svgData) {
					const parser = new DOMParser();
					const doc = parser.parseFromString(
						svgData.svg,
						"image/svg+xml",
					);
					const svgEl = doc.documentElement;
					container.appendChild(
						container.doc.importNode(svgEl, true),
					);
				} else {
					container.textContent = "?";
				}
				break;
			}
			case "emoji":
				container.textContent = def.icon.value;
				break;
			default:
				container.textContent = "?";
		}
	}

	// ─── Section C: Context Menu / Popup Settings ────────────

	private renderPopupSettings(containerEl: HTMLElement): void {
		const { popup } = this.plugin.settings;

		new Setting(containerEl)
			.setName(t("settings.contextMenuPopup"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("settings.enablePopup"))
			.setDesc(t("settings.enablePopupDesc"))
			.addToggle((tog) =>
				tog.setValue(popup.enabled).onChange(async (v) => {
					popup.enabled = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.popupPosition"))
			.addDropdown((d) =>
				d
					.addOptions({
						"top-left": t("settings.topLeft"),
						"top-right": t("settings.topRight"),
						cursor: t("settings.cursor"),
					})
					.setValue(popup.position)
					.onChange(async (v: string) => {
						popup.position = v as typeof popup.position;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.popupTransparency"))
			.setDesc(t("settings.popupTransparencyDesc"))
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
			.setName(t("settings.backdropBlur"))
			.setDesc(t("settings.backdropBlurDesc"))
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

		new Setting(containerEl)
			.setName(t("settings.showIconsPopup"))
			.addToggle((tog) =>
				tog.setValue(popup.showIcons).onChange(async (v) => {
					popup.showIcons = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.showColorDots"))
			.addToggle((tog) =>
				tog.setValue(popup.showColorDots).onChange(async (v) => {
					popup.showColorDots = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.maxItemsPopup"))
			.addText((txt) =>
				txt.setValue(String(popup.maxItems)).onChange(async (v) => {
					const n = parseInt(v, 10);
					if (!isNaN(n) && n > 0) {
						popup.maxItems = n;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.showConvertSubmenu"))
			.addToggle((tog) =>
				tog.setValue(popup.showConvertSubmenu).onChange(async (v) => {
					popup.showConvertSubmenu = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.showEditButton"))
			.addToggle((tog) =>
				tog.setValue(popup.showEditButton).onChange(async (v) => {
					popup.showEditButton = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.popupAnimation"))
			.addDropdown((d) =>
				d
					.addOptions({
						fade: t("settings.animFade"),
						slide: t("settings.animSlide"),
						scale: t("settings.animScale"),
						none: t("settings.animNone"),
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

		new Setting(containerEl)
			.setName(t("settings.autocomplete"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("settings.enableAutocomplete"))
			.setDesc(t("settings.enableAutocompleteDesc"))
			.addToggle((tog) =>
				tog.setValue(autocomplete.enabled).onChange(async (v) => {
					autocomplete.enabled = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.showIconPreviews"))
			.addToggle((tog) =>
				tog
					.setValue(autocomplete.showIconPreviews)
					.onChange(async (v) => {
						autocomplete.showIconPreviews = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.showColorPreviews"))
			.addToggle((tog) =>
				tog
					.setValue(autocomplete.showColorPreviews)
					.onChange(async (v) => {
						autocomplete.showColorPreviews = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.maxSuggestions"))
			.addText((txt) =>
				txt
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
			.setName(t("settings.triggerCharacter"))
			.setDesc(t("settings.triggerCharacterDesc"))
			.addText((txt) => {
				txt.setValue("[!").setDisabled(true);
			});
	}

	// ─── Section E: Icon Source Settings ─────────────────────

	private renderIconSourceSettings(containerEl: HTMLElement): void {
		const { iconSources } = this.plugin.settings;

		new Setting(containerEl)
			.setName(t("settings.iconSources"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("settings.lucideIcons"))
			.setDesc(t("settings.lucideIconsDesc"))
			.addToggle((tog) =>
				tog.setValue(iconSources.lucide).onChange(async (v) => {
					iconSources.lucide = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.materialIcons"))
			.setDesc(t("settings.materialIconsDesc"))
			.addToggle((tog) =>
				tog.setValue(iconSources.material).onChange(async (v) => {
					iconSources.material = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.customSvg"))
			.setDesc(t("settings.customSvgDesc"))
			.addToggle((tog) =>
				tog.setValue(iconSources.customSvg).onChange(async (v) => {
					iconSources.customSvg = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t("settings.materialStyleDefault"))
			.addDropdown((d) =>
				d
					.addOptions({
						outlined: t("settings.styleOutlined"),
						filled: t("settings.styleFilled"),
						rounded: t("settings.styleRounded"),
						sharp: t("settings.styleSharp"),
					})
					.setValue(iconSources.materialStyleDefault)
					.onChange(async (v: string) => {
						iconSources.materialStyleDefault =
							v as typeof iconSources.materialStyleDefault;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.cacheMaterial"))
			.setDesc(t("settings.cacheMaterialDesc"))
			.addToggle((tog) =>
				tog
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

		new Setting(containerEl).setName(t("settings.colorMode")).setHeading();

		new Setting(containerEl)
			.setName(t("settings.colorAppMode"))
			.setDesc(t("settings.colorAppModeDesc"))
			.addDropdown((d) =>
				d
					.addOptions({
						auto: t("settings.colorAuto"),
						light: t("settings.colorForceLight"),
						dark: t("settings.colorForceDark"),
					})
					.setValue(colorMode.mode)
					.onChange(async (v: string) => {
						colorMode.mode = v as typeof colorMode.mode;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.colorFormat"))
			.addDropdown((d) =>
				d
					.addOptions({ hex: "HEX", hsl: "HSL", rgb: "RGB" })
					.setValue(colorMode.format)
					.onChange(async (v: string) => {
						colorMode.format = v as typeof colorMode.format;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.showContrastWarning"))
			.setDesc(t("settings.showContrastWarningDesc"))
			.addToggle((tog) =>
				tog
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
				new Notice(t("notice.importedCSS", { count: totalImported }));
			} else {
				new Notice(t("notice.noNewCSS"));
			}
		} catch {
			new Notice(t("notice.failedCSS"));
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
		new Notice(t("notice.exported"));
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
					new Notice(t("notice.invalidJSON"));
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
					new Notice(t("notice.importedJSON", { count: imported }));
					this.display();
				} else {
					new Notice(t("notice.noNewJSON"));
				}
			} catch {
				new Notice(t("notice.failedJSON"));
			}
		});
		input.click();
	}

	// ─── Section G: Language ─────────────────────────────────

	private renderLanguageSettings(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t("settings.language")).setHeading();

		const localeOptions: Record<string, string> = {
			auto: t("settings.languageAuto"),
		};
		for (const code of getAvailableLocales()) {
			localeOptions[code] = code.toUpperCase();
		}

		new Setting(containerEl)
			.setName(t("settings.language"))
			.setDesc(t("settings.languageDesc"))
			.addDropdown((d) =>
				d
					.addOptions(localeOptions)
					.setValue(this.plugin.settings.language)
					.onChange(async (v: string) => {
						this.plugin.settings.language = v;
						setLocale(v);
						await this.plugin.saveSettings();
						this.display();
					}),
			);
	}
}
