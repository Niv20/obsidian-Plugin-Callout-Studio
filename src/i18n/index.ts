/**
 * i18n/index.ts — Internationalization system.
 *
 * Manages the active locale and provides the `t(key, params?)` translation
 * function used everywhere in the plugin. Supports runtime locale registration
 * (for third-party translation packs) and auto-detection from Obsidian's
 * moment.locale(). Falls back to English when a key is missing in the active
 * locale. Currently ships with English (en) and Hebrew (he).
 */
import { en } from "./en";
import { he } from "./he";

export type LocaleKey = keyof typeof en;

const locales: Record<string, Record<string, string>> = {
	en,
	he,
};

let currentLocale = "en";

/**
 * Register an additional locale at runtime.
 * Call this before `setLocale` to make the locale available.
 *
 * Example – in your translation file:
 * ```ts
 * import { registerLocale } from "../i18n";
 * registerLocale("he", heStrings);
 * ```
 */
export function registerLocale(
	code: string,
	strings: Record<string, string>,
): void {
	locales[code] = strings;
}

/**
 * Set the active locale.
 * If `"auto"`, the locale is derived from Obsidian's `moment.locale()`.
 * Falls back to `"en"` when the requested locale has no translations.
 */
type MomentLike = { locale: () => string };
type WindowWithMoment = Window & { moment?: MomentLike };

export function setLocale(code: string): void {
	if (code === "auto") {
		const obsidianLocale =
			(window as WindowWithMoment).moment?.locale() ?? "en";
		const lang = obsidianLocale.split("-")[0] ?? "en";
		currentLocale = locales[lang] ? lang : "en";
	} else {
		currentLocale = locales[code] ? code : "en";
	}
}

/**
 * Translate a key, optionally interpolating `{{placeholder}}` tokens.
 *
 * ```ts
 * t("notice.importedCSS", { count: 3 })
 * // → "Imported 3 callout type(s) from CSS snippets."
 * ```
 */
export function t(key: string, vars?: Record<string, string | number>): string {
	const table = locales[currentLocale] ?? en;
	let value = table[key] ?? en[key] ?? key;

	if (vars) {
		for (const [k, v] of Object.entries(vars)) {
			value = value.replace(
				new RegExp(`\\{\\{${k}\\}\\}`, "g"),
				String(v),
			);
		}
	}

	return value;
}

/** Returns the current locale code. */
export function getLocale(): string {
	return currentLocale;
}

/** Returns all registered locale codes. */
export function getAvailableLocales(): string[] {
	return Object.keys(locales);
}
