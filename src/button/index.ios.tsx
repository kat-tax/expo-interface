import type {ButtonProps, ButtonVariant} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';
import {Button as SwiftUIButton, HStack, Image, Text} from '@expo/ui/swift-ui';
import {buttonStyle, buttonBorderShape, controlSize, labelStyle, tint, disabled as disabledMod} from '@expo/ui/swift-ui/modifiers';
import {ICON_GAP, SIZE_ICON, iosSymbol, swiftBorderShape, swiftControlSize} from './shared';
import {onAccent as contrastOf} from '../accent';
import {fillWidth as fillWidthModifiers} from '../fill';
import {useColor} from '../theme';

const VARIANT_STYLE: Record<ButtonVariant, 'borderedProminent' | 'bordered' | 'plain'> = {
  filled: 'borderedProminent',
  outlined: 'bordered',
  text: 'plain',
};

/**
 * iOS renders SwiftUI's native `Button`. The variant maps to a `buttonStyle`
 * modifier and the accent (theme tint by default, red for destructive) is
 * applied with `tint` so the button is branded consistently across platforms.
 */
export function Button({
  label,
  onPress,
  variant = 'filled',
  role = 'default',
  color,
  size = 'medium',
  shape,
  prefixIcon,
  suffixIcon,
  hideLabel = false,
  disabled,
  fillWidth = false,
  testID,
}: ButtonProps) {
  const themeTint = useColor('tint');
  const destructive = useColor('destructive');
  const themeOnAccent = useColor(role === 'destructive' ? 'onDestructive' : 'onTint');
  const hasSuffix = !!suffixIcon && !hideLabel;
  const iconOnly = hideLabel && !!prefixIcon;
  const accent = color ?? (role === 'destructive' ? destructive : themeTint);
  // A custom accent brings its own contrast color for filled content.
  const onAccent = color ? contrastOf(color) : themeOnAccent;
  const iconColor = variant === 'filled' ? onAccent : accent;
  const modifiers: ViewModifier[] = [
    buttonStyle(VARIANT_STYLE[variant]),
    controlSize(swiftControlSize(size)),
    tint(accent),
  ];

  if (shape) modifiers.push(buttonBorderShape(swiftBorderShape(shape)));
  if (disabled) modifiers.push(disabledMod(true));
  if (iconOnly) modifiers.push(labelStyle('iconOnly'));
  // SwiftUI has no trailing-icon `Label`, and a bordered style only paints
  // behind the label, so both cases compose the label by hand: the frame
  // that fills the width goes on the label, not the button.
  if ((hasSuffix || fillWidth) && !iconOnly) {
    return (
      <SwiftUIButton
        role={role === 'destructive' ? 'destructive' : 'default'}
        onPress={onPress}
        modifiers={modifiers}
        testID={testID}>
        <HStack spacing={ICON_GAP} modifiers={fillWidth ? fillWidthModifiers : undefined}>
          {prefixIcon ? <Image systemName={iosSymbol(prefixIcon)} color={iconColor} size={SIZE_ICON[size]}/> : null}
          <Text>{label}</Text>
          {hasSuffix ? <Image systemName={iosSymbol(suffixIcon!)} color={iconColor} size={SIZE_ICON[size]}/> : null}
        </HStack>
      </SwiftUIButton>
    );
  }

  return (
    <SwiftUIButton
      label={label}
      role={role === 'destructive' ? 'destructive' : 'default'}
      systemImage={prefixIcon ? iosSymbol(prefixIcon) : undefined}
      modifiers={modifiers}
      onPress={onPress}
      testID={testID}
    />
  );
}
