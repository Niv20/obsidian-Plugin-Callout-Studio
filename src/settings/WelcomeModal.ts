/**
 * settings/WelcomeModal.ts — First-run welcome / splash screen.
 *
 * A friendly two-column intro to the plugin. Shown automatically once, on first
 * load for a fresh install only (gated by the `welcomeSeen` setting); a user who
 * merely updates into this version never sees it. Also reopenable any time from
 * the info icon next to the "Callout Studio" title in settings.
 *
 * Left column: the plugin name, icon, and a one-line slogan, centered. Right
 * column: a real {@link LiveCalloutPreview} rendering a short sample whose copy
 * itself explains the three callout roles (heading, inline, regular) and links
 * back to the GitHub repo, so the preview both demonstrates and describes what
 * the plugin can do. Closing the modal (Escape, click-outside, or the preview's
 * own link) resolves the first-run `prompt()` promise the same way.
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

		// ── Left column: hero + slogan, centered ────────────────────────
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

		// ── Right column: self-describing live preview ─────────────────
		const right = panel.createDiv({ cls: "cs-welcome-right" });
		this.preview = new LiveCalloutPreview(this.app, right, {
			title: t("welcome.previewTitle"),
			initialText: t("welcome.sample", { repoUrl: REPO_URL }),
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
