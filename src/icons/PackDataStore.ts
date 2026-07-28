/**
 * icons/PackDataStore.ts — Downloads icon packs and caches them to disk.
 *
 * The contract this class exists to keep:
 *
 * - **Nothing is fetched until the user asks.** Opening the icon picker, or a
 *   note using an icon, never touches the network. Only pressing Download in
 *   the picker does.
 * - **A pack is fetched at most once.** It lands in the plugin's own folder and
 *   is read from there on every later launch, so the pack works offline
 *   afterwards and survives a restart.
 * - **Only the exact expected bytes are accepted**, on download and on every
 *   later read. The build knows each pack's SHA-256 (see packManifest.ts);
 *   anything else is discarded, whether it came from a compromised CDN, a
 *   captive portal, a truncated write or an edit made to the file afterwards.
 * - **Disk is a cache, never a dependency.** Every write failure is survivable:
 *   the pack stays in memory for the session, and the artwork of the icons
 *   actually in use is separately copied into `data.json`, which syncs.
 */
import { Notice, normalizePath, requestUrl } from "obsidian";
import type { App, PluginManifest } from "obsidian";
import type { IconPackId } from "../types";
import { t } from "../i18n";
import {
	PACK_FORMAT,
	PACK_MANIFEST,
	packUrls,
	type PackManifestEntry,
} from "./data/packManifest";
import { isPackLoaded, parsePackFile, setPackData } from "./packData";

/**
 * `requestUrl` cannot be aborted and reports no progress, so a hung connection
 * would otherwise leave the picker spinning forever. This is the only stop.
 */
const DOWNLOAD_TIMEOUT_MS = 30_000;

export type PackLoadState =
	| "unavailable"
	| "loading"
	| "ready"
	| "failed";

/**
 * How a read from disk went. `"corrupt"` covers every way a file can be there
 * but unusable — wrong checksum, not JSON, or the wrong shape — because the
 * response to all of them is the same.
 */
export type PackDiskResult = "ready" | "missing" | "corrupt";

export class PackDataStore {
	private readonly states = new Map<IconPackId, PackLoadState>();
	/** De-duplicates concurrent requests for the same pack. */
	private readonly inFlight = new Map<IconPackId, Promise<boolean>>();
	private readonly listeners = new Set<() => void>();
	/** Set once a write has failed, so the user is only told the once. */
	private diskWriteBroken = false;

	constructor(
		private readonly app: App,
		private readonly manifest: PluginManifest,
	) {}

	onChange(cb: () => void): () => void {
		this.listeners.add(cb);
		return () => {
			this.listeners.delete(cb);
		};
	}

	private notify(): void {
		for (const cb of this.listeners) {
			try {
				cb();
			} catch (e) {
				console.warn("[CalloutStudio] pack listener error", e);
			}
		}
	}

	state(id: IconPackId): PackLoadState {
		if (isPackLoaded(id)) return "ready";
		return this.states.get(id) ?? "unavailable";
	}

	/** What the picker shows before a pack is downloaded. */
	info(id: IconPackId): PackManifestEntry | undefined {
		return PACK_MANIFEST[id];
	}

	// ── Disk ────────────────────────────────────────────────────────────

	/**
	 * The plugin's own folder, so uninstalling takes the packs with it.
	 * `manifest.dir` is typed optional, hence the reconstruction fallback.
	 */
	private packDir(): string {
		const base =
			this.manifest.dir ??
			`${this.app.vault.configDir}/plugins/${this.manifest.id}`;
		return normalizePath(`${base}/icon-packs`);
	}

	/**
	 * Where a pack file lives once downloaded.
	 *
	 * Dropping a file here by hand also works — it is read on the next launch
	 * and verified like any other, so a locked-down machine can install a pack
	 * from the GitHub release without a network. The picker deliberately does
	 * not advertise that: it is a path for someone who already knows to look,
	 * not an option worth putting in front of everyone downloading an icon set.
	 */
	packPath(id: IconPackId): string {
		return normalizePath(`${this.packDir()}/${id}.json`);
	}

	/**
	 * Load a pack from disk if it is there. Never fetches — a missing or
	 * unreadable file simply means the pack is not available yet.
	 *
	 * The checksum is re-checked here, not just at download time. A file on disk
	 * can be edited, truncated by a failed sync, or replaced; without this, the
	 * damaged version would be accepted silently on every later launch. It also
	 * makes the documented hand-drop path a real check rather than a claim, and
	 * costs well under a millisecond per pack — far less than the parse below it.
	 *
	 * `"corrupt"` is distinguished from `"missing"` so the caller can say which
	 * happened; both mean the same thing to the picker.
	 */
	async loadFromDisk(id: IconPackId): Promise<PackDiskResult> {
		if (isPackLoaded(id)) return "ready";
		const path = this.packPath(id);
		const expected = PACK_MANIFEST[id];
		try {
			const adapter = this.app.vault.adapter;
			if (!(await adapter.exists(path))) return "missing";
			const text = await adapter.read(path);
			if (expected && !(await this.verify(text, expected, path))) {
				return "corrupt";
			}
			return this.accept(id, text, `disk (${path})`) ? "ready" : "corrupt";
		} catch (e) {
			console.warn(`[CalloutStudio] could not read pack "${id}"`, e);
			return "corrupt";
		}
	}

