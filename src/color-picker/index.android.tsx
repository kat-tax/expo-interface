import type {ColorPickerProps} from './types';
import type {ModifierConfig} from '@expo/ui/jetpack-compose/modifiers';

import {useEffect, useRef, useState} from 'react';
import {useWindowDimensions} from 'react-native';
import {
  Box,
  Column,
  FlowRow,
  ModalBottomSheet,
  RNHostView,
  Row,
  Spacer,
  Text,
  useMaterialColors,
  type ModalBottomSheetRef,
} from '@expo/ui/jetpack-compose';
import {alpha, background, clickable, clip, fillMaxWidth, padding, Shapes, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';
import {ColorPickerSheet} from './sheet';
import {parseColor, toCss, toHex, useColorValue, well} from './shared';

/** Horizontal inset of the sheet content (the `@expo/ui` `BottomSheet` default). */
const SHEET_INSET = 16;
/** Diameter of a preset swatch, and of its ring when selected. */
const SWATCH = 30;
const SWATCH_INNER = 28;
const SWATCH_SELECTED = 22;
const NONE = '#00000000';

/**
 * Android redraws the iOS row in Compose through and through: a `Row` with
 * the label and, at the trailing edge, the preset swatches and the 28dp
 * color well (a circle in the color, ringed in `separator`). Tapping the row
 * opens the iOS picker redrawn in a Material `ModalBottomSheet`, fully
 * expanded and with the sheet's own swipe gestures off so that dragging
 * across the spectrum and sliders stays with the picker; the sheet lives in
 * its own window, so the row is a plain Compose child of its host and hosts
 * no React Native view of its own (which a recomposing list would re-add).
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  swatches,
  disabled,
  testID,
}: ColorPickerProps) {
  const colors = useMaterialColors();
  const {width} = useWindowDimensions();
  const ring = useColor('separator');
  const labelColor = useColor('label');
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useColorValue(value, onValueChange, supportsOpacity);
  const modifiers: ModifierConfig[] = [fillMaxWidth()];
  if (!disabled) modifiers.push(clickable(() => setOpen(true)));
  if (testID) modifiers.push(testIDModifier(testID));
  const currentHex = toHex({...current, a: 1}, false);

  return (
    <Row verticalAlignment="center" horizontalArrangement="spaceBetween" modifiers={modifiers}>
      {label != null ? (
        <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      ) : <Spacer/>}
      {/* A flow row so a phone's width wraps the swatches instead of squeezing them. */}
      <FlowRow
        verticalArrangement={{spacedBy: 8}}
        horizontalArrangement={{spacedBy: 8}}
        modifiers={disabled ? [alpha(0.4)] : []}>
        {swatches?.map(seed => {
          const selected = toHex(parseColor(seed), false) === currentHex;
          const inner = selected ? SWATCH_SELECTED : SWATCH_INNER;
          return (
            // The ring is a circle behind a smaller circle: a border modifier would be square.
            <Box
              key={seed}
              contentAlignment="center"
              modifiers={[
                size(SWATCH, SWATCH),
                clip(Shapes.Circle),
                background(selected ? labelColor : NONE),
                ...(disabled ? [] : [clickable(() => setCurrent({...parseColor(seed), a: current.a}))]),
                ...(testID ? [testIDModifier(`${testID}-swatch-${seed}`)] : []),
              ]}>
              <Box modifiers={[size(inner, inner), clip(Shapes.Circle), background(seed)]}/>
            </Box>
          );
        })}
        <Box
          contentAlignment="center"
          modifiers={[
            size(well.size, well.size),
            clip(Shapes.Circle),
            background(ring),
            ...(testID ? [testIDModifier(`${testID}-well`)] : []),
          ]}>
          <Box
            modifiers={[
              size(well.size - 2 * well.ring, well.size - 2 * well.ring),
              clip(Shapes.Circle),
              background(toCss(current)),
            ]}
          />
        </Box>
        <PickerSheet open={open} onClose={() => setOpen(false)}>
          <ColorPickerSheet
            title={label ?? 'Colors'}
            value={toHex(current, true)}
            supportsOpacity={supportsOpacity}
            onValueChange={hex => setCurrent(parseColor(hex))}
            onClose={() => setOpen(false)}
            width={width - SHEET_INSET * 2}
            testID={testID ? `${testID}-sheet` : undefined}
          />
        </PickerSheet>
      </FlowRow>
    </Row>
  );
}

/**
 * The Material bottom sheet hosting the picker, mounted while `open` and
 * unmounted after its hide animation (the `@expo/ui` `BottomSheet` pattern).
 * A Compose child of the row: the sheet presents in its own window, so the
 * React Native picker inside it is hosted there, outside the form.
 */
function PickerSheet({open, onClose, children}: React.PropsWithChildren<{open: boolean; onClose: () => void}>) {
  const ref = useRef<ModalBottomSheetRef>(null);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) return;
    let cancelled = false;
    ref.current?.hide().then(() => {
      if (!cancelled) setMounted(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);
  if (!mounted) return null;
  return (
    <ModalBottomSheet ref={ref} onDismissRequest={onClose} skipPartiallyExpanded sheetGesturesEnabled={false}>
      <Column modifiers={[padding(SHEET_INSET, 0, SHEET_INSET, 0)]}>
        <RNHostView matchContents>{children as React.ReactElement}</RNHostView>
      </Column>
    </ModalBottomSheet>
  );
}
