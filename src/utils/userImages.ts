/**
 * utils/userImages.ts — Validation and bookkeeping for the user's own pictures.
 *
 * `PluginSettings.userImages` is read from `data.json` and from import files,
 * both of which are untrusted, so everything that reaches the pack goes through
 * `sanitizeUserImages` first — the same defensive posture as
 * `sanitizeCustomPalettes` for palettes.
 *
 * The artwork is re-filtered through `sanitizeUserSvg` on every read, not just
 * when it was first added. `data.json` is an ordinary file that syncs between
 * devices and can be hand-edited or arrive in an import, so trusting a check
 * that happened on some other machine would be trusting nothing at all — the
 * same reasoning that makes PackDataStore re-verify its checksums on each load.
 */
import { sanitizeUserSvg } from "../icons/svg";
import type { UserImageIcon } from "../types";

/** Prefix for a picture's stable id, stored as `CalloutIcon.value`. */
const ID_PREFIX = "img-";

const FORMATS = new Set<UserImageIcon["format"]>([
	"svg",
	"png",
	"jpeg",
	"webp",
]);

/** Long enough for any sane filename; a guard, not a style rule. */
const MAX_NAME_LENGTH = 60;

/**
 * Extensions a name may already end in, so the legacy migration below can tell
 * a filename that carries one from a bare name that needs one.
 */
const KNOWN_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

/** What a stored picture's name should end in, if it does not end in anything. */
const EXTENSION_OF: Record<UserImageIcon["format"], string> = {
	svg: ".svg",
	png: ".png",
	jpeg: ".jpg",
	webp: ".webp",
};

/** A fresh id. Short on purpose — it is stored in every callout that uses it. */
export function newUserImageId(): string {
	const bytes = new Uint8Array(4);
	crypto.getRandomValues(bytes);
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `${ID_PREFIX}${hex}`;
}

/**
 * What a picture is filed under: the filename exactly as the operating system
 * shows it, extension and all.
 *
 * Nothing is prettified. A name the user did not choose is a name they have to
 * re-learn to recognize in the grid, and the extension is half of what tells
 * two pictures apart — `logo.svg` and `logo.png` are two pictures, while two
 * `logo.png` are the same one twice.
 */
export function userImageNameFromFilename(filename: string): string {
	const name = filename.trim();
	if (name.length === 0) return "Image";
	if (name.length <= MAX_NAME_LENGTH) return name;
	// Shorten the stem, never the extension: the extension is what the
	// duplicate rule reads, and dropping it would merge two distinct pictures.
	const dot = name.lastIndexOf(".");
	const extension = dot > 0 ? name.slice(dot) : "";
	const stem = dot > 0 ? name.slice(0, dot) : name;
	const room = Math.max(1, MAX_NAME_LENGTH - extension.length);
	return `${stem.slice(0, room).trimEnd()}${extension}`;
}

/**
 * The form two names are compared in.
 *
 * Case-insensitive, because the file systems these names come from (macOS,
 * Windows) are: `Logo.png` and `logo.png` are one file there, so offering them
 * as two pictures here would invent a distinction the user cannot see.
 */
export function normalizeUserImageName(name: string): string {
	return name.trim().toLowerCase();
}

/**
 * The names a collection has already spoken for, ready to test an incoming
 * file against.
 *
 * Uniqueness is enforced here, where a file is added, and nowhere else — an
 * import merges by id and a hand-edited `data.json` can say anything, and
 * dropping a picture on read because its name collides would delete artwork
 * that callouts are pointing at.
 */
export function takenUserImageNames(
	images: readonly UserImageIcon[],
): Set<string> {
	return new Set(images.map((image) => normalizeUserImageName(image.name)));
}

/**
 * Drop anything malformed from a saved or imported picture list.
 *
 * Entries are dropped rather than repaired: a picture with no artwork is not a
 * degraded picture, it is nothing, and leaving it in the list would put an
 * un-drawable cell in the picker.
 */
export function sanitizeUserImages(raw: unknown): UserImageIcon[] {
	if (!Array.isArray(raw)) return [];
	const result: UserImageIcon[] = [];
	const seenIds = new Set<string>();
	for (const entry of raw) {
		if (!entry || typeof entry !== "object") continue;
		const image = entry as Partial<UserImageIcon>;
		if (typeof image.id !== "string" || image.id.length === 0) continue;
		if (seenIds.has(image.id)) continue;
		if (typeof image.name !== "string" || image.name.length === 0) continue;
		if (typeof image.svg !== "string" || image.svg.length === 0) continue;
		if (!FORMATS.has(image.format as UserImageIcon["format"])) continue;

		// Re-filter rather than trust: this markup may have been written by an
		// older build, edited by hand, or handed over in an import file.
		const artwork = sanitizeUserSvg(image.svg);
		if (!artwork) continue;

		const format = image.format as UserImageIcon["format"];

		seenIds.add(image.id);
		result.push({
			id: image.id,
			// Pictures added before names were filenames were stored stripped of
			// their extension, which would let one of them sit in the grid next
			// to a fresh copy of the very file it came from without the
			// duplicate rule seeing a collision.
			name: withExtension(image.name, format),
			format,
			svg: artwork.svg,
			// From the artwork itself rather than the saved numbers, which are a
			// claim about it that nothing keeps honest.
			width: artwork.width,
			height: artwork.height,
			// Only an SVG can be recoloured — a mask is a stencil, so tinting a
			// photo would flatten it to a silhouette. `recolor` is the field's
			// name in a vault written before the flag moved onto the callout;
			// droppable once this branch has shipped.
			monochrome:
				(image.monochrome ??
					(image as { recolor?: unknown }).recolor) === true &&
				format === "svg",
			rev: Number.isFinite(image.rev) ? Number(image.rev) : 1,
			addedAt: Number.isFinite(image.addedAt) ? Number(image.addedAt) : 0,
		});
	}
	return result;
}

/**
 * A stored name brought up to date with the rule that names are filenames.
 *
 * Only the extension can be restored — the old naming also turned `-` and `_`
 * into spaces, and that is not reversible from what was kept. Re-adding the
 * file gives the exact name back; this at least makes every name in the grid
 * carry its type, and makes the duplicate rule see the collision.
 *
 * Idempotent, which matters because this runs on every read of `data.json`.
 */
function withExtension(name: string, format: UserImageIcon["format"]): string {
	const lower = name.toLowerCase();
	if (KNOWN_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
		return name;
	}
	return `${name}${EXTENSION_OF[format]}`;
}

/**
 * How much of `data.json` the pictures occupy, in bytes of stored markup.
 *
 * Approximate by design: it counts the artwork and ignores the JSON framing,
 * which is what the size readout in the picker is trying to convey.
 */
export function userImagesByteSize(images: readonly UserImageIcon[]): number {
	let total = 0;
	for (const image of images) total += image.svg.length;
	return total;
}

/** A byte count as a short human-readable string ("12 KB", "1.4 MB"). */
export function formatByteSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
