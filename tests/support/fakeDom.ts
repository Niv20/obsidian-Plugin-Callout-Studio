/**
 * tests/support/fakeDom.ts — the smallest DOM the editor surfaces can be
 * exercised against.
 *
 * Four of the modules under test are DOM producers or DOM readers and nothing
 * else: `renderShared.buildCalloutTokenDom` builds token DOM, `resolve.ts`
 * walks up from a right-clicked element, `LinkSuggestDecorator` rewrites a
 * rendered suggestion in place, and `AutoComplete.renderSuggestion` paints a
 * dropdown row. Node has no DOM at all, so nothing here is *replacing*
 * anything — this is the only document that code ever sees in a test.
 *
 * It is deliberately not jsdom. Everything below is reachable from what the
 * code under test actually calls:
 *
 * - tree + attributes + classes, and Obsidian's own element helpers
 *   (`createDiv`/`createSpan`/`appendText`/`addClass`/`empty`), which are
 *   `obsidian.d.ts` augmentations of `HTMLElement` and therefore just methods;
 * - `closest` / `matches` / `querySelector`, over a selector grammar that is a
 *   comma-separated list of *compound* selectors (`tag`, `.class`, `[attr]`,
 *   `[attr="v"]`). No combinators — the production selectors never use one, and
 *   supporting them would be inventing coverage for code that does not exist;
 * - `HTMLElement`, `Node`, `MouseEvent` and `KeyboardEvent` as globals, because
 *   `instanceof` against each of them is a live branch in the code under test.
 *
 * Layout, measurement, events and CSS cascade are all absent, and no test may
 * assert on them.
 */

/* -------------------------------------------------------------------------- */
/* Nodes                                                                      */
/* -------------------------------------------------------------------------- */

export const NODE_ELEMENT = 1;
export const NODE_TEXT = 3;

export class FakeText {
	readonly nodeType = NODE_TEXT;
	parentElement: FakeElement | null = null;

	constructor(public nodeValue: string) {}

	get textContent(): string {
		return this.nodeValue;
	}
}

export type FakeNode = FakeElement | FakeText;

class FakeClassList {
	private readonly names = new Set<string>();

	add(...classes: string[]): void {
		for (const cls of classes) if (cls) this.names.add(cls);
	}

	remove(...classes: string[]): void {
		for (const cls of classes) this.names.delete(cls);
	}

	contains(cls: string): boolean {
		return this.names.has(cls);
	}

	toggle(cls: string, force?: boolean): boolean {
		const on = force ?? !this.names.has(cls);
		if (on) this.names.add(cls);
		else this.names.delete(cls);
		return on;
	}

	get value(): string {
		return [...this.names].join(" ");
	}

	/** The classes in insertion order — what assertions read. */
	toArray(): string[] {
		return [...this.names];
	}
}

/** A `style` object supporting both property access and the CSSOM methods. */
type FakeStyle = Record<string, unknown> & {
	getPropertyValue(name: string): string;
	setProperty(name: string, value: string): void;
};

function createStyle(custom: Map<string, string>): FakeStyle {
	const style = {
		getPropertyValue: (name: string) => custom.get(name) ?? "",
		setProperty: (name: string, value: string) => void custom.set(name, value),
	};
	return style as FakeStyle;
}

/** Options accepted by Obsidian's `createEl` / `createDiv` / `createSpan`. */
export interface ElOptions {
	cls?: string | string[];
	text?: string;
	attr?: Record<string, string>;
	href?: string;
	type?: string;
	title?: string;
}

export class FakeElement {
	readonly nodeType = NODE_ELEMENT;
	readonly tagName: string;
	readonly classList = new FakeClassList();
	/** Custom properties behind {@link style} and {@link setCssProp}. */
	private readonly cssProps = new Map<string, string>();
	readonly style = createStyle(this.cssProps);
	readonly childNodes: FakeNode[] = [];
	parentElement: FakeElement | null = null;
	isConnected = false;
	ownerDocument: FakeDocument;
	/** Set by the suites that build a `.cm-callout` widget host. */
	cmView?: unknown;

	private readonly attrs = new Map<string, string>();

	constructor(tagName: string, ownerDocument?: FakeDocument) {
		this.tagName = tagName.toUpperCase();
		this.ownerDocument = ownerDocument ?? sharedDocument;
	}

	/* ---- attributes ---- */

