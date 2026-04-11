import { getIconIds, requestUrl } from "obsidian";
import type {
	MaterialIconMeta,
	MaterialIconsCacheData,
	MaterialIconStyle,
	CalloutIcon,
} from "../types";

// ── Constants ───────────────────────────────────────────────────────────

/** Maximum bytes allowed for a custom SVG upload */
export const MAX_CUSTOM_SVG_BYTES = 102_400; // 100 KB

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

const MATERIAL_ICONS_API =
	"https://fonts.google.com/metadata/icons?key=material_symbols&incomplete=true";
const CACHE_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Fetches Material Symbols metadata from Google Fonts CDN.
 * Returns cached data when available and not expired.
 */
export async function loadMaterialIcons(
	cache: MaterialIconsCacheData | undefined,
): Promise<MaterialIconsCacheData> {
	if (cache && Date.now() - cache.fetchedAt < CACHE_VALIDITY_MS) {
		return cache;
	}

	let raw: string;
	try {
		const response = await requestUrl({ url: MATERIAL_ICONS_API });
		raw = response.text;
	} catch {
		if (cache) return cache; // fallback to stale cache
		throw new Error("Failed to fetch Material Icons");
	}

	// Google prefixes JSON with ")]}'\""}, strip it
	const jsonStart = raw.indexOf("\n");
	const json = JSON.parse(raw.substring(jsonStart)) as {
		icons: Array<{
			name: string;
			categories: string[];
			tags: string[];
			unsupported_families: string[];
		}>;
	};

	const STYLE_MAP: Record<string, MaterialIconStyle> = {
		"Material Symbols Outlined": "outlined",
		"Material Symbols Rounded": "rounded",
		"Material Symbols Sharp": "sharp",
	};
	const ALL_STYLES: MaterialIconStyle[] = [
		"outlined",
		"rounded",
		"sharp",
		"filled",
	];

	const icons: MaterialIconMeta[] = json.icons.map((raw) => {
		const unsupported = new Set(raw.unsupported_families);
		const styles = ALL_STYLES.filter((s) => {
			const familyName = Object.entries(STYLE_MAP).find(
				([, v]) => v === s,
			)?.[0];
			if (!familyName) return true; // "filled" is always supported
			return !unsupported.has(familyName);
		});
		return {
			name: raw.name,
			categories: raw.categories,
			tags: raw.tags,
			styles,
		};
	});

	return { icons, fetchedAt: Date.now() };
}

/**
 * Filter Material icons by name/tag search and optional style + category.
 */
export function filterMaterialIcons(
	icons: MaterialIconMeta[],
	query: string,
	style?: MaterialIconStyle,
	category?: string,
): MaterialIconMeta[] {
	const lc = query.toLowerCase();
	return icons.filter((icon) => {
		if (style && !icon.styles.includes(style)) {
			return false;
		}
		if (category && !icon.categories.includes(category)) {
			return false;
		}
		if (!lc) return true;
		return (
			icon.name.toLowerCase().includes(lc) ||
			icon.tags.some((t) => t.toLowerCase().includes(lc))
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
 * Validates a CustomSvgIcon name: only lowercase a-z, 0-9, hyphens.
 */
export function isValidSvgIconName(name: string): boolean {
	return /^[a-z0-9][a-z0-9-]*$/.test(name);
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
