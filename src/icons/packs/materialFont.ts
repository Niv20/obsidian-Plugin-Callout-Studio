/**
 * icons/packs/materialFont.ts — The Material Symbols webfont, for the picker grid.
 *
 * Material is the one source whose grid is drawn from a font instead of from
 * artwork. 3,870 icons across 4 styles and 7 weights is over 100,000 distinct
 * drawings, so there is nothing to bundle and nothing to bulk-download; the
 * picker renders each cell as the icon's *name* and lets a ligature in Google's
 * variable font turn it into a glyph. That makes this file the single point of
 * failure for whether the grid shows icons or shows text, which is why it is
 * this careful.
 *
 * Every rule below exists because its absence was a bug:
 *
 * - **A failure is never remembered as a success.** The previous version
 *   resolved its promise from `link.onerror`, so one transient failure was
 *   cached as "loaded" for the rest of the session. Only `ready` is memoized
 *   here; a failure clears its entry so the next call genuinely retries.
 * - **Loading is verified, not assumed.** `doc.fonts.load()` resolves happily
 *   with an empty list when no matching face was ever registered, so success is
 *   confirmed afterwards by finding a loaded face — see `isFamilyLoaded`, and
 *   note that `doc.fonts.check()` cannot be used for this.
 * - **A dead `<link>` is replaced, not reused.** Nothing removes these elements,
 *   and Obsidian re-runs `main.js` on a plugin reload while `document.head`
 *   survives — so trusting an existing link let a single dud request outlive
 *   every reload short of restarting the app.
 * - **State is per document.** `activeDocument` is the pop-out's document when
 *   one has focus, and a `FontFace` added to one document is unknown to the
 *   other, so a shared memo could report a font the window in front never got.
 * - **A hung request still ends.** Neither `onload` nor `onerror` fires on a
 *   connection that never answers, which left the picker awaiting forever.
 *
 * Outlined and Filled share one family (filled is that font at `FILL 1`), so
 * they share one entry here — the reason a failure always took both styles out
 * together while Rounded and Sharp, each its own family, carried on working.
 */
import { requestUrl } from "obsidian";
import type { MaterialIconStyle } from "../../types";
import { materialFontStore } from "../materialFontStore";

export type FontLoadResult = "ready" | "failed";

/**
 * `FontFaceSet` is `setlike` in the spec, but TypeScript's DOM lib models only
 * its query half — `add` and `delete` are missing from `lib.dom.d.ts`. Narrowed
 * here rather than cast through `any`, so the call stays type-checked; a realm
 * that genuinely lacks it throws, and `addFromCache` treats that as a miss.
 */
interface SetlikeFontFaceSet {
	add(font: FontFace): FontFaceSet;
}

/**
 * How long a failed family waits before the next unforced attempt.
 *
 * `CSSInjector.updateMaterialFontLinks` asks on every inject, and now that a
 * failure no longer sticks, without this a genuinely offline vault would retry
 * on each one. The Try again button passes `force` to skip the wait, because
 * that press *is* the user saying the connection changed.
 */
const FAILURE_COOLDOWN_MS = 60_000;

/** `requestUrl` has `DOWNLOAD_TIMEOUT_MS`; a `<link>` needs its own. */
const LINK_TIMEOUT_MS = 15_000;

/**
 * The variable font's URL inside the Google Fonts stylesheet.
 *
 * The quotes are optional because this reads `cssText`, not the bytes off the
 * wire: Google sends a bare `url(https://…)`, but serialising a rule back out
 * of the CSSOM quotes it. Matching only the wire form silently found nothing.
 */
const WOFF2_IN_CSS =
	/url\(["']?(https:\/\/fonts\.gstatic\.com\/[^)"']+?\.woff2)["']?\)/;

/** Per-document, keyed by family. Holds pending loads and successful ones. */
const loads = new WeakMap<Document, Map<string, Promise<FontLoadResult>>>();

/** When each family last failed, so the cooldown outlives the cleared memo. */
const failedAt = new Map<string, number>();

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
 * Whether this style's glyphs can be drawn right now.
 *
 * Cheap and synchronous, so the picker can re-check it after any await without
 * starting work — and it is the only honest answer, since a font can arrive or
 * (in a pop-out) never have arrived without this module being told.
 */
export function isMaterialFontReady(
	style: MaterialIconStyle,
	doc: Document = activeDocument,
): boolean {
	return isFamilyLoaded(doc, materialFontFamily(style));
}

/**
 * Make a style's glyphs drawable, from disk if it has been cached and from
 * Google otherwise. Never rejects — an unreachable font must not stop the user
 * browsing — but the outcome is returned so the caller can say so on screen.
 */
