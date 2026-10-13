import type {MouseEvent, PointerEvent, SyntheticEvent} from 'react';
import {useEffect, useRef} from 'react';

/**
 * How long a touch is held before it arms a menu on web, where Safari on iOS
 * raises no `contextmenu` for a touch: the `ContextMenu` and the `TabView`
 * strip's tabs and cards time their held touch by it.
 */
export const LONG_PRESS_MS = 500;

/**
 * How long after the release an armed hold waits for the release's `click`
 * before it opens the menu on its own. A browser sends a touch's click within
 * a few milliseconds of the release, and Safari on iOS within its double-tap
 * delay of about 300 ms on a page that has not turned it off. No click comes
 * for a touch lifted off the element it started on, or from a browser that
 * sends none after a held touch, and the menu still has to.
 */
export const HELD_GRACE_MS = 300;

type Timer = ReturnType<typeof setTimeout>;

/** The handlers for an element a touch can be held on. */
export interface HeldTouchHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerMove: () => void;
  onClickCapture: (event: MouseEvent<HTMLElement>) => void;
}

export interface HeldTouch<T> {
  /** The handlers for one element, closing over what a hold on it is for. */
  handlers: (payload: T) => HeldTouchHandlers;
  /** Forgets a touch held or a hold armed: for a `contextmenu` that opens the menu itself. */
  cancel: () => void;
}

/**
 * A touch held on an element, which opens a menu once it lifts.
 *
 * The hold arms the gesture rather than opening the menu: a menu shown while
 * the touch is down is light-dismissed by the release, and the release's
 * `click` would then press the element under it (select the tab, press the
 * content). So the hold waits for the release, takes the click the release
 * brings (its default and its propagation, so nothing under it is pressed)
 * and opens the menu in a task after it, once the press is wholly over. A
 * release no click follows, because the touch lifted off the element or the
 * browser sends none after a held touch, opens the menu {@link HELD_GRACE_MS}
 * after the release instead, and the arm stands so a click that still comes
 * is swallowed too; the next press on the element clears it. A touch the
 * browser cancels (a pan, a system gesture) opens nothing, and a touch that
 * moves before the hold is a scroll, not a hold. A press inside a popover
 * nested in the element (the menu itself, for a `ContextMenu`) is the
 * popover's, so it neither holds nor is swallowed.
 *
 * `enabled` false takes the hold away, for a `ContextMenu` whose `trigger`
 * is the tap, or one that is disabled.
 */
export function useHeldTouch<T = void>(onHeld: (x: number, y: number, payload: T) => void, enabled = true): HeldTouch<T> {
  // The touch held, until it has been held long enough or lifts.
  const hold = useRef<Timer | null>(null);
  // The hold has fired: what the release opens.
  const armed = useRef<(() => void) | null>(null);
  // The grace after the release, or the task after the release's click.
  const after = useRef<Timer | null>(null);

  // A touch still held, or a menu still to come, when the element goes would
  // open a menu with nothing to open it on.
  useEffect(() => () => {
    stop(hold);
    stop(after);
    armed.current = null;
  }, []);

  const cancel = () => {
    stop(hold);
    stop(after);
    armed.current = null;
  };

  return {
    cancel,
    handlers: payload => ({
      onPointerDown: event => {
        // A new press is a new gesture, whatever the last one left: an arm a
        // late click would have met, a grace that would have opened the menu.
        cancel();
        if (!enabled || event.pointerType !== 'touch' || inPopover(event)) return;
        const {clientX: x, clientY: y} = event;
        hold.current = setTimeout(() => {
          hold.current = null;
          armed.current = () => onHeld(x, y, payload);
        }, LONG_PRESS_MS);
      },
      // A touch that moves before the hold is a scroll; one that drifts once
      // armed still opens the menu when it lifts.
      onPointerMove: () => stop(hold),
      // The browser took the touch, for a pan or a gesture of its own: there
      // is no release to open on.
      onPointerCancel: cancel,
      onPointerUp: () => {
        stop(hold);
        const open = armed.current;
        if (!open) return;
        after.current = setTimeout(() => {
          after.current = null;
          open();
        }, HELD_GRACE_MS);
      },
      onClickCapture: event => {
        const open = armed.current;
        if (!open || inPopover(event)) return;
        event.preventDefault();
        event.stopPropagation();
        // Within the grace it is the release's click, and the menu follows
        // it; after the grace the menu is up already, and the click is only
        // taken.
        if (!after.current) return;
        stop(after);
        armed.current = null;
        after.current = setTimeout(() => {
          after.current = null;
          open();
        }, 0);
      },
    }),
  };
}

function stop(timer: {current: Timer | null}) {
  if (timer.current) clearTimeout(timer.current);
  timer.current = null;
}

/** Whether an event comes from a popover nested in the element: the popover's own press or click. */
function inPopover(event: SyntheticEvent<HTMLElement>): boolean {
  const popover = (event.target as Element).closest('[popover]');
  return popover !== null && event.currentTarget.contains(popover);
}
