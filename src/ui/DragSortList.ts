/**
 * ui/DragSortList.ts — Pointer-based drag-to-reorder for a vertical list.
 *
 * Attaches once to a list container whose direct children are the rows. A drag
 * starts on `pointerdown` over an element matching `handleSelector`. The dragged
 * row lifts and floats under the pointer (`transform: translateY`) while the DOM
 * is live-reordered as the pointer crosses neighbouring rows' midpoints; the
 * displaced neighbours slide into place with a FLIP animation instead of
 * snapping. On release the row settles into its slot and the net move is
 * reported via `onReorder(from, to)`.
 *
 * Pointer Events are used (not HTML5 drag) so the same code works with mouse,
 * pen, and touch — the plugin runs on mobile (isDesktopOnly: false). The handle
 * must set `touch-action: none` in CSS so dragging from it does not scroll the
 * page. Because the container element itself never moves, reordering its
 * children keeps pointer capture intact for the whole gesture.
 *
 * Motion honours `prefers-reduced-motion`: when reduced motion is requested the
 * float/slide/settle are skipped and reordering is instant (as it used to be).
 */
import {
	REORDER_DURATION_MS,
	animateReorder,
	prefersReducedMotion,
} from "./flip";

export interface DragSortOptions {
	/** CSS selector matching each reorderable row (a direct child of container). */
	rowSelector: string;
	/** CSS selector for the drag handle inside a row. */
	handleSelector: string;
	/**
	 * Optional grouping key. A dragged row can only be reordered among rows that
	 * share its group; rows of other groups act as fixed walls it can never cross.
	 * Omit to treat the whole list as one group (unconstrained reorder). Used to
	 * keep the enabled and disabled menu-item bands separate.
	 */
	groupOf?: (row: HTMLElement) => unknown;
	/** Called once on release when the row's index actually changed. */
	onReorder: (fromIndex: number, toIndex: number) => void;
}

/**
 * Make `container`'s rows drag-reorderable. Returns a cleanup function that
 * detaches all listeners.
 */
