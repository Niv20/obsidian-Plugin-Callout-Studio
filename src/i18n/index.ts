/**
 * i18n/index.ts — Internationalization system.
 *
 * Manages the active locale and provides the `t(key, params?)` translation
 * function used everywhere in the plugin. Supports runtime locale registration
 * and auto-detection from Obsidian's moment.locale(). Falls back to English
 * when a key is missing in the active locale.
 */
import { en } from "./en";
import { he } from "./he";
import { zh } from "./zh";
import { zhTW } from "./zhTW";
import { es } from "./es";
import { pt } from "./pt";
import { fr } from "./fr";
import { de } from "./de";
import { ru } from "./ru";
import { ja } from "./ja";
import { ko } from "./ko";
import { it } from "./it";
import { tr } from "./tr";
import { nl } from "./nl";
import { pl } from "./pl";
import { uk } from "./uk";
import { id } from "./id";
import { sv } from "./sv";
import { ar } from "./ar";
import { hi } from "./hi";
import { cs } from "./cs";
import { ro } from "./ro";
import { vi } from "./vi";
import { th } from "./th";
import { fa } from "./fa";
import { hu } from "./hu";
import { da } from "./da";
import { nb } from "./nb";
import { el } from "./el";
import { bg } from "./bg";
import { ms } from "./ms";
import { fi } from "./fi";

export type LocaleKey = keyof typeof en;

const locales: Record<string, Record<string, string>> = {
	en,
	he,
	zh,
	"zh-tw": zhTW,
	"zh-hk": zhTW,
	"zh-sg": zh,
	es,
	pt,
	fr,
	de,
	ru,
	ja,
	ko,
	it,
	tr,
	nl,
	pl,
	uk,
	id,
	sv,
	ar,
	hi,
	cs,
	ro,
	vi,
	th,
	fa,
	hu,
	da,
	nb,
	no: nb,
	el,
	bg,
	ms,
	fi,
};

/**
 * Native display names for every selectable locale, keyed by the canonical
 * locale code. Each value is written in its own language so the language
 * picker reads naturally (e.g. "עברית", not "Hebrew"). Order here is the
 * order shown in the settings dropdown.
 */
const localeNames: Record<string, string> = {
	en: "English",
	he: "עברית",
	zh: "简体中文",
	"zh-tw": "繁體中文",
	es: "Español",
	pt: "Português",
	fr: "Français",
	de: "Deutsch",
	ru: "Русский",
	ja: "日本語",
	ko: "한국어",
	it: "Italiano",
	tr: "Türkçe",
	nl: "Nederlands",
	pl: "Polski",
	uk: "Українська",
	id: "Bahasa Indonesia",
	sv: "Svenska",
	ar: "العربية",
	hi: "हिन्दी",
	cs: "Čeština",
	ro: "Română",
	vi: "Tiếng Việt",
	th: "ไทย",
	fa: "فارسی",
	hu: "Magyar",
	da: "Dansk",
	nb: "Norsk bokmål",
	el: "Ελληνικά",
	bg: "Български",
	ms: "Bahasa Melayu",
	fi: "Suomi",
};

let currentLocale = "en";

/**
 * Register an additional locale at runtime.
 * Call this before `setLocale` to make the locale available.
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
 * Checks full locale (e.g. "zh-tw") before language prefix (e.g. "zh").
 */
type MomentLike = { locale: () => string };
type WindowWithMoment = Window & { moment?: MomentLike };

export function setLocale(code: string): void {
	if (code === "auto") {
		const obsidianLocale =
			(window as WindowWithMoment).moment?.locale() ?? "en";
		const lower = obsidianLocale.toLowerCase();
		if (locales[lower]) {
			currentLocale = lower;
		} else {
			const lang = lower.split("-")[0] ?? "en";
			currentLocale = locales[lang] ? lang : "en";
		}
	} else {
		const lower = code.toLowerCase();
		if (locales[lower]) {
			currentLocale = lower;
		} else {
			const lang = lower.split("-")[0] ?? "en";
			currentLocale = locales[lang] ? lang : "en";
		}
	}
}

/**
 * Translate a key, optionally interpolating `{{placeholder}}` tokens.
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

/**
 * Returns the locales offered in the language picker, each with its own
 * native display name, in the order they should appear in the dropdown.
 */
export function getSelectableLocales(): { code: string; name: string }[] {
	return Object.entries(localeNames).map(([code, name]) => ({ code, name }));
}
