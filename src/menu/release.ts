/**
 * Runs `then` in a task after the press that is down now ends, its button
 * released or its pointer cancelled, and returns what forgets it.
 *
 * A menu raised from a press has to outlast it, which is the whole gesture for
 * a context menu on the right button's press. The browser settles what a press
 * dismisses as the pointer goes down and carries it out at the release, after
 * the release's own listeners have run: a popover shown while the button is
 * held is hidden again, and so is one shown from the `pointerup` listener
 * itself, which Chrome light-dismisses with that same press, before its click.
 * So the menu is shown in a task of its own after the release, once the press
 * and its dismissal are over.
 */
export function afterRelease(then: () => void): () => void {
  const listening = new AbortController();
  let task: ReturnType<typeof setTimeout> | undefined;
  const released = () => {
    listening.abort();
    task = setTimeout(then, 0);
  };
  // Captured, so a listener that stops the release on its way does not keep it from here.
  window.addEventListener('pointerup', released, {capture: true, signal: listening.signal});
  window.addEventListener('pointercancel', released, {capture: true, signal: listening.signal});
  return () => {
    listening.abort();
    clearTimeout(task);
  };
}
