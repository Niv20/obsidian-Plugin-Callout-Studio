import { Modal, Setting, setIcon, TextComponent } from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition, CalloutIcon } from "../types";
import { IconPicker } from "./IconPicker";

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
	private foldable: boolean;
	private defaultFolded: boolean;
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
		this.foldable = existing?.foldable ?? true;
		this.defaultFolded = existing?.defaultFolded ?? false;
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

		this.setTitle(this.existingId ? "Edit callout" : "New callout");

		// Display Name
		new Setting(contentEl)
			.setName("Display name")
			.setDesc("The human-readable label shown in the UI")
			.addText((text) => {
				text.setPlaceholder("My warning")
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
			.setName("Callout ID")
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- [!id] is literal Markdown syntax
			.setDesc("Unique identifier used in Markdown syntax: > [!id]")
			.addText((text) => {
				idInput = text;
				text.setPlaceholder("My-warning")
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
			.setName("Icon")
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

		// Color Light
		new Setting(contentEl)
			.setName("Color (light mode)")
			.setDesc("Callout accent color in light themes")
			.addColorPicker((picker) => {
				picker.setValue(this.colorLight).onChange((value) => {
					this.colorLight = value;
					this.updatePreview();
				});
			})
			.addText((text) => {
				text.setValue(this.colorLight).onChange((value) => {
					if (/^#[0-9a-f]{6}$/i.test(value)) {
						this.colorLight = value;
						this.updatePreview();
					}
				});
				text.inputEl.addClass("callout-studio-hex-input");
			});

		// Color Dark
		new Setting(contentEl)
			.setName("Color (dark mode)")
			.setDesc("Callout accent color in dark themes")
			.addColorPicker((picker) => {
				picker.setValue(this.colorDark).onChange((value) => {
					this.colorDark = value;
					this.updatePreview();
				});
			})
			.addText((text) => {
				text.setValue(this.colorDark).onChange((value) => {
					if (/^#[0-9a-f]{6}$/i.test(value)) {
						this.colorDark = value;
						this.updatePreview();
					}
				});
				text.inputEl.addClass("callout-studio-hex-input");
			});

		// Live Preview
		const previewContainer = contentEl.createDiv({
			cls: "callout-studio-preview-container",
		});
		const previewHeader = previewContainer.createDiv({
			cls: "callout-studio-preview-header",
		});
		previewHeader.createSpan({ text: "Live preview" });

		// Light/Dark toggle
		const toggleBtn = previewHeader.createEl("button", {
			cls: "callout-studio-preview-toggle",
			text: "Light",
			attr: { "aria-label": "Toggle light/dark preview" },
		});
		toggleBtn.addEventListener("click", () => {
			this.previewDarkMode = !this.previewDarkMode;
			toggleBtn.textContent = this.previewDarkMode ? "Dark" : "Light";
			this.updatePreview();
		});

		this.previewEl = previewContainer.createDiv({
			cls: "callout-studio-preview",
		});
		this.updatePreview();

		// Foldable
		new Setting(contentEl)
			.setName("Foldable")
			.setDesc("Allow the callout to be collapsed/expanded")
			.addToggle((toggle) => {
				toggle.setValue(this.foldable).onChange((value) => {
					this.foldable = value;
				});
			});

		// Default Folded
		new Setting(contentEl)
			.setName("Default folded")
			.setDesc("Start the callout in a collapsed state")
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
			text: "Cancel",
		});
		cancelBtn.addEventListener("click", () => {
			this.close();
		});

		const saveBtn = buttonContainer.createEl("button", {
			text: this.existingId ? "Save changes" : "Create callout",
			cls: "mod-cta",
		});
		saveBtn.addEventListener("click", () => {
			this.save();
		});
	}

	private updateIdWarning(): void {
		if (!this.idWarningEl) return;
		this.idWarningEl.empty();

		if (!this.calloutId) {
			this.idWarningEl.setText("ID cannot be empty");
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
			this.idWarningEl.setText("A callout with this ID already exists");
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
			case "material":
				container.createSpan({
					cls: "material-symbols-outlined",
					text: this.icon.value,
				});
				break;
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

		const color = this.previewDarkMode ? this.colorDark : this.colorLight;
		const rgbMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(
			color,
		);
		let rgbStr = "68, 138, 255";
		if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
			rgbStr = `${parseInt(rgbMatch[1], 16)}, ${parseInt(rgbMatch[2], 16)}, ${parseInt(rgbMatch[3], 16)}`;
		}

		const calloutEl = this.previewEl.createDiv({ cls: "callout" });
		calloutEl.setAttribute("data-callout", this.calloutId || "note");
		calloutEl.style.setProperty("--callout-color", rgbStr);

		if (this.previewDarkMode) {
			calloutEl.addClass("callout-studio-preview-dark");
		}

		const titleEl = calloutEl.createDiv({ cls: "callout-title" });

		// Icon
		const iconEl = titleEl.createDiv({ cls: "callout-icon" });
		this.renderIconPreview(iconEl);

		// Title text
		const titleInner = titleEl.createDiv({ cls: "callout-title-inner" });
		titleInner.textContent = this.displayName || "Untitled Callout";

		// Content
		const contentEl = calloutEl.createDiv({ cls: "callout-content" });
		const p = contentEl.createEl("p");
		p.textContent = "This is how your callout will look in a note.";
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
			foldable: this.foldable,
			defaultFolded: this.defaultFolded,
			builtIn: false,
			source: "user",
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
