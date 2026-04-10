export interface CalloutIcon {
	type: "lucide" | "material" | "svg" | "emoji";
	value: string;
	style?: "outlined" | "filled" | "rounded" | "sharp";
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
export type ColorFormat = "hex" | "hsl" | "rgb";
export type ColorMode = "auto" | "light" | "dark";
export type MaterialIconStyle = "outlined" | "filled" | "rounded" | "sharp";

export interface PopupSettings {
	enabled: boolean;
	position: PopupPosition;
	transparency: number;
	backdropBlur: number;
	showIcons: boolean;
	showColorDots: boolean;
	maxItems: number;
	showConvertSubmenu: boolean;
	showEditButton: boolean;
	animation: PopupAnimation;
}

export interface AutocompleteSettings {
	enabled: boolean;
	showIconPreviews: boolean;
	showColorPreviews: boolean;
	maxSuggestions: number;
}

export interface IconSourceSettings {
	lucide: boolean;
	material: boolean;
	customSvg: boolean;
	materialStyleDefault: MaterialIconStyle;
	cacheMaterialOffline: boolean;
}

export interface ColorModeSettings {
	mode: ColorMode;
	format: ColorFormat;
	showContrastWarning: boolean;
}

export interface GlobalStyleSettings {
	/** Show an outer border on all callouts */
	border: boolean;
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
}

export interface PluginData {
	version: number;
	callouts: CalloutDefinition[];
	settings: PluginSettings;
	materialIconsCache?: MaterialIconsCacheData;
	customSvgIcons?: CustomSvgIcon[];
}

export interface MaterialIconsCacheData {
	icons: MaterialIconMeta[];
	fetchedAt: number;
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
