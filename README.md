# Callout Studio

Callout Studio is the ultimate callout manager for Obsidian. It lets you create, edit, and style your own callout types, override the built-in ones, pick icons from large libraries, and keep callouts under control across your whole vault — all from a single settings tab.

## Features

### Custom callout types

- Create new callout types with a display name, one or more IDs (aliases), an icon, and per-mode colors.
- Edit any built-in or user-defined callout. Changes are reflected everywhere instantly via a live preview.
- Delete user callouts. If a callout is in use across your vault, Callout Studio offers to replace it with another callout or convert the affected blocks to plain text instead of silently breaking notes.
- Foldable callouts: choose **Off**, **Open by default**, or **Closed by default** per callout type.
- Aliases: every callout can have multiple IDs. The autocomplete and the vault statistics treat aliases as the same logical callout.

### Icons

Three icon sources, all selectable from one icon picker:

- **Lucide icons** — Obsidian's built-in set (~1,300 icons). Always available offline.
- **Google Material Symbols** — ~3,000 icons, with selectable style (Outlined / Filled / Rounded / Sharp) and weight (100 – 700).

You can also fine-tune each callout's icon size and horizontal/vertical offset.

### Per-mode colors

- Separate **Light** and **Dark** colors for every callout — Callout Studio honors Obsidian's current theme automatically.
- Color presets: Obsidian's original callout palette plus extra curated presets.

### Global callout style

These settings apply to all callouts:

- **Borders** — pick which sides (top / right / bottom / left, or all) have a visible border.
- **Border thickness** — width in pixels.
- **Title scale** and **Content scale** — independent font scales for the title row and the body.
- **Corner rounding** — border-radius in pixels.

### Default fallback callout

When a note uses a callout ID that doesn't exist in the registry, Callout Studio styles it using the **default fallback callout**. You can pick which callout acts as the fallback in settings.

### Vault discovery

Callout Studio keeps the registry in sync with what's actually used in your vault:

- New callout IDs typed in open notes are picked up automatically.
- When you open the settings tab, in-memory editor buffers are scanned for unsaved IDs.
- A **Scan now** button performs a one-shot vault scan that adds any unrecognized IDs as fallback rows so you can see them in the list and customize them.
- Auto-created fallback rows that are never used and never customized are pruned automatically in the background.

### Right-click context menu

Right-click on a callout in **Reading view**, **Source mode**, or **Live Preview** to get extra actions injected into Obsidian's native menu:

- Edit callout settings
- Open Callout Studio settings
- Copy callout Markdown

Each item can be toggled on or off individually.

### `[!` autocomplete

When you type `[!` inside a blockquote, Callout Studio shows a suggestion list of available callouts:

- Optional icon previews next to each suggestion.
- Optional color previews next to each suggestion.
- Picking a suggestion inserts a complete callout header.
- You can confirm a brand-new callout name on the spot — it will be added as a fallback row to the registry.

### Editor commands

Callout Studio adds the following commands. **No keyboard shortcuts are assigned by default**; you can configure them from **Settings → Hotkeys** or from the in-plugin shortcut button.

- **Open settings** — opens the Callout Studio settings tab.
- **Create new callout type** — opens the callout editor.
- **Wrap in callout** — wraps the current paragraph or selection in a callout, then triggers the autocomplete so you can pick a type.
- **Unwrap from callout** — removes one callout level around the cursor or selection.

### Vault insights & maintenance

- **Callout statistics** — scans every Markdown file in the vault and lists every callout type with its usage count, file count, and source (built-in / custom / auto-fallback / CSS snippet / unknown).
- **Replace in vault** — replace every occurrence of one callout ID with another, in one pass.
- **Convert to plain text** — strip a callout while preserving its content as a normal paragraph block.

### Import / export

- Export all your custom callout definitions to a JSON file.
- Import a JSON file produced by Callout Studio. The importer validates every entry, reports issues per row, and lets you import only the valid entries.
- Import callout definitions detected in your vault's CSS snippets folder.

### Reset

A single **Reset everything** action returns the plugin to defaults: removes user callouts, restores built-in callouts, resets global styles, and clears the downloaded Material SVG cache.

### Localization

The plugin UI is available in **English** and **Hebrew**. The active language follows Obsidian's interface language automatically.

## Network usage and privacy

Callout Studio works offline by default and never sends any vault content anywhere. The only network activity is for the **Google Material Symbols** icon source, and it only happens on demand:

- When you open the icon picker on the **Material** tab, the plugin fetches the Material Symbols metadata once from `https://fonts.google.com/metadata/icons` and caches it locally for 30 days.
- When the picker is open, the relevant Google Fonts stylesheet is loaded from `https://fonts.googleapis.com/css2?...` so the icon previews can render with the chosen style and weight.
- When you actually pick a Material icon for a callout, the plugin downloads that single icon's SVG from `https://fonts.gstatic.com/s/i/short-term/...` and caches the SVG locally so the icon works offline and in PDF export.
- On startup, if any callout already uses a Material icon whose SVG is missing from the local cache (e.g. after an import), the plugin downloads only those missing SVGs in the background.

If you never use Material icons, no network calls are made. The icon cache lives inside the plugin's `data.json` and you can clear it at any time from settings. No telemetry or analytics is collected.

## Install

### Community plugins (recommended)

1. Open **Settings → Community plugins** in Obsidian.
2. Search for **Callout Studio** and select **Install**, then **Enable**.

### Manual install

1. Download `manifest.json`, `main.js`, and `styles.css` from the latest GitHub release.
2. Copy them into `<Vault>/.obsidian/plugins/callout-studio/`.
3. Restart Obsidian and enable **Callout Studio** in **Settings → Community plugins**.

## Development

```bash
npm install
npm run dev    # watch build
npm run build  # production build (typecheck + minified bundle)
npm run lint   # ESLint with the official obsidianmd plugin rules
```

Source lives under `src/` and is bundled by esbuild into `main.js`. The release artifacts are `main.js`, `manifest.json`, and `styles.css`.

## License

[0BSD](LICENSE)
