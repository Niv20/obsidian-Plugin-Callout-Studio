/**
 * editor/ContextMenu.ts — Right-click context menu integration.
 *
 * Patches Obsidian's Menu class (via monkey-around) to inject callout-specific
 * actions when the user right-clicks on a callout block in source view,
 * live-preview, or reading view. Actions include "Edit callout" and
 * "Open settings". Reads user preferences from PluginSettings and uses
 * CalloutEditor to open the edit modal.
 */
import { EditorView } from "@codemirror/view";
import { around, dedupe } from "monkey-around";
import {
	Editor,
	type MarkdownSectionInformation,
	MarkdownView,
	Menu,
	type MenuPositionDef,
} from "obsidian";
import type CalloutStudioPlugin from "../main";
import { t } from "../i18n";
import { CalloutEditor } from "../settings/CalloutEditor";

// ─── Layer 1: Constants ──────────────────────────────────────────────────────

const CALLOUT_HEADER_REGEX = /^(\s*>[\s>]*)\[!([^\]]+)\]/;
const LIVE_PREVIEW_SELECTOR = ".markdown-source-view.is-live-preview";
const READING_CALLOUT_SELECTOR = ".callout[data-callout]";
const MENU_SECTION = "callout-studio";
const MENU_MOUSE_PATCH_KEY =
	"callout-studio-context-menu.show-at-mouse-event@obsidian-plugin-callout-studio";
const MENU_POSITION_PATCH_KEY =
	"callout-studio-context-menu.show-at-position@obsidian-plugin-callout-studio";
const MENU_TRIGGER_MAX_AGE_MS = 750;
const MENU_TRIGGER_POSITION_TOLERANCE_PX = 12;

// ─── Layer 1: Local types ────────────────────────────────────────────────────

interface CalloutInfo {
	id: string;
	headerLine: number;
	prefix: string;
	quoteDepth: number;
}

interface ResolvedCalloutContext {
	callout: CalloutInfo;
	editor: Editor;
	view: MarkdownView;
	surface: "source" | "live-preview" | "reading";
	targetEl: Element;
}

interface PointerContext {
	targetEl: Element;
	clientX: number;
	clientY: number;
	timestamp: number;
	ownerDocument: Document;
}

interface PreviewSectionLookup {
	getSectionInfo(el: HTMLElement): MarkdownSectionInformation | null;
}

// ─── Layer 2: Entry point ────────────────────────────────────────────────────

export function registerContextMenu(plugin: CalloutStudioPlugin): void {
	const injectedMenus = new WeakSet<Menu>();
	let lastTrigger: PointerContext | null = null;

	// Capture-phase listener keeps lastTrigger fresh for all three paths below.
	plugin.registerDomEvent(
		document,
		"contextmenu",
		(event) => {
			lastTrigger = capturePointerContext(event);
		},
		{ capture: true },
	);

	// Primary path: Obsidian fires "editor-menu" for Source and Live Preview
	// right-clicks. Most reliable for editor surfaces.
	plugin.registerEvent(
		plugin.app.workspace.on("editor-menu", (menu, _editor, info) => {
			if (!(info instanceof MarkdownView)) return;
			const trigger = getRecentTriggerForView(lastTrigger, info);
			if (!trigger) return;
			maybeAddItems(plugin, menu, trigger, injectedMenus);
		}),
	);

	// Backup path A: patch showAtMouseEvent to catch menus opened outside the
	// workspace event (e.g. reading view, third-party code paths). Also refreshes
	// lastTrigger so path B can use the same snapshot.
	// Backup path B: patch showAtPosition for touch/keyboard-opened menus;
	// matched against lastTrigger by position tolerance + timestamp.
	const uninstallPatch = around(Menu.prototype, {
		showAtMouseEvent(old) {
			return dedupe(
				MENU_MOUSE_PATCH_KEY,
				old,
				function (this: Menu, event: MouseEvent) {
					const trigger = capturePointerContext(event);
					if (trigger) {
						lastTrigger = trigger;
						maybeAddItems(plugin, this, trigger, injectedMenus);
					}
					return old?.apply(this, [event]) ?? this;
				},
			);
		},
		showAtPosition(old) {
			return dedupe(
				MENU_POSITION_PATCH_KEY,
				old,
				function (
					this: Menu,
					position: MenuPositionDef,
					doc?: Document,
				) {
					const trigger = getMatchingRecentTrigger(
						lastTrigger,
						position,
						doc,
					);
					if (trigger) {
						maybeAddItems(plugin, this, trigger, injectedMenus);
					}
					return old?.apply(this, [position, doc]) ?? this;
				},
			);
		},
	});

	// plugin.register ensures the patch is removed when the plugin unloads.
	plugin.register(uninstallPatch);
}

// ─── Layer 3: Context resolution ────────────────────────────────────────────

