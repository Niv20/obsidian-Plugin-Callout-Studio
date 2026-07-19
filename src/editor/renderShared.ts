/**
 * editor/renderShared.ts — Shared DOM builders for heading/inline callouts.
 *
 * The Live Preview widgets (editor/livepreview/) and the reading-view
 * post-processor (reading/) both render the same token DOM through
 * buildCalloutTokenDom, so the two surfaces stay visually identical and the
 * CSSInjector icon sweep can repaint both with one selector.
 *
 * Icons are always baked into the DOM as visible inline SVG / text colored
 * via CSS `currentColor` (no ::after masks), which makes them survive PDF
 * export with zero extra machinery.
 */
import { setIcon } from "obsidian";
import type { CalloutDefinition } from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import { normalizeCalloutId } from "../utils/calloutId";

/** Class names shared between Live Preview widgets and reading-view DOM. */
export const CSS_INLINE_TOKEN = "cs-inline-callout";
export const CSS_HEADING_LINE = "cs-heading-callout";
export const CSS_HEADING_TOKEN = "cs-heading-token";
/**
 * The heading's own title text (everything after the `[!id]` token), wrapped
 * so it has an inline box that hugs the words. The heading bar itself is a
 * full-width block, so a gradient title sweep declared on the bar would only
 * ever show its opening slice through the text; declared on this span, the
 * sweep starts on the first letter and finishes on the last one. Both render
 * surfaces produce it: reading view wraps the trailing nodes, Live Preview
 * marks the title range.
 */
export const CSS_HEADING_TITLE = "cs-heading-title";
export const CSS_TOKEN_ICON = "cs-callout-icon";
export const CSS_TOKEN_NAME = "cs-callout-name";
export const CSS_UNKNOWN = "cs-unknown";
/**
 * The fold chevron trailing a heading callout in Live Preview. Reading view
 * uses Obsidian's own `.heading-collapse-indicator` instead, so both surfaces
 * are tinted together (see CSSInjector's fold-arrow rules).
 */
export const CSS_FOLD_ARROW = "cs-fold-arrow";
/**
 * Token shown where a heading callout is REFERENCED: Outline-pane items,
 * rendered internal links (incl. TOC plugins), and the link suggestion popup.
 */
export const CSS_REF_TOKEN = "cs-ref-token";
/**
 * Extra class on a ref token that sits inside a rendered internal link —
 * marks the icon as a click-to-navigate surface (pointer cursor).
 * Outline/popup tokens never carry it.
 */
export const CSS_REF_TOKEN_LINK = "cs-ref-token-link";
/**
 * Live Preview widget replacing a whole title-less reference link
 * (`[[#[!id]]]`) — styled like an internal link (color + underline).
 */
export const CSS_REF_LINK = "cs-ref-link";

export interface ResolvedCalloutDef {
	/** Definition to render with (fallback def when the id is unrecognized). */
	def: CalloutDefinition | undefined;
	/** True when the id matched neither a definition nor an alias. */
	unknown: boolean;
}

/**
 * Resolve a raw `[!id]` token id to a definition: direct id → alias → the
 * configured fallback callout. Mirrors CSSInjector.resolveDef so DOM icons
 * and CSS colors always agree.
 */
export function resolveCalloutDef(
	registry: CalloutRegistry,
	rawId: string,
): ResolvedCalloutDef {
	const id = normalizeCalloutId(rawId);
	const direct = registry.get(id) ?? registry.findByAlias(id);
	if (direct) return { def: direct, unknown: false };
	return {
		def: registry.get(registry.settings.fallbackCalloutId),
		unknown: true,
	};
}

/**
 * Paint a definition's icon into `iconEl` as visible, self-contained DOM:
 * Lucide via setIcon (stroke: currentColor), Material as an inline SVG with
 * `fill="currentColor"`, emoji as a text node. Color therefore follows the
 * surrounding element's CSS `color` in both themes. Material icons that are
 * not downloaded yet get a pencil placeholder; the finished download triggers
 * a CSS re-inject whose paintIcons sweep repaints them.
 */
export function paintRoleIcon(
	iconEl: HTMLElement,
	def: CalloutDefinition,
	registry: CalloutRegistry,
): void {
	try {
		if (def.icon.type === "lucide") {
			setIcon(iconEl, def.icon.value);
		} else if (def.icon.type === "emoji") {
			iconEl.textContent = def.icon.value;
		} else if (def.icon.type === "material") {
			const cached = registry.findMaterialSvg(
				def.icon.value,
				def.icon.style ?? "outlined",
				def.icon.weight ?? 400,
			);
			if (cached) {
				const parsed = new DOMParser().parseFromString(
					cached.svg,
					"image/svg+xml",
				);
				const svgEl = parsed.documentElement;
				if (
					parsed.querySelector("parsererror") ||
					svgEl.nodeName.toLowerCase() !== "svg"
				) {
					setIcon(iconEl, "pencil");
					return;
				}
				svgEl.setAttribute("fill", "currentColor");
				iconEl.replaceChildren(
					iconEl.ownerDocument.importNode(svgEl, true),
				);
			} else {
				setIcon(iconEl, "pencil");
			}
		} else {
			setIcon(iconEl, "pencil");
		}
	} catch {
		// setIcon may be unavailable in exotic render realms; a missing icon
		// is preferable to a crash mid-render.
		iconEl.textContent = "•";
	}
}

/** Where a callout token DOM is rendered — decides its root class. */
export type CalloutTokenVariant = "inline" | "heading" | "ref";

const VARIANT_CLASS: Record<CalloutTokenVariant, string> = {
	inline: CSS_INLINE_TOKEN,
	heading: CSS_HEADING_TOKEN,
	ref: CSS_REF_TOKEN,
};

export interface CalloutTokenDomOptions {
	rawId: string;
	registry: CalloutRegistry;
	/**
	 * "inline" renders the pill; "heading" renders the in-heading token;
	 * "ref" renders the compact icon(+name) used where a heading callout is
	 * referenced (outline pane, links, suggestion popup).
	 */
	variant: CalloutTokenVariant;
	/**
	 * Heading/ref tokens hide the display name when a custom title renders
	 * after the token.
	 */
	showName: boolean;
}

/**
 * Build the shared token DOM:
 * `<span class="cs-inline-callout|cs-heading-token [cs-unknown]"
 *        data-callout="<normalized id>">
 *    <span class="cs-callout-icon">…</span>
 *    <span class="cs-callout-name">…</span>?
 *  </span>`
 * `data-callout` carries the normalized id so per-callout CSS (including
 * alias selectors) and the context menu can target it on both surfaces.
 */
export function buildCalloutTokenDom(
	doc: Document,
	options: CalloutTokenDomOptions,
): HTMLElement {
	const { rawId, registry, variant, showName } = options;
	const { def, unknown } = resolveCalloutDef(registry, rawId);

	const root = doc.createElement("span");
	root.classList.add(VARIANT_CLASS[variant]);
	if (unknown) root.classList.add(CSS_UNKNOWN);
	root.setAttribute("data-callout", normalizeCalloutId(rawId));

	const iconEl = doc.createElement("span");
	iconEl.classList.add(CSS_TOKEN_ICON);
	root.appendChild(iconEl);
	if (def) paintRoleIcon(iconEl, def, registry);

	if (showName) {
		const nameEl = doc.createElement("span");
		nameEl.classList.add(CSS_TOKEN_NAME);
		// Unknown ids show what the user wrote; known ids show the display name.
		nameEl.textContent = unknown || !def ? rawId.trim() : def.displayName;
		root.appendChild(nameEl);
	}

	return root;
}
