/**
 * utils/iconLoader.ts — Icon data loading and SVG download utilities.
 *
 * Provides helpers for Lucide icons (reading Obsidian's built-in list) and
 * Material Symbols icons (reading bundled metadata, filtering by query/category,
 * downloading individual SVG files from Google Fonts on demand).
 * Used by IconPicker (browsing), MaterialSvgManager (caching), and
 * CSSInjector (converting cached SVGs to data URIs for CSS injection).
 */
import { getIconIds, requestUrl } from "obsidian";
import type {
	MaterialIconMeta,
	MaterialIconStyle,
	CalloutIcon,
} from "../types";
import { MATERIAL_ICON_METADATA } from "../data/materialIconsMetadata";

const materialFontLoadCache = new Map<string, Promise<void>>();

// ── Lucide ──────────────────────────────────────────────────────────────

/**
 * Returns all Obsidian built-in Lucide icon IDs, optionally filtered.
 */
export function getLucideIcons(filter?: string): string[] {
	const all = getIconIds();
	if (!filter) return all;
	const lc = filter.toLowerCase();
	return all.filter((id) => id.toLowerCase().includes(lc));
}

// ── Material Icons ──────────────────────────────────────────────────────

const MATERIAL_ICON_STYLES: MaterialIconStyle[] = [
	"outlined",
	"rounded",
	"sharp",
	"filled",
];

/**
 * Returns bundled Material Symbols metadata used by the icon picker.
 * SVGs for selected Material icons are still downloaded separately on demand.
 */
export function loadMaterialIcons(): Promise<MaterialIconMeta[]> {
	return Promise.resolve(MATERIAL_ICON_METADATA);
}

/**
 * Filter Material icons by name/tag search and optional style + category.
 * The query is split on whitespace so each word is matched independently
 * against icon names (underscores treated as spaces) and tags.
 */
export function filterMaterialIcons(
	icons: MaterialIconMeta[],
	query: string,
	style?: MaterialIconStyle,
	category?: string,
): MaterialIconMeta[] {
	const words = query
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);
	return icons.filter((icon) => {
		const styles = icon.styles ?? MATERIAL_ICON_STYLES;
		if (style && !styles.includes(style)) {
			return false;
		}
		if (category && !icon.categories.includes(category)) {
			return false;
		}
		if (words.length === 0) return true;
		const nameSpaced = icon.name.toLowerCase().replace(/_/g, " ");
		return words.every(
			(w) =>
				nameSpaced.includes(w) ||
				icon.name.toLowerCase().includes(w) ||
				icon.tags.some((t) => t.toLowerCase().includes(w)),
		);
	});
}

/**
 * Returns the CSS font-family string for a Material icon style.
 */
export function materialFontFamily(style: MaterialIconStyle): string {
	switch (style) {
		case "outlined":
			return "Material Symbols Outlined";
		case "rounded":
			return "Material Symbols Rounded";
		case "sharp":
			return "Material Symbols Sharp";
		case "filled":
			return "Material Symbols Outlined"; // filled uses same font, different fill setting
	}
}

/**
 * Loads the Material Symbols variable font for the requested style using
 * FontFace (without injecting <link> elements).
 */
