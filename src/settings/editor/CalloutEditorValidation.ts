/**
 * settings/editor/CalloutEditorValidation.ts — Validation helpers for the callout editor.
 *
 * Pure functions that check whether the current editor state is valid:
 * ID availability, alias conflicts, and whether saving would overwrite an
 * auto-generated fallback row. Also builds a state snapshot string used to
 * detect unsaved changes. Used exclusively by CalloutEditor.ts.
 */
import type { CalloutDefinition } from "../../types";

type ValidationLookup = {
	getById: (id: string) => CalloutDefinition | undefined;
	findByAlias: (id: string) => CalloutDefinition | undefined;
};

type ValidationBaseInput = ValidationLookup & {
	createFromAutocomplete: boolean;
	existingId: string | null;
};

export type ValidationStateInput = ValidationBaseInput & {
	isBuiltIn: boolean;
	displayName: string;
	calloutId: string;
	aliases: string[];
};

export type SnapshotInput = {
	displayName: string;
	calloutId: string;
	icon: unknown;
	colorLight: string;
	colorDark: string;
	bgColorLight: string;
	bgColorDark: string;
	textColorLight: string;
	textColorDark: string;
	foldable: boolean;
	defaultFolded: boolean;
	iconOffsetX: number;
	iconOffsetY: number;
	iconSize: number;
	aliases: string[];
};

export function buildStateSnapshot(input: SnapshotInput): string {
	return JSON.stringify(input);
}

export function hasStateChanges(
	initialSnapshot: string,
	currentSnapshot: string,
): boolean {
	return currentSnapshot !== initialSnapshot;
}

export function shouldSaveNewAutocompleteCalloutAsFallback(
	input: ValidationBaseInput & { hasStyleChanges: boolean },
): boolean {
	return (
		input.createFromAutocomplete &&
		input.existingId === null &&
		!input.hasStyleChanges
	);
}

export function isOverwritingAutoFallbackRow(
	input: ValidationBaseInput & { id: string },
): boolean {
	if (!input.createFromAutocomplete) return false;
	if (input.existingId !== null) return false;
	if (!input.id) return false;
	const existing = input.getById(input.id);
	if (!existing) return false;
	return existing.source === "fallback" && existing.customized !== true;
}

export function canUseCalloutId(
	input: ValidationBaseInput & { id: string; role: "primary" | "alias" },
): boolean {
	if (!input.id) return false;
	const existing = input.getById(input.id);
	const allowedPlaceholder =
		input.role === "primary" && isOverwritingAutoFallbackRow(input);
	if (existing && existing.id !== input.existingId && !allowedPlaceholder) {
		return false;
	}

	const aliasOwner = input.findByAlias(input.id);
	if (aliasOwner && aliasOwner.id !== input.existingId) return false;
	return true;
}

export function isStateValid(input: ValidationStateInput): boolean {
	if (!input.calloutId) return false;
	const requireDisplayName =
		!input.createFromAutocomplete || input.existingId !== null;
	if (!input.isBuiltIn && requireDisplayName && !input.displayName.trim()) {
		return false;
	}
	if (!canUseCalloutId({ ...input, id: input.calloutId, role: "primary" })) {
		return false;
	}
	for (const alias of input.aliases) {
		if (!canUseCalloutId({ ...input, id: alias, role: "alias" })) {
			return false;
		}
	}
	return true;
}
