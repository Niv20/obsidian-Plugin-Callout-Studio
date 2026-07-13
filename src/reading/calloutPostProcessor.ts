/**
 * reading/calloutPostProcessor.ts — Reading-view rendering for the heading
 * and inline callout roles.
 *
 * Registered as a markdown post-processor (main.ts). Runs once per rendered
 * block with cheap bail-outs, so the per-keystroke cost in reading view is
 * negligible:
 *   1. both roles disabled → return
 *   2. block text contains no `[!` → return
 *
 * Heading blocks (`# [!id]± title`) are restyled IN PLACE — the hN element is
 * kept (outline, TOC and anchor links keep working) and gains the bar class,
 * while the `[!id]±` prefix text is swapped for the shared token DOM.
 *
 * Inline `[!id]` occurrences in any other text are replaced with pill spans.
 *
 * Internal links referencing a heading callout (wikilinks and TOC-plugin
 * output) get their display text cleaned — see transformHeadingRefLinks.
 *
 * Escapes: markdown rendering consumes the `\` of `\[!id]`, so the rendered
 * text looks identical to a real token. The block's SOURCE (via
 * ctx.getSectionInfo) is consulted lazily — and the full escape-pairing pass
 * runs only when the source actually contains `\[!`.
 */
import type { MarkdownPostProcessorContext } from "obsidian";
import type { PluginSettings } from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import {
	RENDERED_HEADING_TOKEN_RE,
	parseHeadingRefDisplayText,
	scanLineForCalloutTokens,
	stripInlineCode,
} from "../editor/calloutTokens";
import {
	CSS_HEADING_LINE,
	CSS_HEADING_TOKEN,
	CSS_INLINE_TOKEN,
	CSS_REF_TOKEN_LINK,
	CSS_UNKNOWN,
	buildCalloutTokenDom,
	resolveCalloutDef,
} from "../editor/renderShared";
import { normalizeCalloutId } from "../utils/calloutId";

/** Narrow structural host type (avoids importing the concrete plugin class). */
export interface ReadingRenderHost {
	registry: CalloutRegistry;
	settings: PluginSettings;
}

/** Elements whose text must never be turned into pills. */
const PILL_EXCLUDE_SELECTOR = [
	"code",
	"pre",
	".math",
	`.${CSS_INLINE_TOKEN}`,
	`.${CSS_HEADING_TOKEN}`,
	// Regular-callout titles: Live Preview cannot decorate inside Obsidian's
	// native callout widget title, so reading view skips them too for parity.
	".callout-title",
	"a",
].join(", ");

export function createCalloutReadingPostProcessor(
	host: ReadingRenderHost,
): (el: HTMLElement, ctx: MarkdownPostProcessorContext) => void {
	return (el, ctx) => {
		const headingEnabled = host.settings.headingCallouts.enabled;
		const inlineEnabled = host.settings.inlineCallouts.enabled;
		if (!headingEnabled && !inlineEnabled) return;
		if ((el.textContent ?? "").indexOf("[!") === -1) return;

		// Lazy section source: fetched at most once per block, and only when
		// a candidate match makes it necessary.
		let sectionLines: string[] | null | undefined;
		const getSectionLines = (): string[] | null => {
			if (sectionLines !== undefined) return sectionLines;
			const info = ctx.getSectionInfo(el);
			sectionLines = info
				? info.text
						.split("\n")
						.slice(info.lineStart, info.lineEnd + 1)
				: null;
			return sectionLines;
		};

		if (headingEnabled) {
			const headings =
				el.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6");
			// Source lines are only authoritative when el is a single
			// reading-view block (one heading). A multi-heading el is the
			// print/PDF-export path, where getSectionInfo is null anyway —
			// trust the rendered text there.
			const linesGetter =
				headings.length === 1 ? getSectionLines : () => null;
			for (const h of Array.from(headings)) {
				transformHeading(h, host, linesGetter);
			}
		}
		if (headingEnabled && host.settings.headingCallouts.refCleanTitles) {
			transformHeadingRefLinks(el, host);
		}
		if (inlineEnabled) {
			transformInlinePills(el, host, getSectionLines);
		}
	};
}

/** First non-empty text node directly usable for the heading token match. */
function findLeadingTextNode(h: HTMLElement): Text | null {
	for (const child of Array.from(h.childNodes)) {
		if (child.nodeType === Node.TEXT_NODE) {
			if ((child.textContent ?? "").trim().length > 0)
				return child as Text;
			continue;
		}
		// Skip Obsidian's heading collapse indicator (and similar chrome)
		// that precedes the heading text when "Fold heading" is enabled.
		if (
			child.nodeType === Node.ELEMENT_NODE &&
			(child as Element).classList.contains(
				"heading-collapse-indicator",
			)
		) {
			continue;
		}
		// Any other element before the text means the heading does not start
		// with a plain `[!id]` token.
		return null;
	}
	return null;
}

