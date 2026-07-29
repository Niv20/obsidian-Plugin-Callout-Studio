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

// ── RPG Awesome ─────────────────────────────────────────────────────────

const RA_DIR = join(ROOT, "node_modules/rpg-awesome");

/**
 * RPG Awesome publishes a webfont and nothing else — no per-icon SVGs, no
 * metadata — so the artwork comes out of the SVG font's `<glyph>` elements.
 *
 * Font space is not SVG space: the y axis points *up*, and the origin sits on
 * the baseline rather than at the top-left. The em square is 1024 units with an
 * ascent of 960, so the mapping is y' = 960 - y, giving a 1024×1024 viewBox.
 *
 * The flip is baked into the coordinates here rather than emitted as a
 * `<g transform>` wrapper, so the pack file keeps its "path data only"
 * property and the runtime needs no special case for this one source. It is
 * done with svgpath rather than a regex because relative commands (`v`, `c`,
 * `s` — all of which this font uses) need their deltas negated too, and
 * svgpath also handles arc sweep inversion should a future version add arcs.
 */
const RA_UNITS_PER_EM = 1024;
const RA_ASCENT = 960;
const RA_SIZE = String(RA_UNITS_PER_EM);

/**
 * Bounding box of the drawn outline.
 *
 * Curves are flattened rather than bounded by their control points: control
 * points routinely sit well outside the curve they shape, and here that
 * difference decides whether a glyph looks misplaced or not. Commands are read
 * with their real arity too — `H` and `V` carry a single coordinate, so
 * treating a path's numbers as x,y pairs gives nonsense.
 */
function pathBounds(d, svgpath) {
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	const point = (x, y) => {
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	};
	const cubic = (x0, y0, x1, y1, x2, y2, x3, y3) => {
		const steps = 24;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const u = 1 - t;
			point(
				u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
				u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
			);
		}
	};

	svgpath(d)
		.abs()
		.unshort()
		.unarc()
		.iterate((seg, _index, x, y) => {
			switch (seg[0]) {
				case "M":
				case "L":
					point(seg[1], seg[2]);
					break;
				case "H":
					point(seg[1], y);
					break;
				case "V":
					point(x, seg[1]);
					break;
				case "C":
					cubic(x, y, seg[1], seg[2], seg[3], seg[4], seg[5], seg[6]);
					break;
				case "Q":
					cubic(
						x,
						y,
						x + (2 / 3) * (seg[1] - x),
						y + (2 / 3) * (seg[2] - y),
						seg[3] + (2 / 3) * (seg[1] - seg[3]),
						seg[4] + (2 / 3) * (seg[2] - seg[4]),
						seg[3],
						seg[4],
					);
					break;
				default:
					break;
			}
		});

	return { minX, maxX, minY, maxY };
}

