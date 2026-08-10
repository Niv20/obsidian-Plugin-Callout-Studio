# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # watch-mode build (esbuild, inline sourcemaps)
npm run build     # production build (typecheck + minify)
npm run lint      # ESLint across src/
```

No automated test suite — testing is manual: copy `main.js`, `manifest.json`, and `styles.css` to `<Vault>/.obsidian/plugins/callout-studio/` and reload Obsidian.

Versions: bump `manifest.json` + `versions.json` together. Tag must match `manifest.json` version exactly (no leading `v`).

Releases are cut with the `/release` skill (`.claude/skills/release/SKILL.md`) — it bumps all four version files, tags, pushes, waits for the build, and publishes. Don't bump or tag by hand.

## Architecture

Callout Studio is an Obsidian plugin that lets users create and manage custom callout types with icons, colors, and styles. It bundles `src/main.ts` → `main.js` via esbuild.

### Core managers (`src/manager/`)

- **CalloutRegistry** — single source of truth for all callout definitions. Owns the `Map<id, CalloutDefinition>`, serializes to/from `data.json`, runs CRUD and data migrations, fires `onChange` callbacks on every mutation.
- **CSSInjector** — reads the registry and generates dynamic CSS custom properties per callout (colors, icons, light/dark overrides). Uses `adoptedStyleSheets` (one global per window). Injects synchronously, guarded by a re-entrancy latch. Calls `app.workspace.trigger("css-change")` after inject to force Obsidian re-render.
- **CalloutDiscovery** — watches file-open/modify events and scans markdown for unknown `[!id]` patterns. Auto-creates "fallback" rows for new IDs. Prunes unused auto-created rows in a background debounced pass.
- **IconService** (`src/icons/`) — the one entry point to icon artwork. Owns `IconFetchManager` (Material's per-icon fetches from fonts.gstatic.com) and `PackDataStore` (whole-pack downloads, SHA-256 verified on download *and* on every disk read, cached under `<plugin-dir>/icon-packs/`). Notifies listeners when artwork lands so CSS can re-inject. `ensureArtwork()` covers one icon (the picker); **`ensureArtworkFor()` is the only repair path** — it takes a batch, skips anything already drawable from `iconSvgCache`, groups the rest by `icon.type` so a pack downloads once, and is what import and startup both call.

### Data flow

1. User edits a callout → `registry.update()` → `onChange` fires  
2. `onChange` → `cssInjector.scheduleInject()` + Obsidian CSS-change trigger  
3. `CSSInjector.inject()` → new CSS in `adoptedStyleSheets` + DOM icon refresh  
4. User opens a note → `CalloutDiscovery` scans → auto-creates fallback rows if needed  
5. Icon selected → `IconService.ensureArtwork()` → fetch if needed → copy into `iconSvgCache` → re-inject  

### Settings UI (`src/settings/`)

**Every modal wears the same chrome, and `modalChrome.ts` is the only way to put it on.** `applyModalChrome(modal, {footer?, wide?})` gives the window three bands — a fixed header whose rule runs edge to edge, `.modal-content` as the *one* scroll container, and (when `footer` is set) the returned pinned button bar. It works by taking Obsidian's own 16px off `.modal` and handing it to the bands as `--cs-modal-inset`, so a new window must never re-add padding to `.modal` or `.modal-content`. Buttons go in the returned footer, not in a `modal-button-container` inside the content. Two deliberate exceptions: `WelcomeModal` is a splash and opts out entirely, and `ConfirmModal`/`ReplaceCalloutModal` set no title, so they get no header rule. **Anything sticky inside the body must sit at `top: 0`** — a positive offset parks an opaque layer below the header rule and eats the text scrolling behind it (see `.callout-studio-preview-col`).

`SettingsTab.ts` composes 11 section modules under `settings/sections/`. `CalloutEditor.ts` is the edit/create modal with a real, editable Live Preview via `LiveCalloutPreview.ts`, which hosts an embedded Obsidian markdown editor (`EmbeddableMarkdownEditor.ts`) so callouts render 1:1 with a note in the active theme; it falls back to a static `MarkdownRenderer` render if the (undocumented) embed API is unavailable. `settings/iconpicker/` is the icon picker: `IconPickerModal` (source menu + preview + confirm), `PackPanel` (one source's toolbar and grid, driven entirely by its `IconPack`), `IconGrid` (paging and key nav), `allSources` (the pooled cross-source search).

### Editor integrations (`src/editor/`)

- **AutoComplete** — `EditorSuggest` triggered by `> [!`; shows callout list + "Create new" option.
- **ContextMenu** — right-click menu on callout blocks (edit, copy, settings).
- **Commands** — 4 commands: open settings, create new type, wrap selection, unwrap block.

### Icon sources (`src/icons/`)

Two id spaces, kept apart in `icons/registry.ts`, both total `Record`s so declaring an id without the thing behind it is a compile error:

- **`IconSourceId`** (8) — a library as the user meets it: one row in the picker's source menu, one toolbar, one Download button. `ICON_SOURCES` maps it to the `IconPack` (`icons/types.ts`).
- **`IconPackId`** (11) — one body of artwork: one `CalloutIcon.type`, one pack manifest entry, one downloaded file, one SVG cache key. `SOURCE_OF_TYPE` maps it to its source, which is what `packFor(icon)` walks.

They differ only for Font Awesome (one source, three files — `fa-solid`/`fa-regular`/`fa-brands`) and Tabler (one source, two — `tabler-outline`/`tabler-filled`), each chosen by its style control. **Cache keys and pack-store calls use `icon.type`, never `pack.id`** — using the source id would collapse the styles onto one entry and orphan everything already cached.

`IconPackKind` decides how artwork reaches the screen: `builtin` (Lucide, via `setIcon`), `glyph` (emoji), `perIconRemote` (Material — 100,000+ style/weight variants, so fetched one at a time), `bundledRemote` (Tabler, Font Awesome, Octicons, RPG Awesome — files downloaded on request, listed per source in `dataPacks`), `local` (**Your images** — the user's own files, held in `settings.userImages`, never fetched).

Two subsystems are narrow enough to live in their own skill rather than here: Tabler's stroked outline drawings (`tabler-outline-stroke` skill) and the **Your images** user-upload source (`user-image-icons` skill).

A pack's optional `entryMatches` filters the grid by variant (Font Awesome's style and Tabler's pick *which* icons exist, not just how they look — only 1,054 of Tabler's 5,130 have a filled drawing), and `pickerNotice` scopes a standing notice to certain variants (the Brands trademark note).

`renderIcon.ts` is the **only** code that turns an icon into DOM; every surface calls `renderIconInto`. Never reach into the SVG cache from a renderer — go through `IconResolver`.

Search indexes are bundled (packed by `icons/data/codec.ts`); artwork is not. Regenerate with `npm run icons:generate` — never part of `npm run build`, and its output is committed. Pack files are served from the `packs-v2` tag; refreshing them means a **new tag** plus updated checksums in `icons/data/packManifest.ts`, because jsDelivr caches tags permanently.

### Callout colour and the nesting invariant

**Backgrounds are painted as translucent tints, never the authored hex — there is no opt-out.** Obsidian's nested-callout stepping only works by compositing translucent layers; an opaque fill hides everything behind it and breaks nesting for anything stacked inside. This is why the old `solidBackground` flag was retired rather than kept as a toggle. `translucentTintFor` (`utils/colorUtils.ts`) does the actual color-mix math, and an unmodified built-in still gets no `--callout-color` at all so theme overrides keep deciding its accent. See the `callout-color-nesting` skill for the full alpha-solving derivation and the two migrations that clean up old data.

### Key types (`src/types.ts`)

`CalloutDefinition` is the core data model: `id`, `displayName`, `icon`, `color`, `darkColor`, `aliases`, `transforms`, `source` (`"builtin" | "user" | "fallback" | "theme" | "plugin"`), `metadata`.

`PluginSettings` holds global style (border, radius, scale), feature toggles (autocomplete, context menu, icon source preferences), and the two lists the user builds up: `customPalettes` and `userImages`. Both live in settings rather than on `PluginData` precisely so `exportToJSONv2()` carries them — and both must therefore be **merged by id** on import, never `Object.assign`ed, or importing a file without them wipes the user's own.

### Callout sources

| Source | Meaning |
|--------|---------|
| `builtin` | One of the 14 defaults in `src/constants.ts` |
| `user` | User-created or customized |
| `fallback` | Auto-created by discovery for unknown IDs |
| `theme`/`plugin` | Injected by other plugins via the public API |

Built-in callouts are never stored unless modified — `toSaveData()` only persists modified built-ins and all user callouts.

### Callout metadata (`[!type|metadata]`)

Obsidian splits a callout header at the **first `|`**: everything before it is the type, everything after is metadata (`data-callout-metadata`) — so `> [!note|purple]` is the `note` callout, not one named `note|purple`. **`splitCalloutMetadata`/`normalizeCalloutId` (`utils/calloutId.ts`) is the one funnel every raw-markdown path goes through**, which is what makes a piped id structurally unreachable by the registry — token `from`/`to` still span the whole `[!…]`, so nothing may derive a length from `rawId` alone, and anything that rewrites a token must put the metadata back. See the `callout-metadata-pipe` skill for the migration/edge-case reasoning (`stripMetadataFromIds`, the `notegreen` case, import rejection).

### Public API (`src/api/PluginAPI.ts`)

Exposes registry and discovery methods to other Obsidian plugins. Treat this surface as stable — don't remove or rename exported methods.

### Localization (`src/i18n/`)

`t()` for all user-facing strings — never hardcode UI text. 32 locales live here (see `index.ts` for the loading/fallback-to-English logic). When adding or changing a string, only touch `en.ts`; don't re-translate the rest on every small edit — wait until the user confirms they're happy with the wording, then offer to translate it into the other locale files.

## Coding conventions

- Keep `src/main.ts` minimal — lifecycle and wiring only. All logic lives in sub-modules.
- Files over ~300 lines should be split by responsibility.
- All listeners and intervals must use `this.registerEvent` / `this.registerInterval` / `this.registerDomEvent` so they are cleaned up on unload.
- Command IDs are stable API — never rename after release. So is `manifest.json`'s `id`: changing it breaks every existing install, since both the vault folder name and the community-plugins registry key off it.
- Network calls must remain opt-graceful: always have an offline fallback, and never fetch without an explicit user action. No new network calls without disclosure in the README's *Network usage and privacy* section. Never execute remote code or eval a fetched script; read/write only what's necessary inside the vault, never files outside it.
- `isDesktopOnly` is `false` (`manifest.json`) — avoid Node/Electron-only APIs. The startup CSS-snapshot cache (see README's *What is stored locally*) exists specifically to soften slow mobile launches.
- TypeScript strict mode is enforced. No `any` without explicit ESLint disable comment.
- UI copy: sentence case for headings/buttons; **bold** for UI labels; arrow notation (`Settings → Hotkeys`) for navigation.

## References

- Obsidian API docs: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Manifest validation rules (canonical): https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/validate-plugin-entry.yml

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
