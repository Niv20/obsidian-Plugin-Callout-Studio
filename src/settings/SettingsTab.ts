import {
	Modal,
	Notice,
	PluginSettingTab,
	Setting,
	setIcon,
	MarkdownView,
} from "obsidian";
import type { App, SliderComponent } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition } from "../types";
import { CalloutEditor } from "./CalloutEditor";
import { ConfirmModal } from "../utils/ConfirmModal";
import { ReplaceCalloutModal } from "../utils/ReplaceCalloutModal";
import { ImportReportModal } from "../utils/ImportReportModal";
import { validateImportPayload } from "../utils/importValidator";
import { renderColorCircles } from "../ui/ColorCircles";
import {
	countCalloutUsages,
	replaceCalloutIdsInVault,
	scanStringForUnknownCallouts,
} from "../utils/vaultCalloutScanner";
import { t } from "../i18n";

export class CalloutStudioSettingsTab extends PluginSettingTab {
	plugin: CalloutStudioPlugin;
	private userListEl: HTMLElement | null = null;
	private builtInListEl: HTMLElement | null = null;
	private registrySubscription: (() => void) | null = null;
	private materialSvgUnsubscribe: (() => void) | null = null;
	private refreshTimer: number | null = null;

	constructor(app: App, plugin: CalloutStudioPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("callout-studio-settings");

		// Pick up callout IDs typed in open editors that haven't been saved
		// yet. Cheap: scans only in-memory buffers of open Markdown leaves.
		this.scanOpenEditorsForUnknownCallouts();

		// Subscribe once to registry changes so the tab refreshes whenever a
		// callout is created/edited/removed from anywhere (autocomplete,
		// command, vault scan, …). Debounced to avoid flicker during slider
		// drags.
		if (!this.registrySubscription) {
			const sub = () => {
				if (!containerEl.isConnected) return;
				if (this.refreshTimer !== null) {
					window.clearTimeout(this.refreshTimer);
				}
				this.refreshTimer = window.setTimeout(() => {
					this.refreshTimer = null;
					if (containerEl.isConnected) this.refreshLists();
				}, 60);
			};
			this.plugin.registry.onChange(sub);
			this.registrySubscription = sub;
		}

		// Refresh row icons whenever a Material SVG finishes downloading or
		// is marked as failed, so users see updated state without restarting.
		if (!this.materialSvgUnsubscribe) {
			this.materialSvgUnsubscribe = this.plugin.onMaterialSvgChange(
				() => {
					if (!containerEl.isConnected) return;
					if (this.refreshTimer !== null) {
						window.clearTimeout(this.refreshTimer);
					}
					this.refreshTimer = window.setTimeout(() => {
						this.refreshTimer = null;
						if (containerEl.isConnected) this.refreshLists();
					}, 60);
				},
			);
		}

		this.renderCalloutTypesSection(containerEl);
		this.renderBuiltInCalloutsSection(containerEl);
		this.renderFallbackCalloutSection(containerEl);
		this.renderGlobalStyleSection(containerEl);
		this.renderAutocompleteSettings(containerEl);
		this.renderContextMenuSettings(containerEl);
		this.renderIconSourceSettings(containerEl);
		this.renderImportExportSection(containerEl);
		this.renderResetSection(containerEl);
	}

