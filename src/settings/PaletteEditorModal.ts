/**
 * settings/PaletteEditorModal.ts — Create/edit a custom color palette.
 *
 * Modal opened from the "Saved color palettes" settings section. Two-column
 * body (same panel classes as the callout editor): options on the left, a
 * sticky live preview on the right. Default (simple) mode: the user picks ONE
 * base color and the full palette — light/dark accents, backgrounds, text —
 * is auto-derived with contrast correction (see derivePaletteFromColor). The
 * background style is a 2-way choice: solid or a two-stop linear gradient
 * (preset directions). For the gradient, the user picks one "second color"
 * whose light/dark tints are derived like the background's, and an
 * off-by-default toggle extends the sweep through the title text of all three
 * render roles. Resolves the palette (without id) on save, or null on
 * cancel/close.
 */
import { Modal, Setting, setIcon } from "obsidian";
import type { App, SliderComponent } from "obsidian";
import type { BgGradient, CalloutDefinition, CustomPalette } from "../types";
import {
	bgTintFor,
	DEFAULT_BG_INTENSITY_GRADIENT,
	DEFAULT_BG_INTENSITY_SOLID,
	derivePaletteFromColor,
	MAX_BG_COLOR_AMOUNT,
	MIN_BG_COLOR_AMOUNT,
	rotateHue,
	type DerivedPalette,
} from "../utils/colorUtils";
import { createColorSwatchInput } from "../ui/ColorSwatchInput";
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

/** The preset linear-gradient directions, clockwise from "to top" (0°). */
const GRADIENT_DIRECTIONS: { deg: number; icon: string }[] = [
	{ deg: 45, icon: "arrow-up-right" },
	{ deg: 90, icon: "arrow-right" },
	{ deg: 135, icon: "arrow-down-right" },
];
/** Top-left → bottom-right, the classic presentation-software default. */
const DEFAULT_GRADIENT_ANGLE = 135;
/** Hue offset for the auto-suggested gradient second color. */
const GRADIENT_HUE_SHIFT = 45;

type BgStyle = "solid" | "gradient";

/** Names are compared case-insensitively, ignoring surrounding whitespace. */
const normalizeName = (name: string): string => name.trim().toLowerCase();

export class PaletteEditorModal extends Modal {
	private existing: CustomPalette | null;
	/** Normalized names of every other palette (custom AND built-in presets). */
	private takenNames: Set<string>;
	private name: string;
	private baseColor: string;
	private colors: DerivedPalette;
	private bgStyle: BgStyle;
	/** How strongly the background color shows; steers all bg-tint derivation. */
	private bgIntensity: number;
	/** Once the user drags the slider, style toggles stop overwriting it with a per-style default. */
	private bgIntensityTouched: boolean;
	private bgIntensitySlider: SliderComponent | null = null;
	// Gradient state. The end (stop-2) colors are tints of gradientToBase,
	// derived exactly like the six colors are derived from the base color.
	private angleDeg: number;
	private gradientToBase: string;
	/** Once the user picks a second color it stops auto-following the base. */
	private gradientToTouched: boolean;
	private toColorLight = "";
	private toColorDark = "";
	/** Opt-in: paint the gradient through the title text of all three roles. */
	private textGradient: boolean;
	// Accent-strength counterparts of toColor*, for the text sweep.
	private textToColorLight = "";
	private textToColorDark = "";
	private resolve: ((result: PaletteEditorResult | null) => void) | null =
		null;

