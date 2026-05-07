/**
 * settings/sections/CalloutRowRenderer.ts — Renders a single callout row in settings.
 *
 * Builds the DOM for one row in the callout lists: icon, display name, ID
 * badges, color circles, and action buttons. Calls back into CalloutRowActions
 * for the three-dot menu and into CalloutEditor for the edit flow.
 * Used by CalloutListsSection for both the user list and the built-in list.
 */
import { setIcon } from "obsidian";
import { getLocale, t } from "../../i18n";
import { getSortedCalloutIds } from "../../utils/sorting";
import { renderColorCircles } from "../../ui/ColorCircles";
import type { CalloutDefinition } from "../../types";
import type { SettingsSectionContext } from "./types";

type RowRendererHandlers = {
	onEdit: (def: CalloutDefinition, isBuiltIn: boolean) => void;
	onOpenBuiltInMenu: (event: MouseEvent, def: CalloutDefinition) => void;
	onOpenUserMenu: (event: MouseEvent, def: CalloutDefinition) => void;
};

export function renderCalloutRow(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
	def: CalloutDefinition,
	isBuiltIn: boolean,
	handlers: RowRendererHandlers,
): void {
	const row = containerEl.createDiv({ cls: "callout-studio-row" });

	const iconEl = row.createDiv({ cls: "callout-studio-row-icon" });
	renderRowIcon(ctx, iconEl, def);

	const infoEl = row.createDiv({ cls: "callout-studio-row-info" });
	const nameLine = infoEl.createDiv({
		cls: "callout-studio-row-name-line",
	});
	nameLine.createSpan({
		cls: "callout-studio-row-name",
		text: def.displayName,
		attr: { title: def.displayName },
	});
	if (def.id === ctx.plugin.settings.fallbackCalloutId) {
		nameLine.createSpan({
			cls: "cs-fallback-tag",
			text: t("settings.fallbackTag"),
		});
	} else if (def.source === "fallback" && def.customized !== true) {
		nameLine.createSpan({
			cls: "cs-fallback-tag",
			text: t("settings.fallbackTagAuto"),
		});
	}
	const syntaxLine = infoEl.createDiv({
		cls: "callout-studio-row-syntax-line",
	});
	const allIds = getSortedCalloutIds(def, getLocale());
	for (const id of allIds) {
		syntaxLine.createEl("code", {
			cls: "callout-studio-row-syntax",
			text: `> [!${id}]`,
		});
	}

	const colorsEl = row.createDiv({ cls: "callout-studio-row-colors" });
	renderColorCircles(colorsEl, def.colorLight, def.colorDark, {
		size: 18,
		ariaLabel: t("settings.colorPairAria", {
			light: def.colorLight,
			dark: def.colorDark,
		}),
	});

	const buttonsEl = row.createDiv({ cls: "callout-studio-row-buttons" });

	const editBtn = buttonsEl.createEl("button", {
		attr: {
			"aria-label": t("settings.editAria", { name: def.displayName }),
		},
	});
	setIcon(editBtn, "pencil");
	editBtn.addEventListener("click", () => {
		handlers.onEdit(def, isBuiltIn);
	});

	const moreBtn = buttonsEl.createEl("button", {
		cls: "callout-studio-more-btn",
		attr: {
			"aria-label": t("settings.moreRowActionsAria", {
				name: def.displayName,
			}),
		},
	});
	setIcon(moreBtn, "more-horizontal");
	moreBtn.addEventListener("click", (event) => {
		if (isBuiltIn) {
			handlers.onOpenBuiltInMenu(event, def);
			return;
		}
		handlers.onOpenUserMenu(event, def);
	});
}

function renderRowIcon(
	ctx: SettingsSectionContext,
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
			const cached = ctx.plugin.registry.findMaterialSvg(
				def.icon.value,
				def.icon.style ?? "outlined",
				def.icon.weight ?? 400,
			);
			if (cached) {
				const parser = new DOMParser();
				const doc = parser.parseFromString(cached.svg, "image/svg+xml");
				const svgEl = doc.documentElement;
				svgEl.setAttribute("fill", "currentColor");
				container.appendChild(container.doc.importNode(svgEl, true));
			} else {
				const failed = ctx.plugin.hasMaterialSvgFailed(
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
