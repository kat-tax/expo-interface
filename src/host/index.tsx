import type {PropsWithChildren} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {Host} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {hostAccentProps} from '../screen/host-accent';

export interface NativeHostProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /**
   * Size the host to its content on both axes (a group of buttons in a row);
   * by default only vertically, the width filling its container.
   * @default false
   */
  fit?: boolean;
}

/**
 * An accent-seeded `@expo/ui` `Host` for controls that sit inside a React
 * Native layout: a toolbar next to a canvas, a search row, a floating
 * button. `Screen native` mounts the same host around a whole screen; this
 * one is for the places a screen cannot be native, sized to its content and
 * seeded like the screen would be (`hostAccentProps`). On web it is a plain
 * view carrying the `@expo/ui` palette.
 */
export function NativeHost({children, style, fit = false}: NativeHostProps) {
  const seed = useAccentSeed();
  return (
    <Host matchContents={fit ? true : {vertical: true}} style={style} {...hostAccentProps(seed)}>
      {children}
    </Host>
  );
}
