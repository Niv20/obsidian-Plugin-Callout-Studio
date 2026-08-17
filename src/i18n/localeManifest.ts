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
		bytes: 51742,
		sha256: "307f5bacbc29c1a4412b8259908a6d9fc0c61aeee6dd9cd2d457ad13c0874342",
		keys: 659,
	},
	"bg": {
		bytes: 59576,
		sha256: "005ab3cd42d6dd9252aa3d502098b46fd66957449123d6d3e33bd30dfff5eeb9",
		keys: 659,
	},
	"cs": {
		bytes: 42794,
		sha256: "337a4cb56b858c6d4b75443af0c35de6196afca9c96daecabb7e06ccd8b049b6",
		keys: 659,
	},
	"da": {
		bytes: 41276,
		sha256: "90c132262191ecfe5b65442b0cebabb7c0d21c641208838227ab6e41daac4dff",
		keys: 659,
	},
	"de": {
		bytes: 44681,
		sha256: "53a45e9af4422a729d13dddc0b6ac870aa067a98f7b188ee4e6e98a0db2f85c1",
		keys: 659,
	},
	"el": {
		bytes: 62251,
		sha256: "4dd43f239e97a987c722d60cfce77d07a320bf8c4876bdea4947f9206abfcf70",
		keys: 659,
	},
	"es": {
		bytes: 43758,
		sha256: "49f5786c9b665911b9782e9f321ea7a4878f4beb145a3e2eef74247d2b481167",
		keys: 659,
	},
	"fa": {
		bytes: 54913,
		sha256: "44fce3332cd70dd64811939f8239f9e2bcbde19c4339698e61eb30a3043c3572",
		keys: 659,
	},
	"fi": {
		bytes: 42792,
		sha256: "d977d13702c61071a0ffc2de4344ba98de85ec2e92cffee7d4997b9daaa157f8",
		keys: 659,
	},
	"fr": {
		bytes: 45413,
		sha256: "3062ef7b5cfcbe2c5cf588d6c1e11267287a33b518dcf9cd8a1f62034c78452c",
		keys: 659,
	},
	"he": {
		bytes: 51982,
		sha256: "997f4a9c48714fc386c5df5b8b86e33c06c7ac25aa6263ac19c14b0be826e232",
		keys: 659,
	},
	"hi": {
		bytes: 67566,
		sha256: "524910cbc90dee46c4568a7c70275293d5d01c2e1cac14b3ba486139a541710d",
		keys: 657,
	},
	"hu": {
		bytes: 45242,
		sha256: "1cf9b50aa462198d5fc3cce092d82a0cd39a386ce12449978e4036dd193e6209",
		keys: 659,
	},
	"id": {
		bytes: 41853,
		sha256: "0ce51210b2ae277cdac36df330aa07ee5e97ae072227fc4abdc6f2d1a0bf432f",
		keys: 659,
	},
	"it": {
		bytes: 43403,
		sha256: "530c422dec4d533a92db126b95653e292ce7030a266c4b6ba54f518d46f0a5f6",
		keys: 659,
	},
	"ja": {
		bytes: 50098,
		sha256: "e2047f72ef79c9299bea9ce9a109225770f020f744ea5d0e0bb9c2305e7c22b3",
		keys: 659,
	},
	"ko": {
		bytes: 46335,
		sha256: "5d7811eacb59b22e9e02b9f42b26e219071d983a29599d6453e48fe5aa359d88",
		keys: 659,
	},
	"ms": {
		bytes: 41739,
		sha256: "86d4b854fdaa96e1efab2ace13e97d96790fb48ba12479e12e4eaa8f876fa6ad",
		keys: 659,
	},
	"nb": {
		bytes: 41329,
		sha256: "4393642399dc45339c1df9a18e6211d4e67a1f569ce2ed0bb99bad9f85d9ab8a",
		keys: 659,
	},
	"nl": {
		bytes: 42939,
		sha256: "32331a48bf9b3dafd14380c4b7d20d5f6f96618f1ed8e1bad28c066b8cd10a65",
		keys: 657,
	},
	"pl": {
		bytes: 42924,
		sha256: "5812fc2b5183f57cbe0ab02d5344ebbf2b6f7033b601de03dcb80886a921ec93",
		keys: 659,
	},
	"pt": {
		bytes: 43544,
		sha256: "927324956f6cc640fd47350a68c2e9f7f16164af10394126ed92c34ae4ef748c",
		keys: 659,
	},
	"ro": {
		bytes: 44014,
		sha256: "2bfc1f8ece3ad60df99a242d51902b2a37c64c31e6752aa70ef071a1a8ee6021",
		keys: 659,
	},
	"ru": {
		bytes: 58548,
		sha256: "aeefd33ae1aa36b70b9d3b8e2440f2ef727d986b449be6db994896b495368879",
		keys: 659,
	},
	"sv": {
		bytes: 41815,
		sha256: "263304adf4965cf79d5d99f2b5d0f04f70b52b32e240d4fc33938dfbf651c5e0",
		keys: 659,
	},
	"th": {
		bytes: 66576,
		sha256: "71b228478f5425664c5fe90bb091b934c1e684cadf0a8ec103bd20cd6d004bd9",
		keys: 659,
	},
	"tr": {
		bytes: 42973,
		sha256: "5b99cba72a8fa2a4ac0e8c16cfff948fbe63347a836105a6080de482d0fa8e58",
		keys: 659,
	},
	"uk": {
		bytes: 57758,
		sha256: "75da5bf8fc9bdacf82511454e8f8719c591e3139ed573990752f8db80b2ae6b6",
		keys: 659,
	},
	"vi": {
		bytes: 47095,
		sha256: "d5f86fe26dbda2d9fc2916c1741d8d03f782bba3b6f792d31dfdcbd7e66a50dc",
		keys: 659,
	},
	"zh": {
		bytes: 39964,
		sha256: "bb3cbd00be19dd0402d760ae025c4d35bb8ac3d51cdf85a60cfb837245af5bf9",
		keys: 659,
	},
	"zhTW": {
		bytes: 39978,
		sha256: "3dbfe5a7e15c5ad5e7f050d4484e16187ad781b9561a82c49654a962d3171434",
		keys: 659,
	},
} as const satisfies Record<string, LocaleManifestEntry>;
