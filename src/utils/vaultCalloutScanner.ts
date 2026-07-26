/**
 * utils/vaultCalloutScanner.ts — Scans vault markdown files for callout usage.
 *
 * Provides async functions for reading every markdown file in the vault:
 * discovering unknown callout IDs, counting per-type usage statistics,
 * bulk-replacing callout IDs or titles, converting callouts to plain text,
 * and normalizing fold markers. Used by CalloutDiscovery (auto-discovery),
 * DataManagementSection (re-scan), and CalloutRowActions (pre-delete counts).
 *
 * Both the read-only scanners (statistics, unknown discovery, usage counting)
 * and the write operations (bulk id/title replacement, plain-text conversion)
 * go through the shared tokenizer in editor/calloutTokens, so they all see the
 * same three render roles — regular (`> [!id]`), heading (`## [!id]`), and
 * inline (`[!id]` mid-line) — and all agree on which occurrences are real:
 * escapes, markdown links, wikilink contents, inline code, fenced code blocks
 * and YAML frontmatter are excluded once, in one place. Keeping the writers on
 * the same grammar as the counters is what stops the menu from promising "3
 * uses in 2 files" and the rewrite from reporting 0.
 *
 * The one exception is fold-marker normalization; see the note on it below.
 */
import type { App, TFile } from "obsidian";
import { normalizeCalloutId } from "./calloutId";
import type { LineCalloutToken } from "../editor/calloutTokens";
import {
	createDocumentLineFilter,
	forEachCalloutToken,
	scanLineForCalloutTokens,
} from "../editor/calloutTokens";

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * End offset of a token's `[!id]` bracket span. Deliberately *not*
 * `token.to`, which for heading tokens also covers the trailing fold mark —
 * an id swap has to leave that mark in place.
 */
function tokenBracketEnd(token: LineCalloutToken): number {
	return token.from + 2 + token.rawId.length + 1;
}

/**
 * Applies per-token edits to one line. Tokens are spliced right-to-left so
 * offsets computed against the original line stay valid throughout — a heading
 * line can carry inline tokens inside its title text.
 *
 * `replace` returns the text to put in place of `[token.from, end)`, or null to
 * leave that token alone. It may widen the replaced span via `end` (used to
 * swallow the whitespace after a heading token).
 */
function rewriteTokensOnLine(
	line: string,
	tokens: LineCalloutToken[],
	replace: (token: LineCalloutToken) => { text: string; end: number } | null,
): { line: string; count: number } {
	let out = line;
	let count = 0;
	for (const token of [...tokens].sort((a, b) => b.from - a.from)) {
		const edit = replace(token);
		if (!edit) continue;
		out = out.slice(0, token.from) + edit.text + out.slice(edit.end);
		count++;
	}
	return { line: out, count };
}

/**
 * Walks a document's content lines (frontmatter and fenced code skipped) and
 * hands each line's callout tokens to `rewriteLine`, which returns the new line
 * and how many tokens it changed. Returns null when nothing changed, so callers
 * can skip the vault write.
 */
function rewriteCalloutLines(
	content: string,
	rewriteLine: (
		line: string,
		tokens: LineCalloutToken[],
	) => { line: string; count: number },
): { content: string; count: number } | null {
	if (content.indexOf("[!") === -1) return null;

	const lines = content.split("\n");
	const isContentLine = createDocumentLineFilter();
	let total = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		if (!isContentLine(line, i)) continue;
		if (line.indexOf("[!") === -1) continue;
		const tokens = scanLineForCalloutTokens(line);
		if (tokens.length === 0) continue;
		const result = rewriteLine(line, tokens);
		if (result.count === 0) continue;
		lines[i] = result.line;
		total += result.count;
	}

	return total > 0 ? { content: lines.join("\n"), count: total } : null;
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
	const files = app.vault.getMarkdownFiles();
	const byId = new Map<string, VaultCalloutTypeStatistics>();
	let filesWithCallouts = 0;
	let totalCount = 0;

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const seenInFile = new Set<string>();

		forEachCalloutToken(content, (rawId) => {
			const id = normalizeCalloutId(rawId);
			if (!id) return;

			let entry = byId.get(id);
			if (!entry) {
				entry = { id, fileCount: 0, totalCount: 0 };
				byId.set(id, entry);
			}
			entry.totalCount++;
			totalCount++;
			seenInFile.add(id);
		});

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
 * callout IDs referenced in any role (regular / heading / inline) that are
 * NOT in `knownIds`. Used for incremental tracking on file save / create.
 */
export async function scanFileForUnknownCallouts(
	app: App,
	file: TFile,
	knownIds: Set<string>,
): Promise<string[]> {
	const content = await app.vault.cachedRead(file);
	return scanStringForUnknownCallouts(content, knownIds);
}

/**
 * Synchronously scan an in-memory string (e.g. an open editor's current
 * buffer that may be unsaved) and return unknown callout IDs from any role.
 */
