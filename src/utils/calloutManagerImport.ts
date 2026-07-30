/**
 * utils/calloutManagerImport.ts — Parses the CSS text the competing "Obsidian
 * Callout Manager" plugin's Copy button puts on the clipboard, e.g.:
 *
 *   .callout[data-callout="test"] {
 *   	--callout-icon: lucide-bean;
 *   	--callout-color: 255, 31, 31
 *   }
 *
 * Parsing (this file) is pure and never touches the registry; planning reads
 * the registry (to decide update-vs-create per id) but doesn't mutate it —
 * the actual mutation is `CalloutRegistry.applyCalloutManagerImport`. Split
 * this way so the paste modal can show a report (via the same
 * `ValidationIssue` shape the JSON importer uses) before anything changes.
 */
import type { CalloutIcon } from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import type { ValidationIssue } from "./importValidator";
import { normalizeCalloutId } from "./calloutId";
import { parseCssColorToHex } from "./colorUtils";

export interface CalloutManagerEntry {
	/** Raw `data-callout` attribute value from the selector, e.g. "test". */
	id: string;
	/** Present only when `--callout-icon` was found and non-empty. */
	icon?: CalloutIcon;
	/** `#rrggbb`, present only when `--callout-color` parsed cleanly. */
	color?: string;
}

const BLOCK_RE = /([^{}]+)\{([^}]*)\}/g;
const SELECTOR_ID_RE = /data-callout=["']([^"']+)["']/g;
const ICON_DECL_RE = /--callout-icon\s*:\s*([^;}]+)/i;
const COLOR_DECL_RE = /--callout-color\s*:\s*([^;}]+)/i;

/**
 * Turns `--callout-icon`'s raw value into our `CalloutIcon` convention: a
 * bare Lucide name. Obsidian's own `--callout-icon` variable (which both
 * Obsidian core and Callout Manager write) always uses the `lucide-`
 * prefixed form, but every render path in this plugin (`renderIcon.ts`,
 * `constants.ts`) stores and consumes the bare name directly with
 * `setIcon`. Callout Manager only ever offers Lucide icons (it uses
 * Obsidian's own built-in icon suggester), so stripping the prefix — or
 * using the raw value as-is if it's missing — always yields a plausible
 * bare name.
 */
function parseIconDecl(raw: string): CalloutIcon | undefined {
	const trimmed = raw.trim();
	if (!trimmed) return undefined;
	const value = trimmed.startsWith("lucide-")
		? trimmed.slice("lucide-".length)
		: trimmed;
	if (!value) return undefined;
	return { type: "lucide", value };
}

/**
 * Parses the pasted text into one entry per distinct `data-callout` id.
 * Blocks are merged by id with last-write-wins **per property** (mirrors CSS
 * cascade: a later block for the same id that only sets one property doesn't
 * erase a property an earlier block already set).
 */
export function parseCalloutManagerExport(text: string): CalloutManagerEntry[] {
	const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, "");
	const byId = new Map<string, CalloutManagerEntry>();

	let block: RegExpExecArray | null;
	while ((block = BLOCK_RE.exec(withoutComments)) !== null) {
		const [, selector, body] = block;
		if (!selector || body === undefined) continue;

		const ids = [...selector.matchAll(SELECTOR_ID_RE)]
			.map((m) => m[1])
			.filter((id): id is string => !!id);
		if (ids.length === 0) continue;

		const iconMatch = ICON_DECL_RE.exec(body);
		const icon = iconMatch?.[1] ? parseIconDecl(iconMatch[1]) : undefined;
		const colorMatch = COLOR_DECL_RE.exec(body);
		const color = colorMatch?.[1]
			? (parseCssColorToHex(colorMatch[1].trim()) ?? undefined)
			: undefined;

		for (const id of ids) {
			const prev = byId.get(id);
			byId.set(id, {
				id,
				icon: icon ?? prev?.icon,
				color: color ?? prev?.color,
			});
		}
	}

	return [...byId.values()];
}

export interface CalloutManagerPlanItem {
	action: "update" | "create";
	/** Set when `action === "update"`: the definition's actual (real) id. */
	existingId?: string;
	entry: CalloutManagerEntry;
}

export interface CalloutManagerPlan {
	toApply: CalloutManagerPlanItem[];
	issues: ValidationIssue[];
}

/**
 * Decides update-vs-create per parsed entry against the current registry.
 * Read-only: never mutates. Matching an existing callout uses
 * `findByAttrId`, which resolves the DOM `data-callout` attribute form
 * (exactly what a CSS selector contains) back to whichever definition —
 * built-in included — already owns it.
 */
export function planCalloutManagerImport(
	entries: CalloutManagerEntry[],
	registry: CalloutRegistry,
): CalloutManagerPlan {
	if (entries.length === 0) {
		return {
			toApply: [],
			issues: [
				{
					index: -1,
					entryLabel: "",
					level: "error",
					messageKey: "import.err.cmNoBlocksFound",
				},
			],
		};
	}

	const toApply: CalloutManagerPlanItem[] = [];
	const issues: ValidationIssue[] = [];

	entries.forEach((entry, index) => {
		const existing = registry.findByAttrId(entry.id);
		if (existing) {
			toApply.push({ action: "update", existingId: existing.id, entry });
			return;
		}

		if (!entry.color) {
			issues.push({
				index,
				entryLabel: entry.id,
				level: "error",
				messageKey: "import.err.cmNoColorForNew",
				params: { value: entry.id },
			});
			return;
		}

		const conflict = registry.findByAlias(normalizeCalloutId(entry.id));
		if (conflict) {
			issues.push({
				index,
				entryLabel: entry.id,
				level: "error",
				messageKey: "import.err.cmIdConflict",
				params: { value: entry.id, other: conflict.id },
			});
			return;
		}

		toApply.push({ action: "create", entry });
	});

	return { toApply, issues };
}
