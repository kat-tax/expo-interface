import type {IconToggleProps} from './types';
import XamlToggleButton from '../windows/specs/ExpoInterfaceToggleButtonNativeComponent';
import {glyphOf, useXamlProps} from '../windows';

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
  color,
  offColor,
  size = 24,
  disabled = false,
  testID,
}: IconToggleProps) {
  const xaml = useXamlProps();
  const glyph = glyphOf(icon);
  if (!glyph) return null;
  return (
    <XamlToggleButton
      value={value}
      glyph={glyph}
      activeGlyph={glyphOf(activeIcon) ?? glyph}
      size={size}
      color={color}
      offColor={offColor}
      label={label}
      disabled={disabled}
      onValueChange={event => onValueChange(event.nativeEvent.value)}
      style={{alignSelf: 'flex-start'}}
      testID={testID}
      {...xaml}
    />
  );
}
