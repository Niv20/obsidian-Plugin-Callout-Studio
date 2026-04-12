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

	// Settings — Global style
	"settings.globalStyle": "Global callout style",
	"settings.globalStyleDesc": "These settings affect all callouts globally.",
	"settings.border": "Borders",
	"settings.borderDesc":
		"Select which sides of the callout have a visible border",
	"settings.borderAll": "All",
	"settings.borderTop": "Top",
	"settings.borderRight": "Right",
	"settings.borderBottom": "Bottom",
	"settings.borderLeft": "Left",
	"settings.borderWidth": "Border thickness",
	"settings.borderWidthDesc": "Thickness in pixels for active borders",
	"settings.alignToTitle": "Align to title",
	"settings.alignToTitleDesc":
		"Content text starts at the same vertical line as the title instead of the icon",
	"settings.fontScaleGroup": "Font scale",
	"settings.titleScale": "Title",
	"settings.contentScale": "Content",
	"settings.shapeGroup": "Shape",
	"settings.borderRadius": "Corner rounding",
	"settings.borderRadiusDesc": "Border-radius in pixels for callout corners",
	"settings.previewTitle": "Preview",
	"settings.previewCalloutTitle": "Example callout",
	"settings.previewCalloutContent":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",

	// Settings — Popup
	"settings.enablePopup": "Enable context menu popup",
	"settings.enablePopupDesc":
		"Add extra actions to the right-click context menu when your cursor is inside a callout. Works in Source mode and in Live Preview while editing callout content.",
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
	"settings.showEditCallout": 'Show "Edit callout settings"',
	"settings.showOpenSettings": 'Show "Open callout studio settings"',
	"settings.showCopyMarkdown": 'Show "Copy callout Markdown"',
	"settings.showEditButton": 'Show "edit callout" button',
	"settings.popupAnimation": "Popup animation",
	"settings.animFade": "Fade",
	"settings.animSlide": "Slide",
	"settings.animScale": "Scale",
	"settings.animNone": "None",

	// Settings — Autocomplete
	"settings.enableAutocomplete": "Enable [! Autocomplete",
	"settings.enableAutocompleteDesc":
		'Show suggestions when you type "[!" inside a blockquote in the editor. Pick a callout type from the list to insert a complete callout header.',
	"settings.showIconPreviews": "Show icon previews in autocomplete",
	"settings.showColorPreviews": "Show color previews",

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
	"settings.materialWeightDefault": "Material icons weight default",
	"settings.materialWeightDefaultDesc":
		"Stroke thickness for Material icons (100 = thin, 700 = bold)",
	"settings.materialCache": "Material icon cache",
	"settings.materialCacheDesc":
		"Individual Material icon SVGs are downloaded when you select one for a callout, so they work offline and in PDF export.",
	"settings.svgCache": "Downloaded SVGs",
	"settings.svgCacheInfo": "{{count}} icons · {{size}}",
	"settings.svgCacheEmpty": "No Material SVGs cached yet.",
	"settings.clearSvgCache": "Clear",
	"settings.viewCachedSvgs": "View",
	"settings.cachedSvgsTitle": "Cached Material SVGs",

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

	// Settings — Reset
	"settings.resetAll": "Reset",
	"settings.resetAllDesc":
		"Delete all user callouts, reset built-in callouts, global styles (borders, font scale, shape), custom SVG icons, and downloaded Material SVGs.",
	"settings.resetAllButton": "Reset everything",
	"settings.resetAllConfirm":
		"This will delete all custom callouts, reset built-in callouts, global styles, custom SVG icons, and all cached Material SVGs. This action cannot be undone. Are you sure?",
	"notice.resetAllDone": "Everything has been reset to defaults.",

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
	"notice.svgCacheCleared": "Material SVG cache cleared.",

	// Callout Editor
	"editor.editCallout": "Edit callout",
	"editor.newCallout": "New callout",
	"editor.displayName": "Display name",
	"editor.displayNameDesc": "The human-readable label shown in the UI",
	"editor.displayNameBuiltIn":
		"Display name cannot be changed for built-in callouts",
	"editor.displayNamePlaceholder": "My warning",
	"editor.calloutIds": "Callout IDs",
	"editor.calloutIdsDesc":
		"All identifiers for this callout. Press Enter or Space to add.",
	"editor.calloutIdsPlaceholder": "Add ID...",
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
	"editor.palettes": "Presets",
	"editor.paletteNone": "— Select a preset —",
	"editor.paletteGroupObsidian": "Obsidian callouts",
	"editor.paletteGroupPresets": "Color presets",
	"editor.foldable": "Foldable",
	"editor.foldableDesc": "Allow the callout to be collapsed/expanded",
	"editor.defaultFolded": "Default folded",
	"editor.defaultFoldedDesc": "Start the callout in a collapsed state",
	"editor.cancel": "Cancel",
	"editor.saveChanges": "Save changes",
	"editor.createCallout": "Create callout",
	"editor.downloadingIcon": "Downloading icon…",
	"editor.idEmpty": "At least one ID is required",
	"editor.idExists": "A callout with this ID already exists",
	"editor.idConflict": "This ID conflicts with an existing callout",
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
	"iconPicker.searchMaterial": "Search Material icons...",
	"iconPicker.iconsLoading": "Icons are loading, please wait\u2026",
	"iconPicker.loadFailed": "Failed to load Material icons: {{error}}",
	"iconPicker.allCategories": "All categories",
	"iconPicker.nameLabel": "Name:",
	"iconPicker.namePlaceholder": "my-icon-name",
	"iconPicker.svgPlaceholder":
		"Paste SVG markup here, or drag and drop an SVG file...",
	"iconPicker.addSvg": "Add SVG icon",
	"iconPicker.nameInvalid":
		"Name must contain only lowercase letters, numbers, and hyphens.",
	"iconPicker.nameExists": "An SVG icon with this name already exists.",
	"iconPicker.invalidSvg": "Invalid SVG markup. Please check the input.",
	"iconPicker.svgTooLarge":
		"SVG exceeds the 100 KB size limit. Use a simpler icon.",
	"iconPicker.svgGallery": "SVG gallery",
	"iconPicker.noSvgIcons": "No custom SVG icons yet.",
	"iconPicker.noIconSelected": "No icon selected",
	"iconPicker.noResults": "No icons match your search.",
	"iconPicker.delete": "Delete",

	// Context Menu
	"contextMenu.editCallout": "Edit callout settings",
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

	// Vault edge-case modals
	"vault.renameConfirm":
		'{{count}} callout reference(s) in {{files}} file(s) use the removed ID(s): {{oldIds}}. Update them to "{{newId}}"?',
	"vault.updateFiles": "Update files",
	"vault.skip": "Skip",
	"vault.filesUpdated":
		"Updated {{count}} callout reference(s) in vault files.",
	"vault.deleteInUse":
		'"{{name}}" is used {{count}} time(s) in {{files}} file(s). Choose how to proceed:',
	"vault.replaceWith": "Replace with",
	"vault.selectCallout": "\u2014 Select a callout \u2014",
	"vault.replaceAndDelete": "Replace & delete",
	"vault.deleteWithout": "Delete without replacing",
	"vault.resetAliasWarning":
		"{{count}} reference(s) in {{files}} file(s) use custom alias(es): {{aliases}}. These will stop working after reset. Continue?",
	"vault.resetConfirm": "Reset",
	"vault.resetAllInUse":
		"⚠ {{count}} callout reference(s) in {{files}} file(s) use custom callout types that will be deleted.",
};
