# Persistence and caching

This document is a map of every place the plugin keeps state, whether it's
saved, cached, or purely in memory, and what happens when it's missing.

## `data.json` — the one persisted settings file

Written by `plugin.saveSettings()` → `this.saveData(this.registry.toSaveData())`,
Obsidian's standard per-plugin JSON file at
`<Vault>/.obsidian/plugins/callout-studio/data.json`. Its shape is `PluginData`
(see [Data model](04-data-model.md#plugindata--the-shape-of-datajson)). Nothing
else in the plugin writes to disk except:

- The icon-pack cache (`icon-packs/`), a separate mechanism — see below.
- The Material Symbols preview webfont cache (`icon-fonts/`).
- Downloaded locale files (`translations/`).
- The user-requested CSS snippet export (`.obsidian/snippets/callout-studio-custom.css`).
- **The user's own vault notes**, via `app.vault.modify()` — not a
  plugin-owned file at all, and the most consequential write the plugin
  makes since it touches arbitrary user content. The vault rewriters
  (`src/utils/vaultCalloutScanner.ts` — rename/replace-id, convert-to-plain-
  text) and the delete flow's cleanup (`CalloutDiscovery`) both go through
  this path. See [Vault discovery](10-vault-discovery.md).

Every write to `data.json` happens through `registry.toSaveData()` — never a
partial patch — so understanding what that method includes/excludes (see
[Callout registry § which rows are persisted](05-callout-registry.md#which-rows-are-persisted-the-built-in-rule))
is understanding the whole persistence contract.

### When is it saved?

Every `registry.onChange` fires `void this.saveSettings()` (see
[Architecture § the data-flow loop](02-architecture.md#the-data-flow-loop)).
Because `onChange` fires at most once per `batch()`, a multi-row import or a
rename is one save, not several. There is no debounce on the save itself — it
runs synchronously off the same tick as the CSS inject.

### Settings merge — never a raw spread

```ts
mergeSavedSettings(savedSettings: LegacySavedSettings): PluginSettings
```

[`src/utils/settingsMerge.ts`](../src/utils/settingsMerge.ts) rebuilds
`PluginSettings` from possibly-partial, possibly-ancient saved data by naming
**every field explicitly** against `DEFAULT_SETTINGS`, all the way down into
nested sections (`globalStyle` has its own module,
[`globalStyleMerge.ts`](../src/utils/globalStyleMerge.ts), because it's deep
enough to warrant one).

> [!WARNING]
> This is deliberately *not* `{...DEFAULT_SETTINGS, ...saved}`. A spread is
> total in *shape* but blind to anything **extra** the saved file carries — a
> key the current version knows nothing about would ride straight through
> unchanged, and because settings are written back wholesale by both
> `toSaveData()` and `exportToJSONv2()`, it would then be re-saved forever and
> copied into every export made from then on. Retiring a field by `delete`ing
> it by name only cleans up the one field someone remembered to name. Naming
> every field that *stays* here is what makes "unknown fields are dropped"
> actually true at every depth, not just the top level.

The same function is shared by two callers that ask the identical question —
"what does this possibly-partial, possibly-ancient blob mean under the current
version" — the registry's `load()` on startup, and `settingsValidator` on
every JSON import.

`mergeMenuItems()` inside the same file is the other notable piece: it merges
a saved per-role context-menu item **list** (order matters) against that
role's defaults — unknown ids dropped, duplicates dropped, items introduced by
a *newer* plugin version appended at the end — and folds in the pre-1.2.2
three-boolean "popup" toggles (`legacyMenuState()`) so an upgrade from that era
doesn't silently switch a hidden menu item back on.

## In-memory-only state (never persisted)

| State | Owner | Rebuilt from |
| --- | --- | --- |
| `CalloutDiscovery`'s debounce timers | `CalloutDiscovery` | N/A — pure runtime scheduling |
| The rediscovery-suppression map (`suppressedIds`) | `CalloutDiscovery` | N/A — a 5-second window after an explicit delete |
| The "known zero usage" fallback-id set | `CalloutDiscovery` | Recomputed by the next `pruneUnused()` scan |
| `CSSInjector.lastCssText` | `CSSInjector` | Recomputed by the next `inject()` |
| The registry's transient live-preview slot | `CalloutRegistry` | Cleared automatically when the editor modal closes |
| `IconFetchManager`/`PackDataStore` in-flight promise maps | `IconService` | Nothing to rebuild — just de-duplicates concurrent requests |
| `LocaleStore`'s per-file load state and in-flight map | `LocaleStore` | Re-derived by `prepare()`/`ensure()` on next launch |
| The `i18n/index.ts` module-level locale table map | `i18n/index.ts` | Re-populated by `registerLocaleFile` when a file is read/downloaded again |
| `startupEntranceActive` flag | `renderShared.ts` | Reset every launch; closes itself after `STARTUP_ENTRANCE_MS` |
| The Live Preview content-pill render cache | `contentPillRender.ts` | Cleared on unload and by `plugin.refreshCallouts()` — **not** by every registry change; the generic `registry.onChange` listener in `main.ts` only re-injects CSS, it never calls `refreshCallouts()`. An ordinary `CalloutEditor` save does not clear this cache. Explicit callers include the external-style toggle, fallback-callout changes, row delete/reset, and discovery's prune. |

All of these share one property: losing them costs nothing but a moment of
recomputation. None of them is a source of truth for anything the user would
notice missing after a restart.

## Generated/derived state

- **The adopted stylesheet and `<style>` element text** — entirely derived
  from the registry; regenerated on every `inject()`.
- **DOM icon artwork** (the `::after` mask images in CSS, and the baked
  `<svg>`/`<span>` copies in the DOM) — derived from `iconSvgCache` +
  whatever's on disk; repainted by `paintIcons()`.
- **The Outline pane's cleaned heading titles** — derived by `OutlineDecorator`
  from the registry's current definitions; recomputed on `layout-change` and
  on every registry change.
- **CodeMirror's Live Preview widget DOM** for heading/inline tokens — rebuilt
  by `refreshAllCalloutEditors()` whenever the registry changes (registry
  mutations don't touch the document text, so CodeMirror has no reason to
  rebuild its own decorations without being asked).

## The startup CSS snapshot

[`src/manager/StartupStyleCache.ts`](../src/manager/StartupStyleCache.ts) is
**one layer, `localStorage`, per device**, deliberately with no settings
toggle (the README states this explicitly under "What is stored locally").

```ts
loadCachedCss(): string | null    // synchronous read
persist(cssText: string): void     // called at the end of every inject() whose text changed
```

The key is vault-scoped:
`${appId ?? vault.getName()}-callout-studio-css` — `App.loadLocalStorage`'s
own `${appId}-${key}` convention, replicated by hand because that public API
requires Obsidian ≥1.8.7 while this plugin's `minAppVersion` is lower.

The snapshot holds the **exact text** the adopted stylesheet gets, so the
handoff from cached-snapshot to freshly-generated CSS is invisible — there's
no partial or summarized form. `CSSInjector.injectFromCache()` reads it as the
literal first statement of `onload()`, before `loadData()` is even awaited
(see [Plugin lifecycle](03-plugin-lifecycle.md#step-3-the-startup-css-fast-path)).
A stale snapshot self-heals automatically: the very next `inject()` (once the
registry is populated) persists fresh CSS over it.

> [!NOTE]
> `persist()` is skipped while a transient live-preview definition is
> registered (`registry.hasPreviewDefinition()`). That CSS describes an unsaved
> draft — `toSaveData()` already goes out of its way to keep drafts off disk —
> and hovering a colour swatch in the palette menu would otherwise cost a
> synchronous `localStorage` write on every hover. Closing the preview
> re-injects the committed state, which persists normally.

`persist()` also memoizes on `lastPersisted` to skip redundant writes, and —
notably — only updates that memo **after** the write actually succeeds (a
`try` failure due to quota leaves the memo unchanged, so a later session where
storage frees up will retry rather than silently never writing again for the
rest of the session).

### What this deliberately does not cover

The window **before the plugin loads at all** — nothing running inside a
plugin can affect that. Versions up to 2.5.0 covered *that* window with a
second copy of the CSS written into the vault as an auto-enabled snippet
(`.obsidian/snippets/callout-studio-do-not-delete.css`), switched on through
Obsidian's internal `app.customCss`. That layer cost a ~100 KB file (and a
sync event) per style change, and — because nothing ever cleaned it up —
outlived the plugin on uninstall, leaving a dangling name in
`appearance.json` forever.

### Cleaning up the old snippet layer

[`src/manager/legacyStartupSnippet.ts`](../src/manager/legacyStartupSnippet.ts)
deletes that leftover file (and disables its name in `appearance.json` via the
undocumented `app.customCss` API) on **every launch**, deferred to
`workspace.onLayoutReady` so its one `exists()` stat never sits on the startup
path.

> [!CAUTION]
> This runs on every launch — not once behind a `data.json` flag — because a
> flag would *sync*: it could reach a second device before the orphan file
> itself synced there, and that device would then never clean up. It also
> covers a device still literally running 2.5.0 that keeps re-creating the
> file. The whole module (plus its one call site in `main.ts`) is marked for
> deletion in version 3.0.0, once every vault has launched a version that
> cleans up.

## The user-requested CSS snippet export

A completely different, **current** feature — see the file-header comment in
`cssSnippetExport.ts` for the explicit contrast with the legacy auto-snippet
above. Key properties:

- **Written only on request** (`Settings → Import/export → Export → CSS
  snippet`), to `.obsidian/snippets/callout-studio-custom.css`, and **never
  enabled** by the plugin.
- **A snapshot, not a live link.** Nothing updates the file after export;
  re-export to bring it current.
- **Byte-identical re-export writes nothing at all** — `classifyExisting()`
  hashes the file's own body (SHA-256, stored in its header as a
  `fingerprint:` line) and compares against a freshly rebuilt body. If they
  match, the write is skipped entirely, because every vault write is a sync
  event.
- **A foreign or hand-edited file triggers a confirmation** before
  overwriting — `classifyExisting()` returns `"foreign"` for anything that
  doesn't start with the exact marker comment, doesn't have a parseable
  fingerprint line, or whose fingerprint doesn't match its own body.
- **`isSnippetEnabled()` can report `true` on the very first export of a
  session**, which reads as a bug but isn't: Obsidian's `enabledCssSnippets`
  is a list of *names*, and nothing prunes a name whose file has been deleted.
  If the user enabled this snippet once and later deleted the file, the very
  next export brings the name back to life — already switched on. The
  plugin surfaces this as a warning rather than silently enabling or
  disabling anything.

## Icon artwork storage — three layers

Icon persistence spans three genuinely different mechanisms, covered in full
in [Icons](12-icons.md), summarized here for the "what's stored where" view:

| Layer | Where | Persisted? | Verified how |
| --- | --- | --- | --- |
| `iconSvgCache` (per-icon, in use) | `data.json` | Yes — syncs with the rest of settings | Trusted (it's this plugin's own settings file) |
| Downloaded pack files (Tabler, FA, Octicons, RPG Awesome) | `<plugin-dir>/icon-packs/*.json` | On disk, outside `data.json` | SHA-256 checked on download **and on every disk read** |
| Material Symbols preview webfont | `<plugin-dir>/icon-fonts/*` | On disk | Not integrity-checked (a rendering aid, not artwork of record) |

`iconSvgCache` is the layer that makes a callout keep rendering correctly on a
device that synced settings but never downloaded the pack, and after a cached
pack file is deleted from disk — the SVG the callout actually needs is
already sitting in `data.json`.

## Locale file storage

Covered fully in [Localization](16-i18n.md). Summary for this document's
purpose: downloaded locale JSON lives at
`<plugin-dir>/translations/<file-id>.json`, outside `data.json`, SHA-256
verified against a manifest baked into the build. A hash **mismatch on disk**
is treated as *staleness* (an older build's copy, missing newer strings) and
used anyway while a background refresh runs — deliberately different from a
hash mismatch **from the network**, which is discarded outright. English never
needs a file at all; it's bundled in `main.js`.

Next chapter: [08-render-roles.md](08-render-roles.md)
