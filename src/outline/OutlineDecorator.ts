/**
 * outline/OutlineDecorator.ts — Clean heading-callout titles in the Outline
 * pane.
 *
 * The Outline view renders HeadingCache.heading verbatim (minus brackets), so
 * `## [!tip] My Title` shows up as `!tip My Title`. This module rewrites each
 * outline item in place: the token is stripped, the callout's colored icon is
 * prepended (optional), and headings without a title fall back to the
 * callout's display name.
 *
 * The Outline view is not part of Obsidian's typed API, so instead of
 * patching it we watch its DOM with one MutationObserver per outline leaf —
 * the outline's own re-renders (file switch, metadata change, search filter,
 * virtual-tree churn) are the signal to re-process. Every rewrite records the
 * original text in `data-cs-orig` so toggling the feature off or unloading
 * the plugin restores the pane exactly.
 */
import type { App, WorkspaceLeaf } from "obsidian";
import type { PluginSettings } from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import { parseOutlineHeadingText } from "../editor/calloutTokens";
import {
	CSS_REF_TOKEN,
	buildCalloutTokenDom,
	resolveCalloutDef,
} from "../editor/renderShared";
import { normalizeCalloutId } from "../utils/calloutId";

/** Narrow structural host type (avoids importing the concrete plugin class). */
export interface OutlineDecoratorHost {
	app: App;
	registry: CalloutRegistry;
	settings: PluginSettings;
}

interface OutlineAttachment {
	container: HTMLElement;
	observer: MutationObserver;
	/** Pending requestAnimationFrame handle (0 = none). */
	rafHandle: number;
	/** True while our own pass mutates the DOM (observer must not re-fire). */
	muted: boolean;
}

const ITEM_SELECTOR = ".tree-item-inner";

export class OutlineDecorator {
	private readonly attachments = new Map<WorkspaceLeaf, OutlineAttachment>();

	constructor(private readonly host: OutlineDecoratorHost) {}

	/**
	 * Attach an observer to every current outline leaf and prune attachments
	 * whose pane is gone. Call on layout-ready and on every layout-change —
	 * both are cheap when nothing changed.
	 */
	attachAll(): void {
		for (const [leaf, att] of this.attachments) {
			if (!att.container.isConnected) {
				this.detach(leaf, att);
			}
		}
		for (const leaf of this.host.app.workspace.getLeavesOfType("outline")) {
			if (this.attachments.has(leaf)) continue;
			const container = leaf.view.containerEl;
			const att: OutlineAttachment = {
				container,
				observer: new MutationObserver(() => {
					if (att.muted) return;
					this.schedulePass(att);
				}),
				rafHandle: 0,
				muted: false,
			};
			att.observer.observe(container, {
				childList: true,
				subtree: true,
				characterData: true,
			});
			this.attachments.set(leaf, att);
			this.schedulePass(att);
		}
	}

	/** Re-process every attached pane (settings or registry changed). */
	refreshAll(): void {
		for (const att of this.attachments.values()) this.schedulePass(att);
	}

	/** Restore every decorated item and disconnect all observers. */
	destroy(): void {
		for (const [leaf, att] of this.attachments) {
			this.runPass(att, /* restoreOnly */ true);
			this.detach(leaf, att);
		}
	}

	private detach(leaf: WorkspaceLeaf, att: OutlineAttachment): void {
		att.observer.disconnect();
		if (att.rafHandle) {
			const win = att.container.ownerDocument.defaultView ?? window;
			win.cancelAnimationFrame(att.rafHandle);
		}
		this.attachments.delete(leaf);
	}

	/** Coalesce observer bursts into one pass per animation frame. */
	private schedulePass(att: OutlineAttachment): void {
		if (att.rafHandle) return;
		const win = att.container.ownerDocument.defaultView ?? window;
		att.rafHandle = win.requestAnimationFrame(() => {
			att.rafHandle = 0;
			this.runPass(att);
		});
	}

	private runPass(att: OutlineAttachment, restoreOnly = false): void {
		const { headingCallouts } = this.host.settings;
		const active =
			!restoreOnly &&
			headingCallouts.enabled &&
			headingCallouts.refCleanTitles;

		att.muted = true;
		try {
			for (const el of Array.from(
				att.container.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
			)) {
				if (active) this.processItem(el);
				else this.restoreItem(el);
			}
		} finally {
			// Drain the records produced by our own edits so the observer
			// callback never sees them (belt and suspenders with `muted`).
			att.observer.takeRecords();
			att.muted = false;
		}
	}

