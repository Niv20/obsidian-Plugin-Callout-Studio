/**
 * icons/IconService.ts — The plugin's single entry point to icon artwork.
 *
 * Two very different supply routes sit behind it:
 *
 * - `perIconRemote` (Material Symbols) fetches one drawing at a time from the
 *   vendor, because its 100,000-odd style/weight combinations rule out any bulk
 *   file. Handled by IconFetchManager.
 * - `bundledRemote` (Octicons, and the packs after it) downloads the whole
 *   pack once and then works offline. Handled by PackDataStore.
 *
 * Whichever route an icon takes, its artwork is also copied into `data.json`
 * once the user commits to it. That copy is what makes a callout render on a
 * second device that synced the settings but never downloaded the pack, and
 * what makes it survive someone deleting the pack file.
 */
import { Notice } from "obsidian";
import type { App, PluginManifest } from "obsidian";
import type { CalloutIcon, CalloutRenderRole, IconPackId } from "../types";
import { CALLOUT_RENDER_ROLES } from "../types";
import { t } from "../i18n";
import type { CalloutRegistry } from "../manager/CalloutRegistry";
import type { CSSInjector } from "../manager/CSSInjector";
import { IconFetchManager } from "./IconFetchManager";
import { PackDataStore } from "./PackDataStore";
import { createIconResolver } from "./resolver";
import { packFor } from "./registry";
import type { IconResolver } from "./types";

interface IconServiceHost {
	app: App;
	manifest: PluginManifest;
	registry: CalloutRegistry;
	cssInjector: CSSInjector;
	saveSettings(): Promise<void>;
}

export class IconService implements IconResolver {
	readonly packs: PackDataStore;
	private readonly fetch: IconFetchManager;
	private readonly resolver: IconResolver;
	private readonly listeners = new Set<() => void>();

	constructor(private readonly host: IconServiceHost) {
		this.packs = new PackDataStore(host.app, host.manifest);
		this.fetch = new IconFetchManager({
			registry: host.registry,
			cssInjector: host.cssInjector,
			saveSettings: () => host.saveSettings(),
		});
		this.resolver = createIconResolver(host.registry, (icon, role) =>
			this.fetch.hasFailed(icon, role),
		);
		// Either supply route finishing is the same event to the UI: artwork
		// that was a placeholder can now be painted.
		this.fetch.onChange(() => this.notify());
		this.packs.onChange(() => this.notify());
	}

	// ── IconResolver ────────────────────────────────────────────────────

	resolveSvg(icon: CalloutIcon, role: CalloutRenderRole): string | null {
		return this.resolver.resolveSvg(icon, role);
	}

	hasFailed(icon: CalloutIcon, role: CalloutRenderRole): boolean {
		if (this.resolver.hasFailed(icon, role)) return true;
		// A pack whose download gave up is just as permanently unavailable as a
		// per-icon fetch that did. Without this the settings list would spin
		// forever on an imported icon from a source that could not be fetched.
		return this.packs.state(icon.type) === "failed";
	}

	onChange(cb: () => void): () => void {
		this.listeners.add(cb);
		return () => {
			this.listeners.delete(cb);
		};
	}

	private notify(): void {
		for (const cb of this.listeners) {
			try {
				cb();
			} catch (e) {
				console.warn("[CalloutStudio] icon listener error", e);
			}
		}
	}

	// ── Lifecycle ───────────────────────────────────────────────────────

	/**
	 * Startup: read from disk the packs this vault actually uses, then fill in
	 * any missing per-icon artwork in the background. No pack a vault does not
	 * reference is ever read, so an unused 400 KB file costs nothing.
	 */
	async initialize(): Promise<void> {
		const used = this.host.registry.getAll().map((def) => def.icon.type);
		await this.packs.loadUsed(used);
		// Repaint: pack artwork read from disk arrives after the first inject.
		this.host.cssInjector.inject();
		await this.fetch.ensureAll();
	}

	// ── Making an icon usable ───────────────────────────────────────────

