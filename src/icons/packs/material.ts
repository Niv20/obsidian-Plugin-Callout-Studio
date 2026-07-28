/**
 * icons/packs/material.ts — Google's Material Symbols.
 *
 * The one pack whose artwork is fetched per icon rather than as a whole file.
 * Material Symbols is a variable font: 3,870 icons across 4 styles and 7
 * weights is over 100,000 distinct drawings, so there is no bulk file worth
 * bundling or downloading. Google serves each drawing individually, and only
 * the icons a vault actually uses ever get fetched.
 *
 * The picker previews the grid with the Material Symbols webfont instead, which
 * is why this pack renders its grid from a font while every other SVG pack
 * renders it from path data.
 */
import { requestUrl } from "obsidian";
import type { CalloutIcon, MaterialIconStyle } from "../../types";
import type { IconEntry, IconIndex, IconPack, IconVariantState } from "../types";
import { MATERIAL_ICON_METADATA } from "../../data/materialIconsMetadata";
import { sanitizeSVG } from "../svg";

let index: IconIndex | null = null;
const fontLoads = new Map<string, Promise<void>>();

/** Defaults applied when an icon omits the fields (pre-2.0 data, or imports). */
export const MATERIAL_DEFAULT_STYLE: MaterialIconStyle = "outlined";
export const MATERIAL_DEFAULT_WEIGHT = 400;

export const MATERIAL_STYLES: readonly MaterialIconStyle[] = [
	"outlined",
	"filled",
	"rounded",
	"sharp",
];

/** The variable font's weight axis, in the steps Google exposes. */
export const MATERIAL_WEIGHTS: readonly number[] = [
	100, 200, 300, 400, 500, 600, 700,
];

/** The style/weight pair an icon actually renders at. */
export function materialVariantOf(icon: CalloutIcon): {
	style: MaterialIconStyle;
	weight: number;
} {
	return {
		style: icon.style ?? MATERIAL_DEFAULT_STYLE,
		weight: icon.weight ?? MATERIAL_DEFAULT_WEIGHT,
	};
}

export const materialPack: IconPack = {
	id: "material",
	kind: "perIconRemote",
	labelKey: "iconPicker.material",
	searchPlaceholderKey: "iconPicker.searchMaterial",
	hasCategories: true,
	variants: [
		{
			kind: "select",
			key: "style",
			labelKey: "iconPicker.materialStyle",
			options: MATERIAL_STYLES,
		},
		{
			kind: "select",
			key: "weight",
			labelKey: "iconPicker.materialWeight",
			options: MATERIAL_WEIGHTS,
		},
	],

	attribution: {
		title: "Material Symbols",
		homepage: "https://fonts.google.com/icons",
		version: "Material Symbols",
		licenses: [
			{
				name: "Apache License 2.0",
				spdx: "Apache-2.0",
				url: "https://www.apache.org/licenses/LICENSE-2.0",
				holder: "Google LLC",
			},
		],
	},

	loadIndex(): Promise<IconIndex> {
		if (!index) {
			const categories = new Set<string>();
			const entries: IconEntry[] = MATERIAL_ICON_METADATA.map((m) => {
				for (const c of m.categories) categories.add(c);
				return {
					name: m.name,
					categories: m.categories,
					keywords: m.tags,
				};
			});
			index = { entries, categories: [...categories].sort() };
		}
		return Promise.resolve(index);
	},

	makeIcon(entry: IconEntry, variants: IconVariantState): CalloutIcon {
		return {
			type: "material",
			value: entry.name,
			style: variants.style ?? MATERIAL_DEFAULT_STYLE,
			weight: variants.weight ?? MATERIAL_DEFAULT_WEIGHT,
		};
	},

	cacheVariant(icon: CalloutIcon): string {
		const { style, weight } = materialVariantOf(icon);
		return `${style}|${weight}`;
	},
};

// ── Webfont (grid preview only) ─────────────────────────────────────────

/** The CSS font-family each style renders under. */
export function materialFontFamily(style: MaterialIconStyle): string {
	switch (style) {
		case "outlined":
			return "Material Symbols Outlined";
		case "rounded":
			return "Material Symbols Rounded";
		case "sharp":
			return "Material Symbols Sharp";
		case "filled":
			// Filled is the same font at FILL 1, not a separate family.
			return "Material Symbols Outlined";
	}
}

/**
 * Load the Material Symbols variable font for a style, for the picker grid.
 *
 * Injected as a stylesheet `<link>` rather than fetched through `requestUrl`
 * deliberately: the browser sends its own Chrome user-agent, and Google only
 * returns the variable woff2 carrying the FILL axis to a browser. Fetching it
 * ourselves yields per-weight static TTFs that cannot render filled glyphs.
 *
 * Never rejects — an unreachable font must not stop the user browsing; the
 * ligature names simply show as text until it arrives.
 */
export function ensureMaterialFontLoaded(
	style: MaterialIconStyle,
): Promise<void> {
	const family = materialFontFamily(style);
	const cached = fontLoads.get(family);
	if (cached) return cached;

	const load = new Promise<void>((resolve) => {
		const doc = activeDocument;
		const href =
			`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}` +
			`:opsz,wght,FILL,GRAD@24,100..700,0..1,0`;

		// The <link> firing `load` only means the CSS arrived; force the font
		// file itself to download so glyphs are ready on the first paint.
		const ready = () =>
			doc.fonts
				.load(`24px "${family}"`)
				.then(() => resolve())
				.catch(() => resolve());

		// Reuse an existing link (after a reload, or in a popout window).
		const existing = doc.head.querySelector<HTMLLinkElement>(
			`link[data-cs-material-font="${family}"]`,
		);
		if (existing) {
			void ready();
			return;
		}

		// The bare global createEl is deliberate: document.createElement trips
		// obsidianmd/prefer-create-el, and a member doc.createEl("link") trips
		// obsidianmd/no-forbidden-elements. The global helper trips neither.
		const link = createEl("link");
		link.rel = "stylesheet";
		link.href = href;
		link.setAttribute("data-cs-material-font", family);
		link.onload = () => void ready();
		link.onerror = () => resolve();
		doc.head.appendChild(link);
	});

	fontLoads.set(family, load);
	return load;
}

// ── Per-icon artwork ────────────────────────────────────────────────────

/**
 * Where Google serves one drawing. The weight segment precedes the fill
 * segment ("wght300fill1", never the reverse); weight 400 is the default and is
 * omitted, and a URL with no segments uses the literal variant "default".
 */
function materialSvgUrl(
	name: string,
	style: MaterialIconStyle,
	weight: number,
): string {
	const family = style === "filled" ? "outlined" : style;
	const parts: string[] = [];
	if (weight !== MATERIAL_DEFAULT_WEIGHT) parts.push(`wght${weight}`);
	if (style === "filled") parts.push("fill1");
	const variant = parts.length > 0 ? parts.join("") : "default";
	return `https://fonts.gstatic.com/s/i/short-term/release/materialsymbols${family}/${name}/${variant}/24px.svg`;
}

/** Fetch and sanitize one Material Symbols drawing. */
export async function downloadMaterialSvg(
	name: string,
	style: MaterialIconStyle,
	weight: number = MATERIAL_DEFAULT_WEIGHT,
): Promise<string> {
	const response = await requestUrl({ url: materialSvgUrl(name, style, weight) });
	const sanitized = sanitizeSVG(response.text);
	if (!sanitized) {
		throw new Error(`Invalid SVG received for Material icon "${name}"`);
	}
	return sanitized;
}
