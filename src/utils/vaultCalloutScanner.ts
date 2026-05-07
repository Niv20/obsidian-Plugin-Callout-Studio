import type { App, TFile } from "obsidian";

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface VaultCalloutTypeStatistics {
	id: string;
	fileCount: number;
	totalCount: number;
}

export interface VaultCalloutStatistics {
	markdownFileCount: number;
	filesWithCallouts: number;
	totalCount: number;
	types: VaultCalloutTypeStatistics[];
}

export async function scanVaultCalloutStatistics(
	app: App,
): Promise<VaultCalloutStatistics> {
	const regex = /^>\s*(?:>\s*)*\[!([^\]\s]+)\][+-]?/gim;
	const files = app.vault.getMarkdownFiles();
	const byId = new Map<string, VaultCalloutTypeStatistics>();
	let filesWithCallouts = 0;
	let totalCount = 0;

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const seenInFile = new Set<string>();
		regex.lastIndex = 0;

		let match: RegExpExecArray | null;
		while ((match = regex.exec(content)) !== null) {
			const id = match[1]?.toLowerCase();
			if (!id) continue;

			let entry = byId.get(id);
			if (!entry) {
				entry = { id, fileCount: 0, totalCount: 0 };
				byId.set(id, entry);
			}
			entry.totalCount++;
			totalCount++;
			seenInFile.add(id);
		}

		if (seenInFile.size > 0) {
			filesWithCallouts++;
			for (const id of seenInFile) {
				const entry = byId.get(id);
				if (entry) entry.fileCount++;
			}
		}
	}

	const types = Array.from(byId.values()).sort(
		(a, b) => b.totalCount - a.totalCount || a.id.localeCompare(b.id),
	);

	return {
		markdownFileCount: files.length,
		filesWithCallouts,
		totalCount,
		types,
	};
}

/**
 * Scan a single Markdown file (cheap; reads from cache) and return the set of
 * callout IDs referenced via `> [!id]` syntax that are NOT in `knownIds`.
 * Used for incremental tracking on file save / create.
 */
export async function scanFileForUnknownCallouts(
	app: App,
	file: TFile,
	knownIds: Set<string>,
): Promise<string[]> {
	const regex = /^>\s*\[!([^\]\s]+)\]/gim;
	const content = await app.vault.cachedRead(file);
	const found = new Set<string>();
	let m: RegExpExecArray | null;
	while ((m = regex.exec(content)) !== null) {
		const id = m[1]?.toLowerCase();
		if (!id) continue;
		if (!knownIds.has(id)) found.add(id);
	}
	return Array.from(found);
}

/**
 * Synchronously scan an in-memory string (e.g. an open editor's current
 * buffer that may be unsaved) and return unknown callout IDs.
 */
export function scanStringForUnknownCallouts(
	content: string,
	knownIds: Set<string>,
): string[] {
	const regex = /^>\s*\[!([^\]\s]+)\]/gim;
	const found = new Set<string>();
	let m: RegExpExecArray | null;
	while ((m = regex.exec(content)) !== null) {
		const id = m[1]?.toLowerCase();
		if (!id) continue;
		if (!knownIds.has(id)) found.add(id);
	}
	return Array.from(found);
}

/**
 * Count how many markdown files reference any of the given callout IDs.
 * Uses `cachedRead` for speed.
 */
export async function countCalloutUsages(
	app: App,
	ids: string[],
): Promise<{ fileCount: number; totalCount: number }> {
	if (ids.length === 0) return { fileCount: 0, totalCount: 0 };

	const pattern = ids.map(escapeRegex).join("|");
	const regex = new RegExp(`^>\\s*\\[!(${pattern})\\]`, "gim");

	const files = app.vault.getMarkdownFiles();
	let fileCount = 0;
	let totalCount = 0;

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const matches = content.match(regex);
		if (matches && matches.length > 0) {
			fileCount++;
			totalCount += matches.length;
		}
	}

	return { fileCount, totalCount };
}