	/**
	 * Make `icon` renderable and keep it that way, downloading if needed.
	 * Called when the user confirms a choice in the picker and again on save.
	 */
	async ensureArtwork(icon: CalloutIcon): Promise<void> {
		const pack = packFor(icon);
		if (!pack) return;

		if (pack.kind === "perIconRemote") {
			await this.fetch.cacheOne(icon);
			return;
		}
		if (pack.kind !== "bundledRemote") return;

		// Only the file this icon's own style lives in — picking one Font Awesome
		// Brands icon must not pull down Solid and Regular as well.
		if (this.packs.state(icon.type) !== "ready") {
			const onDisk = await this.packs.loadFromDisk(icon.type);
			if (!onDisk) await this.packs.download(icon.type);
		}
		if (this.copyPackArtwork(icon)) {
			this.host.cssInjector.inject();
			await this.host.saveSettings();
			this.notify();
		}
	}

	/**
	 * Make a whole batch of icons renderable, downloading whatever is missing.
	 *
	 * Two situations need this, and they are the same situation: a callout has
	 * arrived from somewhere other than the picker — an import, or the vault
	 * itself on startup — carrying an icon whose artwork this device may not
	 * have. `ensureArtwork` handles one icon; this handles a set without
	 * downloading the same pack once per icon.
	 *
	 * Icons already drawable are skipped entirely, which is what keeps a second
	 * device that synced `data.json` from re-downloading packs it never needed.
	 */
	async ensureArtworkFor(icons: readonly CalloutIcon[]): Promise<void> {
		const pending = icons.filter((icon) => !this.isFullyCached(icon));
		if (pending.length === 0) return;

		// One entry per icon type, so Font Awesome Brands and Solid are two
		// downloads while twenty Brands icons are one.
		const byType = new Map<IconPackId, CalloutIcon[]>();
		for (const icon of pending) {
			const group = byType.get(icon.type);
			if (group) group.push(icon);
			else byType.set(icon.type, [icon]);
		}

		const restored = new Set<string>();
		for (const group of byType.values()) {
			// Sequential: parallel requests to one CDN gain nothing and make a
			// failure harder to attribute. The first icon pulls the pack down,
			// the rest then only copy artwork out of it.
			for (const icon of group) {
				await this.ensureArtwork(icon);
			}
			const first = group[0];
			if (!first || !group.every((icon) => this.isFullyCached(icon))) {
				continue;
			}
			const title = packFor(first)?.attribution.title;
			if (title) restored.add(title);
		}

		// Say what was fetched, once for the batch. Anything that failed has
		// already announced itself — a per-icon Notice from the fetch manager,
		// or an error icon on the row via `hasFailed`.
		if (restored.size > 0) {
			new Notice(
				t("iconPack.artworkRestored", {
					names: [...restored].join(", "),
				}),
			);
		}
	}

	/**
	 * Whether every drawing this icon could need is already in `data.json`.
	 *
	 * All roles, not just the one on screen: `copyPackArtwork` stores them all,
	 * so anything short of that means the pack is still needed — to fill in the
	 * heading bar or inline pill the user may enable later.
	 */
	private isFullyCached(icon: CalloutIcon): boolean {
		const pack = packFor(icon);
		if (!pack) return true;
		// Lucide and emoji carry no artwork of their own to be missing.
		if (pack.kind === "builtin" || pack.kind === "glyph") return true;
		return CALLOUT_RENDER_ROLES.every((role) =>
			this.host.registry.findIconSvg(
				icon.type,
				icon.value,
				pack.cacheVariant(icon, role),
			),
		);
	}

	/**
	 * Copy this icon's drawings out of the pack and into `data.json`.
	 *
	 * Every render role is copied, not just the one on screen: a pack can draw
	 * the same icon differently per surface (Octicons' 16px and 24px art), and
	 * enabling inline pills later must not require the pack to still be around.
	 * Two roles that share a drawing collapse to one entry via the cache key.
	 */
	private copyPackArtwork(icon: CalloutIcon): boolean {
		const pack = packFor(icon);
		if (!pack?.buildSvg) return false;

		let stored = false;
		for (const role of CALLOUT_RENDER_ROLES) {
			const variant = pack.cacheVariant(icon, role);
			if (this.host.registry.findIconSvg(icon.type, icon.value, variant)) {
				continue;
			}
			const svg = pack.buildSvg(icon, role);
			if (!svg) continue;
			this.host.registry.addIconSvg({
				pack: icon.type,
				name: icon.value,
				variant,
				svg,
			});
			stored = true;
		}
		return stored;
	}
}
