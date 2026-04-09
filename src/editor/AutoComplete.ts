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

export class CalloutAutoComplete extends EditorSuggest<CalloutDefinition> {
	private plugin: CalloutStudioPlugin;

	constructor(plugin: CalloutStudioPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.limit = plugin.settings.autocomplete.maxSuggestions;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null
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

	getSuggestions(context: EditorSuggestContext): CalloutDefinition[] {
		const query = context.query.toLowerCase();
		const all = this.plugin.registry.getAll();
		const maxResults = this.plugin.settings.autocomplete.maxSuggestions;

		// Filter
		const filtered = all.filter(
			(d) =>
				d.id.toLowerCase().includes(query) ||
				d.displayName.toLowerCase().includes(query)
		);

		// Sort: user-defined first, then built-in, alphabetical within each group
		filtered.sort((a, b) => {
			if (a.builtIn !== b.builtIn) return a.builtIn ? 1 : -1;
			return a.displayName.localeCompare(b.displayName);
		});

		return filtered.slice(0, maxResults);
	}

	renderSuggestion(def: CalloutDefinition, el: HTMLElement): void {
		el.addClass("callout-studio-suggestion");

		const { autocomplete } = this.plugin.settings;

		// Icon
		if (autocomplete.showIconPreviews) {
			const iconEl = el.createDiv({ cls: "callout-studio-suggestion-icon" });
			try {
				if (def.icon.type === "lucide") {
					setIcon(iconEl, def.icon.value);
				} else if (def.icon.type === "emoji") {
					iconEl.textContent = def.icon.value;
				} else {
					setIcon(iconEl, "pencil");
				}
			} catch {
				iconEl.textContent = "📝";
			}
		}

		// Color badge
		if (autocomplete.showColorPreviews) {
			const badgeEl = el.createDiv({ cls: "callout-studio-suggestion-badge" });
			const isDark = document.body.classList.contains("theme-dark");
			badgeEl.style.backgroundColor = isDark ? def.colorDark : def.colorLight;
		}

		// Text container
		const textEl = el.createDiv({ cls: "callout-studio-suggestion-text" });
		textEl.createDiv({ cls: "callout-studio-suggestion-name", text: def.displayName });
		textEl.createDiv({ cls: "callout-studio-suggestion-id", text: def.id });
	}

	selectSuggestion(def: CalloutDefinition): void {
		if (!this.context) return;
		const { editor, start, end } = this.context;

		const foldMark = def.foldable ? (def.defaultFolded ? "-" : "+") : "";
		const replacement = `[!${def.id}]${foldMark} ${def.displayName}`;

		editor.replaceRange(replacement, start, end);
	}
}
