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

export type MaterialIconStyle = "outlined" | "filled" | "rounded" | "sharp";

export interface ContextMenuSettings {
	enabled: boolean;
	showEditCallout: boolean;
	showOpenSettings: boolean;
	showCopyMarkdown: boolean;
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
	showIconPreviews: boolean;
	showColorPreviews: boolean;
}

export interface IconSourceSettings {
	materialStyleDefault: MaterialIconStyle;
	/** Material Symbols weight default (100–700) */
	materialWeightDefault: number;
	/** Last Material category the user had open in the icon picker */
	lastMaterialCategory: string;
}

export interface GlobalStyleSettings {
	/** Which border sides are enabled */
	borderSides: {
		top: boolean;
		right: boolean;
		bottom: boolean;
		left: boolean;
	};
	/** Border thickness in px */
	borderWidth: number;
	/** Scale factor for callout title font size (e.g. 0.8 – 1.5) */
	titleScale: number;
	/** Scale factor for callout content font size (e.g. 0.8 – 1.5) */
	contentScale: number;
	/** Border-radius in px for callout corners */
	borderRadius: number;
}

export interface PluginSettings {
	globalStyle: GlobalStyleSettings;
	contextMenu: ContextMenuSettings;
	autocomplete: AutocompleteSettings;
	iconSources: IconSourceSettings;
	/** Has the first-run vault scan been completed? */
	firstRunCompleted?: boolean;
	/** Callout ID to use as fallback for unrecognized callout types. Empty = Obsidian default */
	fallbackCalloutId: string;
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
