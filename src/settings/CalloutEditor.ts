/**
 * settings/CalloutEditor.ts — Modal dialog for creating and editing callouts.
 *
 * The main user-facing form: lets the user set a display name, ID/aliases,
 * icon, accent color, background color, text color, fold behavior, and icon
 * positioning. Opens the IconPicker for icon selection and renders an editable,
 * real-Obsidian live preview via LiveCalloutPreview. Save logic is delegated to
 * CalloutEditorSave; validation to CalloutEditorValidation.
 */
import { Modal, Notice, Setting, SliderComponent, setIcon } from "obsidian";
import type { CalloutDefinition, CalloutIcon, CustomPalette } from "../types";
import { IconPicker } from "./IconPicker";
import { LiveCalloutPreview } from "./LiveCalloutPreview";
import { PREVIEW_PLACEHOLDER_ID } from "../constants";
import {
	blendHex,
	DEFAULT_TEXT_COLOR_LIGHT,
	DEFAULT_TEXT_COLOR_DARK,
} from "../utils/colorUtils";
import {
	OBSIDIAN_PALETTES,
	EXTRA_PALETTES,
	customPaletteToColorPalette,
	generatePaletteId,
	type ColorPalette,
} from "../utils/colorPalettes";
import { t } from "../i18n";
import { sanitizeCalloutIdInput } from "../utils/calloutId";
import { TagInput } from "../ui/TagInput";
import {
	renderColorCircles,
	resolveCurrentModeColors,
} from "../ui/ColorCircles";
import { PaletteEditorModal } from "./PaletteEditorModal";
import { createAnimatedNumberLabel } from "../ui/AnimatedNumberLabel";
import type { CalloutEditorPlugin } from "./editor/types";
import {
	buildStateSnapshot,
	canUseCalloutId,
	hasStateChanges,
	isOverwritingAutoFallbackRow,
	isStateValid,
	shouldSaveNewAutocompleteCalloutAsFallback,
} from "./editor/CalloutEditorValidation";
import { renderCalloutEditorIconPreview } from "./editor/CalloutEditorIconRenderer";
import { performCalloutEditorSave } from "./editor/CalloutEditorSave";

// Derive a callout ID from the display name. Spaces are preserved (the ID may
// be a human-readable, multi-word label like "multi word callout"); the shared
// sanitizer just lowercases, restricts the charset, and collapses/trims runs.
function generateId(displayName: string): string {
	return sanitizeCalloutIdInput(displayName);
}

export class CalloutEditor extends Modal {
	private plugin: CalloutEditorPlugin;
	private existingId: string | null;
	private isBuiltIn: boolean;
	private createFromAutocomplete: boolean;
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
	private preview: LiveCalloutPreview | null = null;
	private previewFoldCollapsed = false;
	private idsTagInput: TagInput | null = null;
	private hasHadCalloutId = false;
	private saveBtn: HTMLButtonElement | null = null;
	private isSaveActionEnabled = false;
	private initialSnapshot: string = "";
	private initialStyleSnapshot: string = "";
	private removePopupOutsideClickListener: (() => void) | null = null;

	constructor(
		plugin: CalloutEditorPlugin,
		existing?: CalloutDefinition,
		options?: {
			seedDisplayName?: string;
			createFromAutocomplete?: boolean;
		},
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.existingId = existing?.id ?? null;
		this.isBuiltIn = existing?.builtIn ?? false;
		this.createFromAutocomplete = options?.createFromAutocomplete === true;
		const fallbackBase =
			this.createFromAutocomplete && !existing
				? this.getFallbackBase()
				: undefined;

		this.displayName =
			existing?.displayName ?? options?.seedDisplayName ?? "";
		this.calloutId =
			existing?.id ?? generateId(options?.seedDisplayName ?? "");
		this.icon = existing?.icon
			? { ...existing.icon }
			: fallbackBase?.icon
				? { ...fallbackBase.icon }
				: { type: "lucide", value: "pencil" };
		this.colorLight =
			existing?.colorLight ?? fallbackBase?.colorLight ?? "#448aff";
		this.colorDark =
			existing?.colorDark ?? fallbackBase?.colorDark ?? "#448aff";
		this.bgColorLight =
			existing?.bgColorLight ??
			fallbackBase?.bgColorLight ??
			blendHex(this.colorLight, "#ffffff", 0.88);
		this.bgColorDark =
			existing?.bgColorDark ??
			fallbackBase?.bgColorDark ??
			blendHex(this.colorDark, "#1e1e1e", 0.88);
		this.textColorLight =
			existing?.textColorLight ??
			fallbackBase?.textColorLight ??
			DEFAULT_TEXT_COLOR_LIGHT;
		this.textColorDark =
			existing?.textColorDark ??
			fallbackBase?.textColorDark ??
			DEFAULT_TEXT_COLOR_DARK;
		this.foldable = existing?.foldable ?? fallbackBase?.foldable ?? false;
		this.defaultFolded =
			existing?.defaultFolded ?? fallbackBase?.defaultFolded ?? false;
		this.iconOffsetX =
			existing?.iconOffsetX ?? fallbackBase?.iconOffsetX ?? 0;
		this.iconOffsetY =
			existing?.iconOffsetY ?? fallbackBase?.iconOffsetY ?? 0;
		this.iconSize = Math.max(
			0.5,
			Math.min(existing?.iconSize ?? fallbackBase?.iconSize ?? 1, 1.5),
		);
		this.aliases = [...(existing?.aliases ?? [])];
		this.previewFoldCollapsed = this.foldable && this.defaultFolded;
		this.hasHadCalloutId =
			this.calloutId.trim().length > 0 || this.aliases.length > 0;
	}

