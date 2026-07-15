# Callout Studio

Callout Studio is a powerful callout management **plugin** for [Obsidian.](https://obsidian.md)

It lets you create, edit, and style your own callout types, override the built-in ones, pick icons from large libraries, and use every callout as a regular blockquote, a section heading, or an inline pill - all from a single settings tab!

<img alt="hero" src="https://github.com/user-attachments/assets/e24ff986-cf0c-4f18-95be-33a75283d83a" />

## Features

### Three ways to use a callout

The same callout definition can be used in **three** different forms, each with its own vault-wide style controls:

1. **Regular callout** — the classic Obsidian blockquote: `> [!note]`.
2. **Heading callout** — put the token right after the heading marks, e.g. `## [!note]`, to turn the whole heading into a colored, foldable bar.
3. **Inline callout** — drop the token in the middle of a sentence, e.g. `[!note]`, to get a small colored pill without breaking the paragraph.

All three forms render in Live Preview, Reading view, and PDF export.

### Icons

Three icon sources, all selectable from one icon picker:

- **Lucide icons** — Obsidian's built-in set (~1,300 icons). Always available offline.
- **Google Material Symbols** — ~3,800 icons, with selectable style (Outlined / Filled / Rounded / Sharp) and weight (100 – 700).
- **Emoji** — Any Unicode emoji, with skin-tone selector.

You can also fine-tune each callout's icon size and horizontal/vertical offset.

### Per-mode colors

- Separate **Light** and **Dark** colors for every callout. Callout Studio honors Obsidian's current theme automatically.
- Color presets: Obsidian's original callout palette plus extra curated presets.

<img alt="edit callout" src="https://github.com/user-attachments/assets/7d0aef10-b85b-41e4-967d-5eb3a1437e44" />

### Custom color palettes

Save your own reusable color palettes from **Settings → Custom palettes**, then pick them from the color dropdown on any callout:

- **Simple mode** — choose one base color and Callout Studio derives light and dark backgrounds and accents automatically, auto-correcting contrast so text stays readable.
- **Advanced mode** — fine-tune all four colors (light/dark accent and background) by hand, with live contrast warnings.
- Editing or deleting a saved palette never changes callouts you already colored with it - the colors are copied onto the callout the moment you pick the palette.

### `[!` autocomplete

When you type `[!` inside a blockquote, Callout Studio shows a suggestion list of available callouts:

- Picking a suggestion inserts a complete callout header.
- You can confirm a brand-new callout name on the spot — it will be added as a fallback row to the registry.

<img alt="autocomplete" src="https://github.com/user-attachments/assets/360e2d5b-af4c-4215-8e15-8e2b87b22837" />

### Global callout style

Regular, heading, and inline callouts each get their own style popup, opened from **Settings → Global settings**:

- **Regular callouts** — border sides and thickness, corner rounding, independent Title scale and Content scale, and an option to align the body with the title.
- **Heading callouts** — border sides and thickness, corner rounding, vertical padding around the heading text, and a horizontal icon inset.
- **Inline callouts** — border sides and thickness, corner rounding, and a dedicated font scale for the pill text.

<img alt="global callout style" src="https://github.com/user-attachments/assets/867d74c4-392e-4daf-97df-8ba72bf997d1" />

### Default fallback callout

When a note uses a callout ID that doesn't exist in the registry, Callout Studio styles it using the **default fallback callout**. You can pick which callout acts as the fallback in settings.

### Vault discovery

Callout Studio keeps the registry in sync with what's actually used in your vault:

- **Large vaults:** If your vault has 500 or more markdown files, the plugin will ask for your permission before performing a full initial scan. If you decline, files will be scanned individually as you open them.
- New callout IDs typed in open notes are picked up automatically.
- When you open the settings tab, in-memory editor buffers are scanned for unsaved IDs.
- A **Scan now** button performs a one-shot vault scan that adds any unrecognized IDs as fallback rows so you can see them in the list and customize them.
- Auto-created fallback rows that are never used and never customized are pruned automatically in the background.

### Right-click context menu

Right-click on any callout - regular, heading, or inline - to get extra actions injected into Obsidian's native menu:

- Edit callout settings
- Open Callout Studio settings
- Regular callouts: copy callout Markdown, set the fold state (open / closed / non-collapsible)
- Heading callouts: cut, copy, or delete the whole heading section

You can choose which of these actions appear for each of the three forms, and reorder them, from **Settings → Customize menu items**.

<img alt="right-click menu" src="https://github.com/user-attachments/assets/92220a40-4b6e-4654-baf3-1deba141012d" />

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

- Export all your custom callout definitions and saved color palettes to a JSON file.
- Import a JSON file produced by Callout Studio. The importer validates every entry, reports issues per row, lets you import only the valid entries, and merges imported color palettes into your existing ones instead of overwriting them.
- Import callout definitions detected in your vault's CSS snippets folder.

### Reset

A single **Reset everything** action returns the plugin to defaults: removes user callouts, restores built-in callouts, resets global styles, and clears the downloaded Material SVG cache.

### Localization

The plugin UI is available in **32 languages**. The active language follows Obsidian's interface language automatically, but you can also select a different language manually from the plugin settings.

**Supported languages:** Arabic (العربية), Bulgarian (Български), Chinese Simplified (中文简体), Chinese Traditional (中文繁體), Czech (Čeština), Danish (Dansk), Dutch (Nederlands), English, Finnish (Suomi), French (Français), German (Deutsch), Greek (Ελληνικά), Hebrew (עברית), Hindi (हिन्दी), Hungarian (Magyar), Indonesian (Bahasa Indonesia), Italian (Italiano), Japanese (日本語), Korean (한국어), Malay (Bahasa Melayu), Norwegian Bokmål (Norsk), Persian (فارسی), Polish (Polski), Portuguese (Português), Romanian (Română), Russian (Русский), Spanish (Español), Swedish (Svenska), Thai (ภาษาไทย), Turkish (Türkçe), Ukrainian (Українська), Vietnamese (Tiếng Việt).

> **Note for native speakers:** All translations except English were generated with AI assistance and may contain errors or unnatural phrasing. If you spot a mistake, contributions are very welcome!
>
> **To fix a translation via pull request:**
>
> 1. Fork the repository on GitHub.
> 2. Edit the relevant file in `src/i18n/` (e.g. `fr.ts` for French).
> 3. Open a pull request with your changes.
>
> Alternatively, you can report issues by email at [anivbniv@gmail.com](mailto:anivbniv@gmail.com).

## Permissions

Callout Studio uses a few Obsidian APIs that touch the vault and the system clipboard. Every use is local to your machine and tied to plugin functionality you can see and control:

- **Vault file enumeration** (`vault.getMarkdownFiles`). Used to power the features listed under **Vault discovery** and **Vault insights & maintenance** above: the optional initial scan, the **Scan now** button, callout statistics, **Replace in vault**, **Convert to plain text**, and the pre-delete usage check that warns you before removing an in-use callout. The plugin reads file contents with the standard `vault.cachedRead` / `vault.read` APIs and never sends them anywhere.
- **Vault file modification** (`vault.modify`). Only triggered when you explicitly run **Replace in vault**, **Convert to plain text**, or the editor commands (**Wrap in callout** / **Unwrap from callout**).
- **Clipboard access**. Two narrow, user-initiated uses:
    - **Copy callout Markdown** writes the selected callout to your clipboard when you click the menu item.
    - The ID/alias input field reads a paste event's text so you can paste multiple comma- or space-separated IDs at once. Only the text you actively paste into that field is read; the clipboard is never read otherwise.

No vault content, clipboard data, or usage information is ever transmitted off your device.

## Network usage and privacy

Callout Studio works offline by default and never sends any vault content anywhere. The **Google Material Symbols** icon list and search tags are bundled with the plugin, so opening and searching the Material tab does not fetch icon metadata from Google. The **Emoji** list and search tags are likewise bundled with the plugin (generated from [emojibase-data](https://github.com/milesj/emojibase)), so the Emoji tab works fully offline with no network access at all, no matter which emoji you pick. The only network activity for Material icons happens on demand:

- When the picker is open, the relevant Google Fonts stylesheet is loaded from `https://fonts.googleapis.com/css2?...` so the icon previews can render with the chosen style and weight.
- When you actually pick a Material icon for a callout, the plugin downloads that single icon's SVG from `https://fonts.gstatic.com/s/i/short-term/...` and caches the SVG locally so the icon works offline and in PDF export.
- On startup, if any callout already uses a Material icon whose SVG is missing from the local cache (e.g. after an import), the plugin downloads only those missing SVGs in the background.

If you never use Material icons, no network calls are made. Selected Material SVGs are cached inside the plugin's `data.json` and you can clear them at any time from settings. No telemetry or analytics is collected.

## 💖 Special Thanks

A huge thank you to all the wonderful people from around the world who helped shape this project! Whether by participating in discussions, reporting bugs, suggesting new features, or submitting pull requests — your contributions and support mean the world.

In chronological order:

* @brianjwalton #1 Thank you for bringing to my attention that my plugin conflicted with Style Settings plugin, and a special thanks for being the very first! Thank you for believing in the plugin when it was just getting started. Thank you so much!
* @ericxob77 #2 In my original design, spaces in the callout name were replaced with hyphens (-) to keep it as a single word. I don't know what I was thinking in the original design or why I made it so strict. Thank you for pointing this out! It's possible now, and I'm sure many other people are grateful to you for this too.
* @astreloff #3 Just like with the first issue, you also pointed out the problem my plugin had with the Style Settings plugin. Thank you so much!
* @TechnoMaverick #4 You asked me to support gradient backgrounds for callouts. When I was just starting out, this was very complicated for me and I couldn't get it to work the way I wanted. But trust me, I haven't forgotten about you! It's still in the back of my mind, and hopefully, I'll be able to make it happen someday.
* @rubcap #5 Thank you for pointing out that starting from Obsidian version 1.13 (which was in Catalyst at the time), callouts weren't rendered properly anymore.
* @epilo9er #6 The suggestion to add more right-click menu options was wonderful. A huge thanks for going the extra mile, opening a PR, and actually helping me write the code.
* @Xto-tT0 #7 #8 #9 #10 Wow, man, I don't know how to thank you. You gave me so many great ideas - from saving custom color presets to long discussions about how a callout heading should look. Your contribution was so massive that it made me jump straight from version 1.6.0 of the plugin right to version 2.0.0!

You can be on this list too! Feel free to open an issue to report bugs or share your ideas and suggestions. I would be more than happy to read them!


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
