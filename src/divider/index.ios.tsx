import type {DividerProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Divider as SwiftUIDivider} from '@expo/ui/swift-ui';
import {background, padding} from '@expo/ui/swift-ui/modifiers';
import {SelfHosted} from '../host';

/**
 * iOS renders SwiftUI's `Divider`, which is horizontal inside a `VStack` /
 * `Form` and vertical inside an `HStack` on its own — `vertical` only picks
 * the inset axis here, the surrounding stack decides the orientation. A custom
 * `color` is painted with a `background` modifier (dividers take no tint).
 *
 * Outside a host the rule mounts one of its own, so it draws between React
 * Native views too: the width of its container for a horizontal rule, the
 * height of its row for a vertical one.
 */
export function Divider({vertical, color, inset, testID}: DividerProps) {
  const modifiers: ViewModifier[] = [];
  if (inset) modifiers.push(padding(vertical ? {top: inset} : {leading: inset}));
  if (color) modifiers.push(background(color));
  return (
    <SelfHosted fit={vertical ? 'width' : false}>
      <SwiftUIDivider modifiers={modifiers} testID={testID}/>
    </SelfHosted>
  );
}
