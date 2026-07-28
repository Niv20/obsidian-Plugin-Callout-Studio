/**
 * icons/renderIcon.ts — The single "icon → DOM" painter.
 *
 * Every surface that shows a callout icon calls renderIconInto. The surfaces
 * differ only in three ways, which is exactly what the options express:
 *
 * - what to draw when the artwork is not local yet (`missing`)
 * - whether the glyph should follow the surrounding CSS `color` or carry a
 *   baked-in one (`fill`) — the latter is how icons survive PDF export, where
 *   Obsidian's print clone ships the DOM but not our stylesheet
 * - whether the result is wrapped/marked for a caller-specific rule
 *   (`className`, `rootStyle`)
 *
 * Everything else — parsing, validating, importing across documents, realm
 * safety — is identical everywhere and lives here once.
 */
import { setIcon } from "obsidian";
import type { CalloutIcon, CalloutRenderRole } from "../types";
import type { IconResolver } from "./types";
import { packFor } from "./registry";

/**
 * Shapes that carry their own paint inside a vendor SVG. A baked export colour
 * has to reach each of them: a core or theme rule targeting `svg path` directly
 * would otherwise outrank a colour set only on the root.
 */
const SHAPE_SELECTOR = "path, circle, rect, polygon, ellipse, line, polyline, g";

/** What to draw when the artwork is not available locally. */
export type IconMissingBehavior =
	/** Draw a Lucide icon instead, so the surface is never blank. */
	| { kind: "placeholder"; lucideId: string }
	/** Show download state: a spinner, or an error once the download gave up. */
	| { kind: "status" }
	/** Touch nothing and leave whatever is already there. */
	| { kind: "leave" };

export interface RenderIconOptions {
	/** Which surface is drawing — decides between a pack's per-size drawings. */
	role: CalloutRenderRole;
	/**
	 * `"currentColor"` lets the glyph inherit the surrounding CSS colour, which
	 * is what every on-screen surface wants (it tracks light/dark for free).
	 * A literal bakes the colour inline with `!important`, for copies that will
	 * be rendered without our stylesheet.
	 */
	fill: "currentColor" | { literal: string };
	missing: IconMissingBehavior;
	/** Class stamped on the produced node (e.g. `cs-export-icon`). */
	className?: string;
	/** Inline style for the produced `<svg>` root (export sizing). */
	rootStyle?: string;
	/** Text to fall back to if painting throws outright. Omit to leave the DOM alone. */
	errorText?: string;
	/** Localized `aria-label` for the failed state of `missing: "status"`. */
	errorAriaLabel?: string;
}

export type RenderIconResult =
	| "painted"
	| "placeholder"
	| "loading"
	| "failed"
	| "skipped";

/**
 * Paint `icon` into `target`, replacing whatever it held.
 *
 * Returns what was actually drawn, so callers that care (the settings list)
 * can react without re-deriving the state.
 */
export function renderIconInto(
	target: HTMLElement,
	icon: CalloutIcon,
	resolver: IconResolver,
	options: RenderIconOptions,
): RenderIconResult {
	target.removeClass("is-loading");
	target.removeClass("is-error");
	try {
		return paint(target, icon, resolver, options);
	} catch {
		// setIcon and DOMParser can both be missing in exotic render realms
		// (an export clone, a popout window mid-teardown). A missing icon is
		// always preferable to a crash in the middle of a render pass.
		if (options.errorText !== undefined) {
			target.textContent = options.errorText;
		}
		return "failed";
	}
}