	openAndWait(): Promise<CalloutDefinition | null> {
		return new Promise<CalloutDefinition | null>((resolve) => {
			this.resolve = resolve;
			super.open();
		});
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("callout-studio-editor");
		this.modalEl.addClass("callout-studio-editor-modal");

		// Suspend automatic prune passes while the user is editing so a
		// fallback row currently being customized cannot be auto-removed
		// out from under the modal.
		this.plugin.pruneSuspended = true;

		// Snapshot initial state for dirty-checking
		this.initialSnapshot = this.stateSnapshot();
		this.initialStyleSnapshot = this.styleSnapshot();

		const editorTitle = this.existingId
			? t("editor.editCallout")
			: t("editor.newCallout");
		this.setTitle(editorTitle);

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
								if (this.calloutId) {
									this.hasHadCalloutId = true;
									this.idsTagInput.setTags([
										this.calloutId,
										...currentTags.slice(1),
									]);
								} else if (currentTags.length > 0) {
									this.idsTagInput.setTags(
										currentTags.slice(1),
									);
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
			.setDesc(
				createFragment((frag) => {
					// Render each newline-separated line of the description on
					// its own row (e.g. the "Press Enter…" hint sits below).
					t("editor.calloutIdsDesc")
						.split("\n")
						.forEach((line, i) => {
							if (i > 0) frag.createEl("br");
							frag.appendText(line);
						});
				}),
			);

		// Error element lives in the left description area
		const idsErrorEl = idsSetting.descEl.createDiv();

		this.idsTagInput = new TagInput(idsSetting.controlEl, {
			initialTags: initialIds,
			placeholder: t("editor.calloutIdsPlaceholder"),
			errorEl: idsErrorEl,
			readonlyTags: this.isBuiltIn ? initialIds : undefined,
			onChange: (tags) => {
				if (tags.length > 0) this.hasHadCalloutId = true;
				this.calloutId = tags[0] ?? "";
				this.aliases = tags.slice(1);
				this.updateIdWarning();
				this.updatePreview();
				this.updateSaveState();
			},
			validate: (tag) => {
				const role =
					(this.idsTagInput?.getTags().length ?? 0) === 0
						? "primary"
						: "alias";
				if (!this.canUseCalloutId(tag, role)) {
					return t("editor.idConflict");
				}
				return null;
			},
		});

		// Sync initial warning state without showing an empty-ID warning before interaction.
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
				const result = await picker.openAndWait();
				if (result) {
					this.icon = result;
					// Material icons are already cached by the IconPicker
					// before it closes, so the preview can render immediately.
					iconSetting.setDesc(this.getIconLabel());
					iconPreviewEl.empty();
					this.renderIconPreview(iconPreviewEl);
					this.updatePreview();
				}
			});
		});

		// ── Color row ───────────────────────────────────────────────
		// Standard setting row (matching Display name / Callout IDs / Icon).
		// The palette dropdown is built further down — after the live preview
		// exists, since selecting a palette refreshes it — and lands here.
		const colorSetting = new Setting(contentEl).setName(t("editor.colors"));

		// ── Preview + Adjustments Panel (two-column) ────────────────
		const previewPanel = contentEl.createDiv({
			cls: "callout-studio-preview-panel",
		});

		// Left column: single, real-Obsidian rendered preview.
		const previewCol = previewPanel.createDiv({
			cls: "callout-studio-preview-col",
		});
		this.preview = new LiveCalloutPreview(this.app, previewCol, {
			title: t("editor.livePreview"),
			initialText: this.buildSampleText(),
			// Push the in-progress edit into the registry under the reserved
			// preview ID and re-inject CSS so colours/icons render live.
			beforeRender: () => {
				this.plugin.registry.setPreviewDefinition(
					this.buildPreviewDefinition(),
				);
				this.plugin.cssInjector.inject(false);
			},
			onDestroy: () => {
				this.plugin.registry.setPreviewDefinition(null);
				this.plugin.cssInjector.inject(false);
			},
		});

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
			cls: "callout-studio-slider-row cs-size-slider-row",
		});
		const sizeLabel = sizeRow.createDiv({
			cls: "callout-studio-slider-label",
		});
		sizeLabel.createSpan({ text: t("editor.size") });
		const sizeValue = createAnimatedNumberLabel(sizeLabel, {
			initialValue: Math.round(this.iconSize * 100),
			suffix: "%",
			format: { maximumFractionDigits: 0 },
		});
		new Setting(sizeRow).addSlider((slider: SliderComponent) => {
			slider
				.setLimits(50, 150, 5)
				.setValue(Math.round(this.iconSize * 100))
				.setInstant(true)
				.onChange((value: number) => {
					this.iconSize = value / 100;
					sizeValue.update(value);
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
		const hValue = createAnimatedNumberLabel(hLabel, {
			initialValue: this.iconOffsetX,
			suffix: "px",
			format: { maximumFractionDigits: 0 },
		});
		new Setting(hRow).addSlider((slider: SliderComponent) => {
			slider
				.setLimits(-10, 10, 1)
				.setValue(this.iconOffsetX)
				.setInstant(true)
				.onChange((value: number) => {
					this.iconOffsetX = value;
					hValue.update(value);
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
		const vValue = createAnimatedNumberLabel(vLabel, {
			initialValue: this.iconOffsetY,
			suffix: "px",
			format: { maximumFractionDigits: 0 },
		});
		new Setting(vRow).addSlider((slider: SliderComponent) => {
			slider
				.setLimits(-10, 10, 1)
				.setValue(this.iconOffsetY)
				.setInstant(true)
				.onChange((value: number) => {
					this.iconOffsetY = value;
					vValue.update(value);
					this.updatePreview();
				});
		});

		// ── Palette dropdown (fills the Color row created above the preview) ──
		// Build rich palette dropdown (custom widget with circles + names).
		// Rebuilt on every menu open so palettes saved mid-session appear.
		type PaletteEntry = {
			id: string;
			name: string;
			group: ColorPalette["group"];
			palette: ColorPalette;
		};
		const paletteEntries: PaletteEntry[] = [];
		const rebuildPaletteEntries = (): void => {
			paletteEntries.length = 0;
			paletteEntries.push(
				// Custom palettes are user-named, so list them A→Z; the preset
				// groups below keep their curated (non-alphabetical) order.
				...[...this.plugin.settings.customPalettes]
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((p) => {
						const palette = customPaletteToColorPalette(p);
						return {
							id: palette.id,
							name: palette.name,
							group: "custom" as const,
							palette,
						};
					}),
				...OBSIDIAN_PALETTES.map((p) => ({
					id: p.id,
					name: p.name,
					group: "obsidian" as const,
					palette: p,
				})),
				...EXTRA_PALETTES.map((p) => ({
					id: p.id,
					name: p.name,
					group: "preset" as const,
					palette: p,
				})),
			);
		};
		rebuildPaletteEntries();

		const dropdown = colorSetting.controlEl.createDiv({
			cls: "cs-palette-dropdown",
		});
		const trigger = dropdown.createEl("button", {
			cls: "cs-palette-trigger",
			attr: { type: "button", "aria-haspopup": "listbox" },
		});
		const triggerCircles = trigger.createDiv({
			cls: "cs-palette-trigger-circles",
		});
		// Fallback label for colors that match no palette — typically a custom
		// palette that was deleted after being applied (colors are baked in).
		const triggerLabel = trigger.createSpan({
			cls: "cs-palette-trigger-label",
			text: t("editor.paletteDeleted"),
		});
		const triggerCaret = trigger.createSpan({
			cls: "cs-palette-trigger-caret",
			text: "▾",
		});
		void triggerCaret;

		// Opens downward: the colors section now sits near the top of the
		// modal, so an upward menu would clip against the modal edge.
		const menu = dropdown.createDiv({
			cls: "cs-palette-menu cs-palette-menu-hidden",
			attr: { role: "listbox", tabindex: "-1" },
		});

		let activeIndex = -1;
		let selectedId = "";
		let menuOpen = false;
		const itemEls: HTMLElement[] = [];
		const readColorState = () => ({
			colorLight: this.colorLight,
			colorDark: this.colorDark,
			bgColorLight: this.bgColorLight,
			bgColorDark: this.bgColorDark,
			textColorLight: this.textColorLight,
			textColorDark: this.textColorDark,
		});
		let colorStateBeforeMenu: ReturnType<typeof readColorState> | null =
			null;
		const applyColorState = (
			state: ReturnType<typeof readColorState>,
		): void => {
			this.colorLight = state.colorLight;
			this.colorDark = state.colorDark;
			this.bgColorLight = state.bgColorLight;
			this.bgColorDark = state.bgColorDark;
			this.textColorLight = state.textColorLight;
			this.textColorDark = state.textColorDark;
			this.updatePreview();
		};

		// The trigger swatch mirrors the row swatches: accent + background
		// for the current theme mode.
		const renderTriggerCircles = (accent: string, bg: string): void => {
			triggerCircles.empty();
			renderColorCircles(triggerCircles, accent, bg, { size: 16 });
		};
		const renderTriggerCirclesFromState = (): void => {
			const { accent, bg } = resolveCurrentModeColors(readColorState());
			renderTriggerCircles(accent, bg);
		};
		const matchesPalette = (palette: ColorPalette): boolean =>
			palette.colorLight.toLowerCase() ===
				this.colorLight.toLowerCase() &&
			palette.colorDark.toLowerCase() === this.colorDark.toLowerCase() &&
			(palette.bgColorLight?.toLowerCase() ?? "") ===
				this.bgColorLight.toLowerCase() &&
			(palette.bgColorDark?.toLowerCase() ?? "") ===
				this.bgColorDark.toLowerCase();

		const matchedEntry = paletteEntries.find(({ palette }) =>
			matchesPalette(palette),
		);
		if (matchedEntry) {
			selectedId = matchedEntry.id;
			triggerLabel.setText(matchedEntry.name);
			const { accent, bg } = resolveCurrentModeColors(
				matchedEntry.palette,
			);
			renderTriggerCircles(accent, bg);
		} else {
			renderTriggerCirclesFromState();
		}

		const applyPaletteColors = (
			palette: ColorPalette,
			persist: boolean,
		): void => {
			this.colorLight = palette.colorLight;
			this.colorDark = palette.colorDark;
			if (palette.bgColorLight !== undefined) {
				this.bgColorLight = palette.bgColorLight;
			}
			if (palette.bgColorDark !== undefined) {
				this.bgColorDark = palette.bgColorDark;
			}
			// Custom palettes carry their own text colors; presets fall back
			// to the defaults, as before.
			this.textColorLight =
				palette.textColorLight ?? DEFAULT_TEXT_COLOR_LIGHT;
			this.textColorDark =
				palette.textColorDark ?? DEFAULT_TEXT_COLOR_DARK;
			this.updatePreview();
			if (persist) colorStateBeforeMenu = null;
		};

		const closeMenu = (): void => {
			if (!menuOpen) return;
			menuOpen = false;
			menu.addClass("cs-palette-menu-hidden");
			trigger.removeClass("is-open");
			if (colorStateBeforeMenu) {
				applyColorState(colorStateBeforeMenu);
				colorStateBeforeMenu = null;
			} else {
				this.updatePreview();
			}
		};

		const setActive = (index: number): void => {
			if (index < 0 || index >= itemEls.length) return;
			const prev = itemEls[activeIndex];
			if (activeIndex >= 0 && prev) {
				prev.removeClass("is-active");
			}
			activeIndex = index;
			const el = itemEls[index];
			if (!el) return;
			el.addClass("is-active");
			el.scrollIntoView({ block: "nearest" });
			// Live preview the hovered preset (do not commit)
			const entry = paletteEntries[index];
			if (entry) applyPaletteColors(entry.palette, false);
		};

		const commitSelection = (index: number): void => {
			if (index < 0 || index >= paletteEntries.length) return;
			const entry = paletteEntries[index];
			if (!entry) return;
			selectedId = entry.id;
			applyPaletteColors(entry.palette, true);
			triggerLabel.setText(entry.name);
			const { accent, bg } = resolveCurrentModeColors(entry.palette);
			renderTriggerCircles(accent, bg);
			this.updateSaveState();
			closeMenu();
		};

		const buildMenu = (): void => {
			menu.empty();
			itemEls.length = 0;

			const groupSpec: {
				key: ColorPalette["group"];
				label: string;
			}[] = [
				{ key: "custom", label: t("editor.paletteGroupCustom") },
				{ key: "obsidian", label: t("editor.paletteGroupObsidian") },
				{ key: "preset", label: t("editor.paletteGroupPresets") },
			];

			for (const grp of groupSpec) {
				const groupEntries = paletteEntries
					.map((e, i) => ({ e, i }))
					.filter(({ e }) => e.group === grp.key);
				if (groupEntries.length === 0) continue;

				menu.createDiv({
					cls: "cs-palette-menu-group-label",
					text: grp.label,
				});

				for (const { e, i } of groupEntries) {
					const item = menu.createDiv({
						cls: "cs-palette-menu-item",
						attr: { role: "option", "data-index": String(i) },
					});
					const { accent, bg } = resolveCurrentModeColors(e.palette);
					renderColorCircles(item, accent, bg, { size: 16 });
					item.createSpan({
						cls: "cs-palette-menu-item-label",
						text: e.name,
					});
					item.addEventListener("mouseenter", () => setActive(i));
					item.addEventListener("click", () => commitSelection(i));
					itemEls[i] = item;
					if (e.id === selectedId) item.addClass("is-selected");
				}
			}

			// "+ New color…" — opens the palette editor to create a named
			// custom palette, which is then applied to this callout. Kept out
			// of itemEls so arrow-key navigation stays within real palettes.
			const newColorItem = menu.createDiv({
				cls: "cs-palette-menu-item cs-palette-menu-new-color",
				attr: { role: "option" },
			});
			const newColorIcon = newColorItem.createSpan({
				cls: "cs-palette-new-color-icon",
			});
			setIcon(newColorIcon, "plus");
			newColorItem.createSpan({
				cls: "cs-palette-menu-item-label",
				text: t("editor.paletteNewColor"),
			});
			newColorItem.addEventListener("click", () =>
				void pickNewPaletteColor(),
			);
		};

		// ── "+ New color…" flow ──
		// Opens the same palette editor the settings section uses; saving the
		// new palette immediately selects and applies it to this callout.
		const pickNewPaletteColor = async (): Promise<void> => {
			// Drop any uncommitted hover-preview colors before the modal opens.
			if (colorStateBeforeMenu) {
				applyColorState(colorStateBeforeMenu);
				colorStateBeforeMenu = null;
			}
			closeMenu();
			const result = await new PaletteEditorModal(this.app, {
				takenNames: this.plugin.settings.customPalettes.map(
					(p) => p.name,
				),
			}).openAndWait();
			if (!result) return;
			const palette: CustomPalette = {
				id: generatePaletteId(),
				...result,
			};
			this.plugin.settings.customPalettes.push(palette);
			await this.plugin.saveSettings();
			rebuildPaletteEntries();
			selectedId = palette.id;
			applyPaletteColors(customPaletteToColorPalette(palette), true);
			triggerLabel.setText(palette.name);
			const { accent, bg } = resolveCurrentModeColors(palette);
			renderTriggerCircles(accent, bg);
			this.updateSaveState();
		};

		const openMenu = (): void => {
			if (menuOpen) return;
			closeFoldMenu();
			menuOpen = true;
			colorStateBeforeMenu = readColorState();
			rebuildPaletteEntries();
			buildMenu();
			menu.removeClass("cs-palette-menu-hidden");
			trigger.addClass("is-open");
			// Focus selected, else first
			const startIdx = paletteEntries.findIndex(
				(e) => e.id === selectedId,
			);
			activeIndex = -1;
			setActive(startIdx >= 0 ? startIdx : 0);
			menu.focus();
		};

		trigger.addEventListener("click", () => {
			if (menuOpen) closeMenu();
			else openMenu();
		});

		menu.addEventListener("keydown", (ev) => {
			if (ev.key === "ArrowDown") {
				ev.preventDefault();
				setActive(Math.min(activeIndex + 1, itemEls.length - 1));
			} else if (ev.key === "ArrowUp") {
				ev.preventDefault();
				setActive(Math.max(activeIndex - 1, 0));
			} else if (ev.key === "Enter") {
				ev.preventDefault();
				commitSelection(activeIndex);
			} else if (ev.key === "Escape") {
				ev.preventDefault();
				closeMenu();
			}
		});

		// Foldable — dropdown in the same adjustment column.
		const foldSection = adjustCol.createDiv({
			cls: "callout-studio-adjust-section callout-studio-fold-section",
		});
		foldSection.createDiv({
			cls: "callout-studio-adjust-header",
			text: t("editor.foldable"),
		});
		foldSection.createDiv({
			cls: "callout-studio-fold-desc",
			text: t("editor.foldableDesc"),
		});
		const foldControl = foldSection.createDiv({
			cls: "callout-studio-fold-control",
		});
		const foldDropdown = foldControl.createDiv({
			cls: "cs-palette-dropdown cs-fold-dropdown",
		});
		const foldTrigger = foldDropdown.createEl("button", {
			cls: "cs-palette-trigger cs-fold-trigger",
			attr: { type: "button", "aria-haspopup": "listbox" },
		});
		const foldTriggerLabel = foldTrigger.createSpan({
			cls: "cs-palette-trigger-label",
		});
		foldTrigger.createSpan({
			cls: "cs-palette-trigger-caret",
			text: "▾",
		});
		const foldMenu = foldDropdown.createDiv({
			cls: "cs-palette-menu cs-palette-menu-up cs-fold-menu cs-palette-menu-hidden",
			attr: { role: "listbox", tabindex: "-1" },
		});
		const foldOptions: {
			value: "off" | "open" | "closed";
			label: string;
		}[] = [
			{ value: "off", label: t("editor.foldOff") },
			{ value: "open", label: t("editor.foldOpen") },
			{ value: "closed", label: t("editor.foldClosed") },
		];
		const currentFoldState = (): "off" | "open" | "closed" =>
			!this.foldable ? "off" : this.defaultFolded ? "closed" : "open";
		const getFoldLabel = (): string =>
			foldOptions.find((opt) => opt.value === currentFoldState())
				?.label ?? t("editor.foldOff");
		foldTriggerLabel.setText(getFoldLabel());

		let foldMenuOpen = false;
		const readFoldState = () => ({
			foldable: this.foldable,
			defaultFolded: this.defaultFolded,
			previewFoldCollapsed: this.previewFoldCollapsed,
		});
		let foldStateBeforeMenu: ReturnType<typeof readFoldState> | null = null;
		const applyFoldState = (
			value: "off" | "open" | "closed",
			persist: boolean,
		): void => {
			if (value === "off") {
				this.foldable = false;
				this.defaultFolded = false;
				this.previewFoldCollapsed = false;
			} else {
				this.foldable = true;
				this.defaultFolded = value === "closed";
				this.previewFoldCollapsed = value === "closed";
			}
			this.updatePreview();
			if (persist) foldStateBeforeMenu = null;
		};
		const restoreFoldPreview = (): void => {
			if (!foldStateBeforeMenu) return;
			this.foldable = foldStateBeforeMenu.foldable;
			this.defaultFolded = foldStateBeforeMenu.defaultFolded;
			this.previewFoldCollapsed =
				foldStateBeforeMenu.previewFoldCollapsed;
			foldStateBeforeMenu = null;
			this.updatePreview();
		};
		const closeFoldMenu = (): void => {
			if (!foldMenuOpen) return;
			foldMenuOpen = false;
			foldMenu.addClass("cs-palette-menu-hidden");
			foldTrigger.removeClass("is-open");
			restoreFoldPreview();
		};
		const selectFoldState = (value: "off" | "open" | "closed"): void => {
			const opt = foldOptions.find((item) => item.value === value);
			if (!opt) return;

			applyFoldState(opt.value, true);
			foldTriggerLabel.setText(opt.label);
			this.updateSaveState();
			closeFoldMenu();
		};
		const buildFoldMenu = (): void => {
			foldMenu.empty();
			for (const opt of foldOptions) {
				const item = foldMenu.createDiv({
					cls: `cs-palette-menu-item${
						currentFoldState() === opt.value ? " is-selected" : ""
					}`,
					attr: { role: "option" },
				});
				item.createSpan({
					cls: "cs-palette-menu-item-label",
					text: opt.label,
				});
				item.addEventListener("mouseenter", () => {
					applyFoldState(opt.value, false);
				});
				item.addEventListener("click", () =>
					selectFoldState(opt.value),
				);
			}
		};
		const openFoldMenu = (): void => {
			if (foldMenuOpen) return;
			closeMenu();
			foldMenuOpen = true;
			foldStateBeforeMenu = readFoldState();
			buildFoldMenu();
			foldMenu.removeClass("cs-palette-menu-hidden");
			foldTrigger.addClass("is-open");
			foldMenu.focus();
		};
		foldTrigger.addEventListener("click", () => {
			if (foldMenuOpen) closeFoldMenu();
			else openFoldMenu();
		});
		foldMenu.addEventListener("keydown", (ev) => {
			if (ev.key === "Escape") {
				ev.preventDefault();
				closeFoldMenu();
			}
		});
		// Close any popup when clicking outside both popup containers.
		const popupOutsideClick = (ev: MouseEvent): void => {
			const target = ev.target as Node | null;
			if (!target) return;
			if (dropdown.contains(target) || foldDropdown.contains(target))
				return;
			closeMenu();
			closeFoldMenu();
		};
		this.removePopupOutsideClickListener?.();
		activeDocument.addEventListener("click", popupOutsideClick);
		this.removePopupOutsideClickListener = () => {
			activeDocument.removeEventListener("click", popupOutsideClick);
		};
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
			if (!this.isSaveActionEnabled) {
				this.showSaveBlockedNotice();
				return;
			}
			void this.save();
		});

		// Set initial save button state
		this.updateSaveState();
	}

	private stateSnapshot(): string {
		return buildStateSnapshot({
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

	private styleSnapshot(): string {
		return buildStateSnapshot({
			displayName: "",
			calloutId: "",
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
			aliases: [],
		});
	}

	private hasStateChanges(): boolean {
		return hasStateChanges(this.initialSnapshot, this.stateSnapshot());
	}

	private hasStyleChanges(): boolean {
		return hasStateChanges(this.initialStyleSnapshot, this.styleSnapshot());
	}

	private getFallbackBase(): CalloutDefinition | undefined {
		const fallbackId = this.plugin.settings.fallbackCalloutId || "note";
		return (
			this.plugin.registry.get(fallbackId) ??
			this.plugin.registry.get("note")
		);
	}

	private shouldSaveNewAutocompleteCalloutAsFallback(): boolean {
		return shouldSaveNewAutocompleteCalloutAsFallback({
			createFromAutocomplete: this.createFromAutocomplete,
			existingId: this.existingId,
			hasStyleChanges: this.hasStyleChanges(),
			getById: (id) => this.plugin.registry.get(id),
			findByAlias: (id) => this.plugin.registry.findByAlias(id),
		});
	}

	/**
	 * When creating a callout from the autocomplete "Create new" entry, the
	 * background vault scan may have already auto-added an uncustomized
	 * `source: "fallback"` row for the same ID. That row is a placeholder
	 * mirroring the fallback style, not a real conflict, so allow the create
	 * flow to overwrite it instead of refusing the save.
	 */
	private isOverwritingAutoFallbackRow(id: string = this.calloutId): boolean {
		return isOverwritingAutoFallbackRow({
			createFromAutocomplete: this.createFromAutocomplete,
			existingId: this.existingId,
			id,
			getById: (targetId) => this.plugin.registry.get(targetId),
			findByAlias: (targetId) =>
				this.plugin.registry.findByAlias(targetId),
		});
	}

	private canUseCalloutId(id: string, role: "primary" | "alias"): boolean {
		return canUseCalloutId({
			createFromAutocomplete: this.createFromAutocomplete,
			existingId: this.existingId,
			id,
			role,
			getById: (targetId) => this.plugin.registry.get(targetId),
			findByAlias: (targetId) =>
				this.plugin.registry.findByAlias(targetId),
		});
	}

	private isStateValid(): boolean {
		return isStateValid({
			createFromAutocomplete: this.createFromAutocomplete,
			existingId: this.existingId,
			isBuiltIn: this.isBuiltIn,
			displayName: this.displayName,
			calloutId: this.calloutId,
			aliases: this.aliases,
			getById: (targetId) => this.plugin.registry.get(targetId),
			findByAlias: (targetId) =>
				this.plugin.registry.findByAlias(targetId),
		});
	}

	private updateSaveState(): void {
		if (!this.saveBtn) return;
		const hasChanges = this.hasStateChanges();
		const isValid = this.isStateValid();
		// For new callouts: enable if valid (no need for "changes" check)
		// For existing: enable if valid AND has changes
		const enabled = this.existingId ? hasChanges && isValid : isValid;
		this.isSaveActionEnabled = enabled;
		this.saveBtn.disabled = false;
		this.saveBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
		this.saveBtn.toggleClass("cs-btn-disabled", !enabled);
	}

	private showSaveBlockedNotice(): void {
		const hasChanges = this.hasStateChanges();
		const requireDisplayName =
			!this.createFromAutocomplete || this.existingId !== null;

		if (
			!this.existingId &&
			requireDisplayName &&
			!this.displayName.trim()
		) {
			new Notice(t("editor.nameRequired"));
			return;
		}

		if (this.existingId && !hasChanges) {
			new Notice(t("editor.noChangesToSave"));
			return;
		}

		if (!this.calloutId) {
			new Notice(t("editor.idEmpty"));
			return;
		}

		if (!this.canUseCalloutId(this.calloutId, "primary")) {
			new Notice(t("editor.idConflict"));
			return;
		}
		for (const alias of this.aliases) {
			if (!this.canUseCalloutId(alias, "alias")) {
				new Notice(t("editor.idConflict"));
				return;
			}
		}
	}

	private updateIdWarning(): void {
		if (!this.idsTagInput) return;

		if (!this.calloutId) {
			if (this.hasHadCalloutId) {
				this.idsTagInput.showExternalError(t("editor.idEmpty"));
			} else {
				this.idsTagInput.clearExternalError();
			}
			return;
		}
		this.hasHadCalloutId = true;

		if (!this.canUseCalloutId(this.calloutId, "primary")) {
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
		renderCalloutEditorIconPreview(this.plugin, this.icon, container);
	}

	private updatePreview(): void {
		if (!this.preview) return;
		// Keep the sample's titles tracking the display-name field.
		this.preview.setText(this.buildSampleText());
		this.preview.refresh();
		this.updateSaveState();
	}

	/**
	 * The callout ID the live preview should render under: the real primary ID
	 * being edited, or a readable placeholder while it is still empty (a brand-new
	 * callout before the user types a name).
	 */
	private currentPreviewId(): string {
		return this.calloutId.trim() || PREVIEW_PLACEHOLDER_ID;
	}

	/** The sample markdown seeding the preview: all three roles. */
	private buildSampleText(): string {
		const id = this.currentPreviewId();
		const name = this.displayName.trim() || t("editor.untitledCallout");
		// Reflect the fold setting so a folded default previews collapsed.
		const mark = this.foldable ? (this.defaultFolded ? "-" : "+") : "";
		return [
			`> [!${id}]${mark} ${name}`,
			`> ${t("editor.loremIpsum")}`,
			"",
			`## [!${id}]${mark} ${name}`,
			"",
			t("editor.sampleInlineText").replace("{id}", id),
		].join("\n");
	}

	/** Snapshot the current form state as a transient preview definition. */
	private buildPreviewDefinition(): CalloutDefinition {
		return {
			id: this.currentPreviewId(),
			displayName: this.displayName.trim() || t("editor.untitledCallout"),
			icon: { ...this.icon },
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
			aliases: [],
			builtIn: false,
			source: "user",
		};
	}

	private async save(): Promise<void> {
		// Clear the transient preview registration first, restoring any real
		// callout it was shadowing, so the save flow mutates the real definition
		// (not the in-progress preview) and onClose can't later revert the save.
		this.plugin.registry.setPreviewDefinition(null);
		const def = await performCalloutEditorSave({
			app: this.app,
			plugin: this.plugin,
			existingId: this.existingId,
			isBuiltIn: this.isBuiltIn,
			state: {
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
			},
			hasStyleChanges: this.hasStyleChanges(),
			saveAsFallback: this.shouldSaveNewAutocompleteCalloutAsFallback(),
			overwriteAutoFallback: this.isOverwritingAutoFallbackRow(),
			canUseCalloutId: (id, role) => this.canUseCalloutId(id, role),
			getFallbackBase: () => this.getFallbackBase(),
			onMaterialDownloadStart: () => {
				if (this.saveBtn) {
					this.isSaveActionEnabled = false;
					this.saveBtn.disabled = true;
					this.saveBtn.textContent = t("editor.downloadingIcon");
				}
			},
		});

		if (!def) {
			this.updateIdWarning();
			this.updateSaveState();
			// Save was rejected and the modal stays open — re-register the
			// transient preview definition (cleared above) so the live preview
			// keeps showing the in-progress style.
			this.updatePreview();
			return;
		}

		if (this.resolve) this.resolve(def);
		this.resolve = null;
		this.close();
	}

	onClose(): void {
		this.preview?.destroy();
		this.preview = null;
		this.removePopupOutsideClickListener?.();
		this.removePopupOutsideClickListener = null;
		if (this.resolve) {
			this.resolve(null);
			this.resolve = null;
		}
		this.contentEl.empty();
		this.modalEl.querySelector(".callout-studio-editor-buttons")?.remove();
		this.modalEl.removeClass("callout-studio-editor-modal");
		// Re-enable automatic pruning and run one pass to clean up any
		// fallback rows the user touched but did not save.
		this.plugin.pruneSuspended = false;
		this.plugin.schedulePruneUnusedFallbacks(0);
	}
}