/**
 * Restyle `# [!id]± title` headings in place. The block's first source line
 * is authoritative when available: it rejects escaped tokens (`# \[!id]`),
 * heading-like lines inside callouts (`> # [!id]` — those are inline pills),
 * and link syntax (`# [!id](url)`).
 */
function transformHeading(
	h: HTMLElement,
	host: ReadingRenderHost,
	getSectionLines: () => string[] | null,
): void {
	const textNode = findLeadingTextNode(h);
	if (!textNode) return;
	const renderedMatch = RENDERED_HEADING_TOKEN_RE.exec(
		textNode.textContent ?? "",
	);
	if (!renderedMatch) return;

	let rawId: string;
	let hasTitle: boolean;
	const lines = getSectionLines();
	if (lines) {
		const headToken = scanLineForCalloutTokens(lines[0] ?? "").find(
			(t) => t.role === "heading",
		);
		if (!headToken) return; // escaped / link / not a heading-callout block
		rawId = headToken.rawId;
		hasTitle = headToken.hasTitle;
	} else {
		// No source info (embeds, some export paths): trust the rendered text.
		rawId = renderedMatch[1] ?? "";
		hasTitle =
			(textNode.textContent ?? "").length > renderedMatch[0].length ||
			textNode.nextSibling !== null;
		if (!rawId.trim()) return;
	}

	const { unknown } = resolveCalloutDef(host.registry, rawId);
	h.classList.add(CSS_HEADING_LINE);
	if (unknown) h.classList.add(CSS_UNKNOWN);
	h.setAttribute("data-callout", normalizeCalloutId(rawId));

	// Strip the `[!id]± ` prefix from the rendered text and put the token
	// DOM (icon + optional name) in its place.
	textNode.textContent = (textNode.textContent ?? "").slice(
		renderedMatch[0].length,
	);
	const tokenEl = buildCalloutTokenDom(h.ownerDocument, {
		rawId,
		registry: host.registry,
		variant: "heading",
		showName: !hasTitle,
	});
	h.insertBefore(tokenEl, textNode);
}

/**
 * Clean heading-callout references in rendered internal links: strip the
 * `[!id]` token from the display text and (optionally) put the callout's
 * colored icon in its place. Covers plain wikilinks (`[[#[!id] Title]]`
 * displays `#[!id] Title`) and links generated by TOC plugins, whose alias is
 * the bare heading text (`[!id] Title`) — TOC code blocks render through
 * MarkdownRenderer, which runs this post-processor in both preview modes.
 *
 * Only the display DOM changes; the href/data-href keeps the raw heading, so
 * navigation is untouched. Aliased links never match (their display text
 * carries no token). Links inside a native callout's title are skipped for
 * parity with Live Preview, which leaves whole `> [!id]` lines to Obsidian.
 */
function transformHeadingRefLinks(
	el: HTMLElement,
	host: ReadingRenderHost,
): void {
	const anchors = el.querySelectorAll<HTMLAnchorElement>("a.internal-link");
	if (anchors.length === 0) return;
	const doc = el.ownerDocument;
	for (const anchor of Array.from(anchors)) {
		const href =
			anchor.getAttribute("data-href") ??
			anchor.getAttribute("href") ??
			"";
		if (!href.includes("#")) continue;
		if (anchor.closest(".callout-title")) continue;
		const textNode = anchor.firstChild;
		if (!textNode || textNode.nodeType !== Node.TEXT_NODE) continue;
		const token = parseHeadingRefDisplayText(textNode.nodeValue ?? "");
		if (!token) continue;

		const { def, unknown } = resolveCalloutDef(host.registry, token.rawId);
		const title =
			token.title.trim() !== ""
				? token.title
				: unknown || !def
					? token.rawId.trim()
					: def.displayName;

		// A bare same-file `#` prefix is dropped (matching Live Preview);
		// `Note#`/`Note > ` prefixes stay. Then icon, then the cleaned
		// title — the icon sits exactly where the token was.
		textNode.nodeValue = token.prefix === "#" ? "" : token.prefix;
		const after = textNode.nextSibling;
		if (host.settings.headingCallouts.refShowIcon && def) {
			const iconEl = buildCalloutTokenDom(doc, {
				rawId: token.rawId,
				registry: host.registry,
				variant: "ref",
				showName: false,
			});
			// Inside the anchor — continue the link underline under the icon.
			iconEl.classList.add(CSS_REF_TOKEN_LINK);
			anchor.insertBefore(iconEl, after);
		}
		anchor.insertBefore(doc.createTextNode(title), after);

		// A truncated token means Obsidian cut the link at the first `]]` of
		// the `]]]` run, leaving the token's own `]` as stray text right
		// after the anchor — swallow that one bracket.
		if (token.truncated) {
			const stray = anchor.nextSibling;
			if (
				stray &&
				stray.nodeType === Node.TEXT_NODE &&
				(stray.nodeValue ?? "").startsWith("]")
			) {
				const rest = (stray.nodeValue ?? "").slice(1);
				if (rest === "") stray.remove();
				else stray.nodeValue = rest;
			}
		}
	}
}

