import type {StatePressableProps} from './types';
import {useState} from 'react';
import {Pressable} from 'react-native';

/**
 * Windows: `Pressable` with the pointer tracked, so the style callback sees
 * `hovered` and a drawn control can take WinUI's hover fill. react-native-
 * windows reports the pointer through `onHoverIn`/`onHoverOut` but not in
 * the style state, which carries `pressed` alone. Focus needs nothing here:
 * a pressable is focusable, react-native-windows draws the focus ring, and
 * Enter and Space press it.
 */
export function StatePressable({style, onHoverIn, onHoverOut, ...rest}: StatePressableProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...rest}
      onHoverIn={event => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={event => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={({pressed}) => style({pressed, hovered})}
    />
  );
}
