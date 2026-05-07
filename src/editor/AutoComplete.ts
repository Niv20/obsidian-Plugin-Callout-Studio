/**
 * editor/AutoComplete.ts — In-editor autocomplete for callout IDs.
 *
 * Extends Obsidian's EditorSuggest to show a dropdown of known callout types
 * whenever the user types `> [!` inside a note. Selecting a suggestion inserts
 * the callout header and optionally opens the CalloutEditor to create a new
 * type on-the-fly. Reads callout data from CalloutRegistry and uses the
 * sorting helpers from utils/sorting.
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
import type { CalloutDefinition } from "../types";
import { CalloutEditor } from "../settings/CalloutEditor";
import { getLocale, t } from "../i18n";
import {
	getSortedCalloutIds,
	sortCalloutsByDisplayName,
} from "../utils/sorting";

const CALLOUT_QUOTE_PREFIX_REGEX = /^((?:\s*> ?|\t)+)/;

const countQuoteTokens = (prefix: string): number =>
	(prefix.match(/>/g) ?? []).length;

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

	constructor(plugin: CalloutStudioPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	close(): void {
		const editor = this.pendingEditor;
		const line = this.pendingLine;
		this.pendingEditor = null;
		this.pendingLine = -1;
		super.close();

		if (editor && line >= 0) {
			window.requestAnimationFrame(() => {
				setTimeout(() => {
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

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		if (!this.plugin.settings.autocomplete.enabled) return null;

		const line = editor.getLine(cursor.line);
		// Look for `[!` pattern — could be at start of blockquote or standalone
		// We scan backward from cursor to find the `[!` trigger
		const textBefore = line.slice(0, cursor.ch);
		const triggerIdx = textBefore.lastIndexOf("[!");

		if (triggerIdx === -1) return null;

		// The trigger must either be at line start (optionally after "> ") or be a callout header
		const prefix = textBefore.slice(0, triggerIdx).trimStart();
		// Allow: "", ">", "> ", ">> ", etc. (any level of blockquote)
		if (prefix !== "" && !/^>[\s>]*$/.test(prefix)) return null;

		const query = textBefore.slice(triggerIdx + 2);

		// Don't trigger if there's a closing `]` already in the query portion
		if (query.includes("]")) return null;

		return {
			start: { line: cursor.line, ch: triggerIdx },
			end: cursor,
			query,
		};
	}

	getSuggestions(context: EditorSuggestContext): CalloutSuggestion[] {
		const query = context.query.toLowerCase();
		const all = this.plugin.registry.getAll();

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

		const { autocomplete } = this.plugin.settings;
		const isDark = document.body.classList.contains("theme-dark");
		const color = isDark ? def.colorDark : def.colorLight;

		// Icon
		if (autocomplete.showIconPreviews) {
			const iconEl = el.createDiv({
				cls: "callout-studio-suggestion-icon",
			});
			if (autocomplete.showColorPreviews) {
				iconEl.style.color = color;
			}
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
		}

		// Text container
		const textEl = el.createDiv({ cls: "callout-studio-suggestion-text" });
		const nameEl = textEl.createDiv({
			cls: "callout-studio-suggestion-name",
			text: def.displayName,
		});
		if (autocomplete.showColorPreviews) {
			nameEl.style.color = color;
		}

		// Show all IDs (main + aliases) on the same line
		const allIds = getSortedCalloutIds(def, getLocale());
		const idEl = textEl.createDiv({
			cls: "callout-studio-suggestion-id",
		});
		idEl.textContent = allIds.join(", ");
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

		const line = editor.getLine(end.line);

		// Consume a stray ']' that Obsidian may have auto-inserted
		const afterCursor = line.slice(end.ch);

		// Parse what already exists after the `[!...]` on the line
		// Pattern: optional ']', optional fold mark (+/-), optional ' Title...'
		const restMatch = /^(\]?)([+-]?)\s*(.*)$/.exec(afterCursor);
		const existingTitle = restMatch?.[3]?.trim() ?? "";

		// Detect if this is a brand-new callout (no title text after the header)
		const isNewCallout = existingTitle === "";

		// Check if the existing title matches any known callout display name
		const allDefs = this.plugin.registry.getAll();
		const isKnownCalloutName = allDefs.some(
			(d) => d.displayName.toLowerCase() === existingTitle.toLowerCase(),
		);

		// If the user typed an alias, use that alias as the ID
		const queryLower = query.toLowerCase();
		const allIds = [def.id, ...(def.aliases ?? [])];
		const matchedId =
			allIds.find((id) => id.toLowerCase() === queryLower) ??
			allIds.find((id) => id.toLowerCase().startsWith(queryLower)) ??
			def.id;

		// Decide what title to use
		let title: string;
		if (existingTitle === "" || isKnownCalloutName) {
			title = def.displayName;
		} else {
			title = existingTitle;
		}

		const foldMark = def.foldable ? (def.defaultFolded ? "-" : "+") : "";

		// Replace from trigger start to end of line
		const lineEnd: EditorPosition = {
			line: end.line,
			ch: line.length,
		};

		const replacement = `[!${matchedId}]${foldMark} ${title}`;
		editor.replaceRange(replacement, start, lineEnd);

		if (isNewCallout) {
			this.pendingEditor = editor;
			this.pendingLine = start.line;
		}
	}

	private async openCreateForQuery(
		query: string,
		ctx: EditorSuggestContext,
	): Promise<void> {
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
		const foldMark = result.foldable
			? result.defaultFolded
				? "-"
				: "+"
			: "";
		const replacement = `[!${result.id}]${foldMark} ${result.displayName}`;
		editor.replaceRange(replacement, start, lineEnd);
		this.pendingEditor = editor;
		this.pendingLine = start.line;
	}
}