	private processItem(el: HTMLElement): void {
		const textNode = this.findLeadingTextNode(el);
		if (!textNode) {
			// Nothing we can safely rewrite; drop stale state if any.
			this.restoreItem(el);
			return;
		}

		// Recover the original heading text. When the virtual tree reuses a
		// node for a different heading, its text no longer matches what we
		// wrote (data-cs-text) — treat the current text as the new original.
		const nodeText = textNode.nodeValue ?? "";
		let original: string;
		if (el.dataset.csOrig !== undefined && nodeText === el.dataset.csText) {
			original = el.dataset.csOrig;
		} else {
			original = nodeText;
			this.clearDecoration(el);
		}

		const token = parseOutlineHeadingText(original, (raw) => {
			const id = normalizeCalloutId(raw);
			return !!(
				this.host.registry.get(id) ??
				this.host.registry.findByAlias(id)
			);
		});
		if (!token) {
			this.restoreItem(el);
			return;
		}

		const { def, unknown } = resolveCalloutDef(this.host.registry, token.rawId);
		const customTitle = token.title.trim();
		const title =
			customTitle !== ""
				? customTitle
				: unknown || !def
					? token.rawId.trim()
					: def.displayName;
		const showIcon =
			this.host.settings.headingCallouts.refShowIcon && !!def;

		const key = this.renderKey(token.rawId, unknown, def?.id, title, showIcon);
		if (el.dataset.csKey === key) return; // already up to date

		this.clearDecoration(el);
		textNode.nodeValue = title;
		if (showIcon && def) {
			const iconEl = buildCalloutTokenDom({
				rawId: token.rawId,
				registry: this.host.registry,
				variant: "ref",
				showName: false,
			});
			el.insertBefore(iconEl, textNode);
		}
		el.dataset.csOrig = original;
		el.dataset.csText = title;
		el.dataset.csKey = key;
	}

	/** Put an item back to its raw outline text and drop our markers. */
	private restoreItem(el: HTMLElement): void {
		const original = el.dataset.csOrig;
		if (original === undefined) return;
		const textNode = this.findLeadingTextNode(el);
		// Only restore text we still own — if the outline already rewrote the
		// node, its current text IS the fresh original.
		if (textNode && textNode.nodeValue === el.dataset.csText) {
			textNode.nodeValue = original;
		}
		this.clearDecoration(el);
	}

	private clearDecoration(el: HTMLElement): void {
		el.querySelector(`:scope > .${CSS_REF_TOKEN}`)?.remove();
		delete el.dataset.csOrig;
		delete el.dataset.csText;
		delete el.dataset.csKey;
	}

	/**
	 * First non-empty text node of the item, skipping our own icon. Any other
	 * leading element means the item doesn't start with plain heading text —
	 * leave it alone (mirrors calloutPostProcessor.findLeadingTextNode).
	 */
	private findLeadingTextNode(el: HTMLElement): Text | null {
		for (const child of Array.from(el.childNodes)) {
			if (child.nodeType === Node.TEXT_NODE) {
				if ((child.textContent ?? "").trim().length > 0)
					return child as Text;
				continue;
			}
			if (
				child.nodeType === Node.ELEMENT_NODE &&
				(child as Element).classList.contains(CSS_REF_TOKEN)
			) {
				continue;
			}
			return null;
		}
		return null;
	}

	/**
	 * Snapshot of everything that affects an item's rendered state. Matching
	 * key ⇒ skip; registry edits (icon, display name, Material download) and
	 * settings flips change the key and force a rewrite.
	 */
	private renderKey(
		rawId: string,
		unknown: boolean,
		defId: string | undefined,
		title: string,
		showIcon: boolean,
	): string {
		const { def } = resolveCalloutDef(this.host.registry, rawId);
		let iconKey = "";
		let materialReady = true;
		if (def) {
			const { icon } = def;
			iconKey = `${icon.type}:${icon.value}:${icon.style ?? ""}:${icon.weight ?? ""}`;
			if (icon.type === "material") {
				materialReady = !!this.host.registry.findMaterialSvg(
					icon.value,
					icon.style ?? "outlined",
					icon.weight ?? 400,
				);
			}
		}
		return [
			rawId,
			unknown ? "u" : "",
			defId ?? "",
			title,
			showIcon ? "i" : "",
			iconKey,
			materialReady ? "m" : "",
		].join("|");
	}
}
