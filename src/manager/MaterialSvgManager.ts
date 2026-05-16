/**
 * manager/MaterialSvgManager.ts — Downloads and caches Material Symbols SVGs.
 *
 * Fetches SVG files for Material icon callouts on demand, stores them in the
 * registry's materialSvgCache (persisted to data.json), and notifies UI
 * listeners when a download completes or permanently fails. Prevents duplicate
 * requests and surfaces errors without crashing the plugin.
 * Depends on CSSInjector (to re-inject CSS after a new SVG arrives) and
 * iconLoader (for the actual network request).
 */
import { Notice } from "obsidian";
import type { CalloutIcon, MaterialIconStyle } from "../types";
import type { CalloutRegistry } from "./CalloutRegistry";
import type { CSSInjector } from "./CSSInjector";
import { downloadMaterialSvg } from "../utils/iconLoader";
import { t } from "../i18n";

interface MaterialSvgHost {
	registry: CalloutRegistry;
	cssInjector: CSSInjector;
	saveSettings(): Promise<void>;
}

/**
 * Manages download, retry, and caching of Material Symbols SVGs along with
 * listener notifications so the UI can react to cache updates.
 */
export class MaterialSvgManager {
	/** In-memory record of Material SVGs that failed to download after retries */
	readonly failed: Set<string> = new Set();
	/** Listeners notified when a Material SVG download finishes (success or failure). */
	private readonly listeners: Set<() => void> = new Set();

	constructor(private readonly host: MaterialSvgHost) {}

	/** Subscribe to Material SVG cache updates. Returns an unsubscribe function. */
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
				console.warn("[CalloutStudio] material svg listener error", e);
			}
		}
	}

	/** Returns true when a Material SVG download has permanently failed (after retries). */
	hasFailed(name: string, style: MaterialIconStyle, weight: number): boolean {
		return this.failed.has(`${name}|${style}|${weight}`);
	}

	/**
	 * Downloads an individual Material SVG for a callout icon and caches it.
	 */
	async cacheOne(icon: CalloutIcon): Promise<void> {
		if (icon.type !== "material") return;
		const style = icon.style ?? "outlined";
		const weight = icon.weight ?? 400;
		// Skip if already cached
		if (this.host.registry.findMaterialSvg(icon.value, style, weight))
			return;
		const failKey = `${icon.value}|${style}|${weight}`;
		// Retry up to 3 times with a 2s gap between attempts
		const maxAttempts = 3;
		let lastErr: unknown;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const svg = await downloadMaterialSvg(
					icon.value,
					style,
					weight,
				);
				this.host.registry.addMaterialSvg({
					name: icon.value,
					style,
					weight,
					svg,
				});
				this.failed.delete(failKey);
				// Note: do NOT call cleanupUnusedMaterialSvgs() here.
				// The icon may have just been chosen in the picker and not yet
				// attached to a callout in the registry — cleanup would
				// immediately delete the SVG we just downloaded. Cleanup runs
				// at proper save points (CalloutEditor save, SettingsTab).
				this.host.cssInjector.inject();
				await this.host.saveSettings();
				this.notify();
				return;
			} catch (err) {
				lastErr = err;
				if (attempt < maxAttempts) {
					await new Promise((r) =>
						activeWindow.setTimeout(r, 2000),
					);
				}
			}
		}
		this.failed.add(failKey);
		new Notice(t("notice.iconDownloadFailed", { name: icon.value }));
		this.notify();
		console.warn(
			"Callout Studio: failed to download Material SVG after retries",
			lastErr,
		);
	}

	/**
	 * Ensures all callouts using Material icons have a cached SVG.
	 * Runs in background on plugin load.
	 */
	async ensureAll(): Promise<void> {
		const callouts = this.host.registry.getAll();
		const missing = callouts.filter((def) => {
			if (def.icon.type !== "material") return false;
			return !this.host.registry.findMaterialSvg(
				def.icon.value,
				def.icon.style ?? "outlined",
				def.icon.weight ?? 400,
			);
		});

		if (missing.length === 0) return;

		let downloaded = 0;
		for (const def of missing) {
			try {
				const svg = await downloadMaterialSvg(
					def.icon.value,
					def.icon.style ?? "outlined",
					def.icon.weight ?? 400,
				);
				this.host.registry.addMaterialSvg({
					name: def.icon.value,
					style: def.icon.style ?? "outlined",
					weight: def.icon.weight ?? 400,
					svg,
				});
				downloaded++;
			} catch {
				// Silently skip failures — will retry next load
			}
		}

		if (downloaded > 0) {
			this.host.cssInjector.inject();
			await this.host.saveSettings();
			this.notify();
		}
	}
}
