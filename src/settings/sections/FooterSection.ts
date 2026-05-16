/**
 * settings/sections/FooterSection.ts — Settings tab footer.
 *
 * Renders the bottom of the settings page: a tagline, links to the GitHub
 * repository and author email, and the current plugin version number.
 * Has no interactive logic; purely informational.
 */
import { t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

export function renderFooterSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const footer = containerEl.createDiv({
		cls: "callout-studio-footer",
	});
	footer.createEl("p", {
		text: t("footer.tagline"),
		cls: "callout-studio-footer-tagline",
	});
	const links = footer.createEl("p", {
		cls: "callout-studio-footer-links",
	});
	links.createSpan({ text: t("footer.madeBy") });
	links.createEl("a", {
		text: "GitHub",
		href: "https://github.com/Niv20/obsidian-Plugin-Callout-Studio",
		attr: { target: "_blank", rel: "noopener noreferrer" },
	});
	links.createSpan({ text: "  •  " });
	links.createEl("a", {
		text: "Email",
		href: "mailto:anivbniv@gmail.com",
	});
	links.createSpan({ text: "  •  " });
	links.createSpan({ text: `v${ctx.plugin.manifest.version}` });
}