// Top-level resolver: tries editor surfaces first, then reading view.
function resolveContext(
	plugin: CalloutStudioPlugin,
	trigger: PointerContext,
): ResolvedCalloutContext | null {
	const view = findMarkdownViewForTarget(plugin, trigger.targetEl);
	if (!view) return null;

	return (
		resolveEditorContext(view, trigger) ??
		resolveReadingContext(view, trigger.targetEl)
	);
}

// Source mode and Live Preview: use the official CM6 API to map click
// coordinates to a document position, then walk up to the callout header.
function resolveEditorContext(
	view: MarkdownView,
	trigger: PointerContext,
): ResolvedCalloutContext | null {
	const cmRoot = trigger.targetEl.closest(".cm-editor");
	if (!(cmRoot instanceof HTMLElement)) return null;

	const editorView = EditorView.findFromDOM(cmRoot);
	if (!editorView) return null;

	const coords = { x: trigger.clientX, y: trigger.clientY };
	const offset =
		editorView.posAtCoords(coords) ?? editorView.posAtCoords(coords, false);
	if (offset == null) return null;

	const position = view.editor.offsetToPos(offset);
	const callout = findCalloutAtLine(view.editor, position.line);
	if (!callout) return null;

	return {
		callout,
		editor: view.editor,
		view,
		surface: trigger.targetEl.closest(LIVE_PREVIEW_SELECTOR)
			? "live-preview"
			: "source",
		targetEl: trigger.targetEl,
	};
}

// Reading view: find the rendered callout element, look up its source section,
// then match back to the raw markdown line.
function resolveReadingContext(
	view: MarkdownView,
	targetEl: Element,
): ResolvedCalloutContext | null {
	const calloutEl = targetEl.closest(READING_CALLOUT_SELECTOR);
	if (!(calloutEl instanceof HTMLElement)) return null;

	const sectionInfo = getSectionInfo(view, calloutEl);
	if (!sectionInfo) return null;

	const calloutId = normalizeCalloutId(
		calloutEl.getAttribute("data-callout") ?? "",
	);
	if (!calloutId) return null;

	const callout = findCalloutInSection(
		sectionInfo,
		calloutId,
		getCalloutDomDepth(calloutEl),
	);
	if (!callout) return null;

	return {
		callout,
		editor: view.editor,
		view,
		surface: "reading",
		targetEl,
	};
}

// ─── Layer 4: Callout finders ────────────────────────────────────────────────

// Walk up from startLine until we hit a callout header or a non-quote line.
function findCalloutAtLine(
	editor: Editor,
	startLine: number,
): CalloutInfo | null {
	for (let line = startLine; line >= 0; line--) {
		const text = editor.getLine(line);
		const match = CALLOUT_HEADER_REGEX.exec(text);
		if (match && match[1] !== undefined && match[2] !== undefined) {
			return {
				id: normalizeCalloutId(match[2]),
				headerLine: line,
				prefix: match[1],
				quoteDepth: countQuoteDepth(match[1]),
			};
		}
		if (!/^\s*>/.test(text)) return null;
	}
	return null;
}

// Scan a rendered section's source text for a callout header matching the
// given id and quote depth. Falls back: same id → same depth → first callout.
function findCalloutInSection(
	sectionInfo: MarkdownSectionInformation,
	calloutId: string,
	quoteDepth: number,
): CalloutInfo | null {
	let sameIdMatch: CalloutInfo | null = null;
	let sameDepthMatch: CalloutInfo | null = null;
	let firstCallout: CalloutInfo | null = null;

	for (const [index, lineText] of sectionInfo.text.split("\n").entries()) {
		const match = CALLOUT_HEADER_REGEX.exec(lineText);
		if (!match || match[1] === undefined || match[2] === undefined) {
			continue;
		}

		const callout: CalloutInfo = {
			id: normalizeCalloutId(match[2]),
			headerLine: sectionInfo.lineStart + index,
			prefix: match[1],
			quoteDepth: countQuoteDepth(match[1]),
		};

		if (!firstCallout) firstCallout = callout;

		if (callout.id === calloutId && callout.quoteDepth === quoteDepth) {
			return callout;
		}

		if (!sameIdMatch && callout.id === calloutId) sameIdMatch = callout;
		if (!sameDepthMatch && callout.quoteDepth === quoteDepth)
			sameDepthMatch = callout;
	}

	return sameIdMatch ?? sameDepthMatch ?? firstCallout;
}

// ─── Layer 5: Menu building ──────────────────────────────────────────────────

// Guard function: skip if the menu was already injected (deduplicate across
// the three injection paths) or if the feature is disabled in settings.
function maybeAddItems(
	plugin: CalloutStudioPlugin,
	menu: Menu,
	trigger: PointerContext,
	injectedMenus: WeakSet<Menu>,
): void {
	if (!plugin.settings.contextMenu.enabled || injectedMenus.has(menu)) {
		return;
	}

	const context = resolveContext(plugin, trigger);
	if (!context) return;

	injectedMenus.add(menu);
	menu.onHide(() => injectedMenus.delete(menu));
	addItems(plugin, menu, context);
}

