export const ms: Record<string, string> = {
	"cmd.openSettings": "Buka tetapan",
	"cmd.createCallout": "Cipta jenis callout baharu",
	"cmd.insertEmptyCallout": "Masukkan callout kosong",
	"cmd.calloutWrap": "Balut dalam callout",
	"cmd.calloutUnwrap": "Buang callout",
	"autocomplete.createNew": 'Cipta callout baharu: "{{name}}"',
	"settings.fallbackTag": "Lalai",
	"settings.fallbackTagAuto": "Lalai automatik",
	"settings.rescanVault": "Imbas semula vault",
	"settings.rescanVaultDesc":
		"Mencari ID callout yang tidak dikenali dalam nota dan menambahkannya sebagai baris sandaran.",
	"settings.rescanVaultHintAction": "Imbas sekarang",
	"settings.rescanComplete":
		"Pengimbasan semula selesai: {{count}} callout baharu ditambah.",
	"replaceModal.deleteWithoutReplaceSuffix": "(kembali ke lalai)",
	"firstRun.title": "Cari callouts sedia ada dalam vault?",
	"firstRun.body":
		"Callout Studio boleh mengimbas vault anda untuk menemui callouts yang sudah anda gunakan, supaya ia muncul dalam senarai tetapan dan menggunakan gaya sandaran anda.",
	"firstRun.heavyVaultNote":
		"Vault anda mempunyai {{count}} fail Markdown — pengimbasan mungkin mengambil beberapa saat.",
	"firstRun.laterHint":
		"Anda sentiasa boleh menjalankannya kemudian dari Tetapan → Wawasan & penyelenggaraan vault → Imbas semula vault.",
	"firstRun.scanNow": "Imbas sekarang",
	"firstRun.noThanks": "Tidak, terima kasih",
	"firstRun.autoScanComplete":
		"Callout Studio mengimbas vault anda dan menambah {{count}} callout.",
	"firstRun.scanning": "Mengimbas",

	"welcome.tooltip": "Tentang Callout Studio",
	"welcome.title": "Selamat datang ke Callout Studio",
	"welcome.tagline":
		"Penyelesaian lengkap anda untuk menguruskan callout Obsidian.",
	"welcome.previewTitle": "Lihat ia beraksi",
	"welcome.sample":
		"Callout Studio membolehkan anda mencipta callout dengan ikon, warna dan nama tersendiri.\n\n" +
		"Anda boleh menggunakan callout yang sama dengan **tiga** cara berbeza:\n\n" +
		"## [!tip] Sebagai tajuk\n" +
		"Untuk menukar mana-mana tajuk kepada tajuk bergaya callout, tambah `[!type]` sejurus selepas `#`.\n\n" +
		"Mahukan callout dalam talian seperti ini [!warning]? Cuma tambah `[!type]` di tengah-tengah ayat, tanpa mengganggu aliran penulisan anda.\n\n" +
		"> [!note] Callout biasa\n" +
		"> Sudah tentu, callout klasik berfungsi dengan sintaks yang sama seperti yang anda sudah biasa: `> [!type]`.\n\n" +
		"Callout Studio ada lebih banyak lagi untuk ditawarkan! [Ketahui lebih lanjut]({{repoUrl}}).\n",

	"deleteModal.title": 'Padam callout "{{name}}"?',
	"deleteModal.bodyInUse":
		"Callout ini muncul {{count}} kali dalam {{files}} fail.",
	"deleteModal.bodyInUseExplain":
		"Pemadaman akan menukar blok tersebut kepada teks biasa — mereka akan kehilangan gaya dan pengepala callout.",
	"deleteModal.replaceHint":
		"Anda boleh menggantikannya dengan callout lain, yang mengekalkan kandungan vault sebagai callout bergaya.",
	"deleteModal.bodyUnused":
		'"{{name}}" tidak digunakan dalam mana-mana nota, tetapi merupakan callout tersuai yang anda cipta. Pemadaman akan membuangnya dari senarai ini.',
	"deleteModal.replaceInstead": "Ganti sebaliknya",
	"deleteModal.deleteInUse": "Padam (tukar kepada teks biasa)",
	"deleteModal.deleteUnused": "Padam callout",
	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "Jenis callout saya",
	"settings.builtInCallouts": "Callouts terbina dalam",
	"settings.contextMenu": "Menu konteks",
	"settings.autocomplete": "Lengkap automatik",
	"settings.keyboardShortcuts": "Pintasan papan kekunci",
	"settings.language": "Bahasa",
	"settings.languageDesc":
		"Bahasa paparan untuk Callout Studio. Secara lalai mengikut bahasa antara muka Obsidian.",
	"settings.languageAuto": "Automatik (sama seperti Obsidian)",
	"settings.importExport": "Import / eksport",
	"settings.import": "Import",
	"settings.export": "Eksport",
	"settings.importDesc":
		"Import data Callout Studio anda dari vault lain menggunakan fail JSON.",
	"settings.exportDesc":
		"Simpan semua jenis callout tersuai anda dalam format JSON.",
	"settings.importConflictNotice":
		"{{count}} jenis callout diimport; {{overwritten}} entri sedia ada ditimpa.",
	"settings.addNewCallout": "+ tambah callout",
	"settings.noCalloutsNow": "Tiada callout tersuai buat masa ini.",
	"settings.editAria": "Edit {{name}}",
	"settings.moreRowActionsAria": "Tindakan lain untuk {{name}}",
	"settings.usageInfo": "{{count}} penggunaan dalam {{files}} fail",
	"settings.replaceAction": "Ganti dalam vault",
	"settings.deleteAction": "Padam",
	"settings.resetAction": "Set semula ke lalai",
	"settings.makeFallbackAction": "Gunakan gaya sandaran lalai",
	"settings.colorSwatchAria": "Aksen: {{accent}} · Latar belakang: {{bg}}",
	"settings.fallbackCallout": "Callout sandaran lalai",
	"settings.fallbackCalloutDesc":
		"Jenis callout yang tidak dikenali dalam vault anda akan mewarisi gaya callout ini.",
	"settings.globalStyle": "Gaya callout global",
	"settings.border": "Sempadan",
	"settings.borderAll": "Semua",
	"settings.borderTop": "Atas",
	"settings.borderRight": "Kanan",
	"settings.borderBottom": "Bawah",
	"settings.borderLeft": "Kiri",
	"settings.borderWidth": "Ketebalan sempadan",
	"settings.fontScaleGroup": "Skala fon",
	"settings.titleScale": "Tajuk",
	"settings.contentScale": "Kandungan",
	"settings.inlineTextScale": "Teks",
	"settings.shapeGroup": "Bentuk",
	"settings.borderRadius": "Pembundaran sudut",
	"settings.alignGroup": "Penjajaran",
	"settings.alignContent": "Selaraskan kandungan dengan tajuk",
	"settings.headingSpacingGroup": "Jarak tajuk",
	"settings.headingPadVertical": "Jarak menegak",
	"settings.headingGap": "Jarak antara tajuk",
	"settings.headingFoldGroup": "Lipat",
	"settings.headingFoldArrow": "Papar anak panah lipat",
	"settings.styleDemoName": "Contoh",
	"settings.previewTitle": "Pratonton",
	// Settings — Saved color palettes
	"settings.customPalettes": "Palet warna tersimpan",
	"settings.newPalette": "Palet baharu",
	"settings.customPalettesEmpty": "Tiada palet tersimpan buat masa ini.",
	"settings.editPaletteAria": "Edit palet {{name}}",
	"settings.deletePaletteAria": "Padam palet {{name}}",
	"settings.deletePaletteConfirm":
		'Padam palet "{{name}}"?\nCallout yang menggunakan warna ini tidak terjejas.',
	"settings.enableAutocomplete": "Aktifkan lengkap automatik [!",
	"settings.enableAutocompleteDesc":
		'Menunjukkan cadangan apabila anda menaip "[!" dalam sebutan blok dalam editor. Pilih jenis callout dari senarai untuk memasukkan pengepala callout lengkap.',
	"settings.openHotkeys": "Pintasan Callout Studio",
	"settings.openHotkeysDesc":
		"Membuka tetapan pintasan Obsidian untuk arahan Callout Studio. Tiada pintasan ditetapkan secara lalai.",
	"settings.openHotkeysButton": "Buka tetapan pintasan",
	"settings.vaultMaintenance": "Wawasan & penyelenggaraan vault",
	"settings.vaultStats": "Statistik callout",
	"settings.vaultStatsDesc":
		"Mengira semua blok callout dalam nota Markdown anda dan mengumpulkannya mengikut jenis.",
	"settings.vaultStatsButton": "Lihat statistik",
	"settings.vaultStatsScanning": "Mengimbas",
	"settings.resetAll": "Set semula",
	"settings.resetAllDesc":
		"Memadam semua callouts pengguna, menetapkan semula callouts terbina dalam, gaya global, palet warna yang disimpan, penyesuaian menu klik kanan, dan SVG Material yang dimuat turun.",
	"settings.resetAllButton": "Set semula semua",
	"settings.resetAllConfirm":
		"Ini akan memadam semua callouts tersuai, menetapkan semula callouts terbina dalam, gaya global, palet warna yang disimpan, penyesuaian menu klik kanan dan semua SVG Material yang dicache. Tindakan ini tidak boleh dibatalkan. Adakah anda pasti?",
	"notice.resetAllDone": "Semua telah ditetapkan semula ke lalai.",
	"notice.exported": "Callouts dieksport ke callout-studio-export.json",
	"notice.importedJSON": "{{count}} jenis callout diimport dari JSON.",
	"notice.importedSettings": "Tetapan plugin diimport.",
	"notice.importedCalloutManager":
		"Diimport dari Callout Manager: {{created}} dicipta, {{updated}} dikemas kini.",
	"notice.importedAdmonition":
		"Diimport daripada Admonition: {{created}} dicipta, {{updated}} " +
		"dikemas kini.",
	"notice.noNewJSON":
		"Tiada jenis callout baharu diimport (ID mungkin sudah wujud).",
	"notice.iconDownloadFailed":
		'Gagal memuat turun ikon Material "{{name}}". Ikon ini mungkin tidak tersedia untuk gaya/ketebalan ini, atau sambungan anda tidak tersambung.',
	"notice.nothingToWrap": "Tiada apa untuk dibalut.",
	"notice.cursorNotInsideCallout": "Kursor tidak berada dalam callout.",
	"notice.openHotkeysFailed":
		"Tidak dapat membuka tetapan pintasan Obsidian.",
	"notice.filterHotkeysFailed":
		"Pintasan Obsidian dibuka, tetapi penapis Callout Studio tidak dapat digunakan.",
	"editor.editCallout": "Edit callout",
	"editor.newCallout": "Callout baharu",
	"editor.displayName": "Nama paparan",
	"editor.displayNameDesc":
		"Label yang boleh dibaca yang dipaparkan dalam UI",
	"editor.displayNameBuiltIn":
		"Nama paparan tidak boleh diubah untuk callouts terbina dalam",
	"editor.displayNamePlaceholder": "Callout saya",
	"editor.calloutIds": "ID callout",
	"editor.calloutIdsDesc":
		"Semua pengecam untuk callout ini. Ruang dibenarkan.\nTekan Enter atau butang + untuk menambah.",
	"editor.calloutIdsPlaceholder": "Tambah ID",
	"editor.addId": "Tambah ID",
	"editor.idLinkedToName": "Dipautkan ke nama paparan",
	"editor.idCannotDelete":
		"ID ini dipautkan ke nama paparan dan tidak boleh dipadam — edit nama untuk menukarnya",
	"editor.icon": "Ikon",
	"editor.pickIcon": "Tukar ikon",
	"editor.resetIcon": "Tetapkan semula ikon ke lalai",
	"editor.livePreview": "Pratonton langsung",
	"editor.iconAdjustment": "Pelarasan ikon",
	"editor.picture": "Gambar",
	"editor.size": "Saiz",
	"editor.horizontalOffset": "Ofset mendatar",
	"editor.verticalOffset": "Ofset menegak",
	"editor.colors": "Warna",
	"editor.colorsDesc":
		"Sets this callout's border, background, and text colors.",
	"editor.resetColors": "Tetapkan semula warna ke lalai",
	"editor.paletteDeleted": "Warna dipadam",
	"editor.paletteGroupObsidian": "Callouts Obsidian",
	"editor.paletteGroupPresets": "Pratetap warna",
	"editor.paletteGroupCustom": "Tersuai",
	"editor.paletteNewColor": "Warna baharu…",
	"editor.contrastWarning":
		"Kontras rendah dengan latar belakang — mungkin sukar dibaca",
	"editor.foldable": "Boleh dilipat",
	"editor.foldableDesc":
		"Pilih sama ada callout boleh dilipat dan keadaan lalai yang digunakan di seluruh vault.",
	"editor.foldOff": "Mati",
	"editor.foldOpen": "Terbuka secara lalai",
	"editor.foldClosed": "Tertutup secara lalai",
	"editor.cancel": "Batal",
	"editor.saveChanges": "Simpan perubahan",
	"editor.createCallout": "Cipta callout",
	"editor.nameRequired": "Nama paparan diperlukan sebelum mencipta callout.",
	"editor.noChangesToSave": "Tiada perubahan dibuat.",
	"editor.downloadingIcon": "Memuat turun ikon",
	"editor.idEmpty": "Sekurang-kurangnya satu ID diperlukan",
	"editor.idExists": "Callout dengan ID ini sudah wujud",
	"editor.idConflict": "ID ini bercanggah dengan callout sedia ada",
	"editor.idDashConflict":
		'Obsidian menulis ruang sebagai sengkang, jadi ID ini bercanggah dengan "{{other}}"',
	"editor.untitledCallout": "Callout Tanpa Tajuk",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText":
		"Berikut ialah pil [!{id}] sebaris di dalam perenggan.",
	"editor.previewReadOnly": "Pratonton langsung tidak boleh diedit",
	// Palette editor modal
	"palette.newTitle": "Palet warna baharu",
	"palette.editTitle": "Edit palet warna",
	"palette.name": "Nama",
	"palette.namePlaceholder": "Palet saya",
	"palette.nameExists": "Palet dengan nama ini sudah wujud",
	"palette.baseColor": "Warna asas",
	"palette.baseColorHint":
		"Kami akan padankan warna latar belakang dengannya secara automatik. Jika mahu, anda boleh mengawalnya secara berasingan dengan {{link}}.",
	"palette.baseColorHintLink": "klik di sini",
	"palette.advancedColors": "Warna",
	"palette.advancedColorsHint":
		"Mengedit warna untuk mod {{mode}} - mod lain dikemas kini secara automatik. Tukar tema Obsidian untuk menyemaknya.",
	"palette.revertHint": "Lebih suka satu warna asas sahaja? {{link}}.",
	"palette.revertHintLink": "Kembalikan",
	"palette.lightMode": "Terang",
	"palette.darkMode": "Gelap",
	"palette.accentColor": "Warna aksen",
	"palette.backgroundColorChannel": "Warna latar belakang",
	"palette.textColorChannel": "Warna teks",
	"palette.bgIntensity": "Keamatan",
	"palette.bgStyle": "Gaya",
	"palette.bgSolid": "Warna pejal",
	"palette.bgGradient": "Gradien",
	"palette.gradientTo": "Warna kedua",
	"palette.gradientDirection": "Arah",
	"palette.gradientText": "Teks tajuk bergradien",
	"palette.save": "Simpan",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "Merah",
	"colorName.orange": "Oren",
	"colorName.amber": "Ambar",
	"colorName.yellow": "Kuning",
	"colorName.lime": "Hijau lime",
	"colorName.green": "Hijau",
	"colorName.teal": "Firus",
	"colorName.cyan": "Sian",
	"colorName.sky": "Biru langit",
	"colorName.blue": "Biru",
	"colorName.indigo": "Nila",
	"colorName.violet": "Lembayung",
	"colorName.purple": "Ungu",
	"colorName.pink": "Merah jambu",
	"colorName.rose": "Merah mawar",
	"colorName.brown": "Coklat",
	"colorName.gray": "Kelabu",
	"colorName.black": "Hitam",
	"colorName.white": "Putih",
	"colorName.crimson": "Merah tua",
	"colorName.coral": "Karang",
	"colorName.grape": "Anggur",
	"colorName.plum": "Plum",
	"colorName.bubblegum": "Gula-gula getah",

	"iconPicker.pickIcon": "Pilih ikon",
	"iconPicker.confirm": "Sahkan",
	"iconPicker.cancel": "Batal",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "cari ikon Lucide",
	"iconPicker.searchTabler": "cari ikon Tabler",
	"iconPicker.tablerStyle": "Gaya ikon",
	"iconPicker.tablerStyleOutline": "Garis tepi (Outline)",
	"iconPicker.tablerStyleFilled": "Penuh (Filled)",
	"iconPicker.loadMore": "Muatkan lebih banyak",
	"iconPicker.materialStyle": "Gaya ikon",
	"iconPicker.materialStyleOutlined": "Garis luar (Outlined)",
	"iconPicker.materialStyleFilled": "Terisi (Filled)",
	"iconPicker.materialStyleRounded": "Membulat (Rounded)",
	"iconPicker.materialStyleSharp": "Tajam (Sharp)",
	"iconPicker.materialWeight": "Ketebalan ikon",
	"iconPicker.materialWeight100": "Nipis (Thin)",
	"iconPicker.materialWeight200": "Sangat ringan (Extra Light)",
	"iconPicker.materialWeight300": "Ringan (Light)",
	"iconPicker.materialWeight400": "Normal (Regular)",
	"iconPicker.materialWeight500": "Sederhana (Medium)",
	"iconPicker.materialWeight600": "Semi tebal (Semi Bold)",
	"iconPicker.materialWeight700": "Tebal (Bold)",
	"iconPicker.searchMaterial": "cari ikon Material",
	"iconPicker.searchEmoji": "Cari emoji",
	"iconPicker.skinTone": "Warna kulit",
	"iconPicker.allCategories": "Semua kategori",
	"iconPicker.noIconSelected": "Tiada ikon dipilih",
	"iconPicker.noResults": "Tiada ikon yang sepadan dengan carian anda.",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Cari Octicons",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Cari Font Awesome",
	"iconPicker.faStyle": "Gaya ikon",
	"iconPicker.faStyleSolid": "Padu (Solid)",
	"iconPicker.faStyleRegular": "Biasa (Regular)",
	"iconPicker.faStyleBrands": "Jenama (Brands)",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "Cari RPG Awesome",
	"iconPicker.image": "Gambar anda",
	"iconPicker.searchImage": "Cari gambar anda",
	"iconPicker.imageTooLarge":
		"{{name}} terlalu besar. Gambar mesti kurang daripada 5 MB.",
	"iconPicker.imageUnsupported":
		"{{name}} bukan format gambar yang disokong. Gunakan SVG, PNG, JPEG atau WebP.",
	"iconPicker.imageInvalidSvg":
		"{{name}} tidak dapat dibaca sebagai SVG selamat dan tidak ditambahkan.",
	"iconPicker.imageDecodeFailed":
		"{{name}} tidak dapat dibaca sebagai gambar.",
	"iconPicker.imageDuplicate":
		"{{name}} sudah ada dalam gambar anda. Namakan semula fail atau padamkan gambar sedia ada.",
	"iconPicker.imageAdd": "Tambah gambar",
	"iconPicker.imageEmpty":
		"Belum ada gambar. Tambah fail SVG, PNG, JPEG atau WebP dari komputer anda atau seret ke sini.",
	"iconPicker.imageDelete": "Padam",
	"iconPicker.imageDeleteConfirm": "Padam “{{name}}”?",
	"iconPicker.imageDeleteInUse":
		"{{count}} callout menggunakan gambar ini. Mereka akan menunjukkan ikon pemegang tempat sehingga anda memberikan yang baru.",
	"iconPicker.imageRecolor": "Ikut warna Callout",
	"iconPicker.allSources": "Semua sumber",
	"iconPicker.searchAllSources": "Cari semua sumber ikon",
	"iconPicker.sourcesNotDownloaded":
		"Belum disertakan: {{names}}. Pilih sumber di atas untuk memuat turunnya.",
	"iconPicker.chooseSource": "Pilih sumber",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources": "cari semua pustaka serentak",
	"iconPicker.descLucide": "set milik Obsidian, sentiasa luar talian",
	"iconPicker.descTabler":
		"ikon UI yang bersih dan konsisten, garis tepi dan penuh",
	"iconPicker.descMaterial": "set Google, empat gaya dan tujuh ketebalan",
	"iconPicker.descEmoji": "glyph berwarna, setiap ton kulit",
	"iconPicker.descOcticons": "ikon antara muka GitHub",
	"iconPicker.descFa": "padu, biasa dan jenama",
	"iconPicker.descRpgAwesome": "ikon fantasi dan permainan meja",
	"iconPicker.descImage": "gambar yang anda tambah dari komputer",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "Kebolehcapaian",
	"iconPicker.cat.Actions": "Tindakan",
	"iconPicker.cat.Activities": "Aktiviti",
	"iconPicker.cat.Alert": "Amaran",
	"iconPicker.cat.Alphabet": "Abjad",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "Haiwan",
	"iconPicker.cat.Arrows": "Anak panah",
	"iconPicker.cat.Astronomy": "Astronomi",
	"iconPicker.cat.Audio&Video": "Audio & Video",
	"iconPicker.cat.Automotive": "Automotif",
	"iconPicker.cat.Badges": "Lencana",
	"iconPicker.cat.Brand": "Jenama",
	"iconPicker.cat.Buildings": "Bangunan",
	"iconPicker.cat.Business": "Perniagaan",
	"iconPicker.cat.Camping": "Berkhemah",
	"iconPicker.cat.Charity": "Amal",
	"iconPicker.cat.Charts": "Carta",
	"iconPicker.cat.Charts + Diagrams": "Carta & Diagram",
	"iconPicker.cat.Childhood": "Zaman Kanak-kanak",
	"iconPicker.cat.Clothing + Fashion": "Pakaian & Fesyen",
	"iconPicker.cat.Coding": "Pengaturcaraan",
	"iconPicker.cat.Communicate": "Berkomunikasi",
	"iconPicker.cat.Communication": "Komunikasi",
	"iconPicker.cat.Computers": "Komputer",
	"iconPicker.cat.Connectivity": "Kesambungan",
	"iconPicker.cat.Construction": "Pembinaan",
	"iconPicker.cat.Currencies": "Mata Wang",
	"iconPicker.cat.Database": "Pangkalan Data",
	"iconPicker.cat.Design": "Reka Bentuk",
	"iconPicker.cat.Development": "Pembangunan",
	"iconPicker.cat.Devices": "Peranti",
	"iconPicker.cat.Devices + Hardware": "Peranti & Perkakasan",
	"iconPicker.cat.Disaster + Crisis": "Bencana & Krisis",
	"iconPicker.cat.Document": "Dokumen",
	"iconPicker.cat.E-commerce": "E-dagang",
	"iconPicker.cat.Editing": "Penyuntingan",
	"iconPicker.cat.Education": "Pendidikan",
	"iconPicker.cat.Electrical": "Elektrik",
	"iconPicker.cat.Emoji": "Emoji",
	"iconPicker.cat.Energy": "Tenaga",
	"iconPicker.cat.Extensions": "Sambungan",
	"iconPicker.cat.Files": "Fail",
	"iconPicker.cat.Film + Video": "Filem & Video",
	"iconPicker.cat.Food": "Makanan",
	"iconPicker.cat.Food + Beverage": "Makanan & Minuman",
	"iconPicker.cat.Fruits + Vegetables": "Buah & Sayuran",
	"iconPicker.cat.Games": "Permainan",
	"iconPicker.cat.Gaming": "Permainan Video",
	"iconPicker.cat.Gender": "Jantina",
	"iconPicker.cat.Genders": "Jantina",
	"iconPicker.cat.Gestures": "Gerak Isyarat",
	"iconPicker.cat.Halloween": "Halloween",
	"iconPicker.cat.Hands": "Tangan",
	"iconPicker.cat.Hardware": "Perkakasan",
	"iconPicker.cat.Health": "Kesihatan",
	"iconPicker.cat.Holidays": "Cuti Umum",
	"iconPicker.cat.Home": "Rumah",
	"iconPicker.cat.Household": "Isi Rumah",
	"iconPicker.cat.Humanitarian": "Kemanusiaan",
	"iconPicker.cat.Images": "Imej",
	"iconPicker.cat.Laundry": "Dobi",
	"iconPicker.cat.Letters": "Huruf",
	"iconPicker.cat.Logic": "Logik",
	"iconPicker.cat.Logistics": "Logistik",
	"iconPicker.cat.Map": "Peta",
	"iconPicker.cat.Maps": "Peta",
	"iconPicker.cat.Maritime": "Maritim",
	"iconPicker.cat.Marketing": "Pemasaran",
	"iconPicker.cat.Math": "Matematik",
	"iconPicker.cat.Mathematics": "Matematik",
	"iconPicker.cat.Media": "Media",
	"iconPicker.cat.Media Playback": "Main Balik Media",
	"iconPicker.cat.Medical + Health": "Perubatan & Kesihatan",
	"iconPicker.cat.Money": "Wang",
	"iconPicker.cat.Mood": "Suasana Hati",
	"iconPicker.cat.Moving": "Berpindah",
	"iconPicker.cat.Music + Audio": "Muzik & Audio",
	"iconPicker.cat.Nature": "Alam Semula Jadi",
	"iconPicker.cat.Numbers": "Nombor",
	"iconPicker.cat.Photography": "Fotografi",
	"iconPicker.cat.Photos + Images": "Foto & Imej",
	"iconPicker.cat.Political": "Politik",
	"iconPicker.cat.Privacy": "Privasi",
	"iconPicker.cat.Punctuation + Symbols": "Tanda Baca & Simbol",
	"iconPicker.cat.Religion": "Agama",
	"iconPicker.cat.Science": "Sains",
	"iconPicker.cat.Science Fiction": "Fiksyen Sains",
	"iconPicker.cat.Security": "Keselamatan",
	"iconPicker.cat.Shapes": "Bentuk",
	"iconPicker.cat.Shopping": "Membeli-belah",
	"iconPicker.cat.Social": "Media Sosial",
	"iconPicker.cat.Spinners": "Pemintal",
	"iconPicker.cat.Sport": "Sukan",
	"iconPicker.cat.Sports + Fitness": "Sukan & Kecergasan",
	"iconPicker.cat.Symbols": "Simbol",
	"iconPicker.cat.System": "Sistem",
	"iconPicker.cat.Text": "Teks",
	"iconPicker.cat.Text Formatting": "Pemformatan Teks",
	"iconPicker.cat.Time": "Masa",
	"iconPicker.cat.Toggle": "Togol",
	"iconPicker.cat.Transit": "Transit",
	"iconPicker.cat.Transportation": "Pengangkutan",
	"iconPicker.cat.Travel": "Perjalanan",
	"iconPicker.cat.Travel + Hotel": "Perjalanan & Hotel",
	"iconPicker.cat.UI actions": "Tindakan UI",
	"iconPicker.cat.Users + People": "Pengguna & Orang",
	"iconPicker.cat.Vehicles": "Kenderaan",
	"iconPicker.cat.Version control": "Kawalan Versi",
	"iconPicker.cat.Weather": "Cuaca",
	"iconPicker.cat.Writing": "Penulisan",
	"iconPicker.cat.Zodiac": "Zodiak",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}} belum dimuat turun",
	"iconPack.downloadDetail": "{{count}} ikon · {{size}} · muat turun sekali",
	"iconPack.download": "Muat turun",
	"iconPack.downloading": "Memuat turun {{name}}…",
	"iconPack.downloadFailed":
		"Tidak dapat memuat turun {{name}}. Semak sambungan anda dan cuba lagi.",
	"iconPack.retry": "Cuba lagi",
	"iconPack.faBrandsNotice":
		"Ikon jenama adalah tanda dagangan pemilik masing-masing. Penyertaannya tidak menunjukkan sokongan. Sila gunakannya hanya untuk mewakili syarikat, produk atau perkhidmatan yang dirujuk.",
	"iconPack.artworkRestored": "Seni ikon untuk {{names}} telah dimuat turun.",
	"iconPack.diskWriteFailed":
		"Callout Studio tidak dapat menyimpan pakej ikon ke cakera, jadi ia perlu dimuat turun semula lain kali. Ikon yang anda pilih masih disimpan dengan tetapan anda.",

	// Icon licences & credits
	"credits.title": "Lesen ikon dan kredit",
	"credits.intro":
		"Callout Studio menggunakan beberapa pustaka ikon terbuka. Lesen mereka dihasilkan semula di bawah, bersama dengan apa yang diubah untuk menggunakannya di sini.",
	"credits.fullNotices": "Notis pihak ketiga penuh",
	"credits.pluginLicense":
		"Kod Callout Studio sendiri adalah di bawah lesen 0BSD; pustaka ikon mengekalkan lesen mereka sendiri.",
	"contextMenu.editCallout": "Edit tetapan callout",
	"contextMenu.copyMarkdown": "Salin Markdown callout",
	"contextMenu.openSettings": "Buka tetapan Callout Studio",
	"contextMenu.setFoldClosed": "Tetapkan callout sebagai tertutup (-)",
	"contextMenu.setFoldOpen": "Tetapkan callout sebagai terbuka (+)",
	"contextMenu.setFoldNone": "Jadikan callout tidak boleh dilipat",
	"contextMenu.cutSection": "Potong bahagian tajuk",
	"contextMenu.copySection": "Salin bahagian tajuk",
	"contextMenu.deleteSection": "Padam bahagian tajuk",
	"heading.toggleFold": "Togol lipatan",
	"settings.globalSettings": "Tetapan global",
	"settings.globalSettingsRegularDesc":
		"Tambah token callout pada sebutan blok (cth. `> [!type]`) untuk memaparkan kotak callout asli Obsidian. Anda boleh melaraskan sempadan, jejari, skala fon dan penjajarannya.",
	"settings.globalSettingsHeadingDesc":
		"Tambah token callout terus selepas tanda pagar tajuk (cth. `## [!type]`) untuk memaparkannya sebagai callout tajuk bergaya. Anda boleh melaraskan sempadan, bentuk dan jarak menegaknya.",
	"settings.globalSettingsInlineDesc":
		"Tambah token callout di mana-mana dalam baris teks (cth. `[!type]`) untuk memaparkannya sebagai pil sebaris kecil. Anda boleh melaraskan sempadan dan bentuknya.",
	"settings.globalSettingsCustomize": "Sesuaikan",
	"settings.calloutTypeRegular": "Callout biasa",
	"settings.calloutTypeHeading": "Callout tajuk",
	"settings.calloutTypeInline": "Callout sebaris",
	"settings.customizeMenu": "Sesuaikan item menu",
	"settings.customizeMenuDesc":
		"Pilih tindakan klik kanan yang dipaparkan untuk setiap jenis callout dan susun semula. Berfungsi dalam mod sumber dan Pratonton Langsung.",
	"settings.customizeMenuButton": "Sesuaikan item menu",
	"menuCustomize.title": "Sesuaikan menu klik kanan",
	"menuCustomize.desc":
		"Hidupkan atau matikan tindakan dan seret pemegang untuk menyusun semula. Perubahan disimpan secara automatik.",
	"menuCustomize.regular": "Callout biasa",
	"menuCustomize.heading": "Callout tajuk",
	"menuCustomize.inline": "Callout sebaris",
	"menuCustomize.dragHandle": "Seret untuk menyusun semula",
	"menuItem.edit": "Edit callout",
	"menuItem.openSettings": "Buka tetapan",
	"menuItem.copyMarkdown": "Salin Markdown",
	"menuItem.foldDefaults": "Lipatan lalai (terbuka / tertutup / tiada)",
	"menuItem.cutSection": "Potong bahagian",
	"menuItem.copySection": "Salin bahagian",
	"menuItem.deleteSection": "Padam bahagian",
	"confirm.ok": "Padam",
	"confirm.cancel": "Batal",
	"vault.filesUpdated":
		"{{count}} rujukan callout dikemas kini dalam fail vault.",
	"vault.idsUpdated":
		"{{count}} ID callout dikemas kini dalam fail vault: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"{{count}} tajuk callout dikemas kini dalam fail vault: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "Ganti dengan:",
	"vault.deleteWithout": "Padam tanpa mengganti",
	"vault.confirmDelete": "Sahkan",
	"vault.confirmReplace": "Ganti",
	"vault.replacePromptInUse":
		'"{{name}}" digunakan {{count}} kali dalam {{files}} fail. Pilih callout untuk menggantikannya:',
	"vault.replacePromptUnused": 'Pilih callout untuk menggantikan "{{name}}":',
	"vault.noReplacementAvailable":
		"Tiada callout lain tersedia untuk menggantikan ini.",
	"vault.convertedToPlainText":
		"{{blocks}} blok callout dalam {{files}} fail ditukar kepada teks biasa.",
	"vault.resetAliasWarning":
		"{{count}} rujukan dalam {{files}} fail menggunakan alias tersuai: {{aliases}}. Ini akan berhenti berfungsi selepas set semula. Teruskan?",
	"vault.resetConfirm": "Set semula",
	"vault.resetAllInUse":
		"⚠ {{count}} rujukan callout dalam {{files}} fail menggunakan jenis callout tersuai yang akan dipadam.",
	"vaultStats.title": "Statistik callout",
	"vaultStats.totalCallouts": "Jumlah callouts",
	"vaultStats.typesFound": "Jenis ditemui",
	"vaultStats.filesWithCallouts": "Fail dengan callouts",
	"vaultStats.filesScanned": "Fail Markdown diimbas",
	"vaultStats.empty": "Tiada callouts ditemui dalam nota Markdown.",
	"vaultStats.columnType": "Jenis",
	"vaultStats.columnName": "Nama",
	"vaultStats.columnSource": "Sumber",
	"vaultStats.columnCount": "Bilangan",
	"vaultStats.columnFiles": "Fail",
	"vaultStats.unknown": "Tidak diketahui",
	"vaultStats.sourceBuiltIn": "Terbina dalam",
	"vaultStats.sourceCustom": "Tersuai",
	"vaultStats.sourceAutoFallback": "Sandaran automatik",
	"vaultStats.sourceTheme": "Coretan CSS",
	"vaultStats.sourceAlias": "Alias bagi {{id}}",
	"vaultStats.sourceUnknown": "Tidak diketahui",
	"vaultStats.close": "Tutup",
	"import.title": "Masalah import",
	"import.reportLeadIn":
		"Nampaknya fail yang anda import telah diubah suai. Berikut adalah senarai masalah:",
	"import.reportLeadInFatal":
		"Fail ini tidak kelihatan seperti eksport Callout Studio. Tidak dapat diimport:",
	"import.entryHeading": "Entri {{index}} — {{label}}",
	"import.summary":
		"{{valid}} daripada {{total}} entri adalah sah · {{issues}} masalah dijumpai.",
	"import.btnCancel": "Batal",
	"import.btnImportValid": "Import yang sah sahaja ({{count}})",
	"import.err.notRecognized":
		"Fail tidak dikenali: dijangka array definisi callout atau eksport Callout Studio.",
	"import.warn.settingsIgnored":
		"Blok tetapan bukan objek yang sah dan telah diabaikan.",
	"import.warn.invalidGradient":
		"Kecerunan latar belakang tidak sah dan telah diabaikan.",
	"import.err.parseFailed": "Fail bukan JSON sah dan tidak dapat dihurai.",
	"import.err.entryNotObject": "Entri mestilah objek.",
	"import.err.requiredMissing":
		'Medan yang diperlukan "{{field}}" hilang atau mempunyai jenis yang salah.',
	"import.err.idEmpty": "ID tidak boleh kosong.",
	"import.err.idTooLong":
		'ID "{{value}}" mempunyai {{length}} aksara; maksimum ialah {{max}}.',
	"import.err.idBadChar":
		'ID "{{value}}" mengandungi aksara tidak sah ("|", "[", "]", tab dan pemisah baris tidak dibenarkan).',
	"import.err.displayNameEmpty": "Nama paparan tidak boleh kosong.",
	"import.err.displayNameTooLong":
		"Nama paparan mempunyai {{length}} aksara; maksimum ialah {{max}}.",
	"import.err.boolField": '"{{field}}" mestilah boolean (true atau false).',
	"import.err.iconNotObject": "Ikon mestilah objek.",
	"import.err.iconTypeInvalid":
		'Jenis ikon "{{value}}" bukan salah satu daripada: {{types}}.',
	"import.warn.iconFieldIgnored":
		'"{{field}}" hanya terpakai untuk ikon Material dan diabaikan untuk jenis ikon {{type}}.',
	"import.err.iconValueEmpty": "Nilai ikon mestilah rentetan tidak kosong.",
	"import.err.iconValueTooLong":
		"Nilai ikon sangat panjang ({{length}} aksara).",
	"import.err.materialStyle":
		'Gaya ikon Material "{{value}}" bukan salah satu daripada: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'Ketebalan ikon Material "{{value}}" mestilah integer antara 100 dan 700, dalam langkah 100.',
	"import.warn.iconRecolorIgnored":
		'"recolor" hanya terpakai untuk gambar anda sendiri dan diabaikan untuk jenis ikon {{type}}.',
	"import.err.iconRecolorInvalid":
		'"recolor" mestilah true atau false (diterima "{{value}}").',
	"import.err.colorInvalid":
		'"{{field}}" mestilah warna hex seperti "#448aff" (diterima "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" mestilah nombor antara {{min}} dan {{max}} (diterima "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" mestilah nombor antara {{min}} dan {{max}} (diterima "{{value}}").',
	"import.err.iconAdjustShape":
		'"iconAdjust" must be an object mapping a callout type ("regular", "heading", "inline") to its icon size and offsets.',
	"import.err.aliasesNotArray": '"aliases" mestilah array rentetan.',
	"import.err.aliasNotString": "Alias mestilah rentetan.",
	"import.err.aliasDup": 'Alias "{{value}}" diduplikasi dalam entri ini.',
	"import.err.tooManyIds":
		"Terlalu banyak ID ({{count}}); setiap callout boleh mempunyai maksimum {{max}} ID (utama + alias).",
	"import.err.metadataShape":
		'"metadata" mestilah objek yang semua nilainya adalah rentetan.',
	"import.warn.unknownFields": "Medan tidak diketahui diabaikan: {{fields}}.",
	"import.err.duplicateInFile":
		'ID/alias "{{value}}" sudah digunakan oleh entri #{{first}} dalam fail ini.',
	"import.err.aliasConflict":
		'Alias "{{value}}" sudah digunakan oleh callout lain ("{{other}}") dalam vault anda.',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" adalah true manakala "foldable" adalah false; defaultFolded telah ditetapkan semula kepada false.',
	"import.warn.imageMissing":
		"Callout ini menggunakan gambar yang tidak ada dalam fail dan tidak dalam vault ini, jadi ia akan menunjukkan ikon pemegang tempat sehingga anda memberikan yang baru.",
	"import.err.paletteIdInvalid":
		'"paletteId" mestilah ID teks yang tidak kosong (menerima "{{value}}").',
	"import.warn.iconNameUnknown":
		'Tiada ikon "{{value}}" dalam {{type}}, jadi ikon lalai digunakan sebagai gantinya.',
	"import.warn.cmIconUnknownNew":
		'Tiada ikon "{{value}}" dalam Obsidian, jadi ikon lalai digunakan sebagai gantinya.',
	"import.warn.cmIconUnknownExisting":
		'Tiada ikon "{{value}}" dalam Obsidian, jadi "{{id}}" mengekalkan ikon yang sudah ada.',
	"import.chooseSource": "Import dari",
	"import.sourceStudio": "Callout Studio",
	"import.sourceStudioDesc":
		"Muatkan fail .json yang dieksport dari Callout Studio.",
	"import.sourceCalloutManager": "Callout Manager",
	"import.sourceCalloutManagerDesc":
		"Tampal gaya yang anda salin daripada butang Copy Callout Manager.",
	"import.sourceAdmonition": "Admonition",
	"import.sourceAdmonitionDesc":
		"Bawa admonition tersuai anda dari pemalam Admonition.",
	"import.cmTitle": "Import dari Callout Manager",
	"import.cmInstructions":
		"Dalam Callout Manager, gunakan butang Copy untuk menyalin gaya callout tersuai anda, kemudian tampalnya di bawah.",
	"import.cmPlaceholder": "Tampal gaya yang disalin di sini…",
	"import.cmBtnCancel": "Batal",
	"import.cmBtnImport": "Import",
	"import.err.cmNoBlocksFound":
		"Tiada gaya Callout Manager ditemukan dalam teks yang ditampal.",
	"import.err.cmNoColorForNew":
		'Tiada warna yang boleh digunakan ditemukan untuk callout baru "{{value}}"; ia dilangkau.',
	"import.err.cmIdConflict":
		'ID "{{value}}" sudah digunakan sebagai alias oleh callout lain ("{{other}}") dan dilangkau.',

	// Import — Admonition
	"import.admTitle": "Import daripada Admonition",
	"import.admInstructions":
		"Setiap admonition datang sebagai callout dengan nama, ikon dan " +
		"warnanya. Tetapan yang tiada padanan dalam Callout Studio " +
		"(perintah, butang salin, tajuk tersembunyi) tidak dibawa.",
	"import.admFromVault": "Bilik kebal ini",
	"import.admVaultChecking": "Mencari pemalam Admonition…",
	"import.admVaultFound": "{{count}} admonition tersuai ditemui.",
	"import.admVaultNotFound":
		"Tiada admonition tersuai ditemui dalam bilik kebal ini.",
	"import.admFromFile": "Satu fail",
	"import.admFromFileDesc": "Fail admonitions.json, atau pek yang dikongsi.",
	"import.admChooseFile": "Pilih fail…",
	"import.admPasteLabel": "Atau tampal JSON di sini:",
	"import.admPlaceholder": "Tampal admonition anda di sini…",
	"import.admBtnCancel": "Batal",
	"import.admBtnImport": "Import",
	"import.err.admNotRecognized":
		"Fail tidak dikenali: senarai admonition atau data.json " +
		"Admonition dijangka.",
	"import.err.admNoEntries": "Tiada admonition ditemui untuk diimport.",
	"import.err.admTypeMissing":
		'Admonition ini tiada "type" dan telah dilangkau.',
	"import.warn.admIconUnknown":
		'Tiada ikon bernama "{{value}}" dalam mana-mana pustaka ikon, ' +
		"jadi ikon lalai digunakan.",
	"import.warn.admIconUnknownExisting":
		'Tiada ikon bernama "{{value}}" dalam mana-mana pustaka ikon, ' +
		'jadi "{{id}}" mengekalkan ikon sedia ada.',
	"import.warn.admImageFailed":
		"Gambar yang dimuat naik tidak dapat dibaca, jadi ikon lalai " +
		"digunakan.",
	"import.warn.admIconWithCss":
		"Admonition ini digayakan oleh petikan CSS dalam Admonition. Gaya " +
		"itu bukan sebahagian daripada import, jadi hanya nama, ikon dan " +
		"warnanya yang dibawa.",
	"import.warn.admNoColor":
		"Tiada warna ditetapkan, jadi biru lalai digunakan.",
	"import.warn.admTitleTruncated":
		"Tajuk ialah {{length}} aksara; ia dipendekkan kepada {{max}}.",

	"footer.tagline":
		"Ada maklum balas, komen atau cadangan? Saya ingin mendengarnya!",
	"footer.madeBy": "Dicipta oleh Niv  •  ",
};
