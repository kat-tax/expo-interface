import type {ButtonProps, ButtonVariant} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';
import {useContext} from 'react';
import {Button as SwiftUIButton, HStack, Image, ProgressView, Spacer, Text} from '@expo/ui/swift-ui';
import {accessibilityAddTraits, accessibilityLabel, buttonStyle, buttonBorderShape, contentShape, controlSize, labelStyle, onTapGesture, padding, progressViewStyle, shapes, tint, disabled as disabledMod} from '@expo/ui/swift-ui/modifiers';
import {ICON_GAP, SIZE_ICON, iosSymbol, swiftBorderShape, swiftControlSize} from './shared';
import {onAccent as contrastOf} from '../accent';
import {fillWidth as fillWidthModifiers} from '../fill';
import {FieldRowContext} from '../field-group/row-context';
import {SelfHosted} from '../host';
import {useColor} from '../theme';

const VARIANT_STYLE: Record<ButtonVariant, 'borderedProminent' | 'bordered' | 'plain'> = {
  filled: 'borderedProminent',
  outlined: 'bordered',
  text: 'plain',
};

/**
 * iOS renders SwiftUI's native `Button`, in a host of its own where there is
 * none above it, so a button can be placed in a React Native layout like any
 * element.
 */
export function Button(props: ButtonProps) {
  // A button that fills its width fills the row already.
  const row = useContext(FieldRowContext) && !props.fillWidth;
  return (
    <SelfHosted fit={!props.fillWidth}>
      {row ? <RowButton {...props}/> : <NativeButton {...props}/>}
    </SelfHosted>
  );
}

/**
 * A button that is a `FieldGroup` row of its own. SwiftUI gives the `Form`
 * cell's frame to the button, so it reports the whole row as its frame, but a
 * bordered button takes taps only on its capsule and a plain one only on its
 * text. So the button stands at the leading edge of a stack the row's width,
 * drawn as it is anywhere else, and the stack's rectangle takes a tap on the
 * rest of the row while the button can be pressed, as a `Form`'s own button
 * rows do. A tap on the button itself is still the button's: SwiftUI gives a
 * child's gesture the first claim.
 */
function RowButton(props: ButtonProps) {
  const {onPress, disabled, loading} = props;
  const modifiers: ViewModifier[] = [contentShape(shapes.rectangle())];
  if (onPress && !disabled && !loading) modifiers.push(onTapGesture(onPress));
  return (
    <HStack spacing={0} modifiers={modifiers}>
      <NativeButton {...props}/>
      <Spacer minLength={0}/>
    </HStack>
  );
}

/**
 * The SwiftUI `Button`. The variant maps to a `buttonStyle` modifier and the
 * accent (theme tint by default, red for destructive) is applied with `tint`
 * so the button is branded consistently across platforms. While `loading`
 * the system's spinner stands before the label and the button is disabled.
 */
function NativeButton({
  label,
  onPress,
  variant = 'filled',
  role = 'default',
  color,
  tone = 'accent',
  size = 'medium',
  shape,
  iconSize: iconSizeProp,
  prefixIcon,
  suffixIcon,
  hideLabel = false,
  disabled,
  pressed,
  loading = false,
  fillWidth = false,
  testID,
}: ButtonProps) {
  // A toggle that is on is drawn filled, whatever its variant.
  const shown = pressed ? 'filled' : variant;
  const themeTint = useColor('tint');
  const themeLabel = useColor('label');
  const destructive = useColor('destructive');
  const themeOnAccent = useColor(role === 'destructive' ? 'onDestructive' : 'onTint');
  const hasSuffix = !!suffixIcon && !hideLabel;
  const iconOnly = hideLabel && !!prefixIcon;
  // The label tone only applies to the text variant: a tool, not a call to action.
  const labelTone = shown === 'text' && tone === 'label' && role !== 'destructive';
  const accent = color ?? (role === 'destructive' ? destructive : labelTone ? themeLabel : themeTint);
  // A custom accent brings its own contrast color for filled content.
  const onAccent = color ? contrastOf(color) : themeOnAccent;
  const iconColor = shown === 'filled' ? onAccent : accent;
  const iconSize = iconSizeProp ?? SIZE_ICON[size];
  const buttonRole = role === 'destructive' ? 'destructive' : 'default';
  const modifiers: ViewModifier[] = [
    buttonStyle(VARIANT_STYLE[shown]),
    controlSize(swiftControlSize(size)),
    tint(accent),
  ];

  if (shape) modifiers.push(buttonBorderShape(swiftBorderShape(shape)));
  // The bar size: exactly the content, so the button doesn't set the bar's height.
  if (size === 'inline') modifiers.push(padding({all: 0}));
  if (disabled || loading) modifiers.push(disabledMod(true));
  // VoiceOver says a toggle that is on is selected.
  if (pressed) modifiers.push(accessibilityAddTraits(['isSelected']));
  if (iconOnly && !loading) modifiers.push(labelStyle('iconOnly'));

  // The system's spinner in the icon's place, in the content's color.
  const spinner = loading ? (
    <ProgressView modifiers={[progressViewStyle('circular'), controlSize('small'), tint(iconColor)]}/>
  ) : null;

  // A `systemImage` label takes its size from the control size, so an icon
  // sized on its own (a header action's 22pt symbol) is composed by hand, as
  // is the spinner that stands in for the icon.
  if (iconOnly && (iconSizeProp !== undefined || loading)) {
    return (
      <SwiftUIButton
        role={buttonRole}
        onPress={onPress}
        modifiers={[...modifiers, accessibilityLabel(label)]}
        testID={testID}>
        {spinner ?? <Image systemName={iosSymbol(prefixIcon!)} color={iconColor} size={iconSize}/>}
      </SwiftUIButton>
    );
  }

  // SwiftUI has no trailing-icon `Label`, and a bordered style only paints
  // behind the label, so both cases compose the label by hand: the frame
  // that fills the width goes on the label, not the button. A spinner
  // composes the same way.
  if ((hasSuffix || fillWidth || loading) && !iconOnly) {
    return (
      <SwiftUIButton
        role={buttonRole}
        onPress={onPress}
        modifiers={modifiers}
        testID={testID}>
        <HStack spacing={ICON_GAP} modifiers={fillWidth ? fillWidthModifiers : undefined}>
          {spinner ?? (prefixIcon ? <Image systemName={iosSymbol(prefixIcon)} color={iconColor} size={iconSize}/> : null)}
          <Text>{label}</Text>
          {hasSuffix ? <Image systemName={iosSymbol(suffixIcon!)} color={iconColor} size={iconSize}/> : null}
        </HStack>
      </SwiftUIButton>
    );
  }

  return (
    <SwiftUIButton
      label={label}
      role={buttonRole}
      systemImage={prefixIcon ? iosSymbol(prefixIcon) : undefined}
      modifiers={modifiers}
      onPress={onPress}
      testID={testID}
    />
  );
}
