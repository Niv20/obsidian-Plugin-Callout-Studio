/**
 * types.ts — Shared TypeScript interfaces and type declarations.
 *
 * Defines the core data shapes used across the entire plugin:
 * CalloutDefinition (the main data model), CalloutIcon, and all settings
 * interfaces (PluginSettings, ContextMenuSettings, AutocompleteSettings, etc.).
 * Also extends the Obsidian `App` type with the internal `setting` panel API.
 * Every module that needs to read or write callout data imports from here.
 */
/**
 * Which body of artwork an icon's drawing comes from. Doubles as the
 * discriminator on CalloutIcon, so the original values must keep their exact
 * spelling — every `data.json` and every exported settings file in the wild
 * stores them. Adding a member is backward-compatible; renaming one is not.
 *
 * This is *not* what the picker offers: Font Awesome's three styles and
 * Tabler's two are separate ids here (they are separately downloaded files) but
 * one source each in the picker. `IconSourceId` is that other id space, and
 * `icons/registry.ts` maps this union onto it with a total `Record`, so a
 * member added here without a source behind it is a compile error rather than a
 * blank grid.
 */
export type IconPackId =
	| "lucide"
	| "tabler-outline"
	| "tabler-filled"
	| "material"
	| "emoji"
	| "octicons"
	| "fa-solid"
	| "fa-regular"
	| "fa-brands"
	| "rpg-awesome"
	| "image";

/**
 * One library as the user meets it: a row in the picker's source menu, a
 * toolbar, a grid, one download button.
 *
 * Usually the same string as the IconPackId behind it. Font Awesome and Tabler
 * are the exceptions that make the distinction worth having — one source each,
 * several pack files, chosen between by a style control.
 */
export type IconSourceId =
	| "lucide"
	| "tabler"
	| "material"
	| "emoji"
	| "octicons"
	| "fa"
	| "rpg-awesome"
	| "image";

export interface CalloutIcon {
	type: IconPackId;
	/**
	 * Which drawing within the pack. An icon name for every bundled library; for
	 * `"image"` it is a `UserImageIcon.id`, because the picture itself is far too
	 * big to live here (the importer rejects a value over 200 characters).
	 */
	value: string;
	/** Material Symbols style. Only meaningful when `type` is "material". */
	style?: "outlined" | "filled" | "rounded" | "sharp";
	/** Material Symbols weight (100–700, default 400). Material-only. */
	weight?: number;
	/**
	 * Draw the picture in this callout's color instead of its own. Lives on the
	 * callout rather than on the picture, so one logo can be tinted in `[!bug]`
	 * and left alone in `[!note]`. Only meaningful when `type` is "image", and
	 * only honored for an SVG: a mask is a stencil, so recoloring a photo would
	 * flatten it to a silhouette.
	 */
	recolor?: boolean;
}

declare module "obsidian" {
	interface App {
		setting: {
			open(): void;
			openTabById(id: string): void;
		};
	}
}

/**
 * Two-stop linear background gradient. Stop 1 is the owner's existing
 * `bgColorLight`/`bgColorDark`; this object adds the end color per mode.
 * Absent = solid background, so all pre-gradient data keeps its meaning.
 * The background always uses the gradient; the title text only does when
 * `textGradient` is on (off by default — icons stay solid either way).
 */
export interface BgGradient {
	/** CSS gradient angle in degrees (0 = to top, 90 = to right). */
	angleDeg: number;
	/** Gradient end color – light mode (`#rrggbb`). */
	toColorLight: string;
	/** Gradient end color – dark mode (`#rrggbb`). */
	toColorDark: string;
	/**
	 * Paint the same sweep THROUGH the title text of all three render roles —
	 * the regular callout's title, the heading callout's title, and the inline
	 * pill's label — on top of whatever background each surface already has.
	 * One sweep per element, so it runs across the whole title at once rather
	 * than restarting on each glyph. Off by default: gradient text is a
	 * deliberate accent and it costs some legibility.
	 *
	 * Only honored together with `textToColorLight`/`textToColorDark`.
	 */
	textGradient?: boolean;
	/**
	 * End color of the TEXT sweep – light mode (`#rrggbb`). Separate from
	 * `toColorLight` because that one is a pale tint meant to sit behind text:
	 * painted through the glyphs themselves it would be invisible. The text
	 * sweep therefore runs between accent-strength colors instead
	 * (`colorLight` → here), derived from the same user-chosen second color.
	 */
	textToColorLight?: string;
	/** End color of the TEXT sweep – dark mode (`#rrggbb`). See `textToColorLight`. */
	textToColorDark?: string;
}

/**
 * One render role's icon adjustment. Every field is optional because an absent
 * one falls back to the matching flat `iconOffsetX`/`iconOffsetY`/`iconSize` on
 * the definition — see {@link CalloutDefinition.iconAdjust}.
 */
