export const ja: Record<string, string> = {
	"cmd.openSettings": "設定を開く",
	"cmd.createCallout": "新しいcalloutタイプを作成",
	"cmd.insertEmptyCallout": "空のcalloutを挿入",
	"cmd.calloutWrap": "calloutで囲む",
	"cmd.calloutUnwrap": "calloutを解除",

	"autocomplete.createNew": '新しいcalloutを作成: "{{name}}"',

	"settings.fallbackTag": "デフォルト",
	"settings.fallbackTagAuto": "自動デフォルト",
	"settings.rescanVault": "vaultを再スキャン",
	"settings.rescanVaultDesc":
		"ノート内の未認識のcallout IDを検索し、フォールバック行として追加します。",
	"settings.rescanVaultHintAction": "今すぐスキャン",
	"settings.rescanComplete":
		"再スキャン完了: {{count}}件の新しいcalloutを追加しました。",
	"replaceModal.deleteWithoutReplaceSuffix": "（デフォルトにフォールバック）",

	"firstRun.title": "vault内の既存のcalloutを検索しますか？",
	"firstRun.body":
		"Callout Studioはvaultをスキャンして、すでに使用しているcalloutを検出できます。設定リストに表示され、フォールバックスタイルを適用します。",
	"firstRun.heavyVaultNote":
		"vaultに{{count}}個のMarkdownファイルがあります。スキャンに数秒かかる場合があります。",
	"firstRun.laterHint":
		"後から設定 → vaultの洞察とメンテナンス → vaultを再スキャン から実行できます。",
	"firstRun.scanNow": "今すぐスキャン",
	"firstRun.noThanks": "いいえ、結構です",
	"firstRun.autoScanComplete":
		"Callout Studioがvaultをスキャンし、{{count}}件のcalloutを追加しました。",
	"firstRun.scanning": "スキャン中",

	"welcome.tooltip": "Callout Studioについて",
	"welcome.title": "Callout Studioへようこそ",
	"welcome.tagline": "Obsidianのcalloutを管理するための総合ソリューション。",
	"welcome.previewTitle": "実際の動作を見る",
	"welcome.sample":
		"Callout Studioを使えば、アイコン・色・名前をカスタマイズしたcalloutを作成できます。\n\n" +
		"同じcalloutは**3つ**の異なる方法で使用できます。\n\n" +
		"## [!tip] 見出しとして\n" +
		"見出しをcallout風にするには、`#`の直後に`[!type]`を追加します。\n\n" +
		"この[!warning]のようなインラインcalloutにしたい場合は、文章の途中に`[!type]`を追加するだけです。流れを止める必要はありません。\n\n" +
		"> [!note] 通常のcallout\n" +
		"> もちろん、従来のcalloutもこれまでと同じ構文でそのまま使えます：`> [!type]`。\n\n" +
		"Callout Studioにはまだまだ多くの機能があります！[詳しく見る]({{repoUrl}})。\n",

	"deleteModal.title": 'callout "{{name}}" を削除しますか？',
	"deleteModal.bodyInUse":
		"このcalloutは{{files}}個のファイルに{{count}}回出現しています。",
	"deleteModal.bodyInUseExplain":
		"削除すると、これらのブロックはプレーンテキストに変換されます。スタイルとcalloutヘッダーが失われます。",
	"deleteModal.replaceHint":
		"別のcalloutに置き換えることで、vault内のコンテンツをスタイル付きcalloutとして保持できます。",
	"deleteModal.bodyUnused":
		'"{{name}}"はどのノートでも使用されていませんが、カスタムcalloutです。削除するとこのリストから削除されます。',
	"deleteModal.replaceInstead": "代わりに置き換える",
	"deleteModal.deleteInUse": "削除（プレーンテキストに変換）",
	"deleteModal.deleteUnused": "calloutを削除",

	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "マイcalloutタイプ",
	"settings.builtInCallouts": "組み込みcallout",
	"settings.contextMenu": "コンテキストメニュー",
	"settings.autocomplete": "オートコンプリート",
	"settings.keyboardShortcuts": "キーボードショートカット",
	"settings.language": "言語",
	"settings.languageDesc":
		"Callout Studio の表示言語。デフォルトでは Obsidian のインターフェース言語に従います。",
	"settings.languageAuto": "自動（Obsidian に合わせる）",
	"settings.importExport": "インポート / エクスポート",
	"settings.import": "インポート",
	"settings.export": "エクスポート",
	"settings.importDesc":
		"JSONファイルを使って別のvaultからCallout Studioのデータをインポートします。",
	"settings.exportDesc":
		"すべてのカスタムcalloutタイプをJSON形式で保存します。",
	"settings.importConflictNotice":
		"{{count}}件のcalloutタイプをインポートしました。{{overwritten}}件の既存エントリが上書きされました。",

	"settings.addNewCallout": "+ calloutを追加",

	"settings.noCalloutsNow": "現在カスタムcalloutはありません。",

	"settings.editAria": "{{name}}を編集",
	"settings.moreRowActionsAria": "{{name}}のその他の操作",
	"settings.usageInfo": "{{files}}個のファイルで{{count}}回使用",
	"settings.replaceAction": "vaultで置き換え",
	"settings.deleteAction": "削除",
	"settings.resetAction": "デフォルトにリセット",
	"settings.makeFallbackAction": "デフォルトフォールバックスタイルを使用",

	"settings.colorSwatchAria": "アクセント: {{accent}} · 背景: {{bg}}",
	"settings.fallbackCallout": "デフォルトフォールバックcallout",
	"settings.fallbackCalloutDesc":
		"vaultで認識されないcalloutタイプはこのcalloutのスタイルを継承します。",

	"settings.globalStyle": "グローバルcalloutスタイル",
	"settings.border": "ボーダー",
	"settings.borderAll": "すべて",
	"settings.borderTop": "上",
	"settings.borderRight": "右",
	"settings.borderBottom": "下",
	"settings.borderLeft": "左",
	"settings.borderWidth": "ボーダーの太さ",
	"settings.fontScaleGroup": "フォントスケール",
	"settings.titleScale": "タイトル",
	"settings.contentScale": "コンテンツ",
	"settings.inlineTextScale": "テキスト",
	"settings.shapeGroup": "形状",
	"settings.borderRadius": "角の丸み",
	"settings.alignGroup": "整列",
	"settings.alignContent": "コンテンツをタイトルに合わせて整列",
	"settings.headingSpacingGroup": "タイトル間隔",
	"settings.headingPadVertical": "垂直方向の間隔",
	"settings.headingIconIndent": "アイコンインデント",
	"settings.headingGap": "見出し間の間隔",
	"settings.styleDemoName": "サンプル",
	"settings.previewTitle": "プレビュー",

	// Settings — Saved color palettes
	"settings.customPalettes": "保存済みのカラーパレット",
	"settings.newPalette": "新規パレット",
	"settings.customPalettesEmpty": "現在保存済みのパレットはありません。",
	"settings.editPaletteAria": "パレット {{name}} を編集",
	"settings.deletePaletteAria": "パレット {{name}} を削除",
	"settings.deletePaletteConfirm":
		'パレット "{{name}}" を削除しますか？\nこの色を使用しているcalloutには影響しません。',
	"settings.enableAutocomplete": "[! オートコンプリートを有効にする",
	"settings.enableAutocompleteDesc":
		'エディターの引用ブロック内で"[!"と入力すると候補を表示します。リストからcalloutタイプを選択して完全なcalloutヘッダーを挿入します。',

	"settings.openHotkeys": "Callout Studioショートカット",
	"settings.openHotkeysDesc":
		"Callout StudioコマンドのObsidianホットキー設定を開きます。新しいcalloutタイプの作成、設定を開く、callout解除、calloutで囲むの独自ショートカットを設定できます。デフォルトではショートカットは割り当てられていません。",
	"settings.openHotkeysButton": "ホットキー設定を開く",

	"settings.vaultMaintenance": "vaultの洞察とメンテナンス",
	"settings.vaultStats": "callout統計",
	"settings.vaultStatsDesc":
		"Markdownノート内のすべてのcalloutブロックをカウントし、タイプ別にグループ化します。",
	"settings.vaultStatsButton": "統計を表示",
	"settings.vaultStatsScanning": "スキャン中",
	"settings.resetAll": "リセット",
	"settings.resetAllDesc":
		"すべてのユーザーcalloutを削除し、組み込みcallout、グローバルスタイル（ボーダー、フォントスケール、形状）、保存済みのカラーパレット、右クリックメニューのカスタマイズ、ダウンロード済みMaterial SVGをリセットします。",
	"settings.resetAllButton": "すべてリセット",
	"settings.resetAllConfirm":
		"すべてのカスタムcalloutを削除し、組み込みcallout、グローバルスタイル、保存済みのカラーパレット、右クリックメニューのカスタマイズ、キャッシュ済みMaterial SVGをリセットします。この操作は元に戻せません。よろしいですか？",
	"notice.resetAllDone": "すべてデフォルトにリセットされました。",

	"notice.exported":
		"calloutをcallout-studio-export.jsonにエクスポートしました",
	"notice.importedJSON":
		"JSONから{{count}}件のcalloutタイプをインポートしました。",
	"notice.importedSettings": "プラグインの設定をインポートしました。",
	"notice.noNewJSON":
		"新しいcalloutタイプはインポートされませんでした（IDがすでに存在する可能性があります）。",
	"notice.iconDownloadFailed":
		'Materialアイコン"{{name}}"をダウンロードできませんでした。このスタイル/ウェイトでは利用できないか、接続がオフラインの可能性があります。',
	"notice.nothingToWrap": "囲むものがありません。",
	"notice.cursorNotInsideCallout": "カーソルがcallout内にありません。",
	"notice.openHotkeysFailed": "Obsidianのホットキー設定を開けませんでした。",
	"notice.filterHotkeysFailed":
		"Obsidianのホットキーを開きましたが、Callout Studioフィルターを適用できませんでした。",

	"editor.editCallout": "calloutを編集",
	"editor.newCallout": "新しいcallout",
	"editor.displayName": "表示名",
	"editor.displayNameDesc": "UIに表示される人が読めるラベル",
	"editor.displayNameBuiltIn": "組み込みcalloutの表示名は変更できません",
	"editor.displayNamePlaceholder": "マイcallout",
	"editor.calloutIds": "Callout ID",
	"editor.calloutIdsDesc":
		"このcalloutのすべての識別子。スペースを使用できます。\nEnterまたは + ボタンを押して追加します。",
	"editor.calloutIdsPlaceholder": "IDを追加",
	"editor.addId": "IDを追加",
	"editor.idLinkedToName": "表示名にリンクされています",
	"editor.idCannotDelete":
		"このIDは表示名にリンクされているため削除できません。名前を編集して変更してください",
	"editor.icon": "アイコン",
	"editor.livePreview": "ライブプレビュー",
	"editor.iconAdjustment": "アイコン調整",
	"editor.picture": "画像",
	"editor.size": "サイズ",
	"editor.horizontalOffset": "水平オフセット",
	"editor.verticalOffset": "垂直オフセット",
	"editor.colors": "カラー",
	"editor.paletteDeleted": "削除された色",
	"editor.paletteGroupObsidian": "Obsidian callout",
	"editor.paletteGroupPresets": "カラープリセット",
	"editor.paletteGroupCustom": "カスタム",
	"editor.paletteNewColor": "新しい色…",
	"editor.contrastWarning":
		"背景とのコントラストが低く、読みにくい場合があります",
	"editor.foldable": "折りたたみ可能",
	"editor.foldableDesc":
		"calloutを折りたたみ可能にするかどうか、およびvault全体に適用するデフォルト状態を選択します。",
	"editor.foldOff": "オフ",
	"editor.foldOpen": "デフォルトで開く",
	"editor.foldClosed": "デフォルトで閉じる",
	"editor.cancel": "キャンセル",
	"editor.saveChanges": "変更を保存",
	"editor.createCallout": "calloutを作成",
	"editor.nameRequired": "calloutを作成する前に表示名が必要です。",
	"editor.noChangesToSave": "変更はありませんでした。",
	"editor.downloadingIcon": "アイコンをダウンロード中",
	"editor.idEmpty": "少なくとも1つのIDが必要です",
	"editor.idExists": "このIDのcalloutがすでに存在します",
	"editor.idConflict": "このIDは既存のcalloutと競合します",
	"editor.idDashConflict":
		"Obsidianはスペースをハイフンとして書き込むため、このIDは「{{other}}」と衝突します",
	"editor.untitledCallout": "タイトルなしCallout",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText": "段落内にインラインの [!{id}] ピルがあります。",
	"editor.previewReadOnly": "ライブプレビューは編集できません",

	// Palette editor modal
	"palette.newTitle": "新しいカラーパレット",
	"palette.editTitle": "カラーパレットを編集",
	"palette.name": "名前",
	"palette.namePlaceholder": "マイパレット",
	"palette.nameExists": "この名前のパレットはすでに存在します",
	"palette.baseColor": "ベースカラー",
	"palette.baseColorHint":
		"背景色を自動的にこの色に合わせます。ご希望であれば、{{link}}で個別に設定することもできます。",
	"palette.baseColorHintLink": "ここをクリック",
	"palette.advancedColors": "色",
	"palette.advancedColorsHint":
		"{{mode}}モードの色を編集中 - もう一方のモードは自動的に更新されます。確認するにはObsidianのテーマを切り替えてください。",
	"palette.revertHint": "代わりに単一のベースカラーを使いますか? {{link}}。",
	"palette.revertHintLink": "元に戻す",
	"palette.lightMode": "ライト",
	"palette.darkMode": "ダーク",
	"palette.accentColor": "アクセントカラー",
	"palette.backgroundColorChannel": "背景色",
	"palette.textColorChannel": "テキストの色",
	"palette.bgIntensity": "強度",
	"palette.bgStyle": "スタイル",
	"palette.bgSolid": "単色",
	"palette.bgGradient": "グラデーション",
	"palette.gradientTo": "2番目の色",
	"palette.gradientDirection": "方向",
	"palette.gradientText": "グラデーションタイトルテキスト",
	"palette.save": "保存",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "赤",
	"colorName.orange": "オレンジ",
	"colorName.amber": "アンバー",
	"colorName.yellow": "黄",
	"colorName.lime": "ライム",
	"colorName.green": "緑",
	"colorName.teal": "ティール",
	"colorName.cyan": "シアン",
	"colorName.sky": "スカイブルー",
	"colorName.blue": "青",
	"colorName.indigo": "インディゴ",
	"colorName.violet": "バイオレット",
	"colorName.purple": "紫",
	"colorName.pink": "ピンク",
	"colorName.rose": "ローズ",
	"colorName.brown": "茶色",
	"colorName.gray": "グレー",
	"colorName.black": "黒",
	"colorName.white": "白",

	"iconPicker.pickIcon": "アイコンを選択",
	"iconPicker.confirm": "確認",
	"iconPicker.cancel": "キャンセル",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "Lucideアイコンを検索",
	"iconPicker.searchTabler": "Tablerアイコンを検索",
	"iconPicker.tablerStyle": "アイコンスタイル",
	"iconPicker.tablerStyleOutline": "アウトライン (Outline)",
	"iconPicker.tablerStyleFilled": "塗りつぶし (Filled)",
	"iconPicker.loadMore": "さらに読み込む",
	"iconPicker.materialStyle": "アイコンスタイル",
	"iconPicker.materialStyleOutlined": "アウトライン (Outlined)",
	"iconPicker.materialStyleFilled": "塗りつぶし (Filled)",
	"iconPicker.materialStyleRounded": "丸み (Rounded)",
	"iconPicker.materialStyleSharp": "シャープ (Sharp)",
	"iconPicker.materialWeight": "アイコンの太さ",
	"iconPicker.materialWeight100": "極細 (Thin)",
	"iconPicker.materialWeight200": "超細 (Extra Light)",
	"iconPicker.materialWeight300": "細 (Light)",
	"iconPicker.materialWeight400": "標準 (Regular)",
	"iconPicker.materialWeight500": "中 (Medium)",
	"iconPicker.materialWeight600": "やや太 (Semi Bold)",
	"iconPicker.materialWeight700": "太 (Bold)",
	"iconPicker.searchMaterial": "Materialアイコンを検索",
	"iconPicker.searchEmoji": "絵文字を検索",
	"iconPicker.skinTone": "肌の色調",
	"iconPicker.allCategories": "すべてのカテゴリ",
	"iconPicker.noIconSelected": "アイコンが選択されていません",
	"iconPicker.noResults": "検索に一致するアイコンはありません。",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Octiconsを検索",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Font Awesomeを検索",
	"iconPicker.faStyle": "アイコンスタイル",
	"iconPicker.faStyleSolid": "塗りつぶし (Solid)",
	"iconPicker.faStyleRegular": "標準 (Regular)",
	"iconPicker.faStyleBrands": "ブランド (Brands)",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "RPG Awesomeを検索",
	"iconPicker.image": "あなたの画像",
	"iconPicker.searchImage": "画像を検索",
	"iconPicker.imageTooLarge":
		"{{name}}は大きすぎます。画像は5MB未満にしてください。",
	"iconPicker.imageUnsupported":
		"{{name}}はサポートされている画像形式ではありません。SVG、PNG、JPEG、またはWebPを使用してください。",
	"iconPicker.imageInvalidSvg":
		"{{name}}は安全なSVGとして読み取れなかったため、追加されませんでした。",
	"iconPicker.imageDecodeFailed":
		"{{name}}は画像として読み取れませんでした。",
	"iconPicker.imageDuplicate":
		"{{name}}はすでにあなたの画像にあります。ファイル名を変更するか、既存の画像を削除してください。",
	"iconPicker.imageAdd": "画像を追加",
	"iconPicker.imageEmpty":
		"画像がまだありません。コンピューターからSVG、PNG、JPEG、またはWebPファイルを追加するか、ここにドロップしてください。",
	"iconPicker.imageDelete": "削除",
	"iconPicker.imageDeleteConfirm": "「{{name}}」を削除しますか？",
	"iconPicker.imageDeleteInUse":
		"{{count}}個のcalloutがこの画像を使用しています。新しい画像を指定するまで、プレースホルダーアイコンが表示されます。",
	"iconPicker.imageRecolor": "Calloutのカラーに合わせる",
	"iconPicker.allSources": "すべてのソース",
	"iconPicker.searchAllSources": "すべてのアイコンソースを検索",
	"iconPicker.sourcesNotDownloaded":
		"未取得: {{names}}。上からソースを選んでダウンロードしてください。",
	"iconPicker.chooseSource": "ソースを選択",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources": "すべてのライブラリを一度に検索",
	"iconPicker.descLucide": "Obsidian固有のセット、常にオフライン",
	"iconPicker.descTabler":
		"シンプルで統一感のあるUIアイコン、アウトラインと塗りつぶし",
	"iconPicker.descMaterial": "Googleのセット、4スタイルと7ウェイト",
	"iconPicker.descEmoji": "カラフルなグリフ、すべての肌色",
	"iconPicker.descOcticons": "GitHubのインターフェイスアイコン",
	"iconPicker.descFa": "Solid、Regular、ブランド",
	"iconPicker.descRpgAwesome": "ファンタジーとテーブルトップのアイコン",
	"iconPicker.descImage": "コンピューターから追加した画像",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "アクセシビリティ",
	"iconPicker.cat.Actions": "アクション",
	"iconPicker.cat.Activities": "アクティビティ",
	"iconPicker.cat.Alert": "アラート",
	"iconPicker.cat.Alphabet": "アルファベット",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "動物",
	"iconPicker.cat.Arrows": "矢印",
	"iconPicker.cat.Astronomy": "天文学",
	"iconPicker.cat.Audio&Video": "音声・映像",
	"iconPicker.cat.Automotive": "自動車",
	"iconPicker.cat.Badges": "バッジ",
	"iconPicker.cat.Brand": "ブランド",
	"iconPicker.cat.Buildings": "建物",
	"iconPicker.cat.Business": "ビジネス",
	"iconPicker.cat.Camping": "キャンプ",
	"iconPicker.cat.Charity": "チャリティー",
	"iconPicker.cat.Charts": "グラフ",
	"iconPicker.cat.Charts + Diagrams": "グラフ・図表",
	"iconPicker.cat.Childhood": "子供時代",
	"iconPicker.cat.Clothing + Fashion": "衣類・ファッション",
	"iconPicker.cat.Coding": "プログラミング",
	"iconPicker.cat.Communicate": "コミュニケーション",
	"iconPicker.cat.Communication": "通信",
	"iconPicker.cat.Computers": "コンピューター",
	"iconPicker.cat.Connectivity": "接続",
	"iconPicker.cat.Construction": "建設",
	"iconPicker.cat.Currencies": "通貨",
	"iconPicker.cat.Database": "データベース",
	"iconPicker.cat.Design": "デザイン",
	"iconPicker.cat.Development": "開発",
	"iconPicker.cat.Devices": "デバイス",
	"iconPicker.cat.Devices + Hardware": "デバイス・ハードウェア",
	"iconPicker.cat.Disaster + Crisis": "災害・危機",
	"iconPicker.cat.Document": "ドキュメント",
	"iconPicker.cat.E-commerce": "Eコマース",
	"iconPicker.cat.Editing": "編集",
	"iconPicker.cat.Education": "教育",
	"iconPicker.cat.Electrical": "電気",
	"iconPicker.cat.Emoji": "絵文字",
	"iconPicker.cat.Energy": "エネルギー",
	"iconPicker.cat.Extensions": "拡張機能",
	"iconPicker.cat.Files": "ファイル",
	"iconPicker.cat.Film + Video": "映画・動画",
	"iconPicker.cat.Food": "食べ物",
	"iconPicker.cat.Food + Beverage": "食べ物・飲み物",
	"iconPicker.cat.Fruits + Vegetables": "果物・野菜",
	"iconPicker.cat.Games": "ゲーム",
	"iconPicker.cat.Gaming": "ゲーミング",
	"iconPicker.cat.Gender": "性別",
	"iconPicker.cat.Genders": "性別",
	"iconPicker.cat.Gestures": "ジェスチャー",
	"iconPicker.cat.Halloween": "ハロウィン",
	"iconPicker.cat.Hands": "手",
	"iconPicker.cat.Hardware": "ハードウェア",
	"iconPicker.cat.Health": "健康",
	"iconPicker.cat.Holidays": "休日",
	"iconPicker.cat.Home": "ホーム",
	"iconPicker.cat.Household": "家庭",
	"iconPicker.cat.Humanitarian": "人道的",
	"iconPicker.cat.Images": "画像",
	"iconPicker.cat.Laundry": "洗濯",
	"iconPicker.cat.Letters": "文字",
	"iconPicker.cat.Logic": "論理",
	"iconPicker.cat.Logistics": "物流",
	"iconPicker.cat.Map": "地図",
	"iconPicker.cat.Maps": "地図",
	"iconPicker.cat.Maritime": "海事",
	"iconPicker.cat.Marketing": "マーケティング",
	"iconPicker.cat.Math": "数学",
	"iconPicker.cat.Mathematics": "数学",
	"iconPicker.cat.Media": "メディア",
	"iconPicker.cat.Media Playback": "メディア再生",
	"iconPicker.cat.Medical + Health": "医療・健康",
	"iconPicker.cat.Money": "お金",
	"iconPicker.cat.Mood": "気分",
	"iconPicker.cat.Moving": "引越し",
	"iconPicker.cat.Music + Audio": "音楽・音声",
	"iconPicker.cat.Nature": "自然",
	"iconPicker.cat.Numbers": "数字",
	"iconPicker.cat.Photography": "写真撮影",
	"iconPicker.cat.Photos + Images": "写真・画像",
	"iconPicker.cat.Political": "政治",
	"iconPicker.cat.Privacy": "プライバシー",
	"iconPicker.cat.Punctuation + Symbols": "句読点・記号",
	"iconPicker.cat.Religion": "宗教",
	"iconPicker.cat.Science": "科学",
	"iconPicker.cat.Science Fiction": "SF",
	"iconPicker.cat.Security": "セキュリティ",
	"iconPicker.cat.Shapes": "図形",
	"iconPicker.cat.Shopping": "ショッピング",
	"iconPicker.cat.Social": "ソーシャル",
	"iconPicker.cat.Spinners": "スピナー",
	"iconPicker.cat.Sport": "スポーツ",
	"iconPicker.cat.Sports + Fitness": "スポーツ・フィットネス",
	"iconPicker.cat.Symbols": "記号",
	"iconPicker.cat.System": "システム",
	"iconPicker.cat.Text": "テキスト",
	"iconPicker.cat.Text Formatting": "テキスト書式",
	"iconPicker.cat.Time": "時間",
	"iconPicker.cat.Toggle": "トグル",
	"iconPicker.cat.Transit": "交通",
	"iconPicker.cat.Transportation": "輸送",
	"iconPicker.cat.Travel": "旅行",
	"iconPicker.cat.Travel + Hotel": "旅行・ホテル",
	"iconPicker.cat.UI actions": "UI操作",
	"iconPicker.cat.Users + People": "ユーザー・人物",
	"iconPicker.cat.Vehicles": "乗り物",
	"iconPicker.cat.Version control": "バージョン管理",
	"iconPicker.cat.Weather": "天気",
	"iconPicker.cat.Writing": "文章",
	"iconPicker.cat.Zodiac": "星座",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}}はまだダウンロードされていません",
	"iconPack.downloadDetail":
		"{{count}}個のアイコン · {{size}} · 一度限りのダウンロード",
	"iconPack.download": "ダウンロード",
	"iconPack.downloading": "{{name}}をダウンロード中…",
	"iconPack.downloadFailed":
		"{{name}}をダウンロードできませんでした。接続を確認して再試行してください。",
	"iconPack.retry": "再試行",
	"iconPack.faBrandsNotice":
		"ブランドアイコンはそれぞれの所有者の商標です。それらの掲載は推薦を意味しません。それらが指す会社、製品、またはサービスを表すためにのみ使用してください。",
	"iconPack.artworkRestored":
		"{{names}}のアイコンアートワークをダウンロードしました。",
	"iconPack.diskWriteFailed":
		"Callout Studioはアイコンパックをディスクに保存できませんでした。次回また再ダウンロードが必要です。選んだアイコンは設定に保存されています。",

	// Icon licences & credits
	"credits.title": "アイコンライセンスとクレジット",
	"credits.intro":
		"Callout Studioはいくつかのオープンなアイコンライブラリを使用しています。それらのライセンスと、ここでの使用のために変更された点を以下に掲載します。",
	"credits.fullNotices": "サードパーティの完全な通知",
	"credits.pluginLicense":
		"Callout Studio自体のコードは0BSDライセンスです。アイコンライブラリはそれぞれのライセンスを保持します。",

	"contextMenu.editCallout": "callout設定を編集",
	"contextMenu.copyMarkdown": "callout Markdownをコピー",
	"contextMenu.openSettings": "Callout Studio設定を開く",
	"contextMenu.setFoldClosed": "calloutを閉じた状態に設定 (-)",
	"contextMenu.setFoldOpen": "calloutを開いた状態に設定 (+)",
	"contextMenu.setFoldNone": "calloutを折りたたみ不可にする",
	"contextMenu.cutSection": "見出しセクションを切り取り",
	"contextMenu.copySection": "見出しセクションをコピー",
	"contextMenu.deleteSection": "見出しセクションを削除",

	"heading.toggleFold": "折りたたみを切り替え",

	"settings.globalSettings": "グローバル設定",
	"settings.globalSettingsDesc":
		"vault全体で各calloutタイプの見た目を細かく調整します。",
	"settings.globalSettingsRegularDesc":
		"引用ブロックにcalloutトークンを追加すると（例: `> [!type]`）、Obsidianのネイティブなcalloutボックスとして表示されます。ボーダー、半径、フォントスケール、整列を調整できます。",
	"settings.globalSettingsHeadingDesc":
		"見出しの # の直後にcalloutトークンを追加すると（例: `## [!type]`）、スタイル付きの見出しcalloutとして表示されます。ボーダー、形状、垂直方向の間隔を調整できます。",
	"settings.globalSettingsInlineDesc":
		"テキスト行の中のどこかにcalloutトークンを追加すると（例: `[!type]`）、小さなインラインピルとして表示されます。ボーダーと形状を調整できます。",
	"settings.globalSettingsCustomize": "カスタマイズ",

	"settings.calloutTypeRegular": "通常のcallout",
	"settings.calloutTypeHeading": "見出しcallout",
	"settings.calloutTypeInline": "インラインcallout",

	"settings.customizeMenu": "メニュー項目をカスタマイズ",
	"settings.customizeMenuDesc":
		"各calloutタイプに表示する右クリック操作を選択し、順序を並べ替えます。 ソースモード、ライブプレビューで機能します。",
	"settings.customizeMenuButton": "メニュー項目をカスタマイズ",
	"menuCustomize.title": "右クリックメニューをカスタマイズ",
	"menuCustomize.desc":
		"操作のオン/オフを切り替え、ハンドルをドラッグして並べ替えます。変更は自動的に保存されます。",
	"menuCustomize.regular": "通常のcallout",
	"menuCustomize.heading": "見出しcallout",
	"menuCustomize.inline": "インラインcallout",
	"menuCustomize.dragHandle": "ドラッグして並べ替え",
	"menuItem.edit": "calloutを編集",
	"menuItem.openSettings": "設定を開く",
	"menuItem.copyMarkdown": "Markdownをコピー",
	"menuItem.foldDefaults": "折りたたみのデフォルト（開く / 閉じる / なし）",
	"menuItem.cutSection": "セクションを切り取り",
	"menuItem.copySection": "セクションをコピー",
	"menuItem.deleteSection": "セクションを削除",

	"confirm.ok": "削除",
	"confirm.cancel": "キャンセル",

	"vault.filesUpdated":
		"vaultファイルの{{count}}件のcallout参照を更新しました。",
	"vault.idsUpdated":
		"vaultファイルの{{count}}件のcallout IDを更新しました: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"vaultファイルの{{count}}件のcalloutタイトルを更新しました: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "置き換え先:",
	"vault.deleteWithout": "置き換えずに削除",
	"vault.confirmDelete": "確認",
	"vault.confirmReplace": "置き換え",
	"vault.replacePromptInUse":
		'"{{name}}"は{{files}}個のファイルで{{count}}回使用されています。置き換えるcalloutを選択してください:',
	"vault.replacePromptUnused":
		'"{{name}}"を置き換えるcalloutを選択してください:',
	"vault.noReplacementAvailable": "置き換え可能な他のcalloutがありません。",
	"vault.convertedToPlainText":
		"{{files}}個のファイルの{{blocks}}個のcalloutブロックをプレーンテキストに変換しました。",
	"vault.resetAliasWarning":
		"{{files}}個のファイルの{{count}}件の参照がカスタムエイリアスを使用しています: {{aliases}}。リセット後これらは機能しなくなります。続行しますか？",
	"vault.resetConfirm": "リセット",
	"vault.resetAllInUse":
		"⚠ {{files}}個のファイルの{{count}}件のcallout参照が削除されるカスタムcalloutタイプを使用しています。",

	"vaultStats.title": "callout統計",
	"vaultStats.totalCallouts": "callout総数",
	"vaultStats.typesFound": "見つかったタイプ",
	"vaultStats.filesWithCallouts": "calloutを含むファイル",
	"vaultStats.filesScanned": "スキャン済みMarkdownファイル",
	"vaultStats.empty": "Markdownノートにcalloutが見つかりませんでした。",
	"vaultStats.columnType": "タイプ",
	"vaultStats.columnName": "名前",
	"vaultStats.columnSource": "ソース",
	"vaultStats.columnCount": "数",
	"vaultStats.columnFiles": "ファイル",
	"vaultStats.unknown": "不明",
	"vaultStats.sourceBuiltIn": "組み込み",
	"vaultStats.sourceCustom": "カスタム",
	"vaultStats.sourceAutoFallback": "自動フォールバック",
	"vaultStats.sourceTheme": "CSSスニペット",
	"vaultStats.sourceAlias": "{{id}}のエイリアス",
	"vaultStats.sourceUnknown": "不明",
	"vaultStats.close": "閉じる",

	"import.title": "インポートの問題",
	"import.reportLeadIn":
		"インポートしたファイルが変更されているようです。問題のリストです:",
	"import.reportLeadInFatal":
		"このファイルはCallout Studioのエクスポートではないようです。インポートできません:",
	"import.entryHeading": "エントリ {{index}} — {{label}}",
	"import.summary":
		"{{total}}件中{{valid}}件のエントリが有効 · {{issues}}件の問題が見つかりました。",
	"import.btnCancel": "キャンセル",
	"import.btnImportValid": "有効なもののみインポート（{{count}}件）",
	"import.err.notRecognized":
		"認識できないファイル: callout定義の配列またはCallout Studioのエクスポートが必要です。",
	"import.warn.settingsIgnored":
		"設定ブロックが有効なオブジェクトではなかったため、無視されました。",
	"import.warn.invalidGradient":
		"背景のグラデーションが無効だったため、無視されました。",
	"import.err.parseFailed":
		"ファイルは有効なJSONではなく、解析できませんでした。",
	"import.err.entryNotObject": "エントリはオブジェクトでなければなりません。",
	"import.err.requiredMissing":
		'必須フィールド"{{field}}"が欠けているか、型が間違っています。',
	"import.err.idEmpty": "IDは空であってはなりません。",
	"import.err.idTooLong":
		'ID"{{value}}"は{{length}}文字です。最大は{{max}}文字です。',
	"import.err.idBadChar":
		'ID"{{value}}"に無効な文字が含まれています（"|"、"["、"]"、タブ、改行は使用できません）。',
	"import.err.displayNameEmpty": "表示名は空であってはなりません。",
	"import.err.displayNameTooLong":
		"表示名は{{length}}文字です。最大は{{max}}文字です。",
	"import.err.boolField":
		'"{{field}}"はブール値（trueまたはfalse）でなければなりません。',
	"import.err.iconNotObject": "アイコンはオブジェクトでなければなりません。",
	"import.err.iconTypeInvalid":
		'アイコンタイプ"{{value}}"は{{types}}のいずれかでなければなりません。',
	"import.warn.iconFieldIgnored":
		'"{{field}}"はMaterialアイコンにのみ適用され、アイコンタイプ{{type}}では無視されます。',
	"import.err.iconValueEmpty":
		"アイコンの値は空でない文字列でなければなりません。",
	"import.err.iconValueTooLong":
		"アイコンの値が異常に長いです（{{length}}文字）。",
	"import.err.materialStyle":
		'Materialアイコンスタイル"{{value}}"はoutlined、filled、rounded、sharpのいずれかでなければなりません。',
	"import.err.materialWeight":
		'Materialアイコンの太さ"{{value}}"は100〜700の範囲で100刻みの整数でなければなりません。',
	"import.warn.iconRecolorIgnored":
		'"recolor"はあなた自身の画像にのみ適用され、アイコンタイプ{{type}}では無視されます。',
	"import.err.iconRecolorInvalid":
		'"recolor"はtrueまたはfalseでなければなりません（受け取った値: "{{value}}")。',
	"import.err.colorInvalid":
		'"{{field}}"は"#448aff"のような16進数カラーでなければなりません（"{{value}}"を受け取りました）。',
	"import.err.numberRange":
		'"{{field}}"は{{min}}〜{{max}}の数値でなければなりません（"{{value}}"を受け取りました）。',
	"import.err.iconSizeRange":
		'"{{field}}"は{{min}}〜{{max}}の数値でなければなりません（"{{value}}"を受け取りました）。',
	"import.err.aliasesNotArray":
		'"aliases"は文字列の配列でなければなりません。',
	"import.err.aliasNotString": "エイリアスは文字列でなければなりません。",
	"import.err.aliasDup":
		'"{{value}}"エイリアスがこのエントリ内で重複しています。',
	"import.err.tooManyIds":
		"IDが多すぎます（{{count}}件）。各calloutには最大{{max}}件のID（プライマリ＋エイリアス）を持てます。",
	"import.err.metadataShape":
		'"metadata"はすべての値が文字列のオブジェクトでなければなりません。',
	"import.err.unknownFields":
		"不明なフィールドは無視されました: {{fields}}。",
	"import.err.duplicateInFile":
		'ID/エイリアス"{{value}}"はこのファイルのエントリ#{{first}}ですでに使用されています。',
	"import.err.aliasConflict":
		'エイリアス"{{value}}"はvault内の別のcallout（"{{other}}"）ですでに使用されています。',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded"がtrueで"foldable"がfalseでした。defaultFoldedはfalseにリセットされました。',
	"import.warn.imageMissing":
		"このCalloutはファイルにもこのvaultにも存在しない画像を使用しています。新しい画像を指定するまでプレースホルダーアイコンが表示されます。",

	"footer.tagline":
		"フィードバック、コメント、提案はありますか？ぜひお聞かせください！",
	"footer.madeBy": "Nivが作成  •  ",
};
