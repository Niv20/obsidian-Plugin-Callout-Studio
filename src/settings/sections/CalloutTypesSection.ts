/**
 * settings/sections/CalloutTypesSection.ts — The three callout roles as cards.
 *
 * A single callout definition can render as a regular blockquote callout, a
 * heading callout, or an inline pill. Each role gets a card (the cards stack
 * vertically) holding two parts: an info column (role name + description +
 * a button opening the per-role "Global callout style" popup,
 * {@link GlobalStyleModal}) and a live preview of that role. On wide panes
 * (desktop / tablet) the two sit side by side — info column next to the
 * preview; on narrow panes (phone) the info column stacks above the preview.
 *
 * Each role also has an `enabled` setting (regular is always on; heading and
 * inline can each be disabled) that still gates rendering, but it is no longer
 * exposed as a toggle in this UI. The spec's getEnabled/setEnabled hooks are
 * kept wired so the toggle can be re-added later without further changes.
 */
import { ButtonComponent, Setting } from "obsidian";
import { t } from "../../i18n";
import type { CalloutRenderRole } from "../../types";
import { GlobalStyleModal } from "../GlobalStyleModal";
import { LiveCalloutPreview } from "../LiveCalloutPreview";
import type { SettingsSectionContext } from "./types";

interface RoleCardSpec {
	role: CalloutRenderRole;
	name: string;
	desc: string;
	getEnabled(): boolean;
	/** null → the role can't be disabled (regular); the toggle bounces back. */
	setEnabled: ((value: boolean) => Promise<void>) | null;
}

export function renderCalloutTypesSection(
	ctx: SettingsSectionContext,
	containerEl: HTMLElement,
): void {
	const { settings } = ctx.plugin;

	new Setting(containerEl).setName(t("settings.calloutTypes")).setHeading();

	const cardsEl = containerEl.createDiv({ cls: "cs-role-cards" });

	renderRoleCard(ctx, cardsEl, {
		role: "regular",
		name: t("settings.calloutTypeRegular"),
		desc: t("settings.calloutTypeRegularDesc"),
		getEnabled: () => true,
		setEnabled: null,
	});

	renderRoleCard(ctx, cardsEl, {
		role: "heading",
		name: t("settings.calloutTypeHeading"),
		desc: t("settings.calloutTypeHeadingDesc"),
		getEnabled: () => settings.headingCallouts.enabled,
		setEnabled: async (v) => {
			settings.headingCallouts.enabled = v;
			await ctx.plugin.saveSettings();
			ctx.plugin.refreshRenderModes();
			// The outline cleanup is gated on this toggle too.
			ctx.plugin.outlineDecorator.refreshAll();
		},
	});

	renderRoleCard(ctx, cardsEl, {
		role: "inline",
		name: t("settings.calloutTypeInline"),
		desc: t("settings.calloutTypeInlineDesc"),
		getEnabled: () => settings.inlineCallouts.enabled,
		setEnabled: async (v) => {
			settings.inlineCallouts.enabled = v;
			await ctx.plugin.saveSettings();
			ctx.plugin.refreshRenderModes();
		},
	});
}

/** Sample markdown for a role card, using real built-in callouts. */
function buildCardSample(
	ctx: SettingsSectionContext,
	role: CalloutRenderRole,
): string {
	const name = (id: string, fallback: string): string =>
		ctx.plugin.registry.get(id)?.displayName ?? fallback;
	switch (role) {
		case "regular":
			// The trailing blank line gives the preview's parked caret a home
			// outside the callout (see EmbeddableMarkdownEditor.parkCursor).
			return [
				`> [!note] ${name("note", "Note")}`,
				`> ${t("editor.loremIpsumShort")}`,
				"",
			].join("\n");
		case "heading":
			return `## [!tip] ${name("tip", "Tip")}`;
		case "inline":
			return t("editor.sampleInlineText").replace("{id}", "warning");
	}
}

/**
 * Append `text` to `el`, rendering `` `backticked` `` runs as <code> so the
 * card descriptions can show callout syntax (e.g. `> [!name]`) as code.
 */
function appendWithInlineCode(el: HTMLElement, text: string): void {
	const parts = text.split("`");
	parts.forEach((part, i) => {
		if (part === "") return;
		// Odd indices sit between a pair of backticks.
		if (i % 2 === 1) el.createEl("code", { text: part });
		else el.appendText(part);
	});
}

function renderRoleCard(
	ctx: SettingsSectionContext,
	parentEl: HTMLElement,
	spec: RoleCardSpec,
): void {
	const card = parentEl.createDiv({ cls: "cs-role-card" });

	// Info column first so narrow (phone) stacking shows text + controls
	// above the preview; on wide panes the two become side-by-side columns.
	const info = card.createDiv({ cls: "cs-role-card-info" });
	info.createDiv({ cls: "cs-role-card-title", text: spec.name });
	appendWithInlineCode(
		info.createDiv({ cls: "cs-role-card-desc" }),
		spec.desc,
	);

	// Headerless live preview — the card's own title labels it.
	const previewEl = card.createDiv({ cls: "cs-role-card-preview" });
	const preview = new LiveCalloutPreview(ctx.app, previewEl, {
		initialText: buildCardSample(ctx, spec.role),
	});
	ctx.registerDisposer(() => preview.destroy());

	// The per-role enable/disable toggle is intentionally not exposed in the
	// UI. The `enabled` settings and the spec's getEnabled/setEnabled hooks are
	// kept wired so the toggle can be re-added here later without other changes.

	new ButtonComponent(info)
		.setButtonText(t("settings.globalStyle"))
		.setClass("cs-role-card-style-btn")
		.onClick(() => new GlobalStyleModal(ctx.plugin, spec.role).open());
}
