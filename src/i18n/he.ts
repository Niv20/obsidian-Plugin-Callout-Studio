export const he: Record<string, string> = {
	// Commands
	"cmd.openSettings": "פתיחת הגדרות",
	"cmd.createCallout": "יצירת סוג תיבת הבלטה חדש",

	// Settings — Section headings
	"settings.myCalloutTypes": "סוגי תיבות ההבלטה שלי",
	"settings.builtInCallouts": "תיבות הבלטה מובנות",
	"settings.contextMenuPopup": "תפריט הקשר צף (Popup)",
	"settings.autocomplete": "השלמה אוטומטית",
	"settings.iconSources": "מקורות אייקונים",
	"settings.colorMode": "מצב צבע",

	// Settings — Toolbar
	"settings.searchPlaceholder": "סינון לפי שם או מזהה (ID)...",
	"settings.addNewCallout": "+ הוספת תיבת הבלטה חדשה",
	"settings.moreActions": "פעולות נוספות",
	"settings.importCSS": "ייבוא ממקטע CSS (Snippet)",
	"settings.importJSON": "ייבוא מ-JSON",
	"settings.exportAll": "ייצוא הכל",

	// Settings — Empty states
	"settings.noCalloutsYet":
		'אין עדיין תיבות הבלטה מותאמות אישית. לחצו על "+ הוספת תיבת הבלטה חדשה" כדי ליצור אחת.',
	"settings.noMatch": "לא נמצאו תיבות הבלטה התואמות לחיפוש שלך.",

	// Settings — Row actions
	"settings.editAria": "עריכת {{name}}",
	"settings.resetAria": "איפוס {{name}} לברירת מחדל",
	"settings.deleteAria": "מחיקת {{name}}",
	"settings.deleteConfirm": 'למחוק את תיבת ההבלטה "{{name}}"?',
	"settings.lightLabel": "בהיר",
	"settings.darkLabel": "כהה",
	"settings.lightColorAria": "בהיר: {{color}}",
	"settings.darkColorAria": "כהה: {{color}}",

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
	"settings.alignToTitle": "יישור לכותרת",
	"settings.alignToTitleDesc":
		"הטקסט מתחיל באותו קו אנכי של הכותרת במקום של האייקון",
	"settings.fontScaleGroup": "סקאלת פונט",
	"settings.titleScale": "כותרת",
	"settings.contentScale": "תוכן",
	"settings.shapeGroup": "צורה",
	"settings.borderRadius": "עיגול פינות",
	"settings.borderRadiusDesc": "רדיוס גבול בפיקסלים לפינות תיבת ההבלטה",
	"settings.previewTitle": "תצוגה מקדימה",
	"settings.previewCalloutTitle": "תיבת הבלטה לדוגמה",
	"settings.previewCalloutContent":
		"לורם איפסום דולור סיט אמט, קונסקטורר אדיפיסינג אלית.",

	// Settings — Popup
	"settings.enablePopup": "הפעלת תפריט הקשר צף",
	"settings.enablePopupDesc":
		"הוספת פעולות נוספות לתפריט הקליק הימני כאשר הסמן נמצא בתוך תיבת הבלטה. פועל במצב Source mode ובמצב Live Preview בעת עריכת תוכן ה-callout.",
	"settings.popupPosition": "מיקום התפריט הצף",
	"settings.topLeft": "שמאל-למעלה",
	"settings.topRight": "ימין-למעלה",
	"settings.cursor": "סמן",
	"settings.popupTransparency": "שקיפות התפריט הצף",
	"settings.popupTransparencyDesc": "0% = אטום לחלוטין, 100% = שקוף לחלוטין",
	"settings.backdropBlur": "טשטוש רקע (Backdrop blur)",
	"settings.backdropBlurDesc": "עוצמת הטשטוש בפיקסלים (0–20)",
	"settings.showIconsPopup": "הצגת אייקונים בתפריט הצף",
	"settings.showColorDots": "הצגת נקודות צבע בתפריט הצף",
	"settings.maxItemsPopup": "מספר פריטים מקסימלי בתפריט הצף",
	"settings.showEditCallout": 'הצגת "עריכת הגדרות תיבת הבלטה"',
	"settings.showOpenSettings": 'הצגת "פתיחת הגדרות Callout Studio"',
	"settings.showCopyMarkdown": 'הצגת "העתקת קוד Markdown"',
	"settings.showEditButton": 'הצגת כפתור "עריכת תיבת הבלטה"',
	"settings.popupAnimation": "אנימציית תפריט צף",
	"settings.animFade": "עמעום (Fade)",
	"settings.animSlide": "החלקה (Slide)",
	"settings.animScale": "הגדלה (Scale)",
	"settings.animNone": "ללא",

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
	"settings.customSvg": "SVG מותאם אישית",
	"settings.customSvgDesc": "אייקוני SVG שהועלו על ידי המשתמש",
	"settings.materialStyleDefault": "סגנון ברירת מחדל לאייקוני Material",
	"settings.styleOutlined": "קו מתאר (Outlined)",
	"settings.styleFilled": "מלא (Filled)",
	"settings.styleRounded": "מעוגל (Rounded)",
	"settings.styleSharp": "חד (Sharp)",
	"settings.cacheMaterial": "שמירת אייקוני Material במטמון אופליין",
	"settings.cacheMaterialDesc":
		"הורדת מטא-דאטה של אייקונים לשימוש ללא אינטרנט",

	// Settings — Color mode
	"settings.colorAppMode": "מצב החלת צבע",
	"settings.colorAppModeDesc":
		"מעקב אוטומטי אחר ערכת הנושא של Obsidian (מומלץ)",
	"settings.colorAuto": "אוטומטי (מומלץ)",
	"settings.colorForceLight": "כפיית צבעי מצב בהיר בלבד",
	"settings.colorForceDark": "כפיית צבעי מצב כהה בלבד",
	"settings.colorFormat": "פורמט צבע",
	"settings.showContrastWarning": "הצגת אזהרת ניגודיות צבע",
	"settings.showContrastWarningDesc":
		"מתריע אם צבע האייקון בעל ניגודיות נמוכה מול רקע תיבת ההבלטה",

	// Settings — Reset
	"settings.resetAll": "איפוס",
	"settings.resetAllDesc":
		"מחיקת כל תיבות ההבלטה המותאמות ואיפוס המובנות לברירות המחדל.",
	"settings.resetAllButton": "איפוס כל סוגי תיבות ההבלטה",
	"settings.resetAllConfirm":
		"פעולה זו תמחק את כל תיבות ההבלטה המותאמות שלך ותאפס את כל המובנות לברירות המחדל. לא ניתן לבטל פעולה זו. להמשיך?",
	"notice.resetAllDone": "כל סוגי תיבות ההבלטה אופסו לברירות המחדל.",

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

	// Callout Editor
	"editor.editCallout": "עריכת תיבת הבלטה",
	"editor.newCallout": "תיבת הבלטה חדשה",
	"editor.displayName": "שם לתצוגה",
	"editor.displayNameDesc": "התווית הקריאה שתוצג בממשק",
	"editor.displayNameBuiltIn":
		"לא ניתן לשנות את שם התצוגה של תיבות הבלטה מובנות",
	"editor.displayNamePlaceholder": "האזהרה שלי",
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
	"editor.iconColor": "אייקון",
	"editor.foldable": "ניתן לקיפול",
	"editor.foldableDesc": "אפשר לתיבת ההבלטה להיות מצומצמת/מורחבת",
	"editor.defaultFolded": "מקופל כברירת מחדל",
	"editor.defaultFoldedDesc": "הצגת תיבת ההבלטה במצב מצומצם בתחילה",
	"editor.cancel": "ביטול",
	"editor.saveChanges": "שמירת שינויים",
	"editor.createCallout": "יצירת תיבת הבלטה",
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
	"iconPicker.customSvg": "SVG מותאם אישית",
	"iconPicker.searchLucide": "חיפוש אייקוני Lucide...",
	"iconPicker.loadMore": "טען עוד",
	"iconPicker.materialDisabled":
		"אייקוני Material מבוטלים בהגדרות. יש להפעיל אותם תחת מקורות אייקונים.",
	"iconPicker.searchMaterial": "חיפוש אייקוני Material...",
	"iconPicker.iconsLoading": "האייקונים נטענים, נא להמתין...",
	"iconPicker.loadFailed": "טעינת אייקוני Material נכשלה: {{error}}",
	"iconPicker.allCategories": "כל הקטגוריות",
	"iconPicker.svgDisabled":
		"אייקוני SVG מותאמים אישית מבוטלים בהגדרות. יש להפעיל אותם תחת מקורות אייקונים.",
	"iconPicker.nameLabel": "שם:",
	"iconPicker.namePlaceholder": "my-icon-name",
	"iconPicker.svgPlaceholder": "הדבק כאן קוד SVG, או גרור ושחרר קובץ SVG...",
	"iconPicker.addSvg": "הוספת אייקון SVG",
	"iconPicker.nameInvalid":
		"השם חייב להכיל אותיות באנגלית (קטנות), מספרים ומקפים בלבד.",
	"iconPicker.nameExists": "אייקון SVG עם שם זה כבר קיים.",
	"iconPicker.invalidSvg": "קוד SVG לא תקין. נא לבדוק את הקלט.",
	"iconPicker.svgGallery": "גלריית SVG",
	"iconPicker.noSvgIcons": "אין עדיין אייקוני SVG מותאמים אישית.",
	"iconPicker.noIconSelected": "לא נבחר אייקון",
	"iconPicker.delete": "מחיקה",

	// Context Menu
	"contextMenu.editCallout": "עריכת הגדרות תיבת הבלטה",
	"contextMenu.copyMarkdown": "העתקת קוד Markdown",
	"contextMenu.openSettings": "פתיחת הגדרות Callout Studio",

	// Transparent Popup
	"popup.convertTo": "המרת תיבת הבלטה ל:",
	"popup.convertToAria": "המר ל-{{name}}",
	"popup.copyMarkdown": "העתקת קוד Markdown",
	"popup.customize": "התאמה אישית של סוג זה",
	"popup.createNew": "יצירת סוג חדש על בסיס זה",
	"popup.openSettings": "פתיחת הגדרות Callout Studio ←",

	// Confirm modal
	"confirm.ok": "מחיקה",
	"confirm.cancel": "ביטול",
};
