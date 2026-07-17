/**
 * utils/importValidator.ts — Validates JSON callout data before import.
 *
 * Parses and sanitizes a raw JSON value against the CalloutDefinition schema:
 * checks required fields, color format, icon type/style/weight ranges, tag
 * length limits, and alias uniqueness. Returns valid definitions alongside a
 * structured list of issues (errors + warnings) so the ImportReportModal can
 * show the user exactly what was wrong before committing anything.
 */
import type {
	CalloutDefinition,
	CalloutIcon,
	PluginSettings,
} from "../types";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import { EXPORT_FORMAT_ID } from "../manager/CalloutRegistry";
import { MAX_TAG_LENGTH, MAX_TAGS_COUNT } from "../constants";
import { normalizeCalloutId } from "./calloutId";
import { sanitizeBgGradient } from "./colorUtils";
import { sanitizeImportedSettings } from "./settingsValidator";

/** Severity used by the report modal to style each row. */
export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
	/** Zero-based index of the entry in the source array; -1 for top-level issues. */
	index: number;
	/** Best-effort label for the offending entry (id / displayName / "#index"). */
	entryLabel: string;
	/** Optional dotted field path (e.g. "icon.weight"). */
	field?: string;
	level: IssueLevel;
	/** i18n key from the `import.err.*` / `import.warn.*` namespace. */
	messageKey: string;
	/** i18n interpolation params. */
	params?: Record<string, string | number>;
}

