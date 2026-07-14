/**
 * i18n/he.ts — Hebrew translation strings.
 *
 * Right-to-left locale file. Mirrors all keys from en.ts with Hebrew
 * translations. Missing keys automatically fall back to the English value
 * at runtime (handled by i18n/index.ts). Imported by i18n/index.ts.
 */
export const he: Record<string, string> = {
	// Commands
	"cmd.openSettings": "פתיחת הגדרות",
	"cmd.createCallout": "יצירת סוג תיבת־הבלטה חדש",
	"cmd.insertEmptyCallout": "הוספת callout ריק",
	"cmd.calloutWrap": "עטיפה ב־callout",
	"cmd.calloutUnwrap": "חילוץ מתוך callout",

	// Autocomplete
	"autocomplete.createNew": 'יצירת תיבת־הבלטה חדשה: "{{name}}"',

	// Vault scan / fallback / delete
	"settings.fallbackTag": "ברירת־מחדל",
	"settings.fallbackTagAuto": "ברירת־מחדל אוטומטית",
	"settings.rescanVault": "סריקה מחדש של הכספת",
	"settings.rescanVaultDesc":
		"חיפוש מזהים של תיבות־הבלטה לא מוכרות ברחבי הכספת והוספתם כשורות ברירת־מחדל.",
	"settings.rescanVaultHintPrefix":
		"רוצים למצוא תיבות־הבלטה שכבר קיימות בכספת?",
	"settings.rescanVaultHintAction": "סריקה עכשיו",
	"settings.rescanComplete": "הסריקה הסתיימה: נוספו {{count}} בלוקים חדשים.",
	"replaceModal.deleteWithoutReplaceSuffix": "(החלה של ברירת־מחדל)",

	// פופאפ סריקה ראשונית (מוצג פעם אחת בהתקנה ראשונה ל-Vault גדול)
	"firstRun.title": "לזהות תיבות־הבלטה קיימות בכספת שלכם?",
	"firstRun.body":
		"Callout Studio יכול לסרוק את הכספת ולגלות תיבות־הבלטה שכבר בשימוש, כך שיופיעו ברשימת ההגדרות ויקבלו את עיצוב ברירת־המחדל.",
	"firstRun.heavyVaultNote":
		"בכספת שלכם יש {{count}} קובצי Markdown — הסריקה עשויה להימשך מספר שניות.",
	"firstRun.laterHint":
		"תמיד אפשר להריץ סריקה מאוחר יותר דרך ההגדרות ← סקירה ותחזוקה של הכספת ← סריקה מחדש של הכספת.",
	"firstRun.scanNow": "סריקה עכשיו",
	"firstRun.noThanks": "לא כרגע, תודה",
	"firstRun.autoScanComplete":
		"Callout Studio סרק את הכספת והוסיף {{count}} תיבות־הבלטה.",
	"firstRun.scanning": "סורק...",

	// Delete-callout modal (trash button on user rows)
	"deleteModal.title": 'למחוק את תיבת־ההבלטה "{{name}}"?',
	"deleteModal.bodyInUse":
		"תיבת־הבלטה זו מופיעה {{count}} פעמים ב־{{files}} קבצים.",
	"deleteModal.bodyInUseExplain":
		"המחיקה תהפוך את הבלוקים הללו לטקסט רגיל — הם יאבדו את העיצוב ואת הכותרת של תיבת־ההבלטה.",
	"deleteModal.replaceHint":
		"לחלופין, אפשר להחליפה בתיבת־הבלטה אחרת, וכך לשמור על התוכן בכספת בתור תיבת־הבלטה מעוצבת.",
	"deleteModal.bodyUnused":
		'"{{name}}" אינה מופיעה באף פתק, אך היא תיבת־הבלטה מותאמת־אישית שיצרתם. מחיקתה תסיר אותה מהרשימה.',
	"deleteModal.replaceInstead": "החלפה במקום",
	"deleteModal.deleteInUse": "מחיקה (המרה לטקסט רגיל)",
	"deleteModal.deleteUnused": "מחיקת תיבת־ההבלטה",

	// Settings — Section headings
	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "סוגי תיבות־ההבלטה שלי",
	"settings.builtInCallouts": "תיבות־הבלטה מובנות",
	"settings.contextMenu": "תפריט ההקשר",
	"settings.autocomplete": "השלמה אוטומטית",
	"settings.keyboardShortcuts": "קיצורי מקלדת",
	"settings.language": "שפה",
	"settings.languageDesc":
		"שפת התצוגה של Callout Studio. ברירת־המחדל היא שפת הממשק של Obsidian.",
	"settings.languageAuto": "אוטומטי (לפי Obsidian)",
	"settings.colorMode": "מצב צבע",
	"settings.importExport": "ייבוא / ייצוא",
	"settings.import": "ייבוא",
	"settings.export": "ייצוא",
	"settings.importDesc":
		"אם תרצו לייבא מכספת אחרת את ההגדרות שלכם ב־Callout Studio, תוכלו לעשות זאת באמצעות קובץ JSON.",
	"settings.exportDesc":
		"הייצוא שומר את כל סוגי תיבות־ההבלטה המותאמות־אישית שלכם בפורמט JSON.",
	"settings.importConflictNotice":
		"יובאו {{count}} תיבות־הבלטה; {{overwritten}} רשומות קיימות עודכנו.",

	// Settings — Toolbar
	"settings.addNewCallout": "+ הוספת תיבת־הבלטה חדשה",
	"settings.refresh": "רענון",
	"settings.moreActions": "פעולות נוספות",
	"settings.importCSS": "ייבוא מקטע CSS (Snippet)",
	"settings.importJSON": "ייבוא מ־JSON",
	"settings.exportAll": "ייצוא הכול",

	// Settings — Empty states
	"settings.noCalloutsYet":
		'אין עדיין תיבות־הבלטה מותאמות־אישית. לחצו על "+ הוספת תיבת־הבלטה חדשה" כדי ליצור אחת.',
	"settings.noCalloutsNow": "כרגע אין תיבות־הבלטה מותאמות־אישית.",
	"settings.noMatch": "לא נמצאו תיבות־הבלטה התואמות לחיפוש.",

	// Settings — Row actions
	"settings.editAria": "עריכת {{name}}",
	"settings.resetAria": "איפוס {{name}} לברירת־מחדל",
	"settings.deleteAria": "מחיקת {{name}}",
	"settings.swapAria":
		"החלפת {{name}} (ברירת־המחדל הנוכחית) בתיבת־הבלטה אחרת בכספת",
	"settings.replaceAria": "החלפת {{name}} בכספת בתיבת־הבלטה אחרת",
	"settings.moreRowActionsAria": "פעולות נוספות עבור {{name}}",
	"settings.usageInfo": "בשימוש {{count}} פעמים ב־{{files}} קבצים",
	"settings.replaceAction": "החלפה בכספת",
	"settings.deleteAction": "מחיקה",
	"settings.resetAction": "איפוס לברירת־מחדל",
	"settings.makeFallbackAction": "החלת עיצוב ברירת־המחדל",
	"settings.deleteConfirm": 'למחוק את תיבת־ההבלטה "{{name}}"?',
	"settings.lightLabel": "בהיר",
	"settings.darkLabel": "כהה",
	"settings.lightColorAria": "בהיר: {{color}}",
	"settings.darkColorAria": "כהה: {{color}}",

	// Settings — Fallback callout
	"settings.fallbackCallout": "ברירת־מחדל לתיבות־הבלטה",
	"settings.fallbackCalloutDesc":
		"סוגי תיבות־הבלטה לא מוכרות יקבלו את העיצוב של תיבת־הבלטה זו.",

	// Settings — Global style
	"settings.globalStyle": "עיצוב גלובלי לתיבות־הבלטה",
	"settings.globalStyleDesc": "הגדרות אלו משפיעות על כל תיבות־ההבלטה.",
	"settings.border": "מסגרות",
	"settings.borderDesc": "בחירת הצדדים שבהם תוצג מסגרת לתיבת־ההבלטה",
	"settings.borderAll": "הכול",
	"settings.borderTop": "עליונה",
	"settings.borderRight": "ימנית",
	"settings.borderBottom": "תחתונה",
	"settings.borderLeft": "שמאלית",
	"settings.borderWidth": "עובי המסגרת",
	"settings.borderWidthDesc": "עובי המסגרת בפיקסלים עבור הצדדים הפעילים",
	"settings.fontScaleGroup": "קנה־מידה לגופנים",
	"settings.titleScale": "כותרת",
	"settings.contentScale": "תוכן",
	"settings.shapeGroup": "צורה",
	"settings.borderRadius": "עיגול הפינות",
	"settings.borderRadiusDesc": "רדיוס הפינות בפיקסלים של תיבת־ההבלטה",
	"settings.alignGroup": "יישור",
	"settings.alignContent": "יישור התוכן לכותרת",
	"settings.previewTitle": "תצוגה מקדימה",
	"settings.previewCalloutTitle": "תיבת־הבלטה לדוגמה",
	"settings.previewCalloutContent":
		"לורם איפסום דולור סיט אמט, קונסקטורר אדיפיסינג אלית. סד דו אייסמוד טמפור אינסידידונט אוט לבורה את דולורה מגנה אליקה. אוט אנים אד מינים ונאים, קויס נוסטרוד אקסרסיטאשן אולמקו לבוריס.",

	// Settings — Context menu
	"settings.enableContextMenu": "פעולות תפריט־הקשר עבור תיבות־הבלטה",
	"settings.enableContextMenuDesc":
		"הוספת פעולות נוספות לתפריט הלחיצה הימנית של Obsidian בעת לחיצה על תיבת־הבלטה. פועל ב־Reading view, ב־Source mode וב־Live Preview.",

	// Settings — Autocomplete
	"settings.enableAutocomplete": "השלמה אוטומטית בעת הקלדת [!",
	"settings.enableAutocompleteDesc":
		'מציג הצעות בעת הקלדת "[!" בתוך בלוק ציטוט בעורך. בחירה של סוג מתוך הרשימה תשלים אוטומטית את כותרת תיבת־ההבלטה.',

	// Settings — Keyboard shortcuts
	"settings.openHotkeys": "קיצורי המקלדת של Callout Studio",
	"settings.openHotkeysDesc":
		"פתיחת מסך קיצורי המקלדת של Obsidian עבור פקודות Callout Studio, שם תוכלו לבחור קיצורים ליצירת סוג חדש, פתיחת הגדרות, עטיפה בתוך או חילוץ מתיבת־הבלטה. כברירת־מחדל, לא מוגדרים קיצורי מקלדת.",
	"settings.openHotkeysButton": "פתיחת הגדרות",

	"settings.colorFormat": "פורמט צבע",

	// Settings — Reset
	"settings.vaultMaintenance": "סקירה ותחזוקה של הכספת",
	"settings.vaultStats": "סטטיסטיקת תיבות־הבלטה",
	"settings.vaultStatsDesc":
		"ספירת כל בלוקי תיבות־ההבלטה בקובצי Markdown וחלוקה לפי סוג.",
	"settings.vaultStatsButton": "צפייה בסטטיסטיקה",
	"settings.vaultStatsScanning": "בסריקה...",
	"settings.resetAll": "איפוס",
	"settings.resetAllDesc":
		"מחיקת כל תיבות־ההבלטה, איפוס תיבות מובנות, איפוס סגנונות גלובליים (מסגרות, קנה־מידה, צורה) ומחיקת קובצי Material SVG שהורדו.",
	"settings.resetAllButton": "איפוס הכול",
	"settings.resetAllConfirm":
		"פעולה זו תמחק תיבות־הבלטה מותאמות־אישית, תאפס תיבות מובנות, סגנונות גלובליים ותמחק קובצי Material SVG שהורדו. לא ניתן לבטל פעולה זו. להמשיך?",
	"notice.resetAllDone": "הכול אופס לברירות־המחדל.",

	// Notices
	"notice.importedCSS": "יובאו {{count}} סוגי תיבות־הבלטה ממקטעי CSS.",
	"notice.noNewCSS": "לא נמצאו סוגי תיבות־הבלטה חדשים במקטעי ה־CSS.",
	"notice.failedCSS": "קריאת תיקיית מקטעי ה־CSS נכשלה.",
	"notice.exported": "תיבות־ההבלטה יוצאו לקובץ callout-studio-export.json",
	"notice.invalidJSON": "פורמט JSON לא תקין: צפוי מערך (Array).",
	"notice.importedJSON": "יובאו {{count}} סוגי תיבות־הבלטה מתוך JSON.",
	"notice.importedSettings": "הגדרות התוסף יובאו.",
	"notice.noNewJSON":
		"לא יובאו תיבות־הבלטה חדשות (ייתכן שהמזהים כבר קיימים).",
	"notice.failedJSON": "פענוח קובץ ה־JSON נכשל.",
	"notice.svgCacheCleared": "מטמון ה־SVG של Material נוקה.",
	"notice.iconDownloadFailed":
		'לא ניתן להוריד את אייקון Material "{{name}}". ייתכן שאינו זמין בסגנון/משקל הזה, או שאין חיבור לאינטרנט.',
	"notice.nothingToWrap": "אין תוכן לעטוף.",
	"notice.selectionContainsNoContent": "האזור הנבחר אינו מכיל תוכן.",
	"notice.cursorNotInsideCallout": "הסמן אינו נמצא בתוך תיבת־הבלטה.",
	"notice.openHotkeysFailed":
		"לא ניתן לפתוח את מסך קיצורי המקלדת של Obsidian.",
	"notice.filterHotkeysFailed":
		"מסך קיצורי המקלדת נפתח, אך לא ניתן היה לסנן עבור Callout Studio.",

	// Callout Editor
	"editor.editCallout": "עריכת תיבת־הבלטה",
	"editor.newCallout": "תיבת־הבלטה חדשה",
	"editor.displayName": "שם לתצוגה",
	"editor.displayNameDesc": "התווית שתוצג ברחבי הממשק",
	"editor.displayNameBuiltIn":
		"לא ניתן לשנות את שם התצוגה של תיבות־הבלטה מובנות",
	"editor.displayNamePlaceholder": "תיבת־ההבלטה שלי",
	"editor.calloutIds": "מזהי תיבת־הבלטה (IDs)",
	"editor.calloutIdsDesc":
		"כל המזהים המשויכים לתיבת־הבלטה זו. ניתן להשתמש ברווחים.\nלחצו על Enter או על כפתור ה־+ כדי להוסיף.",
	"editor.calloutIdsPlaceholder": "הוספת מזהה",
	"editor.addId": "הוספת מזהה",
	"editor.icon": "אייקון",
	"editor.light": "בהיר",
	"editor.dark": "כהה",
	"editor.livePreview": "תצוגה מקדימה בזמן אמת",
	"editor.iconAdjustment": "התאמת אייקון",
	"editor.size": "גודל",
	"editor.horizontalOffset": "היסט אופקי",
	"editor.verticalOffset": "היסט אנכי",
	"editor.colors": "צבעים",
	"editor.background": "רקע",
	"editor.text": "טקסט",
	"editor.iconColor": "צבע ראשי",
	"editor.paletteNone": "— בחירת תבנית —",
	"editor.paletteGroupObsidian": "תיבות־הבלטה של Obsidian",
	"editor.paletteGroupPresets": "תבניות צבע",
	"editor.foldable": "ניתן לקיפול",
	"editor.foldableDesc":
		"האם תיבת־ההבלטה ניתנת לקיפול ומה יהיה מצב ברירת־המחדל שלה ברחבי הכספת.",
	"editor.foldOff": "ללא קיפול",
	"editor.foldOpen": "פתוח כברירת־מחדל",
	"editor.foldClosed": "סגור כברירת־מחדל",
	"editor.expandPreview": "פתיחת התצוגה המקדימה",
	"editor.collapsePreview": "סגירת התצוגה המקדימה",
	"editor.cancel": "ביטול",
	"editor.saveChanges": "שמירת שינויים",
	"editor.createCallout": "יצירת תיבת־הבלטה",
	"editor.nameRequired": "יש להזין שם לתצוגה לפני יצירת תיבת־הבלטה.",
	"editor.noChangesToSave": "לא בוצעו שינויים.",
	"editor.downloadingIcon": "מוריד אייקון...",
	"editor.idEmpty": "נדרש לפחות מזהה אחד",
	"editor.idExists": "תיבת־הבלטה עם מזהה זה כבר קיימת",
	"editor.idConflict": "מזהה זה מתנגש עם תיבת־הבלטה קיימת",
	"editor.untitledCallout": "תיבת־הבלטה ללא שם",
	"editor.loremIpsum":
		"לורם איפסום דולור סיט אמט, קונסקטורר אדיפיסינג אלית. סד דו איוסמוד טמפור אינסידידונט אוט לבורה את דולורה מגנה אליקווה.",
	"editor.sampleInlineText": "כאן יש תגית [!{id}] מוטבעת בתוך פסקה.",
	"editor.previewReadOnly": "לא ניתן לערוך את התצוגה המקדימה",

	// Icon Picker
	"iconPicker.pickIcon": "בחירת אייקון",
	"iconPicker.confirm": "אישור",
	"iconPicker.cancel": "ביטול",
	"iconPicker.lucide": "Lucide",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "אימוג'י",
	"iconPicker.searchLucide": "חיפוש אייקוני Lucide",
	"iconPicker.loadMore": "טעינת עוד אייקונים",
	"iconPicker.searchMaterial": "חיפוש אייקוני Material",
	"iconPicker.searchEmoji": "חיפוש אימוג'י",
	"iconPicker.skinTone": "גוון עור",
	"iconPicker.iconsLoading": "האייקונים נטענים, אנא המתינו...",
	"iconPicker.loadFailed": "טעינת אייקוני Material נכשלה: {{error}}",
	"iconPicker.allCategories": "כל הקטגוריות",
	"iconPicker.noIconSelected": "לא נבחר אייקון",
	"iconPicker.noResults": "לא נמצאו אייקונים התואמים לחיפוש.",
	"iconPicker.delete": "מחיקה",

	// Context Menu
	"contextMenu.editCallout": "עריכת הגדרות תיבת־הבלטה",
	"contextMenu.copyMarkdown": "העתקת קוד Markdown",
	"contextMenu.openSettings": "פתיחת הגדרות של Callout Studio",
	"contextMenu.setFoldClosed": "הגדרת תיבת־ההבלטה כסגורה (-)",
	"contextMenu.setFoldOpen": "הגדרת תיבת־ההבלטה כפתוחה (+)",
	"contextMenu.setFoldNone": "הפיכת תיבת־ההבלטה לבלתי ניתנת לקיפול",
	"contextMenu.cutSection": "גזירת מקטע הכותרת",
	"contextMenu.copySection": "העתקת מקטע הכותרת",
	"contextMenu.deleteSection": "מחיקת מקטע הכותרת",

	// Heading callouts
	"heading.toggleFold": "החלפת מצב קיפול",

	// Global settings section (per-role style popups)
	"settings.globalSettings": "הגדרות גלובליות",
	"settings.globalSettingsDesc":
		"כיוונון עדין של המראה של כל סוג תיבת־הבלטה בכל רחבי הכספת שלכם.",
	"settings.globalSettingsRegularDesc":
		"הוספת סימון תיבת־הבלטה לתוך ציטוט (למשל, `> [!type]`) תציג את תיבת־ההבלטה המובנית של Obsidian. ניתן להתאים את המסגרת, עיגול הפינות, קנה־המידה של הגופן והיישור.",
	"settings.globalSettingsHeadingDesc":
		"הוספת סימון תיבת־הבלטה מיד אחרי הסולמיות של הכותרת (למשל, `## [!type]`) תציג אותה ככותרת מעוצבת. ניתן להתאים את המסגרת, הצורה והריווח האנכי.",
	"settings.globalSettingsInlineDesc":
		"הוספת סימון תיבת־הבלטה בכל מקום בתוך שורת טקסט (למשל, `[!type]`) תציג אותה כגלולה קטנה מוטבעת. ניתן להתאים את המסגרת והצורה שלה.",
	"settings.globalSettingsCustomize": "התאמה אישית",

	// Callout types section
	"settings.calloutTypes": "סוגי תיבות־הבלטה",
	"settings.calloutTypeRegular": "תיבת־הבלטה רגילה",
	"settings.calloutTypeRegularDesc":
		"תיבת־הבלטה עם תוכן בתוך ציטוט: ‎> [!name]‎. תמיד פעילה.",
	"settings.calloutTypeHeading": "תיבת־הבלטה ככותרת",
	"settings.calloutTypeHeadingDesc":
		"כותרת שהתוכן הראשון בה הוא הסימון, למשל ‎## [!name]‎. מוצגת כפס צבעוני בגודל הפונט של הכותרת. סימון ‎+‎ / ‎-‎ אחרי הסימון פותח/סוגר את כל המקטע בעת פתיחת הקובץ.",
	"settings.calloutTypeInline": "תיבת־הבלטה מוטבעת",
	"settings.calloutTypeInlineDesc":
		"סימון ‎[!name]‎ באמצע שורה, מוצג כגלולה קטנה. ללא כותרת וללא תוכן.",
	"settings.refCleanTitles": "ניקוי כותרות במתאר ובקישורים",
	"settings.refCleanTitlesDesc":
		"הסתרת הסימון ‎[!name]‎ בכל מקום שבו יש הפניה לתיבת־הבלטה מסוג כותרת: חלונית המתאר, קישורים לכותרת (כולל תוכני עניינים), וחלונית הצעות הקישורים. כותרות ללא טקסט כותרת מציגות את השם לתצוגה של תיבת־ההבלטה.",
	"settings.refShowIcon": "הצגת סמל במתאר ובקישורים",
	"settings.refShowIconDesc":
		"הצגת הסמל הצבעוני של תיבת־ההבלטה לפני הכותרת המנוקה במקומות אלו.",

	// Context menu customization
	"settings.customizeMenu": "התאמת פריטי התפריט",
	"settings.customizeMenuDesc":
		"בחירה אילו פעולות קליק־ימני יופיעו לכל סוג תיבת־הבלטה ושינוי סדרן.",
	"settings.customizeMenuButton": "התאמת פריטי התפריט",
	"menuCustomize.title": "התאמת תפריט הקליק־הימני",
	"menuCustomize.desc":
		"הפעלה או כיבוי של פעולות ושינוי סדרן באמצעות החצים. השינויים נשמרים אוטומטית.",
	"menuCustomize.regular": "תיבת־הבלטה רגילה",
	"menuCustomize.heading": "תיבת־הבלטה ככותרת",
	"menuCustomize.inline": "תיבת־הבלטה מוטבעת",
	"menuCustomize.moveUp": "העברה למעלה",
	"menuCustomize.moveDown": "העברה למטה",
	"menuItem.edit": "עריכת תיבת־ההבלטה",
	"menuItem.openSettings": "פתיחת ההגדרות",
	"menuItem.copyMarkdown": "העתקת Markdown",
	"menuItem.foldDefaults": "ברירות מחדל לקיפול (פתוח / סגור / ללא)",
	"menuItem.cutSection": "גזירת המקטע",
	"menuItem.copySection": "העתקת המקטע",
	"menuItem.deleteSection": "מחיקת המקטע",

	// Confirm modal
	"confirm.ok": "מחיקה",
	"confirm.cancel": "ביטול",

	// Vault edge-case modals
	"vault.renameConfirm":
		'{{count}} הפניות ב־{{files}} קבצים משתמשות במזהים שהוסרו: {{oldIds}}. לעדכן ל־"{{newId}}"?',
	"vault.updateFiles": "עדכון קבצים",
	"vault.skip": "דילוג",
	"vault.filesUpdated": "עודכנו {{count}} הפניות בקובצי הכספת.",
	"vault.idsUpdated":
		"עודכנו {{count}} מזהים של תיבות־הבלטה בקובצי הכספת: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"עודכנו {{count}} כותרות של תיבות־הבלטה בקובצי הכספת: {{oldTitle}} → {{newTitle}}",
	"vault.deleteInUse":
		'"{{name}}" מופיעה {{count}} פעמים ב־{{files}} קבצים. כיצד תרצו להמשיך?',
	"vault.replaceWith": "החלפה ב:",
	"vault.selectCallout": "— בחירת תיבת־הבלטה —",
	"vault.replaceAndDelete": "החלפה ומחיקה",
	"vault.deleteWithout": "מחיקה ללא החלפה",
	"vault.confirmDelete": "אישור",
	"vault.confirmReplace": "החלפה",
	"vault.replacePromptInUse":
		'"{{name}}" מופיעה {{count}} פעמים ב־{{files}} קבצים. בחרו תיבת־הבלטה חלופית:',
	"vault.replacePromptUnused": 'בחרו תיבת־הבלטה להחלפת "{{name}}":',
	"vault.noReplacementAvailable": "אין תיבות־הבלטה אחרות הזמינות להחלפה.",
	"vault.convertedToPlainText":
		"הומרו {{blocks}} בלוקים של תיבות־הבלטה ב־{{files}} קבצים לטקסט רגיל.",
	"vault.resetAliasWarning":
		"{{count}} הפניות ב־{{files}} קבצים משתמשות בכינויים מותאמים־אישית: {{aliases}}. הכינויים הללו יפסיקו לעבוד לאחר איפוס. להמשיך?",
	"vault.resetConfirm": "איפוס",
	"vault.resetAllInUse":
		"⚠ {{count}} הפניות ב־{{files}} קבצים משתמשות בסוגי תיבות־הבלטה שעומדות להימחק.",

	// Vault statistics modal
	"vaultStats.title": "סטטיסטיקת תיבות־הבלטה",
	"vaultStats.totalCallouts": "סך הכול תיבות־הבלטה",
	"vaultStats.typesFound": "סוגים שנמצאו",
	"vaultStats.filesWithCallouts": "קבצים המכילים תיבות־הבלטה",
	"vaultStats.filesScanned": "קובצי Markdown שנסרקו",
	"vaultStats.empty": "לא נמצאו תיבות־הבלטה בקובצי Markdown.",
	"vaultStats.columnType": "סוג",
	"vaultStats.columnName": "שם",
	"vaultStats.columnSource": "מקור",
	"vaultStats.columnCount": "כמות",
	"vaultStats.columnFiles": "קבצים",
	"vaultStats.unknown": "לא מוכר",
	"vaultStats.sourceBuiltIn": "מובנה",
	"vaultStats.sourceCustom": "מותאם־אישית",
	"vaultStats.sourceAutoFallback": "ברירת־מחדל אוטומטית",
	"vaultStats.sourceTheme": "מקטע CSS",
	"vaultStats.sourceAlias": "כינוי של {{id}}",
	"vaultStats.sourceUnknown": "לא מוכר",
	"vaultStats.close": "סגירה",

	// Import validation
	"import.title": "בעיות בייבוא",
	"import.reportLeadIn":
		"נראה שהקובץ שניסיתם לייבא מכיל כמה שגיאות. הנה רשימת הבעיות:",
	"import.reportLeadInFatal":
		"הקובץ הזה לא נראה כמו קובץ ייצוא של Callout Studio ולכן לא ניתן לייבא אותו:",
	"import.entryHeading": "רשומה {{index}} — {{label}}",
	"import.summary":
		"{{valid}} מתוך {{total}} רשומות נמצאו תקינות · התגלו {{issues}} בעיות.",
	"import.btnCancel": "ביטול",
	"import.btnImportValid": "ייבוא הרשומות התקינות בלבד ({{count}})",
	"import.err.notArray": "הערך הראשי חייב להיות מערך (Array) של הגדרות תיבת־הבלטה.",
	"import.err.notRecognized":
		"קובץ לא מזוהה: נדרש מערך של הגדרות תיבת־הבלטה או קובץ ייצוא של Callout Studio.",
	"import.warn.settingsIgnored":
		"מקטע ההגדרות לא היה אובייקט תקין ולכן לא יובא.",
	"import.err.parseFailed": "הקובץ אינו JSON תקין ולכן לא ניתן לפענח אותו.",
	"import.err.entryNotObject": "כל רשומה חייבת להיות אובייקט (Object).",
	"import.err.requiredMissing": 'שדה החובה "{{field}}" חסר או שסוגו שגוי.',
	"import.err.idEmpty": "ה־ID לא יכול להיות ריק.",
	"import.err.idTooLong":
		'ה־ID "{{value}}" ארוך מדי ({{length}} תווים); המקסימום המותר הוא {{max}}.',
	"import.err.idBadChar":
		'ה־ID "{{value}}" מכיל תווים לא חוקיים ("|", "[", "]", טאבים ומעברי שורה אינם מורשים).',
	"import.err.displayNameEmpty": "שם התצוגה לא יכול להיות ריק.",
	"import.err.displayNameTooLong":
		"שם התצוגה ארוך מדי ({{length}} תווים); המקסימום המותר הוא {{max}}.",
	"import.err.boolField": '"{{field}}" חייב להיות ערך בוליאני (true או false).',
	"import.err.iconNotObject": "icon חייב להיות אובייקט (Object).",
	"import.err.iconTypeInvalid":
		'סוג האייקון "{{value}}" אינו חוקי (חייב להיות אחד מ־lucide, material או emoji).',
	"import.err.iconValueEmpty": "ערך האייקון חייב להיות מחרוזת (String) שאינה ריקה.",
	"import.err.iconValueTooLong":
		"ערך האייקון חורג מהאורך המקסימלי ({{length}} תווים).",
	"import.err.materialStyle":
		'סגנון אייקון Material "{{value}}" אינו חוקי (חייב להיות אחד מ־outlined, filled, rounded או sharp).',
	"import.err.materialWeight":
		'משקל אייקון Material "{{value}}" חייב להיות מספר שלם בין 100 ל־700 (בקפיצות של 100).',
	"import.err.colorInvalid":
		'"{{field}}" חייב להיות בצבע hex בפורמט "#448aff" (התקבל "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" חייב להיות מספר בין {{min}} ל־{{max}} (התקבל "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" חייב להיות מספר בין {{min}} ל־{{max}} (התקבל "{{value}}").',
	"import.err.aliasesNotArray": '"aliases" חייב להיות מערך (Array) של מחרוזות (Strings).',
	"import.err.aliasNotString": "כינוי (Alias) חייב להיות מחרוזת (String).",
	"import.err.aliasDup": 'הכינוי "{{value}}" מופיע יותר מפעם אחת באותה רשומה.',
	"import.err.tooManyIds":
		"יותר מדי ID־ים ({{count}}); לכל תיבת־הבלטה מותרים עד {{max}} ID־ים (ראשי + כינויים).",
	"import.err.metadataShape":
		'"metadata" חייב להיות אובייקט (Object) שכל ערכיו הם מחרוזות.',
	"import.err.unknownFields": "שדות לא מוכרים הוסרו מהייבוא: {{fields}}.",
	"import.err.duplicateInFile":
		'ה־ID או הכינוי "{{value}}" כבר נמצא בשימוש ברשומה #{{first}} בקובץ זה.',
	"import.err.aliasConflict":
		'הכינוי "{{value}}" כבר נמצא בשימוש בתיבת־הבלטה אחרת ("{{other}}") בכספת שלכם.',
	// Footer
	"footer.tagline": "יש לכם משוב, הערות או הצעות? אשמח לשמוע!",
	"footer.madeBy": "נוצר על־ידי ניב  •  ",

	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" הוגדר כ־true למרות ש־"foldable" הוגדר כ־false; לכן defaultFolded אופס בחזרה ל־false.',
};
