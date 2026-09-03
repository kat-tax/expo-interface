import type {ColorPickerProps} from './types';
import type {ModifierConfig} from '@expo/ui/jetpack-compose/modifiers';

import {useEffect, useRef, useState} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {Image} from 'expo-image';
import {
  Column,
  Host,
  ModalBottomSheet,
  RNHostView,
  Row,
  Spacer,
  Text,
  useMaterialColors,
  type ModalBottomSheetRef,
} from '@expo/ui/jetpack-compose';
import {alpha, clickable, fillMaxWidth, padding, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {ColorPickerSheet} from './sheet';
import {parseColor, ringSvg, svgDataUri, toCss, toHex, useColorValue, well} from './shared';

const RING = svgDataUri(ringSvg());
/** Horizontal inset of the sheet content (the `@expo/ui` `BottomSheet` default). */
const SHEET_INSET = 16;

/**
 * Android redraws the iOS row: a Compose `Row` with the label and, hosted as
 * a React Native view, the 28dp color well (rainbow ring, transparent gap,
 * color swatch). Tapping the row opens the iOS picker redrawn in a Material
 * `ModalBottomSheet`, fully expanded and with the sheet's own swipe gestures
 * off so that dragging across the spectrum and sliders stays with the picker.
 * The sheet lives in the same hosted subtree as the well, so the row stays a
 * plain Compose child of its `Host`.
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  disabled,
  testID,
}: ColorPickerProps) {
  const colors = useMaterialColors();
  const {width} = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useColorValue(value, onValueChange, supportsOpacity);
  const modifiers: ModifierConfig[] = [fillMaxWidth()];
  if (!disabled) modifiers.push(clickable(() => setOpen(true)));
  if (testID) modifiers.push(testIDModifier(testID));

  return (
    <Row verticalAlignment="center" horizontalArrangement="spaceBetween" modifiers={modifiers}>
      {label != null ? (
        <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      ) : <Spacer/>}
      <RNHostView matchContents modifiers={disabled ? [alpha(0.4)] : []}>
        {/* `box-none` lets the tap fall through to the Compose row's `clickable`. */}
        <View style={styles.well} pointerEvents="box-none" accessibilityLabel={`Selected color ${toHex(current, supportsOpacity)}`}>
          <View style={styles.face} pointerEvents="none">
            <Image source={{uri: RING}} style={StyleSheet.absoluteFill} contentFit="fill"/>
            <View style={[styles.swatch, {backgroundColor: toCss(current)}]}/>
          </View>
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
        </View>
      </RNHostView>
    </Row>
  );
}

/**
 * The Material bottom sheet hosting the picker, mounted while `open` and
 * unmounted after its hide animation (the `@expo/ui` `BottomSheet` pattern).
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
    <Host style={styles.sheetHost} pointerEvents="none">
      <ModalBottomSheet ref={ref} onDismissRequest={onClose} skipPartiallyExpanded sheetGesturesEnabled={false}>
        <Column modifiers={[padding(SHEET_INSET, 0, SHEET_INSET, 0)]}>
          <RNHostView matchContents>{children as React.ReactElement}</RNHostView>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}

const inner = well.size - 2 * (well.ring + well.gap);

const styles = StyleSheet.create({
  well: {width: well.size, height: well.size},
  face: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center'},
  swatch: {width: inner, height: inner, borderRadius: inner / 2},
  sheetHost: {position: 'absolute'},
});
