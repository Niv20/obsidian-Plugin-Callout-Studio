/**
 * manager/listenerList.ts — calling a list of listeners that may change while
 * you are calling it.
 *
 * `CalloutRegistry` keeps two of these lists — `onChange` for real mutations and
 * `onPreviewChange` for the transient live-preview row — and both are spliced by
 * their `off…` counterpart. A listener is perfectly entitled to unsubscribe from
 * inside its own callback (a one-shot "tell me when the registry is ready" is
 * the obvious case, and a consumer plugin unloading is another), and a naive
 * `for (const cb of list) cb()` gets that wrong in two directions at once:
 *
 * - **A splice steals the next listener's turn.** Removing the running listener
 *   shifts everything behind it down one slot while the iterator index has
 *   already moved up, so the very next listener is skipped for that round. The
 *   symptom is one consumer missing exactly one update, which points nowhere
 *   near here — and which of them misses it depends on subscription order.
 * - **A push runs a newcomer immediately.** A listener subscribed from inside a
 *   callback would be called during the same round it was added, before the
 *   mutation it is watching has finished settling.
 *
 * Iterating a snapshot fixes both. The live list is still consulted per call, so
 * `off()` also means what it says: once it has returned, its callback is not
 * invoked again — not even later in a round that was already under way, which
 * matters because that callback may belong to something that has just torn
 * itself down. (One nuance the identity check cannot see: a callback registered
 * twice and unsubscribed once still gets both of that round's calls. It is owed
 * one, and the next round gives it one — this is the same overshoot a plain
 * snapshot has, never worse, and no caller registers the same function twice.)
 */
export type Listener = () => void;

/**
 * Call every listener in `live` once, in order.
 *
 * `live` is the array the `on…`/`off…` pair really mutates, not a copy: the
 * snapshot is taken here so that unsubscribing mid-round can be honoured.
 */
export function notifyListeners(live: readonly Listener[]): void {
	for (const cb of [...live]) {
		if (!live.includes(cb)) continue;
		cb();
	}
}