/**
 * Count how many markdown files reference each of the given callout IDs in a
 * single vault pass. Returns a Map keyed by lowercased ID. IDs with zero
 * usages are still present in the map with `{ fileCount: 0, totalCount: 0 }`.
 */
export async function countCalloutUsagesMap(
	app: App,
	ids: string[],
): Promise<Map<string, { fileCount: number; totalCount: number }>> {
	const result = new Map<string, { fileCount: number; totalCount: number }>();
	for (const id of ids) {
		result.set(id.toLowerCase(), { fileCount: 0, totalCount: 0 });
	}
	if (ids.length === 0) return result;

	const pattern = ids.map(escapeRegex).join("|");
	const regex = new RegExp(`^>\\s*\\[!(${pattern})\\]`, "gim");

	const files = app.vault.getMarkdownFiles();
	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const seenInFile = new Set<string>();
		let m: RegExpExecArray | null;
		regex.lastIndex = 0;
		while ((m = regex.exec(content)) !== null) {
			const id = m[1]?.toLowerCase();
			if (!id) continue;
			const entry = result.get(id);
			if (!entry) continue;
			entry.totalCount++;
			seenInFile.add(id);
		}
		for (const id of seenInFile) {
			result.get(id)!.fileCount++;
		}
	}
	return result;
}

/**
 * Convert every `> [!id]` block (for any id in `ids`) in the vault into plain
 * text. The header `[!id]` (and any `+`/`-` fold marker) is stripped while any
 * trailing title text on that line is preserved as a normal paragraph line.
 * Subsequent blockquote-continuation lines that belong to the same callout
 * block lose their leading `> ` so the body becomes plain text.
 *
 * Only outermost callout blocks whose id matches are unwrapped; nested
 * callouts inside non-matching blocks are left untouched.
 *
 * Returns `{ files, blocks }` describing how many files were modified and how
 * many callout blocks were converted in total.
 */
export async function convertCalloutsToPlainTextInVault(
	app: App,
	ids: string[],
): Promise<{ files: number; blocks: number }> {
	if (ids.length === 0) return { files: 0, blocks: 0 };

	const idSet = new Set(ids.map((id) => id.toLowerCase()));
	const headerRegex = /^(>+)\s*\[!([^\]\s]+)\][+-]?\s*(.*)$/i;

	const files = app.vault.getMarkdownFiles();
	let modifiedFiles = 0;
	let totalBlocks = 0;

	for (const file of files) {
		const content = await app.vault.read(file);
		const lines = content.split("\n");
		let blocksInFile = 0;
		let i = 0;

		while (i < lines.length) {
			const line = lines[i] ?? "";
			const headerMatch = line.match(headerRegex);
			if (headerMatch) {
				const markers = headerMatch[1] ?? ">";
				const id = (headerMatch[2] ?? "").toLowerCase();
				// Only unwrap outermost blocks (single `>`) whose id matches.
				if (markers.length === 1 && idSet.has(id)) {
					const title = (headerMatch[3] ?? "").trim();
					lines[i] = title;
					i++;
					// Strip leading `> ` from continuation lines until the
					// blockquote ends (a non-`>` line, including blank lines).
					while (i < lines.length) {
						const cont = lines[i] ?? "";
						if (!/^>/.test(cont)) break;
						lines[i] = cont.replace(/^>\s?/, "");
						i++;
					}
					blocksInFile++;
					continue;
				}
			}
			i++;
		}

		if (blocksInFile > 0) {
			totalBlocks += blocksInFile;
			modifiedFiles++;
			await app.vault.modify(file, lines.join("\n"));
		}
	}

	return { files: modifiedFiles, blocks: totalBlocks };
}

/**
 * Replace callout IDs in all markdown files.
 * Any occurrence of `> [!oldId]` (for any oldId in `oldIds`) is replaced
 * with `> [!newId]`.
 */
