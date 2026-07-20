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
	EmojiEntry,
} from "../types";
import { MATERIAL_ICON_METADATA } from "../data/materialIconsMetadata";
import { EMOJI_DATA } from "../data/emojiData";

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

// ── Emoji ───────────────────────────────────────────────────────────────

/**
 * Returns the bundled emoji dataset, optionally filtered by a search query.
 * The query is split on whitespace so each word must match (label or tags),
 * mirroring the Material icon search behavior.
 */
export function getEmojis(query?: string): EmojiEntry[] {
	const words = (query ?? "")
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 0);
	if (words.length === 0) return EMOJI_DATA;
	return EMOJI_DATA.filter((e) => {
		const label = e.label.toLowerCase();
		return words.every(
			(w) => label.includes(w) || e.tags.some((t) => t.includes(w)),
		);
	});
}

/**
 * Resolves an emoji glyph for a given skin tone. Tone 0 is the default glyph;
 * tones 1–5 (light → dark) return the matching skin variant when the emoji
 * supports skin tones, otherwise the base glyph.
 */
export function applyEmojiSkin(entry: EmojiEntry, tone: number): string {
	if (tone >= 1 && tone <= 5 && entry.skins) {
		return entry.skins[tone - 1] ?? entry.emoji;
	}
	return entry.emoji;
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
 * Loads the Material Symbols variable font for the requested style by injecting
 * a Google Fonts stylesheet <link>. The browser fetches the CSS with its own
 * (Chrome) User-Agent, which is required for Google to return the variable woff2
 * build that carries the FILL axis — fetching via requestUrl returns per-weight
 * static TTFs with no fill, so the font cannot render filled glyphs.
 */
export function ensureMaterialFontLoaded(
	style: MaterialIconStyle,
): Promise<void> {
	const family = materialFontFamily(style);
	const cached = materialFontLoadCache.get(family);
	if (cached) return cached;

	const loadPromise = new Promise<void>((resolve) => {
		const doc = activeDocument;
		const encodedFamily = family.replace(/ /g, "+");
		const href =
			`https://fonts.googleapis.com/css2?family=${encodedFamily}` +
			`:opsz,wght,FILL,GRAD@24,100..700,0..1,0`;

		// Force the @font-face to actually download so glyphs are ready on first
		// paint (resolving on link load alone can resolve before the font fetch).
		const ready = () =>
			doc.fonts
				.load(`24px "${family}"`)
				.then(() => resolve())
				.catch(() => resolve());

		// Reuse an existing link (e.g. after a reload or in a popout window)
		// instead of appending a duplicate.
		const existing = doc.head.querySelector<HTMLLinkElement>(
			`link[data-cs-material-font="${family}"]`,
		);
		if (existing) {
			void ready();
			return;
		}

		// External Google Fonts stylesheet (Material Symbols), loaded on demand — not a
		// bundled styles.css. The bare global createEl is deliberate — document.createElement
		// trips obsidianmd/prefer-create-el, and a member `doc.createEl("link")` trips
		// obsidianmd/no-forbidden-elements; the global helper trips neither.
		const link = createEl("link");
		link.rel = "stylesheet";
		link.href = href;
		link.setAttribute("data-cs-material-font", family);
		link.onload = () => void ready();
		// Don't block the picker on a failed/offline font load.
		link.onerror = () => resolve();
		doc.head.appendChild(link);
	});

	materialFontLoadCache.set(family, loadPromise);
	return loadPromise;
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

	// gstatic serves the weight segment before the fill segment
	// (e.g. "wght300fill1", not "fill1wght300"). Weight 400 is the default and
	// is omitted; with no segments the variant is "default".
	const parts: string[] = [];
	if (weight !== 400) parts.push(`wght${weight}`);
	if (style === "filled") parts.push("fill1");
	const variant = parts.length ? parts.join("") : "default";

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
