export const en: Record<string, string> = {
	// Commands
	"cmd.openSettings": "Open settings",
	"cmd.createCallout": "Create new callout type",

	// Settings — Section headings
	"settings.myCalloutTypes": "My callout types",
	"settings.builtInCallouts": "Built-in callouts",
	"settings.contextMenuPopup": "Context menu popup",
	"settings.autocomplete": "Autocomplete",
	"settings.iconSources": "Icon sources",
	"settings.colorMode": "Color mode",

	// Settings — Toolbar
	"settings.searchPlaceholder": "Filter by name or ID...",
	"settings.addNewCallout": "+ Add new callout",
	"settings.moreActions": "More actions",
	"settings.importCSS": "Import from CSS snippet",
	"settings.importJSON": "Import from JSON",
	"settings.exportAll": "Export all",

	// Settings — Empty states
	"settings.noCalloutsYet":
		'No custom callouts yet. Click "+ Add new callout" to create one.',
	"settings.noMatch": "No callouts match your search.",

	// Settings — Row actions
	"settings.editAria": "Edit {{name}}",
	"settings.resetAria": "Reset {{name}} to default",
	"settings.deleteAria": "Delete {{name}}",
	"settings.deleteConfirm": 'Delete callout "{{name}}"?',
	"settings.lightLabel": "L",
	"settings.darkLabel": "D",
	"settings.lightColorAria": "Light: {{color}}",
	"settings.darkColorAria": "Dark: {{color}}",

	// Settings — Popup
	"settings.enablePopup": "Enable context menu popup",
	"settings.enablePopupDesc":
		"Show a semi-transparent floating panel anchored to the right-click context menu. It shows all available callout types and lets you quickly insert, convert, or edit callouts without opening the settings panel.",
	"settings.popupPosition": "Popup position",
	"settings.topLeft": "Top-left",
	"settings.topRight": "Top-right",
	"settings.cursor": "Cursor",
	"settings.popupTransparency": "Popup transparency",
	"settings.popupTransparencyDesc":
		"0% = fully opaque, 100% = fully transparent",
	"settings.backdropBlur": "Backdrop blur",
	"settings.backdropBlurDesc": "Blur amount in pixels (0\u201320)",
	"settings.showIconsPopup": "Show icons in popup",
	"settings.showColorDots": "Show color dots in popup",
	"settings.maxItemsPopup": "Max items visible in popup",
	"settings.showConvertSubmenu": 'Show "convert to\u2026" submenu',
	"settings.showEditButton": 'Show "edit callout" button',
	"settings.popupAnimation": "Popup animation",
	"settings.animFade": "Fade",
	"settings.animSlide": "Slide",
	"settings.animScale": "Scale",
	"settings.animNone": "None",

	// Settings — Autocomplete
	"settings.enableAutocomplete": "Enable [! Autocomplete",
	"settings.enableAutocompleteDesc":
		'Show suggestions when you type "[!" in the editor',
	"settings.showIconPreviews": "Show icon previews in autocomplete",
	"settings.showColorPreviews": "Show color previews",
	"settings.maxSuggestions": "Max suggestions",
	"settings.triggerCharacter": "Trigger character",
	"settings.triggerCharacterDesc":
		"The autocomplete is triggered when you type this sequence",

	// Settings — Icon sources
	"settings.lucideIcons": "Lucide icons",
	"settings.lucideIconsDesc": "Built-in Obsidian icons (~1,300 icons)",
	"settings.materialIcons": "Google material icons",
	"settings.materialIconsDesc":
		"Requires internet or local cache (~3,000 icons)",
	"settings.customSvg": "Custom SVG",
	"settings.customSvgDesc": "User-uploaded SVG icons",
	"settings.materialStyleDefault": "Material icons style default",
	"settings.styleOutlined": "Outlined",
	"settings.styleFilled": "Filled",
	"settings.styleRounded": "Rounded",
	"settings.styleSharp": "Sharp",
	"settings.cacheMaterial": "Cache material icons offline",
	"settings.cacheMaterialDesc": "Downloads icon metadata for offline use",

	// Settings — Color mode
	"settings.colorAppMode": "Color application mode",
	"settings.colorAppModeDesc":
		"Auto follows Obsidian's current theme (recommended)",
	"settings.colorAuto": "Auto (recommended)",
	"settings.colorForceLight": "Force light colors only",
	"settings.colorForceDark": "Force dark colors only",
	"settings.colorFormat": "Color format",
	"settings.showContrastWarning": "Show color contrast warning",
	"settings.showContrastWarningDesc":
		"Warns if icon color has low contrast against callout background",

	// Settings — Language
	"settings.language": "Language",
	"settings.languageDesc": "Plugin interface language",
	"settings.languageAuto": "Auto (follow Obsidian)",

	// Notices
	"notice.importedCSS":
		"Imported {{count}} callout type(s) from CSS snippets.",
	"notice.noNewCSS": "No new callout types found in CSS snippets.",
	"notice.failedCSS": "Failed to read CSS snippets folder.",
	"notice.exported": "Callouts exported to callout-studio-callouts.json",
	"notice.invalidJSON": "Invalid JSON format: expected an array.",
	"notice.importedJSON": "Imported {{count}} callout type(s) from JSON.",
	"notice.noNewJSON":
		"No new callout types were imported (ids may already exist).",
	"notice.failedJSON": "Failed to parse JSON file.",

	// Callout Editor
	"editor.editCallout": "Edit callout",
	"editor.newCallout": "New callout",
	"editor.displayName": "Display name",
	"editor.displayNameDesc": "The human-readable label shown in the UI",
	"editor.displayNamePlaceholder": "My warning",
	"editor.calloutId": "Callout ID",
	"editor.calloutIdDesc":
		"Unique identifier used in Markdown syntax: > [!id]",
	"editor.calloutIdPlaceholder": "My-warning",
	"editor.icon": "Icon",
	"editor.light": "Light",
	"editor.dark": "Dark",
	"editor.livePreview": "Live preview",
	"editor.iconAdjustment": "Icon adjustment",
	"editor.size": "Size",
	"editor.horizontalOffset": "Horizontal offset",
	"editor.verticalOffset": "Vertical offset",
	"editor.colors": "Colors",
	"editor.background": "Background",
	"editor.text": "Text",
	"editor.iconColor": "Icon",
	"editor.foldable": "Foldable",
	"editor.foldableDesc": "Allow the callout to be collapsed/expanded",
	"editor.defaultFolded": "Default folded",
	"editor.defaultFoldedDesc": "Start the callout in a collapsed state",
	"editor.cancel": "Cancel",
	"editor.saveChanges": "Save changes",
	"editor.createCallout": "Create callout",
	"editor.idEmpty": "ID cannot be empty",
	"editor.idExists": "A callout with this ID already exists",
	"editor.untitledCallout": "Untitled Callout",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",

	// Icon Picker
	"iconPicker.pickIcon": "Pick an icon",
	"iconPicker.confirm": "Confirm",
	"iconPicker.cancel": "Cancel",
	"iconPicker.lucide": "Lucide",
	"iconPicker.material": "Material",
	"iconPicker.customSvg": "Custom SVG",
	"iconPicker.searchLucide": "Search Lucide icons...",
	"iconPicker.loadMore": "Load more",
	"iconPicker.materialDisabled":
		"Material icons are disabled in settings. Enable them under icon sources.",
	"iconPicker.searchMaterial": "Search Material icons...",
	"iconPicker.iconsLoading": "Icons are loading, please wait\u2026",
	"iconPicker.loadFailed": "Failed to load Material icons: {{error}}",
	"iconPicker.allCategories": "All categories",
	"iconPicker.svgDisabled":
		"Custom SVG icons are disabled in settings. Enable them under icon sources.",
	"iconPicker.nameLabel": "Name:",
	"iconPicker.namePlaceholder": "my-icon-name",
	"iconPicker.svgPlaceholder":
		"Paste SVG markup here, or drag and drop an SVG file...",
	"iconPicker.addSvg": "Add SVG icon",
	"iconPicker.nameInvalid":
		"Name must contain only lowercase letters, numbers, and hyphens.",
	"iconPicker.nameExists": "An SVG icon with this name already exists.",
	"iconPicker.invalidSvg": "Invalid SVG markup. Please check the input.",
	"iconPicker.svgGallery": "SVG gallery",
	"iconPicker.noSvgIcons": "No custom SVG icons yet.",
	"iconPicker.noIconSelected": "No icon selected",
	"iconPicker.delete": "Delete",

	// Context Menu
	"contextMenu.convertTo": "Convert callout to\u2026",
	"contextMenu.copyMarkdown": "Copy callout Markdown",
	"contextMenu.openSettings": "Open callout studio settings",

	// Transparent Popup
	"popup.convertTo": "Convert callout to:",
	"popup.convertToAria": "Convert to {{name}}",
	"popup.copyMarkdown": "Copy callout markdown",
	"popup.customize": "Customize this callout type",
	"popup.createNew": "Create new type based on this",
	"popup.openSettings": "Open callout studio settings \u2192",

	// Confirm modal
	"confirm.ok": "Delete",
	"confirm.cancel": "Cancel",
};
