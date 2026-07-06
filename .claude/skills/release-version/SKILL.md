---
name: release-version
description: >-
  Use when bumping the plugin's version or preparing a release for Obsidian —
  updating the version across `manifest.json`, `versions.json`, and
  `package.json`, keeping them in sync, and getting the tag right. Triggers:
  "bump version", "new release", "release 1.x", "update manifest version",
  "publish plugin", "cut a version".
---

# Version bump & release

Three files carry the version and must never disagree:

| File            | Field                                   |
|-----------------|-----------------------------------------|
| `package.json`  | `version`                               |
| `manifest.json` | `version` + `minAppVersion`             |
| `versions.json` | `{ "<version>": "<minAppVersion>" }` map |

## Preferred path — `npm version`

The repo has a `version` script that automates the sync:

```bash
npm version patch   # or minor | major | 1.7.0
```

This bumps `package.json`, then runs `version-bump.mjs`, which:

- copies the new version into `manifest.json`,
- adds a `"<newVersion>": "<minAppVersion>"` entry to `versions.json` (using the
  `minAppVersion` already in `manifest.json`),
- and `git add`s `manifest.json` + `versions.json`.

If the release requires a **higher `minAppVersion`** (a newer Obsidian API),
edit `manifest.json`'s `minAppVersion` **first**, then run `npm version`.

## Manual path

If bumping by hand, change **`manifest.json` and `versions.json` together**:
set `manifest.json.version`, and add the `version → minAppVersion` pair to
`versions.json`. Keep `package.json.version` matching too.

## Tag rules

- The git tag must equal `manifest.json`'s `version` **exactly** — e.g. `1.7.0`.
- **No leading `v`** (`v1.7.0` is wrong). Obsidian's release tooling matches the
  bare version.

## Release artifacts

Run `npm run build` (typecheck + minified `main.js`) before releasing. The
distributable files are `main.js` and `manifest.json` (plus `styles.css` if the
plugin ships one). Do not ship `src/` or sourcemaps.

## Guardrails

- Don't commit, tag, or push unless the user explicitly asks (repo convention).
- If you added user-facing strings for this release, check the
  **localization** skill first — the non-English locales likely fall back to
  English and the user may want them translated before you cut the version.
