/**
 * i18n/LocaleStore.ts — Downloads translations and caches them to disk.
 *
 * Only English ships inside `main.js`. Every other language is a JSON file
 * fetched from the plugin's own release tag and kept in the plugin folder. The
 * contract this class exists to keep:
 *
 * - **A language is fetched at most once.** It lands in the plugin's own folder
 *   and is read from there on every later launch, so it works offline
 *   afterwards and survives a restart or a plugin update.
 * - **A download is only attempted when the file this build expects is not
 *   already there.** Because freshness is decided by SHA-256 rather than by
 *   version number, a release that did not touch a language re-downloads
 *   nothing for the people reading it — even though the URL changed.
 * - **Only the exact expected bytes are accepted from the network.** The build
 *   knows each file's size and SHA-256 (see localeManifest.ts), so a
 *   compromised CDN, a captive portal or a truncated response is discarded.
 * - **Nothing is ever deleted to make room for a download.** A cached file is
 *   overwritten only after its replacement has arrived and verified, so a
 *   failed refresh leaves the working translation exactly where it was.
 * - **Disk is a cache, never a dependency.** Every failure here is survivable:
 *   `t()` falls back to English one key at a time, so the worst outcome is an
 *   untranslated UI, never a broken one.
 *
 * A file whose hash no longer matches the manifest is *stale*, not corrupt —
 * almost always a copy an older version of the plugin downloaded before new
 * strings were added. It is registered and used immediately, so the user sees
 * their own language at once and offline, with `t()` filling any new keys from
 * English; the refresh then upgrades it quietly in the background. Strict
 * verification is what guards the network; on disk the same hash is a staleness
 * signal, and a stale-but-well-formed file is accepted after the shape check
 * below because the plugin's own folder is already as trusted as `main.js`
 * sitting beside it. Nothing here is ever inserted as markup — translations
 * reach the DOM only as text — so the shape check is the whole attack surface.
 */
import { Notice, normalizePath, requestUrl } from "obsidian";
import type { App, PluginManifest } from "obsidian";
import {
	LOCALE_FORMAT,
	LOCALE_MANIFEST,
	type LocaleFileId,
	type LocaleManifestEntry,
} from "./localeManifest";
import { registerLocaleFile, resolveLocaleFile, t } from "./index";

/**
 * `requestUrl` cannot be aborted and reports no progress, so a hung connection
 * would otherwise leave the language picker spinning forever. This is the only
 * stop. Shorter than the icon packs' timeout because these files are ~50 KB and
 * this one runs at startup.
 */
const DOWNLOAD_TIMEOUT_MS = 15_000;

/**
 * Ceiling for a file read off disk. The largest locale is about 66 KB, so this
 * is far above anything legitimate; it exists so a truncated sync or a stray
 * edit cannot hand the parser something pathological.
 */
const MAX_LOCALE_BYTES = 1_048_576;

/** Longest single translated string worth accepting from an unverified file. */
const MAX_VALUE_LENGTH = 4_096;

const REPO = "Niv20/obsidian-plugin-callout-studio";

/**
 * Primary and fallback URLs for a locale file, in the order they are tried.
 *
 * Pinned to the plugin's own release version, which is the whole reason this
 * needs no maintenance: the tag already exists (the release workflow is
 * triggered by it), each version's URL is immutable so jsDelivr's permanent
 * caching is correct rather than a hazard, and adding strings in a future
 * release publishes new files without anyone minting a tag. The icon packs
 * pin to a frozen tag instead because they are megabytes that almost never
 * change; these are kilobytes that change most releases.
 */
export function localeUrls(id: LocaleFileId, version: string): string[] {
	return [
		`https://cdn.jsdelivr.net/gh/${REPO}@${version}/locales/${id}.json`,
		`https://raw.githubusercontent.com/${REPO}/${version}/locales/${id}.json`,
	];
}

/** Whether the copy on disk is the one this build expects. */
export type LocaleDiskResult = "fresh" | "stale" | "missing" | "invalid";

export type LocaleLoadState =
	| "absent"
	| "loading"
	| "ready"
	| "stale"
	| "failed";

interface LocaleFile {
	format: number;
	locale: string;
	strings: Record<string, string>;
}

/**
 * Validate an unverified payload before any of it reaches `t()`.
 *
 * Deliberately strict about shape and deliberately silent about content: a
 * translation is arbitrary text by nature, so there is nothing to whitelist.
 * What matters is that it is a flat map of strings under the right identity,
 * which is what stops a JSON file of some other kind — or one for a different
 * language — from being registered as this one.
 */
