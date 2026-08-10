# Mobile scroll-jump investigation

Working notes from the investigation into a user report of *"the screen jumps like crazy"* while
editing on Android, possibly around inserting Obsidian templates, plus *"collapsing a heading moves
everything further up than it should, even though there is a lot of content below"*.

Two fixes shipped. Four more causes were identified, verified in the code, and **deliberately left
unimplemented** — they are written up here so the next attempt can start from evidence instead of
from scratch. Work down the list in order; each entry is self-contained.

---

## Background you should not have to re-derive

### `css-change` is expensive, and core answers it violently

Extracted from `/Applications/Obsidian.app/Contents/Resources/obsidian.asar` → `app.js`
(`npx @electron/asar extract … ./out`). The editor's handler is:

```js
onCssChange = function () {
    this.cm.dispatch({ effects: IR.clearCache.of() });
    this.editor.refresh();
}
```

That is a **full widget-cache wipe plus a forced re-measure in every open editor**, and reading
views re-render. On Android it is a whole-note relayout, and everything whose height is not yet
known (images, embeds, transclusions) goes back to an estimate. That is what "the screen jumps"
looks like from the inside.

`workspace.trigger("css-change")` therefore must be treated as a heavyweight, user-visible
operation — not as a cheap "please restyle" ping.

### On mobile, core freezes its own rendering for 700 ms after every caret move

Also from `app.js`:

```js
if (Gl.isMobile) {
  var l = fc(function () { plugin(EY).mousedown = false; …; dispatch(CY) }, 700, true);
  updateListener.of(function (e) {
      e.docChanged ? l.run()
      : e.transactions.some(tr => tr.isUserEvent("select")) &&
        (plugin(EY).mousedown = true, …, l())
  })
}
```

`EY` is `livePreviewState`. So on a phone, `livePreviewState.mousedown` is `true` for two-thirds of
a second after *any* tap that moves the caret, and core's markdown-hiding view plugin skips every
rebuild during that window. Anything this plugin renders on a different schedule will disagree with
core inside it. (This is the mechanism behind the separate `###`-leak bug; see
`CSS_HEADING_HIDE_MARKS` in `src/editor/renderShared.ts` and the snapshot fields in
`src/editor/livepreview/calloutViewPlugin.ts`.)

### Core's markdown-hiding plugin skips rebuilds in three more cases

```js
(syntaxTree(state).length < view.viewport.to || view.composing || plugin(EY)?.mousedown)
    ? this.decorations = this.decorations.map(update.changes)   // skip
    : (treeChanged || viewportChanged || selectionSet || <3 effects>) && rebuild
```

Worth remembering whenever this plugin's Live Preview output is compared against core's.

### Two jump sources were already fixed on 2026-08-09 — check the reporter's version first

Both are in **2.8.0** (tagged the same evening). The report predates them by about three weeks,
i.e. it was made against 2.4.1–2.5.0.

- `76cc28d` *Never decorate the same line twice across visible ranges* — before it, a line split
  across two `visibleRanges` (exactly what a fold produces) made `RangeSetBuilder` throw
  *"Ranges must be added sorted"*, and the editor lost its **entire** decoration set in one frame.
- `da595fd` *Keep the icon sweep out of CodeMirror widget DOM* — the sweep used to `replaceChildren`
  inside CM widget DOM behind CodeMirror's back.

**Before investigating anything below, confirm the reporter still sees the problem on ≥ 2.8.0.**

---

## Already fixed on this branch

1. **`CSSInjector` no longer emits `css-change` when the generated CSS is byte-identical.**
   `src/manager/CSSInjector.ts`, `lastCssText`. Most injects — an icon download landing, a prune
   pass that removed nothing, another plugin's `css-change`, every step of a multi-callout import —
   produced output identical to what was already installed and still ended in a full storm.
   Note the invariant: `lastCssText` **must** be nulled whenever `ensureStyleSheet` /
   `ensureStyleEl` (re)binds a target, or a pop-out window renders with no plugin CSS.
2. **Discovery mutations fire one notification per batch.** `CalloutRegistry.batch()`, used by
   `CalloutDiscovery.addUnknownCalloutsAsFallback()` and `pruneUnused()`. A template carrying N
   unknown callout ids used to cost N+1 full stylesheet regenerations, document-wide icon repaints,
   editor-refresh fan-outs, `data.json` writes and `css-change` storms — all synchronous, all in
   one burst 300 ms after the metadata cache settled. It is now one.

