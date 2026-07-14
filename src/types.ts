/**
 * types.ts — Shared TypeScript interfaces and type declarations.
 *
 * Defines the core data shapes used across the entire plugin:
 * CalloutDefinition (the main data model), CalloutIcon, and all settings
 * interfaces (PluginSettings, ContextMenuSettings, AutocompleteSettings, etc.).
 * Also extends the Obsidian `App` type with the internal `setting` panel API.
 * Every module that needs to read or write callout data imports from here.
 */
export interface CalloutIcon {
	type: "lucide" | "material" | "emoji";
	value: string;
	style?: "outlined" | "filled" | "rounded" | "sharp";
	/** Material Symbols weight (100–700, default 400) */
	weight?: number;
}

declare module "obsidian" {
	interface App {
		setting: {
			open(): void;
			openTabById(id: string): void;
		};
	}
}

export interface CalloutDefinition {
	id: string;
	displayName: string;
	icon: CalloutIcon;
	colorLight: string;
	colorDark: string;
	foldable: boolean;
	defaultFolded: boolean;
	builtIn: boolean;
	source: "user" | "theme" | "plugin" | "builtin" | "fallback";
	/** Horizontal icon offset in px (−10 to 10) */
	iconOffsetX?: number;
	/** Vertical icon offset in px (−10 to 10) */
	iconOffsetY?: number;
	/** Icon scale factor (0.5 to 2.0, default 1) */
	iconSize?: number;
	/** Custom background color – light mode */
	bgColorLight?: string;
	/** Custom background color – dark mode */
	bgColorDark?: string;
	/** Custom content text color – light mode */
	textColorLight?: string;
	/** Custom content text color – dark mode */
	textColorDark?: string;
	/** Alternative IDs (aliases) that map to this callout */
	aliases?: string[];
	/**
	 * Marks a user-owned callout that the user has explicitly created or
	 * modified through the editor. Such callouts are sticky: they are never
	 * auto-pruned even when no vault content references them. Auto-created
	 * fallback rows start with this flag unset/false and are pruned when
	 * unused. Has no effect on built-in callouts.
	 */
	customized?: boolean;
	metadata?: Record<string, string>;
}

/**
 * A user-saved color palette, shown in the "Custom" group of the callout
 * editor's palette dropdown and managed from the settings tab. All six colors
 * are stored as concrete `#rrggbb` hex values (baked at save time — applying,
 * editing, or deleting a palette never affects callouts that already used it).
 */
export interface CustomPalette {
	/** Stable unique id (`cp-` prefix). Never shown to the user. */
	id: string;
	/** User-visible palette name. */
	name: string;
	colorLight: string;
	colorDark: string;
	bgColorLight: string;
	bgColorDark: string;
	textColorLight: string;
	textColorDark: string;
}

export type MaterialIconStyle = "outlined" | "filled" | "rounded" | "sharp";

/**
 * A single entry in the bundled emoji dataset (see data/emojiData.ts).
 * `skins` is present only for skin-tone-capable emojis: the 5 fully-qualified
 * variant glyphs ordered light → dark.
 */
export interface EmojiEntry {
	emoji: string;
	label: string;
	tags: string[];
	skins?: string[];
}

/**
 * The three rendering roles a single callout definition can play:
 * - "regular": the native blockquote callout (`> [!name]`)
 * - "heading": a heading line whose first content is the token (`## [!name]`)
 * - "inline": a `[!name]` token in the middle of any other line, shown as a pill
 * One shared definition list serves all roles; only the rendering differs.
 */
export type CalloutRenderRole = "regular" | "heading" | "inline";

/** Enable/disable switch for an optional render role (heading / inline). */
export interface RoleToggleSettings {
	enabled: boolean;
}

/**
 * Heading-callout role settings. The ref fields control how references to
 * heading callouts display outside the heading itself — the Outline pane,
 * rendered internal links (including TOC plugins), and the `[[` link
 * suggestion popup; both are inert while `enabled` is false.
 */
export interface HeadingCalloutSettings extends RoleToggleSettings {
	/** Strip the `[!id]` token from references, showing only the title. */
	refCleanTitles: boolean;
	/** Show the callout's colored icon before the cleaned reference title. */
	refShowIcon: boolean;
}

/**
 * Identifiers for the right-click menu entries. `foldDefaults` covers the
 * whole open/closed/normal fold-default group as one toggleable unit; the
 * `*Section` items operate on an entire heading section (heading line +
 * everything until the next same-or-higher-level heading).
 */
export type ContextMenuItemId =
	| "edit"
	| "openSettings"
	| "copyMarkdown"
	| "foldDefaults"
	| "cutSection"
	| "copySection"
	| "deleteSection";

/** One row in a per-role context-menu configuration. Array order = menu order. */
export interface ContextMenuItemConfig {
	id: ContextMenuItemId;
	enabled: boolean;
}

export interface ContextMenuSettings {
	enabled: boolean;
	/**
	 * Per-role ordered menu item lists (user-customizable via the settings
	 * modal). Merged with defaults on load: unknown ids are dropped, items
	 * introduced by newer plugin versions are appended at the end.
	 */
	items: Record<CalloutRenderRole, ContextMenuItemConfig[]>;
}

