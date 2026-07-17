/**
 * settings/PaletteEditorModal.ts — Create/edit a custom color palette.
 *
 * Small modal opened from the "Saved color palettes" settings section. Default
 * (simple) mode: the user picks ONE base color and the full palette — light/
 * dark accents, backgrounds, text — is auto-derived with contrast correction
 * (see derivePaletteFromColor). An "Advanced" toggle reveals the same six-swatch
 * grid as the callout editor for full manual control, with the same
 * non-blocking low-contrast warnings. The background can optionally be a
 * two-stop gradient (linear with 8 preset directions, or centered radial):
 * simple mode picks one "second color" whose light/dark tints are derived
 * like the background's; the advanced grid exposes both end colors directly.
 * Resolves the palette (without id) on save, or null on cancel/close.
 */
import { Modal, Setting, setIcon } from "obsidian";
import type { App } from "obsidian";
import type { BgGradient, CalloutDefinition, CustomPalette } from "../types";
import {
	blendHex,
	contrastRatio,
	derivePaletteFromColor,
	rotateHue,
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

/** The 8 preset linear-gradient directions, clockwise from "to top" (0°). */
const GRADIENT_DIRECTIONS: { deg: number; icon: string }[] = [
	{ deg: 0, icon: "arrow-up" },
	{ deg: 45, icon: "arrow-up-right" },
	{ deg: 90, icon: "arrow-right" },
	{ deg: 135, icon: "arrow-down-right" },
	{ deg: 180, icon: "arrow-down" },
	{ deg: 225, icon: "arrow-down-left" },
	{ deg: 270, icon: "arrow-left" },
	{ deg: 315, icon: "arrow-up-left" },
];
/** Top-left → bottom-right, the classic presentation-software default. */
const DEFAULT_GRADIENT_ANGLE = 135;
/** Hue offset for the auto-suggested gradient second color. */
const GRADIENT_HUE_SHIFT = 45;

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
	// Gradient state. The end (stop-2) colors are tints of gradientToBase,
	// derived exactly like the six colors are derived from the base color;
	// the advanced grid can then override them per mode.
	private gradientOn: boolean;
	private gradientType: BgGradient["type"];
	private angleDeg: number;
	private gradientToBase: string;
	/** Once the user picks a second color it stops auto-following the base. */
	private gradientToTouched: boolean;
	private toColorLight = "";
	private toColorDark = "";
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
	// Gradient UI refs for show/hide and programmatic color sync.
	private gradientRows: HTMLElement[] = [];
	private gradientDirRow: HTMLElement | null = null;
	private gradientEndGridRow: HTMLElement | null = null;
	private gradToInput: HTMLInputElement | null = null;
	private gradEndInputs: {
		light?: HTMLInputElement;
		dark?: HTMLInputElement;
	} = {};

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

		const g = this.existing?.bgGradient;
		this.gradientOn = !!g;
		this.gradientType = g?.type ?? "linear";
		this.angleDeg = g?.angleDeg ?? DEFAULT_GRADIENT_ANGLE;
		// A saved gradient's end colors are authoritative (derivation is not
		// invertible); a fresh gradient starts from a hue-shifted base color
		// so toggling it on is immediately visible.
		this.gradientToTouched = !!g;
		this.gradientToBase =
			g?.toColorLight ?? rotateHue(this.baseColor, GRADIENT_HUE_SHIFT);
		if (g) {
			this.toColorLight = g.toColorLight;
			this.toColorDark = g.toColorDark;
		} else {
			this.deriveGradientEnd();
		}
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

		this.buildGradientControls(contentEl);

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
		// The gradient end follows the base color until the user picks their
		// own second color; its tints are then re-derived either way (same
		// "re-derive overwrites manual tweaks" contract as the six colors).
		if (!this.gradientToTouched) {
			this.gradientToBase = rotateHue(
				this.baseColor,
				GRADIENT_HUE_SHIFT,
			);
		}
		this.deriveGradientEnd();
		this.syncGridInputs();
		this.syncGradientInputs();
		this.preview?.refresh();
		this.updateWarnings();
	}

	/** Recomputes the gradient end colors as tints of the second base color. */
	private deriveGradientEnd(): void {
		this.toColorLight = blendHex(this.gradientToBase, "#ffffff", 0.88);
		this.toColorDark = blendHex(this.gradientToBase, "#1e1e1e", 0.88);
	}

	/** The gradient to preview/persist, or null when Solid is selected. */
	private currentGradient(): BgGradient | null {
		if (!this.gradientOn) return null;
		return {
			type: this.gradientType,
			// The angle is kept even for radial so switching back to linear
			// restores the user's direction.
			angleDeg: this.angleDeg,
			toColorLight: this.toColorLight,
			toColorDark: this.toColorDark,
		};
	}

	/**
	 * Background style controls: Solid|Gradient segmented switch, then —
	 * gradient only — the second color, Linear|Radial type, and (linear only)
	 * an 8-arrow direction picker.
	 */
	private buildGradientControls(contentEl: HTMLElement): void {
		const bgStyleSetting = new Setting(contentEl).setName(
			t("palette.bgStyle"),
		);
		this.buildSegmented(
			bgStyleSetting.controlEl,
			[
				{ value: "solid", label: t("palette.bgSolid") },
				{ value: "gradient", label: t("palette.bgGradient") },
			],
			this.gradientOn ? "gradient" : "solid",
			(v) => {
				this.gradientOn = v === "gradient";
				this.updateGradientVisibility();
				this.preview?.refresh();
				this.updateWarnings();
			},
		);

		const toSetting = new Setting(contentEl)
			.setName(t("palette.gradientTo"))
			.setDesc(t("palette.gradientToDesc"));
		this.gradToInput = createColorSwatchInput(
			toSetting.controlEl,
			this.gradientToBase,
			(hex) => {
				this.gradientToBase = hex;
				this.gradientToTouched = true;
				this.deriveGradientEnd();
				this.syncGradientInputs();
				this.preview?.refresh();
				this.updateWarnings();
			},
		).input;
		this.gradientRows.push(toSetting.settingEl);

		const typeSetting = new Setting(contentEl).setName(
			t("palette.gradientType"),
		);
		this.buildSegmented(
			typeSetting.controlEl,
			[
				{ value: "linear", label: t("palette.gradientLinear") },
				{ value: "radial", label: t("palette.gradientRadial") },
			],
			this.gradientType,
			(v) => {
				this.gradientType = v;
				this.updateGradientVisibility();
				this.preview?.refresh();
			},
		);
		this.gradientRows.push(typeSetting.settingEl);

		const dirSetting = new Setting(contentEl).setName(
			t("palette.gradientDirection"),
		);
		const dirWrap = dirSetting.controlEl.createDiv({
			cls: "cs-gradient-dir-row",
		});
		const dirBtns = new Map<number, HTMLButtonElement>();
		for (const { deg, icon } of GRADIENT_DIRECTIONS) {
			const btn = dirWrap.createEl("button", {
				cls: "cs-gradient-dir-btn",
				attr: { "aria-label": `${deg}°`, title: `${deg}°` },
			});
			setIcon(btn, icon);
			if (deg === this.angleDeg) btn.addClass("is-active");
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				this.angleDeg = deg;
				for (const b of dirBtns.values()) b.removeClass("is-active");
				btn.addClass("is-active");
				this.preview?.refresh();
			});
			dirBtns.set(deg, btn);
		}
		this.gradientDirRow = dirSetting.settingEl;
		this.updateGradientVisibility();
	}

	/** Two-option segmented control that manages its own active state. */
	private buildSegmented<T extends string>(
		parent: HTMLElement,
		options: { value: T; label: string }[],
		initial: T,
		onSelect: (value: T) => void,
	): void {
		const wrap = parent.createDiv({ cls: "cs-segmented" });
		const btns: HTMLButtonElement[] = [];
		for (const opt of options) {
			const btn = wrap.createEl("button", {
				cls: "cs-segmented-btn",
				text: opt.label,
			});
			if (opt.value === initial) btn.addClass("is-active");
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				if (btn.hasClass("is-active")) return;
				for (const b of btns) b.removeClass("is-active");
				btn.addClass("is-active");
				onSelect(opt.value);
			});
			btns.push(btn);
		}
	}

	/** Shows/hides the gradient rows to match the current toggle state. */
	private updateGradientVisibility(): void {
		for (const row of this.gradientRows) {
			row.toggleClass("cs-gradient-hidden", !this.gradientOn);
		}
		this.gradientDirRow?.toggleClass(
			"cs-gradient-hidden",
			!this.gradientOn || this.gradientType !== "linear",
		);
		this.gradientEndGridRow?.toggleClass(
			"cs-gradient-hidden",
			!this.gradientOn,
		);
	}

	/** Pushes gradient colors into their swatches after a programmatic change. */
	private syncGradientInputs(): void {
		const entries: [HTMLInputElement | null | undefined, string][] = [
			[this.gradToInput, this.gradientToBase],
			[this.gradEndInputs.light, this.toColorLight],
			[this.gradEndInputs.dark, this.toColorDark],
		];
		for (const [input, value] of entries) {
			if (!input) continue;
			input.value = value;
			if (input.parentElement) {
				input.parentElement.style.backgroundColor = value;
			}
		}
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

		// Gradient end row (stop 2) — same layout as the six-color rows but
		// backed by the gradient fields; shown only while Gradient is on.
		const gradientEndRow = grid.createDiv({
			cls: "callout-studio-color-row",
		});
		gradientEndRow.createSpan({ text: t("editor.gradientEnd") });
		const onPickEnd =
			(key: "toColorLight" | "toColorDark") =>
			(next: string): void => {
				this[key] = next;
				this.preview?.refresh();
				this.updateWarnings();
			};
		this.gradEndInputs.light = createColorSwatchInput(
			gradientEndRow,
			this.toColorLight,
			onPickEnd("toColorLight"),
		).input;
		this.gradEndInputs.dark = createColorSwatchInput(
			gradientEndRow,
			this.toColorDark,
			onPickEnd("toColorDark"),
		).input;
		this.gradientEndGridRow = gradientEndRow;
		this.updateGradientVisibility();

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
	 * The sample markdown seeding the read-only preview: the same mini-document
	 * as the callout editor's preview — a titled heading callout, an inline pill,
	 * then the regular callout — all in the palette's colors, so a saved palette
	 * can be checked against every render role at once. The title is a fixed
	 * placeholder, deliberately not tied to the "Name" field above (that field
	 * names the *palette*, e.g. "Ocean", not this demo callout). The trailing
	 * blank line keeps the read-only caret parked outside the last block (see
	 * LiveCalloutPreview's focus policy).
	 */
	private buildSampleText(): string {
		const id = PREVIEW_PLACEHOLDER_ID;
		const name = t("editor.untitledCallout");
		return [
			`## [!${id}] ${name}`,
			"",
			t("editor.sampleInlineText").replace("{id}", id),
			"",
			`> [!${id}] ${name}`,
			`> ${t("editor.loremIpsumShort")}`,
			"",
		].join("\n");
	}

	/** Snapshot the derived palette colors as a transient preview definition. */
	private buildPreviewDefinition(): CalloutDefinition {
		return {
			id: PREVIEW_PLACEHOLDER_ID,
			displayName: t("editor.untitledCallout"),
			icon: { type: "lucide", value: "palette" },
			colorLight: this.colors.colorLight,
			colorDark: this.colors.colorDark,
			bgColorLight: this.colors.bgColorLight,
			bgColorDark: this.colors.bgColorDark,
			bgGradient: this.currentGradient() ?? undefined,
			textColorLight: this.colors.textColorLight,
			textColorDark: this.colors.textColorDark,
			foldable: false,
			defaultFolded: false,
			aliases: [],
			builtIn: false,
			source: "user",
		};
	}

	/**
	 * Same non-blocking thresholds as the callout editor's grid. With a
	 * gradient on, text/accent must read against BOTH stops, so the worse
	 * (lower) of the two ratios decides the warning.
	 */
	private updateWarnings(): void {
		const warn = this.warnEls;
		const c = this.colors;
		const worstLight = (fg: string): number =>
			this.gradientOn
				? Math.min(
						contrastRatio(fg, c.bgColorLight),
						contrastRatio(fg, this.toColorLight),
					)
				: contrastRatio(fg, c.bgColorLight);
		const worstDark = (fg: string): number =>
			this.gradientOn
				? Math.min(
						contrastRatio(fg, c.bgColorDark),
						contrastRatio(fg, this.toColorDark),
					)
				: contrastRatio(fg, c.bgColorDark);
		if (warn.textLight) {
			setContrastWarning(
				warn.textLight,
				worstLight(c.textColorLight) < 4.5,
			);
		}
		if (warn.textDark) {
			setContrastWarning(warn.textDark, worstDark(c.textColorDark) < 4.5);
		}
		if (warn.accentLight) {
			setContrastWarning(warn.accentLight, worstLight(c.colorLight) < 3);
		}
		if (warn.accentDark) {
			setContrastWarning(warn.accentDark, worstDark(c.colorDark) < 3);
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
			const gradient = this.currentGradient();
			result = {
				name,
				...this.colors,
				...(gradient ? { bgGradient: gradient } : {}),
			};
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
