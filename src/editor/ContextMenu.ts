import { Editor, MarkdownFileInfo, MarkdownView, Menu } from "obsidian";
import type CalloutStudioPlugin from "../main";
import { CalloutEditor } from "../settings/CalloutEditor";
import { t } from "../i18n";

const CALLOUT_HEADER_REGEX = /^(\s*>[\s>]*)\[!([^\]]+)\]/;

interface CalloutInfo {
	id: string;
	headerLine: number;
	prefix: string;
}

function findCalloutAtCursor(
	editor: Editor,
	cursorLine: number,
): CalloutInfo | null {
	for (let line = cursorLine; line >= 0; line--) {
		const text = editor.getLine(line);

		const match = CALLOUT_HEADER_REGEX.exec(text);
		if (match && match[1] !== undefined && match[2] !== undefined) {
			return {
				id: match[2],
				headerLine: line,
				prefix: match[1],
			};
		}

		if (!/^\s*>/.test(text)) {
			return null;
		}
	}
	return null;
}

export function registerContextMenu(plugin: CalloutStudioPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on(
			"editor-menu",
			(
				menu: Menu,
				editor: Editor,
				_info: MarkdownView | MarkdownFileInfo,
			) => {
				const { popup } = plugin.settings;
				if (!popup.enabled) return;

				const cursor = editor.getCursor();
				const calloutInfo = findCalloutAtCursor(editor, cursor.line);
				if (!calloutInfo) return;

				const currentDef = plugin.registry.get(calloutInfo.id);

				if (popup.showEditCallout) {
					menu.addItem((item) => {
						item.setTitle(t("contextMenu.editCallout"))
							.setIcon("pencil")
							.setSection("callout-studio")
							.onClick(() => {
								if (!currentDef) return;
								void new CalloutEditor(
									plugin,
									currentDef,
								).open();
							});
					});
				}

				if (popup.showOpenSettings) {
					menu.addItem((item) => {
						item.setTitle(t("contextMenu.openSettings"))
							.setIcon("settings")
							.setSection("callout-studio")
							.onClick(() => {
								// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
								(plugin.app as any).setting.open();
								// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
								(plugin.app as any).setting.openTabById(
									plugin.manifest.id,
								);
							});
					});
				}

				if (popup.showCopyMarkdown) {
					menu.addItem((item) => {
						item.setTitle(t("contextMenu.copyMarkdown"))
							.setIcon("clipboard-copy")
							.setSection("callout-studio")
							.onClick(() => {
								copyCalloutMarkdown(editor, calloutInfo);
							});
					});
				}
			},
		),
	);
}

function copyCalloutMarkdown(editor: Editor, info: CalloutInfo): void {
	const lines: string[] = [];
	const totalLines = editor.lineCount();

	for (let line = info.headerLine; line < totalLines; line++) {
		const text = editor.getLine(line);
		if (line > info.headerLine && !/^\s*>/.test(text)) {
			break;
		}
		lines.push(text);
	}

	void navigator.clipboard.writeText(lines.join("\n"));
}
