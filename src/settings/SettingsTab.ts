import {
	Menu,
	Modal,
	Notice,
	PluginSettingTab,
	Setting,
	setIcon,
} from "obsidian";
import type { App } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition } from "../types";
import { CalloutEditor } from "./CalloutEditor";
import { materialFontFamily } from "../utils/iconLoader";
import { ConfirmModal } from "../utils/ConfirmModal";
import { ReplaceCalloutModal } from "../utils/ReplaceCalloutModal";
import {
	countCalloutUsages,
	replaceCalloutIdsInVault,
} from "../utils/vaultCalloutScanner";
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
		this.renderFallbackCalloutSection(containerEl);
		this.renderGlobalStyleSection(containerEl);
		this.renderAutocompleteSettings(containerEl);
		this.renderPopupSettings(containerEl);
		this.renderIconSourceSettings(containerEl);
		this.renderColorModeSettings(containerEl);
		this.renderLanguageSettings(containerEl);
		this.renderResetSection(containerEl);
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

		// Info: name + all IDs as > [!id] chips
		const infoEl = row.createDiv({ cls: "callout-studio-row-info" });
		infoEl.createSpan({
			cls: "callout-studio-row-name",
			text: def.displayName,
		});
		const syntaxLine = infoEl.createDiv({
			cls: "callout-studio-row-syntax-line",
		});
		const allIds = [def.id, ...(def.aliases ?? [])];
		for (const id of allIds) {
			syntaxLine.createEl("code", {
				cls: "callout-studio-row-syntax",
				text: `> [!${id}]`,
			});
		}

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
				const editorModal = new CalloutEditor(this.plugin, def);
				const result = await editorModal.open();
				if (result) {
					// Apply overrides to built-in — keep it in built-in section
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
				await editorModal.open();
			}
			this.display();
		});

		if (isBuiltIn) {
			const modified = this.plugin.registry.isBuiltInModified(def.id);
			const resetBtn = buttonsEl.createEl("button", {
				cls: "callout-studio-reset-btn",
				attr: {
					"aria-label": t("settings.resetAria", {
						name: def.displayName,
					}),
				},
			});
			setIcon(resetBtn, "rotate-ccw");
			if (!modified) {
				resetBtn.setAttribute("disabled", "true");
				resetBtn.addClass("callout-studio-btn-disabled");
			}
			resetBtn.addEventListener("click", () => {
				if (!modified) return;
				void this.handleBuiltInReset(def);
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
				void this.handleCalloutDelete(def);
			});
		}
	}

	private async handleCalloutDelete(def: CalloutDefinition): Promise<void> {
		const allIds = [def.id, ...(def.aliases ?? [])];
		const { fileCount, totalCount } = await countCalloutUsages(
			this.app,
			allIds,
		);

		if (fileCount > 0) {
			const otherCallouts = this.plugin.registry
				.getAll()
				.filter((c) => c.id !== def.id);
			const result = await new ReplaceCalloutModal(
				this.app,
				t("vault.deleteInUse", {
					name: def.displayName,
					count: String(totalCount),
					files: String(fileCount),
				}),
				otherCallouts,
				this.plugin.registry,
				this.plugin.settings.fallbackCalloutId,
			).prompt();

			if (result.action === "cancel") return;

			if (result.action === "replace") {
				const replaced = await replaceCalloutIdsInVault(
					this.app,
					allIds,
					result.replaceWith,
				);
				new Notice(
					t("vault.filesUpdated", { count: String(replaced) }),
				);
			}

			this.plugin.registry.remove(def.id);
		} else {
			const confirmed = await new ConfirmModal(
				this.app,
				t("settings.deleteConfirm", { name: def.displayName }),
			).confirm();
			if (!confirmed) return;
			this.plugin.registry.remove(def.id);
		}

		this.display();
	}

	private async handleBuiltInReset(def: CalloutDefinition): Promise<void> {
		const original = this.plugin.registry.getBuiltInDefault(def.id);
		if (original) {
			const currentAliases = def.aliases ?? [];
			const originalAliasSet = new Set(
				(original.aliases ?? []).map((a) => a.toLowerCase()),
			);
			const customAliases = currentAliases.filter(
				(a) => !originalAliasSet.has(a.toLowerCase()),
			);

			if (customAliases.length > 0) {
				const { fileCount, totalCount } = await countCalloutUsages(
					this.app,
					customAliases,
				);
				if (fileCount > 0) {
					const confirmed = await new ConfirmModal(
						this.app,
						t("vault.resetAliasWarning", {
							count: String(totalCount),
							files: String(fileCount),
							aliases: customAliases.join(", "),
						}),
						t("vault.resetConfirm"),
					).confirm();
					if (!confirmed) return;
				}
			}
		}

		this.plugin.registry.resetBuiltIn(def.id);
		this.display();
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
				// Use cached SVG if available (works offline + in print)
				const cached = this.plugin.registry.findMaterialSvg(
					def.icon.value,
					def.icon.style ?? "outlined",
					def.icon.weight ?? 400,
				);
				console.debug("[CalloutStudio] renderRowIcon material:", {
					name: def.icon.value,
					style: def.icon.style ?? "outlined",
					weight: def.icon.weight ?? 400,
					hasCached: !!cached,
					cacheSize: this.plugin.registry.materialSvgCache.length,
				});
				if (cached) {
					const parser = new DOMParser();
					const doc = parser.parseFromString(
						cached.svg,
						"image/svg+xml",
					);
					const svgEl = doc.documentElement;
					svgEl.setAttribute("fill", "currentColor");
					container.appendChild(
						container.doc.importNode(svgEl, true),
					);
				} else {
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

	// ─── Section: Fallback Callout ──────────────────────────

	private renderFallbackCalloutSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("settings.fallbackCallout"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("settings.fallbackCallout"))
			.setDesc(t("settings.fallbackCalloutDesc"))
			.addDropdown((dd) => {
				const allCallouts = this.plugin.registry.getAll();
				for (const c of allCallouts) {
					dd.addOption(c.id, `${c.displayName} (${c.id})`);
				}
				dd.setValue(this.plugin.settings.fallbackCalloutId).onChange(
					async (val) => {
						this.plugin.settings.fallbackCalloutId = val;
						await this.plugin.saveSettings();
						this.plugin.cssInjector.inject();
					},
				);
			});
	}

	// ─── Section: Global Callout Style ──────────────────────

	private renderGlobalStyleSection(containerEl: HTMLElement): void {
		const { globalStyle } = this.plugin.settings;

		const heading = new Setting(containerEl)
			.setName(t("settings.globalStyle"))
			.setHeading();
		heading.descEl.setText(t("settings.globalStyleDesc"));

		// Two-column wrapper: preview (sticky) | controls (scrollable)
		const wrapper = containerEl.createDiv({
			cls: "cs-global-style-wrapper",
		});

		// ── Left: live preview (sticky) ──
		const previewCol = wrapper.createDiv({ cls: "cs-global-preview-col" });
		const previewLabel = previewCol.createDiv({
			cls: "cs-global-preview-label",
		});
		previewLabel.setText(t("settings.previewTitle"));

		const previewCard = previewCol.createDiv({
			cls: "cs-global-preview-card",
		});

		const updatePreview = () => {
			previewCard.empty();
			const callout = previewCard.createDiv({
				cls: "callout cs-global-preview-callout",
				attr: { "data-callout": "cs-preview" },
			});

			// Apply live styles via CSS custom props
			callout.setCssProps({
				"--cs-preview-radius": `${globalStyle.borderRadius}px`,
			});

			// Border sides
			const { top, right, bottom, left } = globalStyle.borderSides;
			const allSides = top && right && bottom && left;
			const anySide = top || right || bottom || left;
			const bStyle = `${globalStyle.borderWidth}px solid rgba(var(--callout-color), 0.45)`;

			if (allSides) {
				callout.setCssProps({
					"--cs-preview-border": bStyle,
					"--cs-preview-border-top": bStyle,
					"--cs-preview-border-right": bStyle,
					"--cs-preview-border-bottom": bStyle,
					"--cs-preview-border-left": bStyle,
				});
			} else if (anySide) {
				callout.setCssProps({
					"--cs-preview-border": "none",
					"--cs-preview-border-top": top ? bStyle : "none",
					"--cs-preview-border-right": right ? bStyle : "none",
					"--cs-preview-border-bottom": bottom ? bStyle : "none",
					"--cs-preview-border-left": left ? bStyle : "none",
				});
			} else {
				callout.setCssProps({
					"--cs-preview-border": "none",
					"--cs-preview-border-top": "none",
					"--cs-preview-border-right": "none",
					"--cs-preview-border-bottom": "none",
					"--cs-preview-border-left": "none",
				});
			}

			// Title row
			const titleRow = callout.createDiv({ cls: "callout-title" });
			const iconEl = titleRow.createDiv({ cls: "callout-icon" });
			setIcon(iconEl, "info");
			const titleInner = titleRow.createDiv({
				cls: "callout-title-inner",
			});
			titleInner.setText(t("settings.previewCalloutTitle"));
			titleInner.setCssProps({
				"--cs-preview-title-size": `${globalStyle.titleScale}em`,
			});

			// Content
			const content = callout.createDiv({ cls: "callout-content" });
			const p = content.createEl("p");
			p.setText(t("settings.previewCalloutContent"));
			content.setCssProps({
				"--cs-preview-content-size": `${globalStyle.contentScale}em`,
			});

			if (globalStyle.alignToTitle) {
				content.addClass("cs-align-to-title");
			}
		};

		updatePreview();

		// ── Right: controls ──
		const controlsCol = wrapper.createDiv({
			cls: "cs-global-controls-col",
		});

		// ── Borders group ──
		const borderGroupEl = controlsCol.createDiv({
			cls: "cs-settings-group",
		});
		borderGroupEl.createDiv({
			cls: "cs-settings-group-header",
			text: t("settings.border"),
		});

		// Compact border side selector: row of toggle buttons
		const borderSidesRow = borderGroupEl.createDiv({
			cls: "cs-border-sides-row",
		});

		const sides: {
			key: "top" | "right" | "bottom" | "left";
			label: string;
		}[] = [
			{ key: "top", label: t("settings.borderTop") },
			{ key: "right", label: t("settings.borderRight") },
			{ key: "bottom", label: t("settings.borderBottom") },
			{ key: "left", label: t("settings.borderLeft") },
		];

		// "All" toggle button
		const allActive =
			globalStyle.borderSides.top &&
			globalStyle.borderSides.right &&
			globalStyle.borderSides.bottom &&
			globalStyle.borderSides.left;

		const allBtn = borderSidesRow.createEl("button", {
			cls: `cs-border-side-btn${allActive ? " is-active" : ""}`,
			text: t("settings.borderAll"),
		});
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		allBtn.addEventListener("click", async () => {
			const nowAll =
				globalStyle.borderSides.top &&
				globalStyle.borderSides.right &&
				globalStyle.borderSides.bottom &&
				globalStyle.borderSides.left;
			const newVal = !nowAll;
			globalStyle.borderSides.top = newVal;
			globalStyle.borderSides.right = newVal;
			globalStyle.borderSides.bottom = newVal;
			globalStyle.borderSides.left = newVal;
			await this.plugin.saveSettings();
			this.plugin.cssInjector.inject();
			// Refresh the whole border group to update button states
			this.display();
		});

		for (const side of sides) {
			const active = globalStyle.borderSides[side.key];
			const btn = borderSidesRow.createEl("button", {
				cls: `cs-border-side-btn${active ? " is-active" : ""}`,
				text: side.label,
			});
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			btn.addEventListener("click", async () => {
				globalStyle.borderSides[side.key] =
					!globalStyle.borderSides[side.key];
				await this.plugin.saveSettings();
				this.plugin.cssInjector.inject();
				this.display();
			});
		}

		// Border width slider
		const anySideActive =
			globalStyle.borderSides.top ||
			globalStyle.borderSides.right ||
			globalStyle.borderSides.bottom ||
			globalStyle.borderSides.left;

		if (anySideActive) {
			new Setting(borderGroupEl)
				.setName(
					`${t("settings.borderWidth")}  ${globalStyle.borderWidth}px`,
				)
				.addSlider((s) => {
					const settingItem = s.sliderEl.closest(".setting-item");
					s.setLimits(0.5, 5, 0.5)
						.setValue(globalStyle.borderWidth)
						.setDynamicTooltip();
					s.sliderEl.addEventListener("input", () => {
						const v =
							Math.round(parseFloat(s.sliderEl.value) * 10) / 10;
						globalStyle.borderWidth = v;
						if (settingItem) {
							const nameEl =
								settingItem.querySelector(".setting-item-name");
							if (nameEl)
								nameEl.textContent = `${t("settings.borderWidth")}  ${v}px`;
						}
						updatePreview();
					});
					s.onChange(async (v) => {
						globalStyle.borderWidth = Math.round(v * 10) / 10;
						await this.plugin.saveSettings();
						this.plugin.cssInjector.inject();
					});
				});
		}

		// ── Font scale group ──
		const fontGroupEl = controlsCol.createDiv({
			cls: "cs-settings-group",
		});
		fontGroupEl.createDiv({
			cls: "cs-settings-group-header",
			text: t("settings.fontScaleGroup"),
		});

		// Title scale slider
		new Setting(fontGroupEl)
			.setName(
				`${t("settings.titleScale")}  ×${globalStyle.titleScale.toFixed(2)}`,
			)
			.addSlider((s) => {
				const settingItem = s.sliderEl.closest(".setting-item");
				s.setLimits(0.5, 1.5, 0.05)
					.setValue(globalStyle.titleScale)
					.setDynamicTooltip();
				s.sliderEl.addEventListener("input", () => {
					const v =
						Math.round(parseFloat(s.sliderEl.value) * 100) / 100;
					globalStyle.titleScale = v;
					if (settingItem) {
						const nameEl =
							settingItem.querySelector(".setting-item-name");
						if (nameEl)
							nameEl.textContent = `${t("settings.titleScale")}  ×${v.toFixed(2)}`;
					}
					updatePreview();
				});
				s.onChange(async (v) => {
					globalStyle.titleScale = Math.round(v * 100) / 100;
					await this.plugin.saveSettings();
					this.plugin.cssInjector.inject();
				});
			});

		// Content scale slider
		new Setting(fontGroupEl)
			.setName(
				`${t("settings.contentScale")}  ×${globalStyle.contentScale.toFixed(2)}`,
			)
			.addSlider((s) => {
				const settingItem = s.sliderEl.closest(".setting-item");
				s.setLimits(0.5, 1.5, 0.05)
					.setValue(globalStyle.contentScale)
					.setDynamicTooltip();
				s.sliderEl.addEventListener("input", () => {
					const v =
						Math.round(parseFloat(s.sliderEl.value) * 100) / 100;
					globalStyle.contentScale = v;
					if (settingItem) {
						const nameEl =
							settingItem.querySelector(".setting-item-name");
						if (nameEl)
							nameEl.textContent = `${t("settings.contentScale")}  ×${v.toFixed(2)}`;
					}
					updatePreview();
				});
				s.onChange(async (v) => {
					globalStyle.contentScale = Math.round(v * 100) / 100;
					await this.plugin.saveSettings();
					this.plugin.cssInjector.inject();
				});
			});

		// ── Shape group ──
		const shapeGroupEl = controlsCol.createDiv({
			cls: "cs-settings-group",
		});
		shapeGroupEl.createDiv({
			cls: "cs-settings-group-header",
			text: t("settings.shapeGroup"),
		});

		// Border radius slider
		new Setting(shapeGroupEl)
			.setName(
				`${t("settings.borderRadius")}  ${globalStyle.borderRadius}px`,
			)
			.addSlider((s) => {
				const settingItem = s.sliderEl.closest(".setting-item");
				s.setLimits(0, 24, 1)
					.setValue(globalStyle.borderRadius)
					.setDynamicTooltip();
				s.sliderEl.addEventListener("input", () => {
					const v = parseInt(s.sliderEl.value, 10);
					globalStyle.borderRadius = v;
					if (settingItem) {
						const nameEl =
							settingItem.querySelector(".setting-item-name");
						if (nameEl)
							nameEl.textContent = `${t("settings.borderRadius")}  ${v}px`;
					}
					updatePreview();
				});
				s.onChange(async (v) => {
					globalStyle.borderRadius = v;
					await this.plugin.saveSettings();
					this.plugin.cssInjector.inject();
				});
			});

		// Align to title toggle
		new Setting(shapeGroupEl)
			.setName(t("settings.alignToTitle"))
			.setDesc(t("settings.alignToTitleDesc"))
			.addToggle((tog) =>
				tog.setValue(globalStyle.alignToTitle).onChange(async (v) => {
					globalStyle.alignToTitle = v;
					await this.plugin.saveSettings();
					this.plugin.cssInjector.inject();
					updatePreview();
				}),
			);
	}

	// ─── Section C: Context Menu / Popup Settings ────────────

	private renderPopupSettings(containerEl: HTMLElement): void {
		const { popup } = this.plugin.settings;

		new Setting(containerEl)
			.setName(t("settings.contextMenuPopup"))
			.setHeading();

		const itemsContainer = containerEl.createDiv();

		const renderItems = () => {
			itemsContainer.empty();
			if (!popup.enabled) return;

			new Setting(itemsContainer)
				.setName(t("settings.showEditCallout"))
				.addToggle((tog) =>
					tog.setValue(popup.showEditCallout).onChange(async (v) => {
						popup.showEditCallout = v;
						await this.plugin.saveSettings();
					}),
				);

			new Setting(itemsContainer)
				.setName(t("settings.showOpenSettings"))
				.addToggle((tog) =>
					tog.setValue(popup.showOpenSettings).onChange(async (v) => {
						popup.showOpenSettings = v;
						await this.plugin.saveSettings();
					}),
				);

			new Setting(itemsContainer)
				.setName(t("settings.showCopyMarkdown"))
				.addToggle((tog) =>
					tog.setValue(popup.showCopyMarkdown).onChange(async (v) => {
						popup.showCopyMarkdown = v;
						await this.plugin.saveSettings();
					}),
				);
		};

		new Setting(containerEl)
			.setName(t("settings.enablePopup"))
			.setDesc(t("settings.enablePopupDesc"))
			.addToggle((tog) =>
				tog.setValue(popup.enabled).onChange(async (v) => {
					popup.enabled = v;
					await this.plugin.saveSettings();
					renderItems();
				}),
			);

		containerEl.appendChild(itemsContainer);
		renderItems();
	}

	// ─── Section D: Autocomplete Settings ────────────────────

	private renderAutocompleteSettings(containerEl: HTMLElement): void {
		const { autocomplete } = this.plugin.settings;

		new Setting(containerEl)
			.setName(t("settings.autocomplete"))
			.setHeading();

		const itemsContainer = containerEl.createDiv();

		const renderItems = () => {
			itemsContainer.empty();
			if (!autocomplete.enabled) return;

			new Setting(itemsContainer)
				.setName(t("settings.showIconPreviews"))
				.addToggle((tog) =>
					tog
						.setValue(autocomplete.showIconPreviews)
						.onChange(async (v) => {
							autocomplete.showIconPreviews = v;
							await this.plugin.saveSettings();
						}),
				);

			new Setting(itemsContainer)
				.setName(t("settings.showColorPreviews"))
				.addToggle((tog) =>
					tog
						.setValue(autocomplete.showColorPreviews)
						.onChange(async (v) => {
							autocomplete.showColorPreviews = v;
							await this.plugin.saveSettings();
						}),
				);
		};

		new Setting(containerEl)
			.setName(t("settings.enableAutocomplete"))
			.setDesc(t("settings.enableAutocompleteDesc"))
			.addToggle((tog) =>
				tog.setValue(autocomplete.enabled).onChange(async (v) => {
					autocomplete.enabled = v;
					await this.plugin.saveSettings();
					renderItems();
				}),
			);

		containerEl.appendChild(itemsContainer);
		renderItems();
	}

	// ─── Section F: Icon Source Settings ─────────────────────

	private renderIconSourceSettings(containerEl: HTMLElement): void {
		const { iconSources } = this.plugin.settings;

		new Setting(containerEl)
			.setName(t("settings.iconSources"))
			.setHeading();

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
			.setName(t("settings.materialWeightDefault"))
			.setDesc(t("settings.materialWeightDefaultDesc"))
			.addDropdown((d) => {
				const weights: Record<string, string> = {
					"100": "100 (Thin)",
					"200": "200 (Extra Light)",
					"300": "300 (Light)",
					"400": "400 (Regular)",
					"500": "500 (Medium)",
					"600": "600 (Semi Bold)",
					"700": "700 (Bold)",
				};
				d.addOptions(weights)
					.setValue(String(iconSources.materialWeightDefault))
					.onChange(async (v: string) => {
						iconSources.materialWeightDefault = parseInt(v, 10);
						await this.plugin.saveSettings();
					});
			});

		// ── Material icon cache management ──

		const cacheHeading = new Setting(containerEl)
			.setName(t("settings.materialCache"))
			.setDesc(t("settings.materialCacheDesc"));
		cacheHeading.settingEl.addClass("callout-studio-cache-heading");

		// SVG cache info
		const svgCount = this.plugin.registry.materialSvgCache.length;
		const svgSize = this.plugin.registry.getMaterialSvgCacheSize();
		const svgSizeStr =
			svgSize < 1024
				? `${svgSize} B`
				: `${(svgSize / 1024).toFixed(1)} KB`;

		const svgCacheSetting = new Setting(containerEl)
			.setName(t("settings.svgCache"))
			.setDesc(
				svgCount > 0
					? t("settings.svgCacheInfo", {
							count: String(svgCount),
							size: svgSizeStr,
						})
					: t("settings.svgCacheEmpty"),
			);

		if (svgCount > 0) {
			svgCacheSetting.addButton((btn) =>
				btn.setButtonText(t("settings.viewCachedSvgs")).onClick(() => {
					this.openSvgCacheModal();
				}),
			);
		}
	}

	private openSvgCacheModal(): void {
		const modal = new Modal(this.app);
		modal.titleEl.setText(t("settings.cachedSvgsTitle"));
		modal.modalEl.addClass("callout-studio-cache-modal");

		const cache = this.plugin.registry.materialSvgCache;

		if (cache.length === 0) {
			modal.contentEl.createEl("p", {
				text: t("settings.svgCacheEmpty"),
			});
			modal.open();
			return;
		}

		const grid = modal.contentEl.createDiv({
			cls: "callout-studio-cache-grid",
		});
		for (const entry of cache) {
			const cell = grid.createDiv({ cls: "callout-studio-cache-cell" });

			const iconEl = cell.createDiv({
				cls: "callout-studio-cache-icon",
			});
			const parser = new DOMParser();
			const doc = parser.parseFromString(entry.svg, "image/svg+xml");
			const svgEl = doc.documentElement;
			svgEl.setAttribute("fill", "currentColor");
			iconEl.appendChild(iconEl.doc.importNode(svgEl, true));

			const label = cell.createDiv({
				cls: "callout-studio-cache-label",
			});
			label.setText(entry.name);
			const meta = cell.createDiv({
				cls: "callout-studio-cache-meta",
			});
			meta.setText(`${entry.style} · ${entry.weight}`);
		}

		modal.open();
	}

	// ─── Section G: Color Mode Settings ──────────────────────

	private renderColorModeSettings(containerEl: HTMLElement): void {
		const { colorMode } = this.plugin.settings;

		new Setting(containerEl).setName(t("settings.colorMode")).setHeading();

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
				d.id.toLowerCase().includes(q) ||
				(d.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
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

	// ─── Section H: Language ─────────────────────────────────

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

	private renderResetSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t("settings.resetAll")).setHeading();

		new Setting(containerEl)
			.setDesc(t("settings.resetAllDesc"))
			.addButton((btn) =>
				btn
					.setButtonText(t("settings.resetAllButton"))
					.setWarning()
					.onClick(async () => {
						// Check if user callouts are in use in vault
						const userCallouts =
							this.plugin.registry.getUserDefined();
						const userIds = userCallouts.flatMap((c) => [
							c.id,
							...(c.aliases ?? []),
						]);

						let message = t("settings.resetAllConfirm");
						if (userIds.length > 0) {
							const { fileCount, totalCount } =
								await countCalloutUsages(this.app, userIds);
							if (fileCount > 0) {
								message =
									t("vault.resetAllInUse", {
										count: String(totalCount),
										files: String(fileCount),
									}) +
									"\n\n" +
									message;
							}
						}

						const confirmed = await new ConfirmModal(
							this.app,
							message,
						).confirm();
						if (!confirmed) return;
						this.plugin.registry.resetAll();
						this.plugin.cssInjector.inject();
						await this.plugin.saveSettings();
						new Notice(t("notice.resetAllDone"));
						this.display();
					}),
			);
	}
}
