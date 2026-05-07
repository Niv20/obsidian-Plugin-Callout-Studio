export const en: Record<string, string> = {
	// Commands
	"cmd.openSettings": "Open settings",
	"cmd.createCallout": "Create new callout type",
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
	"settings.rescanVaultHintPrefix":
		"Need to discover callouts from your vault?",
	"settings.rescanVaultHintAction": "Scan now",
	"settings.rescanComplete":
		"Re-scan complete: {{count}} new callout(s) added.",
	"replaceModal.deleteWithoutReplaceSuffix": "(falls back to default)",

	// First-run scan modal (shown once on first install for large vaults)
	"firstRun.title": "Find existing callouts in your vault?",
	"firstRun.body":
		"Callout Studio can scan your vault to discover callouts you already use, so they appear in your settings list and adopt your fallback style.",
	"firstRun.heavyVaultNote":
		"Your vault has {{count}} markdown files — the scan may take a few seconds.",
	"firstRun.laterHint":
		"You can always run this later from Settings → Vault insights & maintenance → Re-scan vault.",
	"firstRun.scanNow": "Scan now",
	"firstRun.noThanks": "No thanks",
	"firstRun.autoScanComplete":
		"Callout Studio scanned your vault and added {{count}} callout(s).",
	"firstRun.scanning": "Scanning…",

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
	"deleteModal.replaceInstead": "Replace instead…",
	"deleteModal.deleteInUse": "Delete (convert to plain text)",
	"deleteModal.deleteUnused": "Delete callout",

	// Settings — Section headings
	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "My callout types",
	"settings.builtInCallouts": "Built-in callouts",
	"settings.contextMenu": "Context menu",
	"settings.autocomplete": "Autocomplete",
	"settings.keyboardShortcuts": "Keyboard shortcuts",
	"settings.iconSources": "Google Material Icons",
	"settings.iconSourcesDesc":
		"Material icons are downloaded from Google (fonts.gstatic.com, fonts.googleapis.com, fonts.google.com) only when you pick or preview a Material icon, and are cached locally afterwards. No data is sent to Google. Lucide and Custom SVG icons work fully offline.",
	"settings.colorMode": "Color mode",
	"settings.importExport": "Import / export",
	"settings.import": "Import",
	"settings.export": "Export",
	"settings.importDesc":
		"Import your Callout Studio progress from another vault using a JSON file.",
	"settings.exportDesc": "Save all your custom callout types in JSON format.",
	"settings.importConflictNotice":
		"Imported {{count}} callout type(s); {{overwritten}} existing entry/entries were overwritten.",

	// Settings — Toolbar
	"settings.addNewCallout": "+ Add new callout",
	"settings.refresh": "Refresh",
	"settings.moreActions": "More actions",
	"settings.importCSS": "Import from CSS snippet",
	"settings.importJSON": "Import from JSON",
	"settings.exportAll": "Export all",

	// Settings — Empty states
	"settings.noCalloutsYet":
		'No custom callouts yet. Click "+ Add new callout" to create one.',
	"settings.noCalloutsNow": "No custom callouts for now.",
	"settings.noMatch": "No callouts match your search.",

	// Settings — Row actions
	"settings.editAria": "Edit {{name}}",
	"settings.resetAria": "Reset {{name}} to default",
	"settings.deleteAria": "Delete {{name}}",
	"settings.swapAria":
		"Swap {{name}} (current fallback) with another callout in the vault",
	"settings.replaceAria":
		"Replace {{name}} in the vault with another callout",
	"settings.moreRowActionsAria": "More actions for {{name}}",
	"settings.usageInfo": "{{count}} use(s) in {{files}} file(s)",
	"settings.replaceAction": "Replace in vault…",
	"settings.deleteAction": "Delete…",
	"settings.resetAction": "Reset to default",
	"settings.makeFallbackAction": "Use default fallback style",
	"settings.deleteConfirm": 'Delete callout "{{name}}"?',
	"settings.lightLabel": "L",
	"settings.darkLabel": "D",
	"settings.lightColorAria": "Light: {{color}}",
	"settings.darkColorAria": "Dark: {{color}}",
	"settings.colorPairAria": "Light: {{light}} · Dark: {{dark}}",

	// Settings — Fallback callout
	"settings.fallbackCallout": "Default fallback callout",
	"settings.fallbackCalloutDesc":
		"Unrecognized callout types in your vault will inherit the style of this callout.",

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
	"settings.fontScaleGroup": "Font scale",
	"settings.titleScale": "Title",
	"settings.contentScale": "Content",
	"settings.shapeGroup": "Shape",
	"settings.borderRadius": "Corner rounding",
	"settings.borderRadiusDesc": "Border-radius in pixels for callout corners",
	"settings.previewTitle": "Preview",
	"settings.previewCalloutTitle": "Example callout",
	"settings.previewCalloutContent":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",

	// Settings — Context menu
	"settings.enableContextMenu": "Enable callout context actions",
	"settings.enableContextMenuDesc":
		"Add extra actions to Obsidian's right-click menu when you right-click a callout. Works in Reading view, Source mode, and Live Preview.",
	"settings.showEditCallout": 'Show "Edit callout settings"',
	"settings.showOpenSettings": 'Show "Open callout studio settings"',
	"settings.showCopyMarkdown": 'Show "Copy callout Markdown"',

	// Settings — Autocomplete
	"settings.enableAutocomplete": "Enable [! Autocomplete",
	"settings.enableAutocompleteDesc":
		'Show suggestions when you type "[!" inside a blockquote in the editor. Pick a callout type from the list to insert a complete callout header.',
	"settings.showIconPreviews": "Show icon previews in autocomplete",
	"settings.showColorPreviews": "Show color previews",

	// Settings — Keyboard shortcuts
	"settings.openHotkeys": "Callout Studio hotkeys",
	"settings.openHotkeysDesc":
		"Open Obsidian's hotkeys settings for Callout Studio commands, where you can choose your own shortcuts for Create new callout type, Open settings, Unwrap from callout, and Wrap in callout. No shortcuts are assigned by default.",
	"settings.openHotkeysButton": "Open hotkey settings",

	// Settings — Icon sources
	"settings.lucideIcons": "Lucide icons",
	"settings.lucideIconsDesc": "Built-in Obsidian icons (~1,300 icons)",
	"settings.materialIcons": "Google material icons",
	"settings.materialIconsDesc":
		"Requires internet or local cache (~3,000 icons)",
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

	"settings.colorFormat": "Color format",

	// Settings — Reset
	"settings.vaultMaintenance": "Vault insights & maintenance",
	"settings.vaultStats": "Callout statistics",
	"settings.vaultStatsDesc":
		"Count every callout block in your Markdown notes and group them by type.",
	"settings.vaultStatsButton": "View statistics",
	"settings.vaultStatsScanning": "Scanning...",
	"settings.resetAll": "Reset",
	"settings.resetAllDesc":
		"Delete all user callouts, reset built-in callouts, global styles (borders, font scale, shape), and downloaded Material SVGs.",
	"settings.resetAllButton": "Reset everything",
	"settings.resetAllConfirm":
		"This will delete all custom callouts, reset built-in callouts, global styles, and all cached Material SVGs. This action cannot be undone. Are you sure?",
	"notice.resetAllDone": "Everything has been reset to defaults.",

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
	"notice.iconDownloadFailed":
		'Failed to download Material icon "{{name}}". Check your internet connection.',
	"notice.nothingToWrap": "Nothing to wrap.",
	"notice.selectionContainsNoContent": "Selection contains no content.",
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
	"editor.iconColor": "Main color",
	"editor.palettes": "Presets",
	"editor.paletteDefault": "Default blue",
	"editor.paletteNone": "— Select a preset —",
	"editor.paletteGroupObsidian": "Obsidian callouts",
	"editor.paletteGroupPresets": "Color presets",
	"editor.foldable": "Foldable",
	"editor.foldableDesc":
		"Choose whether the callout can be folded and which default state to apply across the vault.",
	"editor.foldOff": "Off",
	"editor.foldOpen": "Open by default",
	"editor.foldClosed": "Closed by default",
	"editor.expandPreview": "Expand preview",
	"editor.collapsePreview": "Collapse preview",
	"editor.cancel": "Cancel",
	"editor.saveChanges": "Save changes",
	"editor.createCallout": "Create callout",
	"editor.nameRequired":
		"A display name is required before creating a callout.",
	"editor.noChangesToSave": "No changes were made.",
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
	"iconPicker.searchLucide": "Search Lucide icons...",
	"iconPicker.loadMore": "Load more",
	"iconPicker.searchMaterial": "Search Material icons...",
	"iconPicker.iconsLoading": "Icons are loading, please wait\u2026",
	"iconPicker.loadFailed": "Failed to load Material icons: {{error}}",
	"iconPicker.allCategories": "All categories",
	"iconPicker.noIconSelected": "No icon selected",
	"iconPicker.noResults": "No icons match your search.",
	"iconPicker.delete": "Delete",

	// Context Menu
	"contextMenu.editCallout": "Edit callout settings",
	"contextMenu.copyMarkdown": "Copy callout Markdown",
	"contextMenu.openSettings": "Open callout studio settings",

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
	"vault.idsUpdated":
		"Updated {{count}} callout ID(s) in vault files: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"Updated {{count}} callout title(s) in vault files: {{oldTitle}} → {{newTitle}}",
	"vault.deleteInUse":
		'"{{name}}" is used {{count}} time(s) in {{files}} file(s). Choose how to proceed:',
	"vault.replaceWith": "Replace with:",
	"vault.selectCallout": "\u2014 Select a callout \u2014",
	"vault.replaceAndDelete": "Replace & delete",
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
	"import.err.notArray":
		"The top-level value must be an array of callout definitions.",
	"import.err.parseFailed":
		"The file is not valid JSON and could not be parsed.",
	"import.err.entryNotObject": "Entry must be an object.",
	"import.err.requiredMissing":
		'Required field "{{field}}" is missing or has the wrong type.',
	"import.err.idEmpty": "ID must not be empty.",
	"import.err.idTooLong":
		'ID "{{value}}" is {{length}} characters; the maximum is {{max}}.',
	"import.err.idBadChar":
		'ID "{{value}}" contains invalid characters (whitespace, "|", "[", or "]" are not allowed).',
	"import.err.displayNameEmpty": "Display name must not be empty.",
	"import.err.displayNameTooLong":
		"Display name is {{length}} characters; the maximum is {{max}}.",
	"import.err.boolField": '"{{field}}" must be a boolean (true or false).',
	"import.err.iconNotObject": "Icon must be an object.",
	"import.err.iconTypeInvalid":
		'Icon type "{{value}}" is not one of: lucide, material, emoji.',
	"import.err.iconValueEmpty": "Icon value must be a non-empty string.",
	"import.err.iconValueTooLong":
		"Icon value is unusually long ({{length}} characters).",
	"import.err.materialStyle":
		'Material icon style "{{value}}" is not one of: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'Material icon weight "{{value}}" must be an integer between 100 and 700, in steps of 100.',
	"import.err.colorInvalid":
		'"{{field}}" must be a hex color like "#448aff" (got "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" must be a number between {{min}} and {{max}} (got "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" must be a number between {{min}} and {{max}} (got "{{value}}").',
	"import.err.aliasesNotArray": '"aliases" must be an array of strings.',
	"import.err.aliasNotString": "Alias must be a string.",
	"import.err.aliasDup": 'Alias "{{value}}" is duplicated within this entry.',
	"import.err.tooManyIds":
		"Too many IDs ({{count}}); each callout can have at most {{max}} IDs (primary + aliases).",
	"import.err.metadataShape":
		'"metadata" must be an object whose values are all strings.',
	"import.err.unknownFields": "Unknown field(s) ignored: {{fields}}.",
	"import.err.duplicateInFile":
		'ID/alias "{{value}}" is already used by entry #{{first}} in this file.',
	"import.err.aliasConflict":
		'Alias "{{value}}" is already used by another callout ("{{other}}") in your vault.',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" was true while "foldable" was false; defaultFolded was reset to false.',

	// Footer
	"footer.tagline":
		"Have feedback, comments, or suggestions? I'd love to hear from you!",
	"footer.madeBy": "Made by Niv  •  ",
};
