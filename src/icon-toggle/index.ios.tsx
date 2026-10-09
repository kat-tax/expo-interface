import type {IconToggleProps} from './types';
import {Button, Image, ZStack} from '@expo/ui/swift-ui';
import {accessibilityAddTraits, accessibilityLabel, background, buttonStyle, disabled as disabledMod, frame, hidden, opacity, shapes} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {SelfHosted} from '../host';
import {useColor} from '../theme';
import {TONAL_SIZE} from './shared';

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
  variant = 'plain',
  color,
  offColor,
  size = 24,
  disabled = false,
  offVisibility = 'visible',
  testID,
}: IconToggleProps) {
  const tint = useColor('tint');
  const secondary = useColor('secondaryLabel');
  const pill = useColor('pillBackground');
  const modifiers = [buttonStyle('plain'), accessibilityLabel(label)];
  if (value) modifiers.push(accessibilityAddTraits(['isSelected']));
  if (disabled) modifiers.push(disabledMod(true), opacity(0.4));
  // SwiftUI's `hidden` keeps the frame and takes the button out of hit
  // testing and VoiceOver's tree at once.
  if (offVisibility === 'hidden' && !value) modifiers.push(hidden());
  const image = (
    <Image
      systemName={iosSymbol(value ? activeIcon ?? icon : icon)}
      color={value ? color ?? tint : offColor ?? secondary}
      size={size}
    />
  );
  return (
    <Button onPress={() => onValueChange(!value)} modifiers={modifiers} testID={testID}>
      {variant === 'tonal' ? (
        // The container is the button's label rather than a modifier on the
        // button, so a plain button is pressable to the circle's edge.
        <ZStack modifiers={[frame({width: TONAL_SIZE, height: TONAL_SIZE}), background(pill, shapes.circle())]}>
          {image}
        </ZStack>
      ) : image}
    </Button>
  );
}