export interface ValidationResult {
	/** Sanitized, safe-to-import callout definitions (only fully valid entries). */
	validDefs: CalloutDefinition[];
	/** All issues across the file (errors AND warnings). */
	issues: ValidationIssue[];
	/** True when the top-level structure is unusable (e.g. not an array). */
	fatal: boolean;
	/**
	 * Sanitized plugin settings from a v2 export envelope, if present.
	 * `undefined` for legacy flat-array files (which carry no settings).
	 */
	settings?: PluginSettings;
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
// IDs may contain normal spaces (multi-word labels). Still reject pipes,
// brackets, and non-space whitespace (tabs / line breaks).
const ID_BAD_CHAR_RE = /[|\][\t\n\r]/;
const VALID_ICON_TYPES = new Set(["lucide", "material", "emoji"]);
const VALID_MATERIAL_STYLES = new Set([
	"outlined",
	"filled",
	"rounded",
	"sharp",
]);
const MAX_DISPLAY_NAME = 80;

/** Top-level keys we recognize on a `CalloutDefinition`. Anything else is reported as a warning. */
const KNOWN_FIELDS = new Set<string>([
	"id",
	"displayName",
	"icon",
	"colorLight",
	"colorDark",
	"foldable",
	"defaultFolded",
	"builtIn",
	"source",
	"iconOffsetX",
	"iconOffsetY",
	"iconSize",
	"bgColorLight",
	"bgColorDark",
	"bgGradient",
	"textColorLight",
	"textColorDark",
	"aliases",
	"metadata",
]);

const KNOWN_ICON_FIELDS = new Set<string>(["type", "value", "style", "weight"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}
	const proto: unknown = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

/** Safe value formatter for issue messages — never invokes default `[object Object]` toString. */
function fmt(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (typeof value === "string") return value;
	if (
		typeof value === "number" ||
		typeof value === "boolean" ||
		typeof value === "bigint"
	) {
		return String(value);
	}
	try {
		return JSON.stringify(value) ?? "";
	} catch {
		return typeof value;
	}
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function deriveLabel(
	raw: Record<string, unknown> | null,
	index: number,
): string {
	if (raw) {
		const id = typeof raw.id === "string" ? raw.id.trim() : "";
		if (id) return id;
		const name =
			typeof raw.displayName === "string" ? raw.displayName.trim() : "";
		if (name) return name;
	}
	return `#${index + 1}`;
}

function validateIdString(
	id: string,
	push: (issue: Omit<ValidationIssue, "index" | "entryLabel">) => void,
	field: string,
): boolean {
	let ok = true;
	if (id.length === 0) {
		push({ field, level: "error", messageKey: "import.err.idEmpty" });
		return false;
	}
	if (id.length > MAX_TAG_LENGTH) {
		push({
			field,
			level: "error",
			messageKey: "import.err.idTooLong",
			params: { value: id, max: MAX_TAG_LENGTH, length: id.length },
		});
		ok = false;
	}
	if (ID_BAD_CHAR_RE.test(id)) {
		push({
			field,
			level: "error",
			messageKey: "import.err.idBadChar",
			params: { value: id },
		});
		ok = false;
	}
	return ok;
}

function validateIcon(
	icon: unknown,
	push: (issue: Omit<ValidationIssue, "index" | "entryLabel">) => void,
): icon is CalloutIcon {
	if (!isPlainObject(icon)) {
		push({
			field: "icon",
			level: "error",
			messageKey: "import.err.iconNotObject",
		});
		return false;
	}
	let ok = true;
	const type = icon.type;
	if (typeof type !== "string" || !VALID_ICON_TYPES.has(type)) {
		push({
			field: "icon.type",
			level: "error",
			messageKey: "import.err.iconTypeInvalid",
			params: { value: fmt(type) },
		});
		ok = false;
	}
	const value = icon.value;
	if (typeof value !== "string" || value.trim().length === 0) {
		push({
			field: "icon.value",
			level: "error",
			messageKey: "import.err.iconValueEmpty",
		});
		ok = false;
	} else if (value.length > 200) {
		push({
			field: "icon.value",
			level: "error",
			messageKey: "import.err.iconValueTooLong",
			params: { length: value.length },
		});
		ok = false;
	}
	if (icon.style !== undefined) {
		if (
			typeof icon.style !== "string" ||
			!VALID_MATERIAL_STYLES.has(icon.style)
		) {
			push({
				field: "icon.style",
				level: "error",
				messageKey: "import.err.materialStyle",
				params: { value: fmt(icon.style) },
			});
			ok = false;
		}
	}
	if (icon.weight !== undefined) {
		const w = icon.weight;
		if (
			!isFiniteNumber(w) ||
			!Number.isInteger(w) ||
			w < 100 ||
			w > 700 ||
			w % 100 !== 0
		) {
			push({
				field: "icon.weight",
				level: "error",
				messageKey: "import.err.materialWeight",
				params: { value: fmt(w) },
			});
			ok = false;
		}
	}
	const unknown = Object.keys(icon).filter((k) => !KNOWN_ICON_FIELDS.has(k));
	if (unknown.length > 0) {
		push({
			field: "icon",
			level: "warning",
			messageKey: "import.err.unknownFields",
			params: { fields: unknown.join(", ") },
		});
	}
	return ok;
}

function validateColor(
	value: unknown,
	field: string,
	push: (issue: Omit<ValidationIssue, "index" | "entryLabel">) => void,
	required: boolean,
): boolean {
	if (value === undefined || value === null) {
		if (required) {
			push({
				field,
				level: "error",
				messageKey: "import.err.requiredMissing",
				params: { field },
			});
			return false;
		}
		return true;
	}
	if (typeof value !== "string" || !HEX_COLOR_RE.test(value)) {
		push({
			field,
			level: "error",
			messageKey: "import.err.colorInvalid",
			params: { field, value: fmt(value) },
		});
		return false;
	}
	return true;
}

function validateNumberRange(
	value: unknown,
	field: string,
	min: number,
	max: number,
	push: (issue: Omit<ValidationIssue, "index" | "entryLabel">) => void,
	messageKey: string,
): boolean {
	if (!isFiniteNumber(value) || value < min || value > max) {
		push({
			field,
			level: "error",
			messageKey,
			params: { field, value: fmt(value), min, max },
		});
		return false;
	}
	return true;
}

function validateMetadata(
	value: unknown,
	push: (issue: Omit<ValidationIssue, "index" | "entryLabel">) => void,
): boolean {
	if (!isPlainObject(value)) {
		push({
			field: "metadata",
			level: "error",
			messageKey: "import.err.metadataShape",
		});
		return false;
	}
	for (const [k, v] of Object.entries(value)) {
		if (typeof v !== "string") {
			push({
				field: `metadata.${k}`,
				level: "error",
				messageKey: "import.err.metadataShape",
			});
			return false;
		}
	}
	return true;
}

/**
 * Validate a parsed JSON payload against the `CalloutDefinition[]` contract.
 * Collects every issue encountered (does not bail early) so the report modal
 * can show the user the full picture in one pass.
 */
/**
 * Validate an import payload. Accepts BOTH shapes:
 * - Legacy: a flat `CalloutDefinition[]` array (callouts only).
 * - v2: an object envelope `{ format, formatVersion, callouts, settings }`
 *   carrying callouts AND full plugin settings.
 */
export function validateImportPayload(
	raw: unknown,
	registry: CalloutRegistry,
): ValidationResult {
	// v2 object envelope.
	if (isPlainObject(raw) && !Array.isArray(raw)) {
		const looksLikeV2 =
			raw.format === EXPORT_FORMAT_ID ||
			typeof raw.formatVersion === "number" ||
			Array.isArray(raw.callouts);
		if (!looksLikeV2) {
			return {
				validDefs: [],
				issues: [
					{
						index: -1,
						entryLabel: "",
						level: "error",
						messageKey: "import.err.notRecognized",
					},
				],
				fatal: true,
			};
		}
		const calloutsRaw = raw.callouts;
		const base = Array.isArray(calloutsRaw)
			? validateCalloutArray(calloutsRaw, registry)
			: { validDefs: [], issues: [] };
		const settingsResult = sanitizeImportedSettings(raw.settings);
		return {
			validDefs: base.validDefs,
			issues: [...base.issues, ...settingsResult.issues],
			fatal: false,
			settings: settingsResult.settings ?? undefined,
		};
	}

	// Legacy flat array.
	if (!Array.isArray(raw)) {
		return {
			validDefs: [],
			issues: [
				{
					index: -1,
					entryLabel: "",
					level: "error",
					messageKey: "import.err.notRecognized",
				},
			],
			fatal: true,
		};
	}

	const base = validateCalloutArray(raw, registry);
	return { ...base, fatal: false };
}

/**
 * Validate a flat array of raw callout entries into safe CalloutDefinitions,
 * collecting every issue (never bailing early) so the report modal can show
 * the full picture in one pass.
 */
function validateCalloutArray(
	raw: unknown[],
	registry: CalloutRegistry,
): { validDefs: CalloutDefinition[]; issues: ValidationIssue[] } {
	const issues: ValidationIssue[] = [];
	const validDefs: CalloutDefinition[] = [];

	// Track ids/aliases declared inside the file (case-insensitive).
	const seenInFile = new Map<string, number>();

	raw.forEach((entry, index) => {
		const isObj = isPlainObject(entry);
		const label = deriveLabel(isObj ? entry : null, index);
		const entryIssues: ValidationIssue[] = [];
		const push = (
			issue: Omit<ValidationIssue, "index" | "entryLabel">,
		): void => {
			entryIssues.push({ ...issue, index, entryLabel: label });
		};

		if (!isObj) {
			push({
				level: "error",
				messageKey: "import.err.entryNotObject",
			});
			issues.push(...entryIssues);
			return;
		}

		let entryOk = true;

		// ── Required primitive fields ────────────────────────────
		if (typeof entry.id !== "string") {
			push({
				field: "id",
				level: "error",
				messageKey: "import.err.requiredMissing",
				params: { field: "id" },
			});
			entryOk = false;
		}
		if (typeof entry.displayName !== "string") {
			push({
				field: "displayName",
				level: "error",
				messageKey: "import.err.requiredMissing",
				params: { field: "displayName" },
			});
			entryOk = false;
		}
		if (typeof entry.foldable !== "boolean") {
			push({
				field: "foldable",
				level: "error",
				messageKey: "import.err.boolField",
				params: { field: "foldable" },
			});
			entryOk = false;
		}
		if (typeof entry.defaultFolded !== "boolean") {
			push({
				field: "defaultFolded",
				level: "error",
				messageKey: "import.err.boolField",
				params: { field: "defaultFolded" },
			});
			entryOk = false;
		}

		// ── id ─────────────────────────────────────────────────
		// Canonicalize (trim, collapse whitespace, lowercase) so imported IDs
		// match the form the editor produces and the vault scanner expects.
		const idRaw =
			typeof entry.id === "string" ? normalizeCalloutId(entry.id) : "";
		if (typeof entry.id === "string") {
			if (!validateIdString(idRaw, push, "id")) entryOk = false;
		}

		// ── displayName ─────────────────────────────────────────
		const displayNameRaw =
			typeof entry.displayName === "string"
				? entry.displayName.trim()
				: "";
		if (typeof entry.displayName === "string") {
			if (displayNameRaw.length === 0) {
				push({
					field: "displayName",
					level: "error",
					messageKey: "import.err.displayNameEmpty",
				});
				entryOk = false;
			} else if (displayNameRaw.length > MAX_DISPLAY_NAME) {
				push({
					field: "displayName",
					level: "error",
					messageKey: "import.err.displayNameTooLong",
					params: {
						length: displayNameRaw.length,
						max: MAX_DISPLAY_NAME,
					},
				});
				entryOk = false;
			}
		}

		// ── icon ──────────────────────────────────────────────
		let iconOk = false;
		if (entry.icon === undefined) {
			push({
				field: "icon",
				level: "error",
				messageKey: "import.err.requiredMissing",
				params: { field: "icon" },
			});
			entryOk = false;
		} else {
			iconOk = validateIcon(entry.icon, push);
			if (!iconOk) entryOk = false;
		}

		// ── colors ────────────────────────────────────────────
		if (!validateColor(entry.colorLight, "colorLight", push, true))
			entryOk = false;
		if (!validateColor(entry.colorDark, "colorDark", push, true))
			entryOk = false;
		if (!validateColor(entry.bgColorLight, "bgColorLight", push, false))
			entryOk = false;
		if (!validateColor(entry.bgColorDark, "bgColorDark", push, false))
			entryOk = false;
		if (!validateColor(entry.textColorLight, "textColorLight", push, false))
			entryOk = false;
		if (!validateColor(entry.textColorDark, "textColorDark", push, false))
			entryOk = false;

		// ── background gradient (optional) ───────────────────
		// Warning-level only: a broken gradient degrades the entry to a solid
		// background instead of blocking the import.
		if (
			entry.bgGradient !== undefined &&
			sanitizeBgGradient(entry.bgGradient) === null
		) {
			push({
				field: "bgGradient",
				level: "warning",
				messageKey: "import.warn.invalidGradient",
			});
		}

		// ── optional numeric fields ──────────────────────────
		if (entry.iconOffsetX !== undefined) {
			if (
				!validateNumberRange(
					entry.iconOffsetX,
					"iconOffsetX",
					-10,
					10,
					push,
					"import.err.numberRange",
				)
			)
				entryOk = false;
		}
		if (entry.iconOffsetY !== undefined) {
			if (
				!validateNumberRange(
					entry.iconOffsetY,
					"iconOffsetY",
					-10,
					10,
					push,
					"import.err.numberRange",
				)
			)
				entryOk = false;
		}
		if (entry.iconSize !== undefined) {
			if (
				!validateNumberRange(
					entry.iconSize,
					"iconSize",
					0.5,
					1.5,
					push,
					"import.err.iconSizeRange",
				)
			)
				entryOk = false;
		}

		// ── aliases ──────────────────────────────────────────
		const aliasesClean: string[] = [];
		if (entry.aliases !== undefined) {
			if (!Array.isArray(entry.aliases)) {
				push({
					field: "aliases",
					level: "error",
					messageKey: "import.err.aliasesNotArray",
				});
				entryOk = false;
			} else {
				const seenAlias = new Set<string>();
				if (idRaw) seenAlias.add(idRaw.toLowerCase());
				entry.aliases.forEach((alias, ai) => {
					if (typeof alias !== "string") {
						push({
							field: `aliases[${ai}]`,
							level: "error",
							messageKey: "import.err.aliasNotString",
						});
						entryOk = false;
						return;
					}
					const trimmed = normalizeCalloutId(alias);
					if (!validateIdString(trimmed, push, `aliases[${ai}]`)) {
						entryOk = false;
						return;
					}
					const key = trimmed.toLowerCase();
					if (seenAlias.has(key)) {
						push({
							field: `aliases[${ai}]`,
							level: "error",
							messageKey: "import.err.aliasDup",
							params: { value: trimmed },
						});
						entryOk = false;
						return;
					}
					seenAlias.add(key);
					aliasesClean.push(trimmed);
				});
				const totalIds = (idRaw ? 1 : 0) + aliasesClean.length;
				if (totalIds > MAX_TAGS_COUNT) {
					push({
						field: "aliases",
						level: "error",
						messageKey: "import.err.tooManyIds",
						params: {
							count: totalIds,
							max: MAX_TAGS_COUNT,
						},
					});
					entryOk = false;
				}
			}
		}

		// ── metadata ─────────────────────────────────────────
		if (entry.metadata !== undefined) {
			if (!validateMetadata(entry.metadata, push)) entryOk = false;
		}

		// ── unknown fields (warning, non-fatal) ──────────────
		const unknown = Object.keys(entry).filter((k) => !KNOWN_FIELDS.has(k));
		if (unknown.length > 0) {
			push({
				level: "warning",
				messageKey: "import.err.unknownFields",
				params: { fields: unknown.join(", ") },
			});
		}

		// ── auto-fix: defaultFolded only meaningful when foldable ──
		let autoDefaultFolded: boolean | undefined;
		if (entry.foldable === false && entry.defaultFolded === true) {
			push({
				level: "warning",
				field: "defaultFolded",
				messageKey: "import.warn.defaultFoldedAutofix",
			});
			autoDefaultFolded = false;
		}

		// ── in-file uniqueness (id + aliases) ────────────────
		if (entryOk && idRaw) {
			const allIds = [idRaw, ...aliasesClean];
			let dupHit = false;
			for (const candidate of allIds) {
				const key = candidate.toLowerCase();
				const previousIndex = seenInFile.get(key);
				if (previousIndex !== undefined) {
					push({
						field: candidate === idRaw ? "id" : "aliases",
						level: "error",
						messageKey: "import.err.duplicateInFile",
						params: {
							value: candidate,
							first: previousIndex + 1,
						},
					});
					entryOk = false;
					dupHit = true;
				}
			}
			if (!dupHit) {
				for (const candidate of allIds) {
					seenInFile.set(candidate.toLowerCase(), index);
				}
			}
		}

		// ── cross-registry alias conflict ────────────────────
		if (entryOk && idRaw) {
			for (const alias of aliasesClean) {
				const conflict = registry.findByAlias(alias);
				if (conflict && conflict.id !== idRaw) {
					push({
						field: "aliases",
						level: "error",
						messageKey: "import.err.aliasConflict",
						params: {
							value: alias,
							other: conflict.id,
						},
					});
					entryOk = false;
				}
				const idMatch = registry.get(alias);
				if (idMatch && idMatch.id !== idRaw) {
					push({
						field: "aliases",
						level: "error",
						messageKey: "import.err.aliasConflict",
						params: {
							value: alias,
							other: idMatch.id,
						},
					});
					entryOk = false;
				}
			}
		}

		issues.push(...entryIssues);

		// ── Build sanitized def if entry passed ───────────────
		if (entryOk && iconOk) {
			const iconRaw = entry.icon as Record<string, unknown>;
			const cleanIcon: CalloutIcon = {
				type: iconRaw.type as CalloutIcon["type"],
				value: (iconRaw.value as string).trim(),
			};
			if (typeof iconRaw.style === "string") {
				cleanIcon.style = iconRaw.style as CalloutIcon["style"];
			}
			if (typeof iconRaw.weight === "number") {
				cleanIcon.weight = iconRaw.weight;
			}

			const def: CalloutDefinition = {
				id: idRaw,
				displayName: displayNameRaw,
				icon: cleanIcon,
				colorLight: entry.colorLight as string,
				colorDark: entry.colorDark as string,
				foldable: entry.foldable as boolean,
				defaultFolded:
					autoDefaultFolded ?? (entry.defaultFolded as boolean),
				builtIn: false,
				source: "user",
			};
			if (typeof entry.bgColorLight === "string")
				def.bgColorLight = entry.bgColorLight;
			if (typeof entry.bgColorDark === "string")
				def.bgColorDark = entry.bgColorDark;
			const bgGradientClean = sanitizeBgGradient(entry.bgGradient);
			if (bgGradientClean) def.bgGradient = bgGradientClean;
			if (typeof entry.textColorLight === "string")
				def.textColorLight = entry.textColorLight;
			if (typeof entry.textColorDark === "string")
				def.textColorDark = entry.textColorDark;
			if (isFiniteNumber(entry.iconOffsetX))
				def.iconOffsetX = entry.iconOffsetX;
			if (isFiniteNumber(entry.iconOffsetY))
				def.iconOffsetY = entry.iconOffsetY;
			if (isFiniteNumber(entry.iconSize)) def.iconSize = entry.iconSize;
			if (aliasesClean.length > 0) def.aliases = aliasesClean;
			if (isPlainObject(entry.metadata)) {
				const meta: Record<string, string> = {};
				for (const [k, v] of Object.entries(entry.metadata)) {
					if (typeof v === "string") meta[k] = v;
				}
				def.metadata = meta;
			}
			validDefs.push(def);
		}
	});

	return { validDefs, issues };
}
