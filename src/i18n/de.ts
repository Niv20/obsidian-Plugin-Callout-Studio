export const de: Record<string, string> = {
	"cmd.openSettings": "Einstellungen öffnen",
	"cmd.createCallout": "Neuen Callout-Typ erstellen",
	"cmd.insertEmptyCallout": "Leeren Callout einfügen",
	"cmd.calloutWrap": "In Callout einbetten",
	"cmd.calloutUnwrap": "Aus Callout entfernen",

	"autocomplete.createNew": 'Neuen Callout erstellen: "{{name}}"',

	"settings.fallbackTag": "Standard",
	"settings.fallbackTagAuto": "Automatischer Standard",
	"settings.rescanVault": "Vault erneut scannen",
	"settings.rescanVaultDesc":
		"Sucht unbekannte Callout-IDs in Notizen und fügt sie als Fallback-Einträge hinzu.",
	"settings.rescanVaultHintAction": "Jetzt scannen",
	"settings.rescanComplete":
		"Scan abgeschlossen: {{count}} neuer/neue Callout(s) hinzugefügt.",
	"replaceModal.deleteWithoutReplaceSuffix": "(fällt auf Standard zurück)",

	"firstRun.title": "Vorhandene Callouts im Vault suchen?",
	"firstRun.body":
		"Callout Studio kann Ihren Vault scannen, um bereits verwendete Callouts zu entdecken, sodass sie in Ihrer Einstellungsliste erscheinen und Ihren Fallback-Stil übernehmen.",
	"firstRun.heavyVaultNote":
		"Ihr Vault hat {{count}} Markdown-Dateien – der Scan kann einige Sekunden dauern.",
	"firstRun.laterHint":
		"Sie können dies jederzeit später über Einstellungen → Vault-Einblicke & Wartung → Vault erneut scannen ausführen.",
	"firstRun.scanNow": "Jetzt scannen",
	"firstRun.noThanks": "Nein danke",
	"firstRun.autoScanComplete":
		"Callout Studio hat Ihren Vault gescannt und {{count}} Callout(s) hinzugefügt.",
	"firstRun.scanning": "Scannt",

	"welcome.tooltip": "Über Callout Studio",
	"welcome.title": "Willkommen bei Callout Studio",
	"welcome.tagline":
		"Ihre umfassende Lösung zur Verwaltung von Obsidian-Callouts.",
	"welcome.previewTitle": "In Aktion sehen",
	"welcome.sample":
		"Mit Callout Studio können Sie Callouts mit eigenem Symbol, eigenen Farben und Namen erstellen.\n\n" +
		"Sie können denselben Callout auf **drei** verschiedene Arten verwenden:\n\n" +
		"## [!tip] Als Überschrift\n" +
		"Um eine Überschrift in eine Callout-Überschrift zu verwandeln, fügen Sie `[!type]` direkt nach den `#` ein.\n\n" +
		"Möchten Sie einen Inline-Callout wie diesen [!warning]? Fügen Sie einfach `[!type]` mitten in einem Satz ein, ohne Ihren Lesefluss zu unterbrechen.\n\n" +
		"> [!note] Regulärer Callout\n" +
		"> Natürlich funktioniert der klassische Callout mit genau der gleichen Syntax, die Sie bereits kennen: `> [!type]`.\n\n" +
		"Callout Studio hat noch viel mehr zu bieten! [Mehr erfahren]({{repoUrl}}).\n",

	"deleteModal.title": 'Callout "{{name}}" löschen?',
	"deleteModal.bodyInUse":
		"Dieser Callout erscheint {{count}} Mal in {{files}} Datei(en).",
	"deleteModal.bodyInUseExplain":
		"Beim Löschen werden diese Blöcke in einfachen Text umgewandelt – sie verlieren ihre Formatierung und die Callout-Überschrift.",
	"deleteModal.replaceHint":
		"Sie können ihn stattdessen durch einen anderen Callout ersetzen, sodass der Vault-Inhalt als formatierter Callout erhalten bleibt.",
	"deleteModal.bodyUnused":
		'"{{name}}" wird in keiner Notiz verwendet, ist aber ein von Ihnen erstellter benutzerdefinierter Callout. Beim Löschen wird er aus dieser Liste entfernt.',
	"deleteModal.replaceInstead": "Stattdessen ersetzen",
	"deleteModal.deleteInUse": "Löschen (in einfachen Text umwandeln)",
	"deleteModal.deleteUnused": "Callout löschen",

	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "Meine Callout-Typen",
	"settings.builtInCallouts": "Integrierte Callouts",
	"settings.contextMenu": "Kontextmenü",
	"settings.autocomplete": "Autovervollständigung",
	"settings.keyboardShortcuts": "Tastaturkürzel",
	"settings.language": "Sprache",
	"settings.languageDesc":
		"Anzeigesprache für Callout Studio. Folgt standardmäßig der Oberflächensprache von Obsidian.",
	"settings.languageAuto": "Automatisch (wie Obsidian)",
	"settings.importExport": "Importieren / Exportieren",
	"settings.import": "Importieren",
	"settings.export": "Exportieren",
	"settings.importDesc":
		"Importieren Sie Ihren Callout Studio-Fortschritt aus einem anderen Vault per JSON-Datei.",
	"settings.exportDesc":
		"Alle benutzerdefinierten Callout-Typen im JSON-Format speichern.",
	"settings.importConflictNotice":
		"{{count}} Callout-Typ(en) importiert; {{overwritten}} bestehende Einträge wurden überschrieben.",

	"settings.addNewCallout": "+ Callout hinzufügen",

	"settings.noCalloutsNow": "Derzeit keine benutzerdefinierten Callouts.",

	"settings.editAria": "{{name}} bearbeiten",
	"settings.moreRowActionsAria": "Weitere Aktionen für {{name}}",
	"settings.usageInfo": "{{count}} Verwendung(en) in {{files}} Datei(en)",
	"settings.replaceAction": "Im Vault ersetzen",
	"settings.deleteAction": "Löschen",
	"settings.resetAction": "Auf Standard zurücksetzen",
	"settings.makeFallbackAction": "Standard-Fallback-Stil verwenden",
	"settings.colorSwatchAria": "Akzent: {{accent}} · Hintergrund: {{bg}}",

	"settings.fallbackCallout": "Standard-Fallback-Callout",
	"settings.fallbackCalloutDesc":
		"Unbekannte Callout-Typen im Vault übernehmen den Stil dieses Callouts.",

	"settings.globalStyle": "Globaler Callout-Stil",
	"settings.border": "Rahmen",
	"settings.borderAll": "Alle",
	"settings.borderTop": "Oben",
	"settings.borderRight": "Rechts",
	"settings.borderBottom": "Unten",
	"settings.borderLeft": "Links",
	"settings.borderWidth": "Rahmendicke",
	"settings.fontScaleGroup": "Schriftskalierung",
	"settings.titleScale": "Überschrift",
	"settings.contentScale": "Inhalt",
	"settings.inlineTextScale": "Text",
	"settings.shapeGroup": "Form",
	"settings.borderRadius": "Eckabrundung",
	"settings.alignGroup": "Ausrichtung",
	"settings.alignContent": "Inhalt am Titel ausrichten",
	"settings.headingSpacingGroup": "Überschriftenabstand",
	"settings.headingPadVertical": "Vertikaler Abstand",
	"settings.headingIconIndent": "Symboleinzug",
	"settings.headingGap": "Abstand zwischen Überschriften",
	"settings.styleDemoName": "Beispiel",
	"settings.previewTitle": "Vorschau",

	// Settings — Saved color palettes
	"settings.customPalettes": "Gespeicherte Farbpaletten",
	"settings.newPalette": "Neue Palette",
	"settings.customPalettesEmpty": "Derzeit keine gespeicherten Paletten.",
	"settings.editPaletteAria": "Palette {{name}} bearbeiten",
	"settings.deletePaletteAria": "Palette {{name}} löschen",
	"settings.deletePaletteConfirm":
		'Palette "{{name}}" löschen?\nCallouts, die ihre Farben verwenden, sind davon nicht betroffen.',
	"settings.enableAutocomplete": "[! Autovervollständigung aktivieren",
	"settings.enableAutocompleteDesc":
		'Zeigt Vorschläge an, wenn Sie "[!" in einem Blockzitat im Editor eingeben. Wählen Sie einen Callout-Typ aus der Liste, um eine vollständige Callout-Überschrift einzufügen.',

	"settings.openHotkeys": "Callout Studio-Tastaturkürzel",
	"settings.openHotkeysDesc":
		"Öffnet Obsidians Tastaturkürzel-Einstellungen für Callout Studio-Befehle, wo Sie eigene Kürzel für Neuen Callout-Typ erstellen, Einstellungen öffnen, Aus Callout entfernen und In Callout einbetten festlegen können. Standardmäßig sind keine Kürzel zugewiesen.",
	"settings.openHotkeysButton": "Tastaturkürzel öffnen",

	"settings.vaultMaintenance": "Vault-Einblicke & Wartung",
	"settings.vaultStats": "Callout-Statistiken",
	"settings.vaultStatsDesc":
		"Zählt alle Callout-Blöcke in Ihren Markdown-Notizen und gruppiert sie nach Typ.",
	"settings.vaultStatsButton": "Statistiken anzeigen",
	"settings.vaultStatsScanning": "Scannt",
	"settings.resetAll": "Zurücksetzen",
	"settings.resetAllDesc":
		"Löscht alle Benutzer-Callouts, setzt integrierte Callouts, globale Stile (Rahmen, Schriftskalierung, Form), gespeicherte Farbpaletten, die Anpassung des Rechtsklickmenüs und heruntergeladene Material-SVGs zurück.",
	"settings.resetAllButton": "Alles zurücksetzen",
	"settings.resetAllConfirm":
		"Dadurch werden alle benutzerdefinierten Callouts gelöscht, integrierte Callouts, globale Stile, gespeicherte Farbpaletten, die Anpassung des Rechtsklickmenüs und alle gecachten Material-SVGs zurückgesetzt. Diese Aktion kann nicht rückgängig gemacht werden. Sind Sie sicher?",
	"notice.resetAllDone": "Alles wurde auf die Standardwerte zurückgesetzt.",

	"notice.exported": "Callouts nach callout-studio-export.json exportiert",
	"notice.importedJSON": "{{count}} Callout-Typ(en) aus JSON importiert.",
	"notice.importedSettings": "Plugin-Einstellungen importiert.",
	"notice.noNewJSON":
		"Keine neuen Callout-Typen importiert (IDs möglicherweise bereits vorhanden).",
	"notice.iconDownloadFailed":
		'Material-Symbol "{{name}}" konnte nicht heruntergeladen werden. Es ist möglicherweise für diesen Stil/diese Stärke nicht verfügbar oder Sie sind offline.',
	"notice.nothingToWrap": "Nichts zum Einbetten.",
	"notice.cursorNotInsideCallout":
		"Der Cursor befindet sich nicht in einem Callout.",
	"notice.openHotkeysFailed":
		"Obsidians Tastaturkürzel-Einstellungen konnten nicht geöffnet werden.",
	"notice.filterHotkeysFailed":
		"Obsidians Tastaturkürzel wurden geöffnet, der Callout Studio-Filter konnte jedoch nicht angewendet werden.",

	"editor.editCallout": "Callout bearbeiten",
	"editor.newCallout": "Neuer Callout",
	"editor.displayName": "Anzeigename",
	"editor.displayNameDesc":
		"Die in der Benutzeroberfläche angezeigte lesbare Bezeichnung",
	"editor.displayNameBuiltIn":
		"Der Anzeigename kann bei integrierten Callouts nicht geändert werden",
	"editor.displayNamePlaceholder": "Mein Callout",
	"editor.calloutIds": "Callout-IDs",
	"editor.calloutIdsDesc":
		"Alle Bezeichner für diesen Callout. Leerzeichen sind erlaubt.\nEnter oder die +-Schaltfläche drücken zum Hinzufügen.",
	"editor.calloutIdsPlaceholder": "ID hinzufügen",
	"editor.addId": "ID hinzufügen",
	"editor.idLinkedToName": "Mit dem Anzeigenamen verknüpft",
	"editor.idCannotDelete":
		"Diese ID ist mit dem Anzeigenamen verknüpft und kann nicht gelöscht werden — ändern Sie den Namen, um sie zu ändern",
	"editor.icon": "Symbol",
	"editor.livePreview": "Live-Vorschau",
	"editor.iconAdjustment": "Symbolanpassung",
	"editor.picture": "Bild",
	"editor.size": "Größe",
	"editor.horizontalOffset": "Horizontaler Versatz",
	"editor.verticalOffset": "Vertikaler Versatz",
	"editor.colors": "Farben",
	"editor.paletteDeleted": "Gelöschte Farbe",
	"editor.paletteGroupObsidian": "Obsidian-Callouts",
	"editor.paletteGroupPresets": "Farbvoreinstellungen",
	"editor.paletteGroupCustom": "Benutzerdefiniert",
	"editor.paletteNewColor": "Neue Farbe…",
	"editor.contrastWarning":
		"Geringer Kontrast zum Hintergrund — könnte schwer lesbar sein",
	"editor.foldable": "Faltbar",
	"editor.foldableDesc":
		"Wählen Sie, ob der Callout gefaltet werden kann und welcher Standardzustand im gesamten Vault gilt.",
	"editor.foldOff": "Aus",
	"editor.foldOpen": "Standardmäßig geöffnet",
	"editor.foldClosed": "Standardmäßig geschlossen",
	"editor.cancel": "Abbrechen",
	"editor.saveChanges": "Änderungen speichern",
	"editor.createCallout": "Callout erstellen",
	"editor.nameRequired":
		"Vor dem Erstellen eines Callouts ist ein Anzeigename erforderlich.",
	"editor.noChangesToSave": "Es wurden keine Änderungen vorgenommen.",
	"editor.downloadingIcon": "Symbol wird heruntergeladen",
	"editor.idEmpty": "Mindestens eine ID ist erforderlich",
	"editor.idExists": "Ein Callout mit dieser ID existiert bereits",
	"editor.idConflict":
		"Diese ID steht in Konflikt mit einem bestehenden Callout",
	"editor.idDashConflict":
		"Obsidian schreibt Leerzeichen als Bindestriche, daher kollidiert diese ID mit „{{other}}“",
	"editor.untitledCallout": "Callout ohne Titel",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText":
		"Hier ist eine eingebettete [!{id}] Pille innerhalb eines Absatzes.",
	"editor.previewReadOnly": "Die Live-Vorschau kann nicht bearbeitet werden",

	// Palette editor modal
	"palette.newTitle": "Neue Farbpalette",
	"palette.editTitle": "Farbpalette bearbeiten",
	"palette.name": "Name",
	"palette.namePlaceholder": "Meine Palette",
	"palette.nameExists": "Es gibt bereits eine Palette mit diesem Namen",
	"palette.baseColor": "Basisfarbe",
	"palette.baseColorHint":
		"Wir passen die Hintergrundfarbe automatisch daran an. Wenn du möchtest, kannst du sie separat steuern, indem du {{link}}.",
	"palette.baseColorHintLink": "hier klickst",
	"palette.advancedColors": "Farben",
	"palette.advancedColorsHint":
		"Bearbeiten der Farben für den {{mode}}-Modus – der andere Modus wird automatisch aktualisiert. Wechsle das Obsidian-Theme, um es zu überprüfen.",
	"palette.revertHint":
		"Bevorzugst du stattdessen eine einzelne Basisfarbe? {{link}}.",
	"palette.revertHintLink": "Zurücksetzen",
	"palette.lightMode": "Hell",
	"palette.darkMode": "Dunkel",
	"palette.accentColor": "Akzentfarbe",
	"palette.backgroundColorChannel": "Hintergrundfarbe",
	"palette.textColorChannel": "Textfarbe",
	"palette.bgIntensity": "Intensität",
	"palette.bgStyle": "Stil",
	"palette.bgSolid": "Einfarbig",
	"palette.bgGradient": "Verlauf",
	"palette.gradientTo": "Zweite Farbe",
	"palette.gradientDirection": "Richtung",
	"palette.gradientText": "Verlaufs-Titeltext",
	"palette.save": "Speichern",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "Rot",
	"colorName.orange": "Orange",
	"colorName.amber": "Bernstein",
	"colorName.yellow": "Gelb",
	"colorName.lime": "Limette",
	"colorName.green": "Grün",
	"colorName.teal": "Petrol",
	"colorName.cyan": "Cyan",
	"colorName.sky": "Himmelblau",
	"colorName.blue": "Blau",
	"colorName.indigo": "Indigo",
	"colorName.violet": "Violett",
	"colorName.purple": "Lila",
	"colorName.pink": "Pink",
	"colorName.rose": "Rosé",
	"colorName.brown": "Braun",
	"colorName.gray": "Grau",
	"colorName.black": "Schwarz",
	"colorName.white": "Weiß",

	"iconPicker.pickIcon": "Symbol auswählen",
	"iconPicker.confirm": "Bestätigen",
	"iconPicker.cancel": "Abbrechen",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "Lucide-Symbole suchen",
	"iconPicker.searchTabler": "Tabler-Symbole suchen",
	"iconPicker.tablerStyle": "Symbol-Stil",
	"iconPicker.tablerStyleOutline": "Kontur (Outline)",
	"iconPicker.tablerStyleFilled": "Gefüllt (Filled)",
	"iconPicker.loadMore": "Mehr laden",
	"iconPicker.materialStyle": "Symbol-Stil",
	"iconPicker.materialStyleOutlined": "Umrissen (Outlined)",
	"iconPicker.materialStyleFilled": "Gefüllt (Filled)",
	"iconPicker.materialStyleRounded": "Abgerundet (Rounded)",
	"iconPicker.materialStyleSharp": "Scharf (Sharp)",
	"iconPicker.materialWeight": "Symbol-Stärke",
	"iconPicker.materialWeight100": "Dünn (Thin)",
	"iconPicker.materialWeight200": "Extra leicht (Extra Light)",
	"iconPicker.materialWeight300": "Leicht (Light)",
	"iconPicker.materialWeight400": "Normal (Regular)",
	"iconPicker.materialWeight500": "Mittel (Medium)",
	"iconPicker.materialWeight600": "Halbfett (Semi Bold)",
	"iconPicker.materialWeight700": "Fett (Bold)",
	"iconPicker.searchMaterial": "Material-Symbole suchen",
	"iconPicker.searchEmoji": "Emojis suchen",
	"iconPicker.skinTone": "Hautton",
	"iconPicker.allCategories": "Alle Kategorien",
	"iconPicker.noIconSelected": "Kein Symbol ausgewählt",
	"iconPicker.noResults": "Keine Symbole entsprechen Ihrer Suche.",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Octicons durchsuchen",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Font Awesome durchsuchen",
	"iconPicker.faStyle": "Symbol-Stil",
	"iconPicker.faStyleSolid": "Ausgefüllt (Solid)",
	"iconPicker.faStyleRegular": "Regulär (Regular)",
	"iconPicker.faStyleBrands": "Marken (Brands)",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "RPG Awesome durchsuchen",
	"iconPicker.image": "Ihre Bilder",
	"iconPicker.searchImage": "Bilder durchsuchen",
	"iconPicker.imageTooLarge":
		"{{name}} ist zu groß. Bilder müssen kleiner als 5 MB sein.",
	"iconPicker.imageUnsupported":
		"{{name}} ist kein unterstütztes Bildformat. Verwenden Sie SVG, PNG, JPEG oder WebP.",
	"iconPicker.imageInvalidSvg":
		"{{name}} konnte nicht als sicheres SVG gelesen werden und wurde nicht hinzugefügt.",
	"iconPicker.imageDecodeFailed":
		"{{name}} konnte nicht als Bild gelesen werden.",
	"iconPicker.imageDuplicate":
		"{{name}} ist bereits in Ihren Bildern. Benennen Sie die Datei um oder löschen Sie das vorhandene Bild.",
	"iconPicker.imageAdd": "Bilder hinzufügen",
	"iconPicker.imageEmpty":
		"Noch keine Bilder. Fügen Sie eine SVG-, PNG-, JPEG- oder WebP-Datei von Ihrem Computer hinzu oder ziehen Sie eine hierher.",
	"iconPicker.imageDelete": "Löschen",
	"iconPicker.imageDeleteConfirm": "„{{name}}“ löschen?",
	"iconPicker.imageDeleteInUse":
		"{{count}} Callout(s) verwendet dieses Bild. Es wird ein Platzhalter-Symbol angezeigt, bis Sie ein neues festlegen.",
	"iconPicker.imageRecolor": "Callout-Farbe übernehmen",
	"iconPicker.allSources": "Alle Quellen",
	"iconPicker.searchAllSources": "Alle Symbol-Quellen durchsuchen",
	"iconPicker.sourcesNotDownloaded":
		"Noch nicht enthalten: {{names}}. Wählen Sie oben eine Quelle, um sie herunterzuladen.",
	"iconPicker.chooseSource": "Quelle wählen",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources": "alle Bibliotheken auf einmal durchsuchen",
	"iconPicker.descLucide": "Obsidians eigene Sammlung, immer offline",
	"iconPicker.descTabler":
		"klare und einheitliche UI-Symbole, Kontur und gefüllt",
	"iconPicker.descMaterial":
		"Googles Sammlung, vier Stile und sieben Stärken",
	"iconPicker.descEmoji": "farbige Glyphen, alle Hauttöne",
	"iconPicker.descOcticons": "GitHubs Interface-Symbole",
	"iconPicker.descFa": "ausgefüllt, regulär und Marken",
	"iconPicker.descRpgAwesome": "Fantasy- und Tabletop-Symbole",
	"iconPicker.descImage": "Bilder, die Sie von Ihrem Computer hinzufügen",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "Barrierefreiheit",
	"iconPicker.cat.Actions": "Aktionen",
	"iconPicker.cat.Activities": "Aktivitäten",
	"iconPicker.cat.Alert": "Alarm",
	"iconPicker.cat.Alphabet": "Alphabet",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "Tiere",
	"iconPicker.cat.Arrows": "Pfeile",
	"iconPicker.cat.Astronomy": "Astronomie",
	"iconPicker.cat.Audio&Video": "Audio und Video",
	"iconPicker.cat.Automotive": "Fahrzeuge",
	"iconPicker.cat.Badges": "Abzeichen",
	"iconPicker.cat.Brand": "Marken",
	"iconPicker.cat.Buildings": "Gebäude",
	"iconPicker.cat.Business": "Geschäft",
	"iconPicker.cat.Camping": "Camping",
	"iconPicker.cat.Charity": "Wohltätigkeit",
	"iconPicker.cat.Charts": "Diagramme",
	"iconPicker.cat.Charts + Diagrams": "Diagramme und Grafiken",
	"iconPicker.cat.Childhood": "Kindheit",
	"iconPicker.cat.Clothing + Fashion": "Kleidung und Mode",
	"iconPicker.cat.Coding": "Programmierung",
	"iconPicker.cat.Communicate": "Kommunizieren",
	"iconPicker.cat.Communication": "Kommunikation",
	"iconPicker.cat.Computers": "Computer",
	"iconPicker.cat.Connectivity": "Konnektivität",
	"iconPicker.cat.Construction": "Bauwesen",
	"iconPicker.cat.Currencies": "Währungen",
	"iconPicker.cat.Database": "Datenbank",
	"iconPicker.cat.Design": "Design",
	"iconPicker.cat.Development": "Entwicklung",
	"iconPicker.cat.Devices": "Geräte",
	"iconPicker.cat.Devices + Hardware": "Geräte und Hardware",
	"iconPicker.cat.Disaster + Crisis": "Katastrophen und Krisen",
	"iconPicker.cat.Document": "Dokument",
	"iconPicker.cat.E-commerce": "E-Commerce",
	"iconPicker.cat.Editing": "Bearbeitung",
	"iconPicker.cat.Education": "Bildung",
	"iconPicker.cat.Electrical": "Elektrik",
	"iconPicker.cat.Emoji": "Emoji",
	"iconPicker.cat.Energy": "Energie",
	"iconPicker.cat.Extensions": "Erweiterungen",
	"iconPicker.cat.Files": "Dateien",
	"iconPicker.cat.Film + Video": "Film und Video",
	"iconPicker.cat.Food": "Essen",
	"iconPicker.cat.Food + Beverage": "Essen und Trinken",
	"iconPicker.cat.Fruits + Vegetables": "Obst und Gemüse",
	"iconPicker.cat.Games": "Spiele",
	"iconPicker.cat.Gaming": "Gaming",
	"iconPicker.cat.Gender": "Geschlecht",
	"iconPicker.cat.Genders": "Geschlechter",
	"iconPicker.cat.Gestures": "Gesten",
	"iconPicker.cat.Halloween": "Halloween",
	"iconPicker.cat.Hands": "Hände",
	"iconPicker.cat.Hardware": "Hardware",
	"iconPicker.cat.Health": "Gesundheit",
	"iconPicker.cat.Holidays": "Feiertage",
	"iconPicker.cat.Home": "Zuhause",
	"iconPicker.cat.Household": "Haushalt",
	"iconPicker.cat.Humanitarian": "Humanitär",
	"iconPicker.cat.Images": "Bilder",
	"iconPicker.cat.Laundry": "Wäsche",
	"iconPicker.cat.Letters": "Buchstaben",
	"iconPicker.cat.Logic": "Logik",
	"iconPicker.cat.Logistics": "Logistik",
	"iconPicker.cat.Map": "Karte",
	"iconPicker.cat.Maps": "Karten",
	"iconPicker.cat.Maritime": "Maritime",
	"iconPicker.cat.Marketing": "Marketing",
	"iconPicker.cat.Math": "Mathematik",
	"iconPicker.cat.Mathematics": "Mathematik",
	"iconPicker.cat.Media": "Medien",
	"iconPicker.cat.Media Playback": "Medienwiedergabe",
	"iconPicker.cat.Medical + Health": "Medizin und Gesundheit",
	"iconPicker.cat.Money": "Geld",
	"iconPicker.cat.Mood": "Stimmung",
	"iconPicker.cat.Moving": "Umzug",
	"iconPicker.cat.Music + Audio": "Musik und Audio",
	"iconPicker.cat.Nature": "Natur",
	"iconPicker.cat.Numbers": "Zahlen",
	"iconPicker.cat.Photography": "Fotografie",
	"iconPicker.cat.Photos + Images": "Fotos und Bilder",
	"iconPicker.cat.Political": "Politisch",
	"iconPicker.cat.Privacy": "Datenschutz",
	"iconPicker.cat.Punctuation + Symbols": "Satzzeichen und Symbole",
	"iconPicker.cat.Religion": "Religion",
	"iconPicker.cat.Science": "Wissenschaft",
	"iconPicker.cat.Science Fiction": "Science-Fiction",
	"iconPicker.cat.Security": "Sicherheit",
	"iconPicker.cat.Shapes": "Formen",
	"iconPicker.cat.Shopping": "Einkaufen",
	"iconPicker.cat.Social": "Soziale Medien",
	"iconPicker.cat.Spinners": "Spinner",
	"iconPicker.cat.Sport": "Sport",
	"iconPicker.cat.Sports + Fitness": "Sport und Fitness",
	"iconPicker.cat.Symbols": "Symbole",
	"iconPicker.cat.System": "System",
	"iconPicker.cat.Text": "Text",
	"iconPicker.cat.Text Formatting": "Textformatierung",
	"iconPicker.cat.Time": "Zeit",
	"iconPicker.cat.Toggle": "Schalter",
	"iconPicker.cat.Transit": "Transit",
	"iconPicker.cat.Transportation": "Transport",
	"iconPicker.cat.Travel": "Reise",
	"iconPicker.cat.Travel + Hotel": "Reise und Hotel",
	"iconPicker.cat.UI actions": "UI-Aktionen",
	"iconPicker.cat.Users + People": "Benutzer und Personen",
	"iconPicker.cat.Vehicles": "Fahrzeuge",
	"iconPicker.cat.Version control": "Versionskontrolle",
	"iconPicker.cat.Weather": "Wetter",
	"iconPicker.cat.Writing": "Schreiben",
	"iconPicker.cat.Zodiac": "Tierkreis",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}} wurde noch nicht heruntergeladen",
	"iconPack.downloadDetail":
		"{{count}} Symbole · {{size}} · Einmaliger Download",
	"iconPack.download": "Herunterladen",
	"iconPack.downloading": "{{name}} wird heruntergeladen…",
	"iconPack.downloadFailed":
		"{{name}} konnte nicht heruntergeladen werden. Überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
	"iconPack.retry": "Erneut versuchen",
	"iconPack.faBrandsNotice":
		"Marken-Symbole sind Markenzeichen ihrer jeweiligen Eigentümer. Ihre Aufnahme impliziert keine Empfehlung. Bitte verwenden Sie sie nur zur Darstellung des Unternehmens, Produkts oder der Dienstleistung, für das sie stehen.",
	"iconPack.artworkRestored":
		"Die Symbol-Grafiken für {{names}} wurden heruntergeladen.",
	"iconPack.diskWriteFailed":
		"Callout Studio konnte das Symbol-Paket nicht auf der Festplatte speichern; es muss beim nächsten Mal erneut heruntergeladen werden. Die ausgewählten Symbole werden weiterhin mit Ihren Einstellungen gespeichert.",

	// Icon licences & credits
	"credits.title": "Symbol-Lizenzen und Quellenangaben",
	"credits.intro":
		"Callout Studio nutzt mehrere offene Symbol-Bibliotheken. Ihre Lizenzen sind nachfolgend wiedergegeben, zusammen mit den vorgenommenen Anpassungen für die hiesige Verwendung.",
	"credits.fullNotices": "Vollständige Drittanbieter-Hinweise",
	"credits.pluginLicense":
		"Callout Studios eigener Code steht unter der 0BSD-Lizenz; die Symbol-Bibliotheken behalten ihre eigenen Lizenzen.",

	"contextMenu.editCallout": "Callout-Einstellungen bearbeiten",
	"contextMenu.copyMarkdown": "Callout-Markdown kopieren",
	"contextMenu.openSettings": "Callout Studio-Einstellungen öffnen",
	"contextMenu.setFoldClosed": "Callout als geschlossen festlegen (-)",
	"contextMenu.setFoldOpen": "Callout als geöffnet festlegen (+)",
	"contextMenu.setFoldNone": "Callout nicht faltbar machen",
	"contextMenu.cutSection": "Überschriftsabschnitt ausschneiden",
	"contextMenu.copySection": "Überschriftsabschnitt kopieren",
	"contextMenu.deleteSection": "Überschriftsabschnitt löschen",
	"heading.toggleFold": "Faltung umschalten",
	"settings.globalSettings": "Globale Einstellungen",
	"settings.globalSettingsDesc":
		"Feinabstimmung, wie jeder Callout-Typ in Ihrem gesamten Vault aussieht.",
	"settings.globalSettingsRegularDesc":
		"Fügen Sie einem Zitatblock ein Callout-Token hinzu (z. B. `> [!type]`), um Obsidians native Callout-Box darzustellen. Sie können Rahmen, Radius, Schriftskalierung und Ausrichtung anpassen.",
	"settings.globalSettingsHeadingDesc":
		"Fügen Sie direkt nach den Rautezeichen der Überschrift ein Callout-Token hinzu (z. B. `## [!type]`), um es als gestaltete Callout-Überschrift darzustellen. Sie können Rahmen, Form und vertikalen Abstand anpassen.",
	"settings.globalSettingsInlineDesc":
		"Fügen Sie irgendwo innerhalb einer Textzeile ein Callout-Token hinzu (z. B. `[!type]`), um es als kleine Inline-Pille darzustellen. Sie können Rahmen und Form anpassen.",
	"settings.globalSettingsCustomize": "Anpassen",
	"settings.calloutTypeRegular": "Regulärer Callout",
	"settings.calloutTypeHeading": "Überschrift-Callout",
	"settings.calloutTypeInline": "Inline-Callout",
	"settings.customizeMenu": "Menüelemente anpassen",
	"settings.customizeMenuDesc":
		"Wählen Sie, welche Rechtsklick-Aktionen für jeden Callout-Typ angezeigt werden, und ordnen Sie sie neu an. Funktioniert im Quellmodus und in der Live-Vorschau.",
	"settings.customizeMenuButton": "Menüelemente anpassen",
	"menuCustomize.title": "Rechtsklickmenü anpassen",
	"menuCustomize.desc":
		"Aktionen ein- oder ausschalten und den Griff ziehen, um sie neu anzuordnen. Änderungen werden automatisch gespeichert.",
	"menuCustomize.regular": "Regulärer Callout",
	"menuCustomize.heading": "Überschrift-Callout",
	"menuCustomize.inline": "Inline-Callout",
	"menuCustomize.dragHandle": "Zum Neuanordnen ziehen",
	"menuItem.edit": "Callout bearbeiten",
	"menuItem.openSettings": "Einstellungen öffnen",
	"menuItem.copyMarkdown": "Markdown kopieren",
	"menuItem.foldDefaults":
		"Standard-Faltzustand (offen / geschlossen / keiner)",
	"menuItem.cutSection": "Abschnitt ausschneiden",
	"menuItem.copySection": "Abschnitt kopieren",
	"menuItem.deleteSection": "Abschnitt löschen",

	"confirm.ok": "Löschen",
	"confirm.cancel": "Abbrechen",

	"vault.filesUpdated":
		"{{count}} Callout-Referenz(en) in Vault-Dateien aktualisiert.",
	"vault.idsUpdated":
		"{{count}} Callout-ID(s) in Vault-Dateien aktualisiert: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"{{count}} Callout-Titel in Vault-Dateien aktualisiert: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "Ersetzen durch:",
	"vault.deleteWithout": "Ohne Ersetzen löschen",
	"vault.confirmDelete": "Bestätigen",
	"vault.confirmReplace": "Ersetzen",
	"vault.replacePromptInUse":
		'"{{name}}" wird {{count}} Mal in {{files}} Datei(en) verwendet. Wählen Sie einen Callout, durch den er ersetzt werden soll:',
	"vault.replacePromptUnused":
		'Wählen Sie einen Callout, durch den "{{name}}" ersetzt werden soll:',
	"vault.noReplacementAvailable":
		"Keine anderen Callouts zum Ersetzen verfügbar.",
	"vault.convertedToPlainText":
		"{{blocks}} Callout-Block(s) in {{files}} Datei(en) in einfachen Text umgewandelt.",
	"vault.resetAliasWarning":
		"{{count}} Referenz(en) in {{files}} Datei(en) verwenden benutzerdefinierte Aliase: {{aliases}}. Diese werden nach dem Zurücksetzen nicht mehr funktionieren. Fortfahren?",
	"vault.resetConfirm": "Zurücksetzen",
	"vault.resetAllInUse":
		"⚠ {{count}} Callout-Referenz(en) in {{files}} Datei(en) verwenden benutzerdefinierte Callout-Typen, die gelöscht werden.",

	"vaultStats.title": "Callout-Statistiken",
	"vaultStats.totalCallouts": "Callouts gesamt",
	"vaultStats.typesFound": "Gefundene Typen",
	"vaultStats.filesWithCallouts": "Dateien mit Callouts",
	"vaultStats.filesScanned": "Gescannte Markdown-Dateien",
	"vaultStats.empty": "Keine Callouts in Markdown-Notizen gefunden.",
	"vaultStats.columnType": "Typ",
	"vaultStats.columnName": "Name",
	"vaultStats.columnSource": "Quelle",
	"vaultStats.columnCount": "Anzahl",
	"vaultStats.columnFiles": "Dateien",
	"vaultStats.unknown": "Unbekannt",
	"vaultStats.sourceBuiltIn": "Integriert",
	"vaultStats.sourceCustom": "Benutzerdefiniert",
	"vaultStats.sourceAutoFallback": "Automatischer Fallback",
	"vaultStats.sourceTheme": "CSS-Snippet",
	"vaultStats.sourceAlias": "Alias von {{id}}",
	"vaultStats.sourceUnknown": "Unbekannt",
	"vaultStats.close": "Schließen",

	"import.title": "Importprobleme",
	"import.reportLeadIn":
		"Die importierte Datei scheint verändert worden zu sein. Hier ist die Liste der Probleme:",
	"import.reportLeadInFatal":
		"Diese Datei sieht nicht wie ein Callout Studio-Export aus. Sie kann nicht importiert werden:",
	"import.entryHeading": "Eintrag {{index}} — {{label}}",
	"import.summary":
		"{{valid}} von {{total}} Einträgen sind gültig · {{issues}} Problem(e) gefunden.",
	"import.btnCancel": "Abbrechen",
	"import.btnImportValid": "Nur gültige importieren ({{count}})",
	"import.err.notRecognized":
		"Datei nicht erkannt: Es wurde ein Array von Callout-Definitionen oder ein Callout-Studio-Export erwartet.",
	"import.warn.settingsIgnored":
		"Der Einstellungsblock war kein gültiges Objekt und wurde ignoriert.",
	"import.warn.invalidGradient":
		"Der Hintergrundverlauf war ungültig und wurde ignoriert.",
	"import.err.parseFailed":
		"Die Datei ist kein gültiges JSON und konnte nicht geparst werden.",
	"import.err.entryNotObject": "Der Eintrag muss ein Objekt sein.",
	"import.err.requiredMissing":
		'Das Pflichtfeld "{{field}}" fehlt oder hat den falschen Typ.',
	"import.err.idEmpty": "Die ID darf nicht leer sein.",
	"import.err.idTooLong":
		'Die ID "{{value}}" hat {{length}} Zeichen; das Maximum ist {{max}}.',
	"import.err.idBadChar":
		'Die ID "{{value}}" enthält ungültige Zeichen ("|", "[", "]", Tabulatoren und Zeilenumbrüche sind nicht erlaubt).',
	"import.err.displayNameEmpty": "Der Anzeigename darf nicht leer sein.",
	"import.err.displayNameTooLong":
		"Der Anzeigename hat {{length}} Zeichen; das Maximum ist {{max}}.",
	"import.err.boolField":
		'"{{field}}" muss ein Boolean sein (true oder false).',
	"import.err.iconNotObject": "Das Symbol muss ein Objekt sein.",
	"import.err.iconTypeInvalid":
		'Der Symboltyp "{{value}}" ist keiner der folgenden: {{types}}.',
	"import.warn.iconFieldIgnored":
		'"{{field}}" gilt nur für Material-Symbole und wird für den Symboltyp {{type}} ignoriert.',
	"import.err.iconValueEmpty":
		"Der Symbolwert muss eine nicht leere Zeichenkette sein.",
	"import.err.iconValueTooLong":
		"Der Symbolwert ist ungewöhnlich lang ({{length}} Zeichen).",
	"import.err.materialStyle":
		'Der Material-Symbolstil "{{value}}" ist keiner der folgenden: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'Das Material-Symbolgewicht "{{value}}" muss eine ganze Zahl zwischen 100 und 700 in 100er-Schritten sein.',
	"import.warn.iconRecolorIgnored":
		'"recolor" gilt nur für eigene Bilder und wird für den Symboltyp {{type}} ignoriert.',
	"import.err.iconRecolorInvalid":
		'"recolor" muss true oder false sein (Wert: "{{value}}").',
	"import.err.colorInvalid":
		'"{{field}}" muss eine Hex-Farbe wie "#448aff" sein (erhalten: "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" muss eine Zahl zwischen {{min}} und {{max}} sein (erhalten: "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" muss eine Zahl zwischen {{min}} und {{max}} sein (erhalten: "{{value}}").',
	"import.err.aliasesNotArray":
		'"aliases" muss ein Array von Zeichenketten sein.',
	"import.err.aliasNotString": "Der Alias muss eine Zeichenkette sein.",
	"import.err.aliasDup":
		'Der Alias "{{value}}" ist in diesem Eintrag doppelt vorhanden.',
	"import.err.tooManyIds":
		"Zu viele IDs ({{count}}); jeder Callout kann maximal {{max}} IDs haben (primär + Aliase).",
	"import.err.metadataShape":
		'"metadata" muss ein Objekt sein, dessen Werte alle Zeichenketten sind.',
	"import.err.unknownFields": "Unbekannte Felder ignoriert: {{fields}}.",
	"import.err.duplicateInFile":
		'Die ID/der Alias "{{value}}" wird bereits von Eintrag #{{first}} in dieser Datei verwendet.',
	"import.err.aliasConflict":
		'Der Alias "{{value}}" wird bereits von einem anderen Callout ("{{other}}") in Ihrem Vault verwendet.',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" war true, während "foldable" false war; defaultFolded wurde auf false zurückgesetzt.',
	"import.warn.imageMissing":
		"Dieser Callout verwendet ein Bild, das weder in der Datei noch im Vault vorhanden ist; es wird ein Platzhalter-Symbol angezeigt, bis Sie ein neues festlegen.",

	"footer.tagline":
		"Feedback, Kommentare oder Vorschläge? Ich würde mich freuen, von Ihnen zu hören!",
	"footer.madeBy": "Erstellt von Niv  •  ",
};
