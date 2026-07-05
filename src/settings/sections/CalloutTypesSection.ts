/**
 * settings/sections/CalloutTypesSection.ts — Explains the three callout roles
 * and toggles the two optional ones.
 *
 * A single callout definition can render as a regular blockquote callout, a
 * heading callout, or an inline pill. Regular rendering is always on (it is
 * Obsidian's native behavior); heading and inline rendering can each be
 * switched off. Toggling re-renders both preview modes live so pills and
 * heading bars appear or disappear immediately.
 */
import { Setting } from "obsidian";
import { t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

export function renderCalloutTypesSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { settings } = ctx.plugin;

	new Setting(containerEl).setName(t("settings.calloutTypes")).setHeading();

	// Regular — always on; explanation only.
	new Setting(containerEl)
		.setName(t("settings.calloutTypeRegular"))
		.setDesc(t("settings.calloutTypeRegularDesc"));

	// Heading callout — toggleable.
	new Setting(containerEl)
		.setName(t("settings.calloutTypeHeading"))
		.setDesc(t("settings.calloutTypeHeadingDesc"))
		.addToggle((tog) =>
			tog
				.setValue(settings.headingCallouts.enabled)
				.onChange(async (v) => {
					settings.headingCallouts.enabled = v;
					await ctx.plugin.saveSettings();
					ctx.plugin.refreshRenderModes();
				}),
		);

	// Inline callout — toggleable.
	new Setting(containerEl)
		.setName(t("settings.calloutTypeInline"))
		.setDesc(t("settings.calloutTypeInlineDesc"))
		.addToggle((tog) =>
			tog
				.setValue(settings.inlineCallouts.enabled)
				.onChange(async (v) => {
					settings.inlineCallouts.enabled = v;
					await ctx.plugin.saveSettings();
					ctx.plugin.refreshRenderModes();
				}),
		);
}
