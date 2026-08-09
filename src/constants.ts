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
	CalloutIcon,
	CalloutRenderRole,
	ContextMenuItemConfig,
	GlobalStyleSettings,
	PluginSettings,
} from "./types";

/**
 * Generous safety cap on callout-ID length, applied only when validating
 * imported JSON (untrusted data). The editor itself enforces no length limit —
 * long IDs are truncated with an ellipsis in the UI and shown in full on hover.
 */
export const MAX_TAG_LENGTH: number = 200;

/** Maximum number of IDs (aliases) allowed per callout */
export const MAX_TAGS_COUNT: number = 4;

/**
 * Placeholder callout ID shown in the settings live preview only while the
 * callout being created has no ID yet (empty name). Once the user types a name,
 * the preview switches to the real ID being edited. Kept as a readable word so
 * that, on the rare empty-state moment, the preview reads as an intentional
 * example rather than an internal marker.
 */
export const PREVIEW_PLACEHOLDER_ID = "example";

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

/**
 * The icon a callout gets when the import it came from named one that does not
 * exist — a typo in hand-edited JSON, or a Callout Manager paste referring to an
 * icon this Obsidian does not ship.
 *
 * Lucide, because it is the only pack that needs no download and so is certain
 * to draw; `pencil` for the same reason `CSSInjector` uses it as the first-paint
 * placeholder. Deliberately a visible, ordinary icon rather than a warning
 * glyph: the import report already says which name was wrong, and the callout
 * itself is fine.
 */
export const FALLBACK_ICON: CalloutIcon = Object.freeze({
	type: "lucide",
	value: "lucide-pencil",
});

/**
 * The Obsidian CSS variable each built-in takes its accent from.
 *
 * These are core's own names, defined on `body` in `app.css`, and they are what
 * a theme redefines when it restyles callouts. `CSSInjector` hands an untouched
 * built-in this variable instead of a baked hex, so the plugin's own surfaces
 * (heading bars, inline pills, borders, icon tints) follow whatever the active
 * theme paints rather than pinning Material colours over it.
 *
 * `note` has no rule of its own in `app.css` — it falls through to the base
 * `.callout` rule — so it maps to `--callout-default` like every unrecognized
 * type. Aliases are deliberately absent: they resolve to their parent's
 * definition long before this map is read.
 */
export const OBSIDIAN_CALLOUT_VAR: Readonly<Record<string, string>> =
	Object.freeze({
		note: "--callout-default",
		abstract: "--callout-summary",
		info: "--callout-info",
		todo: "--callout-todo",
		tip: "--callout-tip",
		success: "--callout-success",
		question: "--callout-question",
		warning: "--callout-warning",
		failure: "--callout-fail",
		danger: "--callout-error",
		bug: "--callout-bug",
		example: "--callout-example",
		quote: "--callout-quote",
	});

/**
 * The 13 built-ins, coloured to match Obsidian.
 *
 * The hexes are the resolved values of {@link OBSIDIAN_CALLOUT_VAR} in core's
 * default theme, read out of the shipped `app.css` (`--color-blue` and friends
 * under `.theme-light` / `.theme-dark`). They are a *seed*, not the rendering
 * path: an untouched built-in never has its `--callout-color` overridden at all,
 * so what actually paints is the theme's. These values are what the editor
 * shows in its swatches, what a customized copy starts from, and what
 * `resetBuiltIn` restores.
 *
 * This is the first time a built-in's light and dark accents differ — Obsidian's
 * own palette shifts between themes (its `example` purple moves by ΔE00 15.4),
 * and carrying one value for both was a large part of why the plugin's colours
 * never quite matched. Backgrounds are still deliberately absent: a definition
 * with no `bgColorLight`/`bgColorDark` emits no background rule, which leaves
 * core's translucent fill in place and is what lets nested callouts step.
 */
