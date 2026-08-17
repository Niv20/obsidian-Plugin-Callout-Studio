# Using Callout Studio with your theme

Many Obsidian themes come with their own callout styling built in, and Callout Studio's styling normally takes priority over it. If you'd rather let your theme (or your own CSS) decide how a particular callout looks, External style hands that control back to it, one callout type at a time.

## Why Callout Studio usually wins

Some Obsidian themes - ITS, Border, AnuPpuccin, and others - ship elaborate callout styling of their own. By default, Callout Studio wins that conflict for every callout: its CSS is applied last, so at the level of detail a theme normally styles at, the plugin's rule takes precedence. This is why your callouts look the same across themes unless you decide otherwise.

## Turning it off for one callout

If you want a specific callout type to follow your theme's styling instead, you can switch that one callout to External style:

1. Find the callout in your callout list - this works for both built-in and custom callouts.
2. Open its **⋯** menu.
3. Choose **Use external style (theme or CSS)**.

From that point on, Callout Studio emits no CSS and no extra markup for that callout. That means no colors, no background, no icon, no border, no radius, and no text size coming from the global style - and no icon repainting either. Your theme, your own CSS snippet, or plain Obsidian's default styling decides how it looks instead.

## Two things worth knowing

**Heading Callout and Inline Callout stop rendering for that type.** Those two forms are entirely Callout Studio's own invented syntax, and there's no theme styling for them to fall back to. Once a callout is set to external style, its Heading Callout and Inline Callout forms no longer render - the raw `[!type]` text just stays as written on the page. The regular Block Callout form is unaffected, since that's the standard Obsidian callout your theme already knows how to style.

**The row stays in your list, clearly marked.** A callout set to external style doesn't disappear from your settings - it stays visible, tagged **External style**, with its icon and color swatches hidden, since they no longer describe anything you'd actually see. Opening it for editing shows a window explaining the situation, along with a live preview of how your theme actually renders it, and a single button to take control back whenever you want Callout Studio to style it again.

## One restriction

The default fallback callout can't be switched to External style. If you want to use external styling on what is currently your fallback, pick a different callout as your fallback first, then switch the old one.

---
**Next:** [Resetting callouts and settings](13-resetting-callouts-and-settings.md)
