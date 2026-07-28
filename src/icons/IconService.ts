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
import type { App, PluginManifest } from "obsidian";
import type { CalloutIcon, CalloutRenderRole } from "../types";
import { CALLOUT_RENDER_ROLES } from "../types";
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
		return this.resolver.hasFailed(icon, role);
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

		if (this.packs.state(pack.id) !== "ready") {
			const onDisk = await this.packs.loadFromDisk(pack.id);
			if (!onDisk) await this.packs.download(pack.id);
		}
		if (this.copyPackArtwork(icon)) {
			this.host.cssInjector.inject();
			await this.host.saveSettings();
			this.notify();
		}
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
			if (this.host.registry.findIconSvg(pack.id, icon.value, variant)) {
				continue;
			}
			const svg = pack.buildSvg(icon, role);
			if (!svg) continue;
			this.host.registry.addIconSvg({
				pack: pack.id,
				name: icon.value,
				variant,
				svg,
			});
			stored = true;
		}
		return stored;
	}
}
