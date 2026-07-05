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
export const CSS_TOKEN_ICON = "cs-callout-icon";
export const CSS_TOKEN_NAME = "cs-callout-name";
export const CSS_UNKNOWN = "cs-unknown";

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

export interface CalloutTokenDomOptions {
	rawId: string;
	registry: CalloutRegistry;
	/** "inline" renders the pill; "heading" renders the in-heading token. */
	variant: "inline" | "heading";
	/**
	 * Heading tokens hide the display name when the heading carries a custom
	 * title (the title text itself renders after the token).
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
	root.classList.add(
		variant === "inline" ? CSS_INLINE_TOKEN : CSS_HEADING_TOKEN,
	);
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
