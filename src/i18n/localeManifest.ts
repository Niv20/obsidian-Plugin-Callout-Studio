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
		bytes: 53913,
		sha256: "d588a10bee10ebf7609e9874f370bf4ed3b7aa1cb11af5489f387dfec644266b",
		keys: 678,
	},
	"bg": {
		bytes: 62034,
		sha256: "8c2f1d15225575ecab0670a5ac30ebcee1856e7862955c9d1700f7aa4200c6b5",
		keys: 678,
	},
	"cs": {
		bytes: 44479,
		sha256: "816c847ce120794207c6cb9fb22dd3fa786ed90e76ffb2cdd3ac46e3573a3e99",
		keys: 678,
	},
	"da": {
		bytes: 42940,
		sha256: "09c80c972661cec72b194a65d8ae681ee57f4e289426e611bea0c3eccbccaa4a",
		keys: 678,
	},
	"de": {
		bytes: 46539,
		sha256: "015112f6dbf1e36aab867dfb0e920a8a9911007c03a4b570a0142fb5e0be6d5f",
		keys: 678,
	},
	"el": {
		bytes: 64933,
		sha256: "a109df695d95bd16e8b70374b15cf1764630b11263dd3e88a143fe3342f0793c",
		keys: 678,
	},
	"es": {
		bytes: 45587,
		sha256: "37c116f9dffd6e2d9c08f39d550492aa62812a712f9a97045fcb6502caea5737",
		keys: 678,
	},
	"fa": {
		bytes: 57248,
		sha256: "a232ab122cadd36531afeeff3c3dd4400a4a0da117f65db90c4a451f32ce48f0",
		keys: 678,
	},
	"fi": {
		bytes: 44573,
		sha256: "a412f368a17b58ca4210114ac2d0c3dcf1885d266248fec1dcd3d57c509a2c8d",
		keys: 678,
	},
	"fr": {
		bytes: 47285,
		sha256: "de68185b00c8a0a34426c21a51932e215ecbed7f4ad72369809407e8cf84870d",
		keys: 678,
	},
	"he": {
		bytes: 54021,
		sha256: "cadd486fa87088c97e5461bca6d11b68d08d0603d1065859d3226062d86e39d9",
		keys: 678,
	},
	"hi": {
		bytes: 71111,
		sha256: "18ea29375614c2472a1f34547a3def21eda345eca79163285cf7958c1e7a7b25",
		keys: 678,
	},
	"hu": {
		bytes: 47045,
		sha256: "4d40df2eaad4cdada9015fadadd6e6992d5c22ba56533dd1df0818ff3b920c0c",
		keys: 678,
	},
	"id": {
		bytes: 43505,
		sha256: "8e7cc7f7d04b4d2a4d549e94da9197ec3356c22b0816f66fc079e184f6ea9547",
		keys: 678,
	},
	"it": {
		bytes: 45176,
		sha256: "8363c53d328af752d898504ea5f960748128ab6af64ca1daf5c6f5efbde781ec",
		keys: 678,
	},
	"ja": {
		bytes: 52253,
		sha256: "7d782374c9167c727ee880e0bd468fcf0fcf5f269e8df0e13a748d2de5c2e41e",
		keys: 678,
	},
	"ko": {
		bytes: 48271,
		sha256: "e91ecdc147987e084c779e0fd53cae3196c3484650b5fe30ff7b9874e18429cf",
		keys: 678,
	},
	"ms": {
		bytes: 43443,
		sha256: "6989b139bd90cce82e90ff02149b5f772640f4fda11935312c5fedbedaa5acbb",
		keys: 678,
	},
	"nb": {
		bytes: 42975,
		sha256: "207a12f2b81dc1d8082ca0123c2884b928ef25b3bcf4137381381402c88117d7",
		keys: 678,
	},
	"nl": {
		bytes: 44929,
		sha256: "76d563958d354444a510e691345fa77637e899f3c505adf792cd8616ab78eda2",
		keys: 678,
	},
	"pl": {
		bytes: 44645,
		sha256: "2dc9002914f2c391d81719d87868384009b6fc6aea4a4ba20eeacc9f7b4a3688",
		keys: 678,
	},
	"pt": {
		bytes: 45367,
		sha256: "e82acb2d7c3fe28085471f072c06b5a67edabc2f7f266d2085d2cb44cbf68c3b",
		keys: 678,
	},
	"ro": {
		bytes: 45828,
		sha256: "fa8fb0dc33e467e6dce38cd0dfc1fae133fcb528eec02b749a80fd1911c4bf28",
		keys: 678,
	},
	"ru": {
		bytes: 61013,
		sha256: "444dd8e4ca2c861aacf5f6612c98c49c77cabdc4cb68654fa40221d96204b4f9",
		keys: 678,
	},
	"sv": {
		bytes: 43521,
		sha256: "0443033083a1cc5fc6d7176ad6bf1710ecdc4e474b30611f0f2e7a659b248549",
		keys: 678,
	},
	"th": {
		bytes: 69533,
		sha256: "be28afcfd73485d50f33d7a47cd3504bd3c04406fc1d092be4b57459e4a47da1",
		keys: 678,
	},
	"tr": {
		bytes: 44746,
		sha256: "e3d3eb7dda50ba13aaae5b5e8ee47c84704287065a13e482ef26f0544d5c4977",
		keys: 678,
	},
	"uk": {
		bytes: 60184,
		sha256: "cc0970c7d98a617121c51a9e55ee8071e1195b1ae61a7a57733f9a405001ec40",
		keys: 678,
	},
	"vi": {
		bytes: 48992,
		sha256: "db374ce13ce10217dd522eb6dcab3339f5358b8a6aa7cdabf309bd5fa4dae08a",
		keys: 678,
	},
	"zh": {
		bytes: 41515,
		sha256: "8ac255e53c4e18b03ef1d8cac63b2962b12d31d3fde3d13d1826ab0809ddb1fa",
		keys: 678,
	},
	"zhTW": {
		bytes: 41518,
		sha256: "c8b6a34a48b13a0979fb51a6afae93614822102a8cad65d3f1a80c4d5a67431a",
		keys: 678,
	},
} as const satisfies Record<string, LocaleManifestEntry>;
