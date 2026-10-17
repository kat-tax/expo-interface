import type {SwitchProps} from './types';

import {useState} from 'react';
import {Box, Column, Row, Spacer, Switch as ComposeSwitch, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {alpha, fillMaxWidth, graphicsLayer, height, onSizeChanged, width} from '@expo/ui/jetpack-compose/modifiers';
import {ToggleCover} from '../a11y/cover';
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
 * The control a screen reader is handed is a `ToggleCover` laid over the
 * row, not the Material switch, which always has a semantic child (its
 * thumb) and so cannot carry its own role: one node with the switch role,
 * named by the label, with the state, the press and the testID. The whole
 * row toggles, as Material's switch rows do.
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
  const [measured, setMeasured] = useState<Measured>({});
  const toggle = (
    <ComposeSwitch
      value={value}
      enabled={!disabled}
      colors={{
        checkedTrackColor: accentColor ?? tint,
        checkedThumbColor: THUMB_ON,
      }}
      modifiers={[graphicsLayer({scaleX: SCALE, scaleY: SCALE, transformOriginX: 1})]}
    />
  );
  const cover = <ToggleCover role="switch" value={value} onValueChange={onValueChange} disabled={disabled} label={label} testID={testID}/>;

  if (label == null) {
    return (
      <Box>
        {toggle}
        {cover}
      </Box>
    );
  }

  const titleColor = disabled ? colors.onSurfaceVariant : colors.onSurface;
  const measure = (next: Measured) => setMeasured(previous => ({...previous, ...next}));
  // The supporting text is drawn transparent beside the switch, under the
  // cover, holding its place, and again over the cover where it is read, as
  // text a reader reaches after the switch; over the cover it takes no press
  // of its own, so a press on it still toggles the row. The texts' width and
  // the title's height above it place the second where the first is.
  const {width: across, title: down} = measured;
  const placed = supporting !== undefined && across !== undefined && down !== undefined;
  return (
    <Box contentAlignment="centerStart" modifiers={[fillMaxWidth()]}>
      <Row
        verticalAlignment="center"
        horizontalArrangement="spaceBetween"
        modifiers={[fillMaxWidth()]}>
        {supporting !== undefined ? (
          <Column modifiers={[onSizeChanged(({width: across}) => measure({width: across}))]}>
            <Text color={titleColor} modifiers={[onSizeChanged(({height: down}) => measure({title: down}))]}>{label}</Text>
            <Text style={{typography: 'bodySmall'}} modifiers={[alpha(0)]}>{supporting}</Text>
          </Column>
        ) : <Text color={titleColor}>{label}</Text>}
        {toggle}
      </Row>
      {cover}
      {placed ? (
        <Column modifiers={[width(across)]}>
          <Spacer modifiers={[height(down)]}/>
          <Text color={colors.onSurfaceVariant} style={{typography: 'bodySmall'}}>{supporting}</Text>
        </Column>
      ) : null}
    </Box>
  );
}

/** Where the supporting text sits beside the switch: the texts' width, and the title's height above it. */
interface Measured {
  width?: number;
  title?: number;
}
