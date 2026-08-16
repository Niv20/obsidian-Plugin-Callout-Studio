/**
 * tests/support/decorations.ts — typed readers for `Decoration.spec`.
 *
 * CodeMirror types `spec` as `any` (it is whatever the decoration's author put
 * there), so every assertion about a decoration would otherwise be an unchecked
 * member access on `any`. These four helpers name the shapes this project's
 * decorations actually use — a line decoration's attributes, a replace/widget
 * decoration's widget and side, a mark decoration's class — so the suites can
 * read them without opting out of type checking one property at a time.
 */
import type { Decoration } from "@codemirror/view";

/** `attributes` of a `Decoration.line`, or `{}` for anything else. */
export function lineAttrs(deco: Decoration): Record<string, string> {
	return (deco.spec as { attributes?: Record<string, string> }).attributes ?? {};
}

/** The widget of a `Decoration.replace`/`Decoration.widget`, if it carries one. */
export function widgetOf(deco: Decoration): unknown {
	return (deco.spec as { widget?: unknown }).widget;
}

/** `class` of a `Decoration.mark`, or "" for anything else. */
export function markClass(deco: Decoration): string {
	return (deco.spec as { class?: string }).class ?? "";
}

/** The `side` / `block` a widget decoration was declared with. */
export function widgetPlacement(deco: Decoration): {
	side?: number;
	block?: boolean;
} {
	const spec = deco.spec as { side?: number; block?: boolean };
	return { side: spec.side, block: spec.block };
}