---

## 1. `transition: padding 250ms` on a `.cm-line`

**Severity: high on mobile, startup only.**

`styles.css` (search `body.cs-anim-window .cs-heading-callout`):

```css
body.cs-anim-window .cs-heading-callout {
	transition:
		background-color 350ms ease-out,
		color 350ms ease-out,
		padding 250ms ease-out;
}
```

`.cs-heading-callout` **is** the `.cm-line` in Live Preview — it is applied as a `Decoration.line`
in `src/editor/livepreview/calloutViewPlugin.ts`. CodeMirror measures each line's rendered box once
to build its height map; animating `padding` changes that box continuously for 250 ms *afterwards*,
while the height map holds the pre-transition value. Every heading callout on screen drifts, and
the error accumulates.

The file already documents exactly this hazard one rule further up, for `margin`:

> a top margin on a CodeMirror `.cm-line` can desync the editor's line-height/cursor accounting
> (margin sits outside the box CM6 measures), so no margin-top rule — not even an inert zero —
> should ever target `.cm-line`.

Padding *is* measured, which is why it was chosen — but an *animated* padding is measured once and
then changes, which puts it in the same category.

And the window is not opt-in on phones. `src/main.ts`:

```ts
if (Platform.isMobile || uiWasVisible) {
    const closeEntrance = beginStartupEntranceWindow(activeDocument);
    const timer = window.setTimeout(closeEntrance, STARTUP_ENTRANCE_MS);   // 3000
```

So every launch on a phone arms it for three seconds.

**Proposed fix.** Split the transition: keep `background-color` / `color` for both surfaces, and
scope the `padding` leg to `:not(.cm-line)` so only the reading-view bar animates its inset. Live
Preview keeps the colour fade, which is the visible part of the effect anyway.

**Risk.** Cosmetic only — the Live Preview bar's inset would snap instead of easing. Check the
`prefers-reduced-motion` block below it stays consistent.

**Introduced by** `e9e7f9d` (2026-07-19) *feat: implement startup entrance animations* — one day
before the report.

---

## 2. A fold tap costs 2–4 transactions

**Severity: medium. Directly matches "collapsing a heading moves everything up more than it should".**

`src/editor/livepreview/fold.ts`:

```ts
view.dispatch({ effects: foldEffect.of(range) });
if (!foldStartingAt(view, headingLine)) {
    view.dispatch({ effects: StateEffect.appendConfig.of(codeFolding()) });
    view.dispatch({ effects: foldEffect.of(range) });
}
```

and immediately after, in `HeadingFoldArrowWidget.toggleFold` (`src/editor/livepreview/widgets.ts`):

```ts
toggleHeadingFold(view, headingLine);
view.dispatch({ effects: calloutStudioRefresh.of(null) });
```

Two dispatches minimum per tap (four in the settings-preview editor, which lacks the fold field).
Each is its own CodeMirror measure/layout cycle, so a single fold perturbs the height map twice in
a row — the second time *after* the fold has already changed what is on screen.

The trailing refresh is also largely redundant: `foldsChanged()` already makes the view plugin
rebuild on the fold transaction itself
(`src/editor/livepreview/calloutViewPlugin.ts`, the `foldChanged` trigger).

**Proposed fix.** Merge into one transaction:

```ts
view.dispatch({ effects: [foldEffect.of(range), calloutStudioRefresh.of(null)] });
```

Keep the `appendConfig` retry path as-is — a field appended mid-transaction genuinely cannot see
that transaction's own effects, which is why it is two dispatches there.

**Risk.** Low, but verify the chevron still rotates in the settings preview (the editor without the
fold field) and that Obsidian's own pre-heading arrow still stays in sync.

---

## 3. The whole vault is read 1.5 s after every callout edit

**Severity: medium-to-high on large vaults, Android especially. Reads as a freeze, not a jump.**

`src/manager/CalloutDiscovery.ts` → `schedulePrune(delayMs = 1500)` → `pruneUnused()` →
`countCalloutUsagesMap()` → `src/utils/vaultCalloutScanner.ts`:

