/**
 * settings/sections/CustomPalettesSection.ts — "Saved color palettes" section.
 *
 * Lists the user's custom palettes (current-mode accent/background swatch +
 * name + edit/delete) with a "New palette" button opening PaletteEditorModal.
 * Palettes are stored in settings.customPalettes and surfaced in the callout
 * editor's palette dropdown under the "Custom" group. Colors are baked into
 * callouts at apply time, so editing or deleting a palette never changes
 * existing callouts.
 */
import { Setting, setIcon } from "obsidian";
import { t } from "../../i18n";
import type { CustomPalette } from "../../types";
import type { SettingsSectionContext } from "./types";
import { generatePaletteId } from "../../utils/colorPalettes";
import {
	renderColorCircles,
	resolveCurrentModeColors,
} from "../../ui/ColorCircles";
import { PaletteEditorModal } from "../PaletteEditorModal";
import { ConfirmModal } from "../../utils/ConfirmModal";

export function renderCustomPalettesSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const takenNamesExcept = (excludeId?: string): string[] =>
		ctx.plugin.settings.customPalettes
			.filter((p) => p.id !== excludeId)
			.map((p) => p.name);

	const heading = new Setting(containerEl)
		.setName(t("settings.customPalettes"))
		.setHeading();
	heading.addButton((btn) =>
		btn
			.setButtonText(t("settings.newPalette"))
			.setCta()
			.onClick(async () => {
				const result = await new PaletteEditorModal(ctx.plugin, {
					takenNames: takenNamesExcept(),
				}).openAndWait();
				if (!result) return;
				ctx.plugin.settings.customPalettes.push({
					id: generatePaletteId(),
					...result,
				});
				await ctx.plugin.saveSettings();
				renderList();
			}),
	);
	const listEl = containerEl.createDiv({ cls: "cs-palette-list" });

	const editPalette = async (palette: CustomPalette): Promise<void> => {
		const result = await new PaletteEditorModal(ctx.plugin, {
			existing: palette,
			takenNames: takenNamesExcept(palette.id),
		}).openAndWait();
		if (!result) return;
		Object.assign(palette, result);
		await ctx.plugin.saveSettings();
		renderList();
	};

	const deletePalette = async (palette: CustomPalette): Promise<void> => {
		const ok = await new ConfirmModal(
			ctx.app,
			t("settings.deletePaletteConfirm", { name: palette.name }),
		).confirm();
		if (!ok) return;
		const list = ctx.plugin.settings.customPalettes;
		const idx = list.findIndex((p) => p.id === palette.id);
		if (idx >= 0) list.splice(idx, 1);
		await ctx.plugin.saveSettings();
		renderList();
	};

	const renderList = (): void => {
		listEl.empty();
		// Sorted A→Z for display only; the underlying settings array keeps
		// insertion order.
		const palettes = [...ctx.plugin.settings.customPalettes].sort((a, b) =>
			a.name.localeCompare(b.name),
		);
		if (palettes.length === 0) {
			listEl.createDiv({
				cls: "callout-studio-empty-state",
				text: t("settings.customPalettesEmpty"),
			});
			return;
		}
		for (const palette of palettes) {
			const row = listEl.createDiv({
				cls: "callout-studio-row cs-palette-list-row",
			});
			const colorsEl = row.createDiv({
				cls: "callout-studio-row-colors",
			});
			const { accent, bg } = resolveCurrentModeColors(palette);
			renderColorCircles(colorsEl, accent, bg, {
				size: 18,
				ariaLabel: t("settings.colorSwatchAria", { accent, bg }),
			});
			row.createSpan({
				cls: "cs-palette-list-name",
				text: palette.name,
				attr: { title: palette.name },
			});

			const buttonsEl = row.createDiv({
				cls: "callout-studio-row-buttons",
			});
			const editBtn = buttonsEl.createEl("button", {
				attr: {
					"aria-label": t("settings.editPaletteAria", {
						name: palette.name,
					}),
				},
			});
			setIcon(editBtn, "pencil");
			editBtn.addEventListener("click", () => void editPalette(palette));
			const deleteBtn = buttonsEl.createEl("button", {
				attr: {
					"aria-label": t("settings.deletePaletteAria", {
						name: palette.name,
					}),
				},
			});
			setIcon(deleteBtn, "trash-2");
			deleteBtn.addEventListener("click", () =>
				void deletePalette(palette),
			);
		}
	};

	// The swatches show the CURRENT theme mode, so re-render on a live theme
	// flip. Debounced: CSSInjector fires "css-change" after every inject.
	let refreshTimer: number | null = null;
	const cssRef = ctx.app.workspace.on("css-change", () => {
		if (!listEl.isConnected) return;
		if (refreshTimer !== null) window.clearTimeout(refreshTimer);
		refreshTimer = window.setTimeout(() => {
			refreshTimer = null;
			if (listEl.isConnected) renderList();
		}, 60);
	});
	ctx.registerDisposer(() => {
		ctx.app.workspace.offref(cssRef);
		if (refreshTimer !== null) window.clearTimeout(refreshTimer);
	});

	renderList();
}
