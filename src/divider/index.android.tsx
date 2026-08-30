import type {DividerProps} from './types';

import {StyleSheet} from 'react-native';
import {HorizontalDivider, VerticalDivider} from '@expo/ui/jetpack-compose';
import {padding, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

/**
 * Android renders the Material 3 `HorizontalDivider` (or `VerticalDivider`)
 * as a single-pixel line in the theme `separator` color, matching iOS/web.
 */
export function Divider({vertical, color, inset, testID}: DividerProps) {
  const separator = useColor('separator');
  const Component = vertical ? VerticalDivider : HorizontalDivider;
  const modifiers = [
    ...(inset ? [vertical ? padding(0, inset, 0, 0) : padding(inset, 0, 0, 0)] : []),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
  return (
    <Component
      color={color ?? separator}
      thickness={StyleSheet.hairlineWidth}
      modifiers={modifiers}
    />
  );
}
