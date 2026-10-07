import type {IconToggleProps} from './types';
import {Button, Image} from '@expo/ui/swift-ui';
import {accessibilityAddTraits, accessibilityLabel, buttonStyle, disabled as disabledMod, hidden, opacity} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {SelfHosted} from '../host';
import {useColor} from '../theme';

/**
 * iOS draws a plain SwiftUI `Button` around the symbol — the toggles in
 * Notes and Reminders are exactly that — and adds the `isSelected` trait
 * while it is on, which VoiceOver announces. In a host of its own where
 * there is none above it, so the toggle can sit in a React Native layout.
 */
export function IconToggle(props: IconToggleProps) {
  return (
    <SelfHosted>
      <NativeIconToggle {...props}/>
    </SelfHosted>
  );
}

function NativeIconToggle({
  label,
  icon,
  activeIcon,
  value,
  onValueChange,
  color,
  offColor,
  size = 24,
  disabled = false,
  offVisibility = 'visible',
  testID,
}: IconToggleProps) {
  const tint = useColor('tint');
  const secondary = useColor('secondaryLabel');
  const modifiers = [buttonStyle('plain'), accessibilityLabel(label)];
  if (value) modifiers.push(accessibilityAddTraits(['isSelected']));
  if (disabled) modifiers.push(disabledMod(true), opacity(0.4));
  // SwiftUI's `hidden` keeps the frame and takes the button out of hit
  // testing and VoiceOver's tree at once.
  if (offVisibility === 'hidden' && !value) modifiers.push(hidden());
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