export const DEFAULT_CALLOUTS: CalloutDefinition[] = [
	{
		id: "note",
		displayName: "Note",
		icon: { type: "lucide", value: "pencil" },
		colorLight: "#086ddd",
		colorDark: "#027aff",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "abstract",
		displayName: "Abstract",
		icon: { type: "lucide", value: "clipboard-list" },
		colorLight: "#00bfbc",
		colorDark: "#53dfdd",
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
		colorLight: "#086ddd",
		colorDark: "#027aff",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "todo",
		displayName: "Todo",
		icon: { type: "lucide", value: "check-circle-2" },
		colorLight: "#086ddd",
		colorDark: "#027aff",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "tip",
		displayName: "Tip",
		icon: { type: "lucide", value: "flame" },
		colorLight: "#00bfbc",
		colorDark: "#53dfdd",
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
		colorLight: "#08b94e",
		colorDark: "#44cf6e",
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
		colorLight: "#ec7500",
		colorDark: "#e9973f",
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
		colorLight: "#ec7500",
		colorDark: "#e9973f",
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
		colorLight: "#e93147",
		colorDark: "#fb464c",
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
		colorLight: "#e93147",
		colorDark: "#fb464c",
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
		colorLight: "#e93147",
		colorDark: "#fb464c",
		foldable: false,
		defaultFolded: false,
		builtIn: true,
		source: "builtin",
	},
	{
		id: "example",
		displayName: "Example",
		icon: { type: "lucide", value: "list" },
		colorLight: "#7852ee",
		colorDark: "#a882ff",
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

/**
 * Default right-click menu layout per render role. Array order = menu order.
 * The settings loader merges saved lists against these (unknown ids dropped,
 * newly introduced ids appended), so extending a list here is upgrade-safe.
 */
export const DEFAULT_CONTEXT_MENU_ITEMS: Record<
	CalloutRenderRole,
	ContextMenuItemConfig[]
> = {
	regular: [
		{ id: "copyMarkdown", enabled: true },
		{ id: "foldDefaults", enabled: true },
		{ id: "edit", enabled: true },
		{ id: "openSettings", enabled: true },
	],
	heading: [
		{ id: "cutSection", enabled: true },
		{ id: "copySection", enabled: true },
		{ id: "deleteSection", enabled: true },
		{ id: "edit", enabled: true },
		{ id: "openSettings", enabled: true },
	],
	inline: [
		{ id: "edit", enabled: true },
		{ id: "openSettings", enabled: true },
	],
};

export const DEFAULT_SETTINGS: PluginSettings = {
	globalStyle: {
		borderSides: { top: false, right: false, bottom: false, left: false },
		borderWidth: 2.5,
		titleScale: 1,
		contentScale: 1,
		borderRadius: 4,
		alignContentWithTitle: false,
		heading: {
			borderSides: {
				top: false,
				right: false,
				bottom: false,
				left: false,
			},
			borderWidth: 1.5,
			borderRadius: 4,
			// Equal top/bottom spacing so the heading text sits vertically
			// centered in the bar (overriding Obsidian's editor padding that
			// pushes heading text toward the bottom).
			paddingTop: 0.25,
			paddingBottom: 0.25,
			// Extra gap above each heading bar (em). 0 → keep the theme's own
			// heading spacing untouched; raising it separates stacked/collapsed
			// heading callouts that otherwise render glued together. Defaults to
			// a gentle half-em so stacked heading callouts read as distinct out
			// of the box; users can zero it to fall back to theme spacing.
			marginTop: 0.5,
		},
		inline: {
			borderSides: {
				top: false,
				right: false,
				bottom: false,
				left: false,
			},
			borderWidth: 1.5,
			// ≈1em at the pill's 0.9em font size → keeps the default pill shape.
			borderRadius: 16,
			fontScale: 1,
		},
	} satisfies GlobalStyleSettings,
	contextMenu: {
		enabled: true,
		items: DEFAULT_CONTEXT_MENU_ITEMS,
	},
	autocomplete: {
		enabled: true,
	},
	iconSources: {
		materialStyleDefault: "rounded",
		materialWeightDefault: 300,
		lastCategory: { material: "" },
		lastEmojiSkinTone: 0,
	},
	headingCallouts: {
		enabled: true,
		refCleanTitles: true,
		refShowIcon: true,
		showFoldArrow: true,
	},
	inlineCallouts: { enabled: true },
	firstRunCompleted: false,
	welcomeSeen: false,
	fallbackCalloutId: "note",
	language: "auto",
	customPalettes: [],
	userImages: [],
};
