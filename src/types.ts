export interface CalloutIcon {
	type: "lucide" | "material" | "svg" | "emoji";
	value: string;
	style?: "outlined" | "filled" | "rounded" | "sharp";
	/** Material Symbols weight (100–700, default 400) */
	weight?: number;
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
	source: "user" | "theme" | "plugin" | "builtin";
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
	metadata?: Record<string, string>;
}

export type PopupAnimation = "fade" | "slide" | "scale" | "none";
export type PopupPosition = "top-left" | "top-right" | "cursor";
export type MaterialIconStyle = "outlined" | "filled" | "rounded" | "sharp";

export interface PopupSettings {
	enabled: boolean;
	position: PopupPosition;
	transparency: number;
	backdropBlur: number;
	showIcons: boolean;
	showColorDots: boolean;
	maxItems: number;
	showEditCallout: boolean;
	showOpenSettings: boolean;
	showCopyMarkdown: boolean;
	showEditButton: boolean;
	animation: PopupAnimation;
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
}

export interface ColorModeSettings {
	showContrastWarning: boolean;
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
	/** Align content text to the title start instead of the icon start */
	alignToTitle: boolean;
	/** Scale factor for callout title font size (e.g. 0.8 – 1.5) */
	titleScale: number;
	/** Scale factor for callout content font size (e.g. 0.8 – 1.5) */
	contentScale: number;
	/** Border-radius in px for callout corners */
	borderRadius: number;
}

export interface PluginSettings {
	globalStyle: GlobalStyleSettings;
	popup: PopupSettings;
	autocomplete: AutocompleteSettings;
	iconSources: IconSourceSettings;
	colorMode: ColorModeSettings;
	language: string;
	/** Callout ID to use as fallback for unrecognized callout types. Empty = Obsidian default */
	fallbackCalloutId: string;
}

export interface PluginData {
	version: number;
	callouts: CalloutDefinition[];
	settings: PluginSettings;
	materialIconsCache?: MaterialIconsCacheData;
	customSvgIcons?: CustomSvgIcon[];
	/** Locally cached SVGs for selected Material icons */
	materialSvgCache?: MaterialSvgCacheEntry[];
}

export interface MaterialIconsCacheData {
	icons: MaterialIconMeta[];
	fetchedAt: number;
	/** Cache format version — bump to force re-fetch after URL changes */
	version?: number;
}

export interface MaterialIconMeta {
	name: string;
	categories: string[];
	tags: string[];
	styles: MaterialIconStyle[];
}

export interface CustomSvgIcon {
	name: string;
	svg: string;
}

export interface MaterialSvgCacheEntry {
	name: string;
	style: MaterialIconStyle;
	weight: number;
	svg: string;
}
