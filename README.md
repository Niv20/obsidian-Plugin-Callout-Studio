# Callout Studio

Callout Studio is a powerful callout management **plugin** for [Obsidian.](https://obsidian.md)

It lets you create, edit, and style your own callout types, override the built-in ones, pick icons from large libraries, and use every callout as a Block Callout, a Heading Callout, or an Inline Callout - all from a single settings tab!

<img alt="hero" src="https://github.com/user-attachments/assets/e24ff986-cf0c-4f18-95be-33a75283d83a" />

## Features

### Three ways to use a callout

The same callout definition can be used in **three** different forms, each with its own vault-wide style controls:

1. **Block Callout** — the classic Obsidian blockquote: `> [!note]`.
2. **Heading Callout** — put the token right after the heading marks, e.g. `## [!note]`, to turn the whole heading into a colored, foldable bar.
3. **Inline Callout** — drop the token in the middle of a sentence, e.g. `[!note]`, to get a small colored callout without breaking the paragraph.

All three forms render in Live Preview, Reading view, and PDF export.

Obsidian lets you attach **metadata** to a callout after a pipe — `> [!note|purple]` is the `note` callout carrying the metadata `purple`, which themes and CSS snippets can style through `data-callout-metadata`. Callout Studio ignores the metadata when deciding *which* callout you meant, so `[!note]`, `[!note|purple]` and `[!note|green]` are all one **Note**, with a single row in your callout list. All three forms honour this, and heading and inline callouts carry `data-callout-metadata` too.

<img alt="Three ways to use a callout" src="https://github.com/user-attachments/assets/3cf88262-184d-42e6-b810-d43889629afb" />


### Icons

Seven icon libraries, all from one picker — choose a source from the menu and search across it:

| Source | Icons | Notes |
| --- | --- | --- |
| **Lucide** | ~1,600 | Obsidian's built-in set. Always available, always offline. |
| **Tabler Icons** | 5,130 | Selectable style — Outline (all 5,130) or Filled (1,054). 41 categories to filter by. |
| **Material Symbols** | 3,870 | Selectable style (Outlined / Filled / Rounded / Sharp) and weight (100–700). |
| **Emoji** | ~1,900 | Any Unicode emoji, with a skin-tone selector. |
| **Font Awesome** | 1,992 | Selectable style — Solid (1,422), Regular (169) or Brands (572). 68 categories to filter by. |
| **Octicons** | 383 | GitHub's set. Drawn at two sizes and picked automatically to suit the callout. |
| **RPG Awesome** | 495 | Fantasy and tabletop icons. |

Or leave it on **All sources** and search every library at once.

Searching works offline for every source from the moment you install — the names, keywords and categories all ship with the plugin. Tabler Icons, Font Awesome, Octicons and RPG Awesome download their artwork once, when you first press **Download** in the picker, and work offline afterwards. See [Network usage and privacy](#network-usage-and-privacy).

You can also fine-tune each callout's icon size and horizontal/vertical offset.

**Or no icon at all.** Hover the icon tile in the callout editor and a small **✕** appears in its corner (always visible on phone and tablet, where there is no hover); press it and the callout renders with no icon anywhere — block, heading, inline, and in an exported PDF. The title moves left to the callout's edge, and if **Align content with title** is on, the body follows it rather than staying indented under nothing. The icon you had picked is remembered, so pressing the tile again reopens the picker on that exact drawing.

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

Block, heading, and inline callouts each get their own style popup, opened from **Settings → Global settings**:

- **Block callouts** — border sides and thickness, corner rounding, independent Title scale and Content scale, and an option to align the body with the title.
- **Heading callouts** — border sides and thickness, corner rounding, vertical padding around the heading text, and a horizontal icon inset.
- **Inline callouts** — border sides and thickness, corner rounding, and a dedicated font scale for the callout text.

<img alt="Global callout style" src="https://github.com/user-attachments/assets/7558c077-1396-43de-9715-6538b4ca8297" />

### Default fallback callout

When a note uses a callout ID that doesn't exist in the registry, Callout Studio styles it using the **default fallback callout**. You can pick which callout acts as the fallback in settings.

### External style — let your theme own a callout

Some themes (ITS, Border, AnuPpuccin…) ship elaborate callout styling of their own, and Callout Studio wins those conflicts by default: its CSS is applied last, so at the specificity a theme normally writes, the plugin's rule takes precedence.

**External style** turns that off for one callout at a time. Open the **⋯** menu on any row — built-in or custom — and pick **Use external style (theme or CSS)**. From then on Callout Studio emits no CSS and renders no DOM for that callout: no colors, no background, no icon, no border, radius or text-size from Global style, and no icon repainting. Your theme, your CSS snippet, or plain Obsidian decides how it looks.

Two things to know:

- The callout's **heading** (`## [!type]`) and **inline** (`word [!type] word`) forms stop rendering too. Those are Callout Studio's own syntax, so there is no theme styling for them to fall back to — the `[!type]` simply stays as the text you wrote.
- The row stays in your list, tagged **External style**, with its icon and color swatches hidden — they no longer describe anything you'd see. Clicking edit opens a window that explains the situation and shows a live preview of how your theme actually renders it, with one button to take control back.

The **default fallback callout** can't be marked this way; pick a different fallback first.

### Vault discovery

Callout Studio keeps the registry in sync with what's actually used in your vault:

- **Large vaults:** If your vault has 500 or more markdown files, the plugin will ask for your permission before performing a full initial scan. If you decline, files will be scanned individually as you open them.
- New callout IDs typed in open notes are picked up automatically.
- When you open the settings tab, in-memory editor buffers are scanned for unsaved IDs.
- A **Scan now** button performs a one-shot vault scan that adds any unrecognized IDs as fallback rows so you can see them in the list and customize them.
- Auto-created fallback rows that are never used and never customized are pruned automatically in the background.

### Right-click context menu

Right-click on any callout - block, heading, or inline - to get extra actions injected into Obsidian's native menu:

- Edit callout settings
- Open Callout Studio settings
- Block callouts: copy callout Markdown, set the fold state (open / closed / non-collapsible)
- Heading callouts: cut, copy, or delete the whole heading section

You can choose which of these actions appear for each of the three forms, and reorder them, from **Settings → Customize menu items**.

<img alt="Right-click context menu" src="https://github.com/user-attachments/assets/4100cbe6-ba6f-45ce-986f-f3d7d17fdbac" />

### Editor commands

Callout Studio adds the following commands. **No keyboard shortcuts are assigned by default.** **Settings → Keyboard shortcuts → Manage commands** lists every one of them with the shortcut it is currently bound to; selecting a shortcut — or the word *Blank*, where there isn't one — opens Obsidian's own hotkey settings on that command.

- **Open settings** — opens the Callout Studio settings tab.
- **Create new callout type** — opens the callout editor.
- **Insert empty callout** — starts a new callout at the cursor, then triggers the autocomplete so you can pick a type.
- **Wrap in callout** — wraps the current paragraph or selection in a callout, then triggers the autocomplete so you can pick a type.
- **Unwrap from callout** — removes one callout level around the cursor or selection.

### Custom commands

Those five are all Callout Studio ever adds on its own — it deliberately does **not** register a command per callout type, which would flood the command palette with hundreds of entries.

Instead, build the specific ones you want in that same **Manage commands** window. Pick a format (heading, inline or block), a callout type, and — where the format offers a choice — a heading level or whether the command wraps the selection or inserts a new callout. Each command you create is registered with Obsidian, so it shows up in the command palette and in **Settings → Hotkeys** ready for a shortcut:

- *Wrap in Warning callout*
- *Insert H2 Note heading callout*
- *Insert Important inline callout*

They behave exactly like the generic commands above — same handling of selections, cursor position, nesting, code blocks and frontmatter — with the type already chosen, so there is no autocomplete step.

Custom commands stay tied to the callout they use. Renaming a callout updates the command's name and keeps your shortcut; deleting a callout removes the commands that depended on it, so nothing broken is left behind in the palette. Editing a command keeps its shortcut, because a command's identity is independent of what it does.

### Vault insights & maintenance

- **Callout statistics** — scans every Markdown file in the vault and lists every callout type with its usage count, file count, and source (built-in / custom / auto-fallback / CSS snippet / unknown).
- **Replace in vault** — replace every occurrence of one callout ID with another, in one pass.
- **Convert to plain text** — strip a callout while preserving its content as a normal paragraph block.

### Import / export

- Export all your custom callout definitions and saved color palettes to a JSON file.
- Import a JSON file produced by Callout Studio. The importer validates every entry, reports issues per row, lets you import only the valid entries, and merges imported color palettes into your existing ones instead of overwriting them.
- **Import from Callout Manager** — bring your customized callouts over with their icons and colors. It can read the Callout Manager plugin's own settings straight out of this vault (nothing is exported first, and nothing is written back), or take the styles its Copy button puts on your clipboard. The vault route brings over more: colors it stored separately for light and dark mode arrive as both, and callouts you created but never restyled come across too — neither of which appears in the copied styles at all. Per-theme styling and custom CSS have no equivalent here and are left behind, and anything that could not be brought over is listed before the import runs.
- **Import from Admonition** — bring your custom admonitions over with their names, icons and colors. It can read the Admonition plugin's own settings straight out of this vault (nothing is exported first, and nothing is written back), or take an `admonitions.json` file or pasted JSON. Every icon library Admonition offers — Obsidian's own, Font Awesome, Octicons, RPG Awesome — is one Callout Studio already has, and pictures you uploaded there come across into **Your images**. Settings with no equivalent here (command, copy button, hidden title) are left behind, and anything that could not be brought over is listed before the import runs.
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

Tabler Icons, Font Awesome, Octicons and RPG Awesome ship their artwork as files downloaded the first time you press **Download** on that source in the picker. After that the source works entirely offline. A source with styles is several files, one per style, fetched together by that one button — and only the ones you do not already have.

| Source | Download size |
| --- | --- |
| Tabler Icons | 1.7 MB (Outline 1.14 MB, Filled 503 KB) |
| Font Awesome | 1.4 MB (Solid 794 KB, Regular 105 KB, Brands 559 KB) |
| Octicons | 375 KB |
| RPG Awesome | 625 KB |

These come from this plugin's own repository, pinned to an immutable tag:

```
https://cdn.jsdelivr.net/gh/Niv20/obsidian-plugin-callout-studio@packs-v2/packs/<source>.json
https://raw.githubusercontent.com/Niv20/obsidian-plugin-callout-studio/packs-v2/packs/<source>.json   (fallback)
```

Each download is checked against a SHA-256 checksum built into the plugin, and rejected unless it matches exactly — so a compromised CDN, a captive portal or a truncated response cannot substitute anything. The file is then stored at `.obsidian/plugins/callout-studio/icon-packs/<source>.json`, and re-checked against the same checksum every time it is read, so a file that is later edited or damaged is never trusted.

**Two things download a source without you pressing the button**, because in both you have already asked for the icons in question:

- **Importing callouts.** An import file names icons but carries no artwork, so whatever the imported callouts need and this vault does not have is fetched, and a notice says which sources arrived.
- **Repairing a damaged or deleted pack file.** On startup, a source a callout uses that has gone missing or no longer matches its checksum is downloaded again. This only happens if a callout would otherwise be undrawable — if the icons you use are already cached in `data.json` (which is the normal case), nothing is fetched.

**Installing a source without a network:** download the file from the plugin's [GitHub release](https://github.com/Niv20/obsidian-plugin-callout-studio/releases) and drop it into that folder, named after the source (`tabler-outline.json`, `fa-solid.json`, `octicons.json`, and so on). It is verified against the same checksum on the next launch.

### Material Symbols

Material Symbols is the exception: it has over 100,000 style and weight combinations, so there is no single file to ship. It fetches one drawing at a time instead:

- While its tab is open, the Google Fonts stylesheet is loaded from `https://fonts.googleapis.com/css2?...` so the grid can preview icons in the chosen style and weight. The font file it points at is then saved to `.obsidian/plugins/callout-studio/icon-fonts/`, so every later launch previews the grid from disk and this source works offline too. One file per style you open, 1.0–1.5 MB each; deleting them is safe, and they are fetched again the next time you open that style.
- When you pick an icon, that one SVG is downloaded from `https://fonts.gstatic.com/s/i/short-term/...`.
- On startup, if a callout uses a Material icon whose artwork is missing locally (after an import, say), only those are fetched.

If you never open the Material source, none of this happens. If the preview font cannot be reached, the grid says so and shows icon names instead — searching and picking still work, and a **Try again** button retries once you are back online.

### Your own pictures

**Your images** is the one source that downloads nothing, ever. You add SVG, PNG, JPEG or WebP files from your own computer, and they stay on your device.

- **An SVG stays an SVG**, so it is sharp at any size — but only after being filtered through a strict allow-list. Shapes, gradients and clipping survive; scripts, event handlers, `<foreignObject>`, external references and anything that could fetch from the network do not. That filtering is repeated every time the file is read, not just when you add it, so a picture that arrives in an import or is edited by hand is checked too.
- **A PNG, JPEG or WebP is re-encoded**: it is decoded, scaled so its longest side is at most 128 pixels, and drawn onto a canvas. What gets stored is the resulting pixels, so nothing of the original file survives to be interpreted later.
- **Pictures live in `data.json` with the rest of your settings.** That means they sync wherever your settings sync, and an export carries them — one JSON file, the same **Import** button, no archive to unpack.
- **SVG pictures can follow the callout's color** instead of keeping their own, which is what makes a flat one-color logo track your light and dark themes. Callout Studio guesses when you add the file — one color means follow, several means keep — and there is a toggle in the picker either way. PNG, JPEG and WebP always keep their own colors: painting a callout's color through a picture is a stencil, and a photograph would come out a silhouette.

### What is stored locally

- **The artwork of icons you actually use** is copied into the plugin's `data.json`, so your callouts still render on a device that synced your settings but never downloaded the source, and after a cached pack file is deleted. Unused entries are cleaned up automatically when you edit or delete a callout; **Reset all** clears them outright.
- **The pictures you added yourself**, also in `data.json` — typically five to twenty kilobytes each after the size cap above. The picker shows the running total, and **Reset all** clears them along with everything else you made.
- **The commands you built**, in `data.json` — a few bytes each, recording only the format, callout and heading level you chose. The shortcut itself belongs to Obsidian and lives in its own `hotkeys.json`, so it survives the command being edited.
- **Downloaded icon sources** live in `.obsidian/plugins/callout-studio/icon-packs/`. Deleting them is safe: your callouts keep rendering from the copy in `data.json`, and the picker offers the download again. If a callout does turn out to need artwork that only the deleted file had, it is fetched again on the next launch.
- **The Material Symbols preview font**, in `.obsidian/plugins/callout-studio/icon-fonts/` — one 1.0–1.5 MB file per style you have opened in the picker. It is only used to draw the picker's grid, never your notes, so deleting it costs nothing beyond re-downloading it the next time you browse that style.
- **A snapshot of the plugin's generated CSS**, to shorten the brief flash of unstyled callouts on slow startups (mainly mobile). It is a small per-device cache in the app's own local storage — not a file in your vault — and it holds only generated styling, never vault content. It never leaves your device, and it is re-read the moment the plugin starts loading, before anything is fetched from disk. Versions up to 2.5.0 also wrote a CSS snippet into `.obsidian/snippets/`; that file is no longer created, and any copy left from an older version is deleted automatically the next time the plugin loads.

## Icon licences and attribution

Callout Studio's own code is under a permissive [license](LICENSE) — free to use, copy, modify, and distribute. The icon libraries it draws on keep their own licences — see **[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)** for the full text of each, also reachable from *Settings → Icon licences and credits*.

One informal ask, not a license term: please don't repackage this code and publish it as a new plugin in Obsidian's Community Plugins directory. Feel free to reuse, learn from, and build on it — just don't be that person.

Two points worth knowing before you publish something made with these icons:

- **Font Awesome Free** icons are [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), © Fonticons, Inc. Attribution travels with them, so a theme or template you share that uses them carries the same requirement.
- **Brand icons** — Font Awesome's Brands style, Tabler's Brand category, and GitHub's own marks within Octicons — are trademarks, which no icon licence grants rights to. Font Awesome asks that they be used only to represent the company, product or service they refer to; the picker repeats that notice whenever the Brands style is selected, and the same caution applies to the other two.

## 💖 Special Thanks

A huge thank you to everyone who took the time to report bugs, identify issues, and help make Callout Studio more stable and reliable. Your reports, testing, and detailed feedback have been incredibly helpful:

[brianjwalton](https://github.com/brianjwalton) · [astreloff](https://github.com/astreloff) · [rubcap](https://github.com/rubcap) · [Xto-tT0](https://github.com/Xto-tT0) · [Jarsgon](https://github.com/Jarsgon) · [Ravencaller213](https://github.com/Ravencaller213) · [frudolph77](https://github.com/frudolph77) · [DesertSnak3](https://github.com/DesertSnak3)

And a huge thank you to everyone who shared ideas, suggested enhancements, and helped shape the direction of Callout Studio. Many of the features and improvements in the plugin have been inspired by your feedback and suggestions:

[ericxob77](https://github.com/ericxob77) · [TechnoMaverick](https://github.com/TechnoMaverick) · [epilo9er](https://github.com/epilo9er) · [Xto-tT0](https://github.com/Xto-tT0) · [TyceHerrman](https://github.com/TyceHerrman) · [eth-p](https://github.com/eth-p) · [kwhsiung](https://github.com/kwhsiung) · [archangelglass](https://github.com/archangelglass) · [quantumstargazer](https://github.com/quantumstargazer)

Thank you all for helping make Callout Studio better!

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

### Plugin API

Callout Studio exposes a small read-only API so other plugins can list the user's callout types and react when that list changes. See [API.md](API.md).

## License

Callout Studio's own code is under a permissive [license](LICENSE) — use it however you like, no attribution required.

The icon libraries it offers are separate works under their own licences, which this license does not cover. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
