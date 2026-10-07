import type {DividerProps} from './types';

import {StyleSheet} from 'react-native';
import {HorizontalDivider, VerticalDivider} from '@expo/ui/jetpack-compose';
import {padding, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {SelfHosted} from '../host';
import {useColor} from '../theme';

/**
 * Android renders the Material 3 `HorizontalDivider` (or `VerticalDivider`)
 * as a single-pixel line in the theme `separator` color, matching iOS/web.
 *
 * Outside a host the rule mounts one of its own, so it draws between React
 * Native views too: the width of its container for a horizontal rule, the
 * height of its row for a vertical one.
 */
export function Divider({vertical, color, inset, testID}: DividerProps) {
  const separator = useColor('separator');
  const Component = vertical ? VerticalDivider : HorizontalDivider;
  const modifiers = [
    ...(inset ? [vertical ? padding(0, inset, 0, 0) : padding(inset, 0, 0, 0)] : []),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
  return (
    <SelfHosted fit={vertical ? 'width' : false}>
      <Component
        color={color ?? separator}
        thickness={StyleSheet.hairlineWidth}
        modifiers={modifiers}
      />
    </SelfHosted>
  );
}
