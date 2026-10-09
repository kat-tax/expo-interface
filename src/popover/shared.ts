import type {RefObject} from 'react';
import type {PointerEvent, ViewProps} from 'react-native';
import type {PopoverRect} from './types';
import {useEffect, useEffectEvent, useState} from 'react';

/** How long a hover popover lingers once the pointer has gone, in milliseconds. */
export const HOVER_GRACE = 300;

/**
 * What a modal card says of itself: a dialog, which VoiceOver keeps the
 * focus inside and a browser announces as modal. VoiceOver's escape gesture
 * dismisses it as Escape does on web.
 */
export const MODAL_CARD = {role: 'dialog', 'aria-modal': true, accessibilityViewIsModal: true} as const;

interface Linger {
  /** The rectangle to draw the card at: the app's, or the last one while the card lingers. */
  shown: PopoverRect | null;
  /** The card's pointer events. */
  props: ViewProps;
  /**
   * Ends a linger at once, and keeps the app's next clearing of `at` from
   * starting one: for a dismissal of the card's own (an action, the
   * backdrop, Escape).
   */
  end: () => void;
}

/**
 * A hover popover's own life. The app sets `at` while the pointer is over
 * what the card is about and clears it when the pointer leaves; the card
 * lingers on the last rectangle for `grace` after that, and stays while the
 * pointer is over it, so the pointer can cross from the thing to the card.
 * Once it has been away from both for the grace the card goes, reporting
 * `onLeave`. A touch is not a hover: its pointer events are ignored, so a
 * finger lifting off the card does not count as leaving it.
 *
 * A dismissal of the card's own calls `end`: the card goes as soon as the
 * app clears `at`, with no linger and no `onLeave` after it. A card that goes
 * from under the pointer does not keep the next one up. `at` is compared by
 * value, so an app may pass a new object for the same rectangle on every
 * render.
 */
export function useLinger(at: PopoverRect | null, enabled: boolean, grace: number = HOVER_GRACE, onLeave: () => void): Linger {
  const [previous, setPrevious] = useState(at);
  const [linger, setLinger] = useState<PopoverRect | null>(null);
  const [over, setOver] = useState(false);
  const [ended, setEnded] = useState(false);
  // The app's rectangle going away is when a linger starts, unless the card
  // was dismissed while it was up; one coming back ends it. A new object
  // holding the same rectangle, which an app may pass on every render, is
  // no change.
  if (!samePlace(at, previous)) {
    setPrevious(at);
    setLinger(at === null && enabled && !ended ? previous : null);
    setEnded(false);
  }
  const shown = at ?? linger;
  // A card that goes from under the pointer gets no pointerleave, so the
  // pointer is forgotten with it. Only on a settled pass: the pass that sees
  // `at` change still holds the old linger, so `shown` reads null there just
  // before a linger starts.
  if (over && shown === null && at === previous) setOver(false);
  const leave = useEffectEvent(onLeave);
  useEffect(() => {
    if (!linger || over) return;
    const timer = setTimeout(() => {
      setLinger(null);
      leave();
    }, grace);
    return () => clearTimeout(timer);
  }, [linger, over, grace]);

  const hovering = (value: boolean) => (event: PointerEvent) => {
    if (event.nativeEvent.pointerType !== 'touch') setOver(value);
  };
  return {
    shown,
    props: enabled ? {onPointerEnter: hovering(true), onPointerLeave: hovering(false)} : {},
    end: () => {
      setLinger(null);
      setEnded(true);
    },
  };
}

/** Whether two rectangles are the same place, whichever objects hold them. */
function samePlace(a: PopoverRect | null, b: PopoverRect | null): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y && (a.width ?? 0) === (b.width ?? 0) && (a.height ?? 0) === (b.height ?? 0);
}

/**
 * An overlay that takes Escape on web: a `Popover` card, a menu (the
 * `MenuList` of a `Menu`, a `ContextMenu` or a `Fab`, or a `PopupMenu`) or
 * an `Alert`.
 */
interface Taker {
  node: HTMLElement;
  /** Whether it would take the key now. */
  wants: () => boolean;
  take: () => void;
}

/** The overlays that take Escape on web, in the order they came up. */
const takers: Taker[] = [];

/**
 * Escape on web while an overlay is up, wherever the focus is: the window's
 * keydown in the capture phase, which comes before every listener on the
 * document and under it, so an editor that holds the focus and keeps the key
 * for itself still lets the overlay go first. The key then stops at the
 * window: neither the editor nor an overlay around this one that listens on
 * the document, such as a web `Sheet`, acts on it too.
 *
 * One Escape closes one overlay, the innermost. One window listener chooses
 * it for all of them before any acts, since a menu that closes on the key
 * would no longer be open by the time a card around it looked. A card with a
 * menu open in it, or another card up inside it, leaves the key to that
 * one. A `popover` element that is no taker, the `ColorPicker`'s `popover`
 * presentation, is the browser's to close on Escape: an overlay with one
 * open in it leaves the key to the browser, and nothing here takes it. Of
 * two overlays up side by side, the one that came up last takes it.
 *
 * `node` is the overlay's element (on web a view's ref is its element),
 * which is in the DOM whenever `active` is set. `wants` says whether it
 * takes the key at a given moment, if not whenever it is active.
 */
export function useEscape(active: boolean, node: RefObject<unknown>, onEscape: () => void, wants?: () => boolean): void {
  const escape = useEffectEvent(onEscape);
  const asked = useEffectEvent(() => wants?.() ?? true);
  useEffect(() => {
    if (!active) return;
    const taker: Taker = {node: node.current as HTMLElement, wants: () => asked(), take: () => escape()};
    if (takers.length === 0) window.addEventListener('keydown', onEscapeKey, true);
    takers.push(taker);
    return () => {
      takers.splice(takers.indexOf(taker), 1);
      if (takers.length === 0) window.removeEventListener('keydown', onEscapeKey, true);
    };
  }, [active, node]);
}

function onEscapeKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  const taker = chosen();
  if (!taker) return;
  event.stopPropagation();
  taker.take();
}

/**
 * The overlay Escape is for: of those that want it with no other one that
 * does inside them, the last to come up; none when a popover the browser
 * closes is open in that one, above it.
 */
function chosen(): Taker | undefined {
  const wanting = takers.filter(taker => taker.wants());
  const top = wanting.findLast(taker => !wanting.some(other => other !== taker && taker.node.contains(other.node)));
  return top && !holdsOpenMenu(top.node) ? top : undefined;
}

/**
 * Whether a `popover` element the browser closes on Escape is open inside
 * the overlay, so the key is the browser's: the `ColorPicker`'s `popover`
 * presentation, which is no taker, or a menu whose opening the browser has
 * not reported yet, since a menu takes the key from its `toggle` event. A
 * `manual` one does not count: Escape does not close it, so the overlay
 * would never get the key.
 */
function holdsOpenMenu(node: HTMLElement): boolean {
  return Array.from(node.querySelectorAll('[popover]:not([popover="manual"])')).some(element => element.matches(':popover-open'));
}

