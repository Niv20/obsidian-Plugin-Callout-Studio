/**
 * settings/PaletteEditorModal.ts — Create/edit a custom color palette.
 *
 * Small modal opened from the "Saved color palettes" settings section. Default
 * (simple) mode: the user picks ONE base color and the full palette — light/
 * dark accents, backgrounds, text — is auto-derived with contrast correction
 * (see derivePaletteFromColor). An "Advanced" toggle reveals the same six-swatch
 * grid as the callout editor for full manual control, with the same
 * non-blocking low-contrast warnings. Resolves the palette (without id) on
 * save, or null on cancel/close.
 */
import { Modal, Setting } from "obsidian";
import type { App } from "obsidian";
import type { CalloutDefinition, CustomPalette } from "../types";
import {
	contrastRatio,
	derivePaletteFromColor,
	type DerivedPalette,
} from "../utils/colorUtils";
import {
	createColorSwatchInput,
	setContrastWarning,
} from "../ui/ColorSwatchInput";
import { LiveCalloutPreview } from "./LiveCalloutPreview";
import { PREVIEW_PLACEHOLDER_ID } from "../constants";
import { suggestColorName } from "../utils/colorNames";
import { OBSIDIAN_PALETTES, EXTRA_PALETTES } from "../utils/colorPalettes";
import { t } from "../i18n";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import type { CSSInjector } from "../manager/CSSInjector";

export type PaletteEditorResult = Omit<CustomPalette, "id">;

/** Minimal plugin surface the palette editor needs to drive the live preview. */
interface PaletteEditorPlugin {
	app: App;
	registry: CalloutRegistry;
	cssInjector: CSSInjector;
}

const DEFAULT_BASE_COLOR = "#448aff";
/** Keeps the name readable in the dropdown/list rows, which truncate past this. */
const MAX_NAME_LENGTH = 30;

/** Names are compared case-insensitively, ignoring surrounding whitespace. */
const normalizeName = (name: string): string => name.trim().toLowerCase();

export class PaletteEditorModal extends Modal {
	private existing: CustomPalette | null;
	/** Normalized names of every other palette (custom AND built-in presets). */
	private takenNames: Set<string>;
	private name: string;
	private baseColor: string;
	private colors: DerivedPalette;
	private advanced: boolean;
	private resolve: ((result: PaletteEditorResult | null) => void) | null =
		null;

	// UI refs for cross-updates between the simple and advanced views.
	private gridEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private preview: LiveCalloutPreview | null = null;
	/** Preview the caller had registered before this modal took the slot. */
	private outerPreview: CalloutDefinition | null = null;
	private gridInputs: Partial<
		Record<keyof DerivedPalette, HTMLInputElement>
	> = {};
	private warnEls: {
		textLight?: HTMLElement;
		textDark?: HTMLElement;
		accentLight?: HTMLElement;
		accentDark?: HTMLElement;
	} = {};
	private nameInputEl: HTMLInputElement | null = null;
	private nameErrorEl: HTMLElement | null = null;
	private saveBtnEl: HTMLButtonElement | null = null;

	constructor(
		private plugin: PaletteEditorPlugin,
		options: { existing?: CustomPalette; takenNames?: string[] } = {},
	) {
		super(plugin.app);
		this.existing = options.existing ?? null;
		// Callers pass the other CUSTOM palette names; the fixed preset names
		// are merged here so a custom palette can't shadow "Ocean" etc.
		this.takenNames = new Set(
			[
				...(options.takenNames ?? []),
				...OBSIDIAN_PALETTES.map((p) => p.name),
				...EXTRA_PALETTES.map((p) => p.name),
			].map(normalizeName),
		);
		this.name = this.existing?.name ?? "";
		this.baseColor = this.existing?.colorLight ?? DEFAULT_BASE_COLOR;
		this.colors = this.existing
			? {
					colorLight: this.existing.colorLight,
					colorDark: this.existing.colorDark,
					bgColorLight: this.existing.bgColorLight,
					bgColorDark: this.existing.bgColorDark,
					textColorLight: this.existing.textColorLight,
					textColorDark: this.existing.textColorDark,
				}
			: derivePaletteFromColor(this.baseColor);
		// Editing opens in advanced mode: a six-color set generally cannot be
		// reproduced from a single base color.
		this.advanced = this.existing !== null;
	}

	openAndWait(): Promise<PaletteEditorResult | null> {
		return new Promise<PaletteEditorResult | null>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}

