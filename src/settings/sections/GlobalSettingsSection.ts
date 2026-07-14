/**
 * settings/sections/GlobalSettingsSection.ts — Vault-wide callout style entry points.
 *
 * A single callout definition can render as a regular blockquote callout, a
 * heading callout, or an inline pill. Each role has its own vault-wide geometry
 * (borders, spacing, shape, …) edited in the per-role "Global callout style"
 * popup ({@link GlobalStyleModal}). This section is just a heading, a one-line
 * intro, and three buttons — one per role — that open those popups.
 *
 * Each role also has an `enabled` setting (regular is always on; heading and
 * inline can each be disabled) that still gates rendering, but it is not
 * exposed here as a toggle.
 */
import { ButtonComponent, Setting } from "obsidian";
import { t } from "../../i18n";
import type { CalloutRenderRole } from "../../types";
import { GlobalStyleModal } from "../GlobalStyleModal";
import type { SettingsSectionContext } from "./types";

export function renderGlobalSettingsSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	new Setting(containerEl).setName(t("settings.globalSettings")).setHeading();

	containerEl.createEl("p", {
		cls: "cs-global-settings-desc",
		text: t("settings.globalSettingsDesc"),
	});

	const buttonsEl = containerEl.createDiv({ cls: "cs-global-settings-buttons" });

	const roles: { role: CalloutRenderRole; label: string }[] = [
		{ role: "regular", label: t("settings.calloutTypeRegular") },
		{ role: "heading", label: t("settings.calloutTypeHeading") },
		{ role: "inline", label: t("settings.calloutTypeInline") },
	];

	for (const { role, label } of roles) {
		new ButtonComponent(buttonsEl)
			.setButtonText(label)
			.onClick(() => new GlobalStyleModal(ctx.plugin, role).open());
	}
}
