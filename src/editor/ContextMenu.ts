import { Editor, MarkdownFileInfo, MarkdownView, Menu } from "obsidian";
import type CalloutStudioPlugin from "../main";

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
	// Scan from cursor line upward to find the callout header
	for (let line = cursorLine; line >= 0; line--) {
		const text = editor.getLine(line);

		// Check if this line is a callout header
		const match = CALLOUT_HEADER_REGEX.exec(text);
		if (match && match[1] !== undefined && match[2] !== undefined) {
			return {
				id: match[2],
				headerLine: line,
				prefix: match[1],
			};
		}

		// If line doesn't start with ">", we've left the blockquote
		if (!/^\s*>/.test(text)) {
			return null;
		}
	}
	return null;
}

function convertCallout(
	editor: Editor,
	info: CalloutInfo,
	newId: string,
	newDisplayName: string,
): void {
	const line = editor.getLine(info.headerLine);
	const newLine = line.replace(CALLOUT_HEADER_REGEX, `$1[!${newId}]`);

	// Replace the title text after the callout marker if present
	// Pattern: > [!id] Title  OR  > [!id]+/- Title
	const afterMarker = /^(\s*>[\s>]*\[![^\]]+\][+-]?\s*)(.*)$/;
	const titleMatch = afterMarker.exec(newLine);
	let finalLine: string;
	if (titleMatch && titleMatch[1] !== undefined) {
		finalLine = titleMatch[1] + newDisplayName;
	} else {
		finalLine = newLine;
	}

	editor.setLine(info.headerLine, finalLine);
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
				const cursor = editor.getCursor();
				const calloutInfo = findCalloutAtCursor(editor, cursor.line);

				if (!calloutInfo) return;

				// Add "Callout Studio" section
				menu.addSeparator();

				// Convert to... submenu
				if (plugin.settings.popup.showConvertSubmenu) {
					menu.addItem((item) => {
						item.setTitle("Convert callout to...")
							.setIcon("repeat")
							.setSection("callout-studio");

						// We can't create native submenus easily, so we add
						// individual items for each callout type
					});

					const allCallouts = plugin.registry.getAll();
					for (const def of allCallouts) {
						if (def.id === calloutInfo.id) continue;
						menu.addItem((item) => {
							item.setTitle(def.displayName)
								.setIcon(
									def.icon.type === "lucide"
										? def.icon.value
										: "pencil",
								)
								.setSection("callout-studio")
								.onClick(() => {
									convertCallout(
										editor,
										calloutInfo,
										def.id,
										def.displayName,
									);
								});
						});
					}
				}

				// Quick actions
				menu.addItem((item) => {
					item.setTitle("Copy callout Markdown")
						.setIcon("clipboard-copy")
						.setSection("callout-studio-actions")
						.onClick(() => {
							copyCalloutMarkdown(editor, calloutInfo);
						});
				});

				menu.addItem((item) => {
					item.setTitle("Open callout studio settings")
						.setIcon("settings")
						.setSection("callout-studio-actions")
						.onClick(() => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						(plugin.app as any).setting.open();
						// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
							(plugin.app as any).setting.openTabById(
								plugin.manifest.id,
							);
						});
				});
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
