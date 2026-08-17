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
		bytes: 53881,
		sha256: "44b09ee4593b73477934a44663a8485b1d8645b217664f960918135e791a6157",
		keys: 678,
	},
	"bg": {
		bytes: 61998,
		sha256: "91afe7772769ce3be0cddbf7dc2f0e58e520b535e83362216ed0f74b38559bf6",
		keys: 678,
	},
	"cs": {
		bytes: 44445,
		sha256: "fa540013c95441782dcf8249801499c467a108e0d3e699adc291966c01db7116",
		keys: 678,
	},
	"da": {
		bytes: 42908,
		sha256: "414fbc24c381f62a26a83902fd6e951c84395826aab471f5e16729fc65ed1545",
		keys: 678,
	},
	"de": {
		bytes: 46507,
		sha256: "0caa2d7f91221efb9e4b45b61b6beecd4997b5bb9ba1b03d6eac29b7d68f464d",
		keys: 678,
	},
	"el": {
		bytes: 64870,
		sha256: "a786244797bfc6d60a51d3b826a69ee7bde0bab72889c5acf352794c3fc59bf2",
		keys: 678,
	},
	"es": {
		bytes: 45557,
		sha256: "71155bd7f4af941ee7931ef0094fa771ffe15f41830d9790537af6085fa12905",
		keys: 678,
	},
	"fa": {
		bytes: 57208,
		sha256: "73e9ed60031d8a3ab70d7b80559344b0a40318b1cf591e9cc6d67448dd90f5a0",
		keys: 678,
	},
	"fi": {
		bytes: 44533,
		sha256: "f1fd80c8f85d4f02a7417b1a4ee03ef07b71c32ce7ddf799f87e93745cc83d1d",
		keys: 678,
	},
	"fr": {
		bytes: 47264,
		sha256: "410e0733d7d34c264b900a29df699f61440e8088076640ad7f0b8c5862ee9412",
		keys: 678,
	},
	"he": {
		bytes: 53992,
		sha256: "3e39d69c5356accabb7f2f07bddee9d50bf42e25c3938bd20802a74713275855",
		keys: 678,
	},
	"hi": {
		bytes: 70648,
		sha256: "f8c57557dc68b4bc2346bfe092b83cfa04f67954ac783c7b2648b6a4a6baac90",
		keys: 676,
	},
	"hu": {
		bytes: 47006,
		sha256: "3b177ef103b4621a92dc257da62947b69532e98b48f688a8e84a774800d3783b",
		keys: 678,
	},
	"id": {
		bytes: 43475,
		sha256: "cde4d96a5ad11321ec7e5f17743cd1cbb0f4498305486275f112a372bf5e0bfa",
		keys: 678,
	},
	"it": {
		bytes: 45138,
		sha256: "3b7070b986f0935a750ff3ac70097712391ca7121023419d317dda2213f7d803",
		keys: 678,
	},
	"ja": {
		bytes: 52217,
		sha256: "c9a40eb4adbedba7d08fed173982ba8c1b954a3b56cadd07dae1c254f620a1fd",
		keys: 678,
	},
	"ko": {
		bytes: 48251,
		sha256: "fc1918fa0f21cf451d2ff85b46f231f2dd89ca41410e1cd4c0abc9afdcf4961a",
		keys: 678,
	},
	"ms": {
		bytes: 43415,
		sha256: "2e47c0849f4662fcd68d437083c51719b3808b147ea2993a59847ccc4a090c43",
		keys: 678,
	},
	"nb": {
		bytes: 42947,
		sha256: "9fa97eb9498bfcfd9a866e92efe0dca866161a4cf371699a04ebea9828173a1a",
		keys: 678,
	},
	"nl": {
		bytes: 44668,
		sha256: "75676574438d747bba39ca92c8fec11866c2b63e67a951519af2c1ced0f1a7b6",
		keys: 676,
	},
	"pl": {
		bytes: 44608,
		sha256: "c44a12ed519d28a6e0739ef38366bf79de2301c5b481fdc65d712533c76bf954",
		keys: 678,
	},
	"pt": {
		bytes: 45336,
		sha256: "a032224e8800c6c12845d04a4ac10ba8aba634c751ad661aa54718df011234ee",
		keys: 678,
	},
	"ro": {
		bytes: 45799,
		sha256: "fc71bc9275a84b96970353e164593599f847425e04d7d16ccc5c1e7c5c64621c",
		keys: 678,
	},
	"ru": {
		bytes: 60945,
		sha256: "ba0963ed4aa2869aeac2f8ea3874bfe5cbb5b8f57d43d85f04f3d032ae45af0b",
		keys: 678,
	},
	"sv": {
		bytes: 43493,
		sha256: "0c34a3b54ff16b9d13af08bf21b20c88e9781c0ece99aee4f2eb9ebb6c43286e",
		keys: 678,
	},
	"th": {
		bytes: 69419,
		sha256: "1c3062f0729d3a62c0042be3ab4afe1f2fc5ce535434315cee0aed9fced794c4",
		keys: 678,
	},
	"tr": {
		bytes: 44720,
		sha256: "46b9ed025626213cb4bfe9d03d89b917d43e9338d8016fd64ae5afa5ba92d401",
		keys: 678,
	},
	"uk": {
		bytes: 60116,
		sha256: "505e33d8a5e135aeab94af0a8f5d619341e2533ca718ae659850584798758ba7",
		keys: 678,
	},
	"vi": {
		bytes: 48944,
		sha256: "ff1aefe4af6a0ea5869266d91f79a615b9f7957c5a7ce3db91b1b784d033a807",
		keys: 678,
	},
	"zh": {
		bytes: 41486,
		sha256: "205aa59a1fdbd0f1b7c1ec6e78faf8626e5122e269571af29c002de840149cb3",
		keys: 678,
	},
	"zhTW": {
		bytes: 41492,
		sha256: "c00c38ab02aadf5c8dc71f6d59014fbc8352c8767a304f0b971263987102baf3",
		keys: 678,
	},
} as const satisfies Record<string, LocaleManifestEntry>;
