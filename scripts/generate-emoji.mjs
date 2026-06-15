/**
 * scripts/generate-emoji.mjs — Regenerates src/data/emojiData.ts.
 *
 * Downloads the English emojibase-data dataset (en/data.json, MIT licensed)
 * and transforms it into the static EmojiEntry[] bundled with the plugin.
 * Keeps only picker-worthy emojis (a standard group, excluding "Component"),
 * and collapses skin-tone variants into a 5-element `skins` array ordered
 * light → dark. The generated file ships statically — no runtime network.
 *
 * Usage: node scripts/generate-emoji.mjs
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = "https://cdn.jsdelivr.net/npm/emojibase-data@latest/en/data.json";
const OUT = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"src",
	"data",
	"emojiData.ts",
);

function fetchJson(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.statusCode && res.statusCode >= 300 && res.headers.location) {
					return resolve(fetchJson(res.headers.location));
				}
				let body = "";
				res.setEncoding("utf8");
				res.on("data", (c) => (body += c));
				res.on("end", () => resolve(JSON.parse(body)));
			})
			.on("error", reject);
	});
}

const data = await fetchJson(SOURCE);

const real = data
	.filter((e) => typeof e.group === "number" && e.group !== 2)
	.sort((a, b) => a.group - b.group || a.order - b.order);

const entries = real.map((e) => {
	const out = { emoji: e.emoji, label: e.label, tags: e.tags ?? [] };
	if (e.skins) {
		const skins = [];
		for (let t = 1; t <= 5; t++) {
			const s = e.skins.find((k) => k.tone === t);
			if (s) skins.push(s.emoji);
		}
		if (skins.length === 5) out.skins = skins;
	}
	return out;
});

const j = (s) => JSON.stringify(s);
const lines = entries.map((e) => {
	const tags = e.tags.length ? `tags:[${e.tags.map(j).join(",")}]` : "tags:[]";
	const skins = e.skins ? `,skins:[${e.skins.map(j).join(",")}]` : "";
	return `\t{ emoji: ${j(e.emoji)}, label: ${j(e.label)}, ${tags}${skins} },`;
});

const header = `/**
 * data/emojiData.ts — Static Unicode emoji dataset for the icon picker.
 *
 * Auto-generated from emojibase-data (en/data.json, MIT licensed). Lists base
 * emojis only (no per-tone duplicate rows); skin-tone-capable emojis carry a
 * \`skins\` array of the 5 fully-qualified variant glyphs ordered light → dark
 * (Unicode tone modifiers U+1F3FB … U+1F3FF). Bundled statically — no runtime
 * network access. Regenerate via scripts/generate-emoji.mjs.
 */
import type { EmojiEntry } from "../types";

export const EMOJI_DATA: EmojiEntry[] = [
`;

fs.writeFileSync(OUT, header + lines.join("\n") + "\n];\n");
console.log(
	`wrote ${entries.length} emojis (${entries.filter((e) => e.skins).length} with skins) to ${OUT}`,
);
