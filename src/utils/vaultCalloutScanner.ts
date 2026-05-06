import type { App, TFile } from "obsidian";

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
