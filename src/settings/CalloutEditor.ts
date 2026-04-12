import { Modal, Notice, Setting, setIcon, SliderComponent } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition, CalloutIcon } from "../types";
import { IconPicker } from "./IconPicker";
import { materialFontFamily } from "../utils/iconLoader";
import { blendHex } from "../utils/colorUtils";
import {
	COLOR_PALETTES,
	OBSIDIAN_PALETTES,
	EXTRA_PALETTES,
} from "../utils/colorPalettes";
import { t } from "../i18n";
import { TagInput } from "../ui/TagInput";
import { ConfirmModal } from "../utils/ConfirmModal";
import {
	countCalloutUsages,
	replaceCalloutIdsInVault,
} from "../utils/vaultCalloutScanner";

function generateId(displayName: string): string {
	return displayName
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export class CalloutEditor extends Modal {
	private plugin: CalloutStudioPlugin;
	private existingId: string | null;
	private isBuiltIn: boolean;
	private resolve: ((result: CalloutDefinition | null) => void) | null = null;

	// Form state
	private displayName: string;
	private calloutId: string;
	private icon: CalloutIcon;
	private colorLight: string;
	private colorDark: string;
	private bgColorLight: string;
	private bgColorDark: string;
	private textColorLight: string;
	private textColorDark: string;
	private foldable: boolean;
	private defaultFolded: boolean;
	private iconOffsetX: number;
	private iconOffsetY: number;
	private iconSize: number;
	private aliases: string[];
	private previewEl: HTMLElement | null = null;
	private previewDarkMode = false;
	private idsTagInput: TagInput | null = null;
	private saveBtn: HTMLButtonElement | null = null;
	private initialSnapshot: string = "";

	constructor(plugin: CalloutStudioPlugin, existing?: CalloutDefinition) {
		super(plugin.app);
		this.plugin = plugin;
		this.existingId = existing?.id ?? null;
		this.isBuiltIn = existing?.builtIn ?? false;

		this.displayName = existing?.displayName ?? "";
		this.calloutId = existing?.id ?? "";
		this.icon = existing?.icon
			? { ...existing.icon }
			: { type: "lucide", value: "pencil" };
		this.colorLight = existing?.colorLight ?? "#448aff";
		this.colorDark = existing?.colorDark ?? "#448aff";
		this.bgColorLight =
			existing?.bgColorLight ??
			blendHex(this.colorLight, "#ffffff", 0.88);
		this.bgColorDark =
			existing?.bgColorDark ?? blendHex(this.colorDark, "#1e1e1e", 0.88);
		this.textColorLight = existing?.textColorLight ?? "#1a1a1a";
		this.textColorDark = existing?.textColorDark ?? "#e0e0e0";
		this.foldable = existing?.foldable ?? true;
		this.defaultFolded = existing?.defaultFolded ?? false;
		this.iconOffsetX = existing?.iconOffsetX ?? 0;
		this.iconOffsetY = existing?.iconOffsetY ?? 0;
		this.iconSize = existing?.iconSize ?? 1;
		this.aliases = [...(existing?.aliases ?? [])];
	}

	// eslint-disable-next-line @typescript-eslint/no-misused-promises -- intentional Promise-returning override for modal result
	open(): Promise<CalloutDefinition | null> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			super.open();
		});
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("callout-studio-editor");
		this.modalEl.addClass("callout-studio-editor-modal");

		// Snapshot initial state for dirty-checking
		this.initialSnapshot = this.stateSnapshot();

		this.setTitle(
			this.existingId ? t("editor.editCallout") : t("editor.newCallout"),
		);

		// Display Name
		new Setting(contentEl)
			.setName(t("editor.displayName"))
			.setDesc(
				this.isBuiltIn
					? t("editor.displayNameBuiltIn")
					: t("editor.displayNameDesc"),
			)
			.addText((text) => {
				text.setPlaceholder(
					t("editor.displayNamePlaceholder"),
				).setValue(this.displayName);
				if (this.isBuiltIn) {
					text.setDisabled(true);
				} else {
					text.onChange((value) => {
						this.displayName = value;
						if (!this.existingId) {
							this.calloutId = generateId(value);
							if (this.idsTagInput) {
								const currentTags = this.idsTagInput.getTags();
								if (currentTags.length === 0) {
									this.idsTagInput.setTags([this.calloutId]);
								} else {
									currentTags[0] = this.calloutId;
									this.idsTagInput.setTags(currentTags);
								}
							}
							this.updateIdWarning();
						}
						this.updatePreview();
						this.updateSaveState();
					});
				}
				if (!this.isBuiltIn) text.inputEl.focus();
			});

		// Callout IDs (primary + aliases) — unified tag input
		const initialIds = [this.calloutId, ...this.aliases].filter(Boolean);
		const idsSetting = new Setting(contentEl)
			.setName(t("editor.calloutIds"))
			.setDesc(t("editor.calloutIdsDesc"));

		// Error element lives in the left description area
		const idsErrorEl = idsSetting.descEl.createDiv();

		this.idsTagInput = new TagInput(idsSetting.controlEl, {
			initialTags: initialIds,
			placeholder: t("editor.calloutIdsPlaceholder"),
			errorEl: idsErrorEl,
			onChange: (tags) => {
				this.calloutId = tags[0] ?? "";
				this.aliases = tags.slice(1);
				this.updateIdWarning();
				this.updatePreview();
				this.updateSaveState();
			},
			validate: (tag) => {
				// Check if this ID already exists in the registry (and isn't the one we're editing)
				if (this.plugin.registry.has(tag) && tag !== this.existingId) {
					return t("editor.idConflict");
				}
				// Also check if ID is an alias of another callout
				const conflict = this.plugin.registry.findByAlias(tag);
				if (conflict && conflict.id !== this.existingId) {
					return t("editor.idConflict");
				}
				return null;
			},
		});

		// Show initial warning if no ID
		this.updateIdWarning();

		// Icon
		const iconSetting = new Setting(contentEl)
			.setName(t("editor.icon"))
			.setDesc(this.getIconLabel());

		// Icon preview
		const iconPreviewEl = iconSetting.controlEl.createDiv(
			"callout-studio-icon-preview",
		);
		this.renderIconPreview(iconPreviewEl);

		iconSetting.addButton((btn) => {
			btn.setButtonText("Pick icon").onClick(async () => {
				const picker = new IconPicker(this.plugin, this.icon);
				const result = await picker.open();
				if (result) {
					this.icon = result;
					iconSetting.setDesc(this.getIconLabel());
					iconPreviewEl.empty();
					this.renderIconPreview(iconPreviewEl);
					this.updatePreview();
				}
			});
		});

		// ── Preview + Adjustments Panel (two-column) ────────────────
		const previewPanel = contentEl.createDiv({
			cls: "callout-studio-preview-panel",
		});

		// Left column: Live Preview
		const previewCol = previewPanel.createDiv({
			cls: "callout-studio-preview-col",
		});
		const previewContainer = previewCol.createDiv({
			cls: "callout-studio-preview-container",
		});
		const previewHeader = previewContainer.createDiv({
			cls: "callout-studio-preview-header",
		});
		previewHeader.createSpan({ text: t("editor.livePreview") });

		// Segmented Light/Dark toggle
		const segmented = previewHeader.createDiv({
			cls: "callout-studio-segmented-toggle",
		});
		const lightBtn = segmented.createEl("button", {
			cls: "callout-studio-seg-btn is-active",
			text: t("editor.light"),
		});
		const darkBtn = segmented.createEl("button", {
			cls: "callout-studio-seg-btn",
			text: t("editor.dark"),
		});
		lightBtn.addEventListener("click", () => {
			this.previewDarkMode = false;
			lightBtn.addClass("is-active");
			darkBtn.removeClass("is-active");
			this.updatePreview();
		});
		darkBtn.addEventListener("click", () => {
			this.previewDarkMode = true;
			darkBtn.addClass("is-active");
			lightBtn.removeClass("is-active");
			this.updatePreview();
		});

		this.previewEl = previewContainer.createDiv({
			cls: "callout-studio-preview",
		});
		this.updatePreview();

		// Right column: Adjustments
		const adjustCol = previewPanel.createDiv({
			cls: "callout-studio-adjust-col",
		});

		// ── Icon adjustment section ──
		const iconAdjust = adjustCol.createDiv({
			cls: "callout-studio-adjust-section",
		});
		iconAdjust.createDiv({
			cls: "callout-studio-adjust-header",
			text: t("editor.iconAdjustment"),
		});

		// Size slider
		const sizeRow = iconAdjust.createDiv({
			cls: "callout-studio-slider-row",
		});
		const sizeLabel = sizeRow.createDiv({
			cls: "callout-studio-slider-label",
		});
		sizeLabel.createSpan({ text: t("editor.size") });
		const sizeValue = sizeLabel.createSpan({
			cls: "callout-studio-slider-value",
			text: `${Math.round(this.iconSize * 100)}%`,
		});
		new Setting(sizeRow).addSlider((slider: SliderComponent) => {
			slider
				.setLimits(50, 200, 5)
				.setValue(Math.round(this.iconSize * 100))
				.setInstant(true)
				.onChange((value: number) => {
					this.iconSize = value / 100;
					sizeValue.textContent = `${value}%`;
					this.updatePreview();
				});
		});

		// Horizontal offset slider
		const hRow = iconAdjust.createDiv({
			cls: "callout-studio-slider-row",
		});
		const hLabel = hRow.createDiv({
			cls: "callout-studio-slider-label",
		});
		hLabel.createSpan({ text: t("editor.horizontalOffset") });
		const hValue = hLabel.createSpan({
			cls: "callout-studio-slider-value",
			text: `${this.iconOffsetX}px`,
		});
		new Setting(hRow).addSlider((slider: SliderComponent) => {
			slider
				.setLimits(-10, 10, 1)
				.setValue(this.iconOffsetX)
				.setInstant(true)
				.onChange((value: number) => {
					this.iconOffsetX = value;
					hValue.textContent = `${value}px`;
					this.updatePreview();
				});
		});

		// Vertical offset slider
		const vRow = iconAdjust.createDiv({
			cls: "callout-studio-slider-row",
		});
		const vLabel = vRow.createDiv({
			cls: "callout-studio-slider-label",
		});
		vLabel.createSpan({ text: t("editor.verticalOffset") });
		const vValue = vLabel.createSpan({
			cls: "callout-studio-slider-value",
			text: `${this.iconOffsetY}px`,
		});
		new Setting(vRow).addSlider((slider: SliderComponent) => {
			slider
				.setLimits(-10, 10, 1)
				.setValue(this.iconOffsetY)
				.setInstant(true)
				.onChange((value: number) => {
					this.iconOffsetY = value;
					vValue.textContent = `${value}px`;
					this.updatePreview();
				});
		});

		// ── Colors section ──
		const colorsSection = adjustCol.createDiv({
			cls: "callout-studio-adjust-section",
		});
		colorsSection.createDiv({
			cls: "callout-studio-adjust-header",
			text: t("editor.colors"),
		});

		// ── Palette Presets ──
		const paletteContainer = colorsSection.createDiv({
			cls: "cs-palette-container",
		});
		paletteContainer.createDiv({
			cls: "cs-palette-label",
			text: t("editor.palettes"),
		});

		const paletteRow = paletteContainer.createDiv({
			cls: "cs-palette-row",
		});

		const colorGrid = colorsSection.createDiv({
			cls: "callout-studio-color-grid",
		});

		// Track color inputs so palette selection can update them
		const colorInputs: {
			bgLight?: HTMLInputElement;
			bgDark?: HTMLInputElement;
			textLight?: HTMLInputElement;
			textDark?: HTMLInputElement;
			accentLight?: HTMLInputElement;
			accentDark?: HTMLInputElement;
		} = {};

		// Build palette dropdown
		const paletteSelect = paletteRow.createEl("select", {
			cls: "cs-palette-dropdown",
		});

		// Default "none" option
		paletteSelect.createEl("option", {
			text: t("editor.paletteNone"),
			value: "",
		});

		// Obsidian group
		const obsidianGroup = paletteSelect.createEl("optgroup", {
			attr: { label: t("editor.paletteGroupObsidian") },
		});
		for (const p of OBSIDIAN_PALETTES) {
			obsidianGroup.createEl("option", { text: p.name, value: p.id });
		}

		// Extra presets group
		const presetsGroup = paletteSelect.createEl("optgroup", {
			attr: { label: t("editor.paletteGroupPresets") },
		});
		for (const p of EXTRA_PALETTES) {
			presetsGroup.createEl("option", { text: p.name, value: p.id });
		}

		// Color preview swatch next to dropdown
		const previewSwatch = paletteRow.createDiv({
			cls: "cs-palette-preview-swatch",
		});
		const updatePalettePreview = (
			palette: { colorLight: string; colorDark: string } | null,
		) => {
			previewSwatch.empty();
			if (!palette) return;
			const c1 = previewSwatch.createDiv({ cls: "cs-palette-circle" });
			c1.style.backgroundColor = palette.colorLight;
			const c2 = previewSwatch.createDiv({ cls: "cs-palette-circle" });
			c2.style.backgroundColor = palette.colorDark;
		};

		paletteSelect.addEventListener("change", () => {
			const selected = COLOR_PALETTES.find(
				(p) => p.id === paletteSelect.value,
			);
			if (!selected) {
				updatePalettePreview(null);
				return;
			}

			this.colorLight = selected.colorLight;
			this.colorDark = selected.colorDark;
			if (selected.bgColorLight !== undefined) {
				this.bgColorLight = selected.bgColorLight;
			}
			if (selected.bgColorDark !== undefined) {
				this.bgColorDark = selected.bgColorDark;
			}
			// Update color inputs
			if (colorInputs.accentLight)
				colorInputs.accentLight.value = this.colorLight;
			if (colorInputs.accentDark)
				colorInputs.accentDark.value = this.colorDark;
			if (colorInputs.bgLight)
				colorInputs.bgLight.value = this.bgColorLight;
			if (colorInputs.bgDark) colorInputs.bgDark.value = this.bgColorDark;

			updatePalettePreview(selected);
			this.updatePreview();
		});

		// Header row
		const gridHeader = colorGrid.createDiv({
			cls: "callout-studio-color-grid-header",
		});
		gridHeader.createSpan({ text: "" }); // spacer
		gridHeader.createSpan({ text: t("editor.light") });
		gridHeader.createSpan({ text: t("editor.dark") });

		// Background row
		const bgInputs = this.addColorRow(
			colorGrid,
			t("editor.background"),
			this.bgColorLight,
			this.bgColorDark,
			(light, dark) => {
				if (light !== undefined) this.bgColorLight = light;
				if (dark !== undefined) this.bgColorDark = dark;
				this.updatePreview();
			},
		);
		colorInputs.bgLight = bgInputs.light;
		colorInputs.bgDark = bgInputs.dark;

		// Text row
		const textInputs = this.addColorRow(
			colorGrid,
			t("editor.text"),
			this.textColorLight,
			this.textColorDark,
			(light, dark) => {
				if (light !== undefined) this.textColorLight = light;
				if (dark !== undefined) this.textColorDark = dark;
				this.updatePreview();
			},
		);
		colorInputs.textLight = textInputs.light;
		colorInputs.textDark = textInputs.dark;

		// Icon/accent row
		const accentInputs = this.addColorRow(
			colorGrid,
			t("editor.iconColor"),
			this.colorLight,
			this.colorDark,
			(light, dark) => {
				if (light !== undefined) this.colorLight = light;
				if (dark !== undefined) this.colorDark = dark;
				this.updatePreview();
			},
		);
		colorInputs.accentLight = accentInputs.light;
		colorInputs.accentDark = accentInputs.dark;

		// Foldable
		new Setting(contentEl)
			.setName(t("editor.foldable"))
			.setDesc(t("editor.foldableDesc"))
			.addToggle((toggle) => {
				toggle.setValue(this.foldable).onChange((value) => {
					this.foldable = value;
					this.updateSaveState();
				});
			});

		// Default Folded
		new Setting(contentEl)
			.setName(t("editor.defaultFolded"))
			.setDesc(t("editor.defaultFoldedDesc"))
			.addToggle((toggle) => {
				toggle.setValue(this.defaultFolded).onChange((value) => {
					this.defaultFolded = value;
					this.updateSaveState();
				});
			});

		// Action buttons — sticky bottom bar
		const buttonContainer = this.modalEl.createDiv({
			cls: "callout-studio-editor-buttons",
		});

		const cancelBtn = buttonContainer.createEl("button", {
			text: t("editor.cancel"),
		});
		cancelBtn.addEventListener("click", () => {
			this.close();
		});

		const saveBtn = buttonContainer.createEl("button", {
			text: this.existingId
				? t("editor.saveChanges")
				: t("editor.createCallout"),
			cls: "mod-cta",
		});
		this.saveBtn = saveBtn;
		saveBtn.addEventListener("click", () => {
			void this.save();
		});

		// Set initial save button state
		this.updateSaveState();
	}

	/**
	 * Adds a row to the colour grid with a label plus Light and Dark colour inputs.
	 */
	private addColorRow(
		grid: HTMLElement,
		label: string,
		lightVal: string,
		darkVal: string,
		onChange: (light?: string, dark?: string) => void,
	): { light: HTMLInputElement; dark: HTMLInputElement } {
		const row = grid.createDiv({ cls: "callout-studio-color-row" });
		row.createSpan({ text: label });

		const lightInput = row.createEl("input", {
			type: "color",
			value: lightVal,
			cls: "callout-studio-color-input",
		});
		lightInput.addEventListener("input", () => {
			onChange(lightInput.value, undefined);
		});

		const darkInput = row.createEl("input", {
			type: "color",
			value: darkVal,
			cls: "callout-studio-color-input",
		});
		darkInput.addEventListener("input", () => {
			onChange(undefined, darkInput.value);
		});

		return { light: lightInput, dark: darkInput };
	}

	private stateSnapshot(): string {
		return JSON.stringify({
			displayName: this.displayName,
			calloutId: this.calloutId,
			icon: this.icon,
			colorLight: this.colorLight,
			colorDark: this.colorDark,
			bgColorLight: this.bgColorLight,
			bgColorDark: this.bgColorDark,
			textColorLight: this.textColorLight,
			textColorDark: this.textColorDark,
			foldable: this.foldable,
			defaultFolded: this.defaultFolded,
			iconOffsetX: this.iconOffsetX,
			iconOffsetY: this.iconOffsetY,
			iconSize: this.iconSize,
			aliases: this.aliases,
		});
	}

	private isStateValid(): boolean {
		// Must have at least one ID
		if (!this.calloutId) return false;
		// Custom callouts must have a display name
		if (!this.isBuiltIn && !this.displayName.trim()) return false;
		// ID must not conflict with existing callouts
		const isIdChanged =
			this.existingId !== null && this.calloutId !== this.existingId;
		const isNew = this.existingId === null;
		if (
			(isNew || isIdChanged) &&
			this.plugin.registry.has(this.calloutId)
		) {
			return false;
		}
		return true;
	}

	private updateSaveState(): void {
		if (!this.saveBtn) return;
		const hasChanges = this.stateSnapshot() !== this.initialSnapshot;
		const isValid = this.isStateValid();
		// For new callouts: enable if valid (no need for "changes" check)
		// For existing: enable if valid AND has changes
		const enabled = this.existingId ? hasChanges && isValid : isValid;
		this.saveBtn.disabled = !enabled;
		this.saveBtn.toggleClass("cs-btn-disabled", !enabled);
	}

	private updateIdWarning(): void {
		if (!this.idsTagInput) return;

		if (!this.calloutId) {
			this.idsTagInput.showExternalError(t("editor.idEmpty"));
			return;
		}

		// Check for duplicate (only if new or id changed)
		const isIdChanged =
			this.existingId !== null && this.calloutId !== this.existingId;
		const isNew = this.existingId === null;
		if (
			(isNew || isIdChanged) &&
			this.plugin.registry.has(this.calloutId)
		) {
			this.idsTagInput.showExternalError(t("editor.idExists"));
			return;
		}

		this.idsTagInput.clearExternalError();
	}

	private getIconLabel(): string {
		const { type, value, style, weight } = this.icon;
		if (type === "material") {
			return `${type}: ${value} (${style ?? "outlined"}, ${weight ?? 400})`;
		}
		return `${type}: ${value}`;
	}

	private renderIconPreview(container: HTMLElement): void {
		container.empty();
		switch (this.icon.type) {
			case "lucide":
				try {
					setIcon(container, this.icon.value);
				} catch {
					container.textContent = "?";
				}
				break;
			case "material": {
				// Use cached SVG if available
				const cached = this.plugin.registry.findMaterialSvg(
					this.icon.value,
					this.icon.style ?? "outlined",
					this.icon.weight ?? 400,
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
					const span = container.createSpan({
						cls: "callout-studio-material-icon",
						text: this.icon.value,
					});
					const fontFamily = materialFontFamily(
						this.icon.style ?? "outlined",
					);
					span.setCssProps({
						"--cs-material-font": `"${fontFamily}"`,
						"--cs-material-weight": String(this.icon.weight ?? 400),
					});
					if (this.icon.style === "filled") {
						span.setCssProps({ "--cs-material-fill": "1" });
					}
				}
				break;
			}
			case "svg": {
				const svgData = this.plugin.registry.customSvgIcons.find(
					(s) => s.name === this.icon.value,
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
				container.textContent = this.icon.value;
				break;
		}
	}

	private updatePreview(): void {
		if (!this.previewEl) return;
		this.previewEl.empty();

		const accentColor = this.previewDarkMode
			? this.colorDark
			: this.colorLight;
		const bgColor = this.previewDarkMode
			? this.bgColorDark
			: this.bgColorLight;
		const textColor = this.previewDarkMode
			? this.textColorDark
			: this.textColorLight;

		const rgbMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(
			accentColor,
		);
		let rgbStr = "68, 138, 255";
		if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
			rgbStr = `${parseInt(rgbMatch[1], 16)}, ${parseInt(rgbMatch[2], 16)}, ${parseInt(rgbMatch[3], 16)}`;
		}

		const calloutEl = this.previewEl.createDiv({ cls: "callout" });
		calloutEl.setAttribute("data-callout", "cs-preview");
		calloutEl.style.setProperty("--callout-color", rgbStr);
		calloutEl.style.backgroundColor = bgColor;

		if (this.previewDarkMode) {
			calloutEl.addClass("callout-studio-preview-dark");
		}

		const titleEl = calloutEl.createDiv({ cls: "callout-title" });

		// Icon
		const iconEl = titleEl.createDiv({ cls: "callout-icon" });
		this.renderIconPreview(iconEl);

		// Apply icon transform in preview
		const transforms: string[] = [];
		if (this.iconOffsetX !== 0 || this.iconOffsetY !== 0) {
			transforms.push(
				`translate(${this.iconOffsetX}px, ${this.iconOffsetY}px)`,
			);
		}
		if (this.iconSize !== 1) {
			transforms.push(`scale(${this.iconSize})`);
		}
		if (transforms.length > 0) {
			iconEl.setCssProps({
				"--cs-icon-transform": transforms.join(" "),
			});
			iconEl.addClass("callout-studio-icon-transformed");
		}

		// Title text
		const titleInner = titleEl.createDiv({ cls: "callout-title-inner" });
		titleInner.textContent =
			this.displayName || t("editor.untitledCallout");

		// Content
		const contentEl = calloutEl.createDiv({ cls: "callout-content" });
		contentEl.style.color = textColor;
		const p = contentEl.createEl("p");
		p.textContent = t("editor.loremIpsum");

		this.updateSaveState();
	}

	private async save(): Promise<void> {
		if (!this.calloutId) return;

		const isIdChanged =
			this.existingId !== null && this.calloutId !== this.existingId;
		const isNew = this.existingId === null;

		if (
			(isNew || isIdChanged) &&
			this.plugin.registry.has(this.calloutId)
		) {
			return; // Duplicate ID
		}

		// Compute IDs that were removed (for vault update check)
		let removedIds: string[] = [];
		if (this.existingId) {
			const existingDef = this.plugin.registry.get(this.existingId);
			if (existingDef) {
				const oldIds = [existingDef.id, ...(existingDef.aliases ?? [])];
				const newIdSet = new Set(
					[this.calloutId, ...this.aliases].map((s) =>
						s.toLowerCase(),
					),
				);
				removedIds = oldIds.filter(
					(id) => !newIdSet.has(id.toLowerCase()),
				);
			}
		}

		const def: CalloutDefinition = {
			id: this.calloutId,
			displayName: this.displayName || this.calloutId,
			icon: { ...this.icon },
			colorLight: this.colorLight,
			colorDark: this.colorDark,
			bgColorLight: this.bgColorLight,
			bgColorDark: this.bgColorDark,
			textColorLight: this.textColorLight,
			textColorDark: this.textColorDark,
			foldable: this.foldable,
			defaultFolded: this.defaultFolded,
			builtIn: this.isBuiltIn,
			source: this.isBuiltIn ? "builtin" : "user",
			iconOffsetX: this.iconOffsetX,
			iconOffsetY: this.iconOffsetY,
			iconSize: this.iconSize,
			aliases: this.aliases.length > 0 ? [...this.aliases] : undefined,
		};

		// Add/update in registry first so SVG cleanup knows this callout exists
		if (this.existingId) {
			if (isIdChanged) {
				this.plugin.registry.remove(this.existingId);
				this.plugin.registry.add(def);
			} else {
				this.plugin.registry.update(this.existingId, def);
			}
		} else {
			this.plugin.registry.add(def);
		}

		// Download Material SVG after the callout is in the registry
		if (def.icon.type === "material") {
			if (this.saveBtn) {
				this.saveBtn.disabled = true;
				this.saveBtn.textContent = t("editor.downloadingIcon");
			}
			try {
				await this.plugin.cacheMaterialSvg(def.icon);
				const cached = this.plugin.registry.findMaterialSvg(
					def.icon.value,
					def.icon.style ?? "outlined",
					def.icon.weight ?? 400,
				);
				console.debug(
					"[CalloutStudio] save: SVG cached?",
					!!cached,
					"cache size:",
					this.plugin.registry.materialSvgCache.length,
				);
			} catch (err) {
				console.warn("[CalloutStudio] save: SVG download failed", err);
				// Continue even if download fails — will retry on next load
			}
		}

		this.plugin.registry.cleanupUnusedMaterialSvgs();

		// Offer to update vault files if IDs were removed
		if (removedIds.length > 0) {
			const { fileCount, totalCount } = await countCalloutUsages(
				this.app,
				removedIds,
			);
			if (fileCount > 0) {
				const confirmed = await new ConfirmModal(
					this.app,
					t("vault.renameConfirm", {
						count: String(totalCount),
						files: String(fileCount),
						oldIds: removedIds.join(", "),
						newId: this.calloutId,
					}),
					t("vault.updateFiles"),
					t("vault.skip"),
				).confirm();

				if (confirmed) {
					const replaced = await replaceCalloutIdsInVault(
						this.app,
						removedIds,
						this.calloutId,
					);
					new Notice(
						t("vault.filesUpdated", {
							count: String(replaced),
						}),
					);
				}
			}
		}

		if (this.resolve) this.resolve(def);
		this.resolve = null;
		this.close();
	}

	onClose(): void {
		if (this.resolve) {
			this.resolve(null);
			this.resolve = null;
		}
		this.contentEl.empty();
		this.modalEl.querySelector(".callout-studio-editor-buttons")?.remove();
		this.modalEl.removeClass("callout-studio-editor-modal");
	}
}
