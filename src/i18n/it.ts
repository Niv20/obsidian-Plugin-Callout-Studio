export const it: Record<string, string> = {
	"cmd.openSettings": "Apri impostazioni",
	"cmd.createCallout": "Crea nuovo tipo di callout",
	"cmd.insertEmptyCallout": "Inserisci callout vuoto",
	"cmd.calloutWrap": "Racchiudi in callout",
	"cmd.calloutUnwrap": "Rimuovi callout",

	"autocomplete.createNew": 'Crea nuovo callout: "{{name}}"',

	"settings.fallbackTag": "Predefinito",
	"settings.fallbackTagAuto": "Predefinito automatico",
	"settings.rescanVault": "Riscansiona vault",
	"settings.rescanVaultDesc":
		"Cerca ID callout non riconosciuti nelle note e li aggiunge come righe di fallback.",
	"settings.rescanVaultHintAction": "Scansiona ora",
	"settings.rescanComplete":
		"Riscansione completata: {{count}} nuovo/i callout aggiunto/i.",
	"replaceModal.deleteWithoutReplaceSuffix": "(torna al predefinito)",

	"firstRun.title": "Trovare callout esistenti nel vault?",
	"firstRun.body":
		"Callout Studio può scansionare il vault per scoprire i callout già in uso, così appariranno nell'elenco delle impostazioni e adotteranno lo stile di fallback.",
	"firstRun.heavyVaultNote":
		"Il tuo vault ha {{count}} file Markdown — la scansione potrebbe richiedere alcuni secondi.",
	"firstRun.laterHint":
		"Puoi sempre eseguirlo in seguito da Impostazioni → Approfondimenti e manutenzione vault → Riscansiona vault.",
	"firstRun.scanNow": "Scansiona ora",
	"firstRun.noThanks": "No, grazie",
	"firstRun.autoScanComplete":
		"Callout Studio ha scansionato il vault e aggiunto {{count}} callout.",
	"firstRun.scanning": "Scansione",

	"welcome.tooltip": "Informazioni su Callout Studio",
	"welcome.title": "Benvenuto in Callout Studio",
	"welcome.tagline":
		"La tua soluzione completa per gestire i callout di Obsidian.",
	"welcome.previewTitle": "Guardalo in azione",
	"welcome.sample":
		"Callout Studio ti permette di creare callout con un'icona, colori e nome personalizzati.\n\n" +
		"Puoi usare lo stesso callout in **tre** modi diversi:\n\n" +
		"## [!tip] Come titolo\n" +
		"Per trasformare qualsiasi titolo in un titolo in stile callout, aggiungi `[!type]` subito dopo i `#`.\n\n" +
		"Vuoi un callout inline come questo [!warning]? Basta aggiungere `[!type]` in mezzo a una frase, senza interrompere il flusso.\n\n" +
		"> [!note] Callout normale\n" +
		"> Naturalmente, il callout classico funziona con la stessa identica sintassi a cui sei già abituato: `> [!type]`.\n\n" +
		"Callout Studio ha molto altro da offrire! [Scopri di più]({{repoUrl}}).\n",

	"deleteModal.title": 'Elimina callout "{{name}}"?',
	"deleteModal.bodyInUse":
		"Questo callout appare {{count}} volta/e in {{files}} file.",
	"deleteModal.bodyInUseExplain":
		"L'eliminazione convertirà quei blocchi in testo normale — perderanno lo stile e l'intestazione del callout.",
	"deleteModal.replaceHint":
		"Puoi sostituirlo con un altro callout, mantenendo il contenuto del vault come callout stilizzato.",
	"deleteModal.bodyUnused":
		'"{{name}}" non è usato in nessuna nota, ma è un callout personalizzato che hai creato. L\'eliminazione lo rimuoverà da questo elenco.',
	"deleteModal.replaceInstead": "Sostituisci invece",
	"deleteModal.deleteInUse": "Elimina (converti in testo normale)",
	"deleteModal.deleteUnused": "Elimina callout",

	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "I miei tipi di callout",
	"settings.builtInCallouts": "Callout integrati",
	"settings.contextMenu": "Menu contestuale",
	"settings.autocomplete": "Completamento automatico",
	"settings.keyboardShortcuts": "Scorciatoie da tastiera",
	"settings.language": "Lingua",
	"settings.languageDesc":
		"Lingua di visualizzazione di Callout Studio. Per impostazione predefinita segue la lingua dell'interfaccia di Obsidian.",
	"settings.languageAuto": "Automatico (come Obsidian)",
	"settings.importExport": "Importa / esporta",
	"settings.import": "Importa",
	"settings.export": "Esporta",
	"settings.importDesc":
		"Importa i dati di Callout Studio da un altro vault usando un file JSON.",
	"settings.exportDesc":
		"Salva tutti i tipi di callout personalizzati in formato JSON.",
	"settings.importConflictNotice":
		"Importato/i {{count}} tipo/i di callout; {{overwritten}} voce/voci esistente/i sovrascritte.",

	"settings.addNewCallout": "+ aggiungi callout",

	"settings.noCalloutsNow": "Per ora nessun callout personalizzato.",

	"settings.editAria": "Modifica {{name}}",
	"settings.moreRowActionsAria": "Altre azioni per {{name}}",
	"settings.usageInfo": "{{count}} utilizzo/i in {{files}} file",
	"settings.replaceAction": "Sostituisci nel vault",
	"settings.deleteAction": "Elimina",
	"settings.resetAction": "Ripristina predefinito",
	"settings.makeFallbackAction": "Usa stile di fallback predefinito",
	"settings.colorSwatchAria": "Accento: {{accent}} · Sfondo: {{bg}}",

	"settings.fallbackCallout": "Callout di fallback predefinito",
	"settings.fallbackCalloutDesc":
		"I tipi di callout non riconosciuti nel vault erediteranno lo stile di questo callout.",

	"settings.globalStyle": "Stile callout globale",
	"settings.border": "Bordi",
	"settings.borderAll": "Tutti",
	"settings.borderTop": "Superiore",
	"settings.borderRight": "Destro",
	"settings.borderBottom": "Inferiore",
	"settings.borderLeft": "Sinistro",
	"settings.borderWidth": "Spessore bordo",
	"settings.fontScaleGroup": "Scala font",
	"settings.titleScale": "Titolo",
	"settings.contentScale": "Contenuto",
	"settings.inlineTextScale": "Testo",
	"settings.shapeGroup": "Forma",
	"settings.borderRadius": "Arrotondamento angoli",
	"settings.alignGroup": "Allineamento",
	"settings.alignContent": "Allinea il contenuto al titolo",
	"settings.headingSpacingGroup": "Spaziatura titolo",
	"settings.headingPadVertical": "Spaziatura verticale",
	"settings.headingGap": "Spaziatura tra le intestazioni",
	"settings.headingFoldGroup": "Piega",
	"settings.headingFoldArrow": "Mostra freccia di piega",
	"settings.styleDemoName": "Esempio",
	"settings.previewTitle": "Anteprima",

	// Settings — Saved color palettes
	"settings.customPalettes": "Tavolozze di colori salvate",
	"settings.newPalette": "Nuova tavolozza",
	"settings.customPalettesEmpty": "Per ora nessuna tavolozza salvata.",
	"settings.editPaletteAria": "Modifica tavolozza {{name}}",
	"settings.deletePaletteAria": "Elimina tavolozza {{name}}",
	"settings.deletePaletteConfirm":
		'Eliminare la tavolozza "{{name}}"?\nI callout che usano i suoi colori non vengono modificati.',
	"settings.enableAutocomplete": "Abilita completamento automatico [!",
	"settings.enableAutocompleteDesc":
		"Mostra suggerimenti quando si digita \"[!\" in una citazione nell'editor. Scegli un tipo di callout dall'elenco per inserire un'intestazione callout completa.",

	"settings.openHotkeys": "Scorciatoie Callout Studio",
	"settings.openHotkeysDesc":
		"Apre le impostazioni scorciatoie di Obsidian per i comandi di Callout Studio, dove puoi scegliere le tue scorciatoie per Crea nuovo tipo, Apri impostazioni, Rimuovi callout e Racchiudi in callout. Nessuna scorciatoia assegnata per impostazione predefinita.",
	"settings.openHotkeysButton": "Apri impostazioni scorciatoie",

	"settings.vaultMaintenance": "Approfondimenti e manutenzione vault",
	"settings.vaultStats": "Statistiche callout",
	"settings.vaultStatsDesc":
		"Conta tutti i blocchi callout nelle note Markdown e li raggruppa per tipo.",
	"settings.vaultStatsButton": "Visualizza statistiche",
	"settings.vaultStatsScanning": "Scansione",
	"settings.resetAll": "Ripristina",
	"settings.resetAllDesc":
		"Elimina tutti i callout utente, ripristina i callout integrati, gli stili globali (bordi, scala font, forma), le tavolozze di colori salvate, la personalizzazione del menu del clic destro e gli SVG Material scaricati.",
	"settings.resetAllButton": "Ripristina tutto",
	"settings.resetAllConfirm":
		"Questo eliminerà tutti i callout personalizzati, ripristinerà i callout integrati, gli stili globali, le tavolozze di colori salvate, la personalizzazione del menu del clic destro e tutti gli SVG Material nella cache. Questa azione non può essere annullata. Sei sicuro?",
	"notice.resetAllDone": "Tutto è stato ripristinato ai valori predefiniti.",

	"notice.exported": "Callout esportati in callout-studio-export.json",
	"notice.importedJSON": "Importato/i {{count}} tipo/i di callout da JSON.",
	"notice.importedSettings": "Impostazioni del plugin importate.",
	"notice.importedCalloutManager":
		"Importato da Callout Manager: {{created}} creati, {{updated}} aggiornati.",
	"notice.importedAdmonition":
		"Importato da Admonition: {{created}} creati, {{updated}} " +
		"aggiornati.",
	"notice.noNewJSON":
		"Nessun nuovo tipo di callout importato (gli ID potrebbero già esistere).",
	"notice.iconDownloadFailed":
		'Impossibile scaricare l\'icona Material "{{name}}". Potrebbe non essere disponibile per questo stile/peso, o la connessione è offline.',
	"notice.nothingToWrap": "Niente da racchiudere.",
	"notice.cursorNotInsideCallout": "Il cursore non è dentro un callout.",
	"notice.openHotkeysFailed":
		"Impossibile aprire le impostazioni scorciatoie di Obsidian.",
	"notice.filterHotkeysFailed":
		"Impostazioni scorciatoie di Obsidian aperte, ma impossibile applicare il filtro Callout Studio.",

	"editor.editCallout": "Modifica callout",
	"editor.newCallout": "Nuovo callout",
	"editor.displayName": "Nome visualizzato",
	"editor.displayNameDesc": "L'etichetta leggibile mostrata nell'interfaccia",
	"editor.displayNameBuiltIn":
		"Il nome visualizzato non può essere modificato per i callout integrati",
	"editor.displayNamePlaceholder": "Il mio callout",
	"editor.calloutIds": "ID callout",
	"editor.calloutIdsDesc":
		"Tutti gli identificatori per questo callout. Sono consentiti gli spazi.\nPremi Invio o il pulsante + per aggiungere.",
	"editor.calloutIdsPlaceholder": "Aggiungi ID",
	"editor.addId": "Aggiungi ID",
	"editor.idLinkedToName": "Collegato al nome visualizzato",
	"editor.idCannotDelete":
		"Questo ID è collegato al nome visualizzato e non può essere eliminato — modifica il nome per cambiarlo",
	"editor.icon": "Icona",
	"editor.pickIcon": "Scegli icona",
	"editor.resetIcon": "Ripristina icona predefinita",
	"editor.livePreview": "Anteprima live",
	"editor.iconAdjustment": "Regolazione icona",
	"editor.picture": "Immagine",
	"editor.size": "Dimensione",
	"editor.horizontalOffset": "Offset orizzontale",
	"editor.verticalOffset": "Offset verticale",
	"editor.colors": "Colori",
	"editor.colorsDesc":
		"Sets this callout's border, background, and text colors.",
	"editor.resetColors": "Ripristina colori predefiniti",
	"editor.paletteDeleted": "Colore eliminato",
	"editor.paletteGroupObsidian": "Callout Obsidian",
	"editor.paletteGroupPresets": "Preimpostazioni colore",
	"editor.paletteGroupCustom": "Personalizzati",
	"editor.paletteNewColor": "Nuovo colore…",
	"editor.contrastWarning":
		"Contrasto basso rispetto allo sfondo — potrebbe essere difficile da leggere",
	"editor.foldable": "Pieghevole",
	"editor.foldableDesc":
		"Scegli se il callout può essere piegato e quale stato predefinito applicare in tutto il vault.",
	"editor.foldOff": "Disattivato",
	"editor.foldOpen": "Aperto per impostazione predefinita",
	"editor.foldClosed": "Chiuso per impostazione predefinita",
	"editor.cancel": "Annulla",
	"editor.saveChanges": "Salva modifiche",
	"editor.createCallout": "Crea callout",
	"editor.nameRequired":
		"È necessario un nome visualizzato prima di creare un callout.",
	"editor.noChangesToSave": "Non sono state apportate modifiche.",
	"editor.downloadingIcon": "Download icona",
	"editor.idEmpty": "È richiesto almeno un ID",
	"editor.idExists": "Esiste già un callout con questo ID",
	"editor.idConflict": "Questo ID è in conflitto con un callout esistente",
	"editor.idDashConflict":
		'Obsidian scrive gli spazi come trattini, quindi questo ID è in conflitto con "{{other}}"',
	"editor.untitledCallout": "Callout senza titolo",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText":
		"Ecco una pillola [!{id}] incorporata all'interno di un paragrafo.",
	"editor.previewReadOnly": "L'anteprima dal vivo non può essere modificata",

	// Palette editor modal
	"palette.newTitle": "Nuova tavolozza di colori",
	"palette.editTitle": "Modifica tavolozza di colori",
	"palette.name": "Nome",
	"palette.namePlaceholder": "La mia tavolozza",
	"palette.nameExists": "Esiste già una tavolozza con questo nome",
	"palette.baseColor": "Colore di base",
	"palette.baseColorHint":
		"Adatteremo automaticamente il colore di sfondo a questo. Se preferisci, puoi controllarlo separatamente {{link}}.",
	"palette.baseColorHintLink": "cliccando qui",
	"palette.advancedColors": "Colori",
	"palette.advancedColorsHint":
		"Modifica dei colori per la modalità {{mode}} - l'altra modalità si aggiorna automaticamente. Cambia il tema di Obsidian per verificarlo.",
	"palette.revertHint": "Preferisci un unico colore di base? {{link}}.",
	"palette.revertHintLink": "Ripristina",
	"palette.lightMode": "Chiaro",
	"palette.darkMode": "Scuro",
	"palette.accentColor": "Colore accento",
	"palette.backgroundColorChannel": "Colore di sfondo",
	"palette.textColorChannel": "Colore del testo",
	"palette.bgIntensity": "Intensità",
	"palette.bgStyle": "Stile",
	"palette.bgSolid": "Tinta unita",
	"palette.bgGradient": "Sfumatura",
	"palette.gradientTo": "Secondo colore",
	"palette.gradientDirection": "Direzione",
	"palette.gradientText": "Testo del titolo sfumato",
	"palette.save": "Salva",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "Rosso",
	"colorName.orange": "Arancione",
	"colorName.amber": "Ambra",
	"colorName.yellow": "Giallo",
	"colorName.lime": "Lime",
	"colorName.green": "Verde",
	"colorName.teal": "Verde acqua",
	"colorName.cyan": "Ciano",
	"colorName.sky": "Azzurro",
	"colorName.blue": "Blu",
	"colorName.indigo": "Indaco",
	"colorName.violet": "Violetto",
	"colorName.purple": "Viola",
	"colorName.pink": "Rosa",
	"colorName.rose": "Rosé",
	"colorName.brown": "Marrone",
	"colorName.gray": "Grigio",
	"colorName.black": "Nero",
	"colorName.white": "Bianco",
	"colorName.crimson": "Cremisi",
	"colorName.coral": "Corallo",
	"colorName.grape": "Uva",
	"colorName.plum": "Prugna",
	"colorName.bubblegum": "Gomma da masticare",

	"iconPicker.pickIcon": "Scegli un'icona",
	"iconPicker.confirm": "Conferma",
	"iconPicker.cancel": "Annulla",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "cerca icone Lucide",
	"iconPicker.searchTabler": "cerca icone Tabler",
	"iconPicker.tablerStyle": "Stile icona",
	"iconPicker.tablerStyleOutline": "Contorno (Outline)",
	"iconPicker.tablerStyleFilled": "Pieno (Filled)",
	"iconPicker.loadMore": "Carica altro",
	"iconPicker.materialStyle": "Stile icona",
	"iconPicker.materialStyleOutlined": "Contorno (Outlined)",
	"iconPicker.materialStyleFilled": "Pieno (Filled)",
	"iconPicker.materialStyleRounded": "Arrotondato (Rounded)",
	"iconPicker.materialStyleSharp": "Affilato (Sharp)",
	"iconPicker.materialWeight": "Spessore icona",
	"iconPicker.materialWeight100": "Sottile (Thin)",
	"iconPicker.materialWeight200": "Extra leggero (Extra Light)",
	"iconPicker.materialWeight300": "Leggero (Light)",
	"iconPicker.materialWeight400": "Normale (Regular)",
	"iconPicker.materialWeight500": "Medio (Medium)",
	"iconPicker.materialWeight600": "Semi-grassetto (Semi Bold)",
	"iconPicker.materialWeight700": "Grassetto (Bold)",
	"iconPicker.searchMaterial": "cerca icone Material",
	"iconPicker.searchEmoji": "Cerca emoji",
	"iconPicker.skinTone": "Tono della pelle",
	"iconPicker.allCategories": "Tutte le categorie",
	"iconPicker.noIconSelected": "Nessuna icona selezionata",
	"iconPicker.noResults": "Nessuna icona corrisponde alla ricerca.",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Cerca in Octicons",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Cerca in Font Awesome",
	"iconPicker.faStyle": "Stile icona",
	"iconPicker.faStyleSolid": "Pieno (Solid)",
	"iconPicker.faStyleRegular": "Normale (Regular)",
	"iconPicker.faStyleBrands": "Marchi (Brands)",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "Cerca in RPG Awesome",
	"iconPicker.image": "Le tue immagini",
	"iconPicker.searchImage": "Cerca nelle tue immagini",
	"iconPicker.imageTooLarge":
		"{{name}} è troppo grande. Le immagini devono essere inferiori a 5 MB.",
	"iconPicker.imageUnsupported":
		"{{name}} non è un formato immagine supportato. Usa SVG, PNG, JPEG o WebP.",
	"iconPicker.imageInvalidSvg":
		"{{name}} non può essere letto come SVG sicuro e non è stato aggiunto.",
	"iconPicker.imageDecodeFailed":
		"{{name}} non può essere letto come immagine.",
	"iconPicker.imageDuplicate":
		"{{name}} è già nelle tue immagini. Rinomina il file o elimina l'immagine esistente.",
	"iconPicker.imageAdd": "Aggiungi immagini",
	"iconPicker.imageEmpty":
		"Nessuna immagine ancora. Aggiungi un file SVG, PNG, JPEG o WebP dal tuo computer o trascinalo qui.",
	"iconPicker.imageDelete": "Elimina",
	"iconPicker.imageDeleteConfirm": "Eliminare “{{name}}”?",
	"iconPicker.imageDeleteInUse":
		"{{count}} callout usano questa immagine. Mostreranno un'icona segnaposto finché non ne fornisci una nuova.",
	"iconPicker.imageRecolor": "Segui il colore del Callout",
	"iconPicker.allSources": "Tutte le fonti",
	"iconPicker.searchAllSources": "Cerca in tutte le fonti di icone",
	"iconPicker.sourcesNotDownloaded":
		"Non ancora incluso: {{names}}. Scegli una fonte sopra per scaricarlo.",
	"iconPicker.chooseSource": "Scegli fonte",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources":
		"cerca in tutte le librerie contemporaneamente",
	"iconPicker.descLucide": "il set di Obsidian, sempre offline",
	"iconPicker.descTabler": "icone UI pulite e coerenti, contorno e pieno",
	"iconPicker.descMaterial":
		"il set di Google, quattro stili e sette spessori",
	"iconPicker.descEmoji": "glifi colorati, ogni tono di pelle",
	"iconPicker.descOcticons": "icone di interfaccia di GitHub",
	"iconPicker.descFa": "pieno, normale e marchi",
	"iconPicker.descRpgAwesome": "icone fantasy e giochi da tavolo",
	"iconPicker.descImage": "immagini che aggiungi dal tuo computer",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "Accessibilità",
	"iconPicker.cat.Actions": "Azioni",
	"iconPicker.cat.Activities": "Attività",
	"iconPicker.cat.Alert": "Avviso",
	"iconPicker.cat.Alphabet": "Alfabeto",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "Animali",
	"iconPicker.cat.Arrows": "Frecce",
	"iconPicker.cat.Astronomy": "Astronomia",
	"iconPicker.cat.Audio&Video": "Audio e video",
	"iconPicker.cat.Automotive": "Automotive",
	"iconPicker.cat.Badges": "Distintivi",
	"iconPicker.cat.Brand": "Marchi",
	"iconPicker.cat.Buildings": "Edifici",
	"iconPicker.cat.Business": "Affari",
	"iconPicker.cat.Camping": "Campeggio",
	"iconPicker.cat.Charity": "Beneficenza",
	"iconPicker.cat.Charts": "Grafici",
	"iconPicker.cat.Charts + Diagrams": "Grafici e diagrammi",
	"iconPicker.cat.Childhood": "Infanzia",
	"iconPicker.cat.Clothing + Fashion": "Abbigliamento e moda",
	"iconPicker.cat.Coding": "Programmazione",
	"iconPicker.cat.Communicate": "Comunicare",
	"iconPicker.cat.Communication": "Comunicazione",
	"iconPicker.cat.Computers": "Computer",
	"iconPicker.cat.Connectivity": "Connettività",
	"iconPicker.cat.Construction": "Costruzione",
	"iconPicker.cat.Currencies": "Valute",
	"iconPicker.cat.Database": "Database",
	"iconPicker.cat.Design": "Design",
	"iconPicker.cat.Development": "Sviluppo",
	"iconPicker.cat.Devices": "Dispositivi",
	"iconPicker.cat.Devices + Hardware": "Dispositivi e hardware",
	"iconPicker.cat.Disaster + Crisis": "Disastri e crisi",
	"iconPicker.cat.Document": "Documento",
	"iconPicker.cat.E-commerce": "E-commerce",
	"iconPicker.cat.Editing": "Modifica",
	"iconPicker.cat.Education": "Istruzione",
	"iconPicker.cat.Electrical": "Elettrico",
	"iconPicker.cat.Emoji": "Emoji",
	"iconPicker.cat.Energy": "Energia",
	"iconPicker.cat.Extensions": "Estensioni",
	"iconPicker.cat.Files": "File",
	"iconPicker.cat.Film + Video": "Film e video",
	"iconPicker.cat.Food": "Cibo",
	"iconPicker.cat.Food + Beverage": "Cibo e bevande",
	"iconPicker.cat.Fruits + Vegetables": "Frutta e verdura",
	"iconPicker.cat.Games": "Giochi",
	"iconPicker.cat.Gaming": "Gaming",
	"iconPicker.cat.Gender": "Genere",
	"iconPicker.cat.Genders": "Generi",
	"iconPicker.cat.Gestures": "Gesti",
	"iconPicker.cat.Halloween": "Halloween",
	"iconPicker.cat.Hands": "Mani",
	"iconPicker.cat.Hardware": "Hardware",
	"iconPicker.cat.Health": "Salute",
	"iconPicker.cat.Holidays": "Festività",
	"iconPicker.cat.Home": "Casa",
	"iconPicker.cat.Household": "Domestico",
	"iconPicker.cat.Humanitarian": "Umanitario",
	"iconPicker.cat.Images": "Immagini",
	"iconPicker.cat.Laundry": "Lavanderia",
	"iconPicker.cat.Letters": "Lettere",
	"iconPicker.cat.Logic": "Logica",
	"iconPicker.cat.Logistics": "Logistica",
	"iconPicker.cat.Map": "Mappa",
	"iconPicker.cat.Maps": "Mappe",
	"iconPicker.cat.Maritime": "Marittimo",
	"iconPicker.cat.Marketing": "Marketing",
	"iconPicker.cat.Math": "Matematica",
	"iconPicker.cat.Mathematics": "Matematica",
	"iconPicker.cat.Media": "Media",
	"iconPicker.cat.Media Playback": "Riproduzione multimediale",
	"iconPicker.cat.Medical + Health": "Medicina e salute",
	"iconPicker.cat.Money": "Denaro",
	"iconPicker.cat.Mood": "Umore",
	"iconPicker.cat.Moving": "Trasloco",
	"iconPicker.cat.Music + Audio": "Musica e audio",
	"iconPicker.cat.Nature": "Natura",
	"iconPicker.cat.Numbers": "Numeri",
	"iconPicker.cat.Photography": "Fotografia",
	"iconPicker.cat.Photos + Images": "Foto e immagini",
	"iconPicker.cat.Political": "Politico",
	"iconPicker.cat.Privacy": "Privacy",
	"iconPicker.cat.Punctuation + Symbols": "Punteggiatura e simboli",
	"iconPicker.cat.Religion": "Religione",
	"iconPicker.cat.Science": "Scienza",
	"iconPicker.cat.Science Fiction": "Fantascienza",
	"iconPicker.cat.Security": "Sicurezza",
	"iconPicker.cat.Shapes": "Forme",
	"iconPicker.cat.Shopping": "Shopping",
	"iconPicker.cat.Social": "Social media",
	"iconPicker.cat.Spinners": "Spinner",
	"iconPicker.cat.Sport": "Sport",
	"iconPicker.cat.Sports + Fitness": "Sport e fitness",
	"iconPicker.cat.Symbols": "Simboli",
	"iconPicker.cat.System": "Sistema",
	"iconPicker.cat.Text": "Testo",
	"iconPicker.cat.Text Formatting": "Formattazione del testo",
	"iconPicker.cat.Time": "Tempo",
	"iconPicker.cat.Toggle": "Interruttore",
	"iconPicker.cat.Transit": "Transito",
	"iconPicker.cat.Transportation": "Trasporti",
	"iconPicker.cat.Travel": "Viaggi",
	"iconPicker.cat.Travel + Hotel": "Viaggi e hotel",
	"iconPicker.cat.UI actions": "Azioni dell'interfaccia",
	"iconPicker.cat.Users + People": "Utenti e persone",
	"iconPicker.cat.Vehicles": "Veicoli",
	"iconPicker.cat.Version control": "Controllo versione",
	"iconPicker.cat.Weather": "Meteo",
	"iconPicker.cat.Writing": "Scrittura",
	"iconPicker.cat.Zodiac": "Zodiaco",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}} non è ancora stato scaricato",
	"iconPack.downloadDetail": "{{count}} icone · {{size}} · download unico",
	"iconPack.download": "Scarica",
	"iconPack.downloading": "Download di {{name}}…",
	"iconPack.downloadFailed":
		"Impossibile scaricare {{name}}. Controlla la connessione e riprova.",
	"iconPack.retry": "Riprova",
	"iconPack.faBrandsNotice":
		"Le icone dei marchi sono marchi registrati dei rispettivi proprietari. La loro inclusione non indica un'approvazione. Usale solo per rappresentare l'azienda, il prodotto o il servizio a cui si riferiscono.",
	"iconPack.artworkRestored":
		"L'artwork delle icone per {{names}} è stato scaricato.",
	"iconPack.diskWriteFailed":
		"Callout Studio non è riuscito a salvare il pacchetto di icone su disco, quindi dovrà essere scaricato di nuovo la prossima volta. Le icone che scegli sono comunque salvate nelle tue impostazioni.",

	// Icon licences & credits
	"credits.title": "Licenze icone e crediti",
	"credits.intro":
		"Callout Studio si basa su diverse librerie di icone aperte. Le loro licenze sono riprodotte di seguito, insieme a ciò che è stato modificato per usarle qui.",
	"credits.fullNotices": "Avvisi terze parti completi",
	"credits.pluginLicense":
		"Il codice proprio di Callout Studio è sotto licenza 0BSD; le librerie di icone mantengono le proprie licenze.",

	"contextMenu.editCallout": "Modifica impostazioni callout",
	"contextMenu.copyMarkdown": "Copia Markdown callout",
	"contextMenu.openSettings": "Apri impostazioni Callout Studio",
	"contextMenu.setFoldClosed": "Imposta il callout come chiuso (-)",
	"contextMenu.setFoldOpen": "Imposta il callout come aperto (+)",
	"contextMenu.setFoldNone": "Rendi il callout non pieghevole",
	"contextMenu.cutSection": "Taglia sezione di intestazione",
	"contextMenu.copySection": "Copia sezione di intestazione",
	"contextMenu.deleteSection": "Elimina sezione di intestazione",

	"heading.toggleFold": "Attiva/disattiva la piegatura",

	"settings.globalSettings": "Impostazioni globali",
	"settings.globalSettingsDesc":
		"Perfeziona l'aspetto di ogni tipo di callout in tutto il tuo vault.",
	"settings.globalSettingsRegularDesc":
		"Aggiungi un token callout a una citazione (ad es. `> [!type]`) per visualizzare il riquadro callout nativo di Obsidian. Puoi regolarne bordo, raggio, scala font e allineamento.",
	"settings.globalSettingsHeadingDesc":
		"Aggiungi un token callout subito dopo i cancelletti dell'intestazione (ad es. `## [!type]`) per visualizzarlo come un'intestazione callout stilizzata. Puoi regolarne bordo, forma e spaziatura verticale.",
	"settings.globalSettingsInlineDesc":
		"Aggiungi un token callout in un punto qualsiasi di una riga di testo (ad es. `[!type]`) per visualizzarlo come una piccola pillola in linea. Puoi regolarne bordo e forma.",
	"settings.globalSettingsCustomize": "Personalizza",

	"settings.calloutTypeRegular": "Callout normale",
	"settings.calloutTypeHeading": "Callout di intestazione",
	"settings.calloutTypeInline": "Callout in linea",

	"settings.customizeMenu": "Personalizza voci di menu",
	"settings.customizeMenuDesc":
		"Scegli quali azioni del clic destro appaiono per ciascun tipo di callout e riordinale. Funziona in modalità sorgente e anteprima live.",
	"settings.customizeMenuButton": "Personalizza voci di menu",
	"menuCustomize.title": "Personalizza il menu del clic destro",
	"menuCustomize.desc":
		"Attiva o disattiva le azioni e trascina la maniglia per riordinarle. Le modifiche vengono salvate automaticamente.",
	"menuCustomize.regular": "Callout normale",
	"menuCustomize.heading": "Callout di intestazione",
	"menuCustomize.inline": "Callout in linea",
	"menuCustomize.dragHandle": "Trascina per riordinare",
	"menuItem.edit": "Modifica callout",
	"menuItem.openSettings": "Apri impostazioni",
	"menuItem.copyMarkdown": "Copia Markdown",
	"menuItem.foldDefaults":
		"Piegatura predefinita (aperta / chiusa / nessuna)",
	"menuItem.cutSection": "Taglia sezione",
	"menuItem.copySection": "Copia sezione",
	"menuItem.deleteSection": "Elimina sezione",

	"confirm.ok": "Elimina",
	"confirm.cancel": "Annulla",

	"vault.filesUpdated":
		"{{count}} riferimento/i callout aggiornato/i nei file del vault.",
	"vault.idsUpdated":
		"{{count}} ID callout aggiornato/i nei file del vault: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"{{count}} titolo/i callout aggiornato/i nei file del vault: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "Sostituisci con:",
	"vault.deleteWithout": "Elimina senza sostituire",
	"vault.confirmDelete": "Conferma",
	"vault.confirmReplace": "Sostituisci",
	"vault.replacePromptInUse":
		'"{{name}}" è usato {{count}} volta/e in {{files}} file. Scegli un callout con cui sostituirlo:',
	"vault.replacePromptUnused":
		'Scegli un callout con cui sostituire "{{name}}":',
	"vault.noReplacementAvailable":
		"Nessun altro callout disponibile per sostituire questo.",
	"vault.convertedToPlainText":
		"{{blocks}} blocco/i callout in {{files}} file convertito/i in testo normale.",
	"vault.resetAliasWarning":
		"{{count}} riferimento/i in {{files}} file usano alias personalizzati: {{aliases}}. Dopo il ripristino non funzioneranno più. Continuare?",
	"vault.resetConfirm": "Ripristina",
	"vault.resetAllInUse":
		"⚠ {{count}} riferimento/i callout in {{files}} file usano tipi di callout personalizzati che verranno eliminati.",

	"vaultStats.title": "Statistiche callout",
	"vaultStats.totalCallouts": "Callout totali",
	"vaultStats.typesFound": "Tipi trovati",
	"vaultStats.filesWithCallouts": "File con callout",
	"vaultStats.filesScanned": "File Markdown scansionati",
	"vaultStats.empty": "Nessun callout trovato nelle note Markdown.",
	"vaultStats.columnType": "Tipo",
	"vaultStats.columnName": "Nome",
	"vaultStats.columnSource": "Fonte",
	"vaultStats.columnCount": "Conteggio",
	"vaultStats.columnFiles": "File",
	"vaultStats.unknown": "Sconosciuto",
	"vaultStats.sourceBuiltIn": "Integrato",
	"vaultStats.sourceCustom": "Personalizzato",
	"vaultStats.sourceAutoFallback": "Fallback automatico",
	"vaultStats.sourceTheme": "Snippet CSS",
	"vaultStats.sourceAlias": "Alias di {{id}}",
	"vaultStats.sourceUnknown": "Sconosciuto",
	"vaultStats.close": "Chiudi",

	"import.title": "Problemi di importazione",
	"import.reportLeadIn":
		"Sembra che il file importato sia stato modificato. Ecco l'elenco dei problemi:",
	"import.reportLeadInFatal":
		"Questo file non sembra un'esportazione di Callout Studio. Non può essere importato:",
	"import.entryHeading": "Voce {{index}} — {{label}}",
	"import.summary":
		"{{valid}} su {{total}} voci sono valide · {{issues}} problema/i trovato/i.",
	"import.btnCancel": "Annulla",
	"import.btnImportValid": "Importa solo le valide ({{count}})",
	"import.err.notRecognized":
		"File non riconosciuto: atteso un array di definizioni callout o un'esportazione di Callout Studio.",
	"import.warn.settingsIgnored":
		"Il blocco delle impostazioni non era un oggetto valido ed è stato ignorato.",
	"import.warn.invalidGradient":
		"Il gradiente dello sfondo non era valido ed è stato ignorato.",
	"import.err.parseFailed":
		"Il file non è JSON valido e non può essere analizzato.",
	"import.err.entryNotObject": "La voce deve essere un oggetto.",
	"import.err.requiredMissing":
		'Il campo obbligatorio "{{field}}" è mancante o ha il tipo sbagliato.',
	"import.err.idEmpty": "L'ID non deve essere vuoto.",
	"import.err.idTooLong":
		'L\'ID "{{value}}" è di {{length}} caratteri; il massimo è {{max}}.',
	"import.err.idBadChar":
		'L\'ID "{{value}}" contiene caratteri non validi ("|", "[", "]", tabulazioni e a capo non sono consentiti).',
	"import.err.displayNameEmpty":
		"Il nome visualizzato non deve essere vuoto.",
	"import.err.displayNameTooLong":
		"Il nome visualizzato è di {{length}} caratteri; il massimo è {{max}}.",
	"import.err.boolField":
		'"{{field}}" deve essere un booleano (true o false).',
	"import.err.iconNotObject": "L'icona deve essere un oggetto.",
	"import.err.iconTypeInvalid":
		'Il tipo di icona "{{value}}" non è uno tra: {{types}}.',
	"import.warn.iconFieldIgnored":
		'"{{field}}" si applica solo alle icone Material ed è ignorato per il tipo di icona {{type}}.',
	"import.err.iconValueEmpty":
		"Il valore dell'icona deve essere una stringa non vuota.",
	"import.err.iconValueTooLong":
		"Il valore dell'icona è insolitamente lungo ({{length}} caratteri).",
	"import.err.materialStyle":
		'Lo stile icona Material "{{value}}" non è uno tra: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'Il peso icona Material "{{value}}" deve essere un intero tra 100 e 700, a passi di 100.',
	"import.warn.iconRecolorIgnored":
		'"recolor" si applica solo alle proprie immagini ed è ignorato per il tipo di icona {{type}}.',
	"import.err.iconRecolorInvalid":
		'"recolor" deve essere true o false (ricevuto: "{{value}}").',
	"import.err.colorInvalid":
		'"{{field}}" deve essere un colore esadecimale come "#448aff" (ricevuto "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" deve essere un numero tra {{min}} e {{max}} (ricevuto "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" deve essere un numero tra {{min}} e {{max}} (ricevuto "{{value}}").',
	"import.err.iconAdjustShape":
		'"iconAdjust" must be an object mapping a callout type ("regular", "heading", "inline") to its icon size and offsets.',
	"import.err.aliasesNotArray": '"aliases" deve essere un array di stringhe.',
	"import.err.aliasNotString": "L'alias deve essere una stringa.",
	"import.err.aliasDup": 'L\'alias "{{value}}" è duplicato in questa voce.',
	"import.err.tooManyIds":
		"Troppi ID ({{count}}); ogni callout può avere al massimo {{max}} ID (principale + alias).",
	"import.err.metadataShape":
		'"metadata" deve essere un oggetto i cui valori sono tutti stringhe.',
	"import.warn.unknownFields": "Campi sconosciuti ignorati: {{fields}}.",
	"import.err.duplicateInFile":
		'L\'ID/alias "{{value}}" è già in uso dalla voce #{{first}} in questo file.',
	"import.err.aliasConflict":
		'L\'alias "{{value}}" è già in uso da un altro callout ("{{other}}") nel vault.',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" era true mentre "foldable" era false; defaultFolded è stato reimpostato a false.',
	"import.warn.imageMissing":
		"Questo Callout usa un'immagine che non è nel file e non è in questo vault, quindi mostrerà un'icona segnaposto finché non ne fornisci una nuova.",

	"import.err.paletteIdInvalid":
		'"paletteId" deve essere un ID testo non vuoto (ricevuto "{{value}}").',
	"import.warn.iconNameUnknown":
		"Non c'è nessuna icona \"{{value}}\" in {{type}}, quindi è stata usata l'icona predefinita.",
	"import.warn.cmIconUnknownNew":
		"Non c'è nessuna icona \"{{value}}\" in Obsidian, quindi è stata usata l'icona predefinita.",
	"import.warn.cmIconUnknownExisting":
		'Non c\'è nessuna icona "{{value}}" in Obsidian, quindi "{{id}}" ha mantenuto l\'icona che aveva già.',
	"import.chooseSource": "Importa da",
	"import.sourceStudio": "Callout Studio",
	"import.sourceStudioDesc":
		"Carica un file .json esportato da Callout Studio.",
	"import.sourceCalloutManager": "Callout Manager",
	"import.sourceCalloutManagerDesc":
		"Incolla gli stili copiati dal pulsante Copy di Callout Manager.",
	"import.sourceAdmonition": "Admonition",
	"import.sourceAdmonitionDesc":
		"Porta qui le tue admonition personalizzate dal plugin " +
		"Admonition.",
	"import.cmTitle": "Importa da Callout Manager",
	"import.cmInstructions":
		"In Callout Manager, usa il pulsante Copy per copiare i tuoi stili callout personalizzati, poi incollali qui sotto.",
	"import.cmPlaceholder": "Incolla qui gli stili copiati…",
	"import.cmBtnCancel": "Annulla",
	"import.cmBtnImport": "Importa",
	"import.err.cmNoBlocksFound":
		"Non sono stati trovati stili di Callout Manager nel testo incollato.",
	"import.err.cmNoColorForNew":
		'Nessun colore utilizzabile è stato trovato per il nuovo callout "{{value}}"; è stato ignorato.',
	"import.err.cmIdConflict":
		'L\'ID "{{value}}" è già utilizzato come alias da un altro callout ("{{other}}") ed è stato ignorato.',

	// Import — Admonition
	"import.admTitle": "Importa da Admonition",
	"import.admInstructions":
		"Ogni admonition diventa un callout con il suo nome, la sua icona " +
		"e il suo colore. Le impostazioni senza un equivalente in Callout " +
		"Studio (comando, pulsante copia, titolo nascosto) restano " +
		"indietro.",
	"import.admFromVault": "Questo vault",
	"import.admVaultChecking": "Ricerca del plugin Admonition…",
	"import.admVaultFound": "Trovate {{count}} admonition personalizzate.",
	"import.admVaultNotFound":
		"Nessuna admonition personalizzata trovata in questo vault.",
	"import.admFromFile": "Un file",
	"import.admFromFileDesc":
		"Un file admonitions.json, o un pacchetto condiviso.",
	"import.admChooseFile": "Scegli file…",
	"import.admPasteLabel": "Oppure incolla qui il JSON:",
	"import.admPlaceholder": "Incolla qui le tue admonition…",
	"import.admBtnCancel": "Annulla",
	"import.admBtnImport": "Importa",
	"import.err.admNotRecognized":
		"File non riconosciuto: era attesa una lista di admonition o un " +
		"data.json di Admonition.",
	"import.err.admNoEntries": "Nessuna admonition da importare.",
	"import.err.admTypeMissing":
		'Questa admonition non ha "type" ed è stata saltata.',
	"import.warn.admIconUnknown":
		'Nessuna icona di nome "{{value}}" è stata trovata in alcuna ' +
		"libreria, quindi è stata usata l'icona predefinita.",
	"import.warn.admIconUnknownExisting":
		'Nessuna icona di nome "{{value}}" è stata trovata in alcuna ' +
		'libreria, quindi "{{id}}" ha mantenuto l\'icona che aveva già.',
	"import.warn.admImageFailed":
		"Non è stato possibile leggere l'immagine caricata, quindi è " +
		"stata usata l'icona predefinita.",
	"import.warn.admIconWithCss":
		"Questa admonition è stilizzata da uno snippet CSS in Admonition. " +
		"Quello stile non fa parte dell'importazione, quindi sono " +
		"arrivati solo nome, icona e colore.",
	"import.warn.admNoColor":
		"Nessun colore impostato, quindi è stato usato il blu " +
		"predefinito.",
	"import.warn.admTitleTruncated":
		"Il titolo è di {{length}} caratteri; è stato accorciato a " +
		"{{max}}.",

	"footer.tagline":
		"Hai feedback, commenti o suggerimenti? Mi farebbe piacere sentirti!",
	"footer.madeBy": "Creato da Niv  •  ",
};