export function makeDragSortable(
	container: HTMLElement,
	opts: DragSortOptions,
): () => void {
	let dragging: HTMLElement | null = null;
	let startIndex = -1;
	let pointerId = -1;
	let reduceMotion = false;
	/** Pointer offset within the grabbed row, captured at pointerdown. */
	let grabOffset = 0;
	/** Current translateY applied to the dragged row (px). */
	let currentTransform = 0;

	const rows = (): HTMLElement[] =>
		Array.from(container.querySelectorAll<HTMLElement>(opts.rowSelector));

	const onPointerMove = (e: PointerEvent): void => {
		const dragEl = dragging;
		if (!dragEl) return;
		e.preventDefault();
		const y = e.clientY;

		// Rows the dragged one may reorder among: its own group only. Rows in
		// other groups are ignored here, so they act as fixed walls the dragged
		// row can never cross (e.g. enabled items never sink into the disabled
		// band, and vice versa).
		const groupOf = opts.groupOf;
		const dragGroup = groupOf ? groupOf(dragEl) : undefined;
		const siblings = rows().filter(
			(el) => el !== dragEl && (!groupOf || groupOf(el) === dragGroup),
		);

		// First same-group sibling whose vertical midpoint is below the pointer;
		// the dragged row should sit just before it. If none, it goes to the end
		// of its group — right after the last same-group sibling, never past a
		// wall into the next group.
		let ref: HTMLElement | null = null;
		for (const el of siblings) {
			const rect = el.getBoundingClientRect();
			if (y < rect.top + rect.height / 2) {
				ref = el;
				break;
			}
		}

		const last = siblings[siblings.length - 1] ?? null;
		let needsMove: boolean;
		let place: () => void;
		if (ref) {
			needsMove = dragEl.nextElementSibling !== ref;
			place = () => container.insertBefore(dragEl, ref);
		} else if (last) {
			// Move to the end of the group: immediately after its last member.
			needsMove = last.nextElementSibling !== dragEl;
			place = () => container.insertBefore(dragEl, last.nextElementSibling);
		} else {
			// Sole member of its group — nothing to reorder against.
			needsMove = false;
			place = () => {};
		}

		// Only reorder — and animate — when the slot actually changes, so ongoing
		// neighbour slides are not cancelled and restarted on every stationary
		// move. The FLIP slides the displaced neighbours; the dragged row is
		// skipped because it tracks the pointer itself (below).
		if (needsMove) {
			animateReorder(container, place, { skip: (el) => el === dragEl });
		}

		if (reduceMotion) return;
		// Glue the dragged row to the pointer. Reading its rendered top (which
		// still includes the previous transform) makes this self-correct for the
		// flow shift caused by the reorder above — no accumulator needed:
		//   new = (desiredTop) - (flowTop + oldTransform) + oldTransform
		//       = desiredTop - flowTop
		currentTransform =
			y - grabOffset - dragEl.getBoundingClientRect().top + currentTransform;
		dragEl.style.transform = `translateY(${currentTransform}px)`;
	};

	const onPointerUp = (): void => {
		const dragEl = dragging;
		if (!dragEl) return;
		const from = startIndex;
		const finalIndex = rows().indexOf(dragEl);
		const changed = finalIndex !== -1 && finalIndex !== from;

		container.removeClass("cs-dragging");
		try {
			container.releasePointerCapture(pointerId);
		} catch {
			/* capture may already be gone (pointercancel) */
		}
		container.removeEventListener("pointermove", onPointerMove);
		container.removeEventListener("pointerup", onPointerUp);
		container.removeEventListener("pointercancel", onPointerUp);

		const finish = (): void => {
			dragEl.removeClass("is-dragging");
			dragEl.style.removeProperty("transform");
			if (changed) opts.onReorder(from, finalIndex);
		};

		if (!reduceMotion && Math.abs(currentTransform) >= 0.5) {
			// Settle: slide the residual offset back to zero, then finish. The
			// reorder is reported only after the row lands so a caller that rebuilds
			// the list does not interrupt the slide.
			const anim = dragEl.animate(
				[
					{ transform: `translateY(${currentTransform}px)` },
					{ transform: "translateY(0px)" },
				],
				{ duration: REORDER_DURATION_MS, easing: "ease" },
			);
			// Drop the inline follow-transform now: the animation overrides it while
			// running and, with no fill, the row rests at its natural slot after.
			dragEl.style.removeProperty("transform");
			anim.addEventListener("finish", finish, { once: true });
		} else {
			finish();
		}

		dragging = null;
		startIndex = -1;
		pointerId = -1;
		currentTransform = 0;
	};

	const onPointerDown = (e: PointerEvent): void => {
		if (dragging) return; // ignore extra touches mid-drag
		const target = e.target as HTMLElement | null;
		const handle = target?.closest(opts.handleSelector);
		if (!handle) return;
		const row = handle.closest(opts.rowSelector);
		if (!(row instanceof HTMLElement)) return;

		e.preventDefault();
		dragging = row;
		pointerId = e.pointerId;
		startIndex = rows().indexOf(row);
		reduceMotion = prefersReducedMotion();
		grabOffset = e.clientY - row.getBoundingClientRect().top;
		currentTransform = 0;
		container.addClass("cs-dragging");
		row.addClass("is-dragging");
		container.setPointerCapture(pointerId);
		container.addEventListener("pointermove", onPointerMove);
		container.addEventListener("pointerup", onPointerUp);
		container.addEventListener("pointercancel", onPointerUp);
	};

	container.addEventListener("pointerdown", onPointerDown);

	return () => {
		container.removeEventListener("pointerdown", onPointerDown);
		container.removeEventListener("pointermove", onPointerMove);
		container.removeEventListener("pointerup", onPointerUp);
		container.removeEventListener("pointercancel", onPointerUp);
	};
}
