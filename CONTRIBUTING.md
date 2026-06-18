# Contributing to Callout Studio

Thank you for wanting to contribute to Callout Studio! This document explains how to report issues, propose improvements, and submit code contributions. It is tailored to this project's structure and development workflow.

## Before you start
- Read existing project docs (for example CLAUDE.md) to understand architecture, scripts, and conventions.
- Make sure you have a current Node.js LTS installed.
- Useful commands:
  - npm install
  - npm run dev       # development/watch build (esbuild, inline sourcemaps)
  - npm run build     # production build (typecheck + minify)
  - npm run lint      # run ESLint across src/

## Filing an issue
Choose the appropriate issue template (Bug report or Feature request) and include:
- Clear, minimal reproduction steps.
- Expected behavior and actual behavior.
- plugin version (manifest.json), Obsidian version if relevant, and OS.
- Logs, screenshots, or sample data if available.

When reporting UI bugs include the plugin manifest version and the steps you took inside Obsidian.

## How to contribute code (pull requests)
1. Fork the repository and clone your fork.
2. Create a focused branch: `feature/short-description` or `fix/short-description`.
3. Make changes and update types and strings as needed.
4. Run checks locally:
   - npm run lint
   - npm run build (ensures TypeScript typechecking)
5. Test manually:
   - Copy the built `main.js` and `manifest.json` into your Vault at `.obsidian/plugins/callout-studio/` and reload the plugin in Obsidian.
6. Push your branch to your fork and open a Pull Request against the repository’s default branch.

I can create the branch and PR for you if you prefer — tell me which branch name to use.

## Branch and release rules
- When updating a release version, keep `manifest.json` and any `versions.json` or release metadata synchronized.
- Release tags should match `manifest.json.version` exactly (do not prefix with `v` unless the project already uses that convention).

## Pull Request checklist
Before requesting review, please ensure:
- [ ] The PR title and description clearly explain what changed and why.
- [ ] Linked to an existing issue if relevant.
- [ ] `manifest.json` / `versions.json` updated if the change affects versioning.
- [ ] `npm run lint` and `npm run build` pass with no errors.
- [ ] Manual verification steps are included (how a reviewer can test the change).
- [ ] UI text additions are included in localization files (e.g., `src/i18n/en.ts` and `src/i18n/he.ts`).
- [ ] Screenshots or short animated GIFs are attached for UI changes.
- [ ] Unit tests added or updated for critical logic (if applicable).

## Code conventions
- Strict TypeScript: avoid `any` where possible. If `any` is necessary, document why and add a scoped ESLint exception.
- Keep source files reasonably small — split files >300 lines by responsibility.
- Use register/unregister patterns for event listeners and intervals. Use this.registerEvent / this.registerInterval / this.registerDomEvent (or equivalent) so cleanup happens on unload.
- Command IDs and persisted keys should be stable; avoid changing them after release.
- UI strings: use sentence case and the project i18n functions (e.g., `t()`).

## Commit messages
We prefer Conventional Commits style:
- feat(scope): short description
- fix(scope): short description
- docs: ...
- chore: ...
Example: `feat(callout-editor): add live preview for icon changes`

## Testing & debugging
- There is no automated test suite for everything; follow the manual test steps described above.
- For build errors: run `npm run lint` and `npm run build` to surface TypeScript/ESLint issues.

## Localization
- Add any new user-facing strings to `src/i18n/en.ts` and the corresponding language files (e.g., `src/i18n/he.ts`).
- Use the established translation helper (`t()` or project equivalent) throughout the UI.

## Code of Conduct
- Please follow a respectful, professional, and inclusive code of conduct. If the project does not yet include `CODE_OF_CONDUCT.md`, adding one is recommended.

## Issue & PR templates
- Consider adding `.github/ISSUE_TEMPLATE/` and `.github/PULL_REQUEST_TEMPLATE.md` to make reports and PRs consistent.

## How to get help
- Open an issue with the `help wanted` or `question` label and include relevant details.
- Mention maintainers by their GitHub handles when you need direct input (replace `{maintainer}` with the correct user).

## Licensing
- Do not change the project license without agreement from the maintainers.

---

If you want, I can also:
- Create a branch and commit this file, and open a PR (tell me the branch name to use, e.g. `contribution/add-contributing`).
- Add ISSUE/PR templates under `.github/`.