# Fallback callouts & auto-discovery

Callout Studio keeps its callout list in sync with what your vault actually uses, without any manual bookkeeping on your part. Type a new callout ID into a note and Callout Studio notices, adds it to your list, and gives it a look right away — so you never end up with an unstyled or broken-looking callout.

## How new callout IDs are picked up

- When a note uses a callout ID that isn't in your list yet, it gets added on its own.
- New callout IDs typed into any open note are picked up automatically as you write — you don't need to save the note first.
- Opening the settings tab also scans any unsaved text sitting in your currently open editor tabs for new IDs, so a callout type you just typed shows up in the list even before you save the note.

## The default fallback callout

Any callout ID that Callout Studio doesn't recognize yet is styled using the default fallback callout. This gives every unrecognized callout type a consistent, presentable appearance instead of leaving it unstyled. You can choose which callout acts as this fallback from Settings.

## Scanning your whole vault

Auto-discovery normally works note by note, as you open and edit files. If you want Callout Studio to check your entire vault in one pass, use the **Scan now** button. This runs a one-time full scan of the vault, adding any unrecognized callout IDs it finds as new rows so you can see and customize them.

On very large vaults — 500 or more markdown files — Callout Studio asks permission before doing a full initial scan. If you decline, files are scanned individually as you open them instead, so nothing is ever scanned without at least implicit action from you opening it.

## Automatic cleanup

Rows that were auto-created this way, and that you never used again and never customized, are quietly cleaned up in the background over time. This keeps your callout list free of clutter from typos or one-off experiments, so it stays focused on the callout types you actually use.

---
**Next:** [Deleting and replacing callouts](09-deleting-and-replacing-callouts.md)
