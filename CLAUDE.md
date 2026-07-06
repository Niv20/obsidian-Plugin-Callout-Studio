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

## Architecture

Callout Studio is an Obsidian plugin that lets users create and manage custom callout types with icons, colors, and styles. It bundles `src/main.ts` → `main.js` via esbuild.

### Core managers (`src/manager/`)

- **CalloutRegistry** — single source of truth for all callout definitions. Owns the `Map<id, CalloutDefinition>`, serializes to/from `data.json`, runs CRUD and data migrations, fires `onChange` callbacks on every mutation.
- **CSSInjector** — reads the registry and generates dynamic CSS custom properties per callout (colors, icons, light/dark overrides). Uses `adoptedStyleSheets` (one global per window). Debounced 300ms. Calls `app.workspace.trigger("css-change")` after inject to force Obsidian re-render.
- **CalloutDiscovery** — watches file-open/modify events and scans markdown for unknown `[!id]` patterns. Auto-creates "fallback" rows for new IDs. Prunes unused auto-created rows in a background debounced pass.
- **MaterialSvgManager** — downloads and caches Material Symbols SVGs from fonts.gstatic.com. Persisted in `data.json`. Notifies listeners when a download finishes so CSS can re-inject.

### Data flow

1. User edits a callout → `registry.update()` → `onChange` fires  
2. `onChange` → `cssInjector.scheduleInject()` + Obsidian CSS-change trigger  
3. `CSSInjector.inject()` → new CSS in `adoptedStyleSheets` + DOM icon refresh  
4. User opens a note → `CalloutDiscovery` scans → auto-creates fallback rows if needed  
5. Material icon selected → `MaterialSvgManager.cacheOne()` → download → persist → re-inject  

### Settings UI (`src/settings/`)

`SettingsTab.ts` composes 11 section modules under `settings/sections/`. `CalloutEditor.ts` is the edit/create modal with a real, editable Live Preview via `LiveCalloutPreview.ts`, which hosts an embedded Obsidian markdown editor (`EmbeddableMarkdownEditor.ts`) so callouts render 1:1 with a note in the active theme; it falls back to a static `MarkdownRenderer` render if the (undocumented) embed API is unavailable. `IconPicker.ts` handles Lucide, Material Symbols, and emoji selection.

### Editor integrations (`src/editor/`)

- **AutoComplete** — `EditorSuggest` triggered by `> [!`; shows callout list + "Create new" option.
- **ContextMenu** — right-click menu on callout blocks (edit, copy, settings).
- **Commands** — 4 commands: open settings, create new type, wrap selection, unwrap block.

### Key types (`src/types.ts`)

`CalloutDefinition` is the core data model: `id`, `displayName`, `icon`, `color`, `darkColor`, `aliases`, `transforms`, `source` (`"builtin" | "user" | "fallback" | "theme" | "plugin"`), `metadata`.

`PluginSettings` holds global style (border, radius, scale) and feature toggles (autocomplete, context menu, icon source preferences).

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
- Network calls (Material SVG downloads) must remain opt-graceful: always have offline fallback. No new network calls without disclosure.
- TypeScript strict mode is enforced. No `any` without explicit ESLint disable comment.
- UI copy: sentence case for headings/buttons; **bold** for UI labels; arrow notation (`Settings → Hotkeys`) for navigation.
