import type {CheckboxProps} from './types';

import {Checkbox as ComposeCheckbox, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, testID as testIDModifier, toggleable} from '@expo/ui/jetpack-compose/modifiers';
import {onAccent} from '../accent';
import {useColor} from '../theme';

/**
 * Android renders the Material 3 `Checkbox`. The row fills the available
 * width and pins the box to the trailing edge, mirroring the iOS Form row,
 * and the checked state is colored with the live accent seed so it matches
 * the iOS glyph and the web `accent-color` — including inside sheets whose
 * native host is not seeded.
 */
export function Checkbox({
  label,
  value,
  onValueChange,
  disabled,
  accentColor,
  testID,
}: CheckboxProps) {
  const colors = useMaterialColors();
  const tint = useColor('tint');
  const accent = accentColor ?? tint;
  const box = (
    <ComposeCheckbox
      value={value}
      onCheckedChange={disabled ? undefined : onValueChange}
      enabled={!disabled}
      colors={{
        checkedColor: accent,
        checkmarkColor: onAccent(accent),
        uncheckedColor: colors.onSurfaceVariant,
      }}
      modifiers={testID ? [testIDModifier(testID)] : []}
    />
  );

  if (label == null) return box;

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
      modifiers={[
        fillMaxWidth(),
        ...(disabled ? [] : [toggleable(value, () => onValueChange(!value), {role: 'checkbox'})]),
      ]}>
      <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      {box}
    </Row>
  );
}
