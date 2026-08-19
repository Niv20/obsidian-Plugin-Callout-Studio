/**
 * i18n/localeManifest.ts — GENERATED FILE, do not edit.
 *
 * What each downloadable locale file should contain, baked into the build by
 * scripts/generate-locales.mjs. Regenerate with `npm run i18n:generate`; the
 * build does it for you, and CI fails if the result differs from what is
 * committed.
 *
 * Knowing the exact bytes and SHA-256 up front is what makes the download safe
 * to justify — a mis-served or tampered response cannot be accepted — and it
 * doubles as the staleness signal: a cached file whose hash no longer matches
 * this table is one an older version of the plugin downloaded.
 */

/** The on-disk locale format this build understands. */
export const LOCALE_FORMAT = 1;

/** A locale file's id, which is its source module name (`zhTW`, not `zh-tw`). */
export type LocaleFileId = keyof typeof LOCALE_MANIFEST;

export interface LocaleManifestEntry {
	/** Exact size of the JSON file, as a cheap gate before hashing. */
	bytes: number;
	/** SHA-256 of the file's bytes, verified before anything is registered. */
	sha256: string;
	/** How many strings it holds. Diagnostics only. */
	keys: number;
}

export const LOCALE_MANIFEST = {
	"ar": {
		bytes: 55293,
		sha256: "109a60ff9a389a77c4fc19c130f0cb5e085e80a3ebd99d06b047682aeb39bd29",
		keys: 699,
	},
	"bg": {
		bytes: 63630,
		sha256: "edfbb7630bea33821e2043e326351820c3d5a421d073cacbd0acd4b6c5560bac",
		keys: 699,
	},
	"cs": {
		bytes: 45663,
		sha256: "e0eb91582b2de8e1de3827108f190bed3c903964878a81116854e6f4f0a2e50b",
		keys: 699,
	},
	"da": {
		bytes: 44073,
		sha256: "030c182093bb3c194e7090ae26837caef1ad179f215b698a4dd247580743351d",
		keys: 699,
	},
	"de": {
		bytes: 47724,
		sha256: "911b5b4c025a77e02421ac84bdd2d2641f17ab4a2fd17195f63a7d0abb581626",
		keys: 699,
	},
	"el": {
		bytes: 66550,
		sha256: "94b68d2b858f96323e280c55f01f125d594a6accc84e3d0eb792cb2f53035ca6",
		keys: 699,
	},
	"es": {
		bytes: 46766,
		sha256: "060ae76690ab214db5326f40329d86b3a96960c9790bff08f3d16904c8f663fb",
		keys: 699,
	},
	"fa": {
		bytes: 58660,
		sha256: "bb4c9eaf4cb707659ade6ea987999ac22ff2dc8c3b104e0876314362ac34865f",
		keys: 699,
	},
	"fi": {
		bytes: 45756,
		sha256: "9f8a1df6e1f98b88e1a315b8e067b8d0ba007d615f2d752a1c8d5fbd794c1cab",
		keys: 699,
	},
	"fr": {
		bytes: 48469,
		sha256: "b7e5de573f09b144131e87910c62dbcfbdba1ea291d69fbdffdd02bff81f6e1c",
		keys: 699,
	},
	"he": {
		bytes: 55442,
		sha256: "a3b037312b11f8d472e1e7538d0746921f6dbb017dd8e57994511a51f7676562",
		keys: 699,
	},
	"hi": {
		bytes: 72897,
		sha256: "ceae999ed93592cd87b5160d2c3be7bf513dd24b70545d605902ed1b61f4c751",
		keys: 699,
	},
	"hu": {
		bytes: 48257,
		sha256: "bdfcc8f49608e3da19f823bbac1230bbd497f946c0c3747cee21faea1e2ba925",
		keys: 699,
	},
	"id": {
		bytes: 44635,
		sha256: "29a07cd16afa30268cc822c57f6cda18d6cecc7ae1bdc53374ac1509ee569943",
		keys: 699,
	},
	"it": {
		bytes: 46358,
		sha256: "7a768b2763a138d565fa307e63453fb0b76ccf203b46e59bed7c940ad27e1861",
		keys: 699,
	},
	"ja": {
		bytes: 53558,
		sha256: "3476bd0283739e99944dc48be907907b8c2e5d9693fbbe93f2e774bb206986c6",
		keys: 699,
	},
	"ko": {
		bytes: 49467,
		sha256: "34faa113b1b0baa37ba4630e8a8642298789a883712cab894da873517883c915",
		keys: 699,
	},
	"ms": {
		bytes: 44577,
		sha256: "6c7990cd997ea7709e91b1a412bfa0f2fc8833c156ee6b13a7b42cfb89d5cd88",
		keys: 699,
	},
	"nb": {
		bytes: 44108,
		sha256: "f46776522ebff0309ba265272454ca409fc54134f21a6a10cefd6b8fed0abb7c",
		keys: 699,
	},
	"nl": {
		bytes: 46066,
		sha256: "2b2a7d563250fdf9e0e12976d47a2638073235ac36b3f3c87eb639747f9af71b",
		keys: 699,
	},
	"pl": {
		bytes: 45815,
		sha256: "8387c9ea7b572b281b1e1580a0aa24f0987e6bf417a0f36c5d4fe934e21047da",
		keys: 699,
	},
	"pt": {
		bytes: 46538,
		sha256: "38820ec732d0dd6c886a2a2e886dd5996ec5e13440298ff296149793b93ae043",
		keys: 699,
	},
	"ro": {
		bytes: 46993,
		sha256: "42950ff5a9f42576547d045b15f092ddcc665b0ac446f040ab9bca2e10a4a127",
		keys: 699,
	},
	"ru": {
		bytes: 62552,
		sha256: "a586d287bf823079626698d6d0dc833e5702914a7a0ac2327393463a5ab6a396",
		keys: 699,
	},
	"sv": {
		bytes: 44628,
		sha256: "221152c10945d902daf25079a1b219ecd912ad9ce61810ad47d6f98f4c84d8c9",
		keys: 699,
	},
	"th": {
		bytes: 71340,
		sha256: "cc1fd221c3716b246a3da392788c100c21431f846ea3816dd4e6e133b2242885",
		keys: 699,
	},
	"tr": {
		bytes: 45911,
		sha256: "f8b5e995264641b409c8ad15aec096485b8e7e3d4523fcbe622342b2ab30889c",
		keys: 699,
	},
	"uk": {
		bytes: 61689,
		sha256: "ed37a18d2e4d487f19a715d9c29ea00723fa3339a0578f6d84447a321dbc00b3",
		keys: 699,
	},
	"vi": {
		bytes: 50234,
		sha256: "900714fcf96344d60328f1611146e4982c29516818030ec6c050b7c4c33cfb36",
		keys: 699,
	},
	"zh": {
		bytes: 42614,
		sha256: "e73c80be6f12c618e27d08c7c3981af8bdfa90d0c93a5ebff0368b9d1178b1a5",
		keys: 699,
	},
	"zhTW": {
		bytes: 42614,
		sha256: "f37216c10cc2710069ab162722b0c97af538459955794012523fb6cd0daff76c",
		keys: 699,
	},
} as const satisfies Record<string, LocaleManifestEntry>;
