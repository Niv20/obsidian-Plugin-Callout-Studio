import {
	Modal,
	Setting,
	setIcon,
	TextComponent,
	SliderComponent,
} from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition, CalloutIcon } from "../types";
import { IconPicker } from "./IconPicker";
import { materialFontFamily } from "../utils/iconLoader";
import { blendHex } from "../utils/colorUtils";
import { t } from "../i18n";

function generateId(displayName: string): string {
	return displayName
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export class CalloutEditor extends Modal {
	private plugin: CalloutStudioPlugin;
	private existingId: string | null;
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
	private previewEl: HTMLElement | null = null;
	private previewDarkMode = false;
	private idWarningEl: HTMLElement | null = null;

	constructor(plugin: CalloutStudioPlugin, existing?: CalloutDefinition) {
		super(plugin.app);
		this.plugin = plugin;
		this.existingId = existing?.id ?? null;

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

		this.setTitle(
			this.existingId ? t("editor.editCallout") : t("editor.newCallout"),
		);

		// Display Name
		new Setting(contentEl)
			.setName(t("editor.displayName"))
			.setDesc(t("editor.displayNameDesc"))
			.addText((text) => {
				text.setPlaceholder(t("editor.displayNamePlaceholder"))
					.setValue(this.displayName)
					.onChange((value) => {
						this.displayName = value;
						if (!this.existingId) {
							this.calloutId = generateId(value);
							idInput?.setValue(this.calloutId);
							this.updateIdWarning();
						}
						this.updatePreview();
					});
				text.inputEl.focus();
			});

		// Callout ID
		let idInput: TextComponent | null = null;
		const idSetting = new Setting(contentEl)
			.setName(t("editor.calloutId"))
			.setDesc(t("editor.calloutIdDesc"))
			.addText((text) => {
				idInput = text;
				text.setPlaceholder(t("editor.calloutIdPlaceholder"))
					.setValue(this.calloutId)
					.onChange((value) => {
						this.calloutId = value;
						this.updateIdWarning();
						this.updatePreview();
					});
			});

		this.idWarningEl = idSetting.descEl.createEl("div", {
			cls: "callout-studio-id-warning",
		});

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

		const colorGrid = colorsSection.createDiv({
			cls: "callout-studio-color-grid",
		});

		// Header row
		const gridHeader = colorGrid.createDiv({
			cls: "callout-studio-color-grid-header",
		});
		gridHeader.createSpan({ text: "" }); // spacer
		gridHeader.createSpan({ text: t("editor.light") });
		gridHeader.createSpan({ text: t("editor.dark") });

		// Background row
		this.addColorRow(
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

		// Text row
		this.addColorRow(
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

		// Icon/accent row
		this.addColorRow(
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

		// Foldable
		new Setting(contentEl)
			.setName(t("editor.foldable"))
			.setDesc(t("editor.foldableDesc"))
			.addToggle((toggle) => {
				toggle.setValue(this.foldable).onChange((value) => {
					this.foldable = value;
				});
			});

		// Default Folded
		new Setting(contentEl)
			.setName(t("editor.defaultFolded"))
			.setDesc(t("editor.defaultFoldedDesc"))
			.addToggle((toggle) => {
				toggle.setValue(this.defaultFolded).onChange((value) => {
					this.defaultFolded = value;
				});
			});

		// Action buttons
		const buttonContainer = contentEl.createDiv({
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
		saveBtn.addEventListener("click", () => {
			this.save();
		});
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
	): void {
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
	}

	private updateIdWarning(): void {
		if (!this.idWarningEl) return;
		this.idWarningEl.empty();

		if (!this.calloutId) {
			this.idWarningEl.setText(t("editor.idEmpty"));
			this.idWarningEl.addClass("is-visible");
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
			this.idWarningEl.setText(t("editor.idExists"));
			this.idWarningEl.addClass("is-visible");
			return;
		}

		this.idWarningEl.removeClass("is-visible");
	}

	private getIconLabel(): string {
		const { type, value, style } = this.icon;
		if (type === "material" && style) {
			return `${type}: ${value} (${style})`;
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
				const span = container.createSpan({
					cls: "callout-studio-material-icon",
					text: this.icon.value,
				});
				const fontFamily = materialFontFamily(
					this.icon.style ?? "outlined",
				);
				span.setCssProps({
					"--cs-material-font": `"${fontFamily}"`,
				});
				if (this.icon.style === "filled") {
					span.setCssProps({ "--cs-material-fill": "1" });
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
	}

	private save(): void {
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
			builtIn: false,
			source: "user",
			iconOffsetX: this.iconOffsetX,
			iconOffsetY: this.iconOffsetY,
			iconSize: this.iconSize,
		};

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
	}
}
