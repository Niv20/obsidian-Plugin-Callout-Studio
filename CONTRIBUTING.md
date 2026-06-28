# Contributing to Callout Studio

Thanks for taking an interest in the project. This is a one-person plugin maintained in spare time, so the bar for contributing is low — found a bug, want a feature, want to fix a bad translation? Open an issue or a PR.

## Setup

```bash
npm install
npm run dev     # watch build, esbuild with inline sourcemaps
```

You'll need a current Node LTS. There's no automated test suite, so testing is manual: build, copy `main.js`, `manifest.json`, and `styles.css` into `<Vault>/.obsidian/plugins/callout-studio/`, and reload Obsidian.

## Reporting a bug

Open an issue with:
- Steps to reproduce
- What you expected vs. what actually happened
- The plugin version from `manifest.json`, and your Obsidian version if it might matter
- A screenshot for anything visual — callouts are visual, so this saves a lot of back-and-forth

## Suggesting a feature

Describe the problem you're trying to solve rather than a finished spec. There's often already a mechanism (transforms, aliases, the public API) that covers it, or a reason something was left out on purpose.

## Submitting a change

1. Fork the repo, branch off `master` (`feature/short-description` or `fix/short-description`).
2. Make your change. [CLAUDE.md](CLAUDE.md) has the architecture overview — read the "Data flow" section before touching anything under `src/manager/`. A couple of real bugs here have come from missing one of the registry → CSS injector → re-render steps.
3. Run `npm run lint` and `npm run build` before pushing. CI runs the same two commands on every push and PR, so anything that fails locally will fail there too.
4. Test the change in Obsidian (see Setup above), and say how you tested it in the PR description — with no test suite, that's the only signal a reviewer has.

Keep PRs to one change. A fix bundled with an unrelated refactor just makes both harder to review. A husky pre-commit hook also lints staged files automatically, so most style issues get caught before you even push.

## Code conventions

Full list in [CLAUDE.md](CLAUDE.md). The ones that bite most often:
- Strict TypeScript — no `any` without an ESLint-disable comment explaining why.
- Split files once they pass ~300 lines.
- Listeners and intervals go through `this.registerEvent` / `registerInterval` / `registerDomEvent`, not raw `addEventListener` or `setInterval`, so they don't leak past plugin unload.
- Command IDs don't change once released — they're part of the public surface.
- User-facing text goes through `t()`, with the key added to `src/i18n/en.ts`.

## Localization

The UI ships in 32 languages. English is the canonical, hand-written source — every other file under `src/i18n/` was machine-translated and almost certainly has rough edges somewhere. If you speak one of the supported languages, fixing a wrong or awkward string in its file (e.g. `fr.ts`) is a genuinely useful, low-effort PR — no code required. You don't need to translate a new string into the other 31 languages when you add it; `en.ts` is the fallback for anything missing elsewhere.

## Commit messages

Most of the history loosely follows `feat:` / `fix:` / `chore:` prefixes. Match that if it's natural, but a plain, clear sentence works too.

## Versioning

Don't bump `manifest.json`, `package.json`, or `versions.json` in a feature or fix PR — releases are cut separately (`npm version <bump>` syncs all three, and tags are bare semver like `1.5.0`, no `v` prefix). If your PR is specifically about a release, say so in the description.

## License

[0BSD](LICENSE). By submitting a change you agree it's licensed under the same terms.
