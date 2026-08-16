/**
 * tests/repoSourceRules.test.ts — the rules CLAUDE.md states about how `src/`
 * is written, turned into something that fails.
 *
 * A convention in a document is a convention until something checks it. Each
 * suite below is one of those documented rules, and each is here because
 * breaking it is invisible in review and expensive afterwards:
 *
 * - **No hardcoded UI copy** — a string that skipped `t()` is not a bug in
 *   English, which is the only language a reviewer reads. It shows up as one
 *   untranslated label in 31 other languages, and the download-on-demand locale
 *   pipeline cannot fix it after the fact.
 * - **Listeners are unregistered** — Obsidian keeps the plugin object across a
 *   disable/enable cycle within a session. A workspace listener that is never
 *   released fires twice after one reload, four times after two, and the
 *   symptom (a duplicated re-render, a doubled notice) never points at the
 *   listener.
 * - **No `any`** — the codebase has *none* today; this is the ratchet that
 *   keeps that true. `npm run lint` enforces the same thing, and better, since
 *   it has type information — but lint is a separate command, and this one is
 *   in `npm test`.
 * - **`main.ts` stays wiring** — the file every future feature is tempted to
 *   put "just one more thing" into.
 * - **No new network calls** — the plugin's privacy claim is a *closed list* of
 *   four call sites, disclosed in the README. The claim is only worth anything
 *   if adding a fifth is hard to do by accident.
 * - **Files split by responsibility** — a ratchet rather than a rule, because
 *   40 files are already over the stated 300-line line. Freezing them at
 *   today's size is what makes the number mean something: nothing new joins the
 *   list, and nothing on it grows.
 *
 * All six read the source as text, through `tests/support/sourceScan.ts`, which
 * blanks comments and string bodies first. That is not a detail — every one of
 * these checks has an obvious grep-shaped version, and every grep-shaped version
 * is wrong. `src/utils/iconAdjust.ts` has a local variable called `any`;
 * `src/manager/CalloutRegistry.ts` has a comment beginning "Migration: any
 * callout…"; four more files say "has anything" in prose. A grep for `any`
 * finds five hits in `src/` and all five are false. The scanner finds zero,
 * which is the truth.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import {
	allSourceFiles,
	argSpan,
	at,
	lineOf,
	literals,
	pluginSourceFiles,
	report,
	scanIsBalanced,
	type SourceFile,
} from "./support/sourceScan";

const files = pluginSourceFiles();

/**
 * Lines in a file, counted the way `wc -l` counts them.
 *
 * A trailing newline is a terminator, not an empty last line, and every number
 * frozen below was read off `wc -l`. Getting this wrong is an off-by-one on all
 * 40 entries at once — which is exactly how it first ran.
 */
function lineCount(file: SourceFile): number {
	return file.text.replace(/\n$/, "").split("\n").length;
}

/* -------------------------------------------------------------------------- */
/* The scanner itself                                                         */
/* -------------------------------------------------------------------------- */

describe("the source scanner is sound", () => {
	// Everything below is only as trustworthy as this. A scanner that loses its
	// place mid-file blanks the remainder as string body — and a check that
	// sees an empty file passes. So the failure mode is silence, and these
	// three assertions are what turn it into noise.

	it("found the source tree", () => {
		assert.ok(
			files.length > 100,
			`only ${files.length} source files found — the walk is looking in the wrong place`,
		);
	});

	it("finishes every file in a code state", () => {
		const unbalanced = files.filter((f) => !scanIsBalanced(f.text));
		assert.deepStrictEqual(
			unbalanced.map((f) => f.path),
			[],
			"the scanner ended one of these files inside a string or template, which means it silently blanked real code",
		);
	});

	it("keeps offsets and line numbers intact", () => {
		for (const f of files) {
			assert.strictEqual(f.code.length, f.text.length, `${f.path}: length drift`);
			assert.strictEqual(
				(f.code.match(/\n/g) ?? []).length,
				(f.text.match(/\n/g) ?? []).length,
				`${f.path}: newline drift`,
			);
		}
	});
});