	setAttribute(name: string, value: string): void {
		this.attrs.set(name, value);
	}

	getAttribute(name: string): string | null {
		return this.attrs.get(name) ?? null;
	}

	hasAttribute(name: string): boolean {
		return this.attrs.has(name);
	}

	removeAttribute(name: string): void {
		this.attrs.delete(name);
	}

	/* ---- tree ---- */

	get children(): FakeElement[] {
		return this.childNodes.filter(
			(node): node is FakeElement => node.nodeType === NODE_ELEMENT,
		);
	}

	get firstChild(): FakeNode | null {
		return this.childNodes[0] ?? null;
	}

	get lastChild(): FakeNode | null {
		return this.childNodes.at(-1) ?? null;
	}

	appendChild<T extends FakeNode>(node: T): T {
		node.parentElement?.removeChild(node);
		node.parentElement = this;
		this.childNodes.push(node);
		return node;
	}

	insertBefore<T extends FakeNode>(node: T, reference: FakeNode | null): T {
		node.parentElement?.removeChild(node);
		node.parentElement = this;
		const at = reference ? this.childNodes.indexOf(reference) : -1;
		if (at < 0) this.childNodes.push(node);
		else this.childNodes.splice(at, 0, node);
		return node;
	}

	removeChild<T extends FakeNode>(node: T): T {
		const at = this.childNodes.indexOf(node);
		if (at >= 0) this.childNodes.splice(at, 1);
		node.parentElement = null;
		return node;
	}

	replaceChildren(...nodes: FakeNode[]): void {
		for (const child of [...this.childNodes]) this.removeChild(child);
		for (const node of nodes) this.appendChild(node);
	}

	detach(): void {
		this.parentElement?.removeChild(this);
	}

	contains(node: FakeNode | null): boolean {
		let current: FakeNode | null = node;
		while (current) {
			if (current === (this as FakeNode)) return true;
			current = current.parentElement;
		}
		return false;
	}

	get textContent(): string {
		return this.childNodes
			.map((node) =>
				node.nodeType === NODE_TEXT ? node.nodeValue : node.textContent,
			)
			.join("");
	}

	set textContent(value: string) {
		this.replaceChildren();
		if (value !== "") this.appendChild(new FakeText(value));
	}

	/* ---- selectors ---- */

	matches(selector: string): boolean {
		return matchesSelector(this, selector);
	}

	closest(selector: string): FakeElement | null {
		return closestFrom(this, selector);
	}

	querySelector(selector: string): FakeElement | null {
		return this.querySelectorAll(selector)[0] ?? null;
	}

	querySelectorAll(selector: string): FakeElement[] {
		const found: FakeElement[] = [];
		for (const child of this.children) {
			if (matchesSelector(child, selector)) found.push(child);
			found.push(...child.querySelectorAll(selector));
		}
		return found;
	}

	/* ---- Obsidian's HTMLElement augmentations ---- */

	addClass(...classes: string[]): void {
		this.classList.add(...classes);
	}

	removeClass(...classes: string[]): void {
		this.classList.remove(...classes);
	}

	toggleClass(classes: string | string[], value: boolean): void {
		for (const cls of Array.isArray(classes) ? classes : [classes]) {
			this.classList.toggle(cls, value);
		}
	}

	hasClass(cls: string): boolean {
		return this.classList.contains(cls);
	}

	empty(): void {
		this.replaceChildren();
	}

	setText(text: string): void {
		this.textContent = text;
	}

	appendText(text: string): void {
		this.appendChild(new FakeText(text));
	}

	createEl(tag: string, options?: ElOptions): FakeElement {
		return this.make(tag, options);
	}

	createDiv(options?: ElOptions): FakeElement {
		return this.make("div", options);
	}

	createSpan(options?: ElOptions): FakeElement {
		return this.make("span", options);
	}

	/** The shared body of the three creators above. */
	private make(tag: string, options?: ElOptions): FakeElement {
		const el = new FakeElement(tag, this.ownerDocument);
		applyElOptions(el, options);
		return this.appendChild(el);
	}

	/**
	 * Set a CSS custom property the way Obsidian sets `--font-text-size` on
	 * `<body>`: an inline declaration `getPropertyValue` reads straight back.
	 *
	 * Its own method rather than `style.setProperty` at the call site, because
	 * this is a `Map` wearing a CSSOM interface — there is no cascade here to
	 * prefer a class over, which is what that rule is really about.
	 */
	setCssProp(name: string, value: string): void {
		this.cssProps.set(name, value);
	}
}

