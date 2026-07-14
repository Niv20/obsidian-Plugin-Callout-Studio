/**
 * settings/WelcomeModal.ts — First-run welcome / splash screen.
 *
 * A friendly two-column intro to the plugin. Shown automatically once per user
 * (gated by the `welcomeSeen` setting): on first load for a fresh install, or on
 * the first settings-tab open for someone updating into this version. Also
 * reopenable any time from the info icon next to the "Callout Studio" title in
 * settings.
 *
 * Left column: the plugin name, a one-line slogan, and two buttons — "Learn
 * more" (opens the GitHub repo) and "Continue" (closes the modal). Right
 * column: a real {@link LiveCalloutPreview} rendering a short sample whose copy
 * itself explains the three callout roles (heading, inline, regular), so the
 * preview both demonstrates and describes what the plugin can do.
 */
import { Modal, setIcon } from "obsidian";
import { t } from "../i18n";
import { LiveCalloutPreview } from "./LiveCalloutPreview";
import type { SettingsTabPlugin } from "./sections/types";

const REPO_URL = "https://github.com/Niv20/obsidian-Plugin-Callout-Studio";

export class WelcomeModal extends Modal {
	private resolved = false;
	private resolve: () => void = () => {};
	private preview: LiveCalloutPreview | null = null;

	constructor(private readonly plugin: SettingsTabPlugin) {
		super(plugin.app);
	}

	onOpen(): void {
		this.modalEl.addClass("cs-welcome-modal");
		// No title bar — the hero lives in the left column.
		this.titleEl.remove();

		const panel = this.contentEl.createDiv({ cls: "cs-welcome-panel" });

		// ── Left column: hero + slogan + actions ───────────────────────
		const left = panel.createDiv({ cls: "cs-welcome-left" });
		const hero = left.createDiv({ cls: "cs-welcome-hero" });
		const icon = hero.createDiv({ cls: "cs-welcome-icon" });
		setIcon(icon, "paintbrush");
		hero.createEl("h1", {
			cls: "cs-welcome-title",
			text: t("welcome.title"),
		});
		left.createEl("p", {
			cls: "cs-welcome-tagline",
			text: t("welcome.tagline"),
		});

		const actions = left.createDiv({ cls: "cs-welcome-actions" });
		const learnBtn = actions.createEl("button", {
			text: t("welcome.learnMore"),
		});
		learnBtn.addEventListener("click", () => {
			window.open(REPO_URL, "_blank");
		});
		const continueBtn = actions.createEl("button", {
			text: t("welcome.continue"),
			cls: "mod-cta",
		});
		continueBtn.addEventListener("click", () => this.close());

		// ── Right column: self-describing live preview ─────────────────
		const right = panel.createDiv({ cls: "cs-welcome-right" });
		this.preview = new LiveCalloutPreview(this.app, right, {
			title: t("welcome.previewTitle"),
			initialText: t("welcome.sample"),
		});
	}

	onClose(): void {
		this.preview?.destroy();
		this.preview = null;
		this.contentEl.empty();
		if (!this.resolved) {
			this.resolved = true;
			this.resolve();
		}
	}

	/** Open the modal and resolve once it closes (for the first-run flow). */
	prompt(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}
}