/* -------------------------------------------------------------------------- */
/* 153 — every user-facing string goes through t()                            */
/* -------------------------------------------------------------------------- */

describe("no hardcoded UI copy", () => {
	/**
	 * The setters that put text on screen.
	 *
	 * `setIcon`, `setClass`, `setValue` and friends are deliberately absent:
	 * they take identifiers, not prose. `setAttribute` is absent for the same
	 * reason, with one exception handled below.
	 */
	const TEXT_SETTERS = [
		"setName",
		"setDesc",
		"setText",
		"setTitle",
		"setTooltip",
		"setButtonText",
		"setPlaceholder",
	] as const;

	/**
	 * A literal that could be prose: two or more consecutive letters somewhere.
	 *
	 * `setDesc("")` clears a description and is not copy. `setText("×")`,
	 * `setText(":")` and `setText("1")` are glyphs and separators. Requiring two
	 * letters is what separates those from a sentence without needing a
	 * dictionary.
	 */
	const LOOKS_LIKE_PROSE = /[A-Za-z]{2}/;

	/**
	 * Argument text that already routes through the translator.
	 *
	 * Matching `t(` anywhere in the argument span — rather than requiring the
	 * call to *start* with it — is deliberate, because the real code does all
	 * three of these:
	 *
	 *     .setDesc(this.isBuiltIn ? t("a") : t("b"))
	 *     .setTitle(`${t("a")} — ${t("b")}`)
	 *     .setName(label)                              // label came from t()
	 *
	 * The last one is invisible to any check that does not follow the variable,
	 * so the rule is narrowed honestly: this suite catches a *literal* that
	 * never met the translator, which is the mistake that actually happens.
	 */
	const TRANSLATED = /\bt\s*\(/;

	function violations(): string[] {
		const out: string[] = [];
		for (const f of files) {
			for (const setter of TEXT_SETTERS) {
				const re = new RegExp(`\\.${setter}\\s*\\(`, "g");
				for (const m of f.code.matchAll(re)) {
					const index = m.index ?? 0;
					const span = argSpan(f.code, index + m[0].length - 1);
					if (!span) continue;
					const raw = f.text.slice(span.start, span.end);
					if (TRANSLATED.test(raw)) continue;
					const prose = literals(raw).filter((l) =>
						LOOKS_LIKE_PROSE.test(l.value),
					);
					if (prose.length === 0) continue;
					out.push(
						`${at(f, index)}  .${setter}(${JSON.stringify(prose[0]?.value ?? "")}…)`,
					);
				}
			}
		}
		return out;
	}

	it("no text setter is handed a bare English literal", () => {
		const bad = violations();
		assert.deepStrictEqual(
			bad,
			[],
			report(
				"These strings would stay English in all 31 other locales. Add a key to src/i18n/en.ts and call t():",
				bad,
			),
		);
	});

	it("no Notice is raised with a bare literal", () => {
		// A Notice is the loudest untranslated surface there is — it is the only
		// UI that appears without the user opening anything.
		const bad: string[] = [];
		for (const f of files) {
			for (const m of f.code.matchAll(/new\s+Notice\s*\(/g)) {
				const index = m.index ?? 0;
				const span = argSpan(f.code, index + m[0].length - 1);
				if (!span) continue;
				const raw = f.text.slice(span.start, span.end);
				if (TRANSLATED.test(raw)) continue;
				const prose = literals(raw).filter((l) => LOOKS_LIKE_PROSE.test(l.value));
				if (prose.length > 0) bad.push(`${at(f, index)}  ${prose[0]?.value ?? ""}`);
			}
		}
		assert.deepStrictEqual(bad, [], report("Untranslated Notice text:", bad));
	});

	it("aria-labels go through t() too", () => {
		// An aria-label is the only text a screen-reader user gets, so leaving
		// it in English is worse than leaving a visible label in English, not
		// better. It is set through setAttribute, which is why the generic
		// setter list above cannot see it.
		const bad: string[] = [];
		for (const f of files) {
			for (const m of f.code.matchAll(
				/setAttribute\s*\(\s*["'](aria-label|title|placeholder)["']\s*,/g,
			)) {
				const index = m.index ?? 0;
				const span = argSpan(f.code, f.code.indexOf("(", index));
				if (!span) continue;
				const raw = f.text.slice(span.start, span.end);
				if (TRANSLATED.test(raw)) continue;
				// Drop the attribute name itself before looking for prose.
				const value = raw.slice(raw.indexOf(",") + 1);
				const prose = literals(value).filter((l) =>
					LOOKS_LIKE_PROSE.test(l.value),
				);
				if (prose.length > 0) {
					bad.push(`${at(f, index)}  ${m[1]}="${prose[0]?.value ?? ""}"`);
				}
			}
		}
		assert.deepStrictEqual(bad, [], report("Untranslated attribute text:", bad));
	});
});

/* -------------------------------------------------------------------------- */
/* 154 — nothing is left listening                                            */
/* -------------------------------------------------------------------------- */

describe("every listener is released", () => {
	/**
	 * Obsidian's own emitters. Each `.on()` hands back an `EventRef` that stays
	 * live until something gives it back.
	 */
	const EMITTER_ON =
		/\b(workspace|vault|metadataCache)\s*\.\s*on\s*\(/g;

	it("every workspace/vault/metadataCache listener is registered or offref'd", () => {
		const bad: string[] = [];
		for (const f of files) {
			// Any identifier this file ever hands to `offref`. Collected once
			// per file rather than per call site, because the release usually
			// happens in a different method (`hide()`, a disposer) far below.
			const released = new Set<string>();
			for (const m of f.code.matchAll(/offref\s*\(\s*([\w$.]+)\s*\)/g)) {
				released.add((m[1] as string).replace(/^this\./, ""));
			}
			for (const m of f.code.matchAll(EMITTER_ON)) {
				const index = m.index ?? 0;
				const before = f.code.slice(Math.max(0, index - 300), index);
				// `registerEvent(` with nothing but whitespace, an opening
				// paren or `this.` between it and the call — i.e. the call is
				// the argument, not merely somewhere above it.
				if (/registerEvent\s*\(\s*[\w$.]*$/.test(before)) continue;
				// Otherwise: `const ref = …` / `this.ref = …`, and that name
				// must reach offref somewhere in the file. The trailing
				// `[\w$.]*` is the receiver between the `=` and the match —
				// `this.cssChangeRef = this.app.workspace.on(…)` puts
				// `this.app.` there, and without it every real site looks
				// unassigned.
				const assign =
					/(?:const|let|var)\s+([\w$]+)\s*(?::[^=]*)?=\s*[\w$.]*$|([\w$.]+)\s*=\s*[\w$.]*$/.exec(
						before,
					);
				const name = (assign?.[1] ?? assign?.[2] ?? "").replace(/^this\./, "");
				if (name && released.has(name)) continue;
				bad.push(
					`${at(f, index)}  ${m[1]}.on(…)${name ? ` → ${name}` : ""}`,
				);
			}
		}
		assert.deepStrictEqual(
			bad,
			[],
			report(
				"These listeners outlive their owner. Wrap the call in this.registerEvent(…), or keep the EventRef and pass it to app.workspace.offref() when the owner goes away:",
				bad,
			),
		);
	});

	it("nothing listens on a document or window without taking it back", () => {
		// A listener on an element the owner created dies with that element, so
		// `addEventListener` on modal DOM is fine and is what the settings UI
		// does everywhere. A listener on the *document* does not: it survives
		// the modal, the note and the workspace leaf. Those are the ones that
		// have to be undone by hand — `registerDomEvent` is unavailable to a
		// Modal, which is not a Component.
		const GLOBAL_HOST = /^(document|window|activeDocument|activeWindow|globalThis|ownerDoc|ownerWin|body)$/;
		const bad: string[] = [];
		for (const f of files) {
			// Every handler expression this file hands to removeEventListener.
			const removed = f.code.matchAll(/removeEventListener\s*\(/g);
			const removedText: string[] = [];
			for (const m of removed) {
				const span = argSpan(f.code, (m.index ?? 0) + m[0].length - 1);
				if (span) removedText.push(f.code.slice(span.start, span.end));
			}
			for (const m of f.code.matchAll(
				/\b([\w$]+(?:\.[\w$]+)*)\.addEventListener\s*\(/g,
			)) {
				const index = m.index ?? 0;
				const host = (m[1] as string).split(".").pop() ?? "";
				if (!GLOBAL_HOST.test(host)) continue;
				const before = f.code.slice(Math.max(0, index - 120), index);
				if (/registerDomEvent\s*\(\s*$/.test(before)) continue;
				const span = argSpan(f.code, index + m[0].length - 1);
				const args = span ? f.code.slice(span.start, span.end) : "";
				// The handler is the second argument; compare it by text.
				const handler = args.slice(args.indexOf(",") + 1).trim();
				if (handler && removedText.some((r) => r.includes(handler))) continue;
				bad.push(`${at(f, index)}  ${m[1]}.addEventListener(${args.slice(0, 60)})`);
			}
		}
		assert.deepStrictEqual(
			bad,
			[],
			report(
				"These attach to a document or window and never detach. Use plugin.registerDomEvent(), or call removeEventListener with the same handler on teardown:",
				bad,
			),
		);
	});

	it("no interval runs outside registerInterval", () => {
		// `registerInterval` is the only form that survives an unload, and an
		// interval that does not is a timer firing against a torn-down plugin
		// for the rest of the session.
		const bad: string[] = [];
		for (const f of files) {
			for (const m of f.code.matchAll(/\bsetInterval\s*\(/g)) {
				const index = m.index ?? 0;
				const before = f.code.slice(Math.max(0, index - 60), index);
				if (/registerInterval\s*\(\s*(?:window\.)?$/.test(before)) continue;
				bad.push(at(f, index));
			}
		}
		assert.deepStrictEqual(
			bad,
			[],
			report("Wrap these in this.registerInterval(window.setInterval(…)):", bad),
		);
	});
});

/* -------------------------------------------------------------------------- */
/* 155 — no `any`                                                             */
/* -------------------------------------------------------------------------- */

describe("no `any` without an explicit exemption", () => {
	/**
	 * `any` in type position, in each of the six shapes it can take.
	 *
	 * Matched against blanked code, so prose and identifiers are already gone —
	 * but the shapes still matter, because `let any = false` in
	 * `src/utils/iconAdjust.ts` is a real, legitimate local variable and a bare
	 * `\bany\b` would flag it.
	 */
	const ANY_IN_TYPE_POSITION = [
		/:\s*any\b/g, // annotation
		/\bas\s+any\b/g, // assertion
		/<\s*any\s*[,>]/g, // type argument
		/\bany\s*\[\s*\]/g, // array
		/[|&]\s*any\b/g, // union / intersection member
		/=>\s*any\b/g, // return type
	];

	it("src/ contains no `any` that is not explicitly disabled", () => {
		const bad: string[] = [];
		for (const f of files) {
			const lines = f.text.split("\n");
			for (const re of ANY_IN_TYPE_POSITION) {
				for (const m of f.code.matchAll(re)) {
					const line = lineOf(f.text, m.index ?? 0);
					// The disable comment is a comment, so it lives in `text`,
					// not in `code`. It may sit on the line itself or the one
					// above (eslint-disable-next-line).
					const context = `${lines[line - 2] ?? ""}\n${lines[line - 1] ?? ""}`;
					if (/eslint-disable[\w-]*\s+.*no-explicit-any/.test(context)) continue;
					bad.push(`${f.path}:${line}  ${m[0].trim()}`);
				}
			}
		}
		assert.deepStrictEqual(
			bad,
			[],
			report(
				"TypeScript strict mode is the point of this codebase. If one of these is genuinely unavoidable, narrow it to `unknown` or write the eslint-disable comment and say why:",
				bad,
			),
		);
	});
});

/* -------------------------------------------------------------------------- */
/* 156 — main.ts stays wiring                                                 */
/* -------------------------------------------------------------------------- */

describe("main.ts stays lifecycle and wiring", () => {
	/**
	 * The ceiling, set just above today's 556 lines.
	 *
	 * Deliberately tight rather than generous: the value of this number is that
	 * it is reached, noticed, and answered by moving something out — not by
	 * being raised. `main.ts` is where every feature's `onload` wiring wants to
	 * live, and it is the one file whose growth nothing else would flag.
	 */
	const MAIN_TS_MAX_LINES = 600;

	const main = files.find((f) => f.path === "src/main.ts");

	it("exists", () => {
		assert.ok(main, "src/main.ts not found");
	});

	it(`is at most ${MAIN_TS_MAX_LINES} lines`, () => {
		const lines = lineCount(main as SourceFile);
		assert.ok(
			lines <= MAIN_TS_MAX_LINES,
			`src/main.ts is ${lines} lines (ceiling ${MAIN_TS_MAX_LINES}). ` +
				"Move the logic into a sub-module rather than raising this.",
		);
	});
});

/* -------------------------------------------------------------------------- */
/* 158 — the network surface is closed                                        */
/* -------------------------------------------------------------------------- */

describe("the network surface is exactly what the README discloses", () => {
	/**
	 * Every file allowed to reach the network, and what it is for.
	 *
	 * This is the *implementation* of the README's "Network usage and privacy"
	 * section, and the list is shorter than it looks: two of the four are the
	 * same feature. Note that the fetching for Material Symbols lives in
	 * `icons/packs/`, not in `IconFetchManager` — the manager owns the queue and
	 * the cache, and the pack owns the request.
	 */
	const ALLOWED_REQUEST_URL: Record<string, string> = {
		"src/icons/PackDataStore.ts":
			"whole icon packs, SHA-256 verified against packManifest.ts",
		"src/icons/packs/material.ts":
			"one Material Symbols drawing, on demand from the picker",
		"src/icons/packs/materialFont.ts":
			"the Material Symbols webfont, for the picker grid",
		"src/i18n/LocaleStore.ts":
			"the user's UI language — the one background fetch, argued for in CLAUDE.md",
	};

	it("only the disclosed files call requestUrl", () => {
		// `allSourceFiles`, not `files`: the i18n tree is excluded from the
		// *text* rules above because it is 32 tables of translated prose, but
		// `LocaleStore.ts` lives there and is one of the four callers. Scanning
		// the narrowed list would have quietly dropped it from the allowlist.
		const callers = allSourceFiles()
			.filter((f) => /\brequestUrl\s*\(/.test(f.code))
			.map((f) => f.path)
			.sort();
		assert.deepStrictEqual(
			callers,
			Object.keys(ALLOWED_REQUEST_URL).sort(),
			"the set of files that reach the network changed. Every addition needs a line in the README's 'Network usage and privacy' section and an entry here — and per CLAUDE.md, must be triggered by an explicit user action with an offline fallback.",
		);
	});

	it("nothing uses a network primitive that bypasses requestUrl", () => {
		// `requestUrl` is Obsidian's own, which means it is subject to the
		// user's proxy settings and is the API reviewers look for. `fetch` and
		// XHR are not, and would also break CORS on mobile.
		const BANNED = [
			/\bfetch\s*\(/g,
			/\bXMLHttpRequest\b/g,
			/\bWebSocket\b/g,
			/\bEventSource\b/g,
			/navigator\s*\.\s*sendBeacon\b/g,
			/\bnavigator\s*\.\s*serviceWorker\b/g,
		];
		const bad: string[] = [];
		for (const f of allSourceFiles()) {
			for (const re of BANNED) {
				for (const m of f.code.matchAll(re)) {
					bad.push(`${at(f, m.index ?? 0)}  ${m[0]}`);
				}
			}
		}
		assert.deepStrictEqual(
			bad,
			[],
			report("Use Obsidian's requestUrl instead:", bad),
		);
	});

	it("nothing evaluates remote code", () => {
		// The developer policy that has no exceptions. `<link>` to a webfont is
		// the one remote *resource* the plugin loads, and a stylesheet cannot
		// execute; a remote script or an eval could.
		const bad: string[] = [];
		for (const f of allSourceFiles()) {
			for (const m of f.code.matchAll(
				/\beval\s*\(|new\s+Function\s*\(|createEl\s*\(\s*["']script["']/g,
			)) {
				bad.push(`${at(f, m.index ?? 0)}  ${m[0]}`);
			}
		}
		assert.deepStrictEqual(bad, [], report("Remote/dynamic code execution:", bad));
	});

	it("every remote host in the source is one of the disclosed four", () => {
		// The call sites are checked above; this checks where they point.
		// Hosts that only ever appear in a link the *user* clicks (the repo,
		// the docs) are here too, because an `<a href>` is not a request the
		// plugin makes — but a typo'd CDN host would be.
		const ALLOWED_HOSTS = new Set([
			// Not a request at all: the SVG XML namespace, written into every
			// piece of markup this plugin builds. It is a name, and nothing
			// ever resolves it.
			"www.w3.org",
			"cdn.jsdelivr.net", // icon packs and locale files
			"raw.githubusercontent.com", // their fallback
			"fonts.gstatic.com", // Material Symbols artwork and webfont
			"fonts.googleapis.com", // the webfont's stylesheet
			"github.com", // user-clicked links only
			"docs.obsidian.md",
			"obsidian.md",
			"www.gnu.org", // licence links in the credits
			"www.apache.org",
			"opensource.org",
			"creativecommons.org",
			"scripts.sil.org",
			"fontawesome.com",
			"tabler.io",
			"primer.style",
			"nagoshiashumari.github.io",
			"fonts.google.com",
			"lucide.dev",
			"buymeacoffee.com",
			"ko-fi.com",
			"www.paypal.com",
		]);
		const seen = new Map<string, string>();
		for (const f of allSourceFiles()) {
			for (const lit of literals(f.text)) {
				for (const m of lit.value.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)) {
					const host = m[1] as string;
					if (!seen.has(host)) seen.set(host, at(f, lit.start));
				}
			}
		}
		const unknown = [...seen.entries()]
			.filter(([host]) => !ALLOWED_HOSTS.has(host))
			.map(([host, where]) => `${host}  (${where})`);
		assert.deepStrictEqual(
			unknown,
			[],
			report(
				"A host appears in src/ that is not on the disclosed list. If the plugin requests it, disclose it in the README; if a user clicks it, add it here:",
				unknown,
			),
		);
	});
});

/* -------------------------------------------------------------------------- */
/* 160 — file size ratchet                                                    */
/* -------------------------------------------------------------------------- */

describe("no new oversized files", () => {
	/**
	 * The files already over CLAUDE.md's ~300-line line, frozen at the size
	 * they were when this test was written.
	 *
	 * This is a ratchet, not a rule, and saying so plainly matters: 40 files are
	 * already over, the three largest are ten times over, and a test that
	 * demanded 300 lines today would simply be deleted. What it *can* enforce is
	 * the direction of travel — a 41st file cannot join quietly, and none of
	 * these 40 can grow. Splitting one is expected to *lower* its entry here,
	 * which the last assertion insists on so the list cannot rot into a
	 * permanently generous allowance.
	 *
	 * `src/i18n/`, `src/icons/data/` and `src/data/` are out of scope entirely
	 * (see `sourceScan.ts`): they are tables and generated indexes, where line
	 * count measures how many icons exist, not how much a file is doing.
	 */
	const SOFT_LIMIT = 300;

	const FROZEN: Record<string, number> = {
		"src/settings/CalloutEditor.ts": 2328,
		"src/manager/CSSInjector.ts": 2253,
		"src/manager/CalloutRegistry.ts": 2103,
		"src/utils/importValidator.ts": 1249,
		"src/settings/PaletteEditorModal.ts": 1106,
		"src/editor/calloutTokens.ts": 840,
		"src/types.ts": 794,
		"src/editor/livepreview/widgets.ts": 794,
		"src/reading/calloutPostProcessor.ts": 782,
		"src/settings/iconpicker/PackPanel.ts": 736,
		"src/utils/colorUtils.ts": 727,
		"src/settings/iconpicker/IconPickerModal.ts": 681,
		"src/editor/livepreview/calloutViewPlugin.ts": 676,
		"src/utils/colorPalettes.ts": 666,
		"src/editor/CalloutBlockTools.ts": 666,
		"src/utils/vaultCalloutScanner.ts": 658,
		"src/editor/AutoComplete.ts": 596,
		"src/main.ts": 556,
		"src/icons/renderIcon.ts": 547,
		"src/settings/GlobalStyleModal.ts": 528,
		"src/editor/renderShared.ts": 498,
		"src/manager/CalloutDiscovery.ts": 467,
		"src/editor/contextmenu/resolve.ts": 455,
		"src/ui/TagInput.ts": 414,
		"src/settings/editor/CalloutEditorSave.ts": 410,
		"src/icons/isolateSvg.ts": 402,
		"src/icons/packs/materialFont.ts": 398,
		"src/settings/sections/CalloutRowActions.ts": 396,
		"src/outline/OutlineDecorator.ts": 382,
		"src/constants.ts": 379,
		"src/settings/EmbeddableMarkdownEditor.ts": 377,
		"src/icons/svg.ts": 367,
		"src/settings/iconpicker/ImagePanel.ts": 354,
		"src/settings/sections/DataManagementSection.ts": 335,
		"src/settings/CommandBuilderModal.ts": 345,
		"src/settings/iconpicker/IconGrid.ts": 343,
		"src/utils/calloutManagerImport.ts": 340,
		"src/icons/PackDataStore.ts": 309,
		"src/settings/CommandEditorModal.ts": 308,
		"src/settings/sections/CustomPalettesSection.ts": 301,
	};

	it("nothing new crosses the 300-line line", () => {
		const newcomers = files
			.filter((f) => lineCount(f) > SOFT_LIMIT && FROZEN[f.path] === undefined)
			.map((f) => `${f.path}  (${lineCount(f)} lines)`);
		assert.deepStrictEqual(
			newcomers,
			[],
			report(
				`These files passed ${SOFT_LIMIT} lines. Split by responsibility, or — if the file genuinely is one responsibility — add it to FROZEN with a note:`,
				newcomers,
			),
		);
	});

	it("none of the known-oversized files has grown", () => {
		const grown: string[] = [];
		for (const [path, frozen] of Object.entries(FROZEN)) {
			const f = files.find((x) => x.path === path);
			if (!f) continue; // handled by the staleness check below
			const now = lineCount(f);
			if (now > frozen) grown.push(`${path}  ${frozen} → ${now} (+${now - frozen})`);
		}
		assert.deepStrictEqual(
			grown,
			[],
			report(
				"An already-oversized file grew. Put the new code in a sibling module instead of raising these numbers:",
				grown,
			),
		);
	});

	it("the frozen list has no stale entries", () => {
		// Two kinds of rot, both of which quietly turn the ratchet into a
		// rubber band: a file that was split (so its entry now permits growth
		// it no longer needs) and a file that was deleted or renamed.
		const stale: string[] = [];
		for (const [path, frozen] of Object.entries(FROZEN)) {
			const f = files.find((x) => x.path === path);
			if (!f) {
				stale.push(`${path}  — gone; remove the entry`);
				continue;
			}
			const now = lineCount(f);
			if (now <= SOFT_LIMIT) {
				stale.push(`${path}  — now ${now} lines; remove the entry`);
			} else if (now < frozen) {
				stale.push(`${path}  — now ${now} lines; lower the entry from ${frozen}`);
			}
		}
		assert.deepStrictEqual(
			stale,
			[],
			report("Tighten the ratchet — these entries are looser than the truth:", stale),
		);
	});
});
