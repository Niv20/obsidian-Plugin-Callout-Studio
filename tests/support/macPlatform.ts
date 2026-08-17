/**
 * tests/support/macPlatform.ts — say "this vault is open on a Mac" before
 * anything can ask.
 *
 * `settings/hotkeyLink.ts` reads `Platform.isMacOS` **once, at module scope**,
 * to build its modifier-glyph table and its joiner. That is the right shape for
 * the plugin — the platform cannot change under a running app — and it means a
 * test cannot flip the answer after the fact: by the time a suite's first
 * statement runs, the tables are already built.
 *
 * Import order is the only lever, and it is a reliable one. ES modules are
 * evaluated depth-first in declaration order, so a suite that lists this import
 * **first** has the seam set before `obsidian` is even loaded, let alone the
 * module that reads it. This is the same guarantee `fakeDom.ts` documents for
 * its globals.
 *
 * Hence a whole file for one assignment, and hence the Mac chords living in
 * `hotkeyLinkMac.test.ts` rather than beside the Windows ones: `node --test`
 * gives each test *file* its own process, which is the only place two different
 * platforms can both be true.
 */
(globalThis as unknown as { __CS_MACOS__?: boolean }).__CS_MACOS__ = true;

/** Imported for its side effect above; exported so the import is never elided. */
export const IS_MAC_SEAM_SET = true;