/** {@link FakeElement.closest}, as a free function — `this` is an argument. */
function closestFrom(start: FakeElement, selector: string): FakeElement | null {
	for (
		let current: FakeElement | null = start;
		current;
		current = current.parentElement
	) {
		if (matchesSelector(current, selector)) return current;
	}
	return null;
}

function applyElOptions(el: FakeElement, options?: ElOptions): void {
	if (!options) return;
	if (options.cls) {
		const classes = Array.isArray(options.cls)
			? options.cls
			: options.cls.split(/\s+/);
		el.classList.add(...classes.filter(Boolean));
	}
	if (options.text !== undefined) el.textContent = options.text;
	if (options.href !== undefined) el.setAttribute("href", options.href);
	if (options.type !== undefined) el.setAttribute("type", options.type);
	if (options.title !== undefined) el.setAttribute("title", options.title);
	for (const [name, value] of Object.entries(options.attr ?? {})) {
		el.setAttribute(name, value);
	}
}

/* -------------------------------------------------------------------------- */
/* Selector matching                                                          */
/* -------------------------------------------------------------------------- */

/** One `tag`/`.class`/`[attr]`/`[attr="value"]` piece of a compound selector. */
const SIMPLE_RE = /([.#]?[\w-]+)|(\[[^\]]+\])/g;

function matchesCompound(el: FakeElement, compound: string): boolean {
	const pieces = compound.trim().match(SIMPLE_RE);
	// An unparseable selector must never silently match everything.
	if (!pieces || pieces.length === 0) return false;
	for (const piece of pieces) {
		if (piece.startsWith(".")) {
			if (!el.classList.contains(piece.slice(1))) return false;
		} else if (piece.startsWith("#")) {
			if (el.getAttribute("id") !== piece.slice(1)) return false;
		} else if (piece.startsWith("[")) {
			const body = piece.slice(1, -1);
			const eq = body.indexOf("=");
			if (eq === -1) {
				if (!el.hasAttribute(body)) return false;
			} else {
				const name = body.slice(0, eq);
				const want = body.slice(eq + 1).replace(/^["']|["']$/g, "");
				if (el.getAttribute(name) !== want) return false;
			}
		} else if (el.tagName !== piece.toUpperCase()) {
			return false;
		}
	}
	return true;
}

function matchesSelector(el: FakeElement, selector: string): boolean {
	return selector
		.split(",")
		.some((compound) => matchesCompound(el, compound));
}

/* -------------------------------------------------------------------------- */
/* Document                                                                   */
/* -------------------------------------------------------------------------- */

export class FakeDocument {
	readonly body: FakeElement;
	readonly head: FakeElement;
	/**
	 * `@codemirror/view` sniffs the browser at module load with
	 * `"webkitFontSmoothing" in document.documentElement.style`, and takes that
	 * branch as soon as a `document` global exists at all — so any suite that
	 * installs this DOM *and* imports CodeMirror needs it to be there.
	 */
	readonly documentElement: FakeElement;
	/** Every listener added through `addEventListener`, by type. */
	readonly listeners = new Map<string, Array<() => void>>();

	constructor() {
		this.documentElement = new FakeElement("html", this);
		this.body = new FakeElement("body", this);
		this.head = new FakeElement("head", this);
		this.documentElement.appendChild(this.head);
		this.documentElement.appendChild(this.body);
	}

	createElement(tag: string): FakeElement {
		return new FakeElement(tag, this);
	}

	addEventListener(type: string, fn: () => void): void {
		const list = this.listeners.get(type) ?? [];
		list.push(fn);
		this.listeners.set(type, list);
	}

	removeEventListener(type: string, fn: () => void): void {
		const list = this.listeners.get(type);
		if (!list) return;
		const at = list.indexOf(fn);
		if (at >= 0) list.splice(at, 1);
	}

	/** Fire every listener of a type, as a real dispatch would. */
	fire(type: string): void {
		for (const fn of [...(this.listeners.get(type) ?? [])]) fn();
	}
}

let sharedDocument = new FakeDocument();

/* -------------------------------------------------------------------------- */
/* Installation                                                               */
/* -------------------------------------------------------------------------- */

/** Handle on the installed globals. */
export interface FakeDomHandle {
	document: FakeDocument;
	/** Put `theme-dark` on `<body>`, as Obsidian does in dark mode. */
	dark(): void;
	/** Take it off again. */
	light(): void;
	/** Restore every global this replaced. */
	restore(): void;
}

/**
 * Install the fake DOM on `globalThis`.
 *
 * `createSpan`, `createDiv`, `createEl`, `activeDocument` and `activeWindow` are
 * ambient globals in the Obsidian renderer; esbuild leaves them as free
 * identifiers, so seeding `globalThis` is all it takes. `HTMLElement`, `Node`,
 * `MouseEvent` and `KeyboardEvent` are here because `instanceof` against each is
 * a live branch (`resolve.ts` guards on `HTMLElement`, `LinkSuggestDecorator`
 * on `Node.TEXT_NODE`, `AutoComplete.selectSuggestion` on `KeyboardEvent`).
 *
 * `node --test` runs each test *file* in its own process, so nothing installed
 * here can leak into another suite; `restore()` exists for the one suite that
 * wants to prove a module copes without a DOM at all.
 */
export function installFakeDom(): FakeDomHandle {
	const g = globalThis as Record<string, unknown>;
	const saved = { ...g };
	const keys = [
		"document",
		"activeDocument",
		"activeWindow",
		"window",
		"createEl",
		"createDiv",
		"createSpan",
		"HTMLElement",
		"Node",
		"MouseEvent",
		"KeyboardEvent",
	];

	const doc = new FakeDocument();
	sharedDocument = doc;

	/**
	 * The one detached-element factory the three Obsidian globals are built on.
	 * Named apart from `createEl` on purpose: these are the *implementations*
	 * of `createDiv`/`createSpan`, so routing them through something called
	 * `createEl` would read as the mistake the lint rule is there to catch.
	 */
	const make = (tag: string, options?: ElOptions): FakeElement => {
		const el = new FakeElement(tag, doc);
		applyElOptions(el, options);
		return el;
	};

	g.document = doc;
	g.activeDocument = doc;
	g.window = g.window ?? {};
	g.activeWindow = g.window;
	g.createEl = make;
	g.createDiv = (options?: ElOptions) => make("div", options);
	g.createSpan = (options?: ElOptions) => make("span", options);
	g.HTMLElement = FakeElement;
	g.Node = { ELEMENT_NODE: NODE_ELEMENT, TEXT_NODE: NODE_TEXT };
	g.MouseEvent = class MouseEvent {};
	g.KeyboardEvent = class KeyboardEvent {};

	return {
		document: doc,
		dark: () => doc.body.classList.add("theme-dark"),
		light: () => doc.body.classList.remove("theme-dark"),
		restore() {
			for (const key of keys) {
				if (key in saved) g[key] = saved[key];
				else delete g[key];
			}
		},
	};
}

/* -------------------------------------------------------------------------- */
/* Tree builder                                                               */
/* -------------------------------------------------------------------------- */

export interface ElementSpec {
	tag?: string;
	cls?: string | string[];
	attrs?: Record<string, string>;
	text?: string;
	children?: FakeElement[];
}

/**
 * Build one element, declaratively. Suites nest calls to describe the exact DOM
 * a right-click landed in, which is the whole input to `resolveContext`.
 */
export function el(spec: ElementSpec = {}): FakeElement {
	const node = new FakeElement(spec.tag ?? "div", sharedDocument);
	applyElOptions(node, { cls: spec.cls, attr: spec.attrs });
	if (spec.text !== undefined) node.appendText(spec.text);
	for (const child of spec.children ?? []) node.appendChild(child);
	return node;
}

/** Cast helper: the code under test is typed against the real DOM. */
export const asEl = (node: FakeElement): HTMLElement =>
	node as unknown as HTMLElement;

/**
 * Installed the moment this module is evaluated, and exported as a handle.
 *
 * Import order is the guarantee: ES modules are evaluated depth-first in
 * declaration order, so a suite that lists this import **first** has the globals
 * in place before anything it is testing is even loaded. That matters for
 * `@codemirror/view`, which sniffs `document.documentElement.style` at module
 * scope — it copes with no `document` at all, but not with half of one.
 *
 * Doing it here rather than in a top-level statement is not stylistic: the
 * project's `tsconfig.json` type-checks `tests/` at `target: ES6`, where
 * top-level `await import(...)` — the other way to order this — is a compile
 * error.
 */
export const fakeDom: FakeDomHandle = installFakeDom();