export function ensureMaterialFontLoaded(
	style: MaterialIconStyle,
	opts?: { force?: boolean; doc?: Document },
): Promise<FontLoadResult> {
	const family = materialFontFamily(style);
	// A caller with a surface to paint passes the document that surface is in.
	// Defaulting to `activeDocument` alone would put the <link> in whichever
	// window happens to have focus, which for a font added per document means
	// the grid asking for it could be left in the one that never got it.
	const doc = opts?.doc ?? activeDocument;

	// Already drawable in this document: nothing to do, whoever put it there.
	if (isFamilyLoaded(doc, family)) {
		return Promise.resolve<FontLoadResult>("ready");
	}

	const memo = memoFor(doc);
	const pending = memo.get(family);
	if (pending) return pending;

	const last = failedAt.get(family);
	if (
		!opts?.force &&
		last !== undefined &&
		Date.now() - last < FAILURE_COOLDOWN_MS
	) {
		return Promise.resolve<FontLoadResult>("failed");
	}

	const load = loadFamily(doc, family).then((result) => {
		if (result === "ready") {
			failedAt.delete(family);
		} else {
			// Drop the entry, not just the timestamp: keeping a resolved
			// "failed" promise memoized is exactly the bug this file exists to
			// prevent. The cooldown above is what stops the retry storm.
			failedAt.set(family, Date.now());
			memo.delete(family);
		}
		return result;
	});
	memo.set(family, load);
	return load;
}

async function loadFamily(
	doc: Document,
	family: string,
): Promise<FontLoadResult> {
	if (await addFromCache(doc, family)) return "ready";
	if (!(await loadViaLink(doc, family))) return "failed";
	// The grid is already painted; this only buys the next launch its offline
	// start, so it is deliberately not awaited.
	void cacheToDisk(doc, family);
	return "ready";
}

/**
 * Register a previously cached font. Zero network, and the whole reason the
 * reported bug cannot come back once a vault has loaded Material even once.
 */
async function addFromCache(doc: Document, family: string): Promise<boolean> {
	const store = materialFontStore();
	if (!store) return false;
	try {
		const bytes = await store.read(family);
		if (!bytes) return false;
		// The weight range spans the variable font's whole axis. Without it the
		// descriptor defaults to 400, and every other weight the toolbar offers
		// would be matched against a face that claims not to cover it.
		const face = new FontFace(family, bytes, {
			weight: "100 700",
			style: "normal",
		});
		await face.load();
		(doc.fonts as FontFaceSet & SetlikeFontFaceSet).add(face);
		return true;
	} catch (e) {
		console.warn(`[CalloutStudio] cached "${family}" webfont unusable`, e);
		return false;
	}
}

/**
 * The network path: a stylesheet `<link>`, resolved and then verified.
 *
 * A `<link>` rather than `requestUrl` is deliberate and load-bearing — the
 * browser sends its own Chrome user-agent, and Google returns the variable
 * woff2 carrying the FILL axis only to a browser. Fetching it ourselves yields
 * per-weight static TTFs that cannot render filled glyphs at all.
 */
function loadViaLink(doc: Document, family: string): Promise<boolean> {
	return new Promise<boolean>((resolve) => {
		let settled = false;
		let timer = 0;
		let created: HTMLLinkElement | null = null;

		const finish = (ok: boolean) => {
			if (settled) return;
			settled = true;
			window.clearTimeout(timer);
			// Leaving a link that produced no stylesheet is what let one failure
			// outlive the memo that recorded it.
			if (!ok) created?.remove();
			resolve(ok);
		};

		// The <link> firing `load` only means the CSS arrived; force the font
		// file itself to download, then confirm it can actually be drawn with.
		const verify = () =>
			doc.fonts
				.load(specimen(family))
				.then(() => finish(isFamilyLoaded(doc, family)))
				.catch(() => finish(false));

		// Any link already here for this family has failed us — `ensureMaterial
		// FontLoaded` returns early when the font is drawable, so getting this
		// far means it is not. Replacing them unconditionally is what keeps a
		// dud request from outliving the memo that recorded it, across the
		// plugin reloads that reset the memo but not `document.head`.
		//
		// Emphatically NOT decided by `link.sheet`: a link whose fetch failed
		// still exposes a non-null CSSStyleSheet whose `cssRules` throws
		// SecurityError (measured in Chrome), so "has a sheet" would have read
		// a dead link as live and skipped the retry entirely. The family names
		// are this module's own literals, so the selector needs no escaping.
		doc.head
			.querySelectorAll<HTMLLinkElement>(
				`link[data-cs-material-font="${family}"]`,
			)
			.forEach((stale) => stale.remove());

		// The bare global createEl is deliberate: document.createElement trips
		// obsidianmd/prefer-create-el, and a member doc.createEl("link") trips
		// obsidianmd/no-forbidden-elements. The global helper trips neither.
		const link = createEl("link");
		created = link;
		link.rel = "stylesheet";
		link.href = cssUrl(family);
		link.setAttribute("data-cs-material-font", family);
		link.onload = () => void verify();
		link.onerror = () => finish(false);
		timer = window.setTimeout(() => finish(false), LINK_TIMEOUT_MS);
		doc.head.appendChild(link);
	});
}