export interface LegacyPopupSettings extends ContextMenuSettings {
	position?: "top-left" | "top-right" | "cursor";
	transparency?: number;
	backdropBlur?: number;
	showIcons?: boolean;
	showColorDots?: boolean;
	maxItems?: number;
	showEditButton?: boolean;
	animation?: "fade" | "slide" | "scale" | "none";
}

export interface AutocompleteSettings {
	enabled: boolean;
}

export interface IconSourceSettings {
	materialStyleDefault: MaterialIconStyle;
	/** Material Symbols weight default (100–700) */
	materialWeightDefault: number;
	/** Last Material category the user had open in the icon picker */
	lastMaterialCategory: string;
	/** Last emoji skin tone the user selected (0 = default, 1–5 = light→dark) */
	lastEmojiSkinTone?: number;
}

/** Per-side border toggles shared by every render role's frame style. */
export interface BorderSidesSettings {
	top: boolean;
	right: boolean;
	bottom: boolean;
	left: boolean;
}

/**
 * Frame styling for an optional render role's surface (heading bar / inline
 * pill): which border sides to draw, how thick, and the corner rounding.
 */
export interface RoleFrameStyleSettings {
	borderSides: BorderSidesSettings;
	/** Border thickness in px */
	borderWidth: number;
	/** Border-radius in px */
	borderRadius: number;
}

/**
 * Heading-bar frame styling plus the vertical text spacing inside the bar.
 * Both paddings are in em (relative to the heading's own font size) so the
 * bar scales with the heading level.
 */
export interface HeadingFrameStyleSettings extends RoleFrameStyleSettings {
	/** Space above the heading text inside the bar, in em. */
	paddingTop: number;
	/** Space below the heading text inside the bar, in em. */
	paddingBottom: number;
	/**
	 * Horizontal inset of the icon (and title) from the bar's start edge, in
	 * px. Keeps the icon off the very edge; independent of heading font size.
	 */
	paddingStart: number;
}

/**
 * Inline-pill frame styling plus a font scale for the pill's text and icon.
 * The scale multiplies the pill's base font size (0.9em) so the pill grows or
 * shrinks relative to the surrounding paragraph text.
 */
export interface InlineFrameStyleSettings extends RoleFrameStyleSettings {
	/** Scale factor for the inline pill's font size (e.g. 0.8 – 1.5) */
	fontScale: number;
}

export interface GlobalStyleSettings {
	/** Which border sides are enabled (regular callouts) */
	borderSides: BorderSidesSettings;
	/** Border thickness in px (regular callouts) */
	borderWidth: number;
	/** Scale factor for callout title font size (e.g. 0.8 – 1.5) */
	titleScale: number;
	/** Scale factor for callout content font size (e.g. 0.8 – 1.5) */
	contentScale: number;
	/** Border-radius in px for callout corners (regular callouts) */
	borderRadius: number;
	/** When true, indent callout body to align under the title text (not the icon) */
	alignContentWithTitle: boolean;
	/** Vault-wide frame style for heading callout bars. */
	heading: HeadingFrameStyleSettings;
	/** Vault-wide frame style for inline callout pills. */
	inline: InlineFrameStyleSettings;
}

export interface PluginSettings {
	globalStyle: GlobalStyleSettings;
	contextMenu: ContextMenuSettings;
	autocomplete: AutocompleteSettings;
	iconSources: IconSourceSettings;
	/** Heading callouts (`## [!name]`) — optional role, can be disabled. */
	headingCallouts: HeadingCalloutSettings;
	/** Inline callout pills (`[!name]` mid-line) — optional role, can be disabled. */
	inlineCallouts: RoleToggleSettings;
	/** Has the first-run vault scan been completed? */
	firstRunCompleted?: boolean;
	/** Has the welcome/splash screen been shown at least once? */
	welcomeSeen?: boolean;
	/** Callout ID to use as fallback for unrecognized callout types. Empty = Obsidian default */
	fallbackCalloutId: string;
	/**
	 * UI display language. `"auto"` follows Obsidian's interface language;
	 * any other value is a locale code (e.g. `"he"`, `"zh-tw"`).
	 */
	language: string;
	/** User-saved color palettes, selectable in the callout editor. */
	customPalettes: CustomPalette[];
}

export interface PluginData {
	version: number;
	callouts: CalloutDefinition[];
	settings: PluginSettings;
	/** Legacy pre-bundled Material metadata cache; ignored on save. */
	materialIconsCache?: unknown;
	/** Locally cached SVGs for selected Material icons */
	materialSvgCache?: MaterialSvgCacheEntry[];
}

export interface MaterialIconMetadataEntry {
	name: string;
	categories: string[];
	tags: string[];
}

export interface MaterialIconMeta extends MaterialIconMetadataEntry {
	/** Optional legacy/per-icon style support; bundled metadata uses a shared style set. */
	styles?: MaterialIconStyle[];
}

export interface MaterialSvgCacheEntry {
	name: string;
	style: MaterialIconStyle;
	weight: number;
	svg: string;
}
