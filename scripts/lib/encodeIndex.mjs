/**
 * scripts/lib/encodeIndex.mjs — Encoder for the bundled icon search indexes.
 *
 * The counterpart to src/icons/data/codec.ts. Build-time only: it never reaches
 * the plugin bundle. generate-icon-packs.mjs asserts that decoding this output
 * reproduces the input exactly, so the two halves cannot drift apart.
 *
 * Format notes live in the decoder; the short version is that keywords are
 * pooled into a front-coded dictionary and referenced by fixed-width base36
 * codes, one line of codes per icon.
 */

/** Smallest base36 width that can address `count` distinct values. */
export function refWidth(count) {
	let width = 1;
	while (Math.pow(36, width) < Math.max(count, 1)) width++;
	return width;
}

function encodeRef(index, width) {
	return index.toString(36).padStart(width, "0");
}

/**
 * Front-code a sorted list: each entry becomes one base36 digit for the number
 * of leading characters shared with its predecessor, then the remainder.
 *
 * The shared prefix is capped at 35 because it has to fit in a single base36
 * digit; longer real prefixes simply encode less of the saving, never wrongly.
 */
export function encodeFrontCoded(sorted) {
	const lines = [];
	let prev = "";
	for (const value of sorted) {
		let shared = 0;
		const max = Math.min(prev.length, value.length, 35);
		while (shared < max && prev[shared] === value[shared]) shared++;
		lines.push(shared.toString(36) + value.slice(shared));
		prev = value;
	}
	return lines.join("\n");
}

/**
 * Pack `entries` ({ name, label?, categories, keywords }) into the bundled form.
 *
 * Any string containing a newline would corrupt the line-per-icon framing, so
 * this throws rather than emitting an index that decodes into garbage.
 */
export function encodeIndex(entries) {
	for (const e of entries) {
		const fields = [e.name, e.label ?? "", ...e.categories, ...e.keywords];
		if (fields.some((f) => f.includes("\n"))) {
			throw new Error(`newline in index data for "${e.name}"`);
		}
	}

	const keywordDict = [
		...new Set(entries.flatMap((e) => e.keywords)),
	].sort();
	const categoryList = [
		...new Set(entries.flatMap((e) => e.categories)),
	].sort();

	const keywordIndex = new Map(keywordDict.map((k, i) => [k, i]));
	const categoryIndex = new Map(categoryList.map((c, i) => [c, i]));

	const kw = refWidth(keywordDict.length);
	const cw = refWidth(categoryList.length);

	const encoded = {
		n: entries.map((e) => e.name).join("\n"),
		k: encodeFrontCoded(keywordDict),
		kw,
		kr: entries
			.map((e) =>
				e.keywords.map((k) => encodeRef(keywordIndex.get(k), kw)).join(""),
			)
			.join("\n"),
	};

	// Labels only earn their bytes when at least one differs from its name, and
	// then only the ones that do. An entry with nothing to say contributes an
	// empty line, which `decodeIndex` reads back as *no label at all* rather
	// than as one — so the tooltip still falls through to its prettified name
	// instead of being handed the raw id, and the column costs the length of
	// the labels rather than of every name in the library. A label identical to
	// its name is the same thing as none, and is dropped either way.
	const labelOf = (e) => (e.label && e.label !== e.name ? e.label : "");
	if (entries.some((e) => labelOf(e))) {
		encoded.l = entries.map(labelOf).join("\n");
	}

	if (categoryList.length > 0) {
		encoded.c = categoryList.join("\n");
		encoded.cw = cw;
		encoded.cr = entries
			.map((e) =>
				e.categories
					.map((c) => encodeRef(categoryIndex.get(c), cw))
					.join(""),
			)
			.join("\n");
	}

	return encoded;
}

/** Render an encoded index as a TypeScript module body. */
export function encodedIndexLiteral(encoded) {
	const parts = Object.entries(encoded).map(([key, value]) =>
		typeof value === "number"
			? `\t${key}: ${value},`
			: `\t${key}: ${JSON.stringify(value)},`,
	);
	return `{\n${parts.join("\n")}\n}`;
}
