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

<img alt="Three ways to use a callout" src="https://github.com/user-attachments/assets/3cf88262-184d-42e6-b810-d43889629afb" />


### Icons

Six icon libraries, all from one picker — choose a source from the menu and search across it:

| Source | Icons | Notes |
| --- | --- | --- |
| **Lucide** | ~1,600 | Obsidian's built-in set. Always available, always offline. |
| **Material Symbols** | 3,870 | Selectable style (Outlined / Filled / Rounded / Sharp) and weight (100–700). |
| **Emoji** | ~1,900 | Any Unicode emoji, with a skin-tone selector. |
| **Font Awesome** | 1,992 | Selectable style — Solid (1,422), Regular (169) or Brands (572). 68 categories to filter by. |
| **Octicons** | 383 | GitHub's set. Drawn at two sizes and picked automatically to suit the callout. |
| **RPG Awesome** | 495 | Fantasy and tabletop icons. |

Or leave it on **All sources** and search every library at once.

Searching works offline for every source from the moment you install — the names, keywords and categories all ship with the plugin. The last three sources download their artwork once, when you first press **Download** in the picker, and work offline afterwards. See [Network usage and privacy](#network-usage-and-privacy).

You can also fine-tune each callout's icon size and horizontal/vertical offset.

### Per-mode colors

- Separate **Light** and **Dark** colors for every callout. Callout Studio honors Obsidian's current theme automatically.
- Color presets: Obsidian's original callout palette plus extra curated presets.

<img alt="Per-mode colors" src="https://github.com/user-attachments/assets/8a37477c-2323-4464-9494-f3ed35e56f18" />

### Custom color palettes

Save your own reusable color palettes from **Settings → Custom palettes**, then pick them from the color dropdown on any callout:

- **Simple mode** — choose one base color and Callout Studio derives light and dark backgrounds and accents automatically, auto-correcting contrast so text stays readable.
- **Advanced mode** — fine-tune all four colors (light/dark accent and background) by hand, with live contrast warnings.
- Editing or deleting a saved palette never changes callouts you already colored with it - the colors are copied onto the callout the moment you pick the palette.

### `[!` autocomplete

When you type `[!` inside a blockquote, Callout Studio shows a suggestion list of available callouts:

- Picking a suggestion inserts a complete callout header.
- You can confirm a brand-new callout name on the spot — it will be added as a fallback row to the registry.

<img alt="autocomplete" src="https://github.com/user-attachments/assets/f3fd6c6c-e5de-4847-b46f-c7b42856d2fc" />

### Global callout style

Regular, heading, and inline callouts each get their own style popup, opened from **Settings → Global settings**:

- **Regular callouts** — border sides and thickness, corner rounding, independent Title scale and Content scale, and an option to align the body with the title.
- **Heading callouts** — border sides and thickness, corner rounding, vertical padding around the heading text, and a horizontal icon inset.
- **Inline callouts** — border sides and thickness, corner rounding, and a dedicated font scale for the pill text.

<img alt="Global callout style" src="https://github.com/user-attachments/assets/7558c077-1396-43de-9715-6538b4ca8297" />

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

<img alt="Right-click context menu" src="https://github.com/user-attachments/assets/4100cbe6-ba6f-45ce-986f-f3d7d17fdbac" />

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

A single **Reset everything** action returns the plugin to defaults: removes user callouts, restores built-in callouts, resets global styles, and clears cached icon artwork.

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

Callout Studio never sends vault content anywhere, and collects no telemetry or analytics. Every network request it makes is listed here.

**Nothing is fetched by opening a note, or by opening the icon picker.** Browsing and searching every icon source works offline from the moment you install the plugin, because the names, keywords and categories are all bundled. Only artwork is ever downloaded, and only for icons you actually choose.

### Downloadable icon sources

Font Awesome, Octicons and RPG Awesome ship their artwork as files downloaded the first time you press **Download** on that source in the picker. After that the source works entirely offline. Font Awesome is three files, one per style, fetched together by that one button — and only the ones you do not already have.

| Source | Download size |
| --- | --- |
| Font Awesome | 1.4 MB (Solid 794 KB, Regular 105 KB, Brands 559 KB) |
| Octicons | 375 KB |
| RPG Awesome | 625 KB |

These come from this plugin's own repository, pinned to an immutable tag:

```
https://cdn.jsdelivr.net/gh/Niv20/obsidian-Plugin-Callout-Studio@packs-v1/packs/<source>.json
https://raw.githubusercontent.com/Niv20/obsidian-Plugin-Callout-Studio/packs-v1/packs/<source>.json   (fallback)
```

Each download is checked against a SHA-256 checksum built into the plugin, and rejected unless it matches exactly — so a compromised CDN, a captive portal or a truncated response cannot substitute anything. The file is then stored at `.obsidian/plugins/callout-studio/icon-packs/<source>.json`, and re-checked against the same checksum every time it is read, so a file that is later edited or damaged is never trusted.

**Two things download a source without you pressing the button**, because in both you have already asked for the icons in question:

- **Importing callouts.** An import file names icons but carries no artwork, so whatever the imported callouts need and this vault does not have is fetched, and a notice says which sources arrived.
- **Repairing a damaged or deleted pack file.** On startup, a source a callout uses that has gone missing or no longer matches its checksum is downloaded again. This only happens if a callout would otherwise be undrawable — if the icons you use are already cached in `data.json` (which is the normal case), nothing is fetched.

**Installing a source without a network:** download the file from the plugin's [GitHub release](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/releases) and drop it into that folder, named after the source (`fa-solid.json`, `octicons.json`, and so on). It is verified against the same checksum on the next launch.

### Material Symbols

Material Symbols is the exception: it has over 100,000 style and weight combinations, so there is no single file to ship. It fetches one drawing at a time instead:

- While its tab is open, the Google Fonts stylesheet is loaded from `https://fonts.googleapis.com/css2?...` so the grid can preview icons in the chosen style and weight.
- When you pick an icon, that one SVG is downloaded from `https://fonts.gstatic.com/s/i/short-term/...`.
- On startup, if a callout uses a Material icon whose artwork is missing locally (after an import, say), only those are fetched.

If you never open the Material source, none of this happens.

### Your own pictures

**Your images** is the one source that downloads nothing, ever. You add SVG, PNG, JPEG or WebP files from your own computer, and they stay on your device.

- **An SVG stays an SVG**, so it is sharp at any size — but only after being filtered through a strict allow-list. Shapes, gradients and clipping survive; scripts, event handlers, `<foreignObject>`, external references and anything that could fetch from the network do not. That filtering is repeated every time the file is read, not just when you add it, so a picture that arrives in an import or is edited by hand is checked too.
- **A PNG, JPEG or WebP is re-encoded**: it is decoded, scaled so its longest side is at most 128 pixels, and drawn onto a canvas. What gets stored is the resulting pixels, so nothing of the original file survives to be interpreted later.
- **Pictures live in `data.json` with the rest of your settings.** That means they sync wherever your settings sync, and an export carries them — one JSON file, the same **Import** button, no archive to unpack.
- **SVG pictures can follow the callout's color** instead of keeping their own, which is what makes a flat one-color logo track your light and dark themes. Callout Studio guesses when you add the file — one color means follow, several means keep — and there is a toggle in the picker either way. PNG, JPEG and WebP always keep their own colors: painting a callout's color through a picture is a stencil, and a photograph would come out a silhouette.

### What is stored locally

- **The artwork of icons you actually use** is copied into the plugin's `data.json`, so your callouts still render on a device that synced your settings but never downloaded the source, and after a cached pack file is deleted. Unused entries are cleaned up automatically when you edit or delete a callout; **Reset all** clears them outright.
- **The pictures you added yourself**, also in `data.json` — typically five to twenty kilobytes each after the size cap above. The picker shows the running total, and **Reset all** clears them along with everything else you made.
- **Downloaded icon sources** live in `.obsidian/plugins/callout-studio/icon-packs/`. Deleting them is safe: your callouts keep rendering from the copy in `data.json`, and the picker offers the download again. If a callout does turn out to need artwork that only the deleted file had, it is fetched again on the next launch.
- **Two snapshots of the plugin's generated CSS**, to remove the brief flash of unstyled callouts on slow startups (mainly mobile): an auto-generated snippet at `.obsidian/snippets/callout-studio-do-not-delete.css`, which Obsidian applies before community plugins load, and a small per-device localStorage cache. Both contain only generated styling, never vault content, and never leave your device. The snippet is self-healing: if it is deleted or turned off, the plugin recreates and re-enables it the next time it loads, so the startup flash never silently comes back.

## Icon licences and attribution

Callout Studio's own code is [0BSD](LICENSE), but the icon libraries it draws on keep their own licences — see **[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)** for the full text of each, also reachable from *Settings → Icon licences and credits*.

Two points worth knowing before you publish something made with these icons:

- **Font Awesome Free** icons are [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), © Fonticons, Inc. Attribution travels with them, so a theme or template you share that uses them carries the same requirement.
- **Brand icons** — Font Awesome's Brands style, and GitHub's own marks within Octicons — are trademarks, which no icon licence grants rights to. Font Awesome asks that they be used only to represent the company, product or service they refer to; the picker repeats that notice whenever the Brands style is selected.

## 💖 Special Thanks

A huge thank you to all the wonderful people from around the world who helped shape this project! Whether by participating in discussions, reporting bugs, suggesting new features, or submitting pull requests — your contributions and support mean the world.

In chronological order:

* [@brianjwalton](https://github.com/brianjwalton) [#1](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/1) Thank you for bringing to my attention that my plugin conflicted with Style Settings plugin, and a special thanks for being the very first! Thank you for believing in the plugin when it was just getting started. Thank you so much!
* [@ericxob77](https://github.com/ericxob77) [#2](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/2) In my original design, spaces in the callout name were replaced with hyphens (-) to keep it as a single word. I don't know what I was thinking in the original design or why I made it so strict. Thank you for pointing this out! It's possible now, and I'm sure many other people are grateful to you for this too.
* [@astreloff](https://github.com/astreloff) [#3](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/3) Just like with the first issue, you also pointed out the problem my plugin had with the Style Settings plugin. Thank you so much!
* [@TechnoMaverick](https://github.com/TechnoMaverick) [#4](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/4) You asked me to support gradient backgrounds for callouts. When I was just starting out, this was very complicated for me and I couldn't get it to work the way I wanted. But trust me, I haven't forgotten about you! It's still in the back of my mind, and hopefully, I'll be able to make it happen someday.
* [@rubcap](https://github.com/rubcap) [#5](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/5) Thank you for pointing out that starting from Obsidian version 1.13 (which was in Catalyst at the time), callouts weren't rendered properly anymore.
* [@epilo9er](https://github.com/epilo9er) [#6](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/pull/6) The suggestion to add more right-click menu options was wonderful. A huge thanks for going the extra mile, opening a PR, and actually helping me write the code.
* [@Xto-tT0](https://github.com/Xto-tT0) [#7](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/7) [#8](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/8) [#9](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/9) [#10](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/10) [#11](https://github.com/Niv20/obsidian-Plugin-Callout-Studio/issues/11) Wow, man, I don't know how to thank you. You gave me so many great ideas - from saving custom color presets to long discussions about how a callout heading should look. Your contribution was so massive that it made me jump straight from version 1.6.0 of the plugin right to version 2.0.0!

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

Callout Studio's own code is [0BSD](LICENSE) — use it however you like, no attribution required.

The icon libraries it offers are separate works under their own licences, which 0BSD does not cover. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