function addItems(
	plugin: CalloutStudioPlugin,
	menu: Menu,
	context: ResolvedCalloutContext,
): void {
	const { contextMenu } = plugin.settings;
	const currentDef =
		plugin.registry.get(context.callout.id) ??
		plugin.registry.findByAlias(context.callout.id);

	if (contextMenu.showEditCallout) {
		menu.addItem((item) => {
			item.setTitle(t("contextMenu.editCallout"))
				.setIcon("pencil")
				.setSection(MENU_SECTION)
				.onClick(() => {
					if (!currentDef) return;
					void new CalloutEditor(plugin, currentDef).openAndWait();
				});
		});
	}

	if (contextMenu.showOpenSettings) {
		menu.addItem((item) => {
			item.setTitle(t("contextMenu.openSettings"))
				.setIcon("settings")
				.setSection(MENU_SECTION)
				.onClick(() => {
					openPluginSettings(plugin);
				});
		});
	}

	if (contextMenu.showCopyMarkdown) {
		menu.addItem((item) => {
			item.setTitle(t("contextMenu.copyMarkdown"))
				.setIcon("clipboard-copy")
				.setSection(MENU_SECTION)
				.onClick(() => {
					copyCalloutMarkdown(context.editor, context.callout);
				});
		});
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capturePointerContext(event: MouseEvent): PointerContext | null {
	const { target } = event;
	const targetEl =
		target instanceof Element
			? target
			: target instanceof Node
				? target.parentElement
				: null;
	if (!targetEl) return null;

	return {
		targetEl,
		clientX: event.clientX,
		clientY: event.clientY,
		timestamp: Date.now(),
		ownerDocument: targetEl.ownerDocument,
	};
}

function getRecentTriggerForView(
	trigger: PointerContext | null,
	view: MarkdownView,
): PointerContext | null {
	if (!trigger) return null;
	if (Date.now() - trigger.timestamp > MENU_TRIGGER_MAX_AGE_MS) return null;
	if (!view.containerEl.contains(trigger.targetEl)) return null;
	return trigger;
}

function getMatchingRecentTrigger(
	trigger: PointerContext | null,
	position: MenuPositionDef,
	doc?: Document,
): PointerContext | null {
	if (!trigger) return null;
	if (Date.now() - trigger.timestamp > MENU_TRIGGER_MAX_AGE_MS) return null;
	if (doc && trigger.ownerDocument !== doc) return null;
	if (
		Math.abs(trigger.clientX - position.x) >
			MENU_TRIGGER_POSITION_TOLERANCE_PX ||
		Math.abs(trigger.clientY - position.y) >
			MENU_TRIGGER_POSITION_TOLERANCE_PX
	) {
		return null;
	}
	return trigger;
}

function findMarkdownViewForTarget(
	plugin: CalloutStudioPlugin,
	targetEl: Element,
): MarkdownView | null {
	for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
		const { view } = leaf;
		if (
			view instanceof MarkdownView &&
			view.containerEl.contains(targetEl)
		) {
			return view;
		}
	}
	return null;
}

function getSectionInfo(
	view: MarkdownView,
	targetEl: HTMLElement,
): MarkdownSectionInformation | null {
	const previewMode = view.previewMode as MarkdownView["previewMode"] &
		Partial<PreviewSectionLookup>;
	let current: HTMLElement | null = targetEl;

	while (current && view.previewMode.containerEl.contains(current)) {
		const info = previewMode.getSectionInfo?.(current) ?? null;
		if (info) return info;
		current = current.parentElement;
	}

	return null;
}

function getCalloutDomDepth(calloutEl: HTMLElement): number {
	let depth = 0;
	let current: HTMLElement | null = calloutEl;

	while (current) {
		if (current.matches(READING_CALLOUT_SELECTOR)) depth += 1;
		current =
			current.parentElement?.closest(READING_CALLOUT_SELECTOR) ?? null;
	}

	return depth;
}

function copyCalloutMarkdown(editor: Editor, info: CalloutInfo): void {
	const lines: string[] = [];
	const totalLines = editor.lineCount();

	for (let line = info.headerLine; line < totalLines; line++) {
		const text = editor.getLine(line);
		if (line > info.headerLine && !/^\s*>/.test(text)) break;
		lines.push(text);
	}

	void navigator.clipboard.writeText(lines.join("\n"));
}

function openPluginSettings(plugin: CalloutStudioPlugin): void {
	plugin.app.setting.open();
	plugin.app.setting.openTabById(plugin.manifest.id);
}

function normalizeCalloutId(value: string): string {
	return value.trim().toLowerCase();
}

function countQuoteDepth(prefix: string): number {
	return prefix.match(/>/g)?.length ?? 0;
}
