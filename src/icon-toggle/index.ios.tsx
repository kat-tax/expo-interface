import type {IconToggleProps} from './types';
import {Button, Image} from '@expo/ui/swift-ui';
import {accessibilityAddTraits, accessibilityLabel, buttonStyle, disabled as disabledMod, opacity} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {useColor} from '../theme';

/**
 * iOS draws a plain SwiftUI `Button` around the symbol — the toggles in
 * Notes and Reminders are exactly that — and adds the `isSelected` trait
 * while it is on, which VoiceOver announces.
 */
export function IconToggle({
  label,
  icon,
  activeIcon,
  value,
  onValueChange,
  color,
  offColor,
  size = 24,
  disabled = false,
  testID,
}: IconToggleProps) {
  const tint = useColor('tint');
  const secondary = useColor('secondaryLabel');
  const modifiers = [buttonStyle('plain'), accessibilityLabel(label)];
  if (value) modifiers.push(accessibilityAddTraits(['isSelected']));
  if (disabled) modifiers.push(disabledMod(true), opacity(0.4));
  return (
    <Button onPress={() => onValueChange(!value)} modifiers={modifiers} testID={testID}>
      <Image
        systemName={iosSymbol(value ? activeIcon ?? icon : icon)}
        color={value ? color ?? tint : offColor ?? secondary}
        size={size}
      />
    </Button>
  );
}
