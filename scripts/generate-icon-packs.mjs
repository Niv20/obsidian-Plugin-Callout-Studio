/**
 * scripts/generate-icon-packs.mjs — Builds the icon-pack data from upstream npm packages.
 *
 * Run with `npm run icons:generate` (optionally `-- --pack=octicons`). Never
 * part of `npm run build`: CI stays hermetic, and the generated artefacts are
 * committed so a normal build needs neither these devDependencies nor a network.
 *
 * Two artefacts per pack:
 *
 * - `src/icons/data/<id>.index.ts` — names, keywords and categories, packed by
 *   scripts/lib/encodeIndex.mjs. Bundled into main.js so search works offline
 *   from the first launch.
 * - `packs/<id>.json` — the path data, downloaded on demand and cached to disk.
 *   Committed here and served from jsDelivr at a pinned tag.
 *
 * Path data is stored as bare `d` strings, never markup, and every one is
 * validated against a path grammar at build time and again at load time. That
 * is what lets the runtime skip SVG sanitization for these packs entirely:
 * there is no element or attribute in the file that could carry a payload.
 */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeIndex, encodedIndexLiteral } from "./lib/encodeIndex.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACK_DIR = join(ROOT, "packs");
const DATA_DIR = join(ROOT, "src", "icons", "data");

/** The on-disk pack format. Bumping this invalidates every cached pack file. */
const PACK_FORMAT = 1;

/**
 * Legal SVG path-data characters. Anything outside this set means the upstream
 * package changed shape, and the build should stop rather than ship it.
 */
const PATH_DATA_RE = /^[MmLlHhVvCcSsQqTtAaZz0-9eE+\-.,\s]+$/;

function assertPathData(d, where) {
	if (typeof d !== "string" || d.length === 0 || !PATH_DATA_RE.test(d)) {
		throw new Error(`invalid path data at ${where}: ${JSON.stringify(d)?.slice(0, 120)}`);
	}
}

// ── Octicons ────────────────────────────────────────────────────────────

/**
 * Heights worth shipping. Octicons draws 16px and 24px art for almost
 * everything; 12px exists for nine icons and 48/96 for one. An icon that has
 * none of the preferred heights keeps whatever it does have, so every icon
 * stays renderable (`no-entry-fill` is 12-only, `copilot` is 48/96-only).
 */
const OCTICON_PREFERRED_HEIGHTS = [12, 16, 24];

/**
 * Pull the `<path>` elements out of one Octicon variant.
 *
 * Upstream stores inner markup rather than structured data, and 203 of the 741
 * variants hold more than one path. `fill-rule="evenodd"` (and its `clip-rule`
 * twin) must survive: dropping it fills the holes in donut-shaped icons like
 * `issue-opened` solid — including through a CSS mask, which reads alpha.
 */
function parseOcticonPaths(markup, where) {
	const paths = [];
	const elementRe = /<path\b([^>]*)>/g;
	let match;
	while ((match = elementRe.exec(markup)) !== null) {
		const attrs = match[1];
		const d = /\bd="([^"]*)"/.exec(attrs)?.[1];
		assertPathData(d, where);
		const path = { d };
		if (/\bfill-rule="evenodd"/.test(attrs)) path.r = 1;
		if (/\bclip-rule="evenodd"/.test(attrs)) path.c = 1;
		paths.push(path);
	}
	if (paths.length === 0) throw new Error(`no <path> found at ${where}`);

	// Anything other than <path> would be silently dropped above, which would
	// render a wrong icon rather than fail. Catch it here instead.
	const elements = [...markup.matchAll(/<([a-zA-Z-]+)/g)].map((m) => m[1]);
	const unexpected = elements.filter((e) => e !== "path");
	if (unexpected.length > 0) {
		throw new Error(`unexpected elements at ${where}: ${unexpected.join(", ")}`);
	}
	return paths;
}

