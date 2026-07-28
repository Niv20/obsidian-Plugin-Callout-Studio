/**
 * icons/packData.ts — In-memory pack artwork, and the SVG built from it.
 *
 * Downloadable packs ship their drawings as bare path data (see
 * scripts/generate-icon-packs.mjs). Storing `d` strings rather than markup is
 * what lets this data skip SVG sanitization: the file has no elements and no
 * attributes that could carry a payload, and every `d` is checked against a
 * path grammar before it is accepted, both at build time and here on load.
 *
 * The store is module-level because the render paths that need it are
 * synchronous and deep — a CodeMirror widget, a CSS generator — and threading a
 * handle through all of them would buy nothing: there is one Obsidian app, and
 * one copy of each pack.
 */
import type { IconPackId } from "../types";

/** One `<path>`: its data, plus the even-odd rules when the shape has holes. */
export interface PackGlyph {
	d: string;
	/** 1 when the path needs `fill-rule="evenodd"`. */
	r?: 1;
	/** 1 when the path needs `clip-rule="evenodd"`. */
	c?: 1;
}

/** One drawing of an icon. Its viewBox is `0 0 {w} {the size key}`. */
export interface PackSize {
	w: number;
	p: PackGlyph[];
}

export interface PackFile {
	format: number;
	pack: IconPackId;
	packVersion: string;
	/**
	 * name → size key → drawing. Packs with a single drawing per icon use one
	 * key (their viewBox height), so every pack has the same shape and the
	 * size-preference logic below works unchanged for all of them.
	 */
	icons: Record<string, Record<string, PackSize>>;
}

/** Legal SVG path-data characters — notably none that can open an element. */
const PATH_DATA_RE = /^[MmLlHhVvCcSsQqTtAaZz0-9eE+\-.,\s]+$/;

const loaded = new Map<IconPackId, PackFile>();

/** The pack's artwork, or null when it has not been loaded this session. */
export function getPackData(id: IconPackId): PackFile | null {
	return loaded.get(id) ?? null;
}

export function isPackLoaded(id: IconPackId): boolean {
	return loaded.has(id);
}

export function setPackData(id: IconPackId, file: PackFile): void {
	loaded.set(id, file);
}

/**
 * Validate parsed JSON as a pack file for `id`, or explain why it is not.
 *
 * Rejects the whole file on the first bad path rather than skipping the icon:
 * a file that fails this check is corrupt or not what it claims to be, and
 * neither is something to render around.
 */
export function parsePackFile(
	raw: unknown,
	id: IconPackId,
	expectedFormat: number,
): { ok: true; file: PackFile } | { ok: false; reason: string } {
	if (typeof raw !== "object" || raw === null) {
		return { ok: false, reason: "not an object" };
	}
	const file = raw as Partial<PackFile>;
	if (file.format !== expectedFormat) {
		return { ok: false, reason: `format ${String(file.format)} != ${expectedFormat}` };
	}
	if (file.pack !== id) {
		return { ok: false, reason: `pack "${String(file.pack)}" != "${id}"` };
	}
	if (typeof file.icons !== "object" || file.icons === null) {
		return { ok: false, reason: "missing icons" };
	}
	const names = Object.keys(file.icons);
	if (names.length === 0) return { ok: false, reason: "no icons" };

	for (const name of names) {
		const sizes = file.icons[name];
		if (typeof sizes !== "object" || sizes === null) {
			return { ok: false, reason: `bad record for "${name}"` };
		}
		for (const key of Object.keys(sizes)) {
			const size = sizes[key];
			if (
				typeof size?.w !== "number" ||
				!Number.isFinite(size.w) ||
				!Array.isArray(size.p) ||
				size.p.length === 0
			) {
				return { ok: false, reason: `bad drawing for "${name}@${key}"` };
			}
			for (const glyph of size.p) {
				if (
					typeof glyph?.d !== "string" ||
					glyph.d.length === 0 ||
					!PATH_DATA_RE.test(glyph.d)
				) {
					return { ok: false, reason: `bad path data in "${name}@${key}"` };
				}
			}
		}
	}
	return { ok: true, file: file as PackFile };
}

/**
 * Choose which of an icon's drawings to use.
 *
 * `preferred` is tried in order, then anything the icon does have. The fallback
 * matters: Octicons draws nine icons at 12px only and `bookmark-fill` at 24px
 * only, so a strict preference would render nothing at all for them.
 */
export function pickSizeKey(
	available: readonly string[],
	preferred: readonly string[],
): string | null {
	for (const key of preferred) {
		if (available.includes(key)) return key;
	}
	return available[0] ?? null;
}

/**
 * Assemble an icon's drawing into SVG markup.
 *
 * No `fill` is emitted, so the glyph takes its colour from whatever the caller
 * sets — `fill="currentColor"` on screen, a baked literal for PDF export.
 * Attribute values need no escaping: `d` is restricted to the path grammar
 * above, which contains no quote, angle bracket or ampersand.
 */
export function buildPackSvg(
	id: IconPackId,
	name: string,
	preferred: readonly string[],
): string | null {
	const file = loaded.get(id);
	const sizes = file?.icons[name];
	if (!sizes) return null;

	const key = pickSizeKey(Object.keys(sizes), preferred);
	if (key === null) return null;
	const size = sizes[key];
	if (!size) return null;

	const paths = size.p
		.map(
			(g) =>
				`<path d="${g.d}"` +
				(g.r ? ` fill-rule="evenodd"` : "") +
				(g.c ? ` clip-rule="evenodd"` : "") +
				`/>`,
		)
		.join("");

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" ` +
		`viewBox="0 0 ${size.w} ${key}">${paths}</svg>`
	);
}