	onOpen(): void {
		this.setTitle(
			this.existing ? t("palette.editTitle") : t("palette.newTitle"),
		);
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("callout-studio-palette-editor");

		const nameSetting = new Setting(contentEl)
			.setName(t("palette.name"))
			.addText((text) => {
				this.nameInputEl = text.inputEl;
				text.inputEl.maxLength = MAX_NAME_LENGTH;
				text.setPlaceholder(t("palette.namePlaceholder"))
					.setValue(this.name)
					.onChange((v) => {
						this.name = v;
						this.updateNameValidity();
						// Keep the preview callout's title in sync with the name.
						this.preview?.setText(this.buildSampleText());
					});
			});
		// Error line in the info column, mirroring the callout IDs error.
		this.nameErrorEl = nameSetting.descEl.createDiv({ cls: "cs-tag-error" });

		const baseSetting = new Setting(contentEl)
			.setName(t("palette.baseColor"))
			.setDesc(t("palette.baseColorDesc"));
		createColorSwatchInput(
			baseSetting.controlEl,
			this.baseColor,
			(hex) => {
				this.baseColor = hex;
				this.applyDerived();
			},
		);

		this.previewEl = contentEl.createDiv({
			cls: "cs-palette-live-preview",
		});
		// Capture any preview the caller already registered (e.g. the callout
		// editor's, when this modal is opened over it) so it can be restored on
		// close instead of clearing the registry's single preview slot to null.
		this.outerPreview = this.plugin.registry.getPreviewDefinition();
		this.preview = new LiveCalloutPreview(this.plugin.app, this.previewEl, {
			title: t("editor.livePreview"),
			initialText: this.buildSampleText(),
			// Push the derived palette into the registry under the reserved
			// preview ID and re-inject CSS so the callout renders live.
			beforeRender: () => {
				this.plugin.registry.setPreviewDefinition(
					this.buildPreviewDefinition(),
				);
				this.plugin.cssInjector.inject(false);
			},
			onDestroy: () => {
				this.plugin.registry.setPreviewDefinition(this.outerPreview);
				this.plugin.cssInjector.inject(false);
			},
		});

		new Setting(contentEl)
			.setName(t("palette.advanced"))
			.setDesc(t("palette.advancedDesc"))
			.addToggle((toggle) => {
				toggle.setValue(this.advanced).onChange((on) => {
					this.advanced = on;
					if (!on) {
						// Leaving advanced re-derives everything from the base
						// color, overwriting manual tweaks (stated in the desc).
						this.applyDerived();
					}
					this.gridEl?.toggleClass("cs-color-grid-hidden", !on);
				});
			});

		this.buildGrid(contentEl);
		this.gridEl?.toggleClass("cs-color-grid-hidden", !this.advanced);

		const buttons = contentEl.createDiv({ cls: "modal-button-container" });
		buttons
			.createEl("button", { text: t("editor.cancel") })
			.addEventListener("click", () => this.finish(false));
		this.saveBtnEl = buttons.createEl("button", {
			text: t("palette.save"),
			cls: "mod-cta",
		});
		this.saveBtnEl.addEventListener("click", () => this.finish(true));
		this.updateNameValidity();
	}

	/** True when the typed name collides with another palette or a preset. */
	private isNameTaken(): boolean {
		return this.takenNames.has(normalizeName(this.name));
	}

	/**
	 * Duplicate names are hard-blocked: the input turns red, an error shows
	 * under the label, and Save is disabled until the name is unique.
	 */
	private updateNameValidity(): void {
		const taken = this.isNameTaken();
		this.nameInputEl?.toggleClass("cs-input-invalid", taken);
		if (this.nameErrorEl) {
			this.nameErrorEl.setText(taken ? t("palette.nameExists") : "");
			this.nameErrorEl.toggleClass("is-visible", taken);
		}
		if (this.saveBtnEl) this.saveBtnEl.disabled = taken;
	}

	/** Re-derives all six colors from the base color and refreshes the UI. */
	private applyDerived(): void {
		this.colors = derivePaletteFromColor(this.baseColor);
		this.syncGridInputs();
		this.preview?.refresh();
		this.updateWarnings();
	}

