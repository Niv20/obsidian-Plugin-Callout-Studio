/**
 * settings/styleControls.ts — Shared builders for the global style controls
 * (titled group boxes, slider rows, border-side buttons).
 *
 * Extracted from the old GlobalStyleSection so the three per-role "Global
 * callout style" popups (regular / heading / inline) compose the same control
 * groups. Every control follows the same live-update contract: dragging
 * previews the change via cssInjector.scheduleInject(), releasing commits it
 * via saveSettings() + cssInjector.inject().
 */
import { Setting } from "obsidian";
import { t } from "../i18n";
import {
	createAnimatedNumberLabel,
	type AnimatedNumberLabelOptions,
} from "../ui/AnimatedNumberLabel";
import type { BorderSidesSettings } from "../types";
import type { SettingsTabPlugin } from "./sections/types";

/** A titled control group box (bordered section with a muted header). */
export function createControlGroup(
	parentEl: HTMLElement,
	title: string,
	extraCls = "",
): HTMLElement {
	const groupEl = parentEl.createDiv({
		cls: `callout-studio-adjust-section cs-settings-group${
			extraCls ? " " + extraCls : ""
		}`,
	});
	groupEl.createDiv({
		cls: "callout-studio-adjust-header cs-settings-group-header",
		text: title,
	});
	return groupEl;
}

export interface StyleSliderSpec {
	label: string;
	min: number;
	max: number;
	step: number;
	/** Decimal places kept when rounding slider values. */
	decimals: number;
	/** Prefix/suffix/format for the animated value readout. */
	numberOptions: Omit<AnimatedNumberLabelOptions, "initialValue">;
	get(): number;
	set(value: number): void;
	/**
	 * Fired once when the user begins dragging the thumb (pointer down, or the
	 * first keyboard nudge). Lets a caller swap in a bespoke preview for the
	 * duration of the drag. Optional — sliders that omit it behave as before.
	 */
	onDragStart?(): void;
	/** Fired once when the drag ends (pointer up / cancel, or the slider's
	 * `change` on release). Pairs with {@link onDragStart} to restore. */
	onDragEnd?(): void;
}

/**
 * A labelled slider row: label + animated value readout above a full-width
 * slider, wired to the live-update contract described in the module header.
 */
export function addStyleSlider(
	plugin: SettingsTabPlugin,
	parentEl: HTMLElement,
	spec: StyleSliderSpec,
): void {
	const row = parentEl.createDiv({ cls: "callout-studio-slider-row" });
	const labelEl = row.createDiv({ cls: "callout-studio-slider-label" });
	labelEl.createSpan({ text: spec.label });
	const valueLabel = createAnimatedNumberLabel(labelEl, {
		...spec.numberOptions,
		initialValue: spec.get(),
	});

	const factor = Math.pow(10, spec.decimals);
	const round = (v: number): number => Math.round(v * factor) / factor;

	// Coalesce the per-move live reflow to at most one inject per animation
	// frame, so even a fast drag updates the preview every frame (~60fps)
	// instead of stalling behind a debounce until the thumb stops.
	let rafId: number | null = null;
	const scheduleLiveInject = (): void => {
		if (rafId !== null) return;
		rafId = window.requestAnimationFrame(() => {
			rafId = null;
			// `false` = skip the css-change re-render: geometry rides CSS
			// variables and reflows on stylesheet replace, so this stays cheap.
			plugin.cssInjector.inject(false);
		});
	};

	// Drag-lifecycle notifications for callers that swap in a bespoke preview
	// while the thumb is held. `dragging` dedupes the several DOM events that
	// can each signal a start/end (pointer vs. keyboard) into one start + one
	// end per drag.
	let dragging = false;
	const beginDrag = (): void => {
		if (dragging) return;
		dragging = true;
		spec.onDragStart?.();
	};
	const endDrag = (): void => {
		if (!dragging) return;
		dragging = false;
		spec.onDragEnd?.();
	};

	new Setting(row).addSlider((slider) => {
		slider.setLimits(spec.min, spec.max, spec.step).setValue(spec.get());
		slider.sliderEl.addEventListener("input", () => {
			// Covers keyboard nudges, which fire `input` without a pointerdown.
			beginDrag();
			const v = round(parseFloat(slider.sliderEl.value));
			spec.set(v);
			valueLabel.update(v);
			scheduleLiveInject();
		});
		if (spec.onDragStart || spec.onDragEnd) {
			slider.sliderEl.addEventListener("pointerdown", beginDrag);
			slider.sliderEl.addEventListener("pointerup", endDrag);
			slider.sliderEl.addEventListener("pointercancel", endDrag);
		}
		slider.onChange(async (v) => {
			// `change` marks the end of a drag (release) as well as commit.
			endDrag();
			spec.set(round(v));
			await plugin.saveSettings();
			plugin.cssInjector.inject();
		});
	});
}

/**
 * The "Borders" group: an All + per-side toggle button row, plus a thickness
 * slider that stays hidden while no side is active. Mutates `frame` in place
 * (the caller passes the live settings object).
 */
export function renderBordersGroup(
	plugin: SettingsTabPlugin,
	parentEl: HTMLElement,
	frame: { borderSides: BorderSidesSettings; borderWidth: number },
): void {
	const groupEl = createControlGroup(parentEl, t("settings.border"));
	const sidesRow = groupEl.createDiv({ cls: "cs-border-sides-row" });

	const sides: { key: keyof BorderSidesSettings; label: string }[] = [
		{ key: "top", label: t("settings.borderTop") },
		{ key: "right", label: t("settings.borderRight") },
		{ key: "bottom", label: t("settings.borderBottom") },
		{ key: "left", label: t("settings.borderLeft") },
	];

	const isAll = (): boolean => sides.every((s) => frame.borderSides[s.key]);
	const isAny = (): boolean => sides.some((s) => frame.borderSides[s.key]);

	const allBtn = sidesRow.createEl("button", {
		cls: `cs-border-side-btn${isAll() ? " is-active" : ""}`,
		text: t("settings.borderAll"),
	});

	const sideButtons = new Map<string, HTMLButtonElement>();

	const commit = async (): Promise<void> => {
		await plugin.saveSettings();
		plugin.cssInjector.inject();
		syncUI();
	};

	allBtn.addEventListener("click", () => {
		void (async () => {
			const newVal = !isAll();
			for (const s of sides) frame.borderSides[s.key] = newVal;
			await commit();
		})();
	});

	for (const side of sides) {
		const btn = sidesRow.createEl("button", {
			cls: `cs-border-side-btn${
				frame.borderSides[side.key] ? " is-active" : ""
			}`,
			text: side.label,
		});
		sideButtons.set(side.key, btn);
		btn.addEventListener("click", () => {
			void (async () => {
				frame.borderSides[side.key] = !frame.borderSides[side.key];
				await commit();
			})();
		});
	}

	const widthRow = groupEl.createDiv({ cls: isAny() ? "" : "cs-hidden" });
	addStyleSlider(plugin, widthRow, {
		label: t("settings.borderWidth"),
		min: 1,
		max: 4,
		step: 0.5,
		decimals: 1,
		numberOptions: { suffix: "px", format: { maximumFractionDigits: 1 } },
		get: () => frame.borderWidth,
		set: (v) => {
			frame.borderWidth = v;
		},
	});

	const syncUI = (): void => {
		allBtn.toggleClass("is-active", isAll());
		for (const side of sides) {
			sideButtons
				.get(side.key)
				?.toggleClass("is-active", frame.borderSides[side.key]);
		}
		widthRow.toggleClass("cs-hidden", !isAny());
	};
}
