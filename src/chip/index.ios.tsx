import type {ChipProps} from './types';
import {Button as SwiftUIButton, Toggle} from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  tint,
  toggleStyle,
  disabled as disabledMod,
} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {useColor} from '../theme';
import {chipKind, nextSelected} from './shared';

/**
 * iOS has no chip, and does not need one: a chip is a capsule-shaped control
 * that is pressed, and SwiftUI has two of those.
 *
 * A chip that can be off is a **`Toggle` in its button style** — the control
 * Apple added for exactly this shape. It is not a styling choice: a toggle
 * carries its on/off state into VoiceOver, and a `Button` that merely changed
 * colour would leave a blind reader unable to tell a chosen filter from an
 * unchosen one.
 *
 * A chip that cannot be off is a bordered `Button` with a capsule border
 * shape, which is what it is.
 */
export function Chip(props: ChipProps) {
  const {label, onPress, selected, icon, disabled, testID} = props;
  const accent = useColor('tint');
  const symbol = icon ? iosSymbol(icon) : undefined;
  const modifiers = [controlSize('small'), buttonBorderShape('capsule'), tint(accent)];
  if (disabled) modifiers.push(disabledMod(true));
  if (chipKind(props) === 'filter') {
    return (
      <Toggle
        isOn={selected}
        label={label}
        systemImage={symbol}
        modifiers={[...modifiers, toggleStyle('button')]}
        onIsOnChange={value => onPress?.(value)}
        testID={testID}
      />
    );
  }
  return (
    <SwiftUIButton
      label={label}
      systemImage={symbol}
      modifiers={[...modifiers, buttonStyle('bordered')]}
      onPress={() => onPress?.(nextSelected(props))}
      testID={testID}
    />
  );
}
