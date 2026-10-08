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
 * Escape on web while the card is up, wherever the focus is: the window's
 * keydown in the capture phase, which comes before every listener on the
 * document and under it, so an editor that holds the focus and keeps the key
 * for itself still lets the card go first. The key then stops at the window:
 * neither the editor nor an overlay around the card that listens on the
 * document, such as a web `Sheet`, acts on it too.
 */
export function useEscape(active: boolean, onEscape: () => void): void {
  const escape = useEffectEvent(onEscape);
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      escape();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active]);
}
