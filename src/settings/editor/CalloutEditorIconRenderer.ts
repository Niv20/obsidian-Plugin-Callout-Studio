import { setIcon } from "obsidian";
import type { CalloutIcon } from "../../types";
import type { CalloutEditorPlugin } from "./types";

export function renderCalloutEditorIconPreview(
	plugin: CalloutEditorPlugin,
	icon: CalloutIcon,
	container: HTMLElement,
): void {
	container.empty();
	container.removeClass("is-loading");
	container.removeClass("is-error");
	switch (icon.type) {
		case "lucide":
			try {
				setIcon(container, icon.value);
			} catch {
				container.textContent = "?";
			}
			break;
		case "material": {
			const cached = plugin.registry.findMaterialSvg(
				icon.value,
				icon.style ?? "outlined",
				icon.weight ?? 400,
			);
			if (cached) {
				const parser = new DOMParser();
				const doc = parser.parseFromString(cached.svg, "image/svg+xml");
				const svgEl = doc.documentElement;
				svgEl.setAttribute("fill", "currentColor");
				container.appendChild(container.doc.importNode(svgEl, true));
			} else {
				const failed = plugin.hasMaterialSvgFailed(
					icon.value,
					icon.style ?? "outlined",
					icon.weight ?? 400,
				);
				if (failed) {
					setIcon(container, "circle-help");
					container.addClass("is-error");
				} else {
					setIcon(container, "loader-2");
					container.addClass("is-loading");
				}
			}
			break;
		}
		case "emoji":
			container.textContent = icon.value;
			break;
	}
}