function buildRpgAwesome() {
	const svgpath = createRequire(import.meta.url)("svgpath");
	const version = JSON.parse(
		readFileSync(join(RA_DIR, "package.json"), "utf8"),
	).version;

	const font = readFileSync(
		join(RA_DIR, "fonts/rpgawesome-webfont.svg"),
		"utf8",
	);
	const scss = readFileSync(join(RA_DIR, "scss/_variables.scss"), "utf8");

	// The documented ids, keyed by codepoint. Used only to check that
	// `glyph-name` still agrees with what the stylesheet calls each icon.
	const namesByCode = new Map(
		[...scss.matchAll(/\$ra-var-icon-([a-z0-9-]+):\s*'\\([0-9a-fA-F]+)'/g)].map(
			(m) => [parseInt(m[2], 16), m[1]],
		),
	);
	if (namesByCode.size === 0) {
		throw new Error("rpg-awesome: no icon names found in _variables.scss");
	}

	const icons = {};
	const entries = [];

	for (const attrs of [...font.matchAll(/<glyph ([^>]*?)\/>/g)].map((m) => m[1])) {
		const d = /\sd="([^"]*)"/.exec(attrs)?.[1];
		// The font carries a space glyph with no outline; it is not an icon.
		if (!d) continue;

		const glyphName = /glyph-name="([^"]*)"/.exec(attrs)?.[1];
		const code = parseInt(
			/unicode="&#x([0-9a-fA-F]+);"/.exec(attrs)?.[1] ?? "",
			16,
		);
		// The stylesheet's name wins where the two disagree: it is the one
		// upstream documents and ships as a CSS class, so it is what anyone
		// looking an icon up will have seen. Two glyphs differ in 0.2.0 —
		// `montains` is a typo for `mountains`, and `perspective-dice-six-two`
		// is shortened to `perspective-dice-two`.
		const name = namesByCode.get(code) ?? glyphName;
		if (!name) {
			throw new Error(`rpg-awesome: unnamed glyph at codepoint ${code}`);
		}

		// This font declares one advance width for every glyph; a per-glyph
		// override would mean the em square below is the wrong frame.
		if (/horiz-adv-x=/.test(attrs)) {
			throw new Error(`rpg-awesome: "${name}" overrides horiz-adv-x`);
		}

		const flipped = svgpath(d)
			.scale(1, -1)
			.translate(0, RA_ASCENT)
			.abs()
			.round(2)
			.toString();
		assertPathData(flipped, `rpg-awesome/${name}`);

		// The flip is the one thing here that could fail silently — a wrong sign
		// or a missed offset produces a valid path that simply draws upside
		// down or off-frame. Every glyph in this font sits inside the em square
		// once flipped, so checking that is a real test of the transform: get
		// it wrong and the coordinates land outside immediately.
		const box = pathBounds(flipped, svgpath);
		const slack = 1;
		if (
			box.minX < -slack ||
			box.minY < -slack ||
			box.maxX > RA_UNITS_PER_EM + slack ||
			box.maxY > RA_UNITS_PER_EM + slack
		) {
			throw new Error(
				`rpg-awesome: "${name}" falls outside the em square after the ` +
					`Y-flip — x ${box.minX.toFixed(1)}…${box.maxX.toFixed(1)}, ` +
					`y ${box.minY.toFixed(1)}…${box.maxY.toFixed(1)}, ` +
					`expected 0…${RA_UNITS_PER_EM} on both axes`,
			);
		}

		icons[name] = {
			[RA_SIZE]: { w: RA_UNITS_PER_EM, p: [{ d: flipped }] },
		};
		// No keywords upstream, but the names are compound and descriptive, so
		// their parts make usable search terms: "crossed-swords" becomes
		// findable by "swords". Where the font spells a name differently from
		// the stylesheet, keep its spelling searchable too.
		const keywords = name.split("-").filter((part) => part.length > 1);
		if (glyphName && glyphName !== name) {
			for (const part of glyphName.split("-")) {
				if (part.length > 1 && !keywords.includes(part)) {
					keywords.push(part);
				}
			}
		}

		entries.push({
			name,
			categories: [], // RPG Awesome has no taxonomy upstream.
			keywords,
		});
	}

	entries.sort((a, b) => (a.name < b.name ? -1 : 1));
	const sorted = {};
	for (const entry of entries) sorted[entry.name] = icons[entry.name];

	return {
		id: "rpg-awesome",
		version,
		file: { icons: sorted },
		entries,
		note: `${entries.length} icons`,
	};
}

// ── Material Symbols ────────────────────────────────────────────────────

/**
 * Material Symbols has no pack file: its artwork is fetched one drawing at a
 * time from Google, because 3,870 icons across 4 styles and 7 weights is over
 * 100,000 variants and no bulk file exists to ship. Only the index is built.
 *
 * The source is the metadata table Google publishes, previously committed as a
 * 2.24 MB TypeScript array. Packing it costs nothing in fidelity — every name,
 * tag and category survives, as the round-trip check asserts — and takes the
 * bundled form to well under a third of that.
 */
