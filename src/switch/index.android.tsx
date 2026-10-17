import type {SwitchProps} from './types';

import {Column, Row, Switch as ComposeSwitch, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, graphicsLayer, semantics, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {SelfHosted} from '../host';
import {useColor} from '../theme';

// Material 3's Switch has a fixed size; scale it down visually while keeping it
// pinned to the trailing edge (transformOrigin at the right).
const SCALE = 0.80;

// iOS switches use a white thumb when on; M3 defaults to `onPrimary`.
const THUMB_ON = '#FFFFFF';

/**
 * The Material 3 `Switch`, in a host of its own where there is none above
 * it: the width of its container with a label, of the switch without.
 */
export function Switch(props: SwitchProps) {
  return (
    <SelfHosted fit={props.label == null}>
      <NativeSwitch {...props}/>
    </SelfHosted>
  );
}

/**
 * The stock universal switch packs the label and toggle tightly together. Here
 * the row fills the available width and pushes the Material switch to the
 * trailing edge, mirroring the iOS Form row. The "on" state is colored with
 * the live accent seed (matching the iOS Host `tint` cascade and the web
 * `--color-tint` default) instead of the host's tonal M3 primary, so the
 * switch reads identically across platforms — including inside sheets whose
 * native host is not seeded.
 *
 * The label names the switch itself, as its content description: the drawn
 * label is a text beside the switch, not part of it, so without one the
 * switch is a control with no name. The row stays a plain `Row` with no press
 * of its own: `@expo/ui`'s Compose `Switch` always wires `onCheckedChange`
 * natively (it has no switch without a click, as its `Checkbox` has), so a
 * `toggleable` row would be a second switch node beside the first.
 */
function NativeSwitch({
  label,
  supporting,
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
        ...(label != null ? [semantics({contentDescription: label})] : []),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}
    />
  );

  if (label == null) return toggle;

  const title = <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>;
  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
      modifiers={[fillMaxWidth()]}>
      {supporting !== undefined ? (
        <Column>
          {title}
          <Text color={colors.onSurfaceVariant} style={{typography: 'bodySmall'}}>{supporting}</Text>
        </Column>
      ) : title}
      {toggle}
    </Row>
  );
}
