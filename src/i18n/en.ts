/**
 * i18n/en.ts — English translation strings.
 *
 * The base/fallback locale for the plugin. All translation keys are defined
 * here first; other locale files (e.g. he.ts) mirror this key set with their
 * own translated values. Imported by i18n/index.ts.
 */
export const en: Record<string, string> = {
	// Commands
	"cmd.openSettings": "Open settings",
	"cmd.createCallout": "Create new callout type",
	"cmd.insertEmptyCallout": "Insert empty callout",
	"cmd.calloutWrap": "Wrap in callout",
	"cmd.calloutUnwrap": "Unwrap from callout",

	// Autocomplete
	"autocomplete.createNew": 'Create new callout: "{{name}}"',

	// Vault scan / fallback / delete
	"settings.fallbackTag": "Default",
	"settings.fallbackTagAuto": "Default fallback",
	"settings.rescanVault": "Re-scan vault",
	"settings.rescanVaultDesc":
		"Find unrecognized callout IDs used in notes and add them as fallback rows.",
	"settings.rescanVaultHintAction": "Scan now",
	"settings.rescanComplete":
		"Re-scan complete: {{count}} new callout(s) added.",
	"replaceModal.deleteWithoutReplaceSuffix": "(falls back to default)",

	// First-run scan modal (shown once on first install for large vaults)
	"firstRun.title": "Find existing callouts in your vault?",
	"firstRun.body":
		"Callout Studio can scan your vault to discover callouts you already use, so they appear in your settings list and adopt your fallback style.",
	"firstRun.heavyVaultNote":
		"Your vault has {{count}} Markdown files — the scan may take a few seconds.",
	"firstRun.laterHint":
		"You can always run this later from Settings → Vault insights & maintenance → Re-scan vault.",
	"firstRun.scanNow": "Scan now",
	"firstRun.noThanks": "No thanks",
	"firstRun.autoScanComplete":
		"Callout Studio scanned your vault and added {{count}} callout(s).",
	"firstRun.scanning": "Scanning",

	// Welcome / splash screen (shown once on first load; reopen via header icon)
	"welcome.tooltip": "About Callout Studio",
	"welcome.title": "Welcome to Callout Studio",
	"welcome.tagline": "Your complete solution for managing Obsidian callouts.",
	"welcome.previewTitle": "See it in action",
	"welcome.sample":
		"Callout Studio lets you create callouts with a custom icon, colors, and name.\n\n" +
		"You can use the same callout in **three** different ways:\n\n" +
		"## [!tip] As a heading\n" +
		"To turn any heading into a callout-style heading, add `[!type]` right after the `#`s.\n\n" +
		"Want an inline callout like this [!warning]? Just add `[!type]` right in a sentence, without breaking your flow.\n\n" +
		"> [!note] Regular callout\n" +
		"> Of course, the classic callout works with the exact same syntax you're already used to: `> [!type]`.\n\n" +
		"There's a lot more Callout Studio has to offer! [Learn more]({{repoUrl}}).\n",

	// Delete-callout modal (trash button on user rows)
	"deleteModal.title": 'Delete callout "{{name}}"?',
	"deleteModal.bodyInUse":
		"This callout appears {{count}} time(s) across {{files}} file(s).",
	"deleteModal.bodyInUseExplain":
		"Deleting will convert those blocks to plain text — they will no longer be styled and will lose the callout header.",
	"deleteModal.replaceHint":
		"You can replace it with another callout instead, which keeps your vault content as a styled callout.",
	"deleteModal.bodyUnused":
		'"{{name}}" is not used in any note, but it is a custom callout you customized. Deleting will remove it from this list.',
	"deleteModal.replaceInstead": "Replace instead",
	"deleteModal.deleteInUse": "Delete (convert to plain text)",
	"deleteModal.deleteUnused": "Delete callout",

	// Settings — Section headings
	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "My callout types",
	"settings.builtInCallouts": "Built-in callouts",
	"settings.contextMenu": "Context menu",
	"settings.autocomplete": "Autocomplete",
	"settings.keyboardShortcuts": "Keyboard shortcuts",
	"settings.language": "Language",
	"settings.languageDesc":
		"Display language for Callout Studio. Defaults to Obsidian's interface language.",
	"settings.languageAuto": "Automatic (match Obsidian)",
	"settings.importExport": "Import / export",
	"settings.import": "Import",
	"settings.export": "Export",
	"settings.importDesc":
		"Import your Callout Studio progress from another vault, or bring your callouts over from a different plugin.",
	"settings.exportDesc": "Save all your custom callout types in JSON format.",
	"settings.importConflictNotice":
		"Imported {{count}} callout type(s); {{overwritten}} existing entry/entries were overwritten.",

	// Settings — Toolbar
	"settings.addNewCallout": "Add new callout",

	// Settings — Empty states
	"settings.noCalloutsNow": "No custom callouts for now.",

	// Settings — Row actions
	"settings.editAria": "Edit {{name}}",
	"settings.moreRowActionsAria": "More actions for {{name}}",
	"settings.usageInfo": "{{count}} use(s) in {{files}} file(s)",
	"settings.replaceAction": "Replace in vault",
	"settings.deleteAction": "Delete",
	"settings.resetAction": "Reset to default",
	"settings.makeFallbackAction": "Use default fallback style",
	"settings.colorSwatchAria": "Accent: {{accent}} · Background: {{bg}}",

	// Settings — Fallback callout
	"settings.fallbackCallout": "Default fallback callout",
	"settings.fallbackCalloutDesc":
		"Unrecognized callout types in your vault will inherit the style of this callout.",

	// Settings — Global style
	"settings.globalStyle": "Global callout style",
	"settings.border": "Borders",
	"settings.borderAll": "All",
	"settings.borderTop": "Top",
	"settings.borderRight": "Right",
	"settings.borderBottom": "Bottom",
	"settings.borderLeft": "Left",
	"settings.borderWidth": "Border thickness",
	"settings.fontScaleGroup": "Font scale",
	"settings.titleScale": "Title",
	"settings.contentScale": "Content",
	"settings.inlineTextScale": "Text",
	"settings.shapeGroup": "Shape",
	"settings.borderRadius": "Corner rounding",
	"settings.alignGroup": "Align",
	"settings.alignContent": "Align content with title",
	"settings.headingSpacingGroup": "Title spacing",
	"settings.headingPadVertical": "Vertical spacing",
	"settings.headingGap": "Spacing between headers",
	"settings.headingFoldGroup": "Fold",
	"settings.headingFoldArrow": "Show fold arrow",
	"settings.styleDemoName": "Example",
	"settings.previewTitle": "Preview",

	// Settings — Saved color palettes
	"settings.customPalettes": "Saved color palettes",
	"settings.newPalette": "New palette",
	"settings.customPalettesEmpty": "No saved palettes yet.",
	"settings.editPaletteAria": "Edit palette {{name}}",
	"settings.deletePaletteAria": "Delete palette {{name}}",
	"settings.deletePaletteConfirm":
		'Delete palette "{{name}}"?\nCallouts that use its colors are not affected.',

	// Settings — Autocomplete
	"settings.enableAutocomplete": "Enable [! Autocomplete",
	"settings.enableAutocompleteDesc":
		'Show suggestions when you type "[!" inside a blockquote in the editor. Pick a callout type from the list to insert a complete callout header.',

	// Settings — Keyboard shortcuts
	"settings.openHotkeys": "Callout Studio hotkeys",
	"settings.openHotkeysDesc":
		"Open Obsidian's hotkeys settings for Callout Studio commands, where you can choose your own shortcuts for Create new callout type, Open settings, Unwrap from callout, and Wrap in callout. No shortcuts are assigned by default.",
	"settings.openHotkeysButton": "Open hotkey settings",

	// Settings — Reset
	"settings.vaultMaintenance": "Vault insights & maintenance",
	"settings.vaultStats": "Callout statistics",
	"settings.vaultStatsDesc":
		"Count every callout block in your Markdown notes and group them by type.",
	"settings.vaultStatsButton": "View statistics",
	"settings.vaultStatsScanning": "Scanning",
	"settings.resetAll": "Reset",
	"settings.resetAllDesc":
		"Delete all user callouts, reset built-in callouts, global styles (borders, font scale, shape), saved color palettes, the right-click menu customization, and downloaded Material SVGs.",
	"settings.resetAllButton": "Reset everything",
	"settings.resetAllConfirm":
		"This will delete all custom callouts, reset built-in callouts, global styles, saved color palettes, the right-click menu customization, and all cached Material SVGs. This action cannot be undone. Are you sure?",
	"notice.resetAllDone": "Everything has been reset to defaults.",

	// Notices
	"notice.exported": "Callouts exported to callout-studio-export.json",
	"notice.importedJSON": "Imported {{count}} callout type(s) from JSON.",
	"notice.importedSettings": "Imported plugin settings.",
	"notice.importedCalloutManager":
		"Imported from Callout Manager: {{created}} created, {{updated}} updated.",
	"notice.importedAdmonition":
		"Imported from Admonition: {{created}} created, {{updated}} updated.",
	"notice.noNewJSON":
		"No new callout types were imported (ids may already exist).",
	"notice.iconDownloadFailed":
		'Could not download Material icon "{{name}}". It may be unavailable for this style/weight, or your connection may be offline.',
	"notice.nothingToWrap": "Nothing to wrap.",
	"notice.cursorNotInsideCallout": "Cursor is not inside a callout.",
	"notice.openHotkeysFailed": "Could not open Obsidian hotkeys settings.",
	"notice.filterHotkeysFailed":
		"Opened Obsidian hotkeys, but could not apply the Callout Studio filter.",

	// Callout Editor
	"editor.editCallout": "Edit callout",
	"editor.newCallout": "New callout",
	"editor.displayName": "Display name",
	"editor.displayNameDesc": "The human-readable label shown in the UI",
	"editor.displayNameBuiltIn":
		"Display name cannot be changed for built-in callouts",
	"editor.displayNamePlaceholder": "My callout",
	"editor.calloutIds": "Callout IDs",
	"editor.calloutIdsDesc":
		"All identifiers for this callout. Spaces are allowed.\nPress Enter or the + button to add.",
	"editor.calloutIdsPlaceholder": "Add ID",
	"editor.addId": "Add ID",
	"editor.idLinkedToName": "Linked to the display name",
	"editor.idCannotDelete":
		"This ID is linked to the display name and can't be deleted — edit the name to change it",
	"editor.icon": "Icon",
	"editor.pickIcon": "Change icon",
	"editor.resetIcon": "Reset icon to default",
	"editor.livePreview": "Live preview",
	"editor.iconAdjustment": "Icon adjustment",
	"editor.picture": "Picture",
	"editor.size": "Size",
	"editor.horizontalOffset": "Horizontal offset",
	"editor.verticalOffset": "Vertical offset",
	"editor.colors": "Color",
	"editor.colorsDesc":
		"Sets this callout's border, background, and text colors.",
	"editor.resetColors": "Reset colors to default",
	"editor.paletteDeleted": "Deleted color",
	"editor.paletteGroupObsidian": "Obsidian callouts",
	"editor.paletteGroupPresets": "Color presets",
	"editor.paletteGroupCustom": "Custom",
	"editor.paletteNewColor": "New color…",
	"editor.contrastWarning":
		"Low contrast against the background — may be hard to read",
	"editor.foldable": "Foldable",
	"editor.foldableDesc":
		"Choose whether the callout can be folded and which default state to apply across the vault.",
	"editor.foldOff": "Off",
	"editor.foldOpen": "Open by default",
	"editor.foldClosed": "Closed by default",
	"editor.cancel": "Cancel",
	"editor.saveChanges": "Save changes",
	"editor.createCallout": "Create callout",
	"editor.nameRequired":
		"A display name is required before creating a callout.",
	"editor.noChangesToSave": "No changes were made.",
	"editor.downloadingIcon": "Downloading icon",
	"editor.idEmpty": "At least one ID is required",
	"editor.idExists": "A callout with this ID already exists",
	"editor.idConflict": "This ID conflicts with an existing callout",
	"editor.idDashConflict":
		'Obsidian writes spaces as dashes, so this ID collides with "{{other}}"',
	"editor.untitledCallout": "Untitled Callout",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText":
		"Here is an inline [!{id}] pill inside a paragraph.",
	"editor.previewReadOnly": "The live preview can't be edited",

	// Palette editor modal
	"palette.newTitle": "New color palette",
	"palette.editTitle": "Edit color palette",
	"palette.name": "Name",
	"palette.namePlaceholder": "My palette",
	"palette.nameExists": "A palette with this name already exists",
	"palette.baseColor": "Base color",
	"palette.baseColorHint":
		"We'll automatically match the background color to it. If you'd like, you can control it separately by {{link}}.",
	"palette.baseColorHintLink": "clicking here",
	"palette.advancedColors": "Colors",
	"palette.advancedColorsHint":
		"Editing colors for {{mode}} mode - the other mode updates automatically. Switch Obsidian's theme to check it.",
	"palette.revertHint": "Prefer a single base color instead? {{link}}.",
	"palette.revertHintLink": "Revert",
	"palette.lightMode": "Light",
	"palette.darkMode": "Dark",
	"palette.accentColor": "Accent color",
	"palette.backgroundColorChannel": "Background color",
	"palette.textColorChannel": "Text color",
	"palette.bgIntensity": "Intensity",
	"palette.bgStyle": "Style",
	"palette.bgSolid": "Solid",
	"palette.bgGradient": "Gradient",
	"palette.gradientTo": "Second color",
	"palette.gradientDirection": "Direction",
	"palette.gradientText": "Gradient title text",
	"palette.save": "Save",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "Red",
	"colorName.orange": "Orange",
	"colorName.amber": "Amber",
	"colorName.yellow": "Yellow",
	"colorName.lime": "Lime",
	"colorName.green": "Green",
	"colorName.teal": "Teal",
	"colorName.cyan": "Cyan",
	"colorName.sky": "Sky",
	"colorName.blue": "Blue",
	"colorName.indigo": "Indigo",
	"colorName.violet": "Violet",
	"colorName.purple": "Purple",
	"colorName.pink": "Pink",
	"colorName.rose": "Rose",
	"colorName.brown": "Brown",
	"colorName.gray": "Gray",
	"colorName.black": "Black",
	"colorName.white": "White",
	"colorName.crimson": "Crimson",
	"colorName.coral": "Coral",
	"colorName.grape": "Grape",
	"colorName.plum": "Plum",
	"colorName.bubblegum": "Bubblegum",

	// Icon Picker
	"iconPicker.pickIcon": "Pick an icon",
	"iconPicker.confirm": "Confirm",
	"iconPicker.cancel": "Cancel",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "Search Lucide icons",
	"iconPicker.searchTabler": "Search Tabler icons",
	"iconPicker.tablerStyle": "Icon style",
	"iconPicker.tablerStyleOutline": "Outline",
	"iconPicker.tablerStyleFilled": "Filled",
	"iconPicker.loadMore": "Load more",
	"iconPicker.materialStyle": "Icon style",
	"iconPicker.materialStyleOutlined": "Outlined",
	"iconPicker.materialStyleFilled": "Filled",
	"iconPicker.materialStyleRounded": "Rounded",
	"iconPicker.materialStyleSharp": "Sharp",
	"iconPicker.materialWeight": "Icon weight",
	"iconPicker.materialWeight100": "Thin",
	"iconPicker.materialWeight200": "Extra Light",
	"iconPicker.materialWeight300": "Light",
	"iconPicker.materialWeight400": "Regular",
	"iconPicker.materialWeight500": "Medium",
	"iconPicker.materialWeight600": "Semi Bold",
	"iconPicker.materialWeight700": "Bold",
	"iconPicker.searchMaterial": "Search Material icons",
	"iconPicker.searchEmoji": "Search emojis",
	"iconPicker.skinTone": "Skin tone",
	"iconPicker.allCategories": "All categories",
	"iconPicker.noIconSelected": "No icon selected",
	"iconPicker.noResults": "No icons match your search.",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Search Octicons",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Search Font Awesome",
	"iconPicker.faStyle": "Icon style",
	"iconPicker.faStyleSolid": "Solid",
	"iconPicker.faStyleRegular": "Regular",
	"iconPicker.faStyleBrands": "Brands",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "Search RPG Awesome",
	"iconPicker.image": "Your images",
	"iconPicker.searchImage": "Search your images",
	"iconPicker.imageTooLarge":
		"{{name}} is too large. Pictures must be under 5 MB.",
	"iconPicker.imageUnsupported":
		"{{name}} is not a supported picture. Use SVG, PNG, JPEG or WebP.",
	"iconPicker.imageInvalidSvg":
		"{{name}} could not be read as a safe SVG, so it was not added.",
	"iconPicker.imageDecodeFailed": "{{name}} could not be read as a picture.",
	"iconPicker.imageDuplicate":
		"{{name}} is already in your images. Rename the file, or delete the " +
		"picture you already have.",
	"iconPicker.imageAdd": "Add images",
	"iconPicker.imageEmpty":
		"No pictures yet. Add an SVG, PNG, JPEG or WebP file from your computer, " +
		"or drop one here.",
	"iconPicker.imageDelete": "Delete",
	"iconPicker.imageDeleteConfirm": "Delete “{{name}}”?",
	"iconPicker.imageDeleteInUse":
		"{{count}} callouts use this picture. They will fall back to a " +
		"placeholder icon until you give them a new one.",
	"iconPicker.imageRecolor": "Follow callout color",
	"iconPicker.allSources": "All sources",
	"iconPicker.searchAllSources": "Search all icon sources",
	"iconPicker.sourcesNotDownloaded":
		"Not included yet: {{names}}. Pick a source above to download it.",
	"iconPicker.chooseSource": "Choose source",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources": "search every library at once",
	"iconPicker.descLucide": "Obsidian's own set, always offline",
	"iconPicker.descTabler":
		"clean and consistent UI icons, outline and filled",
	"iconPicker.descMaterial": "Google's set, four styles and seven weights",
	"iconPicker.descEmoji": "colour glyphs, every skin tone",
	"iconPicker.descOcticons": "GitHub's interface icons",
	"iconPicker.descFa": "solid, regular and brand marks",
	"iconPicker.descRpgAwesome": "fantasy and tabletop icons",
	"iconPicker.descImage": "pictures you add from your computer",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "Accessibility",
	"iconPicker.cat.Actions": "Actions",
	"iconPicker.cat.Activities": "Activities",
	"iconPicker.cat.Alert": "Alert",
	"iconPicker.cat.Alphabet": "Alphabet",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "Animals",
	"iconPicker.cat.Arrows": "Arrows",
	"iconPicker.cat.Astronomy": "Astronomy",
	"iconPicker.cat.Audio&Video": "Audio & Video",
	"iconPicker.cat.Automotive": "Automotive",
	"iconPicker.cat.Badges": "Badges",
	"iconPicker.cat.Brand": "Brand",
	"iconPicker.cat.Buildings": "Buildings",
	"iconPicker.cat.Business": "Business",
	"iconPicker.cat.Camping": "Camping",
	"iconPicker.cat.Charity": "Charity",
	"iconPicker.cat.Charts": "Charts",
	"iconPicker.cat.Charts + Diagrams": "Charts + Diagrams",
	"iconPicker.cat.Childhood": "Childhood",
	"iconPicker.cat.Clothing + Fashion": "Clothing + Fashion",
	"iconPicker.cat.Coding": "Coding",
	"iconPicker.cat.Communicate": "Communicate",
	"iconPicker.cat.Communication": "Communication",
	"iconPicker.cat.Computers": "Computers",
	"iconPicker.cat.Connectivity": "Connectivity",
	"iconPicker.cat.Construction": "Construction",
	"iconPicker.cat.Currencies": "Currencies",
	"iconPicker.cat.Database": "Database",
	"iconPicker.cat.Design": "Design",
	"iconPicker.cat.Development": "Development",
	"iconPicker.cat.Devices": "Devices",
	"iconPicker.cat.Devices + Hardware": "Devices + Hardware",
	"iconPicker.cat.Disaster + Crisis": "Disaster + Crisis",
	"iconPicker.cat.Document": "Document",
	"iconPicker.cat.E-commerce": "E-commerce",
	"iconPicker.cat.Editing": "Editing",
	"iconPicker.cat.Education": "Education",
	"iconPicker.cat.Electrical": "Electrical",
	"iconPicker.cat.Emoji": "Emoji",
	"iconPicker.cat.Energy": "Energy",
	"iconPicker.cat.Extensions": "Extensions",
	"iconPicker.cat.Files": "Files",
	"iconPicker.cat.Film + Video": "Film + Video",
	"iconPicker.cat.Food": "Food",
	"iconPicker.cat.Food + Beverage": "Food + Beverage",
	"iconPicker.cat.Fruits + Vegetables": "Fruits + Vegetables",
	"iconPicker.cat.Games": "Games",
	"iconPicker.cat.Gaming": "Gaming",
	"iconPicker.cat.Gender": "Gender",
	"iconPicker.cat.Genders": "Genders",
	"iconPicker.cat.Gestures": "Gestures",
	"iconPicker.cat.Halloween": "Halloween",
	"iconPicker.cat.Hands": "Hands",
	"iconPicker.cat.Hardware": "Hardware",
	"iconPicker.cat.Health": "Health",
	"iconPicker.cat.Holidays": "Holidays",
	"iconPicker.cat.Home": "Home",
	"iconPicker.cat.Household": "Household",
	"iconPicker.cat.Humanitarian": "Humanitarian",
	"iconPicker.cat.Images": "Images",
	"iconPicker.cat.Laundry": "Laundry",
	"iconPicker.cat.Letters": "Letters",
	"iconPicker.cat.Logic": "Logic",
	"iconPicker.cat.Logistics": "Logistics",
	"iconPicker.cat.Map": "Map",
	"iconPicker.cat.Maps": "Maps",
	"iconPicker.cat.Maritime": "Maritime",
	"iconPicker.cat.Marketing": "Marketing",
	"iconPicker.cat.Math": "Math",
	"iconPicker.cat.Mathematics": "Mathematics",
	"iconPicker.cat.Media": "Media",
	"iconPicker.cat.Media Playback": "Media Playback",
	"iconPicker.cat.Medical + Health": "Medical + Health",
	"iconPicker.cat.Money": "Money",
	"iconPicker.cat.Mood": "Mood",
	"iconPicker.cat.Moving": "Moving",
	"iconPicker.cat.Music + Audio": "Music + Audio",
	"iconPicker.cat.Nature": "Nature",
	"iconPicker.cat.Numbers": "Numbers",
	"iconPicker.cat.Photography": "Photography",
	"iconPicker.cat.Photos + Images": "Photos + Images",
	"iconPicker.cat.Political": "Political",
	"iconPicker.cat.Privacy": "Privacy",
	"iconPicker.cat.Punctuation + Symbols": "Punctuation + Symbols",
	"iconPicker.cat.Religion": "Religion",
	"iconPicker.cat.Science": "Science",
	"iconPicker.cat.Science Fiction": "Science Fiction",
	"iconPicker.cat.Security": "Security",
	"iconPicker.cat.Shapes": "Shapes",
	"iconPicker.cat.Shopping": "Shopping",
	"iconPicker.cat.Social": "Social",
	"iconPicker.cat.Spinners": "Spinners",
	"iconPicker.cat.Sport": "Sport",
	"iconPicker.cat.Sports + Fitness": "Sports + Fitness",
	"iconPicker.cat.Symbols": "Symbols",
	"iconPicker.cat.System": "System",
	"iconPicker.cat.Text": "Text",
	"iconPicker.cat.Text Formatting": "Text Formatting",
	"iconPicker.cat.Time": "Time",
	"iconPicker.cat.Toggle": "Toggle",
	"iconPicker.cat.Transit": "Transit",
	"iconPicker.cat.Transportation": "Transportation",
	"iconPicker.cat.Travel": "Travel",
	"iconPicker.cat.Travel + Hotel": "Travel + Hotel",
	"iconPicker.cat.UI actions": "UI actions",
	"iconPicker.cat.Users + People": "Users + People",
	"iconPicker.cat.Vehicles": "Vehicles",
	"iconPicker.cat.Version control": "Version control",
	"iconPicker.cat.Weather": "Weather",
	"iconPicker.cat.Writing": "Writing",
	"iconPicker.cat.Zodiac": "Zodiac",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}} is not downloaded yet",
	"iconPack.downloadDetail": "{{count}} icons · {{size}} · one-time download",
	"iconPack.download": "Download",
	"iconPack.downloading": "Downloading {{name}}…",
	"iconPack.downloadFailed":
		"Could not download {{name}}. Check your connection and try again.",
	"iconPack.retry": "Retry",
	"iconPack.faBrandsNotice":
		"Brand icons are trademarks of their respective owners. Their inclusion does not indicate endorsement. Please use them only to represent the company, product, or service they refer to.",
	"iconPack.artworkRestored": "Downloaded the icon artwork for {{names}}.",
	"iconPack.diskWriteFailed":
		"Callout Studio could not save the icon pack to disk, so it will need downloading again next time. The icons you pick are still saved with your settings.",

	// Icon licences & credits
	"credits.title": "Icon licences and credits",
	"credits.intro":
		"Callout Studio draws on several open icon libraries. Their licences are reproduced below, along with what was changed to use them here.",
	"credits.fullNotices": "Full third-party notices",
	"credits.pluginLicense":
		"Callout Studio's own code is 0BSD; the icon libraries keep their own licences.",

	// Context Menu
	"contextMenu.editCallout": "Edit callout settings",
	"contextMenu.copyMarkdown": "Copy callout Markdown",
	"contextMenu.openSettings": "Open Callout Studio settings",
	"contextMenu.setFoldClosed": "Set callout closed (-)",
	"contextMenu.setFoldOpen": "Set callout open (+)",
	"contextMenu.setFoldNone": "Make callout non-collapsible",
	"contextMenu.cutSection": "Cut heading section",
	"contextMenu.copySection": "Copy heading section",
	"contextMenu.deleteSection": "Delete heading section",

	// Heading callouts
	"heading.toggleFold": "Toggle fold",

	// Global settings section (per-role style popups)
	"settings.globalSettings": "Global settings",
	"settings.globalSettingsRegularDesc":
		"Add a callout token to a blockquote (e.g., `> [!type]`) to render Obsidian's native callout box. You can adjust its border, radius, font scale, and alignment.",
	"settings.globalSettingsHeadingDesc":
		"Add a callout token directly after the heading hashes (e.g., `## [!type]`) to render it as a styled callout heading. You can adjust its border, shape, and vertical spacing.",
	"settings.globalSettingsInlineDesc":
		"Add a callout token anywhere inside a line of text (e.g., `[!type]`) to render it as a small inline pill. You can adjust its border and shape.",
	"settings.globalSettingsCustomize": "Customize",

	// Callout types section
	"settings.calloutTypeRegular": "Regular callout",
	"settings.calloutTypeHeading": "Heading callout",
	"settings.calloutTypeInline": "Inline callout",

	// Context menu customization
	"settings.customizeMenu": "Customize menu items",
	"settings.customizeMenuDesc":
		"Choose which right-click actions appear for each callout type and reorder them. Works in source mode and Live Preview.",
	"settings.customizeMenuButton": "Customize menu items",
	"menuCustomize.title": "Customize right-click menu",
	"menuCustomize.desc":
		"Toggle actions on or off and drag the handle to reorder them. Changes are saved automatically.",
	"menuCustomize.regular": "Regular callout",
	"menuCustomize.heading": "Heading callout",
	"menuCustomize.inline": "Inline callout",
	"menuCustomize.dragHandle": "Drag to reorder",
	"menuItem.edit": "Edit callout",
	"menuItem.openSettings": "Open settings",
	"menuItem.copyMarkdown": "Copy Markdown",
	"menuItem.foldDefaults": "Fold defaults (open / closed / none)",
	"menuItem.cutSection": "Cut section",
	"menuItem.copySection": "Copy section",
	"menuItem.deleteSection": "Delete section",

	// Confirm modal
	"confirm.ok": "Delete",
	"confirm.cancel": "Cancel",

	// Vault edge-case modals
	"vault.filesUpdated":
		"Updated {{count}} callout reference(s) in vault files.",
	"vault.idsUpdated":
		"Updated {{count}} callout ID(s) in vault files: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"Updated {{count}} callout title(s) in vault files: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "Replace with:",
	"vault.deleteWithout": "Delete without replacing",
	"vault.confirmDelete": "Confirm",
	"vault.confirmReplace": "Replace",
	"vault.replacePromptInUse":
		'"{{name}}" is used {{count}} time(s) in {{files}} file(s). Pick a callout to replace it with:',
	"vault.replacePromptUnused": 'Pick a callout to replace "{{name}}" with:',
	"vault.noReplacementAvailable":
		"No other callouts are available to replace this one.",
	"vault.convertedToPlainText":
		"Converted {{blocks}} callout block(s) in {{files}} file(s) to plain text.",
	"vault.resetAliasWarning":
		"{{count}} reference(s) in {{files}} file(s) use custom alias(es): {{aliases}}. These will stop working after reset. Continue?",
	"vault.resetConfirm": "Reset",
	"vault.resetAllInUse":
		"⚠ {{count}} callout reference(s) in {{files}} file(s) use custom callout types that will be deleted.",

	// Vault statistics modal
	"vaultStats.title": "Callout statistics",
	"vaultStats.totalCallouts": "Total callouts",
	"vaultStats.typesFound": "Types found",
	"vaultStats.filesWithCallouts": "Files with callouts",
	"vaultStats.filesScanned": "Markdown files scanned",
	"vaultStats.empty": "No callouts were found in Markdown notes.",
	"vaultStats.columnType": "Type",
	"vaultStats.columnName": "Name",
	"vaultStats.columnSource": "Source",
	"vaultStats.columnCount": "Count",
	"vaultStats.columnFiles": "Files",
	"vaultStats.unknown": "Unknown",
	"vaultStats.sourceBuiltIn": "Built-in",
	"vaultStats.sourceCustom": "Custom",
	"vaultStats.sourceAutoFallback": "Auto fallback",
	"vaultStats.sourceTheme": "CSS snippet",
	"vaultStats.sourceAlias": "Alias of {{id}}",
	"vaultStats.sourceUnknown": "Unknown",
	"vaultStats.close": "Close",

	// Import validation
	"import.title": "Import issues",
	"import.reportLeadIn":
		"Hmm, looks like the file you imported has been modified. Here is the list of issues:",
	"import.reportLeadInFatal":
		"Hmm, this file does not look like a Callout Studio export. It cannot be imported:",
	"import.entryHeading": "Entry {{index}} — {{label}}",
	"import.summary":
		"{{valid}} of {{total}} entries are valid · {{issues}} issue(s) found.",
	"import.btnCancel": "Cancel",
	"import.btnImportValid": "Import valid only ({{count}})",
	"import.err.notRecognized":
		"Unrecognized file: expected a callout definitions array or a Callout Studio export.",
	"import.warn.settingsIgnored":
		"The settings block was not a valid object and was ignored.",
	"import.warn.invalidGradient":
		"The background gradient was invalid and was ignored.",
	"import.err.parseFailed":
		"The file is not valid JSON and could not be parsed.",
	"import.err.entryNotObject": "Entry must be an object.",
	"import.err.requiredMissing":
		'Required field "{{field}}" is missing or has the wrong type.',
	"import.err.idEmpty": "ID must not be empty.",
	"import.err.idTooLong":
		'ID "{{value}}" is {{length}} characters; the maximum is {{max}}.',
	"import.err.idBadChar":
		'ID "{{value}}" contains invalid characters ("|", "[", "]", tabs, and line breaks are not allowed).',
	"import.err.idMetadata":
		'ID "{{value}}" contains a "|". In Obsidian everything after the first "|" is callout metadata, not part of the type, so this entry describes the "{{id}}" callout. Skipped, so your existing "{{id}}" is left untouched.',
	"import.err.displayNameEmpty": "Display name must not be empty.",
	"import.err.displayNameTooLong":
		"Display name is {{length}} characters; the maximum is {{max}}.",
	"import.err.boolField": '"{{field}}" must be a boolean (true or false).',
	"import.err.iconNotObject": "Icon must be an object.",
	"import.err.iconTypeInvalid":
		'Icon type "{{value}}" is not one of: {{types}}.',
	"import.warn.iconFieldIgnored":
		'"{{field}}" only applies to Material icons and is ignored for icon type {{type}}.',
	"import.err.iconValueEmpty": "Icon value must be a non-empty string.",
	"import.err.iconValueTooLong":
		"Icon value is unusually long ({{length}} characters).",
	"import.err.materialStyle":
		'Material icon style "{{value}}" is not one of: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'Material icon weight "{{value}}" must be an integer between 100 and 700, in steps of 100.',
	"import.warn.iconRecolorIgnored":
		'"recolor" only applies to your own pictures and is ignored for icon type {{type}}.',
	"import.err.iconRecolorInvalid":
		'"recolor" must be true or false (got "{{value}}").',
	"import.err.colorInvalid":
		'"{{field}}" must be a hex color like "#448aff" (got "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" must be a number between {{min}} and {{max}} (got "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" must be a number between {{min}} and {{max}} (got "{{value}}").',
	"import.err.iconAdjustShape":
		'"iconAdjust" must be an object mapping a callout type ("regular", "heading", "inline") to its icon size and offsets.',
	"import.err.aliasesNotArray": '"aliases" must be an array of strings.',
	"import.err.aliasNotString": "Alias must be a string.",
	"import.err.aliasDup": 'Alias "{{value}}" is duplicated within this entry.',
	"import.err.tooManyIds":
		"Too many IDs ({{count}}); each callout can have at most {{max}} IDs (primary + aliases).",
	"import.err.metadataShape":
		'"metadata" must be an object whose values are all strings.',
	"import.warn.unknownFields": "Unknown field(s) ignored: {{fields}}.",
	"import.err.duplicateInFile":
		'ID/alias "{{value}}" is already used by entry #{{first}} in this file.',
	"import.err.aliasConflict":
		'Alias "{{value}}" is already used by another callout ("{{other}}") in your vault.',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" was true while "foldable" was false; defaultFolded was reset to false.',
	"import.warn.imageMissing":
		"This callout uses a picture that is not in the file and not in this " +
		"vault, so it will show a placeholder icon until you give it a new one.",
	"import.err.paletteIdInvalid":
		'"paletteId" must be a non-empty text ID (got "{{value}}").',
	"import.warn.iconNameUnknown":
		'There is no "{{value}}" icon in {{type}}, so the default icon was used instead.',
	"import.warn.cmIconUnknownNew":
		'There is no "{{value}}" icon in Obsidian, so the default icon was used instead.',
	"import.warn.cmIconUnknownExisting":
		'There is no "{{value}}" icon in Obsidian, so "{{id}}" kept the icon it already had.',

	// Import — source chooser
	"import.chooseSource": "Import from",
	"import.sourceStudio": "Callout Studio",
	"import.sourceStudioDesc":
		"Load a .json file exported from Callout Studio.",
	"import.sourceCalloutManager": "Callout Manager",
	"import.sourceCalloutManagerDesc":
		"Paste the styles you copied from Callout Manager's Copy button.",
	"import.sourceAdmonition": "Admonition",
	"import.sourceAdmonitionDesc":
		"Bring your custom admonitions over from the Admonition plugin.",

	// Import — Callout Manager paste flow
	"import.cmTitle": "Import from Callout Manager",
	"import.cmInstructions":
		"In Callout Manager, use its Copy button to copy your customized " +
		"callout styles, then paste them below.",
	"import.cmPlaceholder": "Paste the copied styles here…",
	"import.cmBtnCancel": "Cancel",
	"import.cmBtnImport": "Import",
	"import.err.cmNoBlocksFound":
		"No Callout Manager styles were found in the pasted text.",
	"import.err.cmNoColorForNew":
		'No usable color was found for the new callout "{{value}}"; it was skipped.',
	"import.err.cmIdConflict":
		'ID "{{value}}" is already used as an alias by another callout ("{{other}}") and was skipped.',

	// Import — Admonition
	"import.admTitle": "Import from Admonition",
	"import.admInstructions":
		"Each admonition comes over as a callout with its name, icon, and " +
		"color. Settings Callout Studio has no equivalent for (command, copy " +
		"button, hidden title) are left behind.",
	"import.admFromVault": "This vault",
	"import.admVaultChecking": "Looking for the Admonition plugin…",
	"import.admVaultFound": "{{count}} custom admonition(s) found.",
	"import.admVaultNotFound":
		"No custom admonitions were found in this vault.",
	"import.admFromFile": "A file",
	"import.admFromFileDesc": "An admonitions.json file, or a shared pack.",
	"import.admChooseFile": "Choose file…",
	"import.admPasteLabel": "Or paste the JSON here:",
	"import.admPlaceholder": "Paste your admonitions here…",
	"import.admBtnCancel": "Cancel",
	"import.admBtnImport": "Import",
	"import.err.admNotRecognized":
		"Unrecognized file: expected a list of admonitions, or an Admonition " +
		"data.json.",
	"import.err.admNoEntries": "No admonitions were found to import.",
	"import.err.admTypeMissing":
		'This admonition has no "type" and was skipped.',
	"import.warn.admIconUnknown":
		'No icon named "{{value}}" was found in any icon library, so the default icon was used instead.',
	"import.warn.admIconUnknownExisting":
		'No icon named "{{value}}" was found in any icon library, so "{{id}}" kept the icon it already had.',
	"import.warn.admImageFailed":
		"The uploaded picture could not be read, so the default icon was used instead.",
	"import.warn.admIconWithCss":
		"This admonition is styled by a CSS snippet in Admonition. That styling " +
		"is not part of the import, so only its name, icon, and color came over.",
	"import.warn.admNoColor": "No color was set, so the default blue was used.",
	"import.warn.admTitleTruncated":
		"The title is {{length}} characters; it was shortened to {{max}}.",

	// Footer
	"footer.tagline":
		"Have feedback, comments, or suggestions? I'd love to hear from you!",
	"footer.madeBy": "Made by Niv  •  ",
};