function buildOcticons() {
	const data = JSON.parse(
		readFileSync(
			join(ROOT, "node_modules/@primer/octicons/build/data.json"),
			"utf8",
		),
	);
	const version = JSON.parse(
		readFileSync(join(ROOT, "node_modules/@primer/octicons/package.json"), "utf8"),
	).version;

	const icons = {};
	const entries = [];

	for (const name of Object.keys(data).sort()) {
		const record = data[name];
		const available = Object.keys(record.heights).map(Number);
		const wanted = available.filter((h) => OCTICON_PREFERRED_HEIGHTS.includes(h));
		const heights = wanted.length > 0 ? wanted : available;

		const sizes = {};
		for (const height of heights.sort((a, b) => a - b)) {
			const variant = record.heights[String(height)];
			sizes[height] = {
				w: variant.width,
				p: parseOcticonPaths(variant.path, `octicons/${name}@${height}`),
			};
		}
		icons[name] = sizes;

		entries.push({
			name,
			categories: [], // Octicons has no taxonomy upstream.
			keywords: record.keywords ?? [],
		});
	}

	return {
		id: "octicons",
		version,
		file: { icons },
		entries,
		// Names are the only reliable search term for the 160 icons with no
		// upstream keywords, and they are already descriptive ("git-branch").
		note: `${entries.length} icons`,
	};
}

// ── Font Awesome Free ───────────────────────────────────────────────────

const FA_DIR = join(ROOT, "node_modules/@fortawesome/fontawesome-free");

/**
 * Font Awesome's icons are all 512 units tall but vary in width, so the height
 * is the size key and the width rides along — the same shape every other pack
 * uses, where the viewBox is `0 0 {w} {key}`.
 */
const FA_HEIGHT = "512";

/**
 * Read one Font Awesome SVG.
 *
 * These are single-path files with the colour already set to `currentColor`,
 * which is dropped: the plugin applies its own fill so the icon tracks the
 * callout's colour on screen and carries a baked one into PDF export.
 *
 * Note this discards the `<!--! Font Awesome Free ... -->` attribution comment
 * embedded in every file. That is what moves us off Font Awesome's "the files
 * already carry sufficient attribution" footing and onto plain CC BY 4.0, which
 * the credits surfaces and THIRD-PARTY-NOTICES.md satisfy explicitly.
 */
function readFontAwesomeSvg(style, name) {
	const where = `fa-${style}/${name}`;
	const raw = readFileSync(join(FA_DIR, "svgs", style, `${name}.svg`), "utf8");
	const body = raw.replace(/<!--[\s\S]*?-->/g, "");

	const viewBox = /viewBox="0 0 (\d+) 512"/.exec(body);
	if (!viewBox) throw new Error(`unexpected viewBox at ${where}: ${raw.slice(0, 120)}`);

	const paths = [...body.matchAll(/<path\b([^>]*)\/?>/g)];
	if (paths.length !== 1) {
		throw new Error(`expected exactly one <path> at ${where}, got ${paths.length}`);
	}
	const attrs = paths[0][1];
	const d = /\bd="([^"]*)"/.exec(attrs)?.[1];
	assertPathData(d, where);

	const glyph = { d };
	if (/\bfill-rule="evenodd"/.test(attrs)) glyph.r = 1;
	if (/\bclip-rule="evenodd"/.test(attrs)) glyph.c = 1;

	return { w: Number(viewBox[1]), p: [glyph] };
}

/**
 * A label is only worth its bytes when it says something the name does not.
 * "heart" → "Heart" adds nothing, since search already treats separators as
 * spaces and ignores case.
 */
function labelAddsMeaning(name, label) {
	if (!label) return false;
	const normalize = (s) => s.toLowerCase().replace(/[\s_-]+/g, "");
	return normalize(name) !== normalize(label);
}

function buildFontAwesome(style) {
	const YAML = faYaml();
	const version = JSON.parse(
		readFileSync(join(FA_DIR, "package.json"), "utf8"),
	).version;

	const icons = YAML.parse(
		readFileSync(join(FA_DIR, "metadata/icons.yml"), "utf8"),
	);
	// categories.yml maps a category to its icons; the index needs the reverse.
	const categoriesByIcon = new Map();
	const categoryData = YAML.parse(
		readFileSync(join(FA_DIR, "metadata/categories.yml"), "utf8"),
	);
	for (const key of Object.keys(categoryData)) {
		const { label, icons: members } = categoryData[key];
		for (const member of members ?? []) {
			if (!categoriesByIcon.has(member)) categoriesByIcon.set(member, []);
			categoriesByIcon.get(member).push(label);
		}
	}

	const names = Object.keys(icons)
		.filter((name) => (icons[name].styles ?? []).includes(style))
		.sort();

	const packIcons = {};
	const entries = [];
	for (const name of names) {
		packIcons[name] = { [FA_HEIGHT]: readFontAwesomeSvg(style, name) };
		const label = icons[name].label;
		entries.push({
			name,
			...(labelAddsMeaning(name, label) ? { label } : {}),
			categories: (categoriesByIcon.get(name) ?? []).sort(),
			keywords: (icons[name].search?.terms ?? []).map(String),
		});
	}

	return {
		id: `fa-${style}`,
		version,
		file: { icons: packIcons },
		entries,
		note: `${entries.length} icons`,
	};
}