/**
 * True when `node` is the leading text node of a heading element. A token
 * starting there is heading-role by definition (it followed `#…` in source)
 * and must never degrade into an inline pill — even when transformHeading
 * skipped the heading (export DOM shapes, unexpected chrome before the text).
 * After a successful heading transform the token DOM element precedes the
 * remaining title text, so findLeadingTextNode returns null and genuine
 * inline tokens inside the title are unaffected.
 */
function isHeadingLeadingTextNode(node: Text): boolean {
	const h = node.parentElement?.closest<HTMLElement>("h1,h2,h3,h4,h5,h6");
	if (!h) return false;
	return findLeadingTextNode(h) === node;
}

/** A pill candidate found in the rendered DOM. */
interface PillCandidate {
	node: Text;
	from: number;
	to: number;
	rawId: string;
}

/**
 * Replace `[!id]` occurrences in the block's text nodes with pill spans.
 * Runs after the heading transform, so a heading's own token is already
 * consumed and only genuine inline occurrences remain.
 */
function transformInlinePills(
	el: HTMLElement,
	host: ReadingRenderHost,
	getSectionLines: () => string[] | null,
): void {
	const doc = el.ownerDocument;
	const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) => {
			if ((node.textContent ?? "").indexOf("[!") === -1)
				return NodeFilter.FILTER_REJECT;
			const parent = node.parentElement;
			if (!parent || parent.closest(PILL_EXCLUDE_SELECTOR))
				return NodeFilter.FILTER_REJECT;
			return NodeFilter.FILTER_ACCEPT;
		},
	});

	// Snapshot candidates before mutating (other plugins' post-processors and
	// our own splitting must not confuse the walk).
	const candidates: PillCandidate[] = [];
	for (
		let node = walker.nextNode();
		node !== null;
		node = walker.nextNode()
	) {
		const text = node.textContent ?? "";
		// Rendered text is never a blockquote/heading source line, so every
		// token the shared classifier finds here is an inline candidate.
		for (const token of scanLineForCalloutTokens(text)) {
			if (token.role !== "inline") continue;
			if (
				token.from === 0 &&
				host.settings.headingCallouts.enabled &&
				isHeadingLeadingTextNode(node as Text)
			) {
				continue;
			}
			candidates.push({
				node: node as Text,
				from: token.from,
				to: token.to,
				rawId: token.rawId,
			});
		}
	}
	if (candidates.length === 0) return;

	// Escape handling: only when the source really contains `\[!` do we pay
	// for the pairing pass; otherwise every candidate is a real token.
	const escaped = resolveEscapedCandidates(candidates.length, getSectionLines);

	// Replace per node in reverse order so earlier offsets stay valid.
	for (let i = candidates.length - 1; i >= 0; i--) {
		if (escaped[i]) continue;
		const c = candidates[i]!;
		// First split leaves the post-token tail in place; the second isolates
		// the token text itself, which the pill then replaces.
		c.node.splitText(c.to);
		const tokenPart = c.node.splitText(c.from);
		const pill = buildCalloutTokenDom(doc, {
			rawId: c.rawId,
			registry: host.registry,
			variant: "inline",
			showName: true,
		});
		tokenPart.replaceWith(pill);
	}
}

/**
 * Decide which rendered candidates came from escaped `\[!id]` source. The
 * markdown renderer preserves occurrence order, so the i-th rendered
 * candidate corresponds to the i-th visible `[!` occurrence in the source
 * (real inline tokens and escaped tokens merged by position). When the
 * source is unavailable or the counts disagree, everything renders — a
 * missing escape is a milder failure than a missing pill.
 */
function resolveEscapedCandidates(
	count: number,
	getSectionLines: () => string[] | null,
): boolean[] {
	const noEscapes = new Array<boolean>(count).fill(false);
	const lines = getSectionLines();
	if (!lines) return noEscapes;
	const source = lines.join("\n");
	if (source.indexOf("\\[!") === -1) return noEscapes;

	const sequence: boolean[] = [];
	const escapedTokenRe = /\\\[!([^\][\n\r]+)\]/g;
	for (const rawLine of lines) {
		const line = stripInlineCode(rawLine);
		const entries: Array<{ pos: number; escaped: boolean }> = [];
		for (const token of scanLineForCalloutTokens(line)) {
			if (token.role !== "inline") continue;
			entries.push({ pos: token.from, escaped: false });
		}
		escapedTokenRe.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = escapedTokenRe.exec(line)) !== null) {
			// +1: the visible text starts at the `[`, after the backslash.
			entries.push({ pos: m.index + 1, escaped: true });
		}
		entries.sort((a, b) => a.pos - b.pos);
		for (const e of entries) sequence.push(e.escaped);
	}

	// Source and DOM disagree (nested renderers, exotic markdown) — render all.
	if (sequence.length !== count) return noEscapes;
	return sequence;
}
