# Feature catalog

A user-facing tour of what Callout Studio does, each entry paired with where
the implementation is documented. Terminology here matches the README, the
in-app UI strings, and the `video-scripts/` narration — use these exact
terms rather than inventing new ones when writing further documentation or
UI copy.

## The three callout forms

**User perspective**: one callout definition — one icon, one colour, one
name — can be written three different ways in a note, each with its own
vault-wide style controls:

- **Block callout** — `> [!note] Title` — the classic Obsidian box.
- **Heading callout** — `## [!note] Title` — turns a whole heading into a
  coloured, foldable bar, while staying a real heading for the Outline pane,
  links, and Table-of-contents plugins.
- **Inline callout** — `word [!note] word` — a small coloured pill mid
  sentence, optionally carrying its own label: `[!note]{custom text}`.

All three render in Live Preview, Reading view, and PDF export.

**Developer perspective**: [Overview § the three render roles](01-overview.md#the-three-render-roles),
[Render roles and rendering surfaces](08-render-roles.md).

## Callout metadata (`|purple`)

**User perspective**: `> [!note|purple]` is still the `note` callout — the
part after the `|` is metadata a theme or CSS snippet can use, not a
different callout type. `[!note]`, `[!note|purple]`, and `[!note|green]` all
show up as one row in the callout list.

**Developer perspective**: [Overview § callout IDs, metadata and the pipe](01-overview.md#callout-ids-metadata-and-the-pipe),
[Data model § the three normalizers](04-data-model.md#callout-ids-and-the-three-normalizers).

## Icons

**User perspective**: seven libraries (Lucide, Tabler, Material Symbols,
Emoji, Font Awesome, Octicons, RPG Awesome) plus **Your images** (upload your
own SVG/PNG/JPEG/WebP), searchable together via **All sources** or one at a
time. Searching is always offline; only pressing **Download** (or confirming
a pick) ever touches the network. Fine-tune size and offset per render role.
A callout can also render with **no icon at all** — hover the icon tile and
click the small **✕**; the title moves left, and if *Align content with
title* is on, the body follows.

**Developer perspective**: [Icons](12-icons.md) (fetch/cache architecture,
the two id spaces, sanitization), [Callout editor § the icon picker](13-callout-editor.md#the-icon-picker),
[Data model § hideIcon](04-data-model.md#calloutdefinition) for why "no
icon" is a flag rather than a pack member.

## Per-mode colours and custom palettes

**User perspective**: separate Light and Dark colours per callout, following
the active theme automatically. Save reusable palettes — Simple mode (one
base colour, auto-derived, contrast-corrected) or Advanced mode (all four
colours by hand, live contrast warnings). Editing a saved palette updates
every callout using it; deleting one leaves those callouts with their last
colours, offered back as a **"Deleted colour"** entry that can be
**revived**.

**Developer perspective**: [Colour system](11-color-system.md) (the nesting
invariant, palette baking, presets), [Settings UI and modals § PaletteEditorModal](15-settings-ui-and-modals.md#paletteeditormodal--simple-vs-advanced-two-background-styles).

## `[!` autocomplete

**User perspective**: typing `[!` inside any of the three roles shows a
dropdown of known callouts, filterable by name/id/alias, with a
**"Create new"** row for a name that doesn't exist yet — picking it opens
the editor pre-filled with the typed name.

**Developer perspective**: [Editor integrations § autocomplete](09-editor-integrations.md#autocomplete).

## Global callout style

**User perspective**: block, heading, and inline callouts each get their own
style popup (border sides/width, corner rounding, title/content scale for
block; padding and outer spacing for heading; font scale for inline; *Align
content with title* for block). Changes apply instantly, vault-wide.

**Developer perspective**: [Colour system § globalStyleMerge.ts](11-color-system.md#globalstylemergets-and-iconadjustts),
[CSS generation § generateGlobalStyleCSS](06-css-generation.md).

## Default fallback callout

**User perspective**: an unrecognized `[!id]` renders styled as whichever
callout is picked under **Default fallback callout**. New discovered rows
mirror this style automatically until customized; changing the fallback
updates every row still mirroring it, instantly.

**Developer perspective**: [Vault discovery § CalloutDiscovery](10-vault-discovery.md),
[Callout registry § restyleUncustomizedFallbackRows](05-callout-registry.md).

## External style — handing a callout to the theme

**User perspective**: some themes ship their own elaborate callout styling,
and this plugin normally wins that fight. **Use external style** (per-row
`⋯` menu) turns that off for one callout: no colours, icon, background,
border, or text-size come from this plugin anymore for that id — the
callout's heading and inline forms stop rendering too, since there's no
theme fallback for the plugin's own invented syntax. The row stays visible
in settings, tagged, with a live preview of how the theme actually draws it.
The active default fallback callout can't be marked this way.

**Developer perspective**: [CSS generation § externalStyle](06-css-generation.md#externalstyle--the-opt-out-and-why-it-needs-three-separate-exclusion-mechanisms),
[Render roles § shouldRenderToken](08-render-roles.md#shouldrendertoken--the-externalstyle-cutoff).

## Vault discovery

**User perspective**: new callout IDs typed anywhere are picked up
automatically and added as fallback-styled rows. A vault with 500+ files
asks permission before the first full scan; smaller vaults scan silently.
**Scan now** runs a one-shot scan on demand. Rows that are never customized
and never used anywhere get pruned automatically in the background.

**Developer perspective**: [Vault discovery](10-vault-discovery.md).

## Right-click context menu

**User perspective**: right-click any block, heading, or inline callout for
extra actions — edit, open settings, and (block) copy markdown / set fold
default, or (heading) cut/copy/delete the whole section. Every action is a
single, undoable editor operation. Customize which items appear and their
order per role from **Customize menu items**.

**Developer perspective**: [Editor integrations § the right-click context
menu](09-editor-integrations.md#the-right-click-context-menu).

## Editor commands and custom commands

**User perspective**: five fixed commands (Open settings, Create new callout
type, Insert empty callout, Wrap in callout, Unwrap from callout) with no
default shortcuts — assign your own in **Keyboard shortcuts → Manage
commands**. Build your own per-callout commands (a specific type + role +
heading level/action) in the same window; they behave identically to the
generic ones — same handling of selections, nesting, code blocks and
frontmatter — just with the type pre-chosen. Renaming a callout updates a
dependent command's palette name and keeps its shortcut; deleting the
callout removes the command.

**Developer perspective**: [Editor integrations § the five fixed commands](09-editor-integrations.md#the-five-fixed-commands)
and [§ CustomCommandManager](09-editor-integrations.md#customcommandmanager--one-idempotent-sweep).

## Heading callouts: Outline, links, and TOC plugins

**User perspective**: a heading callout's Outline-pane entry, and any link
to it, show the clean title with the callout's colour and icon — never the
raw `[!id]` syntax. This works with the **Table of Contents** and
**Automatic Table Of Contents** community plugins too, since they read the
same rendered link text this plugin cleans up.

**Developer perspective**: [Render roles § the Outline pane, PDF export, and
gradient text](08-render-roles.md#the-outline-pane-pdf-export-and-gradient-text),
[Editor integrations § Outline pane and link suggestions](09-editor-integrations.md#outline-pane-and-link-suggestions).

## Vault insights & maintenance

**User perspective**: **Callout statistics** scans the whole vault and lists
every type with usage count, file count, and source. **Replace in vault**
swaps every occurrence of one id for another in one pass. **Convert to plain
text** strips a callout's markup while keeping its content as an ordinary
paragraph.

**Developer perspective**: [Vault discovery § vault scanners](10-vault-discovery.md#vault-scanners--one-shared-tokenizer-for-every-consumer).

## Deleting, replacing, and resetting callouts

**User perspective**: deleting an in-use custom callout offers a choice —
convert its vault occurrences to plain text, or replace them with another
type in one pass. An unused custom callout deletes with no vault effect. A
built-in can never be removed from the list, only **Reset to default**
(restoring its shipped colour/icon) or converted/replaced in the vault the
same way. Typing a deleted id again later just creates a fresh fallback row
— nothing is permanently "remembered" as forbidden.

**Developer perspective**: [Vault discovery § delete flow](10-vault-discovery.md#delete-flow)
and [§ replace flow](10-vault-discovery.md#replace-flow).

## Import / export

**User perspective**: **Export** offers a Callout Studio backup (`.json` —
callouts, palettes, and settings together) or a CSS snippet (for anywhere
the plugin isn't installed). **Import** validates a backup file, reports
issues per row, imports only the valid entries, and merges palettes/pictures/
commands into the existing ones rather than overwriting them. Dedicated
importers exist for **Callout Manager** and **Admonition** — either reading
that plugin's own settings straight out of the vault, or from a pasted/
uploaded file.

**Developer perspective**: [Import and export](14-import-export.md).

## Export as a CSS snippet

**User perspective**: writes the current styling as plain CSS to
`.obsidian/snippets/callout-studio-custom.css`, for carrying a look
somewhere Callout Studio isn't installed. It's a **snapshot**, never
live-linked — nothing updates the file after export. Re-exporting after no
change writes nothing at all. The snippet is **never enabled automatically**.

**Developer perspective**: [Persistence and caching § the user-requested CSS
snippet export](07-persistence-and-caching.md#the-user-requested-css-snippet-export).

## Reset

**User perspective**: three distinct granularities, from narrowest to
broadest — reset one style slider back to its default; **Reset to default**
on a single built-in callout (colour + icon only, not the whole row);
**Reset everything**, which removes every user callout, restores every
built-in, resets global styles, and clears cached icon artwork vault-wide.

**Developer perspective**: [Callout registry § resetBuiltIn / resetAll](05-callout-registry.md).

## Localization

**User perspective**: the UI is available in 32 languages, following
Obsidian's own interface language automatically (or chosen manually).
English is always instantly available; other languages download in the
background the first time they're needed and then work offline.

**Developer perspective**: [Localization](16-i18n.md).

## Related documentation

- [Overview and terminology](01-overview.md)
- The README (`../README.md`) — the authoritative user-facing feature list this catalog summarizes
- `video-scripts/` — narration scripts with additional workflow framing for several of these features
