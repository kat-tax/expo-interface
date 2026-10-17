import type {CheckboxProps} from './types';

import {Box, Checkbox as ComposeCheckbox, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, paddingAll, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {onAccent} from '../accent';
import {ToggleCover} from '../a11y/cover';
import {useColor} from '../theme';

// Material lays its box out 48dp across with a click of its own (the touch
// target) and 24dp without one, so a box under the cover is padded to sit
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
 * With a label, the control a screen reader is handed is a `ToggleCover`
 * laid over the row: one node with the checkbox role, named by the label,
 * with the state, the press and the testID, enabled or not. A row that
 * toggles would hold its label's text and so could not carry its own role.
 * The whole row toggles, and the box under the cover only draws: handed no
 * `onCheckedChange`, `@expo/ui` gives it no click. Unlabelled, the box is
 * the control, a node with no children that carries its own role.
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
  const boxColors = {
    checkedColor: accent,
    checkmarkColor: onAccent(accent),
    uncheckedColor: colors.onSurfaceVariant,
  };

  if (label == null) {
    return (
      <ComposeCheckbox
        value={value}
        onCheckedChange={disabled ? inert : onValueChange}
        enabled={!disabled}
        colors={boxColors}
        modifiers={testID ? [testIDModifier(testID)] : []}
      />
    );
  }

  return (
    <Box contentAlignment="centerStart" modifiers={[fillMaxWidth()]}>
      <Row
        verticalAlignment="center"
        horizontalArrangement="spaceBetween"
        modifiers={[fillMaxWidth()]}>
        <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
        <ComposeCheckbox value={value} enabled={!disabled} colors={boxColors} modifiers={[paddingAll(TARGET_INSET)]}/>
      </Row>
      <ToggleCover role="checkbox" value={value} onValueChange={onValueChange} disabled={disabled} label={label} testID={testID}/>
    </Box>
  );
}
