import type {DividerProps} from './types';

import {StyleSheet} from 'react-native';
import {HorizontalDivider, VerticalDivider} from '@expo/ui/jetpack-compose';
import {height, padding, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {SelfHosted, useNativeHost} from '../host';
import {useColor} from '../theme';

/**
 * How long a vertical rule is inside a host, in dp: Material's icon size,
 * which is what a rule between a bar's commands sits beside.
 *
 * Material's `VerticalDivider` fills the height it is given, and inside a
 * host there is no row height to give it: a host sized to its content
 * measures Compose with no bound, where filling comes to nothing and the rule
 * draws 0dp tall, and a host sized by the layout hands it the whole host. So
 * a rule there takes a length of its own.
 */
const HOSTED_RULE_LENGTH = 24;

/**
 * Android renders the Material 3 `HorizontalDivider` (or `VerticalDivider`)
 * as a single-pixel line in the theme `separator` color, matching iOS/web.
 *
 * Outside a host the rule mounts one of its own, so it draws between React
 * Native views too: the width of its container for a horizontal rule, the
 * height of its row for a vertical one. Inside one a vertical rule is
 * {@link HOSTED_RULE_LENGTH} long, its inset taken from that.
 */
export function Divider({vertical, color, inset, testID}: DividerProps) {
  const separator = useColor('separator');
  const hosted = useNativeHost();
  const Component = vertical ? VerticalDivider : HorizontalDivider;
  const modifiers = [
    // First, so the rule's own fill and any inset are within it.
    ...(vertical && hosted ? [height(HOSTED_RULE_LENGTH)] : []),
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
