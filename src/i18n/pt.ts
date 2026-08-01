export const pt: Record<string, string> = {
	"cmd.openSettings": "Abrir configurações",
	"cmd.createCallout": "Criar novo tipo de callout",
	"cmd.insertEmptyCallout": "Inserir callout vazio",
	"cmd.calloutWrap": "Envolver em callout",
	"cmd.calloutUnwrap": "Remover callout",

	"autocomplete.createNew": 'Criar novo callout: "{{name}}"',

	"settings.fallbackTag": "Padrão",
	"settings.fallbackTagAuto": "Padrão automático",
	"settings.rescanVault": "Redigitalizar vault",
	"settings.rescanVaultDesc":
		"Encontra IDs de callout não reconhecidos nas notas e os adiciona como linhas de fallback.",
	"settings.rescanVaultHintAction": "Digitalizar agora",
	"settings.rescanComplete":
		"Redigitalização concluída: {{count}} novo(s) callout(s) adicionado(s).",
	"replaceModal.deleteWithoutReplaceSuffix": "(volta ao padrão)",

	"firstRun.title": "Encontrar callouts existentes no seu vault?",
	"firstRun.body":
		"O Callout Studio pode digitalizar seu vault para descobrir callouts que você já usa, para que apareçam na sua lista de configurações e adotem seu estilo de fallback.",
	"firstRun.heavyVaultNote":
		"Seu vault tem {{count}} arquivos Markdown — a digitalização pode levar alguns segundos.",
	"firstRun.laterHint":
		"Você sempre pode executar isso mais tarde em Configurações → Insights e manutenção do vault → Redigitalizar vault.",
	"firstRun.scanNow": "Digitalizar agora",
	"firstRun.noThanks": "Não, obrigado",
	"firstRun.autoScanComplete":
		"O Callout Studio digitalizou seu vault e adicionou {{count}} callout(s).",
	"firstRun.scanning": "Digitalizando",

	"welcome.tooltip": "Sobre o Callout Studio",
	"welcome.title": "Bem-vindo ao Callout Studio",
	"welcome.tagline":
		"Sua solução completa para gerenciar callouts do Obsidian.",
	"welcome.previewTitle": "Veja em ação",
	"welcome.sample":
		"O Callout Studio permite criar callouts com ícone, cores e nome personalizados.\n\n" +
		"Você pode usar o mesmo callout de **três** formas diferentes:\n\n" +
		"## [!tip] Como um título\n" +
		"Para transformar qualquer título em um título no estilo callout, adicione `[!type]` logo após os `#`.\n\n" +
		"Quer um callout inline como este [!warning]? Basta adicionar `[!type]` no meio de uma frase, sem interromper seu fluxo.\n\n" +
		"> [!note] Callout comum\n" +
		"> Claro, o callout clássico funciona exatamente com a sintaxe que você já conhece: `> [!type]`.\n\n" +
		"O Callout Studio tem muito mais a oferecer! [Saiba mais]({{repoUrl}}).\n",

	"deleteModal.title": 'Excluir callout "{{name}}"?',
	"deleteModal.bodyInUse":
		"Este callout aparece {{count}} vez(es) em {{files}} arquivo(s).",
	"deleteModal.bodyInUseExplain":
		"Excluir converterá esses blocos em texto simples — eles perderão o estilo e o cabeçalho do callout.",
	"deleteModal.replaceHint":
		"Você pode substituí-lo por outro callout, o que mantém o conteúdo do vault como um callout estilizado.",
	"deleteModal.bodyUnused":
		'"{{name}}" não é usado em nenhuma nota, mas é um callout personalizado que você criou. Excluir irá removê-lo desta lista.',
	"deleteModal.replaceInstead": "Substituir em vez disso",
	"deleteModal.deleteInUse": "Excluir (converter em texto simples)",
	"deleteModal.deleteUnused": "Excluir callout",

	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "Meus tipos de callout",
	"settings.builtInCallouts": "Callouts integrados",
	"settings.contextMenu": "Menu de contexto",
	"settings.autocomplete": "Preenchimento automático",
	"settings.keyboardShortcuts": "Atalhos de teclado",
	"settings.language": "Idioma",
	"settings.languageDesc":
		"Idioma de exibição do Callout Studio. Por padrão, segue o idioma da interface do Obsidian.",
	"settings.languageAuto": "Automático (igual ao Obsidian)",
	"settings.importExport": "Importar / exportar",
	"settings.import": "Importar",
	"settings.export": "Exportar",
	"settings.importDesc":
		"Importe seu progresso do Callout Studio de outro vault usando um arquivo JSON.",
	"settings.exportDesc":
		"Salve todos os seus tipos de callout personalizados em formato JSON.",
	"settings.importConflictNotice":
		"{{count}} tipo(s) de callout importado(s); {{overwritten}} entradas existentes foram sobrescritas.",

	"settings.addNewCallout": "+ adicionar novo callout",

	"settings.noCalloutsNow": "Por enquanto não há callouts personalizados.",

	"settings.editAria": "Editar {{name}}",
	"settings.moreRowActionsAria": "Mais ações para {{name}}",
	"settings.usageInfo": "{{count}} uso(s) em {{files}} arquivo(s)",
	"settings.replaceAction": "Substituir no vault",
	"settings.deleteAction": "Excluir",
	"settings.resetAction": "Redefinir para padrão",
	"settings.makeFallbackAction": "Usar estilo de fallback padrão",
	"settings.colorSwatchAria": "Destaque: {{accent}} · Fundo: {{bg}}",

	"settings.fallbackCallout": "Callout de fallback padrão",
	"settings.fallbackCalloutDesc":
		"Tipos de callout não reconhecidos no seu vault herdarão o estilo deste callout.",

	"settings.globalStyle": "Estilo global de callout",
	"settings.border": "Bordas",
	"settings.borderAll": "Todos",
	"settings.borderTop": "Superior",
	"settings.borderRight": "Direito",
	"settings.borderBottom": "Inferior",
	"settings.borderLeft": "Esquerdo",
	"settings.borderWidth": "Espessura da borda",
	"settings.fontScaleGroup": "Escala de fonte",
	"settings.titleScale": "Título",
	"settings.contentScale": "Conteúdo",
	"settings.inlineTextScale": "Texto",
	"settings.shapeGroup": "Forma",
	"settings.borderRadius": "Arredondamento de cantos",
	"settings.alignGroup": "Alinhamento",
	"settings.alignContent": "Alinhar conteúdo com o título",
	"settings.headingSpacingGroup": "Espaçamento do título",
	"settings.headingPadVertical": "Espaçamento vertical",
	"settings.headingIconIndent": "Recuo do ícone",
	"settings.headingGap": "Espaçamento entre cabeçalhos",
	"settings.styleDemoName": "Exemplo",
	"settings.previewTitle": "Pré-visualização",

	// Settings — Saved color palettes
	"settings.customPalettes": "Paletas de cores salvas",
	"settings.newPalette": "Nova paleta",
	"settings.customPalettesEmpty": "Por enquanto não há paletas salvas.",
	"settings.editPaletteAria": "Editar paleta {{name}}",
	"settings.deletePaletteAria": "Excluir paleta {{name}}",
	"settings.deletePaletteConfirm":
		'Excluir a paleta "{{name}}"?\nOs callouts que usam essas cores não são afetados.',
	"settings.enableAutocomplete": "Habilitar preenchimento automático [!",
	"settings.enableAutocompleteDesc":
		'Mostra sugestões quando você digita "[!" dentro de uma citação no editor. Escolha um tipo de callout da lista para inserir um cabeçalho de callout completo.',

	"settings.openHotkeys": "Atalhos do Callout Studio",
	"settings.openHotkeysDesc":
		"Abre as configurações de atalhos do Obsidian para comandos do Callout Studio, onde você pode escolher seus próprios atalhos para Criar novo tipo de callout, Abrir configurações, Remover callout e Envolver em callout. Nenhum atalho é atribuído por padrão.",
	"settings.openHotkeysButton": "Abrir configurações de atalhos",

	"settings.vaultMaintenance": "Insights e manutenção do vault",
	"settings.vaultStats": "Estatísticas de callouts",
	"settings.vaultStatsDesc":
		"Conta todos os blocos de callout em suas notas Markdown e os agrupa por tipo.",
	"settings.vaultStatsButton": "Ver estatísticas",
	"settings.vaultStatsScanning": "Digitalizando",
	"settings.resetAll": "Redefinir",
	"settings.resetAllDesc":
		"Exclui todos os callouts de usuário, redefine callouts integrados, estilos globais (bordas, escala de fonte, forma), paletas de cores salvas, a personalização do menu de clique direito e SVGs Material baixados.",
	"settings.resetAllButton": "Redefinir tudo",
	"settings.resetAllConfirm":
		"Isso excluirá todos os callouts personalizados, redefinirá callouts integrados, estilos globais, paletas de cores salvas, a personalização do menu de clique direito e todos os SVGs Material em cache. Esta ação não pode ser desfeita. Tem certeza?",
	"notice.resetAllDone": "Tudo foi redefinido para os padrões.",

	"notice.exported": "Callouts exportados para callout-studio-export.json",
	"notice.importedJSON": "{{count}} tipo(s) de callout importado(s) de JSON.",
	"notice.importedSettings": "Configurações do plugin importadas.",
	"notice.importedCalloutManager": "Importado do Callout Manager: {{created}} criados, {{updated}} atualizados.",
	"notice.noNewJSON":
		"Nenhum novo tipo de callout foi importado (os IDs podem já existir).",
	"notice.iconDownloadFailed":
		'Não foi possível baixar o ícone Material "{{name}}". Pode estar indisponível para este estilo/peso, ou sua conexão pode estar offline.',
	"notice.nothingToWrap": "Nada para envolver.",
	"notice.cursorNotInsideCallout": "O cursor não está dentro de um callout.",
	"notice.openHotkeysFailed":
		"Não foi possível abrir as configurações de atalhos do Obsidian.",
	"notice.filterHotkeysFailed":
		"Atalhos do Obsidian abertos, mas não foi possível aplicar o filtro do Callout Studio.",

	"editor.editCallout": "Editar callout",
	"editor.newCallout": "Novo callout",
	"editor.displayName": "Nome de exibição",
	"editor.displayNameDesc": "O rótulo legível exibido na interface",
	"editor.displayNameBuiltIn":
		"O nome de exibição não pode ser alterado para callouts integrados",
	"editor.displayNamePlaceholder": "Meu callout",
	"editor.calloutIds": "IDs de callout",
	"editor.calloutIdsDesc":
		"Todos os identificadores para este callout. Espaços são permitidos.\nPressione Enter ou o botão + para adicionar.",
	"editor.calloutIdsPlaceholder": "Adicionar ID",
	"editor.addId": "Adicionar ID",
	"editor.idLinkedToName": "Vinculado ao nome de exibição",
	"editor.idCannotDelete":
		"Este ID está vinculado ao nome de exibição e não pode ser excluído — edite o nome para alterá-lo",
	"editor.icon": "Ícone",
	"editor.pickIcon": "Escolher ícone",
	"editor.livePreview": "Pré-visualização ao vivo",
	"editor.iconAdjustment": "Ajuste de ícone",
	"editor.picture": "Imagem",
	"editor.size": "Tamanho",
	"editor.horizontalOffset": "Deslocamento horizontal",
	"editor.verticalOffset": "Deslocamento vertical",
	"editor.colors": "Cores",
	"editor.paletteDeleted": "Cor excluída",
	"editor.paletteGroupObsidian": "Callouts do Obsidian",
	"editor.paletteGroupPresets": "Predefinições de cor",
	"editor.paletteGroupCustom": "Personalizado",
	"editor.paletteNewColor": "Nova cor…",
	"editor.contrastWarning":
		"Baixo contraste com o fundo — pode ser difícil de ler",
	"editor.foldable": "Dobrável",
	"editor.foldableDesc":
		"Escolha se o callout pode ser dobrado e qual estado padrão aplicar em todo o vault.",
	"editor.foldOff": "Desligado",
	"editor.foldOpen": "Aberto por padrão",
	"editor.foldClosed": "Fechado por padrão",
	"editor.cancel": "Cancelar",
	"editor.saveChanges": "Salvar alterações",
	"editor.createCallout": "Criar callout",
	"editor.nameRequired":
		"Um nome de exibição é necessário antes de criar um callout.",
	"editor.noChangesToSave": "Nenhuma alteração foi feita.",
	"editor.downloadingIcon": "Baixando ícone",
	"editor.idEmpty": "Pelo menos um ID é necessário",
	"editor.idExists": "Já existe um callout com este ID",
	"editor.idConflict": "Este ID entra em conflito com um callout existente",
	"editor.idDashConflict":
		'O Obsidian grava espaços como hífens, por isso este ID entra em conflito com "{{other}}"',
	"editor.untitledCallout": "Callout sem título",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText":
		"Aqui está uma pílula [!{id}] embutida dentro de um parágrafo.",
	"editor.previewReadOnly": "A pré-visualização ao vivo não pode ser editada",

	// Palette editor modal
	"palette.newTitle": "Nova paleta de cores",
	"palette.editTitle": "Editar paleta de cores",
	"palette.name": "Nome",
	"palette.namePlaceholder": "Minha paleta",
	"palette.nameExists": "Já existe uma paleta com esse nome",
	"palette.baseColor": "Cor base",
	"palette.baseColorHint":
		"Ajustaremos automaticamente a cor de fundo a esta. Se preferir, pode controlá-la separadamente ao {{link}}.",
	"palette.baseColorHintLink": "clicar aqui",
	"palette.advancedColors": "Cores",
	"palette.advancedColorsHint":
		"A editar as cores para o modo {{mode}} - o outro modo é atualizado automaticamente. Mude o tema do Obsidian para verificar.",
	"palette.revertHint": "Prefere usar uma única cor base? {{link}}.",
	"palette.revertHintLink": "Reverter",
	"palette.lightMode": "Claro",
	"palette.darkMode": "Escuro",
	"palette.accentColor": "Cor de destaque",
	"palette.backgroundColorChannel": "Cor de fundo",
	"palette.textColorChannel": "Cor do texto",
	"palette.bgIntensity": "Intensidade",
	"palette.bgStyle": "Estilo",
	"palette.bgSolid": "Sólido",
	"palette.bgGradient": "Gradiente",
	"palette.gradientTo": "Segunda cor",
	"palette.gradientDirection": "Direção",
	"palette.gradientText": "Texto do título em gradiente",
	"palette.save": "Salvar",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "Vermelho",
	"colorName.orange": "Laranja",
	"colorName.amber": "Âmbar",
	"colorName.yellow": "Amarelo",
	"colorName.lime": "Verde-limão",
	"colorName.green": "Verde",
	"colorName.teal": "Verde-azulado",
	"colorName.cyan": "Ciano",
	"colorName.sky": "Azul-celeste",
	"colorName.blue": "Azul",
	"colorName.indigo": "Índigo",
	"colorName.violet": "Violeta",
	"colorName.purple": "Roxo",
	"colorName.pink": "Rosa",
	"colorName.rose": "Rosé",
	"colorName.brown": "Marrom",
	"colorName.gray": "Cinza",
	"colorName.black": "Preto",
	"colorName.white": "Branco",
	"colorName.crimson": "Carmesim",
	"colorName.coral": "Coral",
	"colorName.grape": "Uva",
	"colorName.plum": "Ameixa",
	"colorName.bubblegum": "Chiclete",

	"iconPicker.pickIcon": "Escolher um ícone",
	"iconPicker.confirm": "Confirmar",
	"iconPicker.cancel": "Cancelar",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "pesquisar ícones Lucide",
	"iconPicker.searchTabler": "pesquisar ícones Tabler",
	"iconPicker.tablerStyle": "Estilo do ícone",
	"iconPicker.tablerStyleOutline": "Contorno (Outline)",
	"iconPicker.tablerStyleFilled": "Preenchido (Filled)",
	"iconPicker.loadMore": "Carregar mais",
	"iconPicker.materialStyle": "Estilo do ícone",
	"iconPicker.materialStyleOutlined": "Contorno (Outlined)",
	"iconPicker.materialStyleFilled": "Preenchido (Filled)",
	"iconPicker.materialStyleRounded": "Arredondado (Rounded)",
	"iconPicker.materialStyleSharp": "Afiado (Sharp)",
	"iconPicker.materialWeight": "Espessura do ícone",
	"iconPicker.materialWeight100": "Fino (Thin)",
	"iconPicker.materialWeight200": "Extra leve (Extra Light)",
	"iconPicker.materialWeight300": "Leve (Light)",
	"iconPicker.materialWeight400": "Normal (Regular)",
	"iconPicker.materialWeight500": "Médio (Medium)",
	"iconPicker.materialWeight600": "Semi-negrito (Semi Bold)",
	"iconPicker.materialWeight700": "Negrito (Bold)",
	"iconPicker.searchMaterial": "pesquisar ícones Material",
	"iconPicker.searchEmoji": "Pesquisar emojis",
	"iconPicker.skinTone": "Tom de pele",
	"iconPicker.allCategories": "Todas as categorias",
	"iconPicker.noIconSelected": "Nenhum ícone selecionado",
	"iconPicker.noResults": "Nenhum ícone corresponde à sua pesquisa.",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Pesquisar no Octicons",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Pesquisar no Font Awesome",
	"iconPicker.faStyle": "Estilo do ícone",
	"iconPicker.faStyleSolid": "Sólido (Solid)",
	"iconPicker.faStyleRegular": "Normal (Regular)",
	"iconPicker.faStyleBrands": "Marcas (Brands)",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "Pesquisar no RPG Awesome",
	"iconPicker.image": "As suas imagens",
	"iconPicker.searchImage": "Pesquisar nas suas imagens",
	"iconPicker.imageTooLarge":
		"{{name}} é demasiado grande. As imagens devem ter menos de 5 MB.",
	"iconPicker.imageUnsupported":
		"{{name}} não é um formato de imagem suportado. Use SVG, PNG, JPEG ou WebP.",
	"iconPicker.imageInvalidSvg":
		"{{name}} não foi possível ler como SVG seguro e não foi adicionado.",
	"iconPicker.imageDecodeFailed":
		"{{name}} não foi possível ler como imagem.",
	"iconPicker.imageDuplicate":
		"{{name}} já está nas suas imagens. Renomeie o ficheiro ou elimine a imagem existente.",
	"iconPicker.imageAdd": "Adicionar imagens",
	"iconPicker.imageEmpty":
		"Ainda sem imagens. Adicione um ficheiro SVG, PNG, JPEG ou WebP do seu computador, ou arraste-o para aqui.",
	"iconPicker.imageDelete": "Eliminar",
	"iconPicker.imageDeleteConfirm": "Eliminar “{{name}}”?",
	"iconPicker.imageDeleteInUse":
		"{{count}} callouts utilizam esta imagem. Mostrarão um ícone de marcador de posição até que forneça um novo.",
	"iconPicker.imageRecolor": "Seguir a cor do Callout",
	"iconPicker.allSources": "Todas as fontes",
	"iconPicker.searchAllSources": "Pesquisar em todas as fontes de ícones",
	"iconPicker.sourcesNotDownloaded":
		"Ainda não incluído: {{names}}. Escolha uma fonte acima para o descarregar.",
	"iconPicker.chooseSource": "Escolher fonte",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources": "pesquisar em todas as bibliotecas de uma vez",
	"iconPicker.descLucide": "o conjunto do Obsidian, sempre offline",
	"iconPicker.descTabler":
		"ícones de interface limpos e consistentes, contorno e preenchido",
	"iconPicker.descMaterial":
		"o conjunto do Google, quatro estilos e sete espessuras",
	"iconPicker.descEmoji": "glifos coloridos, cada tom de pele",
	"iconPicker.descOcticons": "ícones de interface do GitHub",
	"iconPicker.descFa": "sólido, regular e marcas",
	"iconPicker.descRpgAwesome": "ícones de fantasia e jogos de tabuleiro",
	"iconPicker.descImage": "imagens que adiciona do seu computador",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "Acessibilidade",
	"iconPicker.cat.Actions": "Ações",
	"iconPicker.cat.Activities": "Atividades",
	"iconPicker.cat.Alert": "Alerta",
	"iconPicker.cat.Alphabet": "Alfabeto",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "Animais",
	"iconPicker.cat.Arrows": "Setas",
	"iconPicker.cat.Astronomy": "Astronomia",
	"iconPicker.cat.Audio&Video": "Áudio e vídeo",
	"iconPicker.cat.Automotive": "Automóveis",
	"iconPicker.cat.Badges": "Emblemas",
	"iconPicker.cat.Brand": "Marcas",
	"iconPicker.cat.Buildings": "Edifícios",
	"iconPicker.cat.Business": "Negócios",
	"iconPicker.cat.Camping": "Campismo",
	"iconPicker.cat.Charity": "Caridade",
	"iconPicker.cat.Charts": "Gráficos",
	"iconPicker.cat.Charts + Diagrams": "Gráficos e diagramas",
	"iconPicker.cat.Childhood": "Infância",
	"iconPicker.cat.Clothing + Fashion": "Roupas e moda",
	"iconPicker.cat.Coding": "Programação",
	"iconPicker.cat.Communicate": "Comunicar",
	"iconPicker.cat.Communication": "Comunicação",
	"iconPicker.cat.Computers": "Computadores",
	"iconPicker.cat.Connectivity": "Conectividade",
	"iconPicker.cat.Construction": "Construção",
	"iconPicker.cat.Currencies": "Moedas",
	"iconPicker.cat.Database": "Base de dados",
	"iconPicker.cat.Design": "Design",
	"iconPicker.cat.Development": "Desenvolvimento",
	"iconPicker.cat.Devices": "Dispositivos",
	"iconPicker.cat.Devices + Hardware": "Dispositivos e hardware",
	"iconPicker.cat.Disaster + Crisis": "Desastres e crises",
	"iconPicker.cat.Document": "Documento",
	"iconPicker.cat.E-commerce": "Comércio eletrónico",
	"iconPicker.cat.Editing": "Edição",
	"iconPicker.cat.Education": "Educação",
	"iconPicker.cat.Electrical": "Elétrico",
	"iconPicker.cat.Emoji": "Emoji",
	"iconPicker.cat.Energy": "Energia",
	"iconPicker.cat.Extensions": "Extensões",
	"iconPicker.cat.Files": "Ficheiros",
	"iconPicker.cat.Film + Video": "Filmes e vídeo",
	"iconPicker.cat.Food": "Comida",
	"iconPicker.cat.Food + Beverage": "Comida e bebidas",
	"iconPicker.cat.Fruits + Vegetables": "Frutas e legumes",
	"iconPicker.cat.Games": "Jogos",
	"iconPicker.cat.Gaming": "Gaming",
	"iconPicker.cat.Gender": "Género",
	"iconPicker.cat.Genders": "Géneros",
	"iconPicker.cat.Gestures": "Gestos",
	"iconPicker.cat.Halloween": "Halloween",
	"iconPicker.cat.Hands": "Mãos",
	"iconPicker.cat.Hardware": "Hardware",
	"iconPicker.cat.Health": "Saúde",
	"iconPicker.cat.Holidays": "Feriados",
	"iconPicker.cat.Home": "Casa",
	"iconPicker.cat.Household": "Doméstico",
	"iconPicker.cat.Humanitarian": "Humanitário",
	"iconPicker.cat.Images": "Imagens",
	"iconPicker.cat.Laundry": "Lavandaria",
	"iconPicker.cat.Letters": "Letras",
	"iconPicker.cat.Logic": "Lógica",
	"iconPicker.cat.Logistics": "Logística",
	"iconPicker.cat.Map": "Mapa",
	"iconPicker.cat.Maps": "Mapas",
	"iconPicker.cat.Maritime": "Marítimo",
	"iconPicker.cat.Marketing": "Marketing",
	"iconPicker.cat.Math": "Matemática",
	"iconPicker.cat.Mathematics": "Matemática",
	"iconPicker.cat.Media": "Média",
	"iconPicker.cat.Media Playback": "Reprodução de média",
	"iconPicker.cat.Medical + Health": "Medicina e saúde",
	"iconPicker.cat.Money": "Dinheiro",
	"iconPicker.cat.Mood": "Humor",
	"iconPicker.cat.Moving": "Mudança",
	"iconPicker.cat.Music + Audio": "Música e áudio",
	"iconPicker.cat.Nature": "Natureza",
	"iconPicker.cat.Numbers": "Números",
	"iconPicker.cat.Photography": "Fotografia",
	"iconPicker.cat.Photos + Images": "Fotos e imagens",
	"iconPicker.cat.Political": "Político",
	"iconPicker.cat.Privacy": "Privacidade",
	"iconPicker.cat.Punctuation + Symbols": "Pontuação e símbolos",
	"iconPicker.cat.Religion": "Religião",
	"iconPicker.cat.Science": "Ciência",
	"iconPicker.cat.Science Fiction": "Ficção científica",
	"iconPicker.cat.Security": "Segurança",
	"iconPicker.cat.Shapes": "Formas",
	"iconPicker.cat.Shopping": "Compras",
	"iconPicker.cat.Social": "Redes sociais",
	"iconPicker.cat.Spinners": "Spinners",
	"iconPicker.cat.Sport": "Desporto",
	"iconPicker.cat.Sports + Fitness": "Desporto e fitness",
	"iconPicker.cat.Symbols": "Símbolos",
	"iconPicker.cat.System": "Sistema",
	"iconPicker.cat.Text": "Texto",
	"iconPicker.cat.Text Formatting": "Formatação de texto",
	"iconPicker.cat.Time": "Tempo",
	"iconPicker.cat.Toggle": "Interruptor",
	"iconPicker.cat.Transit": "Trânsito",
	"iconPicker.cat.Transportation": "Transporte",
	"iconPicker.cat.Travel": "Viagem",
	"iconPicker.cat.Travel + Hotel": "Viagem e hotel",
	"iconPicker.cat.UI actions": "Ações de interface",
	"iconPicker.cat.Users + People": "Utilizadores e pessoas",
	"iconPicker.cat.Vehicles": "Veículos",
	"iconPicker.cat.Version control": "Controlo de versões",
	"iconPicker.cat.Weather": "Meteorologia",
	"iconPicker.cat.Writing": "Escrita",
	"iconPicker.cat.Zodiac": "Zodíaco",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}} ainda não foi descarregado",
	"iconPack.downloadDetail":
		"{{count}} ícones · {{size}} · descarregamento único",
	"iconPack.download": "Descarregar",
	"iconPack.downloading": "A descarregar {{name}}…",
	"iconPack.downloadFailed":
		"Não foi possível descarregar {{name}}. Verifique a ligação e tente novamente.",
	"iconPack.retry": "Tentar novamente",
	"iconPack.faBrandsNotice":
		"Os ícones de marcas são marcas registadas dos respetivos proprietários. A sua inclusão não indica aprovação. Por favor, utilize-os apenas para representar a empresa, produto ou serviço a que se referem.",
	"iconPack.artworkRestored":
		"O artwork dos ícones para {{names}} foi descarregado.",
	"iconPack.diskWriteFailed":
		"O Callout Studio não conseguiu guardar o pacote de ícones no disco, pelo que precisará de ser descarregado novamente na próxima vez. Os ícones que escolher continuam guardados nas suas definições.",

	// Icon licences & credits
	"credits.title": "Licenças de ícones e créditos",
	"credits.intro":
		"O Callout Studio baseia-se em várias bibliotecas de ícones abertas. As suas licenças são reproduzidas abaixo, juntamente com o que foi modificado para as utilizar aqui.",
	"credits.fullNotices": "Avisos completos de terceiros",
	"credits.pluginLicense":
		"O código do Callout Studio está sob a licença 0BSD; as bibliotecas de ícones mantêm as suas próprias licenças.",

	"contextMenu.editCallout": "Editar configurações do callout",
	"contextMenu.copyMarkdown": "Copiar Markdown do callout",
	"contextMenu.openSettings": "Abrir configurações do Callout Studio",
	"contextMenu.setFoldClosed": "Definir o callout como fechado (-)",
	"contextMenu.setFoldOpen": "Definir o callout como aberto (+)",
	"contextMenu.setFoldNone": "Tornar o callout não dobrável",
	"contextMenu.cutSection": "Recortar seção do cabeçalho",
	"contextMenu.copySection": "Copiar seção do cabeçalho",
	"contextMenu.deleteSection": "Excluir seção do cabeçalho",
	"heading.toggleFold": "Alternar dobra",
	"settings.globalSettings": "Configurações globais",
	"settings.globalSettingsDesc":
		"Ajuste com precisão a aparência de cada tipo de callout em todo o vault.",
	"settings.globalSettingsRegularDesc":
		"Adicione um token de callout a uma citação em bloco (por exemplo, `> [!type]`) para renderizar a caixa de callout integrada do Obsidian. Você pode ajustar a borda, o arredondamento, a escala de fonte e o alinhamento.",
	"settings.globalSettingsHeadingDesc":
		"Adicione um token de callout logo após os símbolos # do cabeçalho (por exemplo, `## [!type]`) para renderizá-lo como um cabeçalho de callout estilizado. Você pode ajustar a borda, a forma e o espaçamento vertical.",
	"settings.globalSettingsInlineDesc":
		"Adicione um token de callout em qualquer parte de uma linha de texto (por exemplo, `[!type]`) para renderizá-lo como uma pequena pílula em linha. Você pode ajustar a borda e a forma.",
	"settings.globalSettingsCustomize": "Personalizar",
	"settings.calloutTypeRegular": "Callout regular",
	"settings.calloutTypeHeading": "Callout de cabeçalho",
	"settings.calloutTypeInline": "Callout em linha",
	"settings.customizeMenu": "Personalizar itens do menu",
	"settings.customizeMenuDesc":
		"Escolha quais ações de clique direito aparecem para cada tipo de callout e reordene-as. Funciona no modo de fonte e Pré-visualização ao vivo.",
	"settings.customizeMenuButton": "Personalizar itens do menu",
	"menuCustomize.title": "Personalizar menu de clique direito",
	"menuCustomize.desc":
		"Ative ou desative ações e arraste a alça para reordená-las. As alterações são salvas automaticamente.",
	"menuCustomize.regular": "Callout regular",
	"menuCustomize.heading": "Callout de cabeçalho",
	"menuCustomize.inline": "Callout em linha",
	"menuCustomize.dragHandle": "Arrastar para reordenar",
	"menuItem.edit": "Editar callout",
	"menuItem.openSettings": "Abrir configurações",
	"menuItem.copyMarkdown": "Copiar Markdown",
	"menuItem.foldDefaults": "Padrões de dobra (aberto / fechado / nenhum)",
	"menuItem.cutSection": "Recortar seção",
	"menuItem.copySection": "Copiar seção",
	"menuItem.deleteSection": "Excluir seção",

	"confirm.ok": "Excluir",
	"confirm.cancel": "Cancelar",

	"vault.filesUpdated":
		"{{count}} referência(s) de callout atualizadas nos arquivos do vault.",
	"vault.idsUpdated":
		"{{count}} ID(s) de callout atualizados nos arquivos do vault: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"{{count}} título(s) de callout atualizados nos arquivos do vault: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "Substituir por:",
	"vault.deleteWithout": "Excluir sem substituir",
	"vault.confirmDelete": "Confirmar",
	"vault.confirmReplace": "Substituir",
	"vault.replacePromptInUse":
		'"{{name}}" é usado {{count}} vez(es) em {{files}} arquivo(s). Escolha um callout para substituí-lo:',
	"vault.replacePromptUnused":
		'Escolha um callout para substituir "{{name}}":',
	"vault.noReplacementAvailable":
		"Nenhum outro callout disponível para substituir este.",
	"vault.convertedToPlainText":
		"{{blocks}} bloco(s) de callout em {{files}} arquivo(s) convertidos para texto simples.",
	"vault.resetAliasWarning":
		"{{count}} referência(s) em {{files}} arquivo(s) usam alias personalizados: {{aliases}}. Esses deixarão de funcionar após a redefinição. Continuar?",
	"vault.resetConfirm": "Redefinir",
	"vault.resetAllInUse":
		"⚠ {{count}} referência(s) de callout em {{files}} arquivo(s) usam tipos de callout personalizados que serão excluídos.",

	"vaultStats.title": "Estatísticas de callouts",
	"vaultStats.totalCallouts": "Total de callouts",
	"vaultStats.typesFound": "Tipos encontrados",
	"vaultStats.filesWithCallouts": "Arquivos com callouts",
	"vaultStats.filesScanned": "Arquivos Markdown digitalizados",
	"vaultStats.empty": "Nenhum callout encontrado em notas Markdown.",
	"vaultStats.columnType": "Tipo",
	"vaultStats.columnName": "Nome",
	"vaultStats.columnSource": "Fonte",
	"vaultStats.columnCount": "Quantidade",
	"vaultStats.columnFiles": "Arquivos",
	"vaultStats.unknown": "Desconhecido",
	"vaultStats.sourceBuiltIn": "Integrado",
	"vaultStats.sourceCustom": "Personalizado",
	"vaultStats.sourceAutoFallback": "Fallback automático",
	"vaultStats.sourceTheme": "Trecho CSS",
	"vaultStats.sourceAlias": "Alias de {{id}}",
	"vaultStats.sourceUnknown": "Desconhecido",
	"vaultStats.close": "Fechar",

	"import.title": "Problemas de importação",
	"import.reportLeadIn":
		"Parece que o arquivo que você importou foi modificado. Aqui está a lista de problemas:",
	"import.reportLeadInFatal":
		"Este arquivo não parece ser uma exportação do Callout Studio. Não pode ser importado:",
	"import.entryHeading": "Entrada {{index}} — {{label}}",
	"import.summary":
		"{{valid}} de {{total}} entradas são válidas · {{issues}} problema(s) encontrado(s).",
	"import.btnCancel": "Cancelar",
	"import.btnImportValid": "Importar apenas as válidas ({{count}})",
	"import.err.notRecognized":
		"Arquivo não reconhecido: esperava-se um array de definições de callout ou uma exportação do Callout Studio.",
	"import.warn.settingsIgnored":
		"O bloco de configurações não era um objeto válido e foi ignorado.",
	"import.warn.invalidGradient":
		"O gradiente de fundo era inválido e foi ignorado.",
	"import.err.parseFailed":
		"O arquivo não é JSON válido e não pôde ser analisado.",
	"import.err.entryNotObject": "A entrada deve ser um objeto.",
	"import.err.requiredMissing":
		'O campo obrigatório "{{field}}" está ausente ou tem o tipo errado.',
	"import.err.idEmpty": "O ID não deve estar vazio.",
	"import.err.idTooLong":
		'O ID "{{value}}" tem {{length}} caracteres; o máximo é {{max}}.',
	"import.err.idBadChar":
		'O ID "{{value}}" contém caracteres inválidos ("|", "[", "]", tabulações e quebras de linha não são permitidos).',
	"import.err.displayNameEmpty": "O nome de exibição não deve estar vazio.",
	"import.err.displayNameTooLong":
		"O nome de exibição tem {{length}} caracteres; o máximo é {{max}}.",
	"import.err.boolField": '"{{field}}" deve ser um booleano (true ou false).',
	"import.err.iconNotObject": "O ícone deve ser um objeto.",
	"import.err.iconTypeInvalid":
		'O tipo de ícone "{{value}}" não é um de: {{types}}.',
	"import.warn.iconFieldIgnored":
		'"{{field}}" aplica-se apenas a ícones Material e é ignorado para o tipo de ícone {{type}}.',
	"import.err.iconValueEmpty":
		"O valor do ícone deve ser uma string não vazia.",
	"import.err.iconValueTooLong":
		"O valor do ícone é incomumente longo ({{length}} caracteres).",
	"import.err.materialStyle":
		'O estilo de ícone Material "{{value}}" não é um de: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'O peso do ícone Material "{{value}}" deve ser um inteiro entre 100 e 700, em passos de 100.',
	"import.warn.iconRecolorIgnored":
		'"recolor" aplica-se apenas às suas próprias imagens e é ignorado para o tipo de ícone {{type}}.',
	"import.err.iconRecolorInvalid":
		'"recolor" deve ser true ou false (recebido: "{{value}}").',
	"import.err.colorInvalid":
		'"{{field}}" deve ser uma cor hexadecimal como "#448aff" (recebido "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" deve ser um número entre {{min}} e {{max}} (recebido "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" deve ser um número entre {{min}} e {{max}} (recebido "{{value}}").',
	"import.err.aliasesNotArray": '"aliases" deve ser um array de strings.',
	"import.err.aliasNotString": "O alias deve ser uma string.",
	"import.err.aliasDup":
		'O alias "{{value}}" está duplicado dentro desta entrada.',
	"import.err.tooManyIds":
		"Muitos IDs ({{count}}); cada callout pode ter no máximo {{max}} IDs (principal + aliases).",
	"import.err.metadataShape":
		'"metadata" deve ser um objeto cujos valores sejam todos strings.',
	"import.warn.unknownFields": "Campos desconhecidos ignorados: {{fields}}.",
	"import.err.duplicateInFile":
		'O ID/alias "{{value}}" já está em uso pela entrada #{{first}} neste arquivo.',
	"import.err.aliasConflict":
		'O alias "{{value}}" já está em uso por outro callout ("{{other}}") no seu vault.',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" era true enquanto "foldable" era false; defaultFolded foi redefinido para false.',
	"import.warn.imageMissing":
		"Este Callout usa uma imagem que não está no ficheiro nem neste vault, pelo que mostrará um ícone de marcador de posição até que forneça um novo.",

		"import.err.paletteIdInvalid": "\"paletteId\" deve ser um ID de texto não vazio (recebido \"{{value}}\").",
	"import.warn.iconNameUnknown": "Não existe o ícone \"{{value}}\" em {{type}}, por isso foi usado o ícone padrão.",
	"import.warn.cmIconUnknownNew": "Não existe o ícone \"{{value}}\" no Obsidian, por isso foi usado o ícone padrão.",
	"import.warn.cmIconUnknownExisting": "Não existe o ícone \"{{value}}\" no Obsidian, por isso \"{{id}}\" manteve o ícone que já tinha.",
	"import.chooseSource": "Importar de",
	"import.sourceStudio": "Callout Studio",
	"import.sourceStudioDesc": "Carregar um arquivo .json exportado do Callout Studio.",
	"import.sourceCalloutManager": "Callout Manager",
	"import.sourceCalloutManagerDesc": "Cole os estilos que copiou pelo botão Copy do Callout Manager.",
	"import.sourceAdmonition": "Admonition",
	"import.sourceAdmonitionDesc": "Ainda não disponível.",
	"import.sourceAdmonitionNotice": "A importação do Admonition ainda não é suportada.",
	"import.cmTitle": "Importar do Callout Manager",
	"import.cmInstructions": "No Callout Manager, use o botão Copy para copiar os estilos de callout personalizados e depois cole-os abaixo.",
	"import.cmPlaceholder": "Cole os estilos copiados aqui…",
	"import.cmBtnCancel": "Cancelar",
	"import.cmBtnImport": "Importar",
	"import.err.cmNoBlocksFound": "Nenhum estilo do Callout Manager foi encontrado no texto colado.",
	"import.err.cmNoColorForNew": "Nenhuma cor utilizável foi encontrada para o novo callout \"{{value}}\"; foi ignorado.",
	"import.err.cmIdConflict": "O ID \"{{value}}\" já está sendo usado como alias por outro callout (\"{{other}}\") e foi ignorado.",

	"footer.tagline":
		"Tem feedback, comentários ou sugestões? Adoraria ouvir de você!",
	"footer.madeBy": "Feito por Niv  •  ",
};
