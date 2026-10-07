import type {ViewProps} from 'react-native';
import {useState, useSyncExternalStore} from 'react';

/** The media query that says the primary pointer can hover. */
const HOVER = '(hover: hover)';

function subscribe(onChange: () => void): () => void {
  const list = window.matchMedia?.(HOVER);
  if (!list) return () => {};
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

/** Whether the primary pointer can hover; never on a server, which has none. */
export function hoverCapable(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.(HOVER)?.matches ?? false);
}

/**
 * Web: revealed while a pointer is over the card or the keyboard is in it,
 * on a device whose pointer can hover; always on one whose pointer cannot
 * (a phone, a tablet), where there is nothing to reveal it with. The focus
 * is the box's as a whole, so tabbing from the card to the control it
 * revealed keeps the control: a blur whose next target is still inside is
 * no blur.
 */
export function useReveal(): {revealed: boolean; props: ViewProps} {
  const capable = useSyncExternalStore(subscribe, hoverCapable, hoverCapable);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // The focus handlers see DOM focus events here, whatever React Native's
  // types say of them, so they are typed as what the browser sends.
  const props = {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (event: {currentTarget: EventTarget; nativeEvent: {relatedTarget: EventTarget | null}}) => {
      const next = event.nativeEvent.relatedTarget;
      const box = event.currentTarget;
      if (next instanceof Node && box instanceof Node && box.contains(next)) return;
      setFocused(false);
    },
  } as unknown as ViewProps;
  return {revealed: !capable || hovered || focused, props};
}
