/**
 * The bars riding on the keyboard, for `useKeyboardInset` to count. A
 * `KeyboardBar` that rides covers its own height above the keyboard's top,
 * so it publishes that height under an id of its own while the keyboard is
 * up, and takes it back once the keyboard goes or the bar unmounts. The
 * hook reads the sum, normally one bar's, as the band over the keyboard
 * that a measured view has to clear as well.
 *
 * A module store rather than a context: in the screen the bar sits below
 * the view it rides over, not around it, so no provider could join them.
 */
const riding = new Map<string, number>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** `id` rides at `height` points: published, unless it already does. */
export function publishRiding(id: string, height: number): void {
  if (riding.get(id) === height) return;
  riding.set(id, height);
  notify();
}

/** `id` rides no more: taken back, if it was riding. */
export function clearRiding(id: string): void {
  if (!riding.delete(id)) return;
  notify();
}

/** Hears every change of the riding height; answers what stops it. */
export function subscribeRiding(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The sum of the riding bars' heights, normally one bar's; zero while none rides. */
export function ridingHeight(): number {
  let total = 0;
  for (const height of riding.values()) total += height;
  return total;
}
