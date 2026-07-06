---
name: localization
description: >-
  Use whenever you add, change, or remove user-facing text in this plugin —
  any new `t("key")` call, a new string in `src/i18n/en.ts`, a Notice, modal
  title, button label, setting name/description, command name, or tooltip.
  This project ships 33 locales; this skill defines HOW to add strings during
  coding (English only) and WHEN to deal with the other languages (at the end,
  by offer — never mid-work). Triggers: "add a string", "new label/notice",
  "t()", "en.ts", "he.ts", "translation", "locale", "i18n".
---

# Localization workflow

This plugin has **33 locale files** in `src/i18n/` (`en`, `he`, `zh`, `zh-tw`,
`es`, `pt`, `fr`, `de`, `ru`, `ja`, `ko`, `it`, `tr`, `nl`, `pl`, `uk`, `id`,
`sv`, `ar`, `hi`, `cs`, `ro`, `vi`, `th`, `fa`, `hu`, `da`, `nb`, `el`, `bg`,
`ms`, `fi`, and `zhTW`). Keeping all of them in sync on every edit would grind
feature work to a halt, so we deliberately **don't**.

## The rule

`src/i18n/en.ts` is the **source of truth** and the **runtime fallback**:

- `LocaleKey = keyof typeof en` — the key set is defined by `en.ts`. A key that
  exists only in another locale file is dead; it can never be looked up.
- `t(key)` falls back to the English value whenever a locale is missing the key
  (see `src/i18n/index.ts`). So a string that lives only in `en.ts` still
  renders correctly in **every** language — just untranslated.

Because of that fallback, follow this workflow:

### 1. While coding a feature — English only

For every new user-facing string:

1. Add the key + English text to `src/i18n/en.ts` (in the right `//` comment
   group; reuse an existing key if one already fits).
2. Reference it with `t("your.key")` — never hardcode display text.
3. **Do not** touch the other 32 locale files yet. Do not stop the feature to
   translate. The fallback keeps everything working.

Keep a quiet running list of the keys you add so you can report them later.

### 2. While the user is still iterating — stay silent about translations

Do **not** nag about missing translations mid-work. The user is focused on
getting the code right; a "you still need to translate 32 files" reminder in the
middle of that is noise. English-only is a correct, shippable intermediate
state.

### 3. Once the code is done and the user is satisfied — remind, then offer

Only after the feature is complete and the user is happy with it:

- Remind them, briefly, which new strings were added to `en.ts` only and that
  the other locales still need them (fall back to English until translated).
- **Offer** to fill in the translations — don't do it unprompted, and don't
  block the "done" on it. Example: *"I added 4 new strings to `en.ts`. The other
  32 locales fall back to English for these until translated — want me to
  translate them now?"*

The user should feel the feature is finished; translation is a clean, optional
follow-up step they opt into.

## Finding what's out of sync

`en.ts` (and often `he.ts`, since the maintainer is a Hebrew speaker) run ahead
of the rest. To see which keys a locale is missing:

```bash
# keys in en.ts but missing in a target locale (e.g. de)
comm -23 \
  <(grep -oE '^\s*"[A-Za-z0-9_.]+"\s*:' src/i18n/en.ts | tr -d ' ":' | sort) \
  <(grep -oE '^\s*"[A-Za-z0-9_.]+"\s*:' src/i18n/de.ts | tr -d ' ":' | sort)
```

Loop the target over every file in `src/i18n/` except `en.ts` and `index.ts` to
find all drift.

## When you do translate

- Mirror the **full key set and comment grouping** from `en.ts`; keep keys in
  the same order so files stay diffable.
- Preserve every `{{placeholder}}` token exactly — they are interpolated by
  `t(key, vars)`. Never translate or reorder the token names.
- Keep pluralized/spec strings faithful (e.g. `"{{count}} new callout(s)"`).
- `he`, `ar`, `fa` are RTL — translate the text; do not add layout markup.
- A brand-new locale also needs an entry in `locales` and `localeNames` and an
  import in `src/i18n/index.ts`.
- After adding strings, `npm run build` (or `npm run lint`) will catch a locale
  file that no longer matches the `Record<string, string>` shape.
