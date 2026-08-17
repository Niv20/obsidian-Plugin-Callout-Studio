# Settings UI and modals

Covers [`src/settings/SettingsTab.ts`](../src/settings/SettingsTab.ts), the
section modules under `src/settings/sections/`, the shared modal chrome, and
the individual modals not already covered by
[Callout editor](13-callout-editor.md) or [Icons](12-icons.md).

## `SettingsTab` — composition and refresh plumbing

`CalloutStudioSettingsTab.display()` renders 11 sections in a fixed order
into one scrollable tab: callout lists → fallback → custom palettes → global
settings → autocomplete → context menu → hotkeys → import/export → language →
reset → credits → footer.

### `getSettingDefinitions()` returns `[]` — deliberately, and only for now

```ts
getSettingDefinitions(): unknown[] { return []; }
```

This is Obsidian 1.13+'s declarative-settings hook, which powers the
in-app settings search index. **Returning an empty array is what keeps
`display()` running on every Obsidian version**: on <1.13 the method doesn't
exist and is never called; on 1.13+, an *empty* result falls back to
`display()` (a **non-empty** result would disable `display()` entirely and
render only from the declared definitions). Defining the method at all —
even empty — is the sanctioned way to satisfy the `obsidianmd/settings-tab/
prefer-setting-definitions` lint rule without actually re-architecting the
tab. Populating real per-setting entries would mean reproducing all 11
sections declaratively, verified on a real 1.13 build — deliberately
deferred (see the [`settings-getsettingdefinitions`](#) memory note if one
exists in this project's history; functionally, this is a `[]` returned on
purpose, not a stub someone forgot).

### Three subscriptions, one coalesced refresh

```ts
registry.onChange(sub)         → scheduleListRefresh()
registry.onPreviewChange(sub)   → scheduleListRefresh()
plugin.onIconCacheChange(cb)     → scheduleListRefresh()
workspace.on("css-change", cb)    → scheduleListRefresh()   // theme-mode swatch colours
```

All four funnel into one `requestAnimationFrame`-coalesced refresh
(`scheduleListRefresh`), so a burst of related events (a registry mutation
that *also* triggers `css-change`) costs exactly one re-render, landing on
the very next paint rather than a beat later. The `onPreviewChange`
subscription specifically is what keeps a row's swatch tracking the callout
editor's in-progress colour picks live, without the preview reaching
`saveSettings()` or forcing a document-wide re-render — see
[Callout registry § the transient live-preview slot](05-callout-registry.md#the-transient-live-preview-slot).

### `display()` also does two side-effecting things before rendering anything

```ts
this.scanOpenEditorsForUnknownCallouts();
this.plugin.schedulePruneUnusedFallbacks(0);
```

Opening the settings tab **scans every open editor's in-memory buffer** for
unknown callout ids (not just what's on disk — an unsaved buffer counts) and
immediately schedules a prune pass. This is exactly the scan that
`CalloutDiscovery.suppressRediscovery()` exists to protect a just-deleted
row from — see
[Vault discovery § rediscovery suppression](10-vault-discovery.md#rediscovery-suppression--the-delete-race).

### Section disposers

Each section that registers a resource needing cleanup (an event listener, a
timer) returns a disposer via `ctx.registerDisposer(fn)`; `display()` runs
every previously-registered disposer **before** rebuilding, and `hide()`
runs them on tab close. This is what keeps a section's `MutationObserver` or
subscription from silently accumulating across repeated `display()` calls.

## Modal chrome — the one shell every window wears

[`src/settings/modalChrome.ts`](../src/settings/modalChrome.ts) is a small
file with an outsized effect on the whole UI's consistency. Before it
existed, different modals had independently reinvented a sticky title, a
pinned button bar, or neither — "two carried a sticky title with a rule
under it and a pinned button bar, one drew its rule on a toolbar instead of
the title, and the rest had neither."

```ts
applyModalChrome(modal, { footer?: boolean, wide?: boolean }): HTMLElement | null
removeModalChrome(modal): void
```

Three fixed bands:

```text
┌───────────────────────────────┐
│ title                       ✕ │  header — fixed, rule along its bottom
├───────────────────────────────┤
│ content …                     │  body — the ONLY scroll container
├───────────────────────────────┤
│              [Cancel] [Save]  │  footer — fixed, rule along its top; optional
└───────────────────────────────┘
```

Both rules run **edge to edge**, which is why the geometry lives in this one
module rather than per-modal CSS: `.modal` gives up its own 16px padding to
`.cs-modal`, redistributed to each band as `--cs-modal-inset`, so a rule can
reach the window's sides while text still lines up with the inset. **A new
modal must never re-add padding to `.modal` or `.modal-content` directly** —
that would double the inset.

> [!IMPORTANT]
> **Every window wearing this chrome must set a title, with no opt-out.**
> The two windows that used to skip the header band (a generic confirmation
> dialog and the replace-callout picker) read as unlabelled boxes — Obsidian
> still renders an empty, padded `.modal-title` band even with no text set,
> so *skipping* the title doesn't remove the band, it just leaves it blank
> and confusing. This is enforced structurally, not just by convention:
> `ConfirmModal`'s constructor takes `title` as a **required** parameter
> specifically because it's a generic, reusable dialog — only the caller
> knows what's being confirmed, and a compiler-enforced parameter is what
> keeps a future caller from shipping a headerless one. `ReplaceCalloutModal`
> defaults its title from its `mode` for the same reason.
>
> **`WelcomeModal` is the one deliberate exception** — it's a splash screen,
> opts out of the chrome entirely (`this.titleEl.remove()`), and carries its
> own name as a hero heading in a dedicated left column instead of a
> generic title bar.

`applyModalChrome` is safe to call again on a reopened modal — Obsidian
reuses `modalEl` across open/close cycles, so a stale footer from a previous
open is detached rather than duplicated. It also stamps `cs-modal-stacked`
on the container when another modal is already open underneath it (used by
`styles.css` to paint the correct backdrop dimming for stacked modals on
mobile, where Obsidian's own backdrop layering can't be relied on) — the
open count check is reliable specifically because `Modal.open()` appends
`containerEl` to the document **before** calling `onOpen()`, so this modal is
already counted by the time the check runs.

## Two theme-aware surface tokens

Defined **only** on `.modal.cs-modal` (never redefined per-modal), so
falling through to the bare CSS variable keeps the plain settings tab —
which Obsidian itself paints `--background-primary` — visually unchanged:

```css
.modal.cs-modal { --cs-surface: var(--modal-background); --cs-surface-raised: var(--background-secondary); }
```

- **`--cs-surface`** (fallback `--background-primary`) — anything meant to
  read as flush with the modal window itself: fixed bands, panels, popup
  menus, the ring cut around an icon tile's ✕.
- **`--cs-surface-raised`** (fallback `--background-secondary`) — anything
  meant to read as *raised off* that surface: a group-box header strip, a
  card, a control, a row pill.

> [!IMPORTANT]
> **The two tokens are a pair and must always move together.** Setting one
> alone is precisely how the group boxes broke once: `--background-secondary`
> is only the correct "raised" shade *while* `--modal-background` equals
> `--background-primary` — and mobile dark theme is exactly where that
> relationship stops holding. `.is-mobile.theme-dark` (phone and tablet)
> repoints `--modal-background` **onto** `--background-secondary` itself
> (for OLED-friendly true-black elsewhere), which means a strip painted with
> the naive `--background-secondary` fallback lands on the exact surface
> it's meant to sit *above*, and visually disappears. The fix,
> `.is-mobile.theme-dark .modal.cs-modal` re-derives `--cs-surface-raised` as
> a `color-mix()` step **off `--cs-surface`** rather than naming a fixed
> replacement colour — reproducing the same visual step desktop gets
> (`#1C1C1C` → `#282828`) on whatever the window turns out to be, and
> surviving yet another theme repointing `--modal-background` again in the
> future.

**Deliberately not covered**: `.cs-live-preview-body` and `.cs-gap-demo`,
which are meant to emulate an actual **note** surface inside the modal (the
callout editor's live preview, the spacing-demo widget) — those genuinely
want `--background-primary` regardless of what the surrounding modal chrome
is doing.

> [!TIP]
> Any sticky element inside a modal body must sit at `top: 0`, never a
> positive offset — a positive offset parks an opaque layer *below* the
> header's rule, which visually eats scrolling text passing behind it. See
> `.callout-studio-preview-col` in `styles.css` for the enforced example.

## Notable individual modals

### `ConfirmModal` — the generic yes/no dialog

Resolves `Promise<boolean>`. Required `title` (see above), optional
`confirmLabel`/`cancelLabel`/`confirmClass` (defaults to
`"mod-warning"` — a destructive action reads as one by default unless the
caller overrides it). Used throughout for anything destructive that isn't
specific enough to warrant its own modal (bulk vault edits, full reset).

### `DeleteCalloutModal` and the replace/delete pivot

Covered in depth in [Vault discovery § delete flow](10-vault-discovery.md#delete-flow).
UI-wise: two body copy variants (in-use vs. unused), and an in-use callout's
footer offers **three** buttons (Cancel, "Replace instead…", Delete) rather
than the usual two — the replace pivot exists specifically because deleting
an in-use callout is presented as a choice, not a single destructive action.

### `PaletteEditorModal` — simple vs. advanced, two background styles

Two-column layout mirroring the per-role global-style popups: a sticky live
preview on the left, titled control cards on the right. **Simple mode**: one
base colour, and the full six-value palette (light/dark accent, background,
text) is auto-derived with contrast correction
(`derivePaletteFromColor` — see [Colour system](11-color-system.md)).
**Advanced mode** exposes independent accent/background/text rows per theme
mode directly, each edit inferring the opposite mode's value
(`inferOppositeModeColor`) — but is only offered while the background style
is **Solid**; a Gradient palette has no advanced per-colour view.

Background style is a further 3-way choice: Solid, Gradient (two-stop linear,
preset direction, an off-by-default "Gradient title text" toggle), or None
(transparent — see [Colour system](11-color-system.md#preset-palettes--hue-named-not-role-named)
for why this is the *only* route to a transparent palette).

The preview renders on a **reserved demo id** (`PALETTE_DEMO_ID =
"palette-demo"`), registered through the same registry preview slot the
callout editor uses — and, notably, **deliberately not**
`PREVIEW_PLACEHOLDER_ID` (the callout editor's own reserved id), because two
concurrently-open demo previews (opening the palette editor from inside the
callout editor) must not collide on one registry slot.

### `GlobalStyleModal` — the three per-role style popups

Also uses a reserved demo id (`STYLE_DEMO_ID = "global-style-demo"`) and the
same live-preview-on-a-registered-row pattern, letting the border/radius/
scale/spacing sliders for block, heading, or inline style show their effect
on a real rendered callout as the user drags them.

### `CommandBuilderModal` — fixed + custom commands, one window

Two lists in one modal: the five fixed commands (plain rows — nothing to
configure but a hotkey), and the user's own built commands (full rows with
add/edit/delete). Both kinds display the same two pieces of information side
by side, deliberately kept separate:

- **A hotkey chip** that only *reads* what Obsidian has bound
  (`hotkeyLink.ts`'s `hotkeysForCommand`), because a shortcut is a fact
  about the row, not something this window can set directly.
- **A button** that *opens* Obsidian's own hotkeys pane, filtered to that
  command (`openHotkeySettings`), because binding a key is Obsidian's job.

The list **subscribes to the registry while open** — deleting a callout from
another surface (the settings row menu) prunes any command depending on it
(via `CustomCommandManager.syncAll()`, see
[Editor integrations](09-editor-integrations.md#customcommandmanager--one-idempotent-sweep)),
and this window has to stop showing a now-deleted command in the same
moment rather than offering a dead row. Everything here **saves itself
immediately** on every change — there's no separate OK/Cancel, matching the
plugin's general save-on-change convention.

### `hotkeyLink.ts` — reading a binding Obsidian doesn't expose a public API for

`printHotkeyForCommand` goes through the undocumented `app.hotkeyManager`,
guarded structurally (an unreadable binding reads as `""`/unassigned rather
than throwing — every internal API access in this codebase follows this
pattern). Because that helper only ever formats the **first** binding on a
command bound to more than one shortcut, showing every binding means
re-implementing Obsidian's own key-formatting tables by hand
(`MODIFIER_GLYPHS`, platform-specific: `⌘⌃⌥⇧` stacked with no separator on
macOS, `Ctrl + Alt + Shift` spelled out with `+` elsewhere) — duplicated
rather than simplified, specifically so the same shortcut can never read two
different ways in two different windows of this plugin.

### `WelcomeModal` — the one chrome opt-out

Covered above under Modal chrome. Shown automatically exactly once, gated by
`settings.welcomeSeen`, only for a genuinely fresh install (no
pre-existing `data.json`) — a user who merely updates into a new version
never sees it. Reopenable any time via the info icon in settings, or the
dev-convenience protocol handler `obsidian://callout-studio-welcome`
registered in `main.ts`.

## Related documentation

- [Callout editor](13-callout-editor.md) — the largest single modal, covered separately
- [Icons](12-icons.md) — the icon picker modal
- [Vault discovery](10-vault-discovery.md) — delete/replace flow this UI drives
- [Colour system](11-color-system.md) — palette derivation the editor calls into
