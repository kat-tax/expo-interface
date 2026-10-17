import type {CheckboxProps} from './types';

import {Checkbox as ComposeCheckbox, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, paddingAll, semantics, testID as testIDModifier, toggleable} from '@expo/ui/jetpack-compose/modifiers';
import {onAccent} from '../accent';
import {useColor} from '../theme';

// Material lays its box out 48dp across with a click of its own (the touch
// target) and 24dp without one, so a box the row toggles is padded to sit
// where a box with a click does.
const TARGET_INSET = 12;

/** What a disabled box is handed, so that Compose reports it as a checkbox that is disabled. */
const inert = () => {};

/**
 * Android renders the Material 3 `Checkbox`. The row fills the available
 * width and pins the box to the trailing edge, mirroring the iOS Form row,
 * and the checked state is colored with the live accent seed so it matches
 * the iOS glyph and the web `accent-color` — including inside sheets whose
 * native host is not seeded.
 *
 * One node is the checkbox, and it carries the testID. Labelled and enabled,
 * that is the `toggleable` row, named by its label's text, and the box is
 * handed no `onCheckedChange`, so `@expo/ui` gives it no click and it is no
 * node of its own. A disabled row cannot be the control (`toggleable` takes
 * no `enabled`), so labelled and disabled, the box is: handed a click it
 * never fires and `enabled={false}`, which Compose reports as a disabled
 * checkbox, named by the label as its content description. Unlabelled, the
 * box is the control in both states.
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
  const tag = testID ? [testIDModifier(testID)] : [];
  const rowToggles = label != null && !disabled;
  const box = (
    <ComposeCheckbox
      value={value}
      onCheckedChange={rowToggles ? undefined : disabled ? inert : onValueChange}
      enabled={!disabled}
      colors={{
        checkedColor: accent,
        checkmarkColor: onAccent(accent),
        uncheckedColor: colors.onSurfaceVariant,
      }}
      modifiers={
        rowToggles
          ? [paddingAll(TARGET_INSET)]
          : [...(label != null ? [semantics({contentDescription: label})] : []), ...tag]
      }
    />
  );

  if (label == null) return box;

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
      modifiers={[
        fillMaxWidth(),
        ...(rowToggles ? [toggleable(value, () => onValueChange(!value), {role: 'checkbox'}), ...tag] : []),
      ]}>
      <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      {box}
    </Row>
  );
}
