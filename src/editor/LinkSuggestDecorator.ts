/**
 * editor/LinkSuggestDecorator.ts — Clean heading-callout titles in the link
 * suggestion popup.
 *
 * Typing `[[#` opens Obsidian's built-in link suggester, which renders each
 * heading suggestion's raw text — so `# [!tip] My Title` shows up as
 * `[!tip] My Title`. The suggester is not part of the typed API; like
 * AutoComplete.triggerNow we reach into `workspace.editorSuggest` (fully
 * guarded, so a changed internal shape simply disables the cleanup) and wrap
 * every registered suggester's renderSuggestion. The wrapper lets the
 * original render run, then — only for heading-type suggestion values whose
 * text starts with a callout token — strips the token from the rendered
 * title and prepends the callout's colored icon.
 *
 * Only the popup DOM is touched: selecting a suggestion still inserts the
 * full raw heading text, so the produced link resolves normally.
 */
import type { App } from "obsidian";
import type { PluginSettings } from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import { parseOutlineHeadingText } from "./calloutTokens";
import { buildCalloutTokenDom, resolveCalloutDef } from "./renderShared";
import { normalizeCalloutId } from "../utils/calloutId";

/** Narrow structural host type (avoids importing the concrete plugin class). */
export interface LinkSuggestHost {
	app: App;
	registry: CalloutRegistry;
	settings: PluginSettings;
}

type RenderSuggestionFn = (
	value: unknown,
	el: unknown,
	...rest: unknown[]
) => unknown;

interface SuggestLike {
	renderSuggestion?: RenderSuggestionFn;
}

export class LinkSuggestDecorator {
	/** Undo thunks for every wrapped renderSuggestion, in wrap order. */
	private restores: Array<() => void> = [];

	constructor(private readonly host: LinkSuggestHost) {}

	/**
	 * Wrap renderSuggestion on every suggester registered at call time,
	 * except the instances in `skip` (our own autocomplete). Call once on
	 * layout-ready — the core link suggester exists by then; suggesters other
	 * plugins register later are simply left alone.
	 */
	install(skip: readonly object[]): void {
		const suggests = (
			this.host.app.workspace as unknown as {
				editorSuggest?: { suggests?: unknown[] };
			}
		).editorSuggest?.suggests;
		if (!Array.isArray(suggests)) return;

		const host = this.host;
		for (const entry of suggests) {
			if (!entry || typeof entry !== "object") continue;
			if ((skip as unknown[]).includes(entry)) continue;
			const suggest = entry as SuggestLike;
			const original = suggest.renderSuggestion;
			if (typeof original !== "function") continue;
			suggest.renderSuggestion = function (
				this: unknown,
				value: unknown,
				el: unknown,
				...rest: unknown[]
			): unknown {
				const out = original.call(this, value, el, ...rest);
				try {
					decorateHeadingSuggestion(host, value, el);
				} catch {
					// Never break core's (or another plugin's) popup render.
				}
				return out;
			};
			this.restores.push(() => {
				suggest.renderSuggestion = original;
			});
		}
	}

	/** Restore every wrapped renderSuggestion (plugin unload). */
	uninstall(): void {
		for (const restore of this.restores) restore();
		this.restores = [];
	}
}

/**
 * Rewrite one rendered suggestion in place. Heading suggestions are
 * recognized by value shape (`{ type: "heading", heading: string }` — what
 * the core link suggester emits); everything else passes through untouched,
 * so wrapping unrelated suggesters is harmless.
 */
function decorateHeadingSuggestion(
	host: LinkSuggestHost,
	value: unknown,
	el: unknown,
): void {
	const { headingCallouts } = host.settings;
	if (!headingCallouts.enabled || !headingCallouts.refCleanTitles) return;
	if (!value || typeof value !== "object") return;
	const v = value as { type?: unknown; heading?: unknown };
	if (v.type !== "heading" || typeof v.heading !== "string") return;
	// Duck-typed, not instanceof — popout windows live in another JS realm.
	const root = el as HTMLElement | null;
	if (!root || typeof root !== "object" || !("querySelector" in root)) {
		return;
	}

	// The outline parser fits here too: heading cache text carries the token
	// bracketed at the very start, and the bracketless fallback is inert for
	// ids that don't resolve.
	const token = parseOutlineHeadingText(v.heading, (raw) => {
		const id = normalizeCalloutId(raw);
		return !!(host.registry.get(id) ?? host.registry.findByAlias(id));
	});
	if (!token) return;

	const titleEl =
		root.querySelector<HTMLElement>(".suggestion-title") ??
		root.querySelector<HTMLElement>(".suggestion-content") ??
		root;

	// The title's leading text node must start with the exact prefix we
	// parsed off the heading. A search-highlight span inside the token, or a
	// renderer that shows something other than the heading text, breaks that
	// invariant — leave those untouched.
	const consumed = v.heading.length - token.title.length;
	const head = v.heading.slice(0, consumed);
	const textNode = titleEl.firstChild;
	if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
	const text = textNode.nodeValue ?? "";
	if (!text.startsWith(head)) return;

	const { def, unknown } = resolveCalloutDef(host.registry, token.rawId);
	if (token.title.trim() !== "") {
		textNode.nodeValue = text.slice(consumed);
	} else {
		// Titleless heading: show the callout's display name, like the
		// outline pane does (what the user wrote when the id is unknown).
		textNode.nodeValue = unknown || !def ? token.rawId.trim() : def.displayName;
	}
	if (headingCallouts.refShowIcon && def) {
		const iconEl = buildCalloutTokenDom(titleEl.ownerDocument, {
			rawId: token.rawId,
			registry: host.registry,
			variant: "ref",
			showName: false,
		});
		titleEl.insertBefore(iconEl, titleEl.firstChild);
	}
}