async function buildMaterial() {
	const { createJiti } = await import("jiti");
	const jiti = createJiti(import.meta.url);
	const { MATERIAL_ICON_METADATA } = await jiti.import(
		join(ROOT, "src/data/materialIconsMetadata.ts"),
	);

	// Google's table carries a little editorial debris — one tag on `moving`
	// reads "potential tags could relate to:\n\nmoving". Collapsing whitespace
	// keeps it searchable without letting a newline break the line-per-icon
	// framing the index format relies on. Duplicates are dropped because a
	// repeated tag costs a reference and matches nothing extra.
	const clean = (values) => [
		...new Set(
			values
				.map((value) => String(value).replace(/\s+/g, " ").trim())
				.filter((value) => value.length > 0),
		),
	];

	const entries = MATERIAL_ICON_METADATA.map((icon) => ({
		name: icon.name,
		categories: clean(icon.categories).sort(),
		keywords: clean(icon.tags),
	}));

	return {
		id: "material",
		version: "Material Symbols",
		file: null, // per-icon fetch; nothing to publish
		entries,
		note: `${entries.length} icons`,
	};
}

// ── Tabler Icons ────────────────────────────────────────────────────────

const TABLER_DIR = join(ROOT, "node_modules/@tabler/icons");

/** Every Tabler drawing is on the same 24-unit square, so there is one size. */
const TABLER_SIZE = "24";

/**
 * The transparent square every Tabler SVG opens with. It exists to pin the
 * icon's bounds in a browser and draws nothing, but through a CSS mask — which
 * reads alpha, not colour — it would blot out the whole box. Dropped.
 */
const TABLER_BOUNDS_PATH = "M0 0h24v24H0z";

/**
 * The paint a path is allowed to declare for itself, and the flag it becomes.
 *
 * Outline icons are stroked from the root, and 77 of their 20,706 paths opt out
 * of that for a detail drawn solid — the pips on `dice-3`, the eyes on
 * `brand-reddit`. Both flags are booleans, never values: what `f` and `n` mean
 * is written in src/icons/packData.ts, so the file still holds nothing but path
 * data and 1s.
 */
const TABLER_GLYPH_FLAGS = [
	{ attr: "fill", value: "currentColor", flag: "f" },
	{ attr: "stroke", value: "none", flag: "n" },
];

/**
 * Read one Tabler SVG into a drawing.
 *
 * Strict on purpose, in the same way parseOcticonPaths is: an element or an
 * attribute this does not expect means upstream changed shape, and a build that
 * quietly dropped it would ship a wrong icon. As of 3.46.0 the only attribute
 * outside `d` and the two flags above is an `opacity=".5"` on one path of
 * `brand-parsinta`, which is allowed through and dropped — recorded in the
 * pack's `modifications`, since it renders that one path fully opaque.
 */
function readTablerSvg(style, name) {
	const where = `tabler-${style}/${name}`;
	const raw = readFileSync(join(TABLER_DIR, "icons", style, `${name}.svg`), "utf8");
	const body = raw.slice(raw.indexOf(">") + 1);

	const elements = [...body.matchAll(/<([a-zA-Z-]+)/g)].map((m) => m[1]);
	const unexpected = elements.filter((e) => e !== "path");
	if (unexpected.length > 0) {
		throw new Error(`unexpected elements at ${where}: ${unexpected.join(", ")}`);
	}
	if (!/\bviewBox="0 0 24 24"/.test(raw)) {
		throw new Error(`unexpected viewBox at ${where}: ${raw.slice(0, 160)}`);
	}

	const p = [];
	for (const match of body.matchAll(/<path\b([^>]*?)\/?>/g)) {
		const attrs = match[1];
		const d = /\bd="([^"]*)"/.exec(attrs)?.[1];
		assertPathData(d, where);
		if (d === TABLER_BOUNDS_PATH) continue;

		const glyph = { d };
		for (const { attr, value, flag } of TABLER_GLYPH_FLAGS) {
			// Filled icons declare `fill="currentColor"` on the root already, so the
			// 16 paths that repeat it are saying nothing and need no flag.
			if (style === "outline" && new RegExp(`\\b${attr}="${value}"`).test(attrs)) {
				glyph[flag] = 1;
			}
		}

		const declared = [...attrs.matchAll(/([a-z-]+)="/g)].map((m) => m[1]);
		const unknown = declared.filter(
			(a) => !["d", "fill", "stroke", "opacity"].includes(a),
		);
		if (unknown.length > 0) {
			throw new Error(`unexpected attributes at ${where}: ${unknown.join(", ")}`);
		}
		p.push(glyph);
	}
	if (p.length === 0) throw new Error(`no drawable <path> at ${where}`);

	return { w: 24, p };
}

