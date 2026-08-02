/**
 * icons/describeIcon.ts — One human-readable summary of a chosen icon.
 *
 * Shared so the picker's footer and the editor's Icon row cannot drift into
 * describing the same selection two different ways.
 */
import type { CalloutIcon, UserImageIcon } from "../types";
import { packFor } from "./registry";
import { MATERIAL_DEFAULT_STYLE, MATERIAL_DEFAULT_WEIGHT } from "./packs/material";
import { faStyleOf } from "./packs/fontAwesome";
import { emojiLabelFor } from "./packs/emoji";
import { t } from "../i18n";

export function describeIcon(
	icon: CalloutIcon,
	userImages: readonly UserImageIcon[],
): string {
	const pack = packFor(icon);
	const source = pack ? t(pack.labelKey) : icon.type;
	if (icon.type === "material") {
		return (
			`${source}: ${icon.value} ` +
			`(${icon.style ?? MATERIAL_DEFAULT_STYLE}, ${icon.weight ?? MATERIAL_DEFAULT_WEIGHT})`
		);
	}
	if (icon.type === "image") {
		const image = userImages.find((img) => img.id === icon.value);
		return `${source}: ${image?.name ?? icon.value}`;
	}
	if (icon.type === "emoji") {
		return `${source}: ${emojiLabelFor(icon.value) ?? icon.value}`;
	}
	// Font Awesome's three styles share one source, so the name alone would not
	// say which drawing is about to be saved.
	const faStyle = faStyleOf(icon);
	if (faStyle) return `${source}: ${icon.value} (${faStyle})`;
	return `${source}: ${icon.value}`;
}
