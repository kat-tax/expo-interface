import type {StatePressableProps} from './types';
import {useState} from 'react';
import {Pressable} from 'react-native';

/**
 * Windows: `Pressable` with the pointer tracked, so the style callback sees
 * `hovered` and a drawn control can take WinUI's hover fill. The style state
 * react-native-windows gives carries `pressed` alone; the pointer is read
 * from the W3C pointer events its Fabric views dispatch (`onPointerEnter`,
 * `onPointerLeave`) and from `onHoverIn`/`onHoverOut`, which the Pressable
 * derives from mouse events where it has them. Focus needs nothing here: a
 * pressable is focusable, react-native-windows draws the focus ring, and
 * Enter and Space press it.
 */
export function StatePressable({style, onHoverIn, onHoverOut, onPointerEnter, onPointerLeave, ...rest}: StatePressableProps) {
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
      onPointerEnter={event => {
        setHovered(true);
        onPointerEnter?.(event);
      }}
      onPointerLeave={event => {
        setHovered(false);
        onPointerLeave?.(event);
      }}
      style={({pressed}) => style({pressed, hovered})}
    />
  );
}
