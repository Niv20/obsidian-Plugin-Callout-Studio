/**
 * icons/data/packManifest.ts — What each downloadable pack should contain.
 *
 * Every field here is baked into the plugin build, which is what makes the
 * download safe to justify: the plugin knows the exact byte count and SHA-256
 * of the file it expects, and refuses anything else. A compromised or
 * mis-served CDN response cannot become executable data, and a stale cached
 * file is detected rather than rendered.
 *
 * Regenerate the numbers with `npm run icons:generate`, which prints them.
 */
import type { IconPackId } from "../../types";

/**
 * The on-disk pack format this build understands. Bumping it invalidates every
 * cached pack file, forcing a re-download in the new shape.
 */
export const PACK_FORMAT = 1;

/**
 * Tag the pack files are fetched from — deliberately *not* the plugin version.
 *
 * jsDelivr caches a tagged URL permanently, so pinning to a dedicated tag means
 * an ordinary patch release does not invalidate every user's cached pack.
 * Refreshing pack data is then an explicit act: new tag, bumped `revision`.
 * The tag also does not match the release workflow's version pattern, so
 * pushing it cannot trigger a plugin build.
 */
export const PACKS_TAG = "packs-v1";

const REPO = "Niv20/obsidian-Plugin-Callout-Studio";

/** Primary and fallback URLs for a pack file, in the order they are tried. */
export function packUrls(id: IconPackId): string[] {
	return [
		`https://cdn.jsdelivr.net/gh/${REPO}@${PACKS_TAG}/packs/${id}.json`,
		`https://raw.githubusercontent.com/${REPO}/${PACKS_TAG}/packs/${id}.json`,
	];
}

export interface PackManifestEntry {
	/** Upstream release the data was generated from. */
	version: string;
	iconCount: number;
	/** Exact size of the pack file, for the download prompt and a cheap check. */
	bytes: number;
	/** SHA-256 of the pack file's bytes, verified before anything is stored. */
	sha256: string;
}

export const PACK_MANIFEST: Partial<Record<IconPackId, PackManifestEntry>> = {
	octicons: {
		version: "19.31.0",
		iconCount: 383,
		bytes: 384490,
		sha256: "8d34725983eee3d840da65e802fd29e583fc2845058923b88e8151fa418b852f",
	},
};
