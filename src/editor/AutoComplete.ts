/**
 * editor/AutoComplete.ts — In-editor autocomplete for callout IDs.
 *
 * Extends Obsidian's EditorSuggest to show a dropdown of known callout types
 * whenever the user types `[!` in any of the three role positions: after a
 * blockquote prefix (`> [!` — regular callout), after heading hashes
 * (`## [!` — heading callout), or mid-line (inline pill). Selecting a
 * suggestion inserts role-appropriate markdown, and Enter placement differs
 * per role (see close()/selectSuggestion). The "Create new" row opens the
 * CalloutEditor pre-filled with the typed query in all three contexts.
 */
import {
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
	setIcon,
} from "obsidian";
import type CalloutStudioPlugin from "../main";
import type { CalloutDefinition, CalloutRenderRole } from "../types";
import { CalloutEditor } from "../settings/CalloutEditor";
import { getLocale, t } from "../i18n";
import {
	getSortedCalloutIds,
	sortCalloutsByDisplayName,
} from "../utils/sorting";

const CALLOUT_QUOTE_PREFIX_REGEX = /^((?:\s*> ?|\t)+)/;

const countQuoteTokens = (prefix: string): number =>
	(prefix.match(/>/g) ?? []).length;

/** Heading hashes + whitespace and nothing else before the `[!` trigger. */
const HEADING_TRIGGER_PREFIX_REGEX = /^#{1,6}[ \t]+$/;

/**
 * Move the cursor to the start of the line below `line`, creating a plain
 * new line at end-of-document. Used after a heading-callout selection.
 */
function moveCursorToLineBelow(editor: Editor, line: number): void {
	const nextLine = line + 1;
	if (nextLine < editor.lineCount()) {
		editor.setCursor({ line: nextLine, ch: 0 });
		return;
	}
	editor.replaceRange("\n", { line, ch: editor.getLine(line).length });
	editor.setCursor({ line: nextLine, ch: 0 });
}

interface CreateNewSuggestion {
	__createNew: true;
	query: string;
}

type CalloutSuggestion = CalloutDefinition | CreateNewSuggestion;

function isCreateNew(s: CalloutSuggestion): s is CreateNewSuggestion {
	return (s as CreateNewSuggestion).__createNew === true;
}

export class CalloutAutoComplete extends EditorSuggest<CalloutSuggestion> {
	private plugin: CalloutStudioPlugin;
	private pendingEditor: Editor | null = null;
	private pendingLine = -1;
	/** Role of the pending post-close cursor placement. */
	private pendingRole: CalloutRenderRole = "regular";
	/** Role classified by the latest onTrigger; read by selectSuggestion. */
	private triggerRole: CalloutRenderRole = "regular";