/**
 * Build one Tabler style.
 *
 * Upstream ships one metadata record per name covering both styles, so `styles`
 * is what says whether this style draws it: every one of the 5,130 names has an
 * outline drawing, 1,054 also have a filled one.
 */
function buildTabler(style) {
	const version = JSON.parse(
		readFileSync(join(TABLER_DIR, "package.json"), "utf8"),
	).version;
	const metadata = JSON.parse(
		readFileSync(join(TABLER_DIR, "icons.json"), "utf8"),
	);

	const names = Object.keys(metadata)
		.filter((name) => metadata[name].styles?.[style])
		.sort();
	if (names.length === 0) throw new Error(`no icons for style "${style}"`);

	const icons = {};
	const entries = [];
	for (const name of names) {
		icons[name] = { [TABLER_SIZE]: readTablerSvg(style, name) };

		// Tags are the whole reason a search for "warning" finds `alert-triangle`.
		// A few are numbers upstream ("a-b-2" is tagged 2), hence the cast.
		const keywords = [
			...new Set(
				(metadata[name].tags ?? [])
					.map((tag) => String(tag).replace(/\s+/g, " ").trim().toLowerCase())
					.filter((tag) => tag.length > 0),
			),
		];
		const category = metadata[name].category;
		entries.push({
			name,
			// No label: Tabler's names are already the display text, and omitting
			// them lets the index skip its label block entirely.
			categories: category ? [category] : [],
			keywords,
		});
	}

	return {
		id: `tabler-${style}`,
		version,
		file: { icons },
		entries,
		note: `${entries.length} icons`,
	};
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
	material: buildMaterial,
	octicons: buildOcticons,
	"tabler-outline": () => buildTabler("outline"),
	"tabler-filled": () => buildTabler("filled"),
	"fa-solid": () => buildFontAwesome("solid"),
	"fa-regular": () => buildFontAwesome("regular"),
	"fa-brands": () => buildFontAwesome("brands"),
	"rpg-awesome": buildRpgAwesome,
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

		const pack = await build();
		const encoded = encodeIndex(pack.entries);
		await assertRoundTrip(pack.entries, encoded);

		const packFile = pack.file ? writePackFile(pack) : null;
		const indexFile = writeIndexFile(pack, encoded);

		if (packFile) {
			manifest[id] = {
				version: pack.version,
				iconCount: pack.entries.length,
				bytes: packFile.bytes,
				sha256: packFile.sha256,
			};
		}

		const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
		console.log(
			`${id}: ${pack.entries.length} icons\n` +
				(packFile
					? `  pack  ${kb(packFile.bytes)}  ${packFile.path}\n`
					: `  pack  (none — artwork is fetched per icon)\n`) +
				`  index ${kb(indexFile.bytes)}  ${indexFile.path}` +
				(packFile ? `\n  sha256 ${packFile.sha256}` : ""),
		);
	}

	if (Object.keys(manifest).length > 0) {
		console.log(`\nAdd/refresh these in src/icons/data/packManifest.ts:`);
		console.log(JSON.stringify(manifest, null, 2));
	}
}

await main();