function paint(
	target: HTMLElement,
	icon: CalloutIcon,
	resolver: IconResolver,
	options: RenderIconOptions,
): RenderIconResult {
	// An unknown pack means data written by a newer build (or edited by hand);
	// treat it as artwork we simply don't have, which is what it is.
	const pack = packFor(icon);
	if (!pack) return paintMissing(target, icon, resolver, options);

	switch (pack.kind) {
		case "builtin":
			// Already a visible DOM SVG stroked with currentColor, so it needs
			// none of the colouring below and survives PDF export as-is.
			setIcon(target, icon.value);
			return "painted";
		case "glyph":
			// textContent, never innerHTML — the glyph is user data. A wrapper
			// span is only needed when the caller has a rule to hang off it.
			if (options.className) {
				const span = createSpan();
				span.classList.add(options.className);
				span.textContent = icon.value;
				target.replaceChildren(span);
			} else {
				target.textContent = icon.value;
			}
			return "painted";
		default:
			return paintSvgIcon(target, icon, resolver, options);
	}
}

/** Paint an icon whose artwork is an SVG the plugin stores itself. */
function paintSvgIcon(
	target: HTMLElement,
	icon: CalloutIcon,
	resolver: IconResolver,
	options: RenderIconOptions,
): RenderIconResult {
	const svg = resolver.resolveSvg(icon, options.role);
	if (!svg) return paintMissing(target, icon, resolver, options);

	const svgEl = importSvg(svg, target.ownerDocument);
	if (!svgEl) return paintMissing(target, icon, resolver, options);

	if (options.className) svgEl.classList.add(options.className);

	const rootDecls: string[] = [];
	if (options.rootStyle) rootDecls.push(options.rootStyle);
	if (options.fill === "currentColor") {
		svgEl.setAttribute("fill", "currentColor");
	} else {
		const decl = `fill:${options.fill.literal} !important`;
		rootDecls.push(decl);
		for (const shape of Array.from(svgEl.querySelectorAll(SHAPE_SELECTOR))) {
			shape.setAttribute("style", decl);
		}
	}
	if (rootDecls.length > 0) svgEl.setAttribute("style", rootDecls.join(";"));

	target.replaceChildren(svgEl);
	return "painted";
}

function paintMissing(
	target: HTMLElement,
	icon: CalloutIcon,
	resolver: IconResolver,
	options: RenderIconOptions,
): RenderIconResult {
	switch (options.missing.kind) {
		case "leave":
			return "skipped";
		case "placeholder":
			setIcon(target, options.missing.lucideId);
			return "placeholder";
		case "status":
			if (resolver.hasFailed(icon, options.role)) {
				setIcon(target, "circle-help");
				target.addClass("is-error");
				if (options.errorAriaLabel) {
					target.setAttribute("aria-label", options.errorAriaLabel);
				}
				return "failed";
			}
			setIcon(target, "loader-2");
			target.addClass("is-loading");
			// Clear a label left by an earlier failed render of the same node.
			target.removeAttribute("aria-label");
			return "loading";
	}
}

/**
 * A string that changes whenever this icon would draw differently — including
 * when artwork that was pending has since arrived.
 *
 * CodeMirror widgets and outline decorations key their `eq()` on it, so a
 * placeholder painted while a download was in flight is replaced with the real
 * glyph as soon as the download lands, without a full re-render of the note.
 */
export function iconRenderKey(
	icon: CalloutIcon,
	resolver: IconResolver,
	role: CalloutRenderRole,
): string {
	const pack = packFor(icon);
	// Packs drawn by Obsidian or by the system font have nothing to wait for.
	const needsArtwork =
		pack !== undefined && pack.kind !== "builtin" && pack.kind !== "glyph";
	const ready = !needsArtwork || resolver.resolveSvg(icon, role) !== null;
	return [
		icon.type,
		icon.value,
		icon.style ?? "",
		icon.weight ?? "",
		ready ? "r" : "",
	].join(":");
}

/**
 * Parse cached SVG markup and import it into `doc`.
 *
 * Returns null for anything that is not a well-formed `<svg>` root, so a
 * corrupted cache entry falls through to the caller's missing behavior instead
 * of appending a `<parsererror>` block to the page.
 */
function importSvg(svg: string, doc: Document): Element | null {
	const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
	const root = parsed.documentElement;
	if (
		parsed.querySelector("parsererror") ||
		root.nodeName.toLowerCase() !== "svg"
	) {
		return null;
	}
	return doc.importNode(root, true);
}
