import type {SwitchProps} from './types';

import {Row, Switch as ComposeSwitch, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, graphicsLayer, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';

// Material 3's Switch has a fixed size; scale it down visually while keeping it
// pinned to the trailing edge (transformOrigin at the right).
const SCALE = 0.80;

/**
 * The stock universal switch packs the label and toggle tightly together. Here
 * the row fills the available width and pushes the Material switch to the
 * trailing edge, mirroring the iOS Form row.
 */
export function Switch({
  label,
  value,
  onValueChange,
  disabled,
  accentColor,
  testID,
}: SwitchProps) {
  const colors = useMaterialColors();
  const toggle = (
    <ComposeSwitch
      value={value}
      onCheckedChange={disabled ? undefined : onValueChange}
      enabled={!disabled}
      colors={accentColor ? {checkedTrackColor: accentColor} : undefined}
      modifiers={[
        graphicsLayer({scaleX: SCALE, scaleY: SCALE, transformOriginX: 1}),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}
    />
  );

  if (label == null) return toggle;

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
      modifiers={[fillMaxWidth()]}>
      <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      {toggle}
    </Row>
  );
}