function parseLocaleFile(
	raw: unknown,
	id: LocaleFileId,
): { ok: true; file: LocaleFile } | { ok: false; reason: string } {
	if (typeof raw !== "object" || raw === null) {
		return { ok: false, reason: "not an object" };
	}
	const file = raw as Partial<LocaleFile>;
	if (file.format !== LOCALE_FORMAT) {
		return { ok: false, reason: `format ${String(file.format)}` };
	}
	if (file.locale !== id) {
		return { ok: false, reason: `locale "${String(file.locale)}"` };
	}
	if (typeof file.strings !== "object" || file.strings === null) {
		return { ok: false, reason: "strings is not an object" };
	}
	const entries = Object.entries(file.strings);
	if (entries.length === 0) return { ok: false, reason: "no strings" };
	for (const [key, value] of entries) {
		if (typeof value !== "string") {
			return { ok: false, reason: `"${key}" is not a string` };
		}
		if (value.length > MAX_VALUE_LENGTH) {
			return { ok: false, reason: `"${key}" is too long` };
		}
	}
	return { ok: true, file: file as LocaleFile };
}

export class LocaleStore {
	private readonly states = new Map<LocaleFileId, LocaleLoadState>();
	/** De-duplicates concurrent requests for the same file. */
	private readonly inFlight = new Map<LocaleFileId, Promise<boolean>>();
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
				console.warn("[CalloutStudio] locale listener error", e);
			}
		}
	}

	state(id: LocaleFileId): LocaleLoadState {
		return this.states.get(id) ?? "absent";
	}

	/**
	 * Is this preference renderable right now? English always is; anything else
	 * needs its file loaded, whether fresh or stale.
	 */
	isReady(pref: string): boolean {
		const id = resolveLocaleFile(pref);
		if (!id) return true;
		const state = this.state(id);
		return state === "ready" || state === "stale";
	}

	// ── Disk ────────────────────────────────────────────────────────────

	/**
	 * The plugin's own folder, so uninstalling takes the translations with it.
	 * `manifest.dir` is typed optional, hence the reconstruction fallback — the
	 * same shape `PackDataStore.packDir()` uses.
	 *
	 * Named `translations`, not `locales`: during development the repository
	 * *is* the plugin folder, and `locales/` there holds the committed sources
	 * this cache is built from. One name for both would have the runtime
	 * overwrite the repo's own files, which is the same reason the icon packs
	 * are served from `packs/` but cached into `icon-packs/`.
	 */
	private dir(): string {
		const base =
			this.manifest.dir ??
			`${this.app.vault.configDir}/plugins/${this.manifest.id}`;
		return normalizePath(`${base}/translations`);
	}

	/**
	 * Where a locale file lives once downloaded.
	 *
	 * Dropping a file here by hand also works — it is read on the next launch
	 * and shape-checked like any other, so a machine that never reaches the
	 * network can still be translated from a copy carried in by other means.
	 */
	filePath(id: LocaleFileId): string {
		return normalizePath(`${this.dir()}/${id}.json`);
	}

	/**
	 * Load a locale from disk if it is there. Never fetches.
	 *
	 * The checksum decides `"fresh"` versus `"stale"` rather than accept versus
	 * reject, because the two mean very different things for a translation: a
	 * hash mismatch on an icon pack is damage, while here it is nearly always a
	 * copy from a build before some strings were added. Refusing it would flip a
	 * user's whole interface to English to avoid a handful of untranslated
	 * labels — and would do it precisely when they are offline and cannot fix it.
	 */
	async loadFromDisk(id: LocaleFileId): Promise<LocaleDiskResult> {
		const path = this.filePath(id);
		const expected = LOCALE_MANIFEST[id];
		try {
			const adapter = this.app.vault.adapter;
			if (!(await adapter.exists(path))) return "missing";
			const text = await adapter.read(path);
			if (text.length > MAX_LOCALE_BYTES) {
				console.warn(`[CalloutStudio] locale "${id}" on disk is too large`);
				return "invalid";
			}
			const fresh = await this.matches(text, expected);
			if (!this.accept(id, text, `disk (${path})`, fresh)) return "invalid";
			return fresh ? "fresh" : "stale";
		} catch (e) {
			console.warn(`[CalloutStudio] could not read locale "${id}"`, e);
			return "invalid";
		}
	}

	/**
	 * Register whatever is already on disk for this preference, without touching
	 * the network. Called before the first translated string of the session, so
	 * the ordinary launch — where the file has been there for months — paints
	 * straight into the user's language.
	 */
	async prepare(pref: string): Promise<LocaleDiskResult | null> {
		const id = resolveLocaleFile(pref);
		if (!id) return null;
		const result = await this.loadFromDisk(id);
		this.notify();
		return result;
	}

	/**
	 * Persist a locale so later launches skip the network. Best-effort by
	 * design: a read-only vault or a suspended mobile app must not cost the user
	 * the download they just did, so failure only downgrades this to
	 * session-only.
	 */
	private async persist(id: LocaleFileId, text: string): Promise<void> {
		const adapter = this.app.vault.adapter;
		const dir = this.dir();
		try {
			if (!(await adapter.exists(dir))) await adapter.mkdir(dir);
			await adapter.write(this.filePath(id), text);
		} catch (e) {
			console.warn(`[CalloutStudio] could not cache locale "${id}"`, e);
			if (!this.diskWriteBroken) {
				this.diskWriteBroken = true;
				new Notice(t("locale.diskWriteFailed"));
			}
		}
	}

	// ── Download ────────────────────────────────────────────────────────

	/**
	 * Make a preference renderable: read the cache, and fetch only if what is
	 * there is missing or older than this build. Resolves to whether the
	 * language is now available.
	 *
	 * This is the single entry point for both callers — the background pass at
	 * startup and the language picker — because the decision of whether a
	 * download is needed belongs here, not in the UI.
	 */
	async ensure(pref: string): Promise<boolean> {
		const id = resolveLocaleFile(pref);
		if (!id) return true;

		if (this.state(id) === "absent") await this.loadFromDisk(id);
		if (this.state(id) === "ready") return true;

		// A stale file is already usable, so a failed refresh is not a failure.
		const hadStale = this.state(id) === "stale";
		const ok = await this.download(id);
		return ok || hadStale;
	}

	/**
	 * Fetch a locale, verify it, and make it usable. Concurrent calls share one
	 * request.
	 */
	download(id: LocaleFileId): Promise<boolean> {
		const existing = this.inFlight.get(id);
		if (existing) return existing;

		const run = this.runDownload(id).finally(() => {
			this.inFlight.delete(id);
		});
		this.inFlight.set(id, run);
		return run;
	}

	private async runDownload(id: LocaleFileId): Promise<boolean> {
		const expected = LOCALE_MANIFEST[id];
		if (!expected) return false;

		const hadStale = this.state(id) === "stale";
		this.states.set(id, "loading");
		this.notify();

		let lastError: unknown;
		for (const url of localeUrls(id, this.manifest.version)) {
			try {
				const text = await this.fetchWithTimeout(url);
				// Unlike a stale file on disk, an unverifiable response is simply
				// discarded: the next URL may serve the right bytes, and there is
				// no reason to trust a CDN that just returned the wrong ones.
				if (!(await this.matches(text, expected))) {
					console.warn(`[CalloutStudio] locale "${id}" mismatch from ${url}`);
					continue;
				}
				if (!this.accept(id, text, url, true)) continue;
				await this.persist(id, text);
				this.notify();
				return true;
			} catch (e) {
				lastError = e;
			}
		}

		// Keep the working copy's state rather than reporting a language the user
		// can still read as failed.
		this.states.set(id, hadStale ? "stale" : "failed");
		this.notify();
		console.warn(`[CalloutStudio] locale "${id}" download failed`, lastError);
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

	/** Is this text byte-for-byte the file this build expects? */
	private async matches(
		text: string,
		expected: LocaleManifestEntry | undefined,
	): Promise<boolean> {
		if (!expected) return false;
		const bytes = new TextEncoder().encode(text);
		if (bytes.byteLength !== expected.bytes) return false;
		const digest = await crypto.subtle.digest("SHA-256", bytes);
		const hex = Array.from(new Uint8Array(digest))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return hex === expected.sha256;
	}

	/** Parse, shape-check and publish locale text. */
	private accept(
		id: LocaleFileId,
		text: string,
		source: string,
		fresh: boolean,
	): boolean {
		let raw: unknown;
		try {
			raw = JSON.parse(text);
		} catch {
			console.warn(`[CalloutStudio] locale "${id}" from ${source} is not JSON`);
			return false;
		}
		const result = parseLocaleFile(raw, id);
		if (!result.ok) {
			console.warn(
				`[CalloutStudio] locale "${id}" from ${source} rejected: ${result.reason}`,
			);
			return false;
		}
		registerLocaleFile(id, result.file.strings);
		this.states.set(id, fresh ? "ready" : "stale");
		return true;
	}
}