/** Lazily required so packs that do not need YAML can build without it. */
let yamlModule = null;
function faYaml() {
	if (!yamlModule) {
		yamlModule = createRequire(import.meta.url)("yaml");
	}
	return yamlModule;
}

// ── Emit ────────────────────────────────────────────────────────────────

function writePackFile(pack) {
	mkdirSync(PACK_DIR, { recursive: true });
	const body = {
		format: PACK_FORMAT,
		pack: pack.id,
		packVersion: pack.version,
		...pack.file,
	};
	// Compact: this file is downloaded over the network and parsed on device.
	const json = JSON.stringify(body);
	const path = join(PACK_DIR, `${pack.id}.json`);
	writeFileSync(path, json);
	const sha256 = createHash("sha256").update(json, "utf8").digest("hex");
	return { path, bytes: Buffer.byteLength(json, "utf8"), sha256 };
}

function writeIndexFile(pack, encoded) {
	mkdirSync(DATA_DIR, { recursive: true });
	const constant = `${pack.id.replace(/-/g, "_").toUpperCase()}_INDEX`;
	const source =
		`/**\n` +
		` * GENERATED FILE — do not edit.\n` +
		` *\n` +
		` * ${pack.id} search index (${pack.note}), packed by\n` +
		` * scripts/generate-icon-packs.mjs from upstream ${pack.version}.\n` +
		` * Decoded lazily by src/icons/data/codec.ts the first time the source is\n` +
		` * opened; until then it is inert string data.\n` +
		` *\n` +
		` * Regenerate with: npm run icons:generate -- --pack=${pack.id}\n` +
		` */\n` +
		`import type { EncodedIndex } from "./codec";\n\n` +
		`export const ${constant}: EncodedIndex = ${encodedIndexLiteral(encoded)};\n`;
	const path = join(DATA_DIR, `${pack.id}.index.ts`);
	writeFileSync(path, source);
	return { path, bytes: Buffer.byteLength(source, "utf8") };
}

/**
 * Decode what was just encoded and compare it to the source entries. The
 * encoder and decoder live in different files and different languages; this is
 * what keeps them honest.
 */
async function assertRoundTrip(entries, encoded) {
	const { createJiti } = await import("jiti");
	const jiti = createJiti(import.meta.url);
	const { decodeIndex } = await jiti.import(join(DATA_DIR, "codec.ts"));

	const decoded = decodeIndex(encoded);
	const normalize = (list) =>
		JSON.stringify(
			list.map((e) => ({
				name: e.name,
				label: e.label ?? undefined,
				categories: [...e.categories],
				keywords: [...e.keywords],
			})),
		);
	if (normalize(decoded.entries) !== normalize(entries)) {
		throw new Error("index round-trip mismatch: encoder and decoder disagree");
	}
	return decoded;
}

const BUILDERS = {
	octicons: buildOcticons,
	"fa-solid": () => buildFontAwesome("solid"),
	"fa-regular": () => buildFontAwesome("regular"),
	"fa-brands": () => buildFontAwesome("brands"),
};

async function main() {
	const requested = process.argv
		.filter((a) => a.startsWith("--pack="))
		.map((a) => a.slice("--pack=".length));
	const ids = requested.length > 0 ? requested : Object.keys(BUILDERS);

	const manifest = {};
	for (const id of ids) {
		const build = BUILDERS[id];
		if (!build) throw new Error(`unknown pack "${id}"`);

		const pack = build();
		const encoded = encodeIndex(pack.entries);
		await assertRoundTrip(pack.entries, encoded);

		const packFile = writePackFile(pack);
		const indexFile = writeIndexFile(pack, encoded);

		manifest[id] = {
			version: pack.version,
			iconCount: pack.entries.length,
			bytes: packFile.bytes,
			sha256: packFile.sha256,
		};

		const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
		console.log(
			`${id}: ${pack.entries.length} icons\n` +
				`  pack  ${kb(packFile.bytes)}  ${packFile.path}\n` +
				`  index ${kb(indexFile.bytes)}  ${indexFile.path}\n` +
				`  sha256 ${packFile.sha256}`,
		);
	}

	console.log(`\nAdd/refresh these in src/icons/data/packManifest.ts:`);
	console.log(JSON.stringify(manifest, null, 2));
}

await main();
