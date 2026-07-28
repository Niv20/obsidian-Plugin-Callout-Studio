/**
 * icons/svg.ts — SVG handling for artwork that arrives as markup.
 *
 * Only one source needs this: Material Symbols, whose drawings are fetched
 * individually from Google as complete SVG documents. Downloadable packs ship
 * bare path data instead (see packData.ts), which has nothing to sanitize.
 */

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
 * Strip anything executable from an SVG document and normalize it.
 *
 * Returns null when the input is not a well-formed `<svg>`, so a bad response
 * is discarded rather than stored and rendered.
 */
export function sanitizeSVG(raw: string): string | null {
	const parser = new DOMParser();
	const doc = parser.parseFromString(raw, "image/svg+xml");

	if (doc.querySelector("parsererror")) return null;

	const svg = doc.documentElement;
	if (svg.tagName.toLowerCase() !== "svg") return null;

	// A viewBox is what lets the icon scale to the callout's font size; some
	// vendor files carry only width/height.
	if (!svg.hasAttribute("viewBox")) {
		const w = svg.getAttribute("width");
		const h = svg.getAttribute("height");
		svg.setAttribute(
			"viewBox",
			w && h ? `0 0 ${parseFloat(w)} ${parseFloat(h)}` : "0 0 24 24",
		);
	}

	cleanElement(svg);
	return new XMLSerializer().serializeToString(svg);
}

function cleanElement(el: Element): void {
	const toRemove: Element[] = [];
	for (let i = 0; i < el.children.length; i++) {
		const child = el.children[i];
		if (!child) continue;
		if (DANGEROUS_TAGS.has(child.tagName.toLowerCase())) toRemove.push(child);
		else cleanElement(child);
	}
	for (const child of toRemove) el.removeChild(child);

	for (const attr of el.getAttributeNames()) {
		if (EVENT_ATTR_RE.test(attr)) {
			el.removeAttribute(attr);
			continue;
		}
		const value = el.getAttribute(attr);
		if (value && DANGEROUS_ATTR_VALUES_RE.test(value)) {
			el.removeAttribute(attr);
		}
	}
}

/** Encode SVG markup for use in a CSS `url()` value. */
export function svgToDataUri(svg: string): string {
	const encoded = encodeURIComponent(svg)
		.replace(/'/g, "%27")
		.replace(/"/g, "%22");
	return `url("data:image/svg+xml,${encoded}")`;
}
