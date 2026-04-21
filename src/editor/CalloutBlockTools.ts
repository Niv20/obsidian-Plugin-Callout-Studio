import { Editor, Notice } from "obsidian";
import type { EditorPosition } from "obsidian";
import { t } from "../i18n";

interface QuoteStripResult {
	text: string;
	removedLength: number;
	removedUnits: number;
}

interface FenceBlock {
	startLine: number;
	endLine: number;
	kind: "code" | "math";
	marker?: "```" | "~~~";
}

interface CalloutBlockInfo {
	headerLine: number;
	lastLine: number;
	calloutLevel: number;
}

const LEADING_QUOTE_TOKEN_REGEX = /^(?:\s*> ?|\t)/;
const CALLOUT_HEADER_REGEX = /^\[![^\]]*\]/;

const arePositionsEqual = (a: EditorPosition, b: EditorPosition): boolean =>
	a.line === b.line && a.ch === b.ch;

const stripLeadingQuoteTokens = (
	line: string,
	maxTokens = Number.POSITIVE_INFINITY,
): QuoteStripResult => {
	let remaining = line;
	let removedLength = 0;
	let removedUnits = 0;

	while (removedUnits < maxTokens) {
		const match = LEADING_QUOTE_TOKEN_REGEX.exec(remaining);
		if (!match?.[0]) break;
		remaining = remaining.slice(match[0].length);
		removedLength += match[0].length;
		removedUnits += 1;
	}

	return {
		text: remaining,
		removedLength,
		removedUnits,
	};
};

const countLeadingQuoteTokens = (line: string): number =>
	stripLeadingQuoteTokens(line).removedUnits;

const isBlankCalloutLine = (line: string): boolean =>
	stripLeadingQuoteTokens(line).text.trim() === "";

const getFenceToken = (
	line: string,
): { kind: "code"; marker: "```" | "~~~" } | { kind: "math" } | null => {
	const normalized = stripLeadingQuoteTokens(line).text.trimStart();
	if (normalized.trim() === "$$") {
		return { kind: "math" };
	}
	if (normalized.startsWith("```")) {
		return { kind: "code", marker: "```" };
	}
	if (normalized.startsWith("~~~")) {
		return { kind: "code", marker: "~~~" };
	}

	return null;
};

const collectFenceBlocks = (editor: Editor): FenceBlock[] => {
	const fenceBlocks: FenceBlock[] = [];
	const lineCount = editor.lineCount();
	let openFence: {
		startLine: number;
		kind: "code" | "math";
		marker?: "```" | "~~~";
	} | null = null;

	for (let line = 0; line < lineCount; line++) {
		const token = getFenceToken(editor.getLine(line));
		if (!token) continue;

		if (!openFence) {
			openFence = {
				startLine: line,
				kind: token.kind,
				...(token.kind === "code" ? { marker: token.marker } : {}),
			};
			continue;
		}

		if (openFence.kind === "math" && token.kind === "math") {
			fenceBlocks.push({
				startLine: openFence.startLine,
				endLine: line,
				kind: "math",
			});
			openFence = null;
			continue;
		}

		if (
			openFence.kind === "code" &&
			token.kind === "code" &&
			openFence.marker === token.marker
		) {
			fenceBlocks.push({
				startLine: openFence.startLine,
				endLine: line,
				kind: "code",
				marker: openFence.marker,
			});
			openFence = null;
		}
	}

	if (openFence && lineCount > 0) {
		fenceBlocks.push({
			startLine: openFence.startLine,
			endLine: lineCount - 1,
			kind: openFence.kind,
			...(openFence.kind === "code" && openFence.marker
				? { marker: openFence.marker }
				: {}),
		});
	}

	return fenceBlocks;
};

const findFenceBlockAtLine = (
	fenceBlocks: FenceBlock[],
	line: number,
): FenceBlock | null => {
	for (const block of fenceBlocks) {
		if (line >= block.startLine && line <= block.endLine) {
			return block;
		}
	}

	return null;
};

const findFrontmatterEnd = (editor: Editor): number => {
	if (editor.lineCount() === 0) return -1;
	if (editor.getLine(0).trim() !== "---") return -1;

	for (let line = 1; line < editor.lineCount(); line++) {
		if (editor.getLine(line).trim() === "---") {
			return line;
		}
	}

	return -1;
};

