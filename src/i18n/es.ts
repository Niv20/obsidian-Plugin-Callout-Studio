export const es: Record<string, string> = {
	"cmd.openSettings": "Abrir ajustes",
	"cmd.createCallout": "Crear nuevo tipo de callout",
	"cmd.insertEmptyCallout": "Insertar callout vacío",
	"cmd.calloutWrap": "Envolver en callout",
	"cmd.calloutUnwrap": "Desenvolver del callout",

	"autocomplete.createNew": 'Crear nuevo callout: "{{name}}"',

	"settings.fallbackTag": "Predeterminado",
	"settings.fallbackTagAuto": "Predeterminado automático",
	"settings.rescanVault": "Volver a escanear el vault",
	"settings.rescanVaultDesc":
		"Busca IDs de callout no reconocidos en las notas y los añade como filas de reserva.",
	"settings.rescanVaultHintAction": "Escanear ahora",
	"settings.rescanComplete":
		"Reescaneo completo: {{count}} nuevo(s) callout(s) añadido(s).",
	"replaceModal.deleteWithoutReplaceSuffix": "(vuelve al predeterminado)",

	"firstRun.title": "¿Buscar callouts existentes en su vault?",
	"firstRun.body":
		"Callout Studio puede escanear su vault para descubrir callouts que ya usa, de modo que aparezcan en su lista de ajustes y adopten su estilo de reserva.",
	"firstRun.heavyVaultNote":
		"Su vault tiene {{count}} archivos Markdown — el escaneo puede tardar unos segundos.",
	"firstRun.laterHint":
		"Siempre puede ejecutar esto más tarde desde Ajustes → Información y mantenimiento del vault → Volver a escanear el vault.",
	"firstRun.scanNow": "Escanear ahora",
	"firstRun.noThanks": "No, gracias",
	"firstRun.autoScanComplete":
		"Callout Studio escaneó su vault y añadió {{count}} callout(s).",
	"firstRun.scanning": "Escaneando",

	"welcome.tooltip": "Acerca de Callout Studio",
	"welcome.title": "Bienvenido a Callout Studio",
	"welcome.tagline":
		"Su solución completa para gestionar callouts de Obsidian.",
	"welcome.previewTitle": "Véalo en acción",
	"welcome.sample":
		"Callout Studio le permite crear callouts con un icono, colores y nombre personalizados.\n\n" +
		"Puede usar el mismo callout de **tres** formas diferentes:\n\n" +
		"## [!tip] Como encabezado\n" +
		"Para convertir cualquier encabezado en un encabezado con estilo de callout, añada `[!type]` justo después de las `#`.\n\n" +
		"¿Quiere un callout en línea como este [!warning]? Simplemente añada `[!type]` dentro de una frase, sin interrumpir su flujo.\n\n" +
		"> [!note] Callout normal\n" +
		"> Por supuesto, el callout clásico funciona con la misma sintaxis de siempre: `> [!type]`.\n\n" +
		"¡Callout Studio tiene mucho más para ofrecer! [Más información]({{repoUrl}}).\n",

	"deleteModal.title": '¿Eliminar callout "{{name}}"?',
	"deleteModal.bodyInUse":
		"Este callout aparece {{count}} vez/veces en {{files}} archivo(s).",
	"deleteModal.bodyInUseExplain":
		"Al eliminar se convertirán esos bloques a texto sin formato — perderán el estilo y el encabezado del callout.",
	"deleteModal.replaceHint":
		"Puede reemplazarlo por otro callout en su lugar, lo que mantiene el contenido del vault como un callout con estilo.",
	"deleteModal.bodyUnused":
		'"{{name}}" no se usa en ninguna nota, pero es un callout personalizado que creó. Al eliminar se quitará de esta lista.',
	"deleteModal.replaceInstead": "Reemplazar en su lugar",
	"deleteModal.deleteInUse": "Eliminar (convertir a texto sin formato)",
	"deleteModal.deleteUnused": "Eliminar callout",

	"settings.title": "Callout Studio",
	"settings.myCalloutTypes": "Mis tipos de callout",
	"settings.builtInCallouts": "Callouts integrados",
	"settings.contextMenu": "Menú contextual",
	"settings.autocomplete": "Autocompletar",
	"settings.keyboardShortcuts": "Atajos de teclado",
	"settings.language": "Idioma",
	"settings.languageDesc":
		"Idioma de visualización de Callout Studio. Por defecto sigue el idioma de la interfaz de Obsidian.",
	"settings.languageAuto": "Automático (igual que Obsidian)",
	"settings.importExport": "Importar / exportar",
	"settings.import": "Importar",
	"settings.export": "Exportar",
	"settings.importDesc":
		"Importe su progreso de Callout Studio desde otro vault usando un archivo JSON.",
	"settings.exportDesc":
		"Guarde todos sus tipos de callout personalizados en formato JSON.",
	"settings.importConflictNotice":
		"Se importaron {{count}} tipo(s) de callout; se sobrescribieron {{overwritten}} entradas existentes.",

	"settings.addNewCallout": "+ añadir nuevo callout",

	"settings.noCalloutsNow": "Por ahora no hay callouts personalizados.",

	"settings.editAria": "Editar {{name}}",
	"settings.moreRowActionsAria": "Más acciones para {{name}}",
	"settings.usageInfo": "{{count}} uso(s) en {{files}} archivo(s)",
	"settings.replaceAction": "Reemplazar en el vault",
	"settings.deleteAction": "Eliminar",
	"settings.resetAction": "Restablecer a predeterminado",
	"settings.makeFallbackAction": "Usar estilo de reserva predeterminado",
	"settings.colorSwatchAria": "Acento: {{accent}} · Fondo: {{bg}}",

	"settings.fallbackCallout": "Callout de reserva predeterminado",
	"settings.fallbackCalloutDesc":
		"Los tipos de callout no reconocidos en su vault heredarán el estilo de este callout.",

	"settings.globalStyle": "Estilo global de callout",
	"settings.border": "Bordes",
	"settings.borderAll": "Todos",
	"settings.borderTop": "Superior",
	"settings.borderRight": "Derecho",
	"settings.borderBottom": "Inferior",
	"settings.borderLeft": "Izquierdo",
	"settings.borderWidth": "Grosor del borde",
	"settings.fontScaleGroup": "Escala de fuente",
	"settings.titleScale": "Título",
	"settings.contentScale": "Contenido",
	"settings.inlineTextScale": "Texto",
	"settings.shapeGroup": "Forma",
	"settings.borderRadius": "Redondeo de esquinas",
	"settings.alignGroup": "Alineación",
	"settings.alignContent": "Alinear contenido con el título",
	"settings.headingSpacingGroup": "Espaciado del título",
	"settings.headingPadVertical": "Espaciado vertical",
	"settings.headingGap": "Espacio entre encabezados",
	"settings.headingFoldGroup": "Plegar",
	"settings.headingFoldArrow": "Mostrar flecha de pliegue",
	"settings.styleDemoName": "Ejemplo",
	"settings.previewTitle": "Vista previa",

	// Settings — Saved color palettes
	"settings.customPalettes": "Paletas de colores guardadas",
	"settings.newPalette": "Nueva paleta",
	"settings.customPalettesEmpty": "Por ahora no hay paletas guardadas.",
	"settings.editPaletteAria": "Editar paleta {{name}}",
	"settings.deletePaletteAria": "Eliminar paleta {{name}}",
	"settings.deletePaletteConfirm":
		'¿Eliminar la paleta "{{name}}"?\nLos callouts que usan sus colores no se ven afectados.',
	"settings.enableAutocomplete": "Habilitar autocompletar [!",
	"settings.enableAutocompleteDesc":
		'Muestra sugerencias cuando escribe "[!" dentro de una cita en el editor. Elija un tipo de callout de la lista para insertar un encabezado de callout completo.',

	"settings.openHotkeys": "Atajos de Callout Studio",
	"settings.openHotkeysDesc":
		"Abre los ajustes de atajos de Obsidian para los comandos de Callout Studio, donde puede elegir sus propios atajos para Crear nuevo tipo de callout, Abrir ajustes, Desenvolver del callout y Envolver en callout. No hay atajos asignados por defecto.",
	"settings.openHotkeysButton": "Abrir ajustes de atajos",

	"settings.vaultMaintenance": "Información y mantenimiento del vault",
	"settings.vaultStats": "Estadísticas de callouts",
	"settings.vaultStatsDesc":
		"Cuenta todos los bloques de callout en sus notas Markdown y los agrupa por tipo.",
	"settings.vaultStatsButton": "Ver estadísticas",
	"settings.vaultStatsScanning": "Escaneando",
	"settings.resetAll": "Restablecer",
	"settings.resetAllDesc":
		"Elimina todos los callouts de usuario, restablece los callouts integrados, los estilos globales (bordes, escala de fuente, forma), las paletas de colores guardadas, la personalización del menú de clic derecho y los SVG de Material descargados.",
	"settings.resetAllButton": "Restablecer todo",
	"settings.resetAllConfirm":
		"Esto eliminará todos los callouts personalizados, restablecerá los callouts integrados, los estilos globales, las paletas de colores guardadas, la personalización del menú de clic derecho y todos los SVG de Material en caché. Esta acción no se puede deshacer. ¿Está seguro?",
	"notice.resetAllDone":
		"Todo se ha restablecido a los valores predeterminados.",

	"notice.exported": "Callouts exportados a callout-studio-export.json",
	"notice.importedJSON":
		"Se importaron {{count}} tipo(s) de callout desde JSON.",
	"notice.importedSettings": "Se importó la configuración del complemento.",
	"notice.importedCalloutManager":
		"Importado desde Callout Manager: {{created}} creados, {{updated}} actualizados.",
	"notice.importedAdmonition":
		"Importado desde Admonition: {{created}} creados, {{updated}} " +
		"actualizados.",
	"notice.noNewJSON":
		"No se importaron nuevos tipos de callout (los IDs pueden ya existir).",
	"notice.iconDownloadFailed":
		'No se pudo descargar el icono Material "{{name}}". Es posible que no esté disponible para este estilo/grosor, o que la conexión esté sin conexión.',
	"notice.nothingToWrap": "No hay nada para envolver.",
	"notice.cursorNotInsideCallout": "El cursor no está dentro de un callout.",
	"notice.openHotkeysFailed":
		"No se pudo abrir los ajustes de atajos de Obsidian.",
	"notice.filterHotkeysFailed":
		"Se abrieron los atajos de Obsidian, pero no se pudo aplicar el filtro de Callout Studio.",

	"editor.editCallout": "Editar callout",
	"editor.newCallout": "Nuevo callout",
	"editor.displayName": "Nombre para mostrar",
	"editor.displayNameDesc": "La etiqueta legible mostrada en la interfaz",
	"editor.displayNameBuiltIn":
		"El nombre para mostrar no se puede cambiar para callouts integrados",
	"editor.displayNamePlaceholder": "Mi callout",
	"editor.calloutIds": "IDs de callout",
	"editor.calloutIdsDesc":
		"Todos los identificadores de este callout. Se permiten espacios.\nPresione Enter o el botón + para añadir.",
	"editor.calloutIdsPlaceholder": "Añadir ID",
	"editor.addId": "Añadir ID",
	"editor.idLinkedToName": "Vinculado al nombre para mostrar",
	"editor.idCannotDelete":
		"Este ID está vinculado al nombre para mostrar y no se puede eliminar — edite el nombre para cambiarlo",
	"editor.icon": "Icono",
	"editor.pickIcon": "Elegir icono",
	"editor.resetIcon": "Restablecer icono al predeterminado",
	"editor.livePreview": "Vista previa en vivo",
	"editor.iconAdjustment": "Ajuste de icono",
	"editor.picture": "Imagen",
	"editor.size": "Tamaño",
	"editor.horizontalOffset": "Desplazamiento horizontal",
	"editor.verticalOffset": "Desplazamiento vertical",
	"editor.colors": "Colores",
	"editor.colorsDesc":
		"Sets this callout's border, background, and text colors.",
	"editor.resetColors": "Restablecer colores al predeterminado",
	"editor.paletteDeleted": "Color eliminado",
	"editor.paletteGroupObsidian": "Callouts de Obsidian",
	"editor.paletteGroupPresets": "Preajustes de color",
	"editor.paletteGroupCustom": "Personalizado",
	"editor.paletteNewColor": "Nuevo color…",
	"editor.contrastWarning":
		"Contraste bajo con el fondo — puede ser difícil de leer",
	"editor.foldable": "Plegable",
	"editor.foldableDesc":
		"Elija si el callout se puede plegar y qué estado predeterminado aplicar en todo el vault.",
	"editor.foldOff": "Desactivado",
	"editor.foldOpen": "Abierto por defecto",
	"editor.foldClosed": "Cerrado por defecto",
	"editor.cancel": "Cancelar",
	"editor.saveChanges": "Guardar cambios",
	"editor.createCallout": "Crear callout",
	"editor.nameRequired":
		"Se requiere un nombre para mostrar antes de crear un callout.",
	"editor.noChangesToSave": "No se realizaron cambios.",
	"editor.downloadingIcon": "Descargando icono",
	"editor.idEmpty": "Se requiere al menos un ID",
	"editor.idExists": "Ya existe un callout con este ID",
	"editor.idConflict": "Este ID entra en conflicto con un callout existente",
	"editor.idDashConflict":
		'Obsidian escribe los espacios como guiones, por lo que este ID coincide con "{{other}}"',
	"editor.untitledCallout": "Callout sin título",
	"editor.loremIpsum":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"editor.loremIpsumShort":
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"editor.sampleInlineText":
		"Aquí hay una píldora [!{id}] insertada dentro de un párrafo.",
	"editor.previewReadOnly": "La vista previa en vivo no se puede editar",

	// Palette editor modal
	"palette.newTitle": "Nueva paleta de colores",
	"palette.editTitle": "Editar paleta de colores",
	"palette.name": "Nombre",
	"palette.namePlaceholder": "Mi paleta",
	"palette.nameExists": "Ya existe una paleta con este nombre",
	"palette.baseColor": "Color base",
	"palette.baseColorHint":
		"Ajustaremos automáticamente el color de fondo a este. Si lo prefieres, puedes controlarlo por separado {{link}}.",
	"palette.baseColorHintLink": "haciendo clic aquí",
	"palette.advancedColors": "Colores",
	"palette.advancedColorsHint":
		"Editando los colores del modo {{mode}}: el otro modo se actualiza automáticamente. Cambia el tema de Obsidian para comprobarlo.",
	"palette.revertHint": "¿Prefieres usar un único color base? {{link}}.",
	"palette.revertHintLink": "Revertir",
	"palette.lightMode": "Claro",
	"palette.darkMode": "Oscuro",
	"palette.accentColor": "Color de acento",
	"palette.backgroundColorChannel": "Color de fondo",
	"palette.textColorChannel": "Color de texto",
	"palette.bgIntensity": "Intensidad",
	"palette.bgStyle": "Estilo",
	"palette.bgSolid": "Sólido",
	"palette.bgGradient": "Degradado",
	"palette.gradientTo": "Segundo color",
	"palette.gradientDirection": "Dirección",
	"palette.gradientText": "Texto de título en degradado",
	"palette.save": "Guardar",

	// Color name suggestions (used to prefill palette names)
	"colorName.red": "Rojo",
	"colorName.orange": "Naranja",
	"colorName.amber": "Ámbar",
	"colorName.yellow": "Amarillo",
	"colorName.lime": "Lima",
	"colorName.green": "Verde",
	"colorName.teal": "Verde azulado",
	"colorName.cyan": "Cian",
	"colorName.sky": "Celeste",
	"colorName.blue": "Azul",
	"colorName.indigo": "Índigo",
	"colorName.violet": "Violeta",
	"colorName.purple": "Morado",
	"colorName.pink": "Rosa",
	"colorName.rose": "Rosado",
	"colorName.brown": "Marrón",
	"colorName.gray": "Gris",
	"colorName.black": "Negro",
	"colorName.white": "Blanco",
	"colorName.crimson": "Carmesí",
	"colorName.coral": "Coral",
	"colorName.grape": "Uva",
	"colorName.plum": "Ciruela",
	"colorName.bubblegum": "Chicle",

	"iconPicker.pickIcon": "Elegir un icono",
	"iconPicker.confirm": "Confirmar",
	"iconPicker.cancel": "Cancelar",
	"iconPicker.lucide": "Lucide",
	"iconPicker.tabler": "Tabler Icons",
	"iconPicker.material": "Material",
	"iconPicker.emoji": "Emoji",
	"iconPicker.searchLucide": "buscar iconos Lucide",
	"iconPicker.searchTabler": "buscar iconos Tabler",
	"iconPicker.tablerStyle": "Estilo del icono",
	"iconPicker.tablerStyleOutline": "Contorno (Outline)",
	"iconPicker.tablerStyleFilled": "Relleno (Filled)",
	"iconPicker.loadMore": "Cargar más",
	"iconPicker.materialStyle": "Estilo del icono",
	"iconPicker.materialStyleOutlined": "Contorno (Outlined)",
	"iconPicker.materialStyleFilled": "Relleno (Filled)",
	"iconPicker.materialStyleRounded": "Redondeado (Rounded)",
	"iconPicker.materialStyleSharp": "Afilado (Sharp)",
	"iconPicker.materialWeight": "Peso del icono",
	"iconPicker.materialWeight100": "Delgado (Thin)",
	"iconPicker.materialWeight200": "Extra ligero (Extra Light)",
	"iconPicker.materialWeight300": "Ligero (Light)",
	"iconPicker.materialWeight400": "Normal (Regular)",
	"iconPicker.materialWeight500": "Medio (Medium)",
	"iconPicker.materialWeight600": "Seminegrita (Semi Bold)",
	"iconPicker.materialWeight700": "Negrita (Bold)",
	"iconPicker.searchMaterial": "buscar iconos Material",
	"iconPicker.searchEmoji": "Buscar emojis",
	"iconPicker.skinTone": "Tono de piel",
	"iconPicker.allCategories": "Todas las categorías",
	"iconPicker.noIconSelected": "Ningún icono seleccionado",
	"iconPicker.noResults": "Ningún icono coincide con su búsqueda.",
	"iconPicker.octicons": "Octicons",
	"iconPicker.searchOcticons": "Buscar en Octicons",
	"iconPicker.fa": "Font Awesome",
	"iconPicker.searchFa": "Buscar en Font Awesome",
	"iconPicker.faStyle": "Estilo del icono",
	"iconPicker.faStyleSolid": "Sólido (Solid)",
	"iconPicker.faStyleRegular": "Normal (Regular)",
	"iconPicker.faStyleBrands": "Marcas (Brands)",
	"iconPicker.rpgAwesome": "RPG Awesome",
	"iconPicker.searchRpgAwesome": "Buscar en RPG Awesome",
	"iconPicker.image": "Tus imágenes",
	"iconPicker.searchImage": "Buscar en tus imágenes",
	"iconPicker.imageTooLarge":
		"{{name}} es demasiado grande. Las imágenes deben ser menores de 5 MB.",
	"iconPicker.imageUnsupported":
		"{{name}} no es un formato de imagen compatible. Usa SVG, PNG, JPEG o WebP.",
	"iconPicker.imageInvalidSvg":
		"{{name}} no se pudo leer como SVG seguro y no se añadió.",
	"iconPicker.imageDecodeFailed": "{{name}} no se pudo leer como imagen.",
	"iconPicker.imageDuplicate":
		"{{name}} ya está en tus imágenes. Renombra el archivo o elimina la imagen existente.",
	"iconPicker.imageAdd": "Añadir imágenes",
	"iconPicker.imageEmpty":
		"Todavía no hay imágenes. Añade un archivo SVG, PNG, JPEG o WebP desde tu ordenador o arrástralo aquí.",
	"iconPicker.imageDelete": "Eliminar",
	"iconPicker.imageDeleteConfirm": "¿Eliminar “{{name}}”?",
	"iconPicker.imageDeleteInUse":
		"{{count}} callouts usan esta imagen. Mostrarán un icono de marcador de posición hasta que proporciones uno nuevo.",
	"iconPicker.imageRecolor": "Seguir color del Callout",
	"iconPicker.allSources": "Todas las fuentes",
	"iconPicker.searchAllSources": "Buscar en todas las fuentes de iconos",
	"iconPicker.sourcesNotDownloaded":
		"Aún no incluido: {{names}}. Selecciona una fuente arriba para descargarlo.",
	"iconPicker.chooseSource": "Elegir fuente",
	"iconPicker.sourceGroup": "{{name}} · {{count}}",

	// Source menu — what each library holds, in a few words
	"iconPicker.descAllSources": "buscar en todas las bibliotecas a la vez",
	"iconPicker.descLucide":
		"el conjunto propio de Obsidian, siempre sin conexión",
	"iconPicker.descTabler":
		"iconos de interfaz limpios y consistentes, contorno y relleno",
	"iconPicker.descMaterial":
		"el conjunto de Google, cuatro estilos y siete pesos",
	"iconPicker.descEmoji": "glifos de colores, cada tono de piel",
	"iconPicker.descOcticons": "iconos de interfaz de GitHub",
	"iconPicker.descFa": "sólido, regular y marcas",
	"iconPicker.descRpgAwesome": "iconos de fantasía y juegos de mesa",
	"iconPicker.descImage": "imágenes que añades desde tu ordenador",

	// Icon picker — category filter dropdown labels
	"iconPicker.cat.Accessibility": "Accesibilidad",
	"iconPicker.cat.Actions": "Acciones",
	"iconPicker.cat.Activities": "Actividades",
	"iconPicker.cat.Alert": "Alerta",
	"iconPicker.cat.Alphabet": "Alfabeto",
	"iconPicker.cat.Android": "Android",
	"iconPicker.cat.Animals": "Animales",
	"iconPicker.cat.Arrows": "Flechas",
	"iconPicker.cat.Astronomy": "Astronomía",
	"iconPicker.cat.Audio&Video": "Audio y vídeo",
	"iconPicker.cat.Automotive": "Automoción",
	"iconPicker.cat.Badges": "Insignias",
	"iconPicker.cat.Brand": "Marcas",
	"iconPicker.cat.Buildings": "Edificios",
	"iconPicker.cat.Business": "Negocios",
	"iconPicker.cat.Camping": "Camping",
	"iconPicker.cat.Charity": "Caridad",
	"iconPicker.cat.Charts": "Gráficos",
	"iconPicker.cat.Charts + Diagrams": "Gráficos y diagramas",
	"iconPicker.cat.Childhood": "Infancia",
	"iconPicker.cat.Clothing + Fashion": "Ropa y moda",
	"iconPicker.cat.Coding": "Programación",
	"iconPicker.cat.Communicate": "Comunicar",
	"iconPicker.cat.Communication": "Comunicación",
	"iconPicker.cat.Computers": "Ordenadores",
	"iconPicker.cat.Connectivity": "Conectividad",
	"iconPicker.cat.Construction": "Construcción",
	"iconPicker.cat.Currencies": "Monedas",
	"iconPicker.cat.Database": "Base de datos",
	"iconPicker.cat.Design": "Diseño",
	"iconPicker.cat.Development": "Desarrollo",
	"iconPicker.cat.Devices": "Dispositivos",
	"iconPicker.cat.Devices + Hardware": "Dispositivos y hardware",
	"iconPicker.cat.Disaster + Crisis": "Desastres y crisis",
	"iconPicker.cat.Document": "Documento",
	"iconPicker.cat.E-commerce": "Comercio electrónico",
	"iconPicker.cat.Editing": "Edición",
	"iconPicker.cat.Education": "Educación",
	"iconPicker.cat.Electrical": "Eléctrico",
	"iconPicker.cat.Emoji": "Emoji",
	"iconPicker.cat.Energy": "Energía",
	"iconPicker.cat.Extensions": "Extensiones",
	"iconPicker.cat.Files": "Archivos",
	"iconPicker.cat.Film + Video": "Películas y vídeo",
	"iconPicker.cat.Food": "Comida",
	"iconPicker.cat.Food + Beverage": "Comida y bebida",
	"iconPicker.cat.Fruits + Vegetables": "Frutas y verduras",
	"iconPicker.cat.Games": "Juegos",
	"iconPicker.cat.Gaming": "Gaming",
	"iconPicker.cat.Gender": "Género",
	"iconPicker.cat.Genders": "Géneros",
	"iconPicker.cat.Gestures": "Gestos",
	"iconPicker.cat.Halloween": "Halloween",
	"iconPicker.cat.Hands": "Manos",
	"iconPicker.cat.Hardware": "Hardware",
	"iconPicker.cat.Health": "Salud",
	"iconPicker.cat.Holidays": "Festivos",
	"iconPicker.cat.Home": "Hogar",
	"iconPicker.cat.Household": "Doméstico",
	"iconPicker.cat.Humanitarian": "Humanitario",
	"iconPicker.cat.Images": "Imágenes",
	"iconPicker.cat.Laundry": "Lavandería",
	"iconPicker.cat.Letters": "Letras",
	"iconPicker.cat.Logic": "Lógica",
	"iconPicker.cat.Logistics": "Logística",
	"iconPicker.cat.Map": "Mapa",
	"iconPicker.cat.Maps": "Mapas",
	"iconPicker.cat.Maritime": "Marítimo",
	"iconPicker.cat.Marketing": "Marketing",
	"iconPicker.cat.Math": "Matemáticas",
	"iconPicker.cat.Mathematics": "Matemáticas",
	"iconPicker.cat.Media": "Medios",
	"iconPicker.cat.Media Playback": "Reproducción de medios",
	"iconPicker.cat.Medical + Health": "Médico y salud",
	"iconPicker.cat.Money": "Dinero",
	"iconPicker.cat.Mood": "Estado de ánimo",
	"iconPicker.cat.Moving": "Mudanza",
	"iconPicker.cat.Music + Audio": "Música y audio",
	"iconPicker.cat.Nature": "Naturaleza",
	"iconPicker.cat.Numbers": "Números",
	"iconPicker.cat.Photography": "Fotografía",
	"iconPicker.cat.Photos + Images": "Fotos e imágenes",
	"iconPicker.cat.Political": "Político",
	"iconPicker.cat.Privacy": "Privacidad",
	"iconPicker.cat.Punctuation + Symbols": "Puntuación y símbolos",
	"iconPicker.cat.Religion": "Religión",
	"iconPicker.cat.Science": "Ciencia",
	"iconPicker.cat.Science Fiction": "Ciencia ficción",
	"iconPicker.cat.Security": "Seguridad",
	"iconPicker.cat.Shapes": "Formas",
	"iconPicker.cat.Shopping": "Compras",
	"iconPicker.cat.Social": "Redes sociales",
	"iconPicker.cat.Spinners": "Spinners",
	"iconPicker.cat.Sport": "Deporte",
	"iconPicker.cat.Sports + Fitness": "Deportes y fitness",
	"iconPicker.cat.Symbols": "Símbolos",
	"iconPicker.cat.System": "Sistema",
	"iconPicker.cat.Text": "Texto",
	"iconPicker.cat.Text Formatting": "Formato de texto",
	"iconPicker.cat.Time": "Tiempo",
	"iconPicker.cat.Toggle": "Interruptor",
	"iconPicker.cat.Transit": "Tránsito",
	"iconPicker.cat.Transportation": "Transporte",
	"iconPicker.cat.Travel": "Viajes",
	"iconPicker.cat.Travel + Hotel": "Viajes y hoteles",
	"iconPicker.cat.UI actions": "Acciones de interfaz",
	"iconPicker.cat.Users + People": "Usuarios y personas",
	"iconPicker.cat.Vehicles": "Vehículos",
	"iconPicker.cat.Version control": "Control de versiones",
	"iconPicker.cat.Weather": "Tiempo meteorológico",
	"iconPicker.cat.Writing": "Escritura",
	"iconPicker.cat.Zodiac": "Zodiaco",

	// Downloadable icon packs
	"iconPack.downloadTitle": "{{name}} aún no se ha descargado",
	"iconPack.downloadDetail": "{{count}} iconos · {{size}} · descarga única",
	"iconPack.download": "Descargar",
	"iconPack.downloading": "Descargando {{name}}…",
	"iconPack.downloadFailed":
		"No se pudo descargar {{name}}. Comprueba tu conexión e inténtalo de nuevo.",
	"iconPack.retry": "Reintentar",
	"iconPack.faBrandsNotice":
		"Los iconos de marcas son marcas registradas de sus respectivos propietarios. Su inclusión no indica endorsamiento. Por favor, úsalos solo para representar la empresa, producto o servicio al que se refieren.",
	"iconPack.artworkRestored":
		"Se descargó el arte de los iconos para {{names}}.",
	"iconPack.diskWriteFailed":
		"Callout Studio no pudo guardar el paquete de iconos en disco, por lo que tendrá que descargarse de nuevo la próxima vez. Los iconos que elijas siguen guardados en tu configuración.",

	// Icon licences & credits
	"credits.title": "Licencias de iconos y créditos",
	"credits.intro":
		"Callout Studio se basa en varias bibliotecas de iconos abiertas. Sus licencias se reproducen a continuación, junto con lo que se modificó para usarlas aquí.",
	"credits.fullNotices": "Avisos completos de terceros",
	"credits.pluginLicense":
		"El código propio de Callout Studio está bajo la licencia 0BSD; las bibliotecas de iconos conservan sus propias licencias.",

	"contextMenu.editCallout": "Editar ajustes del callout",
	"contextMenu.copyMarkdown": "Copiar Markdown del callout",
	"contextMenu.openSettings": "Abrir ajustes de Callout Studio",
	"contextMenu.setFoldClosed": "Establecer el callout como cerrado (-)",
	"contextMenu.setFoldOpen": "Establecer el callout como abierto (+)",
	"contextMenu.setFoldNone": "Hacer que el callout no sea plegable",
	"contextMenu.cutSection": "Cortar sección de encabezado",
	"contextMenu.copySection": "Copiar sección de encabezado",
	"contextMenu.deleteSection": "Eliminar sección de encabezado",
	"heading.toggleFold": "Alternar plegado",
	"settings.globalSettings": "Ajustes globales",
	"settings.globalSettingsRegularDesc":
		"Añada un token de callout a una cita (p. ej., `> [!type]`) para renderizar el cuadro de callout nativo de Obsidian. Puede ajustar su borde, redondeo, escala de fuente y alineación.",
	"settings.globalSettingsHeadingDesc":
		"Añada un token de callout justo después de los símbolos # del encabezado (p. ej., `## [!type]`) para renderizarlo como un encabezado de callout con estilo. Puede ajustar su borde, forma y espaciado vertical.",
	"settings.globalSettingsInlineDesc":
		"Añada un token de callout en cualquier parte de una línea de texto (p. ej., `[!type]`) para renderizarlo como una pequeña píldora en línea. Puede ajustar su borde y forma.",
	"settings.globalSettingsCustomize": "Personalizar",
	"settings.calloutTypeRegular": "Callout regular",
	"settings.calloutTypeHeading": "Callout de encabezado",
	"settings.calloutTypeInline": "Callout en línea",
	"settings.customizeMenu": "Personalizar elementos del menú",
	"settings.customizeMenuDesc":
		"Elija qué acciones de clic derecho aparecen para cada tipo de callout y reordénelas. Funciona en modo fuente y Vista previa en vivo.",
	"settings.customizeMenuButton": "Personalizar elementos del menú",
	"menuCustomize.title": "Personalizar menú de clic derecho",
	"menuCustomize.desc":
		"Active o desactive acciones y arrastre el asa para reordenarlas. Los cambios se guardan automáticamente.",
	"menuCustomize.regular": "Callout regular",
	"menuCustomize.heading": "Callout de encabezado",
	"menuCustomize.inline": "Callout en línea",
	"menuCustomize.dragHandle": "Arrastrar para reordenar",
	"menuItem.edit": "Editar callout",
	"menuItem.openSettings": "Abrir ajustes",
	"menuItem.copyMarkdown": "Copiar Markdown",
	"menuItem.foldDefaults":
		"Plegado predeterminado (abierto / cerrado / ninguno)",
	"menuItem.cutSection": "Cortar sección",
	"menuItem.copySection": "Copiar sección",
	"menuItem.deleteSection": "Eliminar sección",

	"confirm.ok": "Eliminar",
	"confirm.cancel": "Cancelar",

	"vault.filesUpdated":
		"Se actualizaron {{count}} referencia(s) de callout en los archivos del vault.",
	"vault.idsUpdated":
		"Se actualizaron {{count}} ID(s) de callout en los archivos del vault: {{oldIds}} → {{newId}}",
	"vault.titlesUpdated":
		"Se actualizaron {{count}} título(s) de callout en los archivos del vault: {{oldTitle}} → {{newTitle}}",
	"vault.replaceWith": "Reemplazar con:",
	"vault.deleteWithout": "Eliminar sin reemplazar",
	"vault.confirmDelete": "Confirmar",
	"vault.confirmReplace": "Reemplazar",
	"vault.replacePromptInUse":
		'"{{name}}" se usa {{count}} vez/veces en {{files}} archivo(s). Elija un callout para reemplazarlo:',
	"vault.replacePromptUnused": 'Elija un callout para reemplazar "{{name}}":',
	"vault.noReplacementAvailable":
		"No hay otros callouts disponibles para reemplazar este.",
	"vault.convertedToPlainText":
		"Se convirtieron {{blocks}} bloque(s) de callout en {{files}} archivo(s) a texto sin formato.",
	"vault.resetAliasWarning":
		"{{count}} referencia(s) en {{files}} archivo(s) usan alias personalizados: {{aliases}}. Estos dejarán de funcionar después del restablecimiento. ¿Continuar?",
	"vault.resetConfirm": "Restablecer",
	"vault.resetAllInUse":
		"⚠ {{count}} referencia(s) de callout en {{files}} archivo(s) usan tipos de callout personalizados que serán eliminados.",

	"vaultStats.title": "Estadísticas de callouts",
	"vaultStats.totalCallouts": "Total de callouts",
	"vaultStats.typesFound": "Tipos encontrados",
	"vaultStats.filesWithCallouts": "Archivos con callouts",
	"vaultStats.filesScanned": "Archivos Markdown escaneados",
	"vaultStats.empty": "No se encontraron callouts en las notas Markdown.",
	"vaultStats.columnType": "Tipo",
	"vaultStats.columnName": "Nombre",
	"vaultStats.columnSource": "Fuente",
	"vaultStats.columnCount": "Cantidad",
	"vaultStats.columnFiles": "Archivos",
	"vaultStats.unknown": "Desconocido",
	"vaultStats.sourceBuiltIn": "Integrado",
	"vaultStats.sourceCustom": "Personalizado",
	"vaultStats.sourceAutoFallback": "Reserva automática",
	"vaultStats.sourceTheme": "Fragmento CSS",
	"vaultStats.sourceAlias": "Alias de {{id}}",
	"vaultStats.sourceUnknown": "Desconocido",
	"vaultStats.close": "Cerrar",

	"import.title": "Problemas de importación",
	"import.reportLeadIn":
		"Parece que el archivo que importó ha sido modificado. Aquí está la lista de problemas:",
	"import.reportLeadInFatal":
		"Este archivo no parece ser una exportación de Callout Studio. No se puede importar:",
	"import.entryHeading": "Entrada {{index}} — {{label}}",
	"import.summary":
		"{{valid}} de {{total}} entradas son válidas · {{issues}} problema(s) encontrado(s).",
	"import.btnCancel": "Cancelar",
	"import.btnImportValid": "Importar solo las válidas ({{count}})",
	"import.err.notRecognized":
		"Archivo no reconocido: se esperaba un array de definiciones de callout o una exportación de Callout Studio.",
	"import.warn.settingsIgnored":
		"El bloque de configuración no era un objeto válido y fue ignorado.",
	"import.warn.invalidGradient":
		"El degradado de fondo no era válido y fue ignorado.",
	"import.err.parseFailed":
		"El archivo no es JSON válido y no pudo analizarse.",
	"import.err.entryNotObject": "La entrada debe ser un objeto.",
	"import.err.requiredMissing":
		'El campo requerido "{{field}}" falta o tiene el tipo incorrecto.',
	"import.err.idEmpty": "El ID no debe estar vacío.",
	"import.err.idTooLong":
		'El ID "{{value}}" tiene {{length}} caracteres; el máximo es {{max}}.',
	"import.err.idBadChar":
		'El ID "{{value}}" contiene caracteres no válidos (no se permiten "|", "[", "]", tabulaciones ni saltos de línea).',
	"import.err.displayNameEmpty":
		"El nombre para mostrar no debe estar vacío.",
	"import.err.displayNameTooLong":
		"El nombre para mostrar tiene {{length}} caracteres; el máximo es {{max}}.",
	"import.err.boolField": '"{{field}}" debe ser un booleano (true o false).',
	"import.err.iconNotObject": "El icono debe ser un objeto.",
	"import.err.iconTypeInvalid":
		'El tipo de icono "{{value}}" no es uno de: {{types}}.',
	"import.warn.iconFieldIgnored":
		'"{{field}}" solo se aplica a iconos de Material y se ignora para el tipo de icono {{type}}.',
	"import.err.iconValueEmpty":
		"El valor del icono debe ser una cadena no vacía.",
	"import.err.iconValueTooLong":
		"El valor del icono es inusualmente largo ({{length}} caracteres).",
	"import.err.materialStyle":
		'El estilo de icono Material "{{value}}" no es uno de: outlined, filled, rounded, sharp.',
	"import.err.materialWeight":
		'El peso del icono Material "{{value}}" debe ser un entero entre 100 y 700, en pasos de 100.',
	"import.warn.iconRecolorIgnored":
		'"recolor" solo se aplica a tus propias imágenes y se ignora para el tipo de icono {{type}}.',
	"import.err.iconRecolorInvalid":
		'"recolor" debe ser true o false (se recibió "{{value}}").',
	"import.err.colorInvalid":
		'"{{field}}" debe ser un color hexadecimal como "#448aff" (se recibió "{{value}}").',
	"import.err.numberRange":
		'"{{field}}" debe ser un número entre {{min}} y {{max}} (se recibió "{{value}}").',
	"import.err.iconSizeRange":
		'"{{field}}" debe ser un número entre {{min}} y {{max}} (se recibió "{{value}}").',
	"import.err.iconAdjustShape":
		'"iconAdjust" must be an object mapping a callout type ("regular", "heading", "inline") to its icon size and offsets.',
	"import.err.aliasesNotArray": '"aliases" debe ser un array de cadenas.',
	"import.err.aliasNotString": "El alias debe ser una cadena.",
	"import.err.aliasDup":
		'El alias "{{value}}" está duplicado dentro de esta entrada.',
	"import.err.tooManyIds":
		"Demasiados IDs ({{count}}); cada callout puede tener como máximo {{max}} IDs (principal + alias).",
	"import.err.metadataShape":
		'"metadata" debe ser un objeto cuyos valores sean todos cadenas.',
	"import.warn.unknownFields": "Campos desconocidos ignorados: {{fields}}.",
	"import.err.duplicateInFile":
		'El ID/alias "{{value}}" ya está en uso por la entrada #{{first}} en este archivo.',
	"import.err.aliasConflict":
		'El alias "{{value}}" ya está en uso por otro callout ("{{other}}") en su vault.',
	"import.warn.defaultFoldedAutofix":
		'"defaultFolded" era true mientras "foldable" era false; defaultFolded se reinició a false.',
	"import.warn.imageMissing":
		"Este Callout usa una imagen que no está en el archivo ni en este vault, por lo que mostrará un icono de marcador de posición hasta que le des uno nuevo.",

	"import.err.paletteIdInvalid":
		'"paletteId" debe ser un ID de texto no vacío (se recibió "{{value}}").',
	"import.warn.iconNameUnknown":
		'No hay ningún ícono "{{value}}" en {{type}}, por lo que se usó el ícono predeterminado.',
	"import.warn.cmIconUnknownNew":
		'No hay ningún ícono "{{value}}" en Obsidian, por lo que se usó el ícono predeterminado.',
	"import.warn.cmIconUnknownExisting":
		'No hay ningún ícono "{{value}}" en Obsidian, por lo que "{{id}}" conservó el ícono que ya tenía.',
	"import.chooseSource": "Importar desde",
	"import.sourceStudio": "Callout Studio",
	"import.sourceStudioDesc":
		"Cargar un archivo .json exportado desde Callout Studio.",
	"import.sourceCalloutManager": "Callout Manager",
	"import.sourceCalloutManagerDesc":
		"Pega los estilos que copiaste desde el botón Copy de Callout Manager.",
	"import.sourceAdmonition": "Admonition",
	"import.sourceAdmonitionDesc":
		"Trae tus admonitions personalizadas desde el plugin Admonition.",
	"import.cmTitle": "Importar desde Callout Manager",
	"import.cmInstructions":
		"En Callout Manager, usa su botón Copy para copiar tus estilos de callout personalizados y luego pégalos a continuación.",
	"import.cmPlaceholder": "Pega los estilos copiados aquí…",
	"import.cmBtnCancel": "Cancelar",
	"import.cmBtnImport": "Importar",
	"import.err.cmNoBlocksFound":
		"No se encontraron estilos de Callout Manager en el texto pegado.",
	"import.err.cmNoColorForNew":
		'No se encontró ningún color utilizable para el nuevo callout "{{value}}"; fue omitido.',
	"import.err.cmIdConflict":
		'El ID "{{value}}" ya está siendo usado como alias por otro callout ("{{other}}") y fue omitido.',

	// Import — Admonition
	"import.admTitle": "Importar desde Admonition",
	"import.admInstructions":
		"Cada admonition se convierte en un callout con su nombre, icono " +
		"y color. Los ajustes sin equivalente en Callout Studio (comando, " +
		"botón de copiar, título oculto) se quedan atrás.",
	"import.admFromVault": "Esta bóveda",
	"import.admVaultChecking": "Buscando el plugin Admonition…",
	"import.admVaultFound":
		"Se encontraron {{count}} admonition(s) personalizadas.",
	"import.admVaultNotFound":
		"No se encontraron admonitions personalizadas en esta bóveda.",
	"import.admFromFile": "Un archivo",
	"import.admFromFileDesc":
		"Un archivo admonitions.json, o un paquete compartido.",
	"import.admChooseFile": "Elegir archivo…",
	"import.admPasteLabel": "O pega aquí el JSON:",
	"import.admPlaceholder": "Pega aquí tus admonitions…",
	"import.admBtnCancel": "Cancelar",
	"import.admBtnImport": "Importar",
	"import.err.admNotRecognized":
		"Archivo no reconocido: se esperaba una lista de admonitions o un " +
		"data.json de Admonition.",
	"import.err.admNoEntries": "No se encontraron admonitions para importar.",
	"import.err.admTypeMissing": 'Esta admonition no tiene "type" y se omitió.',
	"import.warn.admIconUnknown":
		'No se encontró ningún icono llamado "{{value}}" en ninguna ' +
		"biblioteca, así que se usó el icono predeterminado.",
	"import.warn.admIconUnknownExisting":
		'No se encontró ningún icono llamado "{{value}}" en ninguna ' +
		'biblioteca, así que "{{id}}" conservó el icono que ya tenía.',
	"import.warn.admImageFailed":
		"No se pudo leer la imagen subida, así que se usó el icono " +
		"predeterminado.",
	"import.warn.admIconWithCss":
		"Esta admonition recibe su estilo de un fragmento CSS en " +
		"Admonition. Ese estilo no forma parte de la importación, así que " +
		"solo se trajeron su nombre, icono y color.",
	"import.warn.admNoColor":
		"No se definió ningún color, así que se usó el azul " +
		"predeterminado.",
	"import.warn.admTitleTruncated":
		"El título tiene {{length}} caracteres; se acortó a {{max}}.",

	"footer.tagline":
		"¿Tiene comentarios, sugerencias o ideas? ¡Me encantaría escucharle!",
	"footer.madeBy": "Creado por Niv  •  ",
};