export function ensureMaterialFontLoaded(
	style: MaterialIconStyle,
): Promise<void> {
	const family = materialFontFamily(style);
	const cached = materialFontLoadCache.get(family);
	if (cached) return cached;

	const loadPromise = (async () => {
		const encodedFamily = family.replace(/ /g, "+");
		const cssUrl =
			`https://fonts.googleapis.com/css2?family=${encodedFamily}` +
			`:opsz,wght,FILL,GRAD@24,100..700,0..1,0`;

		const cssResponse = await requestUrl({ url: cssUrl });
		const css = cssResponse.text;

		const urlMatches = Array.from(
			css.matchAll(/url\((['"]?)(https:\/\/[^'")]+)\1\)/g),
		);
		const woff2Url =
			urlMatches.find((m) => m[2]?.includes(".woff2"))?.[2] ??
			urlMatches[0]?.[2];
		if (!woff2Url) {
			throw new Error(
				`Could not resolve font URL for Material family "${family}"`,
			);
		}

		const fontFace = new FontFace(
			family,
			`url(${woff2Url}) format("woff2")`,
			{
				style: "normal",
			},
		);
		await fontFace.load();
		const fontSet = document.fonts as FontFaceSet & {
			add(font: FontFace): FontFaceSet;
		};
		fontSet.add(fontFace);
		await document.fonts.ready;
	})();

	materialFontLoadCache.set(family, loadPromise);
	return loadPromise.catch((error) => {
		materialFontLoadCache.delete(family);
		throw error;
	});
}

/**
 * Returns all unique categories from a set of material icons.
 */
export function getMaterialCategories(icons: MaterialIconMeta[]): string[] {
	const set = new Set<string>();
	for (const icon of icons) {
		for (const cat of icon.categories) {
			set.add(cat);
		}
	}
	return [...set].sort();
}

// ── Material SVG Download ───────────────────────────────────────────────

/**
 * Builds the Google Fonts SVG URL for a Material Symbols icon.
 */
function getMaterialSvgUrl(
	name: string,
	style: MaterialIconStyle,
	weight: number,
): string {
	const family = style === "filled" ? "outlined" : style;
	const isFilled = style === "filled";

	let variant: string;
	if (isFilled && weight !== 400) {
		variant = `fill1wght${weight}`;
	} else if (isFilled) {
		variant = "fill1";
	} else if (weight !== 400) {
		variant = `wght${weight}`;
	} else {
		variant = "default";
	}

	return `https://fonts.gstatic.com/s/i/short-term/release/materialsymbols${family}/${name}/${variant}/24px.svg`;
}

/**
 * Downloads an individual Material Symbols SVG icon from Google Fonts.
 * Returns the sanitized SVG string.
 */
export async function downloadMaterialSvg(
	name: string,
	style: MaterialIconStyle,
	weight: number = 400,
): Promise<string> {
	const url = getMaterialSvgUrl(name, style, weight);
	const response = await requestUrl({ url });
	const raw = response.text;

	const sanitized = sanitizeSVG(raw);
	if (!sanitized) {
		throw new Error(`Invalid SVG received for Material icon "${name}"`);
	}

	return sanitized;
}

// ── SVG Sanitization ────────────────────────────────────────────────────

const DANGEROUS_TAGS = new Set([
	"script",
	"iframe",
	"object",
	"embed",
	"applet",
	"form",
	"input",
	"button",
	"textarea",
	"select",
	"link",
	"meta",
	"base",
	"frame",
	"frameset",
]);

const EVENT_ATTR_RE = /^on/i;
const DANGEROUS_ATTR_VALUES_RE = /javascript:|data:text\/html/i;

/**
 * Sanitizes an SVG string by removing dangerous elements and attributes.
 * Returns the cleaned SVG string or null if the input is invalid.
 */
export function sanitizeSVG(raw: string): string | null {
	const parser = new DOMParser();
	const doc = parser.parseFromString(raw, "image/svg+xml");

	// Check for parse errors
	const errorNode = doc.querySelector("parsererror");
	if (errorNode) return null;

	const svg = doc.documentElement;
	if (svg.tagName.toLowerCase() !== "svg") return null;

	// Ensure viewBox exists
	if (!svg.hasAttribute("viewBox")) {
		const w = svg.getAttribute("width");
		const h = svg.getAttribute("height");
		if (w && h) {
			svg.setAttribute(
				"viewBox",
				`0 0 ${parseFloat(w)} ${parseFloat(h)}`,
			);
		} else {
			svg.setAttribute("viewBox", "0 0 24 24");
		}
	}

	// Recursively clean the tree
	cleanElement(svg);

	// Serialize back
	const serializer = new XMLSerializer();
	return serializer.serializeToString(svg);
}

function cleanElement(el: Element): void {
	// Remove dangerous child elements
	const toRemove: Element[] = [];
	for (let i = 0; i < el.children.length; i++) {
		const child = el.children[i];
		if (!child) continue;
		if (DANGEROUS_TAGS.has(child.tagName.toLowerCase())) {
			toRemove.push(child);
		} else {
			cleanElement(child);
		}
	}
	for (const child of toRemove) {
		el.removeChild(child);
	}

	// Remove dangerous attributes
	const attrs = el.getAttributeNames();
	for (const attr of attrs) {
		if (EVENT_ATTR_RE.test(attr)) {
			el.removeAttribute(attr);
			continue;
		}
		const val = el.getAttribute(attr);
		if (val && DANGEROUS_ATTR_VALUES_RE.test(val)) {
			el.removeAttribute(attr);
		}
	}
}

/**
 * Encodes SVG for use in a CSS url() value.
 */
export function svgToDataUri(svg: string): string {
	const encoded = encodeURIComponent(svg)
		.replace(/'/g, "%27")
		.replace(/"/g, "%22");
	return `url("data:image/svg+xml,${encoded}")`;
}

/**
 * Builds a CalloutIcon from components.
 */
export function makeIcon(
	type: CalloutIcon["type"],
	value: string,
	style?: MaterialIconStyle,
): CalloutIcon {
	const icon: CalloutIcon = { type, value };
	if (style) icon.style = style;
	return icon;
}
