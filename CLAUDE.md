# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # watch-mode build (esbuild, inline sourcemaps)
npm run build     # production build (typecheck + minify)
npm run lint      # ESLint across src/
```

No automated test suite — testing is manual: copy `main.js` + `manifest.json` to `<Vault>/.obsidian/plugins/callout-studio/` and reload Obsidian.

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

`SettingsTab.ts` composes 11 section modules under `settings/sections/`. `CalloutEditor.ts` is the edit/create modal with a real, editable Live Preview via `LiveCalloutPreview.ts`, which hosts an embedded Obsidian markdown editor (`EmbeddableMarkdownEditor.ts`) so callouts render 1:1 with a note in the active theme; it falls back to a static `MarkdownRenderer` render if the (undocumented) embed API is unavailable. `settings/iconpicker/` is the icon picker: `IconPickerModal` (source menu + preview + confirm), `PackPanel` (one source's toolbar and grid, driven entirely by its `IconPack`), `IconGrid` (paging and key nav), `allSources` (the pooled cross-source search).

### Editor integrations (`src/editor/`)

- **AutoComplete** — `EditorSuggest` triggered by `> [!`; shows callout list + "Create new" option.
- **ContextMenu** — right-click menu on callout blocks (edit, copy, settings).
- **Commands** — 4 commands: open settings, create new type, wrap selection, unwrap block.

### Icon sources (`src/icons/`)

Two id spaces, kept apart in `icons/registry.ts`, both total `Record`s so declaring an id without the thing behind it is a compile error:

- **`IconSourceId`** (7) — a library as the user meets it: one row in the picker's source menu, one toolbar, one Download button. `ICON_SOURCES` maps it to the `IconPack` (`icons/types.ts`).
- **`IconPackId`** (9) — one body of artwork: one `CalloutIcon.type`, one pack manifest entry, one downloaded file, one SVG cache key. `SOURCE_OF_TYPE` maps it to its source, which is what `packFor(icon)` walks.

They differ only for Font Awesome: one source, three files (`fa-solid`/`fa-regular`/`fa-brands`) chosen by its style control. **Cache keys and pack-store calls use `icon.type`, never `pack.id`** — using the source id would collapse the three styles onto one entry and orphan everything already cached.

`IconPackKind` decides how artwork reaches the screen: `builtin` (Lucide, via `setIcon`), `glyph` (emoji), `perIconRemote` (Material — 100,000+ style/weight variants, so fetched one at a time), `bundledRemote` (Font Awesome, Octicons, RPG Awesome — files downloaded on request, listed per source in `dataPacks`), `local` (**Your images** — the user's own files, held in `settings.userImages`, never fetched).

### Your images (`icon.type === "image"`)

The one source the user writes to. `CalloutIcon.value` is a `UserImageIcon.id`, not artwork — the import validator caps `value` at 200 chars.

- **Everything is stored as SVG markup.** An uploaded SVG stays vector; a PNG/JPEG/WebP is canvas-scaled to ≤128px and wrapped in `<svg><image href="data:…"></svg>` (`icons/userImageImport.ts`). That single representation is why `IconResolver`, `renderIconInto`, the settings list and the PDF-export path needed no changes — `resolver.ts` already falls back to `pack.buildSvg()`.
- **`sanitizeUserSvg` (`icons/svg.ts`) is an allow-list**, separate from `sanitizeSVG` (Material's deny-list, for one trusted vendor). It re-runs on every read via `sanitizeUserImages`, because `data.json` syncs and can be hand-edited.
- **Whether a picture follows the callout's colour is the *callout's* choice, not the picture's** — `CalloutIcon.recolor`, so one logo can be tinted in `[!bug]` and left alone in `[!note]`. The picture only carries `monochrome`, detected on import, which seeds that flag in `makeIcon`. `followsCalloutColor(icon, image)` holds both halves (the callout's choice *and* the SVG-only capability) so the three call sites can't drift.
- **Two places branch on `followsCalloutColor`, and only two.** In CSS, a picture *not* following the callout is emitted as `background-image` (`generateImageOverride`), not `mask-image`, because a mask is a stencil and would flatten it to a silhouette. In the DOM, `renderIcon`'s `stencilSvg` does what that mask does — rewrites every paint the artwork declares (attributes, `style`, `<style>` classes) to the callout's colour — because the heading, inline and ref surfaces paint a real SVG and a `fill` on its root only ever reaches the shapes that declared no colour of their own. `cacheVariant` keys on `icon.recolor` for the same reason — two callouts sharing a picture must not share a render key.
- **`registry.setUserImages()` is the single writer**, which re-syncs the pack's module-level snapshot (`buildSvg` is synchronous by contract, so it cannot read settings itself).
- **The picker uses `ImagePanel`, not `PackPanel`** — add and delete are affordances the `IconPack` contract deliberately has no room for. The "Follow callout color" toggle is *not* there; it lives in `CalloutEditor`'s Picture section, beside the icon's size and offsets, because it belongs to the callout.

A pack's optional `entryMatches` filters the grid by variant (Font Awesome's style picks *which* icons exist, not just how they look), and `pickerNotice` scopes a standing notice to certain variants (the Brands trademark note).

`renderIcon.ts` is the **only** code that turns an icon into DOM; every surface calls `renderIconInto`. Never reach into the SVG cache from a renderer — go through `IconResolver`.

Search indexes are bundled (packed by `icons/data/codec.ts`); artwork is not. Regenerate with `npm run icons:generate` — never part of `npm run build`, and its output is committed. Pack files are served from the `packs-v1` tag; refreshing them means a **new tag** plus updated checksums in `icons/data/packManifest.ts`, because jsDelivr caches tags permanently.

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

### Public API (`src/api/PluginAPI.ts`)

Exposes registry and discovery methods to other Obsidian plugins. Treat this surface as stable — don't remove or rename exported methods.

### Localization (`src/i18n/`)

`t()` for all user-facing strings. English (`en.ts`) and Hebrew (`he.ts`) supported. Add new strings to both files.

## Coding conventions

- Keep `src/main.ts` minimal — lifecycle and wiring only. All logic lives in sub-modules.
- Files over ~300 lines should be split by responsibility.
- All listeners and intervals must use `this.registerEvent` / `this.registerInterval` / `this.registerDomEvent` so they are cleaned up on unload.
- Command IDs are stable API — never rename after release.
- Network calls must remain opt-graceful: always have an offline fallback, and never fetch without an explicit user action. No new network calls without disclosure in the README's *Network usage and privacy* section.
- TypeScript strict mode is enforced. No `any` without explicit ESLint disable comment.
- UI copy: sentence case for headings/buttons; **bold** for UI labels; arrow notation (`Settings → Hotkeys`) for navigation.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
