export const hi: Record<string, string> = {
	"cmd.openSettings": "सेटिंग खोलें",
	"cmd.createCallout": "नया callout प्रकार बनाएँ",
	"cmd.insertEmptyCallout": "खाली callout डालें",
	"cmd.calloutWrap": "callout में लपेटें",
	"cmd.calloutUnwrap": "callout हटाएँ",

	"autocomplete.createNew": 'नया callout बनाएँ: "{{name}}"',

	"settings.fallbackTag": "डिफ़ॉल्ट",
	"settings.fallbackTagAuto": "स्वतः डिफ़ॉल्ट",
	"settings.rescanVault": "vault फिर से स्कैन करें",
	"settings.rescanVaultDesc":
		"नोट्स में अज्ञात callout ID ढूँढता है और उन्हें फ़ॉलबैक पंक्तियों के रूप में जोड़ता है।",
	"settings.rescanVaultHintAction": "अभी स्कैन करें",
	"settings.rescanComplete":
		"पुनः स्कैन पूर्ण: {{count}} नए callout जोड़े गए।",
	"replaceModal.deleteWithoutReplaceSuffix": "(डिफ़ॉल्ट पर वापस)",

	"firstRun.title": "vault में मौजूद callouts ढूँढें?",
	"firstRun.body":
		"Callout Studio आपके vault को स्कैन करके उन callouts को खोज सकता है जो आप पहले से उपयोग कर रहे हैं, ताकि वे सेटिंग सूची में दिखें और आपकी फ़ॉलबैक शैली अपनाएँ।",
	"firstRun.heavyVaultNote":
		"आपके vault में {{count}} Markdown फ़ाइलें हैं — स्कैन में कुछ सेकंड लग सकते हैं।",
	"firstRun.laterHint":
		"आप इसे बाद में सेटिंग → vault अंतर्दृष्टि और रखरखाव → vault फिर से स्कैन करें से चला सकते हैं।",
	"firstRun.scanNow": "अभी स्कैन करें",
	"firstRun.noThanks": "नहीं, धन्यवाद",
	"firstRun.autoScanComplete":
		"Callout Studio ने आपका vault स्कैन किया और {{count}} callout जोड़े।",
	"firstRun.scanning": "स्कैन हो रहा है",

	"welcome.tooltip": "Callout Studio के बारे में",
	"welcome.title": "Callout Studio में आपका स्वागत है",
	"welcome.tagline":
		"Obsidian callouts प्रबंधित करने के लिए आपका संपूर्ण समाधान।",
	"welcome.previewTitle": "इसे कार्य में देखें",
	"welcome.sample":
		"Callout Studio से आप कस्टम आइकन, रंग और नाम के साथ callouts बना सकते हैं।\n\n" +
		"आप एक ही callout को **तीन** अलग-अलग तरीकों से उपयोग कर सकते हैं:\n\n" +
		"## [!tip] हेडिंग के रूप में\n" +
		"किसी भी हेडिंग को callout-शैली की हेडिंग बनाने के लिए, `#` के ठीक बाद `[!type]` जोड़ें।\n\n" +
		"क्या आप इस जैसा इनलाइन callout चाहते हैं [!warning]? बस किसी वाक्य के बीच में `[!type]` जोड़ें, अपने लेखन के प्रवाह को बिना तोड़े।\n\n" +
		"> [!note] सामान्य callout\n" +
		"> बेशक, क्लासिक callout ठीक उसी सिंटैक्स के साथ काम करता है जिसके आप पहले से ही आदी हैं: `> [!type]`।\n\n" +
		"Callout Studio के पास पेश करने के लिए और भी बहुत कुछ है! [और जानें]({{repoUrl}})।\n",

	"deleteModal.title": 'callout "{{name}}" हटाएँ?',
	"deleteModal.bodyInUse":
		"यह callout {{files}} फ़ाइल(ों) में {{count}} बार दिखता है।",
	"deleteModal.bodyInUseExplain":
		"हटाने पर वे ब्लॉक सादे टेक्स्ट में बदल जाएँगे — उनकी स्टाइल और callout शीर्षक खो जाएगा।",
	"deleteModal.replaceHint":
		"आप इसे किसी दूसरे callout से बदल सकते हैं, जिससे vault की सामग्री स्टाइल वाले callout के रूप में बनी रहेगी।",
	"deleteModal.bodyUnused":
		'"{{name}}" किसी नोट में उपयोग नहीं हो रहा, लेकिन यह आपका कस्टम callout है। हटाने पर यह सूची से हट जाएगा।',
	"deleteModal.replaceInstead": "इसके बजाय बदलें",
	"deleteModal.deleteInUse": "हटाएँ (सादे टेक्स्ट में बदलें)",
	"deleteModal.deleteUnused": "callout हटाएँ",

	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "मेरे callout प्रकार",
	"settings.builtInCallouts": "बिल्ट-इन callouts",
	"settings.contextMenu": "संदर्भ मेनू",
	"settings.autocomplete": "स्वतः पूर्णता",
	"settings.keyboardShortcuts": "कीबोर्ड शॉर्टकट",
	"settings.language": "भाषा",
	"settings.languageDesc":
		"Callout Studio के लिए प्रदर्शन भाषा। डिफ़ॉल्ट रूप से Obsidian की इंटरफ़ेस भाषा का अनुसरण करती है।",
	"settings.languageAuto": "स्वचालित (Obsidian के अनुसार)",
	"settings.importExport": "आयात / निर्यात",
	"settings.import": "आयात",
	"settings.export": "निर्यात",
	"settings.importDesc":
		"JSON फ़ाइल का उपयोग करके दूसरे vault से Callout Studio डेटा आयात करें।",
	"settings.exportDesc":
		"अपने सभी कस्टम callout प्रकार JSON फ़ॉर्मेट में सहेजें।",
	"settings.importConflictNotice":
		"{{count}} callout प्रकार आयात किए गए; {{overwritten}} मौजूदा प्रविष्टियाँ ओवरराइट की गईं।",

	"settings.addNewCallout": "+ callout जोड़ें",

	"settings.noCalloutsNow": "फिलहाल कोई कस्टम callout नहीं।",

	"settings.editAria": "{{name}} संपादित करें",
	"settings.moreRowActionsAria": "{{name}} के लिए और कार्य",
	"settings.usageInfo": "{{files}} फ़ाइल(ों) में {{count}} बार उपयोग",
	"settings.replaceAction": "vault में बदलें",
	"settings.deleteAction": "हटाएँ",
	"settings.resetAction": "डिफ़ॉल्ट पर रीसेट करें",
	"settings.makeFallbackAction": "डिफ़ॉल्ट फ़ॉलबैक स्टाइल उपयोग करें",

	"settings.colorSwatchAria": "एक्सेंट: {{accent}} · पृष्ठभूमि: {{bg}}",
	"settings.fallbackCallout": "डिफ़ॉल्ट फ़ॉलबैक callout",
	"settings.fallbackCalloutDesc":
		"vault में अज्ञात callout प्रकार इस callout की स्टाइल विरासत में लेंगे।",

	"settings.globalStyle": "वैश्विक callout स्टाइल",
	"settings.border": "बॉर्डर",
	"settings.borderAll": "सभी",
	"settings.borderTop": "ऊपर",
	"settings.borderRight": "दाएँ",
	"settings.borderBottom": "नीचे",
	"settings.borderLeft": "बाएँ",
	"settings.borderWidth": "बॉर्डर की मोटाई",
	"settings.fontScaleGroup": "फ़ॉन्ट स्केल",
	"settings.titleScale": "शीर्षक",
	"settings.contentScale": "सामग्री",
	"settings.inlineTextScale": "टेक्स्ट",
	"settings.shapeGroup": "आकार",
	"settings.borderRadius": "कोने का गोलापन",
	"settings.alignGroup": "संरेखण",
	"settings.alignContent": "सामग्री को शीर्षक के साथ संरेखित करें",
	"settings.headingSpacingGroup": "शीर्षक दूरी",
	"settings.headingPadVertical": "ऊर्ध्वाधर दूरी",
	"settings.headingGap": "शीर्षकों के बीच स्थान",
	"settings.headingFoldGroup": "फ़ोल्ड",
	"settings.headingFoldArrow": "फ़ोल्ड तीर दिखाएं",
	"settings.styleDemoName": "उदाहरण",
	"settings.previewTitle": "पूर्वावलोकन",

	// Settings — Saved color palettes
	"settings.customPalettes": "सहेजे गए रंग पैलेट",
	"settings.newPalette": "नया पैलेट",
	"settings.customPalettesEmpty": "फिलहाल कोई सहेजा गया पैलेट नहीं।",
	"settings.editPaletteAria": "पैलेट {{name}} संपादित करें",
	"settings.deletePaletteAria": "पैलेट {{name}} हटाएँ",
	"settings.deletePaletteConfirm":
		'पैलेट "{{name}}" हटाएँ?\nइसके रंगों का उपयोग करने वाले callout प्रभावित नहीं होंगे.',
	"settings.enableAutocomplete": "[! स्वतः पूर्णता सक्षम करें",
	"settings.enableAutocompleteDesc":
		'एडिटर में ब्लॉककोट के अंदर "[!" टाइप करने पर सुझाव दिखाता है। पूरा callout हेडर डालने के लिए सूची से callout प्रकार चुनें।',

	"settings.openHotkeys": "Callout Studio शॉर्टकट",
	"settings.openHotkeysDesc":
		"Callout Studio कमांड के लिए Obsidian की हॉटकी सेटिंग खोलता है, जहाँ आप नया callout प्रकार बनाएँ, सेटिंग खोलें, callout हटाएँ और callout में लपेटें के लिए अपने शॉर्टकट चुन सकते हैं। डिफ़ॉल्ट रूप से कोई शॉर्टकट असाइन नहीं है।",
	"settings.openHotkeysButton": "हॉटकी सेटिंग खोलें",

	"settings.vaultMaintenance": "vault अंतर्दृष्टि और रखरखाव",
	"settings.vaultStats": "Callout आँकड़े",
	"settings.vaultStatsDesc":
		"Markdown नोट्स में सभी callout ब्लॉक गिनता है और प्रकार के अनुसार समूहित करता है।",
	"settings.vaultStatsButton": "आँकड़े देखें",
	"settings.vaultStatsScanning": "स्कैन हो रहा है",
	"settings.resetAll": "रीसेट",
	"settings.resetAllDesc":
		"सभी उपयोगकर्ता callouts हटाता है, बिल्ट-इन callouts, वैश्विक स्टाइल (बॉर्डर, फ़ॉन्ट स्केल, आकार), सहेजे गए रंग पैलेट, राइट-क्लिक मेनू का कस्टमाइज़ेशन और डाउनलोड किए गए Material SVG रीसेट करता है।",
	"settings.resetAllButton": "सब रीसेट करें",
	"settings.resetAllConfirm":
		"इससे सभी कस्टम callouts हट जाएँगे, बिल्ट-इन callouts, वैश्विक स्टाइल, सहेजे गए रंग पैलेट, राइट-क्लिक मेनू का कस्टमाइज़ेशन और सभी कैश किए गए Material SVG रीसेट हो जाएँगे। यह क्रिया पूर्ववत नहीं की जा सकती। क्या आप सुनिश्चित हैं?",
	"notice.resetAllDone": "सब कुछ डिफ़ॉल्ट पर रीसेट हो गया।",

	"notice.exported":
		"Callouts को callout-studio-export.json में निर्यात किया गया",
	"notice.importedJSON": "JSON से {{count}} callout प्रकार आयात किए गए।",
	"notice.importedSettings": "प्लगइन सेटिंग आयात की गईं।",
	"notice.importedCalloutManager":
		"Callout Manager से आयात किया गया: {{created}} बनाए गए, {{updated}} अपडेट किए गए।",
	"notice.importedAdmonition":
		"Admonition से आयात किया गया: {{created}} बनाए गए, {{updated}} " +
		"अपडेट किए गए।",
	"notice.noNewJSON":
		"कोई नए callout प्रकार आयात नहीं हुए (ID पहले से मौजूद हो सकते हैं)।",
	"notice.iconDownloadFailed":
		'Material आइकन "{{name}}" डाउनलोड नहीं हो सका। यह इस स्टाइल/वेट के लिए उपलब्ध नहीं हो सकता, या आपका कनेक्शन ऑफलाइन हो सकता है।',
	"notice.nothingToWrap": "लपेटने के लिए कुछ नहीं।",
	"notice.cursorNotInsideCallout": "कर्सर callout के अंदर नहीं है।",
	"notice.openHotkeysFailed": "Obsidian हॉटकी सेटिंग नहीं खुल सकी।",
	"notice.filterHotkeysFailed":
		"Obsidian हॉटकी खुल गई, लेकिन Callout Studio फ़िल्टर लागू नहीं हो सका।",

	"editor.editCallout": "callout संपादित करें",
	"editor.newCallout": "नया callout",
	"editor.displayName": "प्रदर्शन नाम",
	"editor.displayNameDesc": "UI में दिखाया जाने वाला पठनीय लेबल",
	"editor.displayNameBuiltIn":
		"बिल्ट-इन callouts का प्रदर्शन नाम नहीं बदला जा सकता",
	"editor.displayNamePlaceholder": "मेरा callout",
	"editor.calloutIds": "Callout ID",
	"editor.calloutIdsDesc":
		"इस callout के सभी पहचानकर्ता। स्पेस की अनुमति है।\nजोड़ने के लिए Enter या + बटन दबाएँ।",
	"editor.calloutIdsPlaceholder": "ID जोड़ें",
	"editor.addId": "ID जोड़ें",
	"editor.idLinkedToName": "प्रदर्शन नाम से जुड़ी",
	"editor.idCannotDelete":
		"यह ID प्रदर्शन नाम से जुड़ी है और इसे हटाया नहीं जा सकता — बदलने के लिए नाम संपादित करें",
	"editor.icon": "आइकन",
	"editor.pickIcon": "आइकॉन चुनें",
	"editor.resetIcon": "आइकॉन को डिफ़ॉल्ट पर रीसेट करें",
	"editor.livePreview": "लाइव पूर्वावलोकन",
	"editor.iconAdjustment": "आइकन समायोजन",
	"editor.picture": "चित्र",
	"editor.size": "आकार",
	"editor.horizontalOffset": "क्षैतिज ऑफसेट",
	"editor.verticalOffset": "ऊर्ध्वाधर ऑफसेट",
	"editor.colors": "रंग",
	"editor.colorsDesc":
		"Sets this callout's border, background, and text colors.",
	"editor.resetColors": "रंगों को डिफ़ॉल्ट पर रीसेट करें",
	"editor.paletteDeleted": "हटाया गया रंग",
	"editor.paletteGroupObsidian": "Obsidian callouts",
	"editor.paletteGroupPresets": "रंग प्रीसेट",
	"editor.paletteGroupCustom": "कस्टम",
	"editor.paletteNewColor": "नया रंग…",
	"editor.contrastWarning":
		"पृष्ठभूमि की तुलना में कम कंट्रास्ट — पढ़ना मुश्किल हो सकता है",
	"editor.foldable": "मोड़ने योग्य",
	"editor.foldableDesc":
		"चुनें कि callout को मोड़ा जा सकता है या नहीं और पूरे vault में लागू करने के लिए डिफ़ॉल्ट स्थिति।",
	"editor.foldOff": "बंद",
	"editor.foldOpen": "डिफ़ॉल्ट रूप से खुला",
	"editor.foldClosed": "डिफ़ॉल्ट रूप से बंद",
	"editor.cancel": "रद्द करें",
	"editor.saveChanges": "परिवर्तन सहेजें",
	"editor.createCallout": "callout बनाएँ",
	"editor.nameRequired": "callout बनाने से पहले प्रदर्शन नाम आवश्यक है।",
	"editor.noChangesToSave": "कोई परिवर्तन नहीं हुआ।",
	"editor.downloadingIcon": "आइकन डाउनलोड हो रहा है",
	"editor.idEmpty": "कम से कम एक ID आवश्यक है",
	"editor.idExists": "इस ID वाला callout पहले से मौजूद है",
	"editor.idConflict": "यह ID किसी मौजूदा callout से टकराती है",
	"editor.idDashConflict":
		'Obsidian स्पेस को डैश के रूप में लिखता है, इसलिए यह ID "{{other}}" से टकराती है',
	"editor.untitledCallout": "बिना शीर्षक Callout",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText":
		"यहाँ एक पैराग्राफ के भीतर एक इनलाइन [!{id}] पिल है।",
	"editor.previewReadOnly": "लाइव पूर्वावलोकन संपादित नहीं किया जा सकता",

	// Palette editor modal
	"palette.newTitle": "नया रंग पैलेट",
	"palette.editTitle": "रंग पैलेट संपादित करें",
	"palette.name": "नाम",
	"palette.namePlaceholder": "मेरा पैलेट",
	"palette.nameExists": "इस नाम का पैलेट पहले से मौजूद है",
	"palette.baseColor": "आधार रंग",
	"palette.baseColorHint":
		"हम पृष्ठभूमि के रंग को स्वतः इससे मिला देंगे। यदि आप चाहें, तो {{link}} करके इसे अलग से नियंत्रित कर सकते हैं।",
	"palette.baseColorHintLink": "यहां क्लिक करें",
	"palette.advancedColors": "रंग",
	"palette.advancedColorsHint":
		"{{mode}} मोड के लिए रंग संपादित किए जा रहे हैं - दूसरा मोड स्वतः अपडेट हो जाता है। इसे जांचने के लिए Obsidian की थीम बदलें।",
	"palette.revertHint": "इसके बजाय एक ही आधार रंग पसंद करते हैं? {{link}}।",
	"palette.revertHintLink": "वापस लौटें",
	"palette.lightMode": "हल्का",
	"palette.darkMode": "गहरा",
	"palette.accentColor": "उच्चारण रंग",
	"palette.backgroundColorChannel": "पृष्ठभूमि रंग",
	"palette.textColorChannel": "पाठ रंग",
	"palette.bgIntensity": "तीव्रता",
	"palette.bgStyle": "शैली",
	"palette.bgSolid": "ठोस",
	"palette.bgGradient": "ग्रेडिएंट",
	"palette.gradientTo": "दूसरा रंग",
	"palette.gradientDirection": "दिशा",
	"palette.gradientText": "ग्रेडिएंट वाला शीर्षक टेक्स्ट",
	"palette.save": "सहेजें",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "लाल",
	"colorName.orange": "नारंगी",
	"colorName.amber": "एम्बर",
	"colorName.yellow": "पीला",
	"colorName.lime": "लाइम",
	"colorName.green": "हरा",
	"colorName.teal": "टील",
	"colorName.cyan": "सायन",
	"colorName.sky": "आसमानी",
	"colorName.blue": "नीला",
	"colorName.indigo": "नील",
	"colorName.violet": "बैंगनी",
	"colorName.purple": "जामुनी",
	"colorName.pink": "गुलाबी",
	"colorName.rose": "गहरा गुलाबी",
	"colorName.brown": "भूरा",
	"colorName.gray": "धूसर",
	"colorName.black": "काला",
	"colorName.white": "सफेद",
	"colorName.crimson": "किरमिजी",
	"colorName.coral": "मूंगा",
	"colorName.grape": "अंगूरी",
	"colorName.plum": "आलूबुखारा",
	"colorName.bubblegum": "बबलगम",

	"iconPicker.pickIcon": "आइकन चुनें",
	"iconPicker.confirm": "पुष्टि करें",
	"iconPicker.cancel": "रद्द करें",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "Lucide आइकन खोजें",
	"iconPicker.searchTabler": "Tabler आइकन खोजें",
	"iconPicker.tablerStyle": "आइकन शैली",
	"iconPicker.tablerStyleOutline": "आउटलाइन (Outline)",
	"iconPicker.tablerStyleFilled": "भरा हुआ (Filled)",
	"iconPicker.loadMore": "और लोड करें",
	"iconPicker.materialStyle": "आइकन शैली",
	"iconPicker.materialStyleOutlined": "रेखाचित्र (Outlined)",
	"iconPicker.materialStyleFilled": "भरा हुआ (Filled)",
	"iconPicker.materialStyleRounded": "गोलाकार (Rounded)",
	"iconPicker.materialStyleSharp": "तीखा (Sharp)",
	"iconPicker.materialWeight": "आइकन भार",
	"iconPicker.materialWeight100": "पतला (Thin)",
	"iconPicker.materialWeight200": "अति हल्का (Extra Light)",
	"iconPicker.materialWeight300": "हल्का (Light)",
	"iconPicker.materialWeight400": "सामान्य (Regular)",
	"iconPicker.materialWeight500": "मध्यम (Medium)",
	"iconPicker.materialWeight600": "अर्ध-मोटा (Semi Bold)",
	"iconPicker.materialWeight700": "मोटा (Bold)",
	"iconPicker.searchMaterial": "Material आइकन खोजें",
	"iconPicker.searchEmoji": "इमोजी खोजें",
	"iconPicker.skinTone": "त्वचा का रंग",
	"iconPicker.allCategories": "सभी श्रेणियाँ",
	"iconPicker.noIconSelected": "कोई आइकन नहीं चुना",
	"iconPicker.noResults": "आपकी खोज से कोई आइकन मेल नहीं खाता।",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Octicons में खोजें",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Font Awesome में खोजें",
	"iconPicker.faStyle": "आइकन शैली",
	"iconPicker.faStyleSolid": "ठोस (Solid)",
	"iconPicker.faStyleRegular": "सामान्य (Regular)",
	"iconPicker.faStyleBrands": "ब्रांड (Brands)",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "RPG Awesome में खोजें",
	"iconPicker.image": "आपकी छवियां",
	"iconPicker.searchImage": "आपकी छवियों में खोजें",
	"iconPicker.imageTooLarge":
		"{{name}} बहुत बड़ा है। चित्र 5 MB से कम होने चाहिए।",
	"iconPicker.imageUnsupported":
		"{{name}} एक समर्थित चित्र प्रारूप नहीं है। SVG, PNG, JPEG या WebP उपयोग करें।",
	"iconPicker.imageInvalidSvg":
		"{{name}} को सुरक्षित SVG के रूप में नहीं पढ़ा जा सका, इसलिए इसे नहीं जोड़ा गया।",
	"iconPicker.imageDecodeFailed":
		"{{name}} को चित्र के रूप में नहीं पढ़ा जा सका।",
	"iconPicker.imageDuplicate":
		"{{name}} पहले से ही आपकी छवियों में है। फ़ाइल का नाम बदलें या मौजूदा चित्र हटाएं।",
	"iconPicker.imageAdd": "छवियां जोड़ें",
	"iconPicker.imageEmpty":
		"अभी तक कोई चित्र नहीं। अपने कंप्यूटर से SVG, PNG, JPEG या WebP फ़ाइल जोड़ें या यहां खींचें।",
	"iconPicker.imageDelete": "हटाएं",
	"iconPicker.imageDeleteConfirm": "“{{name}}” हटाएं?",
	"iconPicker.imageDeleteInUse":
		"{{count}} callouts इस चित्र का उपयोग करते हैं। नया देने तक वे एक प्लेसहोल्डर आइकन दिखाएंगे।",
	"iconPicker.imageRecolor": "Callout रंग अनुसरण करें",
	"iconPicker.allSources": "सभी स्रोत",
	"iconPicker.searchAllSources": "सभी आइकन स्रोतों में खोजें",
	"iconPicker.sourcesNotDownloaded":
		"अभी तक शामिल नहीं: {{names}}। डाउनलोड करने के लिए ऊपर एक स्रोत चुनें।",
	"iconPicker.chooseSource": "स्रोत चुनें",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources": "एक साथ सभी लाइब्रेरी में खोजें",
	"iconPicker.descLucide": "Obsidian का अपना सेट, हमेशा ऑफलाइन",
	"iconPicker.descTabler": "स्वच्छ और सुसंगत UI आइकन, आउटलाइन और भरे हुए",
	"iconPicker.descMaterial": "Google का सेट, चार शैलियां और सात भार",
	"iconPicker.descEmoji": "रंगीन ग्लिफ़, हर त्वचा टोन",
	"iconPicker.descOcticons": "GitHub के इंटरफ़ेस आइकन",
	"iconPicker.descFa": "ठोस, सामान्य और ब्रांड",
	"iconPicker.descRpgAwesome": "फंतासी और टेबलटॉप आइकन",
	"iconPicker.descImage": "आपके कंप्यूटर से जोड़े गए चित्र",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "पहुँच",
	"iconPicker.cat.Actions": "क्रियाएँ",
	"iconPicker.cat.Activities": "गतिविधियाँ",
	"iconPicker.cat.Alert": "चेतावनी",
	"iconPicker.cat.Alphabet": "वर्णमाला",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "जानवर",
	"iconPicker.cat.Arrows": "तीर",
	"iconPicker.cat.Astronomy": "खगोल विज्ञान",
	"iconPicker.cat.Audio&Video": "ऑडियो और वीडियो",
	"iconPicker.cat.Automotive": "वाहन",
	"iconPicker.cat.Badges": "बैज",
	"iconPicker.cat.Brand": "ब्रांड",
	"iconPicker.cat.Buildings": "इमारतें",
	"iconPicker.cat.Business": "व्यापार",
	"iconPicker.cat.Camping": "कैंपिंग",
	"iconPicker.cat.Charity": "दान",
	"iconPicker.cat.Charts": "चार्ट",
	"iconPicker.cat.Charts + Diagrams": "चार्ट और आरेख",
	"iconPicker.cat.Childhood": "बचपन",
	"iconPicker.cat.Clothing + Fashion": "कपड़े और फैशन",
	"iconPicker.cat.Coding": "प्रोग्रामिंग",
	"iconPicker.cat.Communicate": "संवाद",
	"iconPicker.cat.Communication": "संचार",
	"iconPicker.cat.Computers": "कंप्यूटर",
	"iconPicker.cat.Connectivity": "कनेक्टिविटी",
	"iconPicker.cat.Construction": "निर्माण",
	"iconPicker.cat.Currencies": "मुद्राएँ",
	"iconPicker.cat.Database": "डेटाबेस",
	"iconPicker.cat.Design": "डिज़ाइन",
	"iconPicker.cat.Development": "विकास",
	"iconPicker.cat.Devices": "उपकरण",
	"iconPicker.cat.Devices + Hardware": "उपकरण और हार्डवेयर",
	"iconPicker.cat.Disaster + Crisis": "आपदा और संकट",
	"iconPicker.cat.Document": "दस्तावेज़",
	"iconPicker.cat.E-commerce": "ई-कॉमर्स",
	"iconPicker.cat.Editing": "संपादन",
	"iconPicker.cat.Education": "शिक्षा",
	"iconPicker.cat.Electrical": "विद्युत",
	"iconPicker.cat.Emoji": "इमोजी",
	"iconPicker.cat.Energy": "ऊर्जा",
	"iconPicker.cat.Extensions": "एक्सटेंशन",
	"iconPicker.cat.Files": "फ़ाइलें",
	"iconPicker.cat.Film + Video": "फिल्म और वीडियो",
	"iconPicker.cat.Food": "खाना",
	"iconPicker.cat.Food + Beverage": "खाना और पेय",
	"iconPicker.cat.Fruits + Vegetables": "फल और सब्जियाँ",
	"iconPicker.cat.Games": "खेल",
	"iconPicker.cat.Gaming": "गेमिंग",
	"iconPicker.cat.Gender": "लिंग",
	"iconPicker.cat.Genders": "लिंग",
	"iconPicker.cat.Gestures": "इशारे",
	"iconPicker.cat.Halloween": "Halloween",
	"iconPicker.cat.Hands": "हाथ",
	"iconPicker.cat.Hardware": "हार्डवेयर",
	"iconPicker.cat.Health": "स्वास्थ्य",
	"iconPicker.cat.Holidays": "त्योहार",
	"iconPicker.cat.Home": "घर",
	"iconPicker.cat.Household": "घरेलू",
	"iconPicker.cat.Humanitarian": "मानवीय",
	"iconPicker.cat.Images": "चित्र",
	"iconPicker.cat.Laundry": "कपड़े धोना",
	"iconPicker.cat.Letters": "अक्षर",
	"iconPicker.cat.Logic": "तर्क",
	"iconPicker.cat.Logistics": "रसद",
	"iconPicker.cat.Map": "नक्शा",
	"iconPicker.cat.Maps": "नक्शे",
	"iconPicker.cat.Maritime": "समुद्री",
	"iconPicker.cat.Marketing": "विपणन",
	"iconPicker.cat.Math": "गणित",
	"iconPicker.cat.Mathematics": "गणित",
	"iconPicker.cat.Media": "मीडिया",
	"iconPicker.cat.Media Playback": "मीडिया प्लेबैक",
	"iconPicker.cat.Medical + Health": "चिकित्सा और स्वास्थ्य",
	"iconPicker.cat.Money": "पैसा",
	"iconPicker.cat.Mood": "मनोदशा",
	"iconPicker.cat.Moving": "स्थानांतरण",
	"iconPicker.cat.Music + Audio": "संगीत और ऑडियो",
	"iconPicker.cat.Nature": "प्रकृति",
	"iconPicker.cat.Numbers": "संख्याएँ",
	"iconPicker.cat.Photography": "फोटोग्राफी",
	"iconPicker.cat.Photos + Images": "फोटो और चित्र",
	"iconPicker.cat.Political": "राजनीतिक",
	"iconPicker.cat.Privacy": "गोपनीयता",
	"iconPicker.cat.Punctuation + Symbols": "विराम चिह्न और प्रतीक",
	"iconPicker.cat.Religion": "धर्म",
	"iconPicker.cat.Science": "विज्ञान",
	"iconPicker.cat.Science Fiction": "विज्ञान कथा",
	"iconPicker.cat.Security": "सुरक्षा",
	"iconPicker.cat.Shapes": "आकार",
	"iconPicker.cat.Shopping": "खरीदारी",
	"iconPicker.cat.Social": "सामाजिक",
	"iconPicker.cat.Spinners": "स्पिनर",
	"iconPicker.cat.Sport": "खेल",
	"iconPicker.cat.Sports + Fitness": "खेल और फिटनेस",
	"iconPicker.cat.Symbols": "प्रतीक",
	"iconPicker.cat.System": "सिस्टम",
	"iconPicker.cat.Text": "पाठ",
	"iconPicker.cat.Text Formatting": "पाठ स्वरूपण",
	"iconPicker.cat.Time": "समय",
	"iconPicker.cat.Toggle": "टॉगल",
	"iconPicker.cat.Transit": "ट्रांज़िट",
	"iconPicker.cat.Transportation": "परिवहन",
	"iconPicker.cat.Travel": "यात्रा",
	"iconPicker.cat.Travel + Hotel": "यात्रा और होटल",
	"iconPicker.cat.UI actions": "UI क्रियाएँ",
	"iconPicker.cat.Users + People": "उपयोगकर्ता और लोग",
	"iconPicker.cat.Vehicles": "वाहन",
	"iconPicker.cat.Version control": "संस्करण नियंत्रण",
	"iconPicker.cat.Weather": "मौसम",
	"iconPicker.cat.Writing": "लेखन",
	"iconPicker.cat.Zodiac": "राशि",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}} अभी तक डाउनलोड नहीं हुआ",
	"iconPack.downloadDetail": "{{count}} आइकन · {{size}} · एकबारगी डाउनलोड",
	"iconPack.download": "डाउनलोड करें",
	"iconPack.downloading": "{{name}} डाउनलोड हो रहा है…",
	"iconPack.downloadFailed":
		"{{name}} डाउनलोड नहीं हो सका। कनेक्शन जांचें और पुनः प्रयास करें।",
	"iconPack.retry": "पुनः प्रयास करें",
	"iconPack.faBrandsNotice":
		"ब्रांड आइकन उनके संबंधित स्वामियों के ट्रेडमार्क हैं। उनका समावेश समर्थन का संकेत नहीं देता। कृपया उन्हें केवल उस कंपनी, उत्पाद या सेवा का प्रतिनिधित्व करने के लिए उपयोग करें जिसे वे संदर्भित करते हैं।",
	"iconPack.artworkRestored":
		"{{names}} के लिए आइकन आर्टवर्क डाउनलोड किया गया।",
	"iconPack.diskWriteFailed":
		"Callout Studio आइकन पैक को डिस्क पर सहेज नहीं सका, इसलिए अगली बार फिर से डाउनलोड करना होगा। आपके द्वारा चुने गए आइकन आपकी सेटिंग के साथ सहेजे गए हैं।",

	// Icon licences & credits
	"credits.title": "आइकन लाइसेंस और श्रेय",
	"credits.intro":
		"Callout Studio कई खुली आइकन लाइब्रेरी पर निर्भर करता है। उनके लाइसेंस नीचे पुनः प्रस्तुत किए गए हैं, साथ ही यहां उनके उपयोग के लिए क्या बदला गया।",
	"credits.fullNotices": "पूर्ण तृतीय-पक्ष सूचनाएं",
	"credits.pluginLicense":
		"Callout Studio का अपना कोड 0BSD लाइसेंस के अंतर्गत है; आइकन लाइब्रेरी अपने लाइसेंस बनाए रखती हैं।",

	"contextMenu.editCallout": "callout सेटिंग संपादित करें",
	"contextMenu.copyMarkdown": "callout Markdown कॉपी करें",
	"contextMenu.openSettings": "Callout Studio सेटिंग खोलें",
	"contextMenu.setFoldClosed": "callout को बंद (-) पर सेट करें",
	"contextMenu.setFoldOpen": "callout को खुला (+) पर सेट करें",
	"contextMenu.setFoldNone": "callout को मोड़ने योग्य न बनाएं",
	"contextMenu.cutSection": "शीर्षक अनुभाग काटें",
	"contextMenu.copySection": "शीर्षक अनुभाग कॉपी करें",
	"contextMenu.deleteSection": "शीर्षक अनुभाग हटाएँ",
	"heading.toggleFold": "मोड़ना टॉगल करें",
	"settings.globalSettings": "वैश्विक सेटिंग",
	"settings.globalSettingsRegularDesc":
		"Obsidian के मूल callout बॉक्स को दिखाने के लिए किसी उद्धरण में एक callout टोकन जोड़ें (जैसे, `> [!type]`)। आप इसका बॉर्डर, रेडियस, फ़ॉन्ट स्केल और संरेखण समायोजित कर सकते हैं।",
	"settings.globalSettingsHeadingDesc":
		"इसे स्टाइल किए गए callout शीर्षक के रूप में दिखाने के लिए शीर्षक के # चिह्नों के ठीक बाद एक callout टोकन जोड़ें (जैसे, `## [!type]`)। आप इसका बॉर्डर, आकार और ऊर्ध्वाधर दूरी समायोजित कर सकते हैं।",
	"settings.globalSettingsInlineDesc":
		"इसे एक छोटे इनलाइन पिल के रूप में दिखाने के लिए टेक्स्ट की किसी भी पंक्ति के भीतर कहीं भी एक callout टोकन जोड़ें (जैसे, `[!type]`)। आप इसका बॉर्डर और आकार समायोजित कर सकते हैं।",
	"settings.globalSettingsCustomize": "कस्टमाइज़ करें",
	"settings.calloutTypeRegular": "सामान्य callout",
	"settings.calloutTypeHeading": "शीर्षक callout",
	"settings.calloutTypeInline": "इनलाइन callout",
	"settings.customizeMenu": "मेनू आइटम कस्टमाइज़ करें",
	"settings.customizeMenuDesc":
		"चुनें कि प्रत्येक callout प्रकार के लिए कौन-सी राइट-क्लिक क्रियाएँ दिखाई दें और उनका क्रम बदलें। सोर्स मोड और लाइव प्रीव्यू में काम करता है।",
	"settings.customizeMenuButton": "मेनू आइटम कस्टमाइज़ करें",
	"menuCustomize.title": "राइट-क्लिक मेनू कस्टमाइज़ करें",
	"menuCustomize.desc":
		"क्रियाओं को चालू या बंद करें और उन्हें पुनः क्रमबद्ध करने के लिए हैंडल को खींचें। परिवर्तन स्वतः सहेजे जाते हैं।",
	"menuCustomize.regular": "सामान्य callout",
	"menuCustomize.heading": "शीर्षक callout",
	"menuCustomize.inline": "इनलाइन callout",
	"menuCustomize.dragHandle": "पुनः क्रमबद्ध करने के लिए खींचें",
	"menuItem.edit": "callout संपादित करें",
	"menuItem.openSettings": "सेटिंग खोलें",
	"menuItem.copyMarkdown": "Markdown कॉपी करें",
	"menuItem.foldDefaults": "डिफ़ॉल्ट मोड़ स्थिति (खुला / बंद / कोई नहीं)",
	"menuItem.cutSection": "अनुभाग काटें",
	"menuItem.copySection": "अनुभाग कॉपी करें",
	"menuItem.deleteSection": "अनुभाग हटाएँ",

	"confirm.ok": "हटाएँ",
	"confirm.cancel": "रद्द करें",

	"vault.filesUpdated":
		"vault फ़ाइलों में {{count}} callout संदर्भ अपडेट किए गए।",
	"vault.idsUpdated":
		"vault फ़ाइलों में {{count}} callout ID अपडेट किए गए: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"vault फ़ाइलों में {{count}} callout शीर्षक अपडेट किए गए: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "इससे बदलें:",
	"vault.deleteWithout": "बिना बदले हटाएँ",
	"vault.confirmDelete": "पुष्टि करें",
	"vault.confirmReplace": "बदलें",
	"vault.replacePromptInUse":
		'"{{name}}" {{files}} फ़ाइल(ों) में {{count}} बार उपयोग हो रहा है। इसे बदलने के लिए callout चुनें:',
	"vault.replacePromptUnused": '"{{name}}" बदलने के लिए callout चुनें:',
	"vault.noReplacementAvailable":
		"इसे बदलने के लिए कोई अन्य callout उपलब्ध नहीं है।",
	"vault.convertedToPlainText":
		"{{files}} फ़ाइल(ों) में {{blocks}} callout ब्लॉक सादे टेक्स्ट में बदले गए।",
	"vault.resetAliasWarning":
		"{{files}} फ़ाइल(ों) में {{count}} संदर्भ कस्टम उपनाम उपयोग कर रहे हैं: {{aliases}}। रीसेट के बाद ये काम करना बंद कर देंगे। जारी रखें?",
	"vault.resetConfirm": "रीसेट करें",
	"vault.resetAllInUse":
		"⚠ {{files}} फ़ाइल(ों) में {{count}} callout संदर्भ कस्टम callout प्रकार उपयोग कर रहे हैं जो हटाए जाएँगे।",

	"vaultStats.title": "Callout आँकड़े",
	"vaultStats.totalCallouts": "कुल callouts",
	"vaultStats.typesFound": "मिले प्रकार",
	"vaultStats.filesWithCallouts": "callouts वाली फ़ाइलें",
	"vaultStats.filesScanned": "स्कैन की गई Markdown फ़ाइलें",
	"vaultStats.empty": "Markdown नोट्स में कोई callout नहीं मिला।",
	"vaultStats.columnType": "प्रकार",
	"vaultStats.columnName": "नाम",
	"vaultStats.columnSource": "स्रोत",
	"vaultStats.columnCount": "संख्या",
	"vaultStats.columnFiles": "फ़ाइलें",
	"vaultStats.unknown": "अज्ञात",
	"vaultStats.sourceBuiltIn": "बिल्ट-इन",
	"vaultStats.sourceCustom": "कस्टम",
	"vaultStats.sourceAutoFallback": "स्वतः फ़ॉलबैक",
	"vaultStats.sourceTheme": "CSS स्निपेट",
	"vaultStats.sourceAlias": "{{id}} का उपनाम",
	"vaultStats.sourceUnknown": "अज्ञात",
	"vaultStats.close": "बंद करें",

	"import.title": "आयात समस्याएँ",
	"import.reportLeadIn":
		"लगता है आयात की गई फ़ाइल संशोधित की गई है। समस्याओं की सूची यहाँ है:",
	"import.reportLeadInFatal":
		"यह फ़ाइल Callout Studio निर्यात जैसी नहीं लगती। इसे आयात नहीं किया जा सकता:",
	"import.entryHeading": "प्रविष्टि {{index}} — {{label}}",
	"import.summary":
		"{{total}} में से {{valid}} प्रविष्टियाँ वैध हैं · {{issues}} समस्या मिली।",
	"import.btnCancel": "रद्द करें",
	"import.btnImportValid": "केवल वैध आयात करें ({{count}})",
	"import.err.notRecognized":
		"अपरिचित फ़ाइल: callout परिभाषाओं का array या Callout Studio एक्सपोर्ट अपेक्षित था।",
	"import.warn.settingsIgnored":
		"सेटिंग ब्लॉक एक वैध ऑब्जेक्ट नहीं था और इसे अनदेखा कर दिया गया।",
	"import.warn.invalidGradient":
		"पृष्ठभूमि ग्रेडिएंट वैध नहीं था और इसे अनदेखा कर दिया गया।",
	"import.err.parseFailed": "फ़ाइल वैध JSON नहीं है और पार्स नहीं हो सकी।",
	"import.err.entryNotObject": "प्रविष्टि एक ऑब्जेक्ट होनी चाहिए।",
	"import.err.requiredMissing":
		'आवश्यक फ़ील्ड "{{field}}" गायब है या गलत प्रकार का है।',
	"import.err.idEmpty": "ID खाली नहीं होनी चाहिए।",
	"import.err.idTooLong":
		'ID "{{value}}" में {{length}} अक्षर हैं; अधिकतम {{max}} है।',
	"import.err.idBadChar":
		'ID "{{value}}" में अमान्य अक्षर हैं ("|", "[", "]", टैब और लाइन ब्रेक की अनुमति नहीं है)।',
	"import.err.displayNameEmpty": "प्रदर्शन नाम खाली नहीं होना चाहिए।",
	"import.err.displayNameTooLong":
		"प्रदर्शन नाम में {{length}} अक्षर हैं; अधिकतम {{max}} है।",
	"import.err.boolField":
		'"{{field}}" एक boolean (true या false) होना चाहिए।',
	"import.err.iconNotObject": "आइकन एक ऑब्जेक्ट होना चाहिए।",
	"import.err.iconTypeInvalid":
		'आइकन प्रकार "{{value}}" इनमें से एक होना चाहिए: {{types}}।',
	"import.warn.iconFieldIgnored":
		'"{{field}}" केवल Material आइकन पर लागू होता है और आइकन प्रकार {{type}} के लिए अनदेखा किया जाता है।',
	"import.err.iconValueEmpty": "आइकन मान एक गैर-खाली स्ट्रिंग होना चाहिए।",
	"import.err.iconValueTooLong":
		"आइकन मान असामान्य रूप से लंबा है ({{length}} अक्षर)।",
	"import.err.materialStyle":
		'Material आइकन शैली "{{value}}" इनमें से एक होनी चाहिए: outlined, filled, rounded, sharp।',
	"import.err.materialWeight":
		'Material आइकन वज़न "{{value}}" 100 से 700 के बीच 100 के चरणों में पूर्णांक होना चाहिए।',
	"import.warn.iconRecolorIgnored":
		'"recolor" केवल आपके अपने चित्रों पर लागू होता है और आइकन प्रकार {{type}} के लिए अनदेखा किया जाता है।',
	"import.err.iconRecolorInvalid":
		'"recolor" true या false होना चाहिए (प्राप्त: "{{value}}")।',
	"import.err.colorInvalid":
		'"{{field}}" "#448aff" जैसा hex रंग होना चाहिए ("{{value}}" मिला)।',
	"import.err.numberRange":
		'"{{field}}" {{min}} से {{max}} के बीच संख्या होनी चाहिए ("{{value}}" मिला)।',
	"import.err.iconSizeRange":
		'"{{field}}" {{min}} से {{max}} के बीच संख्या होनी चाहिए ("{{value}}" मिला)।',
	"import.err.iconAdjustShape":
		'"iconAdjust" must be an object mapping a callout type ("regular", "heading", "inline") to its icon size and offsets.',
	"import.err.aliasesNotArray": '"aliases" स्ट्रिंग्स का array होना चाहिए।',
	"import.err.aliasNotString": "उपनाम एक स्ट्रिंग होना चाहिए।",
	"import.err.aliasDup": '"{{value}}" उपनाम इस प्रविष्टि में दोहराया गया है।',
	"import.err.tooManyIds":
		"बहुत अधिक ID ({{count}}); प्रत्येक callout में अधिकतम {{max}} ID हो सकती हैं (मुख्य + उपनाम)।",
	"import.err.metadataShape":
		'"metadata" एक ऑब्जेक्ट होना चाहिए जिसके सभी मान स्ट्रिंग हों।',
	"import.warn.unknownFields": "अज्ञात फ़ील्ड अनदेखी की गईं: {{fields}}।",
	"import.err.duplicateInFile":
		'ID/उपनाम "{{value}}" इस फ़ाइल की प्रविष्टि #{{first}} द्वारा पहले से उपयोग में है।',
	"import.err.aliasConflict":
		'उपनाम "{{value}}" आपके vault में दूसरे callout ("{{other}}") द्वारा पहले से उपयोग में है।',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" true था जबकि "foldable" false था; defaultFolded को false पर रीसेट किया गया।',
	"import.warn.imageMissing":
		"यह Callout एक ऐसे चित्र का उपयोग करता है जो फ़ाइल में और इस vault में नहीं है, इसलिए नया देने तक एक प्लेसहोल्डर आइकन दिखाएगा।",

	"import.err.paletteIdInvalid":
		'"paletteId" एक गैर-रिक्त टेक्स्ट ID होनी चाहिए ("{{value}}" प्राप्त हुई)।',
	"import.warn.iconNameUnknown":
		'"{{value}}" आइकन {{type}} में नहीं है, इसलिए डिफ़ॉल्ट आइकन का उपयोग किया गया।',
	"import.warn.cmIconUnknownNew":
		'"{{value}}" आइकन Obsidian में नहीं है, इसलिए डिफ़ॉल्ट आइकन का उपयोग किया गया।',
	"import.warn.cmIconUnknownExisting":
		'"{{value}}" आइकन Obsidian में नहीं है, इसलिए "{{id}}" ने अपना पुराना आइकन बनाए रखा।',
	"import.chooseSource": "इससे आयात करें",
	"import.sourceStudio": "Callout Studio",
	"import.sourceStudioDesc":
		"Callout Studio से निर्यात की गई .json फ़ाइल लोड करें।",
	"import.sourceCalloutManager": "Callout Manager",
	"import.sourceCalloutManagerDesc":
		"Callout Manager के Copy बटन से कॉपी किए गए स्टाइल यहाँ पेस्ट करें।",
	"import.sourceAdmonition": "Admonition",
	"import.sourceAdmonitionDesc":
		"Admonition प्लगइन से अपने कस्टम admonition यहाँ ले आएँ।",
	"import.cmTitle": "Callout Manager से आयात करें",
	"import.cmInstructions":
		"Callout Manager में, अपने कस्टमाइज़ किए गए callout स्टाइल कॉपी करने के लिए Copy बटन का उपयोग करें, फिर उन्हें नीचे पेस्ट करें।",
	"import.cmPlaceholder": "कॉपी किए गए स्टाइल यहाँ पेस्ट करें…",
	"import.cmBtnCancel": "रद्द करें",
	"import.cmBtnImport": "आयात",
	"import.err.cmNoBlocksFound":
		"पेस्ट किए गए टेक्स्ट में कोई Callout Manager स्टाइल नहीं मिले।",
	"import.err.cmNoColorForNew":
		'नए callout "{{value}}" के लिए कोई उपयोगी रंग नहीं मिला; इसे छोड़ दिया गया।',
	"import.err.cmIdConflict":
		'ID "{{value}}" पहले से ही एक अन्य callout ("{{other}}") द्वारा alias के रूप में उपयोग की जा रही है और इसे छोड़ दिया गया।',

	// Import — Admonition
	"import.admTitle": "Admonition से आयात करें",
	"import.admInstructions":
		"हर admonition अपने नाम, आइकन और रंग के साथ एक callout बन जाता " +
		"है। जिन सेटिंग्स का Callout Studio में कोई समकक्ष नहीं है " +
		"(कमांड, कॉपी बटन, छिपा शीर्षक), वे नहीं आतीं।",
	"import.admFromVault": "यह वॉल्ट",
	"import.admVaultChecking": "Admonition प्लगइन खोजा जा रहा है…",
	"import.admVaultFound": "{{count}} कस्टम admonition मिले।",
	"import.admVaultNotFound": "इस वॉल्ट में कोई कस्टम admonition नहीं मिला।",
	"import.admFromFile": "एक फ़ाइल",
	"import.admFromFileDesc": "एक admonitions.json फ़ाइल, या कोई साझा पैक।",
	"import.admChooseFile": "फ़ाइल चुनें…",
	"import.admPasteLabel": "या JSON यहाँ पेस्ट करें:",
	"import.admPlaceholder": "अपने admonition यहाँ पेस्ट करें…",
	"import.admBtnCancel": "रद्द करें",
	"import.admBtnImport": "आयात",
	"import.err.admNotRecognized":
		"अपरिचित फ़ाइल: admonition की सूची या Admonition की data.json " +
		"अपेक्षित थी।",
	"import.err.admNoEntries": "आयात करने के लिए कोई admonition नहीं मिला।",
	"import.err.admTypeMissing":
		'इस admonition में "type" नहीं है, इसे छोड़ दिया गया।',
	"import.warn.admIconUnknown":
		'"{{value}}" नाम का कोई आइकन किसी भी आइकन लाइब्रेरी में नहीं ' +
		"मिला, इसलिए डिफ़ॉल्ट आइकन उपयोग किया गया।",
	"import.warn.admIconUnknownExisting":
		'"{{value}}" नाम का कोई आइकन किसी भी आइकन लाइब्रेरी में नहीं ' +
		'मिला, इसलिए "{{id}}" ने अपना पुराना आइकन ही रखा।',
	"import.warn.admImageFailed":
		"अपलोड की गई तस्वीर पढ़ी नहीं जा सकी, इसलिए डिफ़ॉल्ट आइकन उपयोग " +
		"किया गया।",
	"import.warn.admIconWithCss":
		"यह admonition, Admonition में एक CSS स्निपेट से स्टाइल किया गया " +
		"है। वह स्टाइल आयात का हिस्सा नहीं है, इसलिए केवल इसका नाम, आइकन " +
		"और रंग ही आए।",
	"import.warn.admNoColor":
		"कोई रंग सेट नहीं था, इसलिए डिफ़ॉल्ट नीला उपयोग किया गया।",
	"import.warn.admTitleTruncated":
		"शीर्षक {{length}} वर्णों का है; इसे {{max}} तक छोटा किया गया।",

	"footer.tagline": "कोई फ़ीडबैक, टिप्पणी या सुझाव है? मुझे बताएँ!",
	"footer.madeBy": "Niv द्वारा निर्मित  •  ",
};
