import type {SwitchProps} from './types';

import {Row, Switch as ComposeSwitch, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, graphicsLayer, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

// Material 3's Switch has a fixed size; scale it down visually while keeping it
// pinned to the trailing edge (transformOrigin at the right).
const SCALE = 0.80;

// iOS switches use a white thumb when on; M3 defaults to `onPrimary`.
const THUMB_ON = '#FFFFFF';

/**
 * The stock universal switch packs the label and toggle tightly together. Here
 * the row fills the available width and pushes the Material switch to the
 * trailing edge, mirroring the iOS Form row. The "on" state is colored with
 * the live accent seed (matching the iOS Host `tint` cascade and the web
 * `--color-tint` default) instead of the host's tonal M3 primary, so the
 * switch reads identically across platforms — including inside sheets whose
 * native host is not seeded.
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
  const tint = useColor('tint');
  const toggle = (
    <ComposeSwitch
      value={value}
      onCheckedChange={disabled ? undefined : onValueChange}
      enabled={!disabled}
      colors={{
        checkedTrackColor: accentColor ?? tint,
        checkedThumbColor: THUMB_ON,
      }}
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