	hide(): void {
		if (this.registrySubscription) {
			this.plugin.registry.offChange(this.registrySubscription);
			this.registrySubscription = null;
		}
		if (this.materialSvgUnsubscribe) {
			this.materialSvgUnsubscribe();
			this.materialSvgUnsubscribe = null;
		}
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}
		super.hide();
	}

	/**
	 * Scan in-memory buffers of all open Markdown editors for callout IDs not
	 * yet known to the registry. Used when opening Settings so users see
	 * IDs they typed but haven't saved yet. Silent; very cheap.
	 */
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
			for (const id of scanStringForUnknownCallouts(content, known)) {
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

	// ─── Section A: My Callout Types ─────────────────────────

	private renderCalloutTypesSection(containerEl: HTMLElement): void {
		// Top header: large "Callout Studio" title
		const headerSetting = new Setting(containerEl)
			.setName(t("settings.title"))
			.setHeading();
		headerSetting.settingEl.addClass("cs-header-row");

		// Subheader: "My callout types" + Add new (button omitted when empty)
		const subSetting = new Setting(containerEl)
			.setName(t("settings.myCalloutTypes"))
			.setHeading();
		subSetting.settingEl.addClass("cs-subheader-row");
		subSetting.addButton((btn) =>
			btn
				.setButtonText(t("settings.addNewCallout"))
				.setCta()
				.onClick(async () => {
					const editor = new CalloutEditor(this.plugin);
					await editor.open();
					this.display();
				}),
		);

		// User-defined callout list container
		this.userListEl = containerEl.createDiv();
		this.renderUserList();
	}

	private renderUserList(): void {
		if (!this.userListEl) return;
		this.userListEl.empty();

		const userCallouts = this.plugin.registry.getUserDefined();
		if (userCallouts.length === 0) {
			this.userListEl.createDiv({
				cls: "callout-studio-empty-state",
				text: t("settings.noCalloutsNow"),
			});
			return;
		}

		const listEl = this.userListEl.createDiv({
			cls: "callout-studio-callout-list",
		});
		for (const def of userCallouts) {
			this.renderCalloutRow(listEl, def, false);
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
		const listEl = this.builtInListEl.createDiv({
			cls: "callout-studio-callout-list",
		});

		for (const def of builtInCallouts) {
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
		const nameLine = infoEl.createDiv({
			cls: "callout-studio-row-name-line",
		});
		nameLine.createSpan({
			cls: "callout-studio-row-name",
			text: def.displayName,
			attr: { title: def.displayName },
		});
		if (def.source === "fallback") {
			nameLine.createSpan({
				cls: "cs-fallback-tag",
				text: t("settings.fallbackTag"),
			});
		}
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

		// Color swatches — two overlapping circles (light + dark)
		const colorsEl = row.createDiv({ cls: "callout-studio-row-colors" });
		renderColorCircles(colorsEl, def.colorLight, def.colorDark, {
			size: 18,
			ariaLabel: t("settings.colorPairAria", {
				light: def.colorLight,
				dark: def.colorDark,
			}),
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
			const isFallback =
				def.id === this.plugin.settings.fallbackCalloutId;
			const deleteBtn = buttonsEl.createEl("button", {
				cls: "callout-studio-delete-btn",
				attr: {
					"aria-label": isFallback
						? t("settings.swapAria", { name: def.displayName })
						: t("settings.deleteAria", {
								name: def.displayName,
							}),
				},
			});
			setIcon(deleteBtn, isFallback ? "arrow-left-right" : "trash-2");
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
			const isFallback =
				def.id === this.plugin.settings.fallbackCalloutId;
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
				isFallback,
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
				this.plugin.registry.remove(def.id);
			} else {
				// "delete without replacing" — degrade user rows to fallback,
				// fully remove fallback-source rows
				if (def.source === "user") {
					this.plugin.registry.update(def.id, {
						source: "fallback",
						aliases: undefined,
						bgColorLight: undefined,
						bgColorDark: undefined,
						textColorLight: undefined,
						textColorDark: undefined,
						iconOffsetX: undefined,
						iconOffsetY: undefined,
						iconSize: undefined,
					});
				} else {
					this.plugin.registry.remove(def.id);
				}
			}
		} else {
			const confirmed = await new ConfirmModal(
				this.app,
				t("settings.deleteConfirm", { name: def.displayName }),
			).confirm();
			if (!confirmed) return;
			this.plugin.registry.remove(def.id);
		}

		// Drop unused Material SVGs after the deletion
		this.plugin.registry.cleanupUnusedMaterialSvgs();
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
		container.removeClass("is-loading");
		container.removeClass("is-error");
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
					const failed = this.plugin.hasMaterialSvgFailed(
						def.icon.value,
						def.icon.style ?? "outlined",
						def.icon.weight ?? 400,
					);
					if (failed) {
						setIcon(container, "circle-help");
						container.addClass("is-error");
						container.setAttribute(
							"aria-label",
							t("notice.iconDownloadFailed", {
								name: def.icon.value,
							}),
						);
					} else {
						setIcon(container, "loader-2");
						container.addClass("is-loading");
					}
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

		const addSliderRow = (
			parentEl: HTMLElement,
			label: string,
			initialValue: string,
			configure: (slider: SliderComponent, valueEl: HTMLElement) => void,
		): void => {
			const row = parentEl.createDiv({
				cls: "callout-studio-slider-row",
			});
			const labelEl = row.createDiv({
				cls: "callout-studio-slider-label",
			});
			labelEl.createSpan({ text: label });
			const valueEl = labelEl.createSpan({
				cls: "callout-studio-slider-value",
				text: initialValue,
			});

			new Setting(row).addSlider((slider) => configure(slider, valueEl));
		};

		// Two-column wrapper: preview (sticky) | controls (scrollable)
		const wrapper = containerEl.createDiv({
			cls: "callout-studio-preview-panel cs-global-style-wrapper",
		});

		// ── Left: live preview (sticky) ──
		const previewCol = wrapper.createDiv({
			cls: "callout-studio-preview-col cs-global-preview-col",
		});
		const previewContainer = previewCol.createDiv({
			cls: "callout-studio-preview-container cs-global-preview-card",
		});
		const previewHeader = previewContainer.createDiv({
			cls: "callout-studio-preview-header",
		});
		previewHeader.createSpan({ text: t("settings.previewTitle") });

		const previewCard = previewContainer.createDiv({
			cls: "callout-studio-preview cs-global-preview-body",
		});

		const updatePreview = () => {
			previewCard.empty();
			const callout = previewCard.createDiv({
				cls: "callout cs-global-preview-callout cs-global-preview-locked",
				attr: { "data-callout": "cs-preview" },
			});

			// Apply live styles via CSS custom props.
			// Force a fixed gray palette so the preview never inherits the
			// fallback callout's color.
			callout.setCssProps({
				"--cs-preview-radius": `${globalStyle.borderRadius}px`,
				"--callout-color": "136, 136, 136",
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

			// Title row — always uses a square icon placeholder (gray)
			const titleRow = callout.createDiv({ cls: "callout-title" });
			titleRow.createDiv({
				cls: "callout-icon cs-preview-square-icon",
			});
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
		};

		updatePreview();

		// ── Right: controls ──
		const controlsCol = wrapper.createDiv({
			cls: "callout-studio-adjust-col cs-global-controls-col",
		});

		// ── Borders group ──
		const borderGroupEl = controlsCol.createDiv({
			cls: "callout-studio-adjust-section cs-settings-group",
		});
		borderGroupEl.createDiv({
			cls: "callout-studio-adjust-header cs-settings-group-header",
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
			addSliderRow(
				borderGroupEl,
				t("settings.borderWidth"),
				`${globalStyle.borderWidth}px`,
				(s, valueEl) => {
					s.setLimits(1, 4, 0.5).setValue(globalStyle.borderWidth);
					s.sliderEl.addEventListener("input", () => {
						const v =
							Math.round(parseFloat(s.sliderEl.value) * 10) / 10;
						globalStyle.borderWidth = v;
						valueEl.textContent = `${v}px`;
						updatePreview();
						this.plugin.cssInjector.scheduleInject();
					});
					s.onChange(async (v) => {
						globalStyle.borderWidth = Math.round(v * 10) / 10;
						await this.plugin.saveSettings();
						this.plugin.cssInjector.inject();
					});
				},
			);
		}

		// ── Font scale group ──
		const fontGroupEl = controlsCol.createDiv({
			cls: "callout-studio-adjust-section cs-settings-group",
		});
		fontGroupEl.createDiv({
			cls: "callout-studio-adjust-header cs-settings-group-header",
			text: t("settings.fontScaleGroup"),
		});

		// Title scale slider
		addSliderRow(
			fontGroupEl,
			t("settings.titleScale"),
			`×${globalStyle.titleScale.toFixed(2)}`,
			(s, valueEl) => {
				s.setLimits(0.5, 1.5, 0.05).setValue(globalStyle.titleScale);
				s.sliderEl.addEventListener("input", () => {
					const v =
						Math.round(parseFloat(s.sliderEl.value) * 100) / 100;
					globalStyle.titleScale = v;
					valueEl.textContent = `×${v.toFixed(2)}`;
					updatePreview();
					this.plugin.cssInjector.scheduleInject();
				});
				s.onChange(async (v) => {
					globalStyle.titleScale = Math.round(v * 100) / 100;
					await this.plugin.saveSettings();
					this.plugin.cssInjector.inject();
				});
			},
		);

		// Content scale slider
		addSliderRow(
			fontGroupEl,
			t("settings.contentScale"),
			`×${globalStyle.contentScale.toFixed(2)}`,
			(s, valueEl) => {
				s.setLimits(0.5, 1.5, 0.05).setValue(globalStyle.contentScale);
				s.sliderEl.addEventListener("input", () => {
					const v =
						Math.round(parseFloat(s.sliderEl.value) * 100) / 100;
					globalStyle.contentScale = v;
					valueEl.textContent = `×${v.toFixed(2)}`;
					updatePreview();
					this.plugin.cssInjector.scheduleInject();
				});
				s.onChange(async (v) => {
					globalStyle.contentScale = Math.round(v * 100) / 100;
					await this.plugin.saveSettings();
					this.plugin.cssInjector.inject();
				});
			},
		);

		// ── Shape group ──
		const shapeGroupEl = controlsCol.createDiv({
			cls: "callout-studio-adjust-section cs-settings-group",
		});
		shapeGroupEl.createDiv({
			cls: "callout-studio-adjust-header cs-settings-group-header",
			text: t("settings.shapeGroup"),
		});

		// Border radius slider
		addSliderRow(
			shapeGroupEl,
			t("settings.borderRadius"),
			`${globalStyle.borderRadius}px`,
			(s, valueEl) => {
				s.setLimits(0, 24, 1).setValue(globalStyle.borderRadius);
				s.sliderEl.addEventListener("input", () => {
					const v = parseInt(s.sliderEl.value, 10);
					globalStyle.borderRadius = v;
					valueEl.textContent = `${v}px`;
					updatePreview();
					this.plugin.cssInjector.scheduleInject();
				});
				s.onChange(async (v) => {
					globalStyle.borderRadius = v;
					await this.plugin.saveSettings();
					this.plugin.cssInjector.inject();
				});
			},
		);
	}

	// ─── Section C: Context Menu Settings ────────────────────

	private renderContextMenuSettings(containerEl: HTMLElement): void {
		const { contextMenu } = this.plugin.settings;

		new Setting(containerEl)
			.setName(t("settings.contextMenu"))
			.setHeading();

		const itemsContainer = containerEl.createDiv();

		const renderItems = () => {
			itemsContainer.empty();
			if (!contextMenu.enabled) return;

			new Setting(itemsContainer)
				.setName(t("settings.showEditCallout"))
				.addToggle((tog) =>
					tog
						.setValue(contextMenu.showEditCallout)
						.onChange(async (v) => {
							contextMenu.showEditCallout = v;
							await this.plugin.saveSettings();
						}),
				);

			new Setting(itemsContainer)
				.setName(t("settings.showOpenSettings"))
				.addToggle((tog) =>
					tog
						.setValue(contextMenu.showOpenSettings)
						.onChange(async (v) => {
							contextMenu.showOpenSettings = v;
							await this.plugin.saveSettings();
						}),
				);

			new Setting(itemsContainer)
				.setName(t("settings.showCopyMarkdown"))
				.addToggle((tog) =>
					tog
						.setValue(contextMenu.showCopyMarkdown)
						.onChange(async (v) => {
							contextMenu.showCopyMarkdown = v;
							await this.plugin.saveSettings();
						}),
				);
		};

		new Setting(containerEl)
			.setName(t("settings.enableContextMenu"))
			.setDesc(t("settings.enableContextMenuDesc"))
			.addToggle((tog) =>
				tog.setValue(contextMenu.enabled).onChange(async (v) => {
					contextMenu.enabled = v;
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

		// Single combined row: name + count/size description + View button.
		const svgCount = this.plugin.registry.materialSvgCache.length;
		const svgSize = this.plugin.registry.getMaterialSvgCacheSize();
		const svgSizeStr =
			svgSize < 1024
				? `${svgSize} B`
				: `${(svgSize / 1024).toFixed(1)} KB`;

		const cacheSetting = new Setting(containerEl)
			.setName(t("settings.materialCache"))
			.setDesc(
				svgCount > 0
					? t("settings.svgCacheInfo", {
							count: String(svgCount),
							size: svgSizeStr,
						})
					: t("settings.svgCacheEmpty"),
			);
		cacheSetting.settingEl.addClass("callout-studio-cache-heading");

		if (svgCount > 0) {
			cacheSetting.addButton((btn) =>
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

	// ─── Helpers ─────────────────────────────────────────────

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

			// 1. Read + parse. Surface parse failures via the report modal too,
			//    so the user gets a centered, readable explanation rather than
			//    a tiny corner notice.
			let parsed: unknown;
			try {
				const text = await file.text();
				parsed = JSON.parse(text);
			} catch {
				await new ImportReportModal(
					this.app,
					[
						{
							index: -1,
							entryLabel: "",
							level: "error",
							messageKey: "import.err.parseFailed",
						},
					],
					0,
					0,
					true,
				).prompt();
				return;
			}

			// 2. Run the strict structural validator.
			const result = validateImportPayload(parsed, this.plugin.registry);

			// 3. If anything went wrong, show the report modal and let the
			//    user decide whether to import only the valid entries.
			if (result.issues.length > 0 || result.fatal) {
				const total = Array.isArray(parsed) ? parsed.length : 0;
				const choice = await new ImportReportModal(
					this.app,
					result.issues,
					result.validDefs.length,
					total,
					result.fatal,
				).prompt();
				if (choice === "cancel") return;
			}

			// 4. Import only sanitized, fully-valid definitions.
			const defs = result.validDefs;
			if (defs.length === 0) {
				new Notice(t("notice.noNewJSON"));
				return;
			}

			let imported = 0;
			let overwritten = 0;
			for (const def of defs) {
				if (this.plugin.registry.has(def.id)) {
					this.plugin.registry.update(def.id, def);
					overwritten++;
					imported++;
				} else {
					const added = this.plugin.registry.add(def);
					if (added) imported++;
				}
			}
			if (imported > 0) {
				if (overwritten > 0) {
					new Notice(
						t("settings.importConflictNotice", {
							count: imported,
							overwritten,
						}),
					);
				} else {
					new Notice(t("notice.importedJSON", { count: imported }));
				}
				this.display();
				// Kick off Material SVG downloads for any imported icons
				// not already cached. The list re-renders automatically
				// via the onMaterialSvgChange listener as each finishes.
				for (const def of defs) {
					if (def.icon.type === "material") {
						void this.plugin.cacheMaterialSvg(def.icon);
					}
				}
			} else {
				new Notice(t("notice.noNewJSON"));
			}
		});
		input.click();
	}

	// ─── Section: Import / Export ────────────────────────────

	private renderImportExportSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("settings.importExport"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("settings.import"))
			.setDesc(t("settings.importDesc"))
			.addButton((btn) => {
				btn.setButtonText(t("settings.import"))
					.setIcon("download")
					.onClick(() => this.importFromJSON());
				btn.buttonEl.addClass("cs-settings-neutral-btn");
			});

		new Setting(containerEl)
			.setName(t("settings.export"))
			.setDesc(t("settings.exportDesc"))
			.addButton((btn) => {
				btn.setButtonText(t("settings.export"))
					.setIcon("upload")
					.onClick(() => this.exportCallouts());
				btn.buttonEl.addClass("cs-settings-neutral-btn");
			});
	}

	private async runVaultRescan(): Promise<void> {
		const added = await this.plugin.runVaultScan(false);
		new Notice(
			t("settings.rescanComplete", {
				count: String(added),
			}),
		);
		this.display();
	}

	// ─── Section H: (Language section removed; auto-detected) ─────────

	private renderResetSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t("settings.resetAll")).setHeading();

		new Setting(containerEl)
			.setName(t("settings.rescanVault"))
			.setDesc(t("settings.rescanVaultDesc"))
			.addButton((btn) => {
				btn.setButtonText(t("settings.rescanVaultHintAction")).onClick(
					() => {
						void this.runVaultRescan();
					},
				);
				btn.buttonEl.addClass("cs-settings-neutral-btn");
			});

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
