# Callout Studio

Callout Studio is a powerful callout management **plugin** for [Obsidian.](https://obsidian.md)

It lets you create, edit, and style your own callout types, override the built-in ones, pick icons from large libraries, and use every callout as a Block Callout, a Heading Callout, or an Inline Callout - all from a single settings tab!

<img alt="hero" src="https://github.com/user-attachments/assets/e24ff986-cf0c-4f18-95be-33a75283d83a" />

## The syntax

The same callout type can be written three ways:

```md
> [!note] A Block Callout — the classic Obsidian blockquote
## [!note] A Heading Callout — a colored, foldable heading bar
Some text with an [!note] Inline Callout dropped right in
```

<img alt="Three ways to use a callout" src="https://github.com/user-attachments/assets/3cf88262-184d-42e6-b810-d43889629afb" />

That's the whole syntax. Everything else — colors and palettes, icons, global style, the right-click menu, commands, vault discovery, import/export, themes, and more — is covered in the full guide:

**➡️ [Read the Callout Studio user guide](user-guide/README.md)**

## Privacy, in short

Callout Studio never sends vault content anywhere, and collects no telemetry or analytics. The only things it ever downloads are icon artwork you actually pick and, when needed, the plugin's own UI translation — both explained in full, with exactly what's stored where, in [Privacy & permissions](user-guide/16-privacy-and-permissions.md).

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

Digging into how it's built, or preparing a pull request? See [`internals-docs/`](internals-docs/00-index.md) for the architecture, and [CONTRIBUTING.md](CONTRIBUTING.md) for the process.

### Plugin API

Callout Studio exposes a small read-only API so other plugins can list the user's callout types and react when that list changes. See [API.md](API.md).

## License

Callout Studio's own code is under a permissive [license](LICENSE) — use it however you like, no attribution required.

The icon libraries it offers are separate works under their own licences, which this license does not cover. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
