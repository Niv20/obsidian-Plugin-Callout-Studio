/**
 * settings/CalloutEditorPreview.ts — Live callout preview inside the editor modal.
 *
 * Pure rendering function that takes the current form state (colors, name,
 * fold flags, icon offsets) and rebuilds the preview DOM element from scratch.
 * Supports toggling between light and dark mode preview. Called by
 * CalloutEditor whenever any field changes.
 */
import { setIcon } from "obsidian";
import { t } from "../i18n";
import { calloutColorValue } from "../utils/colorUtils";

export interface EditorPreviewState {
	previewDarkMode: boolean;
	colorLight: string;
	colorDark: string;
	bgColorLight: string;
	bgColorDark: string;
	textColorLight: string;
	textColorDark: string;
	displayName: string;
	foldable: boolean;
	previewFoldCollapsed: boolean;
	iconOffsetX: number;
	iconOffsetY: number;
	iconSize: number;
	iconType: "lucide" | "material" | "emoji";
}

/**
 * Renders the live preview of a callout into `previewEl` based on the
 * supplied editor state. `renderIconPreview` is supplied by the caller so
 * the icon-rendering logic can stay close to the editor's icon state.
 */
export function renderEditorPreview(
	previewEl: HTMLElement,
	state: EditorPreviewState,
	renderIconPreview: (container: HTMLElement) => void,
	onToggleFold: () => void,
): void {
	previewEl.empty();

	const accentColor = state.previewDarkMode
		? state.colorDark
		: state.colorLight;
	const bgColor = state.previewDarkMode
		? state.bgColorDark
		: state.bgColorLight;
	const textColor = state.previewDarkMode
		? state.textColorDark
		: state.textColorLight;

	const rgbMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(
		accentColor,
	);
	let rgbStr = "68, 138, 255";
	let accentHex = "#448aff";
	if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
		rgbStr = `${parseInt(rgbMatch[1], 16)}, ${parseInt(rgbMatch[2], 16)}, ${parseInt(rgbMatch[3], 16)}`;
		accentHex = accentColor;
	}

	// Wrap the callout inside .markdown-rendered so Obsidian's callout CSS
	// (font sizes, --icon-size, padding, title sizing) resolves identically
	// to how it renders in an actual note. Without this wrapper, the modal's
	// UI context produces a different layout than the live note.
	const renderedWrapper = previewEl.createDiv({
		cls: "markdown-rendered callout-studio-preview-rendered",
	});
	const calloutEl = renderedWrapper.createDiv({ cls: "callout" });
	calloutEl.setAttribute("data-callout", "cs-preview");
	// --cs-color-rgb (triplet) drives our own preview CSS; --callout-color
	// (version-aware) drives Obsidian's own callout chrome inside markdown-rendered.
	calloutEl.style.setProperty("--cs-color-rgb", rgbStr);
	calloutEl.style.setProperty("--callout-color", calloutColorValue(accentHex));
	calloutEl.style.backgroundColor = bgColor;

	if (state.previewDarkMode) {
		calloutEl.addClass("callout-studio-preview-dark");
	}

	const titleEl = calloutEl.createDiv({ cls: "callout-title" });

	// Icon
	const iconEl = titleEl.createDiv({ cls: "callout-icon" });
	renderIconPreview(iconEl);
	iconEl.style.color = `rgb(${rgbStr})`;

	// Apply icon transform in preview.
	// Material (Google) icons sit 3px lower than Lucide icons in the preview
	// context, so shift them up by 3px to match live-note rendering.
	const PREVIEW_MATERIAL_Y_CORRECTION_PX = -3;
	const adjustedPreviewOffsetY =
		state.iconOffsetY +
		(state.iconType === "material" ? PREVIEW_MATERIAL_Y_CORRECTION_PX : 0);
	const transforms: string[] = [];
	if (state.iconOffsetX !== 0 || adjustedPreviewOffsetY !== 0) {
		transforms.push(
			`translate(${state.iconOffsetX}px, ${adjustedPreviewOffsetY}px)`,
		);
	}
	if (state.iconSize !== 1) {
		transforms.push(`scale(${state.iconSize})`);
	}
	if (transforms.length > 0) {
		iconEl.setCssProps({
			"--cs-icon-transform": transforms.join(" "),
		});
		iconEl.addClass("callout-studio-icon-transformed");
	}

	// Title text
	const titleInner = titleEl.createDiv({ cls: "callout-title-inner" });
	titleInner.textContent = state.displayName || t("editor.untitledCallout");

	if (state.foldable) {
		const foldBtn = titleEl.createEl("button", {
			cls: "callout-studio-preview-fold-toggle",
			attr: {
				type: "button",
				"aria-label": state.previewFoldCollapsed
					? t("editor.expandPreview")
					: t("editor.collapsePreview"),
			},
		});
		setIcon(
			foldBtn,
			state.previewFoldCollapsed ? "chevron-right" : "chevron-down",
		);
		foldBtn.style.color = `rgb(${rgbStr})`;
		const foldSvg = foldBtn.querySelector("svg");
		if (foldSvg) {
			foldSvg.style.color = `rgb(${rgbStr})`;
			foldSvg.setAttribute("stroke", "currentColor");
		}
		foldBtn.addEventListener("click", (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			onToggleFold();
		});
	}

	// Content
	if (state.previewFoldCollapsed) {
		calloutEl.addClass("callout-studio-preview-collapsed");
	} else {
		const contentEl = calloutEl.createDiv({ cls: "callout-content" });
		contentEl.style.color = textColor;
		const p = contentEl.createEl("p");
		p.textContent = t("editor.loremIpsum");
	}
}
