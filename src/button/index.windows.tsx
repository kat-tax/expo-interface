import type {ButtonProps} from './types';
import {StyleSheet} from 'react-native';
import XamlButton from '../windows/specs/ExpoInterfaceButtonNativeComponent';
import {glyphOf, useXamlProps} from '../windows';
import {SIZE_ICON} from './shared';

/**
 * Windows renders a WinUI 3 `Button` in a XAML island (`ExpoInterfaceButton`,
 * see `windows/ExpoInterface/Button.cpp`). The variant maps to the Fluent
 * button styles — the accent button for `filled`, the standard one for
 * `outlined`, a transparent one for `text` — and the accent (the kit's seed,
 * red for the destructive role) is applied through the island's accent
 * resources, so the button is branded like its iOS and Android twins.
 *
 * The island measures the control, so the button hugs its content unless
 * `fillWidth` stretches it. Icons are Segoe Fluent Icons glyphs.
 */
export function Button({
  label,
  onPress,
  variant = 'filled',
  role = 'default',
  color,
  tone = 'accent',
  size = 'medium',
  shape,
  iconSize,
  prefixIcon,
  suffixIcon,
  hideLabel = false,
  disabled,
  fillWidth = false,
  testID,
}: ButtonProps) {
  const xaml = useXamlProps();
  const glyph = glyphOf(prefixIcon);
  // The label is dropped only when there is a glyph to stand in for it, so a
  // `hideLabel` for a token with no Fluent glyph still reads.
  const iconOnly = hideLabel && !!glyph;
  return (
    <XamlButton
      label={label}
      glyph={glyph}
      glyphAfter={iconOnly ? undefined : glyphOf(suffixIcon)}
      iconOnly={iconOnly}
      variant={variant}
      buttonRole={role}
      tone={tone}
      color={color}
      size={size}
      shape={shape ?? 'default'}
      glyphSize={iconSize ?? SIZE_ICON[size]}
      fillWidth={fillWidth}
      disabled={disabled}
      onPress={onPress ? () => onPress() : undefined}
      style={fillWidth ? styles.fill : styles.hug}
      testID={testID}
      {...xaml}
    />
  );
}

const styles = StyleSheet.create({
  // The island reports the control's own size; hugging keeps Yoga from
  // stretching it across a column.
  hug: {alignSelf: 'flex-start'},
  fill: {alignSelf: 'stretch'},
});