	/**
	 * Load every pack that some callout actually uses. Called once on startup;
	 * packs nothing references stay unread, so an unused 400 KB file is never
	 * parsed.
	 */
	async loadUsed(
		usedPacks: Iterable<IconPackId>,
	): Promise<Map<IconPackId, PackDiskResult>> {
		const results = new Map<IconPackId, PackDiskResult>();
		for (const id of new Set(usedPacks)) {
			if (PACK_MANIFEST[id]) results.set(id, await this.loadFromDisk(id));
		}
		this.notify();
		return results;
	}

	/**
	 * Persist a pack so later launches skip the network. Best-effort by design:
	 * a read-only vault or a suspended mobile app must not cost the user the
	 * download they just did, so failure only downgrades this to session-only.
	 */
	private async persist(id: IconPackId, text: string): Promise<void> {
		const adapter = this.app.vault.adapter;
		const dir = this.packDir();
		try {
			if (!(await adapter.exists(dir))) await adapter.mkdir(dir);
			await adapter.write(this.packPath(id), text);
		} catch (e) {
			console.warn(`[CalloutStudio] could not cache pack "${id}" to disk`, e);
			if (!this.diskWriteBroken) {
				this.diskWriteBroken = true;
				new Notice(t("iconPack.diskWriteFailed"));
			}
		}
	}

	// ── Download ────────────────────────────────────────────────────────

	/**
	 * Fetch a pack, verify it, and make it usable. Resolves to whether the pack
	 * is now available. Concurrent calls share one request.
	 */
	download(id: IconPackId): Promise<boolean> {
		if (isPackLoaded(id)) return Promise.resolve(true);
		const existing = this.inFlight.get(id);
		if (existing) return existing;

		const run = this.runDownload(id).finally(() => {
			this.inFlight.delete(id);
		});
		this.inFlight.set(id, run);
		return run;
	}

	private async runDownload(id: IconPackId): Promise<boolean> {
		const expected = PACK_MANIFEST[id];
		if (!expected) return false;

		this.states.set(id, "loading");
		this.notify();

		let lastError: unknown;
		for (const url of packUrls(id)) {
			try {
				const text = await this.fetchWithTimeout(url);
				if (!(await this.verify(text, expected, url))) continue;
				if (!this.accept(id, text, url)) continue;
				await this.persist(id, text);
				this.notify();
				return true;
			} catch (e) {
				lastError = e;
			}
		}

		this.states.set(id, "failed");
		this.notify();
		console.warn(`[CalloutStudio] pack "${id}" download failed`, lastError);
		return false;
	}

	private async fetchWithTimeout(url: string): Promise<string> {
		let timer = 0;
		const timeout = new Promise<never>((_, reject) => {
			timer = window.setTimeout(
				() => reject(new Error(`timed out after ${DOWNLOAD_TIMEOUT_MS}ms`)),
				DOWNLOAD_TIMEOUT_MS,
			);
		});
		try {
			const response = await Promise.race([requestUrl({ url }), timeout]);
			return response.text;
		} finally {
			window.clearTimeout(timer);
		}
	}

	/**
	 * Reject anything that is not byte-for-byte the file this build expects.
	 * `source` is a URL when downloading and a path when reading from disk.
	 */
	private async verify(
		text: string,
		expected: PackManifestEntry,
		source: string,
	): Promise<boolean> {
		const bytes = new TextEncoder().encode(text);
		if (bytes.byteLength !== expected.bytes) {
			console.warn(
				`[CalloutStudio] pack size mismatch from ${source}: ` +
					`${bytes.byteLength} != ${expected.bytes}`,
			);
			return false;
		}
		const digest = await crypto.subtle.digest("SHA-256", bytes);
		const hex = Array.from(new Uint8Array(digest))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		if (hex !== expected.sha256) {
			console.warn(`[CalloutStudio] pack checksum mismatch from ${source}`);
			return false;
		}
		return true;
	}

	/** Parse, validate and publish pack text. */
	private accept(id: IconPackId, text: string, source: string): boolean {
		let raw: unknown;
		try {
			raw = JSON.parse(text);
		} catch {
			console.warn(`[CalloutStudio] pack "${id}" from ${source} is not JSON`);
			return false;
		}
		const result = parsePackFile(raw, id, PACK_FORMAT);
		if (!result.ok) {
			console.warn(
				`[CalloutStudio] pack "${id}" from ${source} rejected: ${result.reason}`,
			);
			return false;
		}
		setPackData(id, result.file);
		this.states.set(id, "ready");
		return true;
	}
}
