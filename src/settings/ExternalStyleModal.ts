/**
 * settings/ExternalStyleModal.ts — what opens instead of the callout editor
 * when a callout is marked {@link CalloutDefinition.externalStyle}.
 *
 * There is nothing to edit while the theme owns a callout — every control in
 * `CalloutEditor` writes a value the plugin has stopped emitting — so this is a
 * separate window rather than a locked variant of that one. Two columns, laid
 * out like the first-run {@link WelcomeModal}: the left explains what handing
 * the callout over actually did, the right proves it.
 *
 * The proof is the point, and it costs nothing to be exact. A
 * {@link LiveCalloutPreview} hosts a real embedded Obsidian editor inside the
 * document's own `body.theme-*` and deliberately does not override the cascade,
 * so with no CSS emitted for this callout the blockquote in that pane renders
 * *identically* to one in a note — the theme's colours, the theme's icon, no
 * approximation and no reading values back out of `getComputedStyle`. The same
 * sample also carries a `## [!id]` heading and an inline `[!id]`, which stay as
 * literal text, so the two lines the left column warns about demonstrate
 * themselves side by side with the warning.
 *
 * Deliberately NOT passed a `beforeRender` hook: that callback exists so the
 * editor can push its in-progress definition into the registry and re-inject
 * CSS, which is exactly what must not happen here. The real definition is
 * already registered and emits nothing.
 *
 * Unlike `WelcomeModal` — a splash that opts out of the shared chrome entirely —
 * this window has a title and an action, so it wears the standard bands from
 * `modalChrome` with the CTA in the pinned footer.
 */
import { Modal } from "obsidian";
import { t } from "../i18n";
import { LiveCalloutPreview } from "./LiveCalloutPreview";
import { applyModalChrome, removeModalChrome } from "./modalChrome";
import type { CalloutDefinition } from "../types";
import type { CalloutEditorPlugin } from "./editor/types";

/**
 * Same narrow structural interface the editor takes (kept narrow to break
 * import cycles), plus the one extra call this window makes when the user hands
 * the callout back.
 */
export type ExternalStylePlugin = CalloutEditorPlugin & {
	refreshCallouts(): void;
	refreshRenderModes(): void;
};

export class ExternalStyleModal extends Modal {
	private preview: LiveCalloutPreview | null = null;
	/** Resolves once the window closes; true when the user took control back. */
	private resolve: (resumed: boolean) => void = () => {};
	private resolved = false;
	private resumed = false;

	constructor(
		private readonly plugin: ExternalStylePlugin,
		private readonly def: CalloutDefinition,
	) {
		super(plugin.app);
	}

	/**
	 * Open, and resolve when it closes with whether the user chose to resume
	 * styling — so the caller can hand off to the real editor.
	 */
	openAndWait(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.modalEl.addClass("cs-external-modal");
		// Not `wide` — that inset is tuned for the callout and palette editors,
		// which are far larger windows. This one is welcome-modal sized.
		const footerEl = applyModalChrome(this, { footer: true });

		this.setTitle(t("editor.externalStyleTitle"));

		const panel = contentEl.createDiv({
			cls: "cs-split-panel cs-external-panel",
		});

		// ── Left column: what handing it over actually did ──────────────
		const left = panel.createDiv({ cls: "cs-external-left" });
		left.createEl("p", {
			cls: "cs-external-lead",
			text: t("editor.externalStyleBody", { id: `[!${this.def.id}]` }),
		});

		left.createEl("h3", {
			cls: "cs-external-what",
			text: t("editor.externalStyleWhat"),
		});
		const list = left.createEl("ul", { cls: "cs-external-list" });
		for (const key of [
			"editor.externalStyleWhatHeading",
			"editor.externalStyleWhatInline",
			"editor.externalStyleWhatGlobal",
		]) {
			list.createEl("li", { text: t(key, { id: this.def.id }) });
		}

		// ── Right column: the same claim, rendered ──────────────────────
		const right = panel.createDiv({ cls: "cs-external-right" });
		this.preview = new LiveCalloutPreview(this.app, right, {
			title: t("editor.externalStylePreviewTitle"),
			initialText: t("editor.externalStyleSample", {
				id: this.def.id,
				name: this.def.displayName,
			}),
		});

		// ── Footer ──────────────────────────────────────────────────────
		const closeBtn = footerEl.createEl("button", {
			text: t("editor.externalStyleClose"),
		});
		closeBtn.addEventListener("click", () => this.close());

		const resumeBtn = footerEl.createEl("button", {
			text: t("editor.externalStyleResume"),
		});
		resumeBtn.addEventListener("click", () => {
			void this.resume();
		});
	}

	/** Hand the callout back to the plugin, then close so the caller can edit. */
	private async resume(): Promise<void> {
		if (this.plugin.registry.setExternalStyle(this.def.id, false)) {
			await this.plugin.saveSettings();
			this.plugin.refreshCallouts();
			// Reading view's heading bars and pills come back only on a
			// post-processor pass — see the same pairing in CalloutRowActions.
			this.plugin.refreshRenderModes();
			this.resumed = true;
		}
		this.close();
	}

	onClose(): void {
		this.preview?.destroy();
		this.preview = null;
		this.contentEl.empty();
		removeModalChrome(this);
		if (!this.resolved) {
			this.resolved = true;
			this.resolve(this.resumed);
		}
	}
}