const expandStartLine = (
	editor: Editor,
	startLine: number,
	fenceBlocks: FenceBlock[],
	frontmatterEnd: number,
): number => {
	const minimumLine = frontmatterEnd >= 0 ? frontmatterEnd + 1 : 0;
	let current = startLine;
	let candidate = startLine - 1;

	while (candidate >= minimumLine) {
		const lineText = editor.getLine(candidate);
		if (isBlankCalloutLine(lineText)) break;

		const fenceBlock = findFenceBlockAtLine(fenceBlocks, candidate);
		if (fenceBlock) {
			current = fenceBlock.startLine;
			candidate = fenceBlock.startLine - 1;
			continue;
		}

		current = candidate;
		candidate -= 1;
	}

	return current;
};

const expandEndLine = (
	editor: Editor,
	endLine: number,
	fenceBlocks: FenceBlock[],
): number => {
	const maxLine = editor.lineCount() - 1;
	let current = endLine;
	let candidate = endLine + 1;

	while (candidate <= maxLine) {
		const lineText = editor.getLine(candidate);
		if (isBlankCalloutLine(lineText)) break;

		const fenceBlock = findFenceBlockAtLine(fenceBlocks, candidate);
		if (fenceBlock) {
			current = fenceBlock.endLine;
			candidate = fenceBlock.endLine + 1;
			continue;
		}

		current = candidate;
		candidate += 1;
	}

	return current;
};

const findFirstNonEmptyLine = (
	editor: Editor,
	startLine: number,
	endLine: number,
): number => {
	for (let line = startLine; line <= endLine; line++) {
		if (!isBlankCalloutLine(editor.getLine(line))) {
			return line;
		}
	}

	return -1;
};

const buildPrefix = (nestLevel: number): string => "> ".repeat(nestLevel);

const isCalloutHeaderLine = (line: string): boolean => {
	const stripped = stripLeadingQuoteTokens(line);
	return (
		stripped.removedUnits > 0 && CALLOUT_HEADER_REGEX.test(stripped.text)
	);
};

const findContainingCallout = (
	editor: Editor,
	line: number,
): CalloutBlockInfo | null => {
	let deepestAllowedLevel = countLeadingQuoteTokens(editor.getLine(line));
	if (deepestAllowedLevel === 0) {
		return null;
	}

	let headerLine = -1;
	let calloutLevel = 0;

	for (let current = line; current >= 0; current--) {
		const text = editor.getLine(current);
		const currentLevel = countLeadingQuoteTokens(text);

		if (text.trim() === "" || currentLevel === 0) {
			return null;
		}

		if (currentLevel < deepestAllowedLevel) {
			deepestAllowedLevel = currentLevel;
		}

		if (isCalloutHeaderLine(text) && currentLevel <= deepestAllowedLevel) {
			headerLine = current;
			calloutLevel = currentLevel;
			break;
		}
	}

	if (headerLine < 0 || calloutLevel === 0) {
		return null;
	}

	let lastLine = headerLine;
	for (
		let current = headerLine + 1;
		current < editor.lineCount();
		current++
	) {
		const text = editor.getLine(current);
		if (text.trim() === "") break;
		if (countLeadingQuoteTokens(text) < calloutLevel) break;
		lastLine = current;
	}

	return {
		headerLine,
		lastLine,
		calloutLevel,
	};
};

const hasSelection = (editor: Editor): boolean => {
	const anchor = editor.getCursor("anchor");
	const head = editor.getCursor("head");
	return !arePositionsEqual(anchor, head);
};

