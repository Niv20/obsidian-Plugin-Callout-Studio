---
name: callout-color-nesting
description: >-
    Derives why callout backgrounds must be translucent tints, never opaque
    hex fills, and how translucentTintFor solves the alpha per channel. Use
    when touching utils/colorUtils.ts, CSSInjector's accent/background
    properties, CalloutRegistry.dropDerivedBackgrounds/isUnmodifiedBuiltIn,
    --cs-accent / --callout-color, gradient stops, or debugging why nested
    callouts lose their stepped look or a built-in stopped following the
    theme.
---

# Callout colour and the nesting invariant

**Backgrounds are painted as translucent tints, never as the authored hex, and that is load-bearing.** Obsidian gives nested callouts their stepped look purely by compositing — core paints `color-mix(in oklch, var(--callout-color) 10%, transparent)` under `mix-blend-mode: darken`/`lighten`, so each level lays another layer over the one beneath it and the group alpha climbs as `1 - 0.9ⁿ`, unbounded in depth. An opaque fill hides what is behind it, and `min(x, x) = x` makes the step *exactly* zero. **CSS cannot count nesting depth** (a self-incrementing custom property is a dependency cycle, `:has()` is a predicate not a counter, `counter()` only reaches `content:`), so an explicit per-level rule can only ever approximate a few levels — one was written and deleted for that reason. Translucency is the only real answer.

`translucentTintFor` (`utils/colorUtils.ts`) solves `alpha * colour + (1 - alpha) * backdrop === authored` per channel, so the callout renders *identically* on its own and only what shows through it changes. The alpha is the smallest that keeps the solved colour in gamut, so a colour further from the page gets a weaker — never absent — step; a gradient's two stops share one alpha, since ramping it would tilt the sweep. There is **no opt-out** — a flat fill breaks nesting for everything stacked inside it, so the `solidBackground` flag that used to offer one was retired (`CalloutRegistry.dropSolidBackgroundFlags()` deletes it from old data; `importValidator`'s `RETIRED_FIELDS` drops it from old export files without warning).

**An unmodified built-in gets no `--callout-color` at all** (`CSSInjector.accentProps` + `CalloutRegistry.isUnmodifiedBuiltIn`), so core's rule — and any theme overriding it — keeps deciding the accent. `--cs-accent` is the plugin's own accent variable and is **always a real colour on every Obsidian version**, which is why it, not `--callout-color`, is what our `color-mix()` calls read: core's variable is a bare RGB triplet on ≤1.12 and a full colour on 1.13+. For an untouched built-in it points at core's own variable via `OBSIDIAN_CALLOUT_VAR` (`constants.ts`). `--cs-color-rgb` is legacy, kept one release for external consumers, and nothing here depends on it. The fallback block passes `imposed: true` because its job is to paint callouts *other* than the one it copied — omitting `--callout-color` there would silently disable the setting.

Two migrations keep old data from re-breaking this: `CalloutRegistry.dropDerivedBackgrounds()` retires a stored background that `derivedBgAmount` can show IS just the accent tinted, and `CalloutEditorSave` stops writing one back. The editor form always holds a concrete background (a swatch must show something) — persisting it unconditionally is what turned every callout the user merely opened into an opaque one.
