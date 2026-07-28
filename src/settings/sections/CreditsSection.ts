/**
 * settings/sections/CreditsSection.ts — Icon licences and credits.
 *
 * Several of the icon libraries the plugin draws from require attribution that
 * a reader can actually see — Font Awesome's icons are CC BY 4.0, which asks
 * for the creator, the source, the licence and a note that the work was
 * modified. This is that surface.
 *
 * It is generated from the icon-source registry rather than written out, so a
 * source added without its licensing details cannot quietly ship uncredited:
 * whatever a pack declares is what appears here.
 */
import { setIcon } from "obsidian";
import { ICON_SOURCE_IDS, getSource } from "../../icons/registry";
import type { IconPack } from "../../icons/types";
import { t } from "../../i18n";
import type { SettingsSectionContext } from "./types";

const NOTICES_URL =
	"https://github.com/Niv20/obsidian-Plugin-Callout-Studio/blob/master/THIRD-PARTY-NOTICES.md";

export function renderCreditsSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const details = containerEl.createEl("details", {
		cls: "callout-studio-credits",
	});
	const summary = details.createEl("summary", {
		cls: "callout-studio-credits-summary",
	});
	const chevron = summary.createSpan({ cls: "callout-studio-credits-chevron" });
	setIcon(chevron, "chevron-right");
	summary.createSpan({ text: t("credits.title") });

	details.createEl("p", {
		text: t("credits.intro"),
		cls: "callout-studio-credits-intro",
	});

	for (const id of ICON_SOURCE_IDS) {
		renderPackCredit(details, getSource(id));
	}

	const more = details.createEl("p", { cls: "callout-studio-credits-more" });
	more.createEl("a", {
		text: t("credits.fullNotices"),
		href: NOTICES_URL,
		attr: { target: "_blank", rel: "noopener noreferrer" },
	});
	more.createSpan({ text: " " });
	more.createSpan({ text: t("credits.pluginLicense") });
	void ctx;
}

function renderPackCredit(parent: HTMLElement, pack: IconPack): void {
	const { attribution } = pack;
	const row = parent.createDiv({ cls: "callout-studio-credit" });

	const heading = row.createDiv({ cls: "callout-studio-credit-name" });
	heading.createEl("a", {
		text: attribution.title,
		href: attribution.homepage,
		attr: { target: "_blank", rel: "noopener noreferrer" },
	});
	heading.createSpan({
		text: ` ${attribution.version}`,
		cls: "callout-studio-credit-version",
	});

	for (const license of attribution.licenses) {
		const line = row.createDiv({ cls: "callout-studio-credit-license" });
		line.createSpan({ text: `© ${license.holder} — ` });
		line.createEl("a", {
			text: license.name,
			href: license.url,
			attr: { target: "_blank", rel: "noopener noreferrer" },
		});
		if (license.scope) {
			line.createSpan({
				text: ` (${license.scope})`,
				cls: "callout-studio-credit-scope",
			});
		}
	}

	// CC BY 4.0 requires saying that the work was changed, and how.
	if (attribution.modifications) {
		row.createDiv({
			text: attribution.modifications,
			cls: "callout-studio-credit-modifications",
		});
	}

	if (attribution.noticeKey) {
		row.createDiv({
			text: t(attribution.noticeKey),
			cls: "callout-studio-credit-notice",
		});
	}
}
