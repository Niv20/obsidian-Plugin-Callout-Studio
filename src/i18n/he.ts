export const he: Record<string, string> = {
	// Commands
	"cmd.openSettings": "פתיחת הגדרות",
	"cmd.createCallout": "יצירת סוג תיבת הבלטה חדש",
	"cmd.calloutWrap": "עטיפה ב-callout",
	"cmd.calloutWrapSelection": "עטיפת הבחירה ב-callout",
	"cmd.calloutUnwrap": "פתיחה מתוך callout",
	"cmd.calloutUnwrapSelection": "פתיחת הבחירה מתוך callout",

	// Autocomplete
	"autocomplete.createNew": 'צור הבלטה חדשה: "{{name}}"',

	// Vault scan / fallback / delete
	"settings.fallbackTag": "ברירת מחדל",
	"settings.rescanVault": "סרוק מחדש את המאגר",
	"settings.rescanVaultDesc":
		"מחפש מזהי הבלטה לא מזוהים בהערות ומוסיף אותם כשורות בברירת מחדל.",
	"settings.rescanVaultHintPrefix":
		"רוצה למצוא תיבות הבלטה שקיימות כבר ב-Vault?",
	"settings.rescanVaultHintAction": "סריקה עכשיו",
	"settings.rescanComplete": "סיום סריקה: נוספו {{count}} בלוקים חדשים.",
	"replaceModal.deleteWithoutReplaceSuffix": "(נופל לברירת המחדל)",

	// Settings — Section headings
	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "סוגי תיבות ההבלטה שלי",
	"settings.builtInCallouts": "תיבות הבלטה מובנות",
	"settings.contextMenu": "תפריט הקשר",
	"settings.autocomplete": "השלמה אוטומטית",
	"settings.iconSources": "אייקוני Google Material",
	"settings.colorMode": "מצב צבע",
	"settings.importExport": "ייבוא / ייצוא",
	"settings.import": "ייבוא",
	"settings.export": "ייצוא",
	"settings.importDesc":
		"אם רוצים לייבא מ-vault אחר את ההתקדמות שלכם ב-Callout Studio, אפשר לעשות זאת באמצעות קובץ JSON.",
	"settings.exportDesc":
		"הייצוא שומר את כל סוגי תיבות ההבלטה המותאמות שלכם בפורמט JSON.",
	"settings.importConflictNotice":
		"יובאו {{count}} תיבות הבלטה; {{overwritten}} רשומות קיימות שודרגו מחדש.",

	// Settings — Toolbar
	"settings.addNewCallout": "+ הוספת תיבת הבלטה חדשה",
	"settings.refresh": "רענון",
	"settings.moreActions": "פעולות נוספות",
	"settings.importCSS": "ייבוא ממקטע CSS (Snippet)",
	"settings.importJSON": "ייבוא מ-JSON",
	"settings.exportAll": "ייצוא הכל",

	// Settings — Empty states
	"settings.noCalloutsYet":
		'אין עדיין תיבות הבלטה מותאמות אישית. לחצו על "+ הוספת תיבת הבלטה חדשה" כדי ליצור אחת.',
	"settings.noCalloutsNow": "כרגע אין תיבות הבלטה מותאמות אישית.",
	"settings.noMatch": "לא נמצאו תיבות הבלטה התואמות לחיפוש שלך.",

	// Settings — Row actions
	"settings.editAria": "עריכת {{name}}",
	"settings.resetAria": "איפוס {{name}} לברירת מחדל",
	"settings.deleteAria": "מחיקת {{name}}",
	"settings.swapAria":
		"החלפת {{name}} (ברירת המחדל הנוכחית) בתיבת הבלטה אחרת ב-Vault",
	"settings.deleteConfirm": 'למחוק את תיבת ההבלטה "{{name}}"?',
	"settings.lightLabel": "בהיר",
	"settings.darkLabel": "כהה",
	"settings.lightColorAria": "בהיר: {{color}}",
	"settings.darkColorAria": "כהה: {{color}}",
	"settings.colorPairAria": "בהיר: {{light}} · כהה: {{dark}}",

	// Settings — Fallback callout
	"settings.fallbackCallout": "תיבת הבלטה ברירת מחדל",
	"settings.fallbackCalloutDesc":
		"סוגי תיבות הבלטה לא מוכרים יקבלו את העיצוב של תיבת הבלטה זו.",

	// Settings — Global style
	"settings.globalStyle": "עיצוב כללי לתיבות הבלטה",
	"settings.globalStyleDesc": "הגדרות אלו משפיעות על כל תיבות ההבלטה.",
	"settings.border": "גבולות",
	"settings.borderDesc": "בחירת הצדדים שבהם יוצג גבול לתיבת ההבלטה",
	"settings.borderAll": "הכל",
	"settings.borderTop": "למעלה",
	"settings.borderRight": "ימין",
	"settings.borderBottom": "למטה",
	"settings.borderLeft": "שמאל",
	"settings.borderWidth": "עובי גבול",
	"settings.borderWidthDesc": "עובי הגבול בפיקסלים לצדדים פעילים",
	"settings.fontScaleGroup": "סקאלת פונט",
	"settings.titleScale": "כותרת",
	"settings.contentScale": "תוכן",
	"settings.shapeGroup": "צורה",
	"settings.borderRadius": "עיגול פינות",
	"settings.borderRadiusDesc": "רדיוס גבול בפיקסלים לפינות תיבת ההבלטה",
	"settings.previewTitle": "תצוגה מקדימה",
	"settings.previewCalloutTitle": "תיבת הבלטה לדוגמה",
	"settings.previewCalloutContent":
		"לורם איפסום דולור סיט אמט, קונסקטורר אדיפיסינג אלית. סד דו אייסמוד טמפור אינסידידונט אוט לבורה את דולורה מגנה אליקה. אוט אנים אד מינים ונאים, קויס נוסטרוד אקסרסיטאשן אולמקו לבוריס.",

	// Settings — Context menu
	"settings.enableContextMenu": "הפעלת פעולות תפריט הקשר ל-callout",
	"settings.enableContextMenuDesc":
		"הוספת פעולות נוספות לתפריט הקליק הימני של Obsidian כאשר לוחצים על callout. פועל ב-Reading view, ב-Source mode וב-Live Preview.",
	"settings.showEditCallout": 'הצגת "עריכת הגדרות תיבת הבלטה"',
	"settings.showOpenSettings": 'הצגת "פתיחת הגדרות Callout Studio"',
	"settings.showCopyMarkdown": 'הצגת "העתקת קוד Markdown"',

	// Settings — Autocomplete
	"settings.enableAutocomplete": "הפעלת השלמה אוטומטית ל-[!",
	"settings.enableAutocompleteDesc":
		'הצגת הצעות כשאתה מקליד "[!" בתוך בלוק ציטוט בעורך. בחר סוג תיבת הבלטה מהרשימה כדי להכניס כותרת שלמה.',
	"settings.showIconPreviews":
		"הצגת תצוגה מקדימה של אייקונים בהשלמה האוטומטית",
	"settings.showColorPreviews": "הצגת תצוגה מקדימה של צבעים",

	// Settings — Icon sources
	"settings.lucideIcons": "אייקוני Lucide",
	"settings.lucideIconsDesc":
		"אייקונים מובנים של Obsidian (כ-1,300 אייקונים)",
	"settings.materialIcons": "אייקוני Google Material",
	"settings.materialIconsDesc":
		"דורש חיבור לאינטרנט או מטמון מקומי (כ-3,000 אייקונים)",
	"settings.materialStyleDefault": "סגנון ברירת מחדל לאייקוני Material",
	"settings.styleOutlined": "קו מתאר (Outlined)",
	"settings.styleFilled": "מלא (Filled)",
	"settings.styleRounded": "מעוגל (Rounded)",
	"settings.styleSharp": "חד (Sharp)",
	"settings.materialWeightDefault": "משקל ברירת מחדל לאייקוני Material",
	"settings.materialWeightDefaultDesc":
		"עובי הקו של אייקוני Material (100 = דק, 700 = עבה)",
	"settings.materialCache": "מטמון אייקוני Material",
	"settings.materialCacheDesc":
		"קבצי SVG בודדים של אייקוני Material יורדים כשבוחרים אייקון לתיבת הבלטה, כך שהם עובדים אופליין ובייצוא PDF.",
	"settings.svgCache": "קבצי SVG שהורדו",
	"settings.svgCacheInfo": "{{count}} אייקונים · {{size}}",
	"settings.svgCacheEmpty": "אין עדיין אייקוני SVG של Material במטמון.",
	"settings.clearSvgCache": "ניקוי",
	"settings.viewCachedSvgs": "צפייה",
	"settings.cachedSvgsTitle": "אייקוני Material שמורים",

	// Settings — Color mode
	"settings.colorAppMode": "מצב החלת צבע",
	"settings.colorAppModeDesc":
		"מעקב אוטומטי אחר ערכת הנושא של Obsidian (מומלץ)",
	"settings.colorAuto": "אוטומטי (מומלץ)",
	"settings.colorForceLight": "כפיית צבעי מצב בהיר בלבד",
	"settings.colorForceDark": "כפיית צבעי מצב כהה בלבד",
	"settings.colorFormat": "פורמט צבע",

	// Settings — Reset
	"settings.vaultMaintenance": "ניהול נתונים",
	"settings.resetAll": "איפוס",
	"settings.resetAllDesc":
		"מחיקת כל תיבות ההבלטה, איפוס מובנות, סגנונות גלובליות (גבולות, קנה מידות, צורה) וקבצי Material SVG שהורדו.",
	"settings.resetAllButton": "איפוס הכל",
	"settings.resetAllConfirm":
		"פעולה זו תמחק תיבות הבלטה מותאמות, תאפס מובנות, סגנונות גלובליות וקבצי Material SVG. לא ניתן לבטל. להמשיך?",
	"notice.resetAllDone": "הכל אופס לברירות המחדל.",

	// Settings — Language
	"settings.language": "שפה",
	"settings.languageDesc": "שפת ממשק התוסף",
	"settings.languageAuto": "אוטומטי (לפי Obsidian)",

	// Notices
	"notice.importedCSS": "יובאו {{count}} סוגי תיבות הבלטה ממקטעי CSS.",
	"notice.noNewCSS": "לא נמצאו סוגי תיבות הבלטה חדשים במקטעי ה-CSS.",
	"notice.failedCSS": "קריאת תיקיית מקטעי ה-CSS נכשלה.",
	"notice.exported": "תיבות ההבלטה יוצאו לקובץ callout-studio-callouts.json",
	"notice.invalidJSON": "פורמט JSON לא תקין: צפוי מערך (Array).",
	"notice.importedJSON": "יובאו {{count}} סוגי תיבות הבלטה מתוך JSON.",
	"notice.noNewJSON":
		"לא יובאו תיבות הבלטה חדשות (ייתכן שהמזהים כבר קיימים).",
	"notice.failedJSON": "ניתוח קובץ ה-JSON נכשל.",
	"notice.svgCacheCleared": "מטמון SVG של Material נוקה.",
	"notice.iconDownloadFailed":
		'הורדת אייקון Material "{{name}}" נכשלה. בדוק את החיבור לאינטרנט.',
	"notice.nothingToWrap": "אין תוכן לעטוף.",
	"notice.selectionContainsNoContent": "הבחירה לא מכילה תוכן.",
	"notice.cursorNotInsideCallout": "הסמן אינו נמצא בתוך callout.",

	// Callout Editor
	"editor.editCallout": "עריכת תיבת הבלטה",
	"editor.newCallout": "תיבת הבלטה חדשה",
	"editor.displayName": "שם לתצוגה",
	"editor.displayNameDesc": "התווית הקריאה שתוצג בממשק",
	"editor.displayNameBuiltIn":
		"לא ניתן לשנות את שם התצוגה של תיבות הבלטה מובנות",
	"editor.displayNamePlaceholder": "ה-callout שלי",
	"editor.calloutIds": "מזהי תיבת הבלטה (IDs)",
	"editor.calloutIdsDesc":
		"כל המזהים לתיבת הבלטה הזו. לחצו Enter או רווח להוספה.",
	"editor.calloutIdsPlaceholder": "הוספת מזהה...",
	"editor.icon": "אייקון",
	"editor.light": "בהיר",
	"editor.dark": "כהה",
	"editor.livePreview": "תצוגה מקדימה חיה",
	"editor.iconAdjustment": "התאמת אייקון",
	"editor.size": "גודל",
	"editor.horizontalOffset": "היסט אופקי",
	"editor.verticalOffset": "היסט אנכי",
	"editor.colors": "צבעים",
	"editor.background": "רקע",
	"editor.text": "טקסט",
	"editor.iconColor": "צבע ראשי",
	"editor.palettes": "תבניות מוכנות",
	"editor.paletteDefault": "כחול ברירת מחדל",
	"editor.paletteNone": "— בחירת תבנית —",
	"editor.paletteGroupObsidian": "תיבות הבלטה של Obsidian",
	"editor.paletteGroupPresets": "תבניות צבע",
	"editor.foldable": "ניתן לקיפול",
	"editor.foldableDesc":
		"בחר האם תיבת ההבלטה ניתנת לקיפול ואת מצב ברירת המחדל בכל ה-Vault.",
	"editor.foldOff": "כבוי",
	"editor.foldOpen": "פתוח כברירת מחדל",
	"editor.foldClosed": "סגור כברירת מחדל",
	"editor.expandPreview": "פתיחת התצוגה המקדימה",
	"editor.collapsePreview": "סגירת התצוגה המקדימה",
	"editor.cancel": "ביטול",
	"editor.saveChanges": "שמירת שינויים",
	"editor.createCallout": "יצירת תיבת הבלטה",
	"editor.nameRequired": "חובה למלא שם לתצוגה לפני יצירת תיבת הבלטה.",
	"editor.noChangesToSave": "לא בוצעו שינויים.",
	"editor.downloadingIcon": "מוריד אייקון…",
	"editor.idEmpty": "נדרש לפחות מזהה אחד",
	"editor.idExists": "תיבת הבלטה עם מזהה זה כבר קיימת",
	"editor.idConflict": "מזהה זה מתנגש עם תיבת הבלטה קיימת",
	"editor.untitledCallout": "תיבת הבלטה ללא שם",
	"editor.loremIpsum":
		"לורם איפסום דולור סיט אמט, קונסקטורר אדיפיסינג אלית. סד דו איוסמוד טמפור אינסידידונט אוט לבורה את דולורה מגנה אליקווה.",

	// Icon Picker
	"iconPicker.pickIcon": "בחירת אייקון",
	"iconPicker.confirm": "אישור",
	"iconPicker.cancel": "ביטול",
	"iconPicker.lucide": "Lucide",
	"iconPicker.material": "Material",
	"iconPicker.searchLucide": "חיפוש אייקוני Lucide...",
	"iconPicker.loadMore": "טען עוד",
	"iconPicker.searchMaterial": "חיפוש אייקוני Material...",
	"iconPicker.iconsLoading": "האייקונים נטענים, נא להמתין...",
	"iconPicker.loadFailed": "טעינת אייקוני Material נכשלה: {{error}}",
	"iconPicker.allCategories": "כל הקטגוריות",
	"iconPicker.noIconSelected": "לא נבחר אייקון",
	"iconPicker.noResults": "לא נמצאו אייקונים התואמים לחיפוש.",
	"iconPicker.delete": "מחיקה",

	// Context Menu
	"contextMenu.editCallout": "עריכת הגדרות תיבת הבלטה",
	"contextMenu.copyMarkdown": "העתקת קוד Markdown",
	"contextMenu.openSettings": "פתיחת הגדרות Callout Studio",

	// Confirm modal
	"confirm.ok": "מחיקה",
	"confirm.cancel": "ביטול",

	// Vault edge-case modals
	"vault.renameConfirm":
		'{{count}} הפניות ב-{{files}} קבצים משתמשות במזהים שהוסרו: {{oldIds}}. לעדכן ל-"{{newId}}"?',
	"vault.updateFiles": "עדכון קבצים",
	"vault.skip": "דלג",
	"vault.filesUpdated": "עודכנו {{count}} הפניות בקבצי הכספת.",
	"vault.idsUpdated":
		"עודכנו {{count}} מזהי תיבות הבלטה בקבצי הכספת: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"עודכנו {{count}} כותרות תיבות הבלטה בקבצי הכספת: {{oldTitle}} → {{newTitle}}",
	"vault.deleteInUse":
		'"{{name}}" בשימוש {{count}} פעמים ב-{{files}} קבצים. בחר כיצד להמשיך:',
	"vault.replaceWith": "החלפה ב:",
	"vault.selectCallout": "\u2014 בחירת תיבת הבלטה \u2014",
	"vault.replaceAndDelete": "החלפה ומחיקה",
	"vault.deleteWithout": "מחיקה ללא החלפה",
	"vault.confirmDelete": "אישור",
	"vault.resetAliasWarning":
		"{{count}} הפניות ב-{{files}} קבצים משתמשות בכינויים מותאמים: {{aliases}}. הם יפסיקו לעבוד לאחר איפוס. להמשיך?",
	"vault.resetConfirm": "איפוס",
	"vault.resetAllInUse":
		"⚠ {{count}} הפניות ב-{{files}} קבצים משתמשות בסוגי תיבות הבלטה שיימחקו.",

	// Import validation
	"import.title": "בעיות בייבוא",
	"import.reportLeadIn":
		"אהמממ נראה שהקובץ שהבאת עבר שינוי. הנה רשימת הבעיות:",
	"import.reportLeadInFatal":
		"אהמממ הקובץ הזה לא נראה כמו ייצוא של Callout Studio ולא ניתן לייבא אותו:",
	"import.entryHeading": "רשומה {{index}} — {{label}}",
	"import.summary":
		"{{valid}} מתוך {{total}} רשומות תקינות · נמצאו {{issues}} בעיות.",
	"import.btnCancel": "ביטול",
	"import.btnImportValid": "ייבא רק את התקינות ({{count}})",
	"import.err.notArray": "הערך העליון חייב להיות מערך של הגדרות תיבת הבלטה.",
	"import.err.parseFailed": "הקובץ אינו JSON תקין ולא ניתן לפרש אותו.",
	"import.err.entryNotObject": "כל רשומה חייבת להיות אובייקט.",
	"import.err.requiredMissing": 'השדה החובה "{{field}}" חסר או מסוג שגוי.',
	"import.err.idEmpty": "ID לא יכול להיות ריק.",
	"import.err.idTooLong":
		'ה-ID "{{value}}" באורך {{length}} תווים; המקסימום הוא {{max}}.',
	"import.err.idBadChar":
		'ה-ID "{{value}}" מכיל תווים לא חוקיים (רווחים, "|", "[" או "]" אסורים).',
	"import.err.displayNameEmpty": "שם תצוגה לא יכול להיות ריק.",
	"import.err.displayNameTooLong":
		"שם התצוגה באורך {{length}} תווים; המקסימום הוא {{max}}.",
	"import.err.boolField": '"{{field}}" חייב להיות בוליאני (true או false).',
	"import.err.iconNotObject": "icon חייב להיות אובייקט.",
	"import.err.iconTypeInvalid":
		'סוג האייקון "{{value}}" אינו אחד מ: lucide, material, emoji.',
	"import.err.iconValueEmpty": "ערך האייקון חייב להיות מחרוזת לא ריקה.",
	"import.err.iconValueTooLong":
		"ערך האייקון ארוך באופן חריג ({{length}} תווים).",
	"import.err.materialStyle":
		'סגנון אייקון Material "{{value}}" אינו אחד מ: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'משקל אייקון Material "{{value}}" חייב להיות מספר שלם בין 100 ל-700, בקפיצות של 100.',
	"import.err.colorInvalid":
		'"{{field}}" חייב להיות צבע hex בפורמט "#448aff" (התקבל "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" חייב להיות מספר בין {{min}} ל-{{max}} (התקבל "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" חייב להיות מספר בין {{min}} ל-{{max}} (התקבל "{{value}}").',
	"import.err.aliasesNotArray": '"aliases" חייב להיות מערך של מחרוזות.',
	"import.err.aliasNotString": "כינוי חייב להיות מחרוזת.",
	"import.err.aliasDup": 'הכינוי "{{value}}" כפול בתוך אותה רשומה.',
	"import.err.tooManyIds":
		"יותר מדי ID-ים ({{count}}); לכל תיבת הבלטה מותר עד {{max}} ID-ים (ראשי + כינויים).",
	"import.err.metadataShape":
		'"metadata" חייב להיות אובייקט שכל ערכיו מחרוזות.',
	"import.err.unknownFields": "שדה/שדות לא מוכרים נזרקו: {{fields}}.",
	"import.err.duplicateInFile":
		'ה-ID/כינוי "{{value}}" כבר בשימוש ברשומה #{{first}} בקובץ הזה.',
	"import.err.aliasConflict":
		'הכינוי "{{value}}" כבר בשימוש בתיבת הבלטה אחרת ("{{other}}") במאגר שלך.',
	// Footer
	"footer.tagline": "יש לך משוב, הערות או הצעות? אשמח לשמוע!",
	"footer.madeBy": "נוצר על ידי Niv  •  ",

	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" היה true בזמן ש-"foldable" היה false; defaultFolded אופס ל-false.',
};