export function scanStringForUnknownCallouts(
	content: string,
	knownIds: Set<string>,
): string[] {
	const found = new Set<string>();
	forEachCalloutToken(content, (rawId) => {
		const id = normalizeCalloutId(rawId);
		if (!id) return;
		if (!knownIds.has(id)) found.add(id);
	});
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

	const idSet = new Set(ids.map((id) => normalizeCalloutId(id)));
	const files = app.vault.getMarkdownFiles();
	let fileCount = 0;
	let totalCount = 0;

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		let countInFile = 0;
		forEachCalloutToken(content, (rawId) => {
			if (idSet.has(normalizeCalloutId(rawId))) countInFile++;
		});
		if (countInFile > 0) {
			fileCount++;
			totalCount += countInFile;
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
		result.set(normalizeCalloutId(id), { fileCount: 0, totalCount: 0 });
	}
	if (ids.length === 0) return result;

	const files = app.vault.getMarkdownFiles();
	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const seenInFile = new Set<string>();
		forEachCalloutToken(content, (rawId) => {
			const id = normalizeCalloutId(rawId);
			if (!id) return;
			const entry = result.get(id);
			if (!entry) return;
			entry.totalCount++;
			seenInFile.add(id);
		});
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

	const idSet = new Set(ids.map((id) => normalizeCalloutId(id)));
	const headerRegex = /^(>+)\s*\[!([^\]\n\r]+)\][+-]?\s*(.*)$/i;

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
				const id = normalizeCalloutId(headerMatch[2] ?? "");
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
 * Replace callout IDs in all markdown files. Every occurrence of `[!oldId]`
 * (for any oldId in `oldIds`) becomes `[!newId]`, in all three render roles —
 * a heading callout and an inline pill carry the id just as a blockquote header
 * does, and a rename that skipped them would leave a dead id behind that
 * renders as "unknown".
 *
 * Any heading fold mark is preserved: only the bracket span is swapped.
 *
 * Returns the number of references replaced.
 */
export async function replaceCalloutIdsInVault(
	app: App,
	oldIds: string[],
	newId: string,
): Promise<number> {
	if (oldIds.length === 0) return 0;

	const idSet = new Set(oldIds.map((id) => normalizeCalloutId(id)));
	const files = app.vault.getMarkdownFiles();
	let totalReplacements = 0;

	for (const file of files) {
		const content = await app.vault.read(file);
		const result = rewriteCalloutLines(content, (line, tokens) =>
			rewriteTokensOnLine(line, tokens, (token) =>
				idSet.has(normalizeCalloutId(token.rawId))
					? { text: `[!${newId}]`, end: tokenBracketEnd(token) }
					: null,
			),
		);
		if (result) {
			totalReplacements += result.count;
			await app.vault.modify(file, result.content);
		}
	}

	return totalReplacements;
}

/**
 * Rewrite `+/-` fold markers on every `> [!id]` (or alias) line in the vault
 * to match `desiredMarker` ("" = no marker, "+" = open, "-" = closed).
 * Only writes a file if at least one line changed.
 *
 * Blockquote-only by design, unlike the other writers in this file: heading
 * callouts accept a fold mark today (`## [!id]-`), but that support is slated
 * for removal, so teaching this function the heading role would only have to be
 * undone. Revisit once heading folding is gone.
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
 * Scan every Markdown file once and return the set of callout IDs that are
 * referenced in any role (regular / heading / inline) but are NOT in the
 * supplied known set.
 */
export async function scanVaultForUnknownCallouts(
	app: App,
	knownIds: Set<string>,
): Promise<string[]> {
	const files = app.vault.getMarkdownFiles();
	const found = new Set<string>();
	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		for (const id of scanStringForUnknownCallouts(content, knownIds)) {
			found.add(id);
		}
	}
	return Array.from(found);
}

/**
 * Replace the display-name / title text of callouts that match the given IDs.
 * Matches `> [!id] Old Title`, `> [!id]+ Old Title` and the heading equivalent
 * `## [!id] Old Title`, replacing the title portion with `newTitle`. Inline
 * tokens are skipped — a pill has no title text of its own.
 *
 * Only replaces when the whole existing title matches `oldTitle`
 * (case-insensitive), so a title the user wrote themselves is never clobbered.
 */
export async function replaceCalloutTitlesInVault(
	app: App,
	ids: string[],
	oldTitle: string,
	newTitle: string,
): Promise<number> {
	if (ids.length === 0) return 0;

	const idSet = new Set(ids.map((id) => normalizeCalloutId(id)));
	const wanted = oldTitle.trim().toLowerCase();
	// An empty old title would match every title-less header and *add* a title
	// to it, which is never what a rename means.
	if (!wanted) return 0;
	const files = app.vault.getMarkdownFiles();
	let totalReplacements = 0;

	for (const file of files) {
		const content = await app.vault.read(file);
		const result = rewriteCalloutLines(content, (line, tokens) =>
			rewriteTokensOnLine(line, tokens, (token) => {
				if (token.role === "inline") return null;
				if (!idSet.has(normalizeCalloutId(token.rawId))) return null;
				// A blockquote token's `to` stops at `]`, so a fold marker is
				// still ahead of us and must be carried over; a heading token's
				// already includes it.
				const rest = line.slice(token.to);
				const m = rest.match(/^([+-]?)[ \t]*(.*)$/);
				if (!m) return null;
				const foldMark = m[1] ?? "";
				if ((m[2] ?? "").trim().toLowerCase() !== wanted) return null;
				return {
					text: `${line.slice(token.from, token.to)}${foldMark} ${newTitle}`,
					end: line.length,
				};
			}),
		);
		if (result) {
			totalReplacements += result.count;
			await app.vault.modify(file, result.content);
		}
	}

	return totalReplacements;
}
