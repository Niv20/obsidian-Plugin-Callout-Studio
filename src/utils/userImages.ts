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

		seenIds.add(image.id);
		result.push({
			id: image.id,
			name: image.name,
			format: image.format as UserImageIcon["format"],
			svg: artwork.svg,
			// From the artwork itself rather than the saved numbers, which are a
			// claim about it that nothing keeps honest.
			width: artwork.width,
			height: artwork.height,
			// Only an SVG can be recoloured — a mask is a stencil, so tinting a
			// photo would flatten it to a silhouette.
			recolor: image.recolor === true && image.format === "svg",
			rev: Number.isFinite(image.rev) ? Number(image.rev) : 1,
			addedAt: Number.isFinite(image.addedAt) ? Number(image.addedAt) : 0,
		});
	}
	return result;
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