export interface IconAdjust {
	/** Horizontal icon offset in px (−10 to 10) */
	offsetX?: number;
	/** Vertical icon offset in px (−10 to 10) */
	offsetY?: number;
	/** Icon scale factor (0.5 to 1.5, default 1) */
	size?: number;
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
	/**
	 * Icon size and offsets per render role, so a nudge that fixes the heading
	 * token cannot knock the blockquote icon out of place.
	 *
	 * A role missing here — or a single field missing inside one — falls back to
	 * the flat trio below, which is precisely what that trio meant before this
	 * field existed: one adjustment shared by all three roles. That fallback is
	 * what lets pre-existing data and older exports keep rendering exactly as
	 * they did, with no migration pass. Resolve through
	 * `resolveIconAdjust()` (utils/iconAdjust.ts) rather than reading either
	 * layer directly.
	 */
	iconAdjust?: Partial<Record<CalloutRenderRole, IconAdjust>>;
	/**
	 * Horizontal icon offset in px (−10 to 10). Legacy shared value and the
	 * mirror of `iconAdjust.regular`; see `iconAdjust` above.
	 */
	iconOffsetX?: number;
	/** Vertical icon offset in px (−10 to 10). See `iconOffsetX`. */
	iconOffsetY?: number;
	/** Icon scale factor (0.5 to 1.5, default 1). See `iconOffsetX`. */
	iconSize?: number;
	/** Custom background color – light mode */
	bgColorLight?: string;
	/** Custom background color – dark mode */
	bgColorDark?: string;
	/**
	 * Optional two-stop background gradient starting at
	 * `bgColorLight`/`bgColorDark`. Only rendered when the matching mode's
	 * bg color is set.
	 */
	bgGradient?: BgGradient;
	/** Custom content text color – light mode */
	textColorLight?: string;
	/** Custom content text color – dark mode */
	textColorDark?: string;
	/** Alternative IDs (aliases) that map to this callout */
	aliases?: string[];
	/**
	 * Id of the `CustomPalette` this callout's colors were last applied from,
	 * if any. Lets a later edit to that palette (see
	 * `CalloutRegistry.applyPaletteColors`) cascade onto this callout instead
	 * of leaving it stuck with a stale, baked-in copy. Left stale (pointing at
	 * nothing) if the palette is later deleted — colors then stay as last set.
	 */
	paletteId?: string;
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
 * are stored as concrete `#rrggbb` hex values, baked into every callout that
 * applies the palette. Editing a palette cascades the new colors onto every
 * callout still linked to it via `CalloutDefinition.paletteId` (see
 * `CalloutRegistry.applyPaletteColors`); deleting a palette leaves linked
 * callouts with their last-known baked colors, unlinked.
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
	/**
	 * Optional two-stop background gradient starting at the palette's
	 * `bgColorLight`/`bgColorDark`. Baked onto callouts together with the
	 * six colors when the palette is applied.
	 */
	bgGradient?: BgGradient;
	/**
	 * Share of the accent color mixed into the background tint (0..1). Absent =
	 * `DEFAULT_BG_COLOR_AMOUNT`. Higher = a bolder, less transparent-looking
	 * background. Applies to the solid bg AND both gradient stops. Only steers
	 * derivation inside the palette editor — the resulting strength is baked into
	 * `bgColorLight`/`bgColorDark` (and the gradient tints) when applied.
	 */
	bgIntensity?: number;
	/**
	 * Which color-editing view the Palette Editor should open in. `"advanced"`
	 * shows independent Accent/Background/Text rows for the current theme mode
	 * (each edit infers the opposite mode's value); absent/`"simple"` shows the
	 * single Base color control that derives all six colors. Purely editor UI
	 * state - never read by `CSSInjector` or baked onto a `CalloutDefinition`.
	 * Only meaningful while the background is Solid; a Gradient palette ignores
	 * it (Gradient has no advanced per-color view).
	 */
	colorMode?: "simple" | "advanced";
}

/**
 * A picture the user added from their own computer, usable as a callout icon
 * exactly like any library icon (`CalloutIcon.type === "image"`, `value === id`).
 *
 * The artwork is always SVG markup, whatever was uploaded: an SVG is kept as
 * vector, and a PNG/JPEG/WebP is re-encoded through a canvas and wrapped in
 * `<svg><image href="data:…"></svg>`. That one representation is why every
 * render surface, the SVG cache and the PDF-export path need no special case —
 * a user image is just an icon whose artwork happens to live in settings.
 *
 * Settings is also deliberately where it lives rather than a file on disk: it
 * syncs with the rest of `data.json`, and `exportToJSONv2` already serializes
 * settings, so an export carries the pictures without becoming an archive.
 */