	constructor(plugin: CalloutStudioPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	close(): void {
		const editor = this.pendingEditor;
		const line = this.pendingLine;
		const role = this.pendingRole;
		this.pendingEditor = null;
		this.pendingLine = -1;
		this.pendingRole = "regular";
		super.close();

		if (editor && line >= 0) {
			window.requestAnimationFrame(() => {
				window.setTimeout(() => {
					if (role === "heading") {
						// Heading callout: Enter drops the cursor to the
						// START of the next line — plain, with NO `>` prefix
						// (a heading callout has no body of its own).
						moveCursorToLineBelow(editor, line);
						return;
					}

					const lineText = editor.getLine(line);
					const quoteMatch =
						CALLOUT_QUOTE_PREFIX_REGEX.exec(lineText);
					const quotePrefix = quoteMatch?.[1] ?? "> ";
					const quoteDepth = countQuoteTokens(quotePrefix);
					const nextLine = line + 1;

					if (nextLine < editor.lineCount()) {
						const nextLineText = editor.getLine(nextLine);
						const nextPrefix =
							CALLOUT_QUOTE_PREFIX_REGEX.exec(
								nextLineText,
							)?.[1] ?? "";
						const nextDepth = countQuoteTokens(nextPrefix);
						const targetPrefix =
							nextDepth >= quoteDepth ? nextPrefix : quotePrefix;

						if (nextPrefix !== targetPrefix) {
							editor.replaceRange(
								targetPrefix,
								{ line: nextLine, ch: 0 },
								{ line: nextLine, ch: nextPrefix.length },
							);
						}

						editor.setCursor({
							line: nextLine,
							ch: targetPrefix.length,
						});
						return;
					}

					const endPos = { line, ch: lineText.length };
					editor.replaceRange("\n" + quotePrefix, endPos);
					editor.setCursor({
						line: line + 1,
						ch: quotePrefix.length,
					});
				}, 50);
			});
		}
	}

	/**
	 * Opens the suggest popover for a `[!` that was inserted programmatically
	 * (by the "Insert empty callout" / "Wrap in callout" commands). Obsidian's
	 * suggest manager only re-evaluates `onTrigger` on real keystrokes, so
	 * those commands otherwise leave the cursor after `[!` with no popup.
	 *
	 * We route through the workspace's internal EditorSuggests manager rather
	 * than calling `open()` ourselves. That is what registers us as the
	 * manager's `currentSuggest`, so the popover then behaves exactly like a
	 * natively-typed `!`: it follows the editor on scroll and auto-closes when
	 * the `!` is deleted. Calling `open()` directly produces a detached popover
	 * that ignores scroll, never closes on delete, and stays stuck on screen.
	 *
	 * The `true` third argument forces the manager to fetch suggestions and set
	 * itself as the current suggest even though we aren't already open. Deferred
	 * a frame so CM6 has flushed the insert and (when run from the command
	 * palette) focus has returned to the editor — the manager no-ops unless the
	 * editor is focused, hence the explicit `focus()`.
	 */
	triggerNow(editor: Editor, file: TFile | null): void {
		if (!file) return;
		window.requestAnimationFrame(() => {
			editor.focus();
			const manager = (
				this.app.workspace as unknown as {
					editorSuggest?: {
						trigger?: (
							editor: Editor,
							file: TFile,
							manual: boolean,
						) => void;
					};
				}
			).editorSuggest;
			manager?.trigger?.(editor, file, true);
		});
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		if (!this.plugin.settings.autocomplete.enabled) return null;

		const line = editor.getLine(cursor.line);
		// Look for the `[!` trigger by scanning backward from the cursor. Its
		// position on the line decides which render role is being typed.
		const textBefore = line.slice(0, cursor.ch);
		const triggerIdx = textBefore.lastIndexOf("[!");

		if (triggerIdx === -1) return null;

		// Never trigger for escaped tokens (`\[!`) or wikilinks (`[[!`).
		const charBefore = triggerIdx > 0 ? textBefore[triggerIdx - 1] : "";
		if (charBefore === "\\" || charBefore === "[") return null;

		// Classify the trigger position into a render role.
		const rawPrefix = textBefore.slice(0, triggerIdx);
		const trimmedPrefix = rawPrefix.trimStart();
		const { headingCallouts, inlineCallouts } = this.plugin.settings;
		let role: CalloutRenderRole;
		if (/^>[\s>]*$/.test(trimmedPrefix)) {
			// "> [!", ">> [!", … — a native blockquote callout header.
			role = "regular";
		} else if (HEADING_TRIGGER_PREFIX_REGEX.test(rawPrefix)) {
			// "## [!" — heading callout; no popup while the role is off.
			if (!headingCallouts.enabled) return null;
			role = "heading";
		} else if (trimmedPrefix === "") {
			// Bare "[!" at line start: an inline pill when the role is on;
			// otherwise keep the legacy regular-callout behavior.
			role = inlineCallouts.enabled ? "inline" : "regular";
		} else {
			// Any other text before the token — inline pill mid-line.
			if (!inlineCallouts.enabled) return null;
			role = "inline";
		}
		this.triggerRole = role;

		// Capture the full id token (from `[!` to the next `]`, or end of line),
		// independent of where the cursor sits within it. Reading only up to the
		// cursor would mis-filter a mid-token cursor (e.g. `[!dang|aaaaa]` would
		// match "Danger" instead of offering "Create new: dangaaaaa").
		const afterTrigger = line.slice(triggerIdx + 2);
		const closeIdx = afterTrigger.indexOf("]");
		const query =
			closeIdx === -1 ? afterTrigger : afterTrigger.slice(0, closeIdx);

		// Stop once the cursor moves past the id into the fold mark / title.
		const idEndCh = triggerIdx + 2 + query.length;
		if (cursor.ch > idEndCh) return null;

		return {
			start: { line: cursor.line, ch: triggerIdx },
			end: cursor,
			query,
		};
	}

	getSuggestions(context: EditorSuggestContext): CalloutSuggestion[] {
		const query = context.query.toLowerCase();
		// Exclude auto-created fallback rows only once Discovery's prune scan
		// has actually confirmed they're unused nowhere in the vault — e.g. a
		// token typed and abandoned before the async prune catches up. A
		// fallback row that's genuinely used elsewhere (just never adopted
		// via the editor) still autocompletes normally.
		const all = this.plugin.registry.getAll().filter(
			(d) =>
				d.source !== "fallback" ||
				d.customized === true ||
				!this.plugin.isKnownZeroUsageFallback(d.id),
		);

		// Filter
		const filtered = all.filter(
			(d) =>
				d.id.toLowerCase().includes(query) ||
				d.displayName.toLowerCase().includes(query) ||
				(d.aliases ?? []).some((a) => a.toLowerCase().includes(query)),
		);

		const sorted = sortCalloutsByDisplayName(filtered, getLocale());

		const result: CalloutSuggestion[] = [...sorted];
		// Append "Create new" if query is non-empty and no exact match
		const trimmed = context.query.trim();
		if (trimmed.length > 0) {
			const exact = all.some(
				(d) =>
					d.id.toLowerCase() === query ||
					(d.aliases ?? []).some((a) => a.toLowerCase() === query),
			);
			if (!exact) {
				result.push({ __createNew: true, query: trimmed });
			}
		}
		return result;
	}

	renderSuggestion(item: CalloutSuggestion, el: HTMLElement): void {
		if (isCreateNew(item)) {
			el.addClass("callout-studio-suggestion");
			el.addClass("callout-studio-suggestion-create-new");
			const iconEl = el.createDiv({
				cls: "callout-studio-suggestion-icon",
			});
			setIcon(iconEl, "plus");
			const textEl = el.createDiv({
				cls: "callout-studio-suggestion-text",
			});
			textEl.createDiv({
				cls: "callout-studio-suggestion-name",
				text: t("autocomplete.createNew", { name: item.query }),
			});
			return;
		}
		const def = item;
		el.addClass("callout-studio-suggestion");

		const isDark = activeDocument.body.classList.contains("theme-dark");
		const color = isDark ? def.colorDark : def.colorLight;

		// Icon
		const iconEl = el.createDiv({
			cls: "callout-studio-suggestion-icon",
		});
		iconEl.style.color = color;
		try {
			if (def.icon.type === "lucide") {
				setIcon(iconEl, def.icon.value);
			} else if (def.icon.type === "emoji") {
				iconEl.textContent = def.icon.value;
			} else if (def.icon.type === "material") {
				const cached = this.plugin.registry.findMaterialSvg(
					def.icon.value,
					def.icon.style ?? "outlined",
					def.icon.weight ?? 400,
				);
				if (cached) {
					const parser = new DOMParser();
					const doc = parser.parseFromString(
						cached.svg,
						"image/svg+xml",
					);
					const svgEl = doc.documentElement;
					svgEl.setAttribute("fill", "currentColor");
					iconEl.appendChild(iconEl.doc.importNode(svgEl, true));
				} else {
					setIcon(iconEl, "pencil");
				}
			} else {
				setIcon(iconEl, "pencil");
			}
		} catch {
			iconEl.textContent = "📝";
		}

		// Text container
		const textEl = el.createDiv({ cls: "callout-studio-suggestion-text" });
		const nameEl = textEl.createDiv({
			cls: "callout-studio-suggestion-name",
			text: def.displayName,
		});
		nameEl.style.color = color;

		// Second line: id + aliases. When the user has typed something, show
		// only the ids/aliases that contain the query, keeping the matched
		// characters at the normal color — wherever they fall, not only at the
		// start — and fading the rest. With no query (or when only the display
		// name matched), show them all unfaded.
		const query = (this.context?.query ?? "").toLowerCase();
		const allIds = getSortedCalloutIds(def, getLocale());
		const matches =
			query.length > 0
				? allIds.filter((id) => id.toLowerCase().includes(query))
				: [];
		const toShow = matches.length > 0 ? matches : allIds;
		const highlight = query.length > 0 && matches.length > 0;

		const idEl = textEl.createDiv({
			cls: "callout-studio-suggestion-id",
		});
		const fade = (text: string) => {
			if (text)
				idEl.createSpan({
					cls: "callout-studio-suggestion-id-dim",
					text,
				});
		};
		toShow.forEach((id, i) => {
			if (i > 0) idEl.appendText(", ");
			if (highlight) {
				// Matched run stays normal; everything around it fades out.
				const at = id.toLowerCase().indexOf(query);
				fade(id.slice(0, at));
				idEl.appendText(id.slice(at, at + query.length));
				fade(id.slice(at + query.length));
			} else {
				idEl.appendText(id);
			}
		});
	}

	selectSuggestion(
		item: CalloutSuggestion,
		evt: MouseEvent | KeyboardEvent,
	): void {
		if (!this.context) return;
		if (evt instanceof KeyboardEvent) {
			evt.preventDefault();
			evt.stopPropagation();
		}

		// Handle "Create new" — open editor pre-filled with the typed query
		if (isCreateNew(item)) {
			const ctx = this.context;
			void this.openCreateForQuery(item.query, ctx);
			return;
		}

		const def = item;
		const { editor, start, end, query } = this.context;

		const line = editor.getLine(start.line);

		// If the user typed an alias, use that alias as the ID
		const queryLower = query.toLowerCase();
		const allIds = [def.id, ...(def.aliases ?? [])];
		const matchedId =
			allIds.find((id) => id.toLowerCase() === queryLower) ??
			allIds.find((id) => id.toLowerCase().startsWith(queryLower)) ??
			def.id;

		// Inline pill: only the token itself is written; Enter continues on
		// the same line (see insertInlineToken).
		if (this.triggerRole === "inline") {
			this.insertInlineToken(editor, start, end, line, matchedId);
			return;
		}

		// Parse what already exists after the `[!...]` on the line, starting from
		// the header (not the cursor) so a mid-token cursor doesn't truncate the
		// title detection. Pattern after `]`: optional fold mark (+/-), optional title.
		const afterTrigger = line.slice(start.ch + 2);
		const closeIdx = afterTrigger.indexOf("]");
		const afterHeader =
			closeIdx === -1 ? "" : afterTrigger.slice(closeIdx + 1);
		const restMatch = /^([+-]?)\s*(.*)$/.exec(afterHeader);
		const existingTitle = restMatch?.[2]?.trim() ?? "";

		const foldMark = def.foldable ? (def.defaultFolded ? "-" : "+") : "";

		// Replace from trigger start to end of line
		const lineEnd: EditorPosition = {
			line: end.line,
			ch: line.length,
		};

		// Heading callout: the rendered token already shows the display name,
		// so no title text is inserted; a custom title the user already wrote
		// is preserved. Enter then moves to the start of the next line (no
		// `>` prefix — heading callouts have no body), via close().
		if (this.triggerRole === "heading") {
			const replacement =
				`[!${matchedId}]${foldMark}` +
				(existingTitle ? ` ${existingTitle}` : "");
			editor.replaceRange(replacement, start, lineEnd);
			this.pendingEditor = editor;
			this.pendingLine = start.line;
			this.pendingRole = "heading";
			return;
		}

		// Regular callout header.
		// Detect if this is a brand-new callout (no title text after the header)
		const isNewCallout = existingTitle === "";

		// Check if the existing title matches any known callout display name
		const allDefs = this.plugin.registry.getAll();
		const isKnownCalloutName = allDefs.some(
			(d) => d.displayName.toLowerCase() === existingTitle.toLowerCase(),
		);

		// Decide what title to use
		let title: string;
		if (existingTitle === "" || isKnownCalloutName) {
			title = def.displayName;
		} else {
			title = existingTitle;
		}

		const replacement = `[!${matchedId}]${foldMark} ${title}`;
		editor.replaceRange(replacement, start, lineEnd);

		if (isNewCallout) {
			this.pendingEditor = editor;
			this.pendingLine = start.line;
			this.pendingRole = "regular";
		}
	}

	/**
	 * Insert an inline `[!id]` pill token: replaces only the typed token
	 * (never the rest of the line), guarantees one space after the `]`, and
	 * parks the cursor after that space so the user keeps writing on the
	 * SAME line — pressing Enter on a pill suggestion must not break the
	 * paragraph.
	 */
	private insertInlineToken(
		editor: Editor,
		start: EditorPosition,
		contextEnd: EditorPosition,
		line: string,
		insertId: string,
	): void {
		const afterTrigger = line.slice(start.ch + 2);
		const closeIdx = afterTrigger.indexOf("]");
		const tokenEnd: EditorPosition =
			closeIdx === -1
				? contextEnd
				: { line: start.line, ch: start.ch + 2 + closeIdx + 1 };
		const token = `[!${insertId}]`;
		editor.replaceRange(token, start, tokenEnd);

		const afterCh = start.ch + token.length;
		const newLine = editor.getLine(start.line);
		if (newLine[afterCh] !== " ") {
			editor.replaceRange(" ", { line: start.line, ch: afterCh });
		}
		editor.setCursor({ line: start.line, ch: afterCh + 1 });
	}

	private async openCreateForQuery(
		query: string,
		ctx: EditorSuggestContext,
	): Promise<void> {
		// Snapshot the role now: close() and the modal round-trip may let
		// another onTrigger run and overwrite triggerRole.
		const role = this.triggerRole;
		this.close();
		const editor = ctx.editor;
		const start = ctx.start;
		const end = ctx.end;
		const lineEnd: EditorPosition = {
			line: end.line,
			ch: editor.getLine(end.line).length,
		};
		const modal = new CalloutEditor(this.plugin, undefined, {
			seedDisplayName: query,
			createFromAutocomplete: true,
		});
		const result = await modal.openAndWait();
		if (!result) return;

		if (role === "inline") {
			editor.focus();
			this.insertInlineToken(
				editor,
				start,
				end,
				editor.getLine(start.line),
				result.id,
			);
			return;
		}

		const foldMark = result.foldable
			? result.defaultFolded
				? "-"
				: "+"
			: "";

		if (role === "heading") {
			// No title text — the rendered token shows the display name.
			editor.replaceRange(`[!${result.id}]${foldMark}`, start, lineEnd);
			// close() already ran (before the modal), so place the cursor
			// directly rather than via the pending mechanism.
			editor.focus();
			moveCursorToLineBelow(editor, start.line);
			return;
		}

		const replacement = `[!${result.id}]${foldMark} ${result.displayName}`;
		editor.replaceRange(replacement, start, lineEnd);
		this.pendingEditor = editor;
		this.pendingLine = start.line;
		this.pendingRole = "regular";
	}
}
