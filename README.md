# Callout Studio

Callout Studio is an Obsidian community plugin for managing custom callout styles, icons, and editor workflows.

## Context menu architecture

Callout Studio injects native Obsidian context menu items by patching `Menu.prototype.showAtMouseEvent` with `monkey-around`. Obsidian routes every right-click menu through that method, so one patch can inspect the click target and add items before the menu is displayed.

```ts
import { Menu } from "obsidian";
import { around, dedupe } from "monkey-around";

const uninstall = around(Menu.prototype, {
	showAtMouseEvent(old) {
		return dedupe(
			"your-plugin-context-menu",
			old,
			function (this: Menu, event: MouseEvent) {
				const context = resolveTargetContext(event);
				if (context) {
					addCustomMenuItems(this, context);
				}

				return old?.apply(this, [event]) ?? this;
			},
		);
	},
});

plugin.register(uninstall);
```

The important rule is that the patch does not decide behavior by itself. It only resolves a clicked target and hands the result to one shared menu builder.

### How the resolver works

- Source mode and Live Preview: find the nearest `.cm-editor`, resolve the `EditorView` with `EditorView.findFromDOM()`, map click coordinates back to a document offset with `posAtCoords()`, convert that offset to an Obsidian editor position, and then scan upward until the enclosing callout header is found.
- Reading view: find the nearest `.callout[data-callout]`, ask the preview renderer for `MarkdownSectionInformation`, then locate the matching callout header inside that section and reuse the same action builder.
- Shared actions: once a callout is resolved, all modes use the same menu composition logic for edit, open settings, and copy markdown.

This is the exact pattern to reuse for another element type: keep the global menu patch, replace the selector and resolver, and keep one shared `addCustomMenuItems()` function.

```ts
function resolveEditorContext(
	view: MarkdownView,
	target: Element,
	event: MouseEvent,
) {
	const cmRoot = target.closest(".cm-editor");
	if (!(cmRoot instanceof HTMLElement)) return null;

	const editorView = EditorView.findFromDOM(cmRoot);
	if (!editorView) return null;

	const offset =
		editorView.posAtCoords({ x: event.clientX, y: event.clientY }) ??
		editorView.posAtCoords({ x: event.clientX, y: event.clientY }, false);
	if (offset == null) return null;

	const pos = view.editor.offsetToPos(offset);
	return findTargetAtLine(view.editor, pos.line);
}
```

```ts
function resolveReadingContext(view: MarkdownView, target: Element) {
	const element = target.closest(".callout[data-callout]");
	if (!(element instanceof HTMLElement)) return null;

	const sectionInfo = previewGetSectionInfo(view, element);
	if (!sectionInfo) return null;

	return findTargetInsideSection(sectionInfo, element.dataset.callout ?? "");
}
```

### Notes for other plugin authors

- Use `dedupe()` with a plugin-specific key so hot reloads or duplicate patch registration do not produce duplicate menu items.
- Always call the original `showAtMouseEvent()` so Obsidian keeps its own items.
- Keep preview-only lookups narrow. In Callout Studio, the preview section lookup is wrapped in a tiny structural cast because the runtime method exists but is not fully declared on `MarkdownPreviewView`.
- If you want to support a different rendered element, replace `.callout[data-callout]` with your selector and keep the rest of the pattern intact.

## Callout block tools

The plugin now includes editor commands for wrapping and unwrapping callout blocks:

- `Wrap in callout` (`callout-wrap`): wraps the current paragraph or the selected span in a new Obsidian callout block and places the cursor after `> [!` so the existing autocomplete flow can complete the type.
- `Unwrap from callout` (`callout-unwrap`): removes one callout level from the callout under the cursor or selection.

Callout Studio does not assign default keyboard shortcuts. Users can choose their own shortcuts in **Settings → Hotkeys** or from the plugin settings shortcut button.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- This project already has eslint preconfigured, you can invoke a check by running`npm run lint`
- Together with a custom eslint [plugin](https://github.com/obsidianmd/eslint-plugin) for Obsidan specific code guidelines.
- A GitHub action is preconfigured to automatically lint every commit on all branches.

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
	"fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
	"fundingUrl": {
		"Buy Me a Coffee": "https://buymeacoffee.com",
		"GitHub Sponsor": "https://github.com/sponsors",
		"Patreon": "https://www.patreon.com/"
	}
}
```

## API Documentation

See https://docs.obsidian.md