export async function replaceCalloutIdsInVault(
	app: App,
	oldIds: string[],
	newId: string,
): Promise<number> {
	if (oldIds.length === 0) return 0;

	const pattern = oldIds.map(escapeRegex).join("|");
	const regex = new RegExp(`(^>\\s*\\[!)(${pattern})(\\])`, "gim");

	const files = app.vault.getMarkdownFiles();
	let totalReplacements = 0;

	for (const file of files) {
		const content = await app.vault.read(file);
		let count = 0;
		const newContent = content.replace(
			regex,
			(_match, prefix: string, _id: string, suffix: string) => {
				count++;
				return `${prefix}${newId}${suffix}`;
			},
		);
		if (count > 0) {
			totalReplacements += count;
			await app.vault.modify(file, newContent);
		}
	}

	return totalReplacements;
}

/**
 * Rewrite `+/-` fold markers on every `> [!id]` (or alias) line in the vault
 * to match `desiredMarker` ("" = no marker, "+" = open, "-" = closed).
 * Only writes a file if at least one line changed.
 */
export async function normalizeFoldMarkersInVault(
	app: App,
	ids: string[],
	desiredMarker: "" | "+" | "-",
): Promise<number> {
	if (ids.length === 0) return 0;

	const pattern = ids.map(escapeRegex).join("|");
	const regex = new RegExp(`(^>\\s*\\[!(?:${pattern})\\])([+-]?)`, "gim");

	const files = app.vault.getMarkdownFiles();
	let totalReplacements = 0;

	for (const file of files) {
		const content = await app.vault.read(file);
		let count = 0;
		const newContent = content.replace(
			regex,
			(_match, prefix: string, current: string) => {
				if (current === desiredMarker) return _match;
				count++;
				return `${prefix}${desiredMarker}`;
			},
		);
		if (count > 0) {
			totalReplacements += count;
			await app.vault.modify(file, newContent);
		}
	}

	return totalReplacements;
}

/**
 * Scan every Markdown file once and return the set of callout IDs that
 * are referenced via `> [!id]` syntax but are NOT in the supplied known set.
 */ export async function scanVaultForUnknownCallouts(
	app: App,
	knownIds: Set<string>,
): Promise<string[]> {
	const regex = /^>\s*\[!([^\]\s]+)\]/gim;
	const files = app.vault.getMarkdownFiles();
	const found = new Set<string>();
	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		let m: RegExpExecArray | null;
		while ((m = regex.exec(content)) !== null) {
			const id = m[1]?.toLowerCase();
			if (!id) continue;
			if (!knownIds.has(id)) found.add(id);
		}
	}
	return Array.from(found);
}

/**
 * Replace the display-name / title text of callouts that match the given IDs.
 * Matches lines like `> [!id] Old Title` or `> [!id]+ Old Title` and replaces
 * the title portion with `newTitle`. Only replaces when the existing title
 * matches `oldTitle` (case-insensitive) to avoid clobbering user-customized titles.
 */
export async function replaceCalloutTitlesInVault(
	app: App,
	ids: string[],
	oldTitle: string,
	newTitle: string,
): Promise<number> {
	if (ids.length === 0) return 0;

	const idPattern = ids.map(escapeRegex).join("|");
	const escapedOld = escapeRegex(oldTitle);
	// Match: > [!id][+-]? OldTitle (with optional fold indicator)
	const regex = new RegExp(
		`(^>\\s*\\[!(?:${idPattern})\\][+-]?)\\s+${escapedOld}\\s*$`,
		"gim",
	);

	const files = app.vault.getMarkdownFiles();
	let totalReplacements = 0;

	for (const file of files) {
		const content = await app.vault.read(file);
		let count = 0;
		const newContent = content.replace(regex, (_match, prefix: string) => {
			count++;
			return `${prefix} ${newTitle}`;
		});
		if (count > 0) {
			totalReplacements += count;
			await app.vault.modify(file, newContent);
		}
	}

	return totalReplacements;
}