	private buildGrid(parent: HTMLElement): void {
		// Same classes as the callout editor's grid so the existing CSS applies.
		const grid = parent.createDiv({
			cls: "callout-studio-color-grid cs-palette-editor-grid",
		});
		this.gridEl = grid;
		const header = grid.createDiv({
			cls: "callout-studio-color-grid-header",
		});
		header.createSpan({ text: "" });
		header.createSpan({ text: t("editor.light") });
		header.createSpan({ text: t("editor.dark") });

		const addRow = (
			label: string,
			lightKey: keyof DerivedPalette,
			darkKey: keyof DerivedPalette,
		): {
			light: ReturnType<typeof createColorSwatchInput>;
			dark: ReturnType<typeof createColorSwatchInput>;
		} => {
			const row = grid.createDiv({ cls: "callout-studio-color-row" });
			row.createSpan({ text: label });
			const onPick =
				(key: keyof DerivedPalette) =>
				(next: string): void => {
					this.colors[key] = next;
					this.preview?.refresh();
					this.updateWarnings();
				};
			const light = createColorSwatchInput(
				row,
				this.colors[lightKey],
				onPick(lightKey),
			);
			const dark = createColorSwatchInput(
				row,
				this.colors[darkKey],
				onPick(darkKey),
			);
			this.gridInputs[lightKey] = light.input;
			this.gridInputs[darkKey] = dark.input;
			return { light, dark };
		};

		addRow(t("editor.background"), "bgColorLight", "bgColorDark");
		const textRow = addRow(
			t("editor.text"),
			"textColorLight",
			"textColorDark",
		);
		const accentRow = addRow(
			t("editor.iconColor"),
			"colorLight",
			"colorDark",
		);
		this.warnEls.textLight = textRow.light.warnEl;
		this.warnEls.textDark = textRow.dark.warnEl;
		this.warnEls.accentLight = accentRow.light.warnEl;
		this.warnEls.accentDark = accentRow.dark.warnEl;
		this.updateWarnings();
	}

	/** Pushes this.colors into the grid inputs after a programmatic change. */
	private syncGridInputs(): void {
		for (const [key, input] of Object.entries(this.gridInputs)) {
			if (!input) continue;
			const value = this.colors[key as keyof DerivedPalette];
			input.value = value;
			if (input.parentElement) {
				input.parentElement.style.backgroundColor = value;
			}
		}
	}

	/**
	 * The sample markdown seeding the read-only preview: one regular callout in
	 * the palette's colors. The trailing blank line keeps the read-only caret
	 * parked outside the block (see LiveCalloutPreview's focus policy).
	 */
	private buildSampleText(): string {
		const name = this.name.trim() || t("editor.untitledCallout");
		return [
			`> [!${PREVIEW_PLACEHOLDER_ID}] ${name}`,
			`> ${t("editor.loremIpsumShort")}`,
			"",
		].join("\n");
	}

	/** Snapshot the derived palette colors as a transient preview definition. */
	private buildPreviewDefinition(): CalloutDefinition {
		return {
			id: PREVIEW_PLACEHOLDER_ID,
			displayName: this.name.trim() || t("editor.untitledCallout"),
			icon: { type: "lucide", value: "palette" },
			colorLight: this.colors.colorLight,
			colorDark: this.colors.colorDark,
			bgColorLight: this.colors.bgColorLight,
			bgColorDark: this.colors.bgColorDark,
			textColorLight: this.colors.textColorLight,
			textColorDark: this.colors.textColorDark,
			foldable: false,
			defaultFolded: false,
			aliases: [],
			builtIn: false,
			source: "user",
		};
	}

	/** Same non-blocking thresholds as the callout editor's grid. */
	private updateWarnings(): void {
		const warn = this.warnEls;
		const c = this.colors;
		if (warn.textLight) {
			setContrastWarning(
				warn.textLight,
				contrastRatio(c.textColorLight, c.bgColorLight) < 4.5,
			);
		}
		if (warn.textDark) {
			setContrastWarning(
				warn.textDark,
				contrastRatio(c.textColorDark, c.bgColorDark) < 4.5,
			);
		}
		if (warn.accentLight) {
			setContrastWarning(
				warn.accentLight,
				contrastRatio(c.colorLight, c.bgColorLight) < 3,
			);
		}
		if (warn.accentDark) {
			setContrastWarning(
				warn.accentDark,
				contrastRatio(c.colorDark, c.bgColorDark) < 3,
			);
		}
	}

	/**
	 * "Blue" taken → "Blue 2", "Blue 3", … Only used for the auto-suggested
	 * name when the field was left empty; a user-typed duplicate is blocked
	 * by updateNameValidity instead of being silently renamed.
	 */
	private dedupeName(name: string): string {
		if (!this.takenNames.has(normalizeName(name))) return name;
		for (let n = 2; ; n++) {
			const candidate = `${name} ${n}`;
			if (!this.takenNames.has(normalizeName(candidate))) {
				return candidate;
			}
		}
	}

	private finish(save: boolean): void {
		// Save stays disabled on a duplicate name, but guard anyway.
		if (save && this.isNameTaken()) return;
		const resolve = this.resolve;
		this.resolve = null;
		let result: PaletteEditorResult | null = null;
		if (save) {
			const typed = this.name.trim();
			const name =
				typed || this.dedupeName(suggestColorName(this.colors.colorLight));
			result = { name, ...this.colors };
		}
		this.close();
		resolve?.(result);
	}

	onClose(): void {
		// Destroys the embedded editor and, via onDestroy, restores the outer
		// preview registration (if any) and re-injects CSS.
		this.preview?.destroy();
		this.preview = null;
		this.contentEl.empty();
		if (this.resolve) {
			this.resolve(null);
			this.resolve = null;
		}
	}
}