	private previewEl: HTMLElement | null = null;
	private preview: LiveCalloutPreview | null = null;
	/** Preview the caller had registered before this modal took the slot. */
	private outerPreview: CalloutDefinition | null = null;
	private nameInputEl: HTMLInputElement | null = null;
	private nameErrorEl: HTMLElement | null = null;
	private saveBtnEl: HTMLButtonElement | null = null;
	// Gradient UI refs for show/hide and programmatic color sync.
	private gradientRows: HTMLElement[] = [];
	private gradToInput: HTMLInputElement | null = null;

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
		const g = this.existing?.bgGradient;
		this.bgStyle = g ? "gradient" : "solid";
		// Set before any derivation below: deriveGradientEnd() and the new-palette
		// branch both read this to decide how strong the background reads. A
		// fresh palette seeds from the per-style default (gradients default
		// higher — a two-stop sweep reads fainter than a solid fill at the same
		// amount); a saved value is the user's own choice and always wins.
		this.bgIntensityTouched = this.existing?.bgIntensity !== undefined;
		this.bgIntensity =
			this.existing?.bgIntensity ??
			(this.bgStyle === "gradient"
				? DEFAULT_BG_INTENSITY_GRADIENT
				: DEFAULT_BG_INTENSITY_SOLID);
		this.colors = this.existing
			? {
					colorLight: this.existing.colorLight,
					colorDark: this.existing.colorDark,
					bgColorLight: this.existing.bgColorLight,
					bgColorDark: this.existing.bgColorDark,
					textColorLight: this.existing.textColorLight,
					textColorDark: this.existing.textColorDark,
				}
			: derivePaletteFromColor(this.baseColor, this.bgIntensity);
		this.angleDeg = g?.angleDeg ?? DEFAULT_GRADIENT_ANGLE;
		// A saved gradient's end colors are authoritative (derivation is not
		// invertible); a fresh gradient starts from a hue-shifted base color
		// so toggling it on is immediately visible.
		this.gradientToTouched = !!g;
		this.gradientToBase =
			g?.toColorLight ?? rotateHue(this.baseColor, GRADIENT_HUE_SHIFT);
		this.textGradient = g?.textGradient ?? false;
		// Derive first, then let a saved gradient's own colors win: derivation
		// is not invertible, so the stored values are authoritative wherever
		// they exist. Gradients saved before the text sweep existed carry no
		// text ends, and gradientToBase is then the pale toColorLight — the
		// derivation only darkens that tint to a readable strength instead of
		// recovering the original second color, which is enough to make the
		// toggle usable until the second color picker is touched.
		this.deriveGradientEnd();
		if (g) {
			this.toColorLight = g.toColorLight;
			this.toColorDark = g.toColorDark;
			this.textToColorLight = g.textToColorLight ?? this.textToColorLight;
			this.textToColorDark = g.textToColorDark ?? this.textToColorDark;
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
		// Same flex shell as the callout editor: sticky title, scrolling
		// content (the sticky preview column relies on that scroll container),
		// and a fixed footer for the buttons.
		this.modalEl.addClass("callout-studio-editor-modal");

		// Two-column body from the very first row: options (including the name)
		// on the left, sticky live preview on the right — the callout editor's
		// panel classes.
		const panel = contentEl.createDiv({
			cls: "callout-studio-preview-panel",
		});
		const adjustCol = panel.createDiv({ cls: "callout-studio-adjust-col" });
		const previewCol = panel.createDiv({
			cls: "callout-studio-preview-col",
		});

		const nameSetting = new Setting(adjustCol)
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

		this.buildBgStyleRow(adjustCol);

		const baseSetting = new Setting(adjustCol).setName(t("palette.baseColor"));
		createColorSwatchInput(
			baseSetting.controlEl,
			this.baseColor,
			(hex) => {
				this.baseColor = hex;
				this.applyDerived();
			},
		);

		this.buildGradientToRow(adjustCol);

		this.buildBgIntensityRow(adjustCol);

		this.buildGradientDirectionAndTextRows(adjustCol);

		this.previewEl = previewCol.createDiv({
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

		// Footer outside the scrolling content, like the callout editor's.
		const buttons = this.modalEl.createDiv({
			cls: "callout-studio-editor-buttons",
		});
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
		this.colors = derivePaletteFromColor(this.baseColor, this.bgIntensity);
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
		this.syncGradientInputs();
		this.preview?.refresh();
	}

	/**
	 * Recomputes both end-color pairs from the second base color: the pale
	 * tints the background sweep ends on, and their accent-strength
	 * counterparts for the text sweep — derived exactly the way the palette's
	 * own accent is derived from its base color, so the two stops of a
	 * gradient title are as readable as any other accent in the palette.
	 */
	private deriveGradientEnd(): void {
		this.toColorLight = bgTintFor(this.gradientToBase, false, this.bgIntensity);
		this.toColorDark = bgTintFor(this.gradientToBase, true, this.bgIntensity);
		const accents = derivePaletteFromColor(this.gradientToBase);
		this.textToColorLight = accents.colorLight;
		this.textToColorDark = accents.colorDark;
	}

	/** The gradient to preview/persist, or null unless Gradient is selected. */
	private currentGradient(): BgGradient | null {
		if (this.bgStyle !== "gradient") return null;
		const gradient: BgGradient = {
			angleDeg: this.angleDeg,
			toColorLight: this.toColorLight,
			toColorDark: this.toColorDark,
			// Persisted even while the sweep is off, so turning it on later
			// paints with the user's real second color instead of a lossy
			// re-derivation from the pale tints above.
			textToColorLight: this.textToColorLight,
			textToColorDark: this.textToColorDark,
		};
		if (this.textGradient) gradient.textGradient = true;
		return gradient;
	}

	/** Solid|Gradient segmented switch — sits above the base color. */
	private buildBgStyleRow(parent: HTMLElement): void {
		const bgStyleSetting = new Setting(parent).setName(
			t("palette.bgStyle"),
		);
		this.buildSegmented<BgStyle>(
			bgStyleSetting.controlEl,
			[
				{ value: "solid", label: t("palette.bgSolid") },
				{ value: "gradient", label: t("palette.bgGradient") },
			],
			this.bgStyle,
			(v) => {
				this.bgStyle = v;
				// Follow the per-style default until the user drags the slider
				// themselves; once touched, their chosen intensity sticks across
				// style toggles instead of being overwritten.
				if (!this.bgIntensityTouched) {
					this.bgIntensity =
						v === "gradient"
							? DEFAULT_BG_INTENSITY_GRADIENT
							: DEFAULT_BG_INTENSITY_SOLID;
					this.bgIntensitySlider?.setValue(
						Math.round(this.bgIntensity * 100),
					);
					this.applyDerived();
				} else {
					this.preview?.refresh();
				}
				this.updateGradientVisibility();
			},
		);
	}

	/**
	 * Background-intensity slider: how strongly the color shows. Applies to
	 * BOTH solid and gradient backgrounds, so — unlike the gradient-only rows
	 * around it — it is always visible: sits right under Base color in Solid
	 * (the hidden Second color row above it takes no space), and under Second
	 * color in Gradient. Works in whole percent; the stored value is a 0..1
	 * fraction. Re-deriving on change overwrites the six colors and gradient
	 * tints (the same contract as changing the base color).
	 */
	private buildBgIntensityRow(parent: HTMLElement): void {
		new Setting(parent)
			.setName(t("palette.bgIntensity"))
			.addSlider((slider) => {
				this.bgIntensitySlider = slider;
				slider
					.setLimits(
						Math.round(MIN_BG_COLOR_AMOUNT * 100),
						Math.round(MAX_BG_COLOR_AMOUNT * 100),
						1,
					)
					.setValue(Math.round(this.bgIntensity * 100))
					.setDynamicTooltip()
					.setInstant(true)
					.onChange((v) => {
						this.bgIntensity = v / 100;
						this.bgIntensityTouched = true;
						this.applyDerived();
					});
			});
	}

	/**
	 * Gradient-only row for the second color. Built separately from the rest
	 * of the gradient controls so the always-visible Intensity row can sit
	 * directly below it (falls back to right after Base color when Solid is
	 * selected, since this row is hidden and takes no space then).
	 */
	private buildGradientToRow(parent: HTMLElement): void {
		const toSetting = new Setting(parent).setName(t("palette.gradientTo"));
		this.gradToInput = createColorSwatchInput(
			toSetting.controlEl,
			this.gradientToBase,
			(hex) => {
				this.gradientToBase = hex;
				this.gradientToTouched = true;
				this.deriveGradientEnd();
				this.syncGradientInputs();
				this.preview?.refresh();
			},
		).input;
		this.gradientRows.push(toSetting.settingEl);
	}

	/**
	 * Gradient-only rows, shown while the Gradient style is selected: the
	 * direction picker and the title-text sweep toggle.
	 */
	private buildGradientDirectionAndTextRows(parent: HTMLElement): void {
		const dirSetting = new Setting(parent).setName(
			t("palette.gradientDirection"),
		);
		this.buildDirectionPicker(dirSetting.controlEl, this.angleDeg, (deg) => {
			this.angleDeg = deg;
			this.preview?.refresh();
		});
		this.gradientRows.push(dirSetting.settingEl);

		const textSetting = new Setting(parent)
			.setName(t("palette.gradientText"))
			.addToggle((toggle) => {
				toggle.setValue(this.textGradient).onChange((on) => {
					this.textGradient = on;
					this.preview?.refresh();
				});
			});
		this.gradientRows.push(textSetting.settingEl);
		this.updateGradientVisibility();
	}

	/**
	 * Arrow direction picker for the linear gradient's angle. Manages its
	 * own active-button state.
	 */
	private buildDirectionPicker(
		parent: HTMLElement,
		initialDeg: number,
		onPick: (deg: number) => void,
	): void {
		const dirWrap = parent.createDiv({
			cls: "cs-gradient-dir-row",
		});
		const dirBtns = new Map<number, HTMLButtonElement>();
		for (const { deg, icon } of GRADIENT_DIRECTIONS) {
			const btn = dirWrap.createEl("button", {
				cls: "cs-gradient-dir-btn",
				attr: { "aria-label": `${deg}°`, title: `${deg}°` },
			});
			setIcon(btn, icon);
			if (deg === initialDeg) btn.addClass("is-active");
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				for (const b of dirBtns.values()) b.removeClass("is-active");
				btn.addClass("is-active");
				onPick(deg);
			});
			dirBtns.set(deg, btn);
		}
	}

	/** Segmented control that manages its own active state. */
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

	/** Shows/hides the gradient rows to match the current style choice. */
	private updateGradientVisibility(): void {
		const off = this.bgStyle !== "gradient";
		for (const row of this.gradientRows) {
			row.toggleClass("cs-gradient-hidden", off);
		}
	}

	/** Pushes gradient colors into their swatches after a programmatic change. */
	private syncGradientInputs(): void {
		const entries: [HTMLInputElement | null | undefined, string][] = [
			[this.gradToInput, this.gradientToBase],
		];
		for (const [input, value] of entries) {
			if (!input) continue;
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
				bgIntensity: this.bgIntensity,
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
