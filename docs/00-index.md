# Callout Studio developer guide

This is a from-the-source developer guide to the Callout Studio Obsidian
plugin — how it's built, why it's built that way, and what to check before
changing it. It documents the repository as it actually exists today; where
something looked intentional but the reason wasn't provable from the code,
that's said explicitly rather than guessed at.

It complements, rather than replaces, three other documents already in the
repo:

- **[`README.md`](../README.md)** — the user-facing feature list and privacy/
  network disclosure. This guide explains the *mechanism* behind what the
  README describes; [21-features.md](21-features.md) is the bridge between
  the two.
- **[`API.md`](../API.md)** — the public plugin API contract for other
  Obsidian plugins. [18-public-api.md](18-public-api.md) explains how the
  implementation enforces what that document promises.
- **`CLAUDE.md`** (repo root) — a dense architectural summary written for AI
  coding assistants. This guide expands on it with full derivations, edge
  cases, and cross-links; where the two disagree on a fine point, this guide
  reflects what the current code actually does.

## Reading order

There isn't one required order, but if you're new to the codebase, reading
**01 through 09 in sequence** gives you the whole mental model: what the
plugin is, how its pieces fit together, what happens when it loads, how data
is shaped and stored, and how a callout actually gets from a definition to
pixels on screen. After that, the remaining files are largely independent
and can be read in whatever order matches what you're touching.

## Everyone

These explain what the plugin is and how it's put together — useful whether
you're fixing a bug, reviewing a PR, or just trying to understand a
subsystem you've never touched.

| File | What it covers |
| --- | --- |
| [01-overview.md](01-overview.md) | What the plugin does, the three callout render roles, and the project's own vocabulary — read this first. |
| [02-architecture.md](02-architecture.md) | The component map, who owns state vs. who operates on it, and the core mutate → CSS → repaint data-flow loop. |
| [03-plugin-lifecycle.md](03-plugin-lifecycle.md) | `onload()` walked step by step in its real order, and `onunload()` cleanup. |
| [04-data-model.md](04-data-model.md) | Every persisted type (`CalloutDefinition`, `PluginSettings`, …) and the callout-id normalization rules. |
| [05-callout-registry.md](05-callout-registry.md) | The single source of truth: CRUD, load-time migrations, the built-in-deference mechanism, the live-preview slot. |
| [06-css-generation.md](06-css-generation.md) | How the registry becomes a stylesheet: the injector's two write targets, icon painting, `externalStyle`, selector escaping. |
| [07-persistence-and-caching.md](07-persistence-and-caching.md) | What's saved to `data.json`, what's cached on disk, what's runtime-only, and the startup CSS snapshot. |
| [08-render-roles.md](08-render-roles.md) | The token grammar, and how heading/inline callouts render in Live Preview and Reading view. |
| [09-editor-integrations.md](09-editor-integrations.md) | Autocomplete, wrap/unwrap, the five fixed commands, custom commands, the right-click menu, Outline/link cleanup. |
| [10-vault-discovery.md](10-vault-discovery.md) | Auto-discovering unknown callouts, pruning unused rows, statistics, replace-in-vault, and the delete flow. |
| [11-color-system.md](11-color-system.md) | The translucent-tint nesting invariant, palette derivation and baking, the Obsidian 1.13 colour-format split. |
| [12-icons.md](12-icons.md) | The icon-pack model, fetch/cache/verify pipeline, rendering, SVG sanitization, and "Your images." |
| [13-callout-editor.md](13-callout-editor.md) | The edit/create modal: the concrete-form-vs-optional-field tension, the live preview, validation, and save pipeline. |
| [14-import-export.md](14-import-export.md) | The JSON backup format and validator, the CSS-snippet export, and the Callout Manager / Admonition importers. |
| [15-settings-ui-and-modals.md](15-settings-ui-and-modals.md) | The settings tab's composition, the shared modal chrome, and the individual modals. |
| [16-i18n.md](16-i18n.md) | How `t()` resolves strings, the locale download/verification pipeline, and the contribution workflow. |
| [21-features.md](21-features.md) | A user-facing feature catalog, each entry paired with a pointer into the relevant technical doc. |

## Contributors and maintainers

More specialized: extension workflows, build/release mechanics, the public
API's implementation guarantees, and a concentrated list of traps this
codebase has already been bitten by once.

| File | What it covers |
| --- | --- |
| [17-build-test-release.md](17-build-test-release.md) | Build tooling, the test harness and what it can't see, CI, and the release process. |
| [18-public-api.md](18-public-api.md) | How the read-only public API is actually enforced — real privacy, frozen copies, the committed-state guarantee. |
| [19-extending.md](19-extending.md) | Step-by-step checklists for adding a setting, a command, a callout field, a menu item, an icon source, and more. |
| [20-common-pitfalls.md](20-common-pitfalls.md) | Concentrated warnings: state sync, id normalization, helpers that must always be used, mobile quirks, backward compatibility. |

## Related topics with their own dedicated skills

Four subsystems are narrow and detailed enough that they live in their own
Claude Code skills rather than as a docs/ file — this guide's relevant
sections link out to them where useful:

- **`callout-color-nesting`** — the full alpha-solving derivation behind the
  translucent-tint background math (summarized in
  [11-color-system.md](11-color-system.md)).
- **`callout-metadata-pipe`** — the pipe-splitting migration and edge cases
  in detail (summarized in [01-overview.md](01-overview.md) and
  [04-data-model.md](04-data-model.md)).
- **`tabler-outline-stroke`** — how Tabler's stroked outline icons are drawn
  and coloured without storing the stroke in the pack file.
- **`user-image-icons`** — deeper treatment of the "Your images" source
  (summarized in [12-icons.md](12-icons.md)).

## A note on how this guide was written

Every claim here was checked against the source as it exists in this
repository, not inferred from naming or assumed from convention. Where the
reasoning behind a design decision is stated explicitly in a code comment,
this guide quotes or closely paraphrases it. Where something looks
deliberate but the *reason* isn't provable from the code, that uncertainty
is stated rather than papered over. If you find a place where this guide and
the code have drifted apart, the code is correct — please fix the doc.