const getOrderedCursorLines = (
	editor: Editor,
): {
	anchor: EditorPosition;
	head: EditorPosition;
	startLine: number;
	endLine: number;
} => {
	const anchor = editor.getCursor("anchor");
	const head = editor.getCursor("head");

	return {
		anchor,
		head,
		startLine: Math.min(anchor.line, head.line),
		endLine: Math.max(anchor.line, head.line),
	};
};
export const wrapSelectionInCallout = (
	editor: Editor,
	options?: { requireSelection?: boolean },
): boolean => {
	const lineCount = editor.lineCount();
	if (
		lineCount === 0 ||
		(lineCount === 1 && editor.getLine(0).trim() === "")
	) {
		new Notice(t("notice.nothingToWrap"));
		return false;
	}

	const selectionPresent = hasSelection(editor);
	if (options?.requireSelection && !selectionPresent) {
		return false;
	}

	const {
		head,
		startLine: rawStartLine,
		endLine: rawEndLine,
	} = getOrderedCursorLines(editor);
	let startLine = selectionPresent ? rawStartLine : head.line;
	let endLine = selectionPresent ? rawEndLine : head.line;

	const frontmatterEnd = findFrontmatterEnd(editor);
	if (frontmatterEnd >= 0 && startLine <= frontmatterEnd) {
		startLine = frontmatterEnd + 1;
		endLine = Math.max(endLine, startLine);
	}

	if (startLine >= lineCount) {
		new Notice(t("notice.nothingToWrap"));
		return false;
	}

	const fenceBlocks = collectFenceBlocks(editor);
	const startFence = findFenceBlockAtLine(fenceBlocks, startLine);
	if (startFence) {
		startLine = startFence.startLine;
	}
	const endFence = findFenceBlockAtLine(fenceBlocks, endLine);
	if (endFence) {
		endLine = endFence.endLine;
	}

	startLine = expandStartLine(editor, startLine, fenceBlocks, frontmatterEnd);
	endLine = expandEndLine(editor, endLine, fenceBlocks);

	if (startLine > endLine) {
		new Notice(t("notice.selectionContainsNoContent"));
		return false;
	}

	const firstContentLine = findFirstNonEmptyLine(editor, startLine, endLine);
	if (firstContentLine < 0) {
		new Notice(t("notice.selectionContainsNoContent"));
		return false;
	}

	const nestLevel = countLeadingQuoteTokens(editor.getLine(firstContentLine));
	const prefix = buildPrefix(nestLevel);
	const wrappingExistingCallout = isCalloutHeaderLine(
		editor.getLine(firstContentLine),
	);
	const headerPrefix = buildPrefix(
		Math.max(nestLevel - (wrappingExistingCallout ? 1 : 0), 0),
	);
	const headerLine = `${headerPrefix}> [!`;
	const replacementLines: string[] = [headerLine];

	for (let line = startLine; line <= endLine; line++) {
		const current = editor.getLine(line);
		if (isBlankCalloutLine(current)) {
			const existingRelativeDepth = Math.max(
				countLeadingQuoteTokens(current) - nestLevel,
				0,
			);
			replacementLines.push(
				`${buildPrefix(nestLevel + existingRelativeDepth)}>`,
			);
			continue;
		}

		const stripped = stripLeadingQuoteTokens(current, nestLevel);
		replacementLines.push(`${prefix}> ${stripped.text}`);
	}

	const replacement = replacementLines.join("\n");
	editor.replaceRange(
		replacement,
		{ line: startLine, ch: 0 },
		{ line: endLine, ch: editor.getLine(endLine).length },
	);
	editor.setCursor({ line: startLine, ch: headerLine.length });

	return true;
};

export const unwrapCalloutAtSelection = (editor: Editor): boolean => {
	const { head, startLine } = getOrderedCursorLines(editor);
	const currentLine = hasSelection(editor) ? startLine : head.line;
	const block = findContainingCallout(editor, currentLine);
	if (!block) {
		new Notice(t("notice.cursorNotInsideCallout"));
		return false;
	}

	const bodyLines: string[] = [];
	const strippedLines: QuoteStripResult[] = [];
	for (let line = block.headerLine + 1; line <= block.lastLine; line++) {
		const stripped = stripLeadingQuoteTokens(editor.getLine(line), 1);
		bodyLines.push(stripped.text);
		strippedLines.push(stripped);
	}

	const replacement = bodyLines.join("\n");
	editor.replaceRange(
		replacement,
		{ line: block.headerLine, ch: 0 },
		{
			line: block.lastLine,
			ch: editor.getLine(block.lastLine).length,
		},
	);

	if (bodyLines.length === 0) {
		editor.setCursor({ line: block.headerLine, ch: 0 });
		return true;
	}

	if (head.line <= block.headerLine) {
		editor.setCursor({ line: block.headerLine, ch: 0 });
		return true;
	}

	const originalLine = Math.min(head.line, block.lastLine);
	const bodyIndex = Math.min(
		Math.max(originalLine - block.headerLine - 1, 0),
		bodyLines.length - 1,
	);
	const stripped = strippedLines[bodyIndex] ?? {
		text: bodyLines[bodyIndex] ?? "",
		removedLength: 0,
		removedUnits: 0,
	};
	const targetLine = block.headerLine + bodyIndex;
	const targetCh = Math.min(
		Math.max(head.ch - stripped.removedLength, 0),
		bodyLines[bodyIndex]?.length ?? 0,
	);
	editor.setCursor({ line: targetLine, ch: targetCh });

	return true;
};
