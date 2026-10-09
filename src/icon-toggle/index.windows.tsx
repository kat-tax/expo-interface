import type {IconToggleProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlToggleButton from '../windows/specs/ExpoInterfaceToggleButtonNativeComponent';
import {glyphOf, useXamlProps} from '../windows';
import {useColor} from '../theme';
import {TONAL_SIZE} from './shared';

/**
 * Windows renders a WinUI 3 `ToggleButton` holding a `FontIcon` in a XAML
 * island. The glyph swaps with the state — the outline off, the solid form
 * on — in the two colors, as the toggle reads on every other platform.
 */
export function IconToggle({
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
  const xaml = useXamlProps();
  const pill = useColor('pillBackground');
  const glyph = glyphOf(icon);
  if (!glyph) return null;
  const hidden = offVisibility === 'hidden' && !value;
  const tonal = variant === 'tonal';
  const toggle = (
    <XamlToggleButton
      value={value}
      glyph={glyph}
      activeGlyph={glyphOf(activeIcon) ?? glyph}
      size={size}
      color={color}
      offColor={offColor}
      label={label}
      disabled={disabled}
      hidden={hidden}
      onValueChange={event => onValueChange(event.nativeEvent.value)}
      style={tonal ? undefined : styles.hug}
      testID={testID}
      {...xaml}
    />
  );
  if (!tonal) return toggle;
  // The island is the glyph and its own padding, so the container is drawn
  // around it. It keeps its box while the control is hidden, with no fill.
  return (
    <View style={[styles.tonal, {backgroundColor: hidden ? 'transparent' : pill}]}>
      {toggle}
    </View>
  );
}

const styles = StyleSheet.create({
  hug: {alignSelf: 'flex-start'},
  tonal: {
    alignSelf: 'flex-start',
    width: TONAL_SIZE,
    height: TONAL_SIZE,
    borderRadius: TONAL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