/**
 * Keep the bytes the browser just drew with, so later launches skip the network.
 *
 * Entirely best-effort: every failure here is silent, because the grid the user
 * is looking at has already been painted by the path above. All this can cost
 * is the next launch's head start.
 */
async function cacheToDisk(doc: Document, family: string): Promise<void> {
	const store = materialFontStore();
	if (!store || (await store.has(family))) return;
	try {
		const url = await resolveWoff2Url(doc, family);
		if (!url) return;
		// The font file is a plain static asset — unlike the stylesheet naming
		// it, nothing about the caller changes what comes back — so the actual
		// megabyte goes through the sanctioned API.
		const response = await requestUrl({ url });
		await store.write(family, response.arrayBuffer);
	} catch (e) {
		console.warn(`[CalloutStudio] could not cache the "${family}" webfont`, e);
	}
}

/**
 * The woff2 the browser is drawing with, read out of the stylesheet's own rules.
 *
 * `requestUrl` cannot stand in for this: Google picks the file format from the
 * user-agent, and answers anything that is not a browser with a list of
 * per-weight static TTFs that cannot draw a filled glyph at all — the same fact
 * the `<link>` in `loadViaLink` exists for. So the URL is read from CSS the
 * browser itself fetched.
 *
 * A *second* `<link>` rather than the one the grid is using, because reading
 * `sheet.cssRules` across origins is only allowed when the request was made in
 * CORS mode, and putting `crossorigin` on the load the whole grid depends on
 * would stake it on a header for the sake of a cache that is meant to be pure
 * upside. Google serves the stylesheet with `Access-Control-Allow-Origin: *`,
 * so this copy succeeds; if it ever stops, caching is skipped and nothing the
 * user can see changes.
 *
 * `media="not all"` keeps it a reader rather than a provider: the file is still
 * fetched (from the cache the first link just filled) and still parsed into
 * `cssRules`, but its `@font-face` never applies — so removing it below cannot
 * pull the font out from under the grid.
 */
function resolveWoff2Url(
	doc: Document,
	family: string,
): Promise<string | undefined> {
	return new Promise<string | undefined>((resolve) => {
		let timer = 0;
		// The bare global createEl is deliberate, for the reason given in
		// loadViaLink.
		const link = createEl("link");

		const finish = (url?: string) => {
			window.clearTimeout(timer);
			link.remove();
			resolve(url);
		};

		link.rel = "stylesheet";
		link.href = cssUrl(family);
		link.media = "not all";
		link.crossOrigin = "anonymous";
		link.onload = () => {
			try {
				const css = Array.from(link.sheet?.cssRules ?? [])
					.map((rule) => rule.cssText)
					.join("");
				finish(WOFF2_IN_CSS.exec(css)?.[1]);
			} catch {
				// The read was refused after all. The grid is already painted;
				// only the offline cache goes without.
				finish();
			}
		};
		link.onerror = () => finish();
		timer = window.setTimeout(() => finish(), LINK_TIMEOUT_MS);
		doc.head.appendChild(link);
	});
}

function memoFor(doc: Document): Map<string, Promise<FontLoadResult>> {
	const existing = loads.get(doc);
	if (existing) return existing;
	const created = new Map<string, Promise<FontLoadResult>>();
	loads.set(doc, created);
	return created;
}

/** The font shorthand `fonts.load`/`fonts.check` are asked about. */
function specimen(family: string): string {
	return `24px "${family}"`;
}

function cssUrl(family: string): string {
	return (
		`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}` +
		`:opsz,wght,FILL,GRAD@24,100..700,0..1,0`
	);
}

/**
 * Whether a face for this family is registered *and* has finished loading.
 *
 * Deliberately **not** `doc.fonts.check()`, which cannot answer this question.
 * `check` reports whether any face *matching* the request is still unloaded, so
 * a family with no face at all — precisely the failure this module exists to
 * detect — comes back `true`. Measured in Chrome: with an empty font set,
 * `check('24px "Material Symbols Outlined"')` is `true`; it only begins telling
 * the truth once a stylesheet has registered a face, which is the one case
 * where the answer was never in doubt. Trusting it would have made every check
 * here report success exactly when the font was missing.
 *
 * Scanning the set is unambiguous in all four states: nothing registered, still
 * downloading, loaded, and errored.
 */
function isFamilyLoaded(doc: Document, family: string): boolean {
	let loaded = false;
	try {
		doc.fonts.forEach((face) => {
			// Chrome serialises `family` unquoted, but the spec permits the
			// quoted form, so both are accepted.
			if (
				face.family.replace(/^["']|["']$/g, "") === family &&
				face.status === "loaded"
			) {
				loaded = true;
			}
		});
	} catch {
		// No usable FontFaceSet in this render realm.
		return false;
	}
	return loaded;
}
