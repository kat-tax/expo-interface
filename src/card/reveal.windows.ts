import type {ViewProps} from 'react-native';
import {useState} from 'react';

/**
 * Windows: a desktop has a pointer, so what it reveals is hidden until the
 * pointer is over the card, read from the W3C pointer events the Fabric
 * views dispatch. The keyboard cannot reveal it: the focus moves between
 * XAML islands without the React Native tree seeing it go, so a card's
 * `menu` is where a keyboard reaches the same action.
 */
export function useReveal(): {revealed: boolean; props: ViewProps} {
  const [hovered, setHovered] = useState(false);
  return {
    revealed: hovered,
    props: {
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
    },
  };
}
