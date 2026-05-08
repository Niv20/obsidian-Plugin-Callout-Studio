/**
 * constants.ts — Global constants and default callout definitions.
 *
 * Exports compile-time constants (MAX_TAG_LENGTH, HEAVY_VAULT_FILE_THRESHOLD,
 * DEFAULT_SETTINGS) and the DEFAULT_CALLOUTS array that seeds the registry with
 * Obsidian's built-in callout types on first load.
 * Imported by CalloutRegistry (for defaults), main.ts (for threshold checks),
 * and several utility/settings modules.
 */
import type {
	CalloutDefinition,
	GlobalStyleSettings,
	PluginSettings,
} from "./types";

/** Maximum characters allowed per callout ID */
export const MAX_TAG_LENGTH: number = 10;

/** Maximum number of IDs (aliases) allowed per callout */
export const MAX_TAGS_COUNT: number = 4;

/**
 * First-run vault-scan threshold (number of markdown files).
 *
 * On the very first plugin install:
 * - If `vault.getMarkdownFiles().length < HEAVY_VAULT_FILE_THRESHOLD` →
 *   the vault is auto-scanned silently in the background (a Notice is
 *   shown when callouts are found).
 * - If `>= HEAVY_VAULT_FILE_THRESHOLD` → a one-time modal asks the user
 *   whether to scan now or skip (they can always run it later from
 *   Settings → Vault insights & maintenance → Re-scan vault).
 *
 * Tweak this value while testing to see both UX paths. Purely a UI/UX
 * threshold — does not affect what the scan itself does.
 */
export const HEAVY_VAULT_FILE_THRESHOLD: number = 500;

export const DEFAULT_CALLOUTS: CalloutDefinition[] = [
	{
		id: "note",
		displayName: "Note",
		icon: { type: "lucide", value: "pencil" },
		colorLight: "#448aff",
		colorDark: "#448aff",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "abstract",
		displayName: "Abstract",
		icon: { type: "lucide", value: "clipboard-list" },
		colorLight: "#00bcd4",
		colorDark: "#00bcd4",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["summary", "tldr"],
	},
	{
		id: "info",
		displayName: "Info",
		icon: { type: "lucide", value: "info" },
		colorLight: "#448aff",
		colorDark: "#448aff",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "todo",
		displayName: "Todo",
		icon: { type: "lucide", value: "check-circle-2" },
		colorLight: "#448aff",
		colorDark: "#448aff",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "tip",
		displayName: "Tip",
		icon: { type: "lucide", value: "flame" },
		colorLight: "#00bfa5",
		colorDark: "#00bfa5",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["hint", "important"],
	},
	{
		id: "success",
		displayName: "Success",
		icon: { type: "lucide", value: "check" },
		colorLight: "#00c853",
		colorDark: "#00c853",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["check", "done"],
	},
	{
		id: "question",
		displayName: "Question",
		icon: { type: "lucide", value: "help-circle" },
		colorLight: "#ff9100",
		colorDark: "#ff9100",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["help", "faq"],
	},
	{
		id: "warning",
		displayName: "Warning",
		icon: { type: "lucide", value: "alert-triangle" },
		colorLight: "#ff9100",
		colorDark: "#ff9100",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["caution", "attention"],
	},
	{
		id: "failure",
		displayName: "Failure",
		icon: { type: "lucide", value: "x" },
		colorLight: "#ff5252",
		colorDark: "#ff5252",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["fail", "missing"],
	},
	{
		id: "danger",
		displayName: "Danger",
		icon: { type: "lucide", value: "zap" },
		colorLight: "#ff1744",
		colorDark: "#ff1744",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["error"],
	},
	{
		id: "bug",
		displayName: "Bug",
		icon: { type: "lucide", value: "bug" },
		colorLight: "#ff5252",
		colorDark: "#ff5252",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "example",
		displayName: "Example",
		icon: { type: "lucide", value: "list" },
		colorLight: "#7c4dff",
		colorDark: "#7c4dff",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "quote",
		displayName: "Quote",
		icon: { type: "lucide", value: "quote" },
		colorLight: "#9e9e9e",
		colorDark: "#9e9e9e",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
		aliases: ["cite"],
	},
];

export const DEFAULT_SETTINGS: PluginSettings = {
	globalStyle: {
		borderSides: { top: false, right: false, bottom: false, left: false },
		borderWidth: 2.5,
		titleScale: 1,
		contentScale: 1,
		borderRadius: 4,
	} satisfies GlobalStyleSettings,
	contextMenu: {
		enabled: true,
		showEditCallout: true,
		showOpenSettings: true,
		showCopyMarkdown: true,
	},
	autocomplete: {
		enabled: true,
		showIconPreviews: true,
		showColorPreviews: true,
	},
	iconSources: {
		materialStyleDefault: "rounded",
		materialWeightDefault: 300,
		lastMaterialCategory: "Actions",
	},
	firstRunCompleted: false,
	fallbackCalloutId: "note",
};