export interface UserImageIcon {
	/** Stable unique id (`img-` prefix). Stored as `CalloutIcon.value`. */
	id: string;
	/**
	 * The filename as the operating system shows it, extension included. Never
	 * shown as a field of its own — it is what the grid's tooltip reads and what
	 * both searches match on.
	 *
	 * Also the collection's uniqueness key: adding a file whose name is already
	 * here is refused (`utils/userImages`), which is why the extension is kept —
	 * `logo.svg` and `logo.png` are two pictures, two `logo.png` are one.
	 */
	name: string;
	/** What was uploaded. Only `"svg"` keeps its own colors optional. */
	format: "svg" | "png" | "jpeg" | "webp";
	/** Sanitized SVG markup, or the `<image>` wrapper around a raster. */
	svg: string;
	/** Intrinsic size of the stored artwork, for the icon box's aspect ratio. */
	width: number;
	height: number;
	/**
	 * A one-color drawing, detected on import. Says nothing about how any
	 * callout draws it — that is `CalloutIcon.recolor` — but it is the only kind
	 * worth *offering* as following the callout's color, so it seeds that flag
	 * when the picture is first picked.
	 */
	monochrome: boolean;
	/**
	 * Bumped on every edit. Feeds the pack's `cacheVariant`, which is what makes
	 * an open note repaint when a picture is replaced — the render key would
	 * otherwise be identical before and after.
	 */
	rev: number;
	/** Upload time, so the picker can offer the newest first. */
	addedAt: number;
}

export type MaterialIconStyle = "outlined" | "filled" | "rounded" | "sharp";

/**
 * Font Awesome's three styles. Upstream treats Brands as a style alongside
 * Solid and Regular, and so does the picker's style control — but each one is
 * its own downloaded file, hence its own IconPackId.
 */
export type FontAwesomeStyle = "solid" | "regular" | "brands";

/**
 * Tabler's two styles. Every icon is drawn as an outline; 1,054 of the 5,130
 * also have a filled drawing, so the style control filters the grid as well as
 * restyling it. Each style is its own downloaded file, hence its own
 * IconPackId.
 */
export type TablerIconStyle = "outline" | "filled";

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

/**
 * Every render role, for code that has to consider all of them at once — most
 * importantly the icon cache sweep, which must keep the artwork each role draws
 * from rather than only the blockquote's.
 */
export const CALLOUT_RENDER_ROLES: readonly CalloutRenderRole[] = [
	"regular",
	"heading",
	"inline",
];

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
	/**
	 * Draw the plugin's own fold chevron after the heading title (Live
	 * Preview). Obsidian's native indicator *before* the title is unaffected.
	 */
	showFoldArrow: boolean;
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
	/** Font Awesome style the picker opens on. */
	faStyleDefault?: FontAwesomeStyle;
	/** Tabler style the picker opens on. */
	tablerStyleDefault?: TablerIconStyle;
	/**
	 * Pre-2.4 field: the last Material category. Read once on load and folded
	 * into `lastCategory`, which covers every source rather than just Material.
	 */
	lastMaterialCategory?: string;
	/**
	 * Last category the user had open in the picker, per icon source. Entries
	 * left by a source that no longer exists (the three Font Awesome ids, which
	 * became one) are simply never read again.
	 */
	lastCategory?: Partial<Record<IconSourceId, string>>;
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
	 * Vertical gap *above* each heading bar, in em (the *outer* margin, distinct
	 * from paddingTop which is the inner text spacing). This is the knob that
	 * separates heading callouts from whatever precedes them — most importantly
	 * from each other: several collapsed heading callouts stacked back-to-back
	 * otherwise render touching, since the plugin emits no margin and the theme's
	 * default heading spacing is tiny. Default 0 → theme spacing is left intact.
	 */
	marginTop: number;
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
	/** Pictures the user added from their computer, usable as callout icons. */
	userImages: UserImageIcon[];
}

export interface PluginData {
	version: number;
	callouts: CalloutDefinition[];
	settings: PluginSettings;
	/** Legacy pre-bundled Material metadata cache; ignored on save. */
	materialIconsCache?: unknown;
	/**
	 * Pre-2.4 Material-only SVG cache, superseded by `iconSvgCache`.
	 *
	 * Still read, by exactly one caller: the load-time migration in
	 * CalloutRegistry that folds these entries into `iconSvgCache`. Never
	 * written again — writing both would let them drift apart. Nothing else
	 * should touch it.
	 */
	materialSvgCache?: MaterialSvgCacheEntry[];
	/** Locally cached SVGs for every icon actually in use, across all packs. */
	iconSvgCache?: IconSvgCacheEntry[];
}

/** Pre-2.4 cache shape, migrated to IconSvgCacheEntry on load. */
export interface MaterialSvgCacheEntry {
	name: string;
	style: MaterialIconStyle;
	weight: number;
	svg: string;
}

/**
 * One icon's artwork, cached in `data.json` so the callout keeps rendering
 * without the icon pack present — on a device that synced the settings but
 * never downloaded the pack, or after the pack file on disk is deleted.
 */
export interface IconSvgCacheEntry {
	pack: IconPackId;
	name: string;
	/**
	 * Everything besides the name that changes the artwork, from the pack's
	 * `cacheVariant()`. Material encodes style and weight; Octicons encodes the
	 * pixel height it drew at; packs with a single drawing per icon use "".
	 */
	variant: string;
	svg: string;
}