```ts
const files = app.vault.getMarkdownFiles();
for (const file of files) {
    const content = await app.vault.cachedRead(file);
```

Every markdown file in the vault, tokenized, on the main thread. `scanFileNow` calls
`schedulePrune()` on **every** path — including the early return where nothing unknown was found.

It is gated: `pruneUnused` bails immediately when there are no uncustomized `source: "fallback"`
rows. But a user who works from templates full of custom callouts has plenty of those, which is
precisely the reporter's profile.

The debounce does collapse bursts (each call clears the previous timer), so the real pattern is one
whole-vault read ~1.8 s after every typing pause — not continuous. On a few thousand notes on a
phone that is still a multi-second stall at exactly the moment the user stops typing and looks at
the screen.

**Proposed fixes, cheapest first.**

- Longer debounce on touch: `Platform.isMobile ? 10000 : 1500`.
- Do not schedule a prune from the `unknown.length === 0` early return at all — nothing was added,
  so the only thing that can have changed is a *removal*, which the next real scan will catch.
- Move the pass off the edit path entirely: run it on `file-open`, or on an idle callback, or once
  per session.

**Risk.** Low. The only user-visible effect is that an orphaned auto-created row lingers in the
settings list a little longer before disappearing.

---

## 4. `HeadingGapWidget.estimatedHeight` hardcodes 16 px per em

**Severity: low by default, scales with the "Spacing between headers" slider.**

`src/editor/livepreview/headingGapWidget.ts`:

```ts
const ESTIMATED_PX_PER_EM = 16;
…
override toDOM(): HTMLElement {
    const el = createDiv();
    el.style.height = `${this.em}em`;
    return el;
}
override get estimatedHeight(): number {
    return Math.round(this.em * ESTIMATED_PX_PER_EM);
}
```

The DOM height is `em` against the editor's inherited font size, which the user sets in
Appearance → Font size and which is commonly 18–20 px on a phone. `estimatedHeight` — what
CodeMirror uses for every gap widget it has not painted yet — is pinned to 16. The error is
`(realFontPx − 16) × em` per gap, it is signed the same way every time, and it accumulates over
every heading callout outside the viewport. When a fold or a scroll finally brings those widgets in
to be measured, the height map corrects and the scroll offset snaps.

With the default gap of `0.5em` (`src/constants.ts`) the error is ~1–2 px per heading, so this is
unlikely to be the reporter's main complaint on its own — but it grows linearly with the slider and
with heading count.

**Proposed fix.** Derive px-per-em from `--font-text-size`, which Obsidian keeps current on
`document.body` (`updateFontSize` in `app.js` does
`document.body.style.setProperty("--font-text-size", px)`), cache it, and use the same px value for
both `toDOM` and `estimatedHeight` so the estimate is exact by construction rather than close.

**Risk.** Low. Keep `eq()` keyed on whatever value ends up driving the height, or widgets will stop
matching themselves across a font-size change.

**Introduced by** `bc248c8` (2026-07-20) *feat: add "Spacing between headers"* — the day of the
report.

---

## Things that were checked and are NOT the problem

- **No async DOM growth in any widget.** `CalloutTokenWidget`, `HeadingRefLinkWidget` and
  `HeadingFoldArrowWidget` all build synchronously; missing artwork paints a synchronous
  placeholder. The classic "widget grows one frame after layout" pattern is absent.
- **No `scrollIntoView` and no `scrollTop` writes** anywhere in `editor/`, `reading/`, `outline/`,
  `manager/` or `icons/`. The four occurrences in the repo are all settings-modal UI.
- **No `dispatch` inside any `update()`** — the view plugin only assigns `this.decorations`.
- **The Live Preview view plugin is correctly viewport-scoped** (`view.visibleRanges`, with an
  `indexOf("[!")` bail per line). Only `headingGapField` scans the whole document, which is
  unavoidable for block widgets and is hard-gated on the gap being non-zero.
- **`CalloutDiscovery` does not fire per keystroke.** It listens on `metadataCache.on("changed")`,
  which is already behind core's own ~2 s post-typing debounce, plus its own 300 ms per-file timer.
  (The class doc comment claiming "file-open and file-modify" is stale.)
