import type {ColorPickerProps} from './types';
import type {ModifierConfig} from '@expo/ui/jetpack-compose/modifiers';

import {useEffect, useRef, useState} from 'react';
import {useWindowDimensions} from 'react-native';
import {
  BasicAlertDialog,
  Box,
  Column,
  DropdownMenu,
  FlowRow,
  ModalBottomSheet,
  RNHostView,
  Row,
  Spacer,
  Text,
  useMaterialColors,
  type ModalBottomSheetRef,
} from '@expo/ui/jetpack-compose';
import {alpha, background, clickable, clip, fillMaxWidth, padding, rotate, Shapes, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {MenuItems} from '../menu/index.android';
import {useColor} from '../theme';
import {NO_COLOR, sameColor, swatchMenu, swatchesOf} from './choices';
import {ColorPickerSheet} from './sheet';
import {parseColor, toCss, toHex, useColorValue, well} from './shared';

/** Horizontal inset of the sheet content (the `@expo/ui` `BottomSheet` default). */
const SHEET_INSET = 16;
/** Diameter of a preset swatch, and of its ring when selected. */
const SWATCH = 30;
const SWATCH_INNER = 28;
const SWATCH_SELECTED = 22;
const NONE = '#00000000';
/** The width of the dialog the picker opens in (`presentation="popover"`), Material's for a dialog of this kind. */
const DIALOG_WIDTH = 328;

/**
 * Android redraws the iOS row in Compose through and through: a `Row` with
 * the label and, at the trailing edge, the preset swatches and the 28dp
 * color well (a circle in the color, ringed in `separator`). Tapping the row
 * opens the iOS picker redrawn in a Material `ModalBottomSheet`, fully
 * expanded and with the sheet's own swipe gestures off so that dragging
 * across the spectrum and sliders stays with the picker; the sheet lives in
 * its own window, so the row is a plain Compose child of its host and hosts
 * no React Native view of its own (which a recomposing list would re-add).
 * Material has no popover: `popover` opens the picker in a dialog, which
 * also lives in a window of its own, over a sheet the row is in. `menu`
 * opens a Material `DropdownMenu` of the swatches from the well, and
 * `inline` draws the picker in the row's place. Each preset carries its
 * name as an unseen Text, which its clickable merges for TalkBack.
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  swatches,
  presentation = 'automatic',
  allowsNone = false,
  disabled,
  testID,
}: ColorPickerProps) {
  const colors = useMaterialColors();
  const {width} = useWindowDimensions();
  const ring = useColor('separator');
  const labelColor = useColor('label');
  const backdrop = useColor('background');
  const stroke = useColor('destructive');
  const fill = useColor('backgroundElement');
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useColorValue(value, onValueChange, supportsOpacity);
  const none = value === NO_COLOR;
  const presets = swatchesOf(swatches);
  const menu = presentation === 'menu';
  const modifiers: ModifierConfig[] = [fillMaxWidth()];
  if (!disabled) modifiers.push(clickable(() => setOpen(true)));
  if (testID) modifiers.push(testIDModifier(testID));

  /** A crossed-out circle: the well and the preset for no color. */
  const crossed = (diameter: number) => (
    <Box contentAlignment="center" modifiers={[size(diameter, diameter), clip(Shapes.Circle), background(backdrop)]}>
      <Box modifiers={[size(2, diameter), rotate(45), background(stroke)]}/>
    </Box>
  );
  const preset = (key: string, name: string, selected: boolean, onPress: () => void, inner: React.ReactNode) => (
    // The ring is a circle behind a smaller circle: a border modifier would be square.
    <Box
      key={key}
      contentAlignment="center"
      modifiers={[
        size(SWATCH, SWATCH),
        clip(Shapes.Circle),
        background(selected ? labelColor : NONE),
        ...(disabled ? [] : [clickable(onPress)]),
        ...(testID ? [testIDModifier(`${testID}-swatch-${key}`)] : []),
      ]}>
      {inner}
      {/* @expo/ui's `semantics` takes no content description, so the name is an unseen Text that the clickable merges. */}
      <Text color={NONE} maxLines={1}>{name}</Text>
    </Box>
  );
  const presetBoxes = [
    ...(allowsNone ? [preset('none', 'No color', none, () => onValueChange(NO_COLOR), crossed(none ? SWATCH_SELECTED : SWATCH_INNER))] : []),
    ...presets.map(({color, name}) => {
      // The ring follows the color held here, which a pick changes at once.
      const selected = !none && sameColor(color, toHex(current, false));
      const inner = selected ? SWATCH_SELECTED : SWATCH_INNER;
      return preset(color, `Color ${name}`, selected, () => setCurrent({...parseColor(color), a: current.a}), (
        <Box modifiers={[size(inner, inner), clip(Shapes.Circle), background(color)]}/>
      ));
    }),
  ];
  const wellBox = (
    <Box
      contentAlignment="center"
      modifiers={[
        size(well.size, well.size),
        clip(Shapes.Circle),
        background(ring),
        ...(testID ? [testIDModifier(`${testID}-well`)] : []),
      ]}>
      {none ? crossed(well.size - 2 * well.ring) : (
        <Box
          modifiers={[
            size(well.size - 2 * well.ring, well.size - 2 * well.ring),
            clip(Shapes.Circle),
            background(toCss(current)),
          ]}
        />
      )}
    </Box>
  );
  const panel = (panelWidth: number, onClose?: () => void) => (
    <ColorPickerSheet
      title={label ?? 'Colors'}
      value={toHex(current, true)}
      supportsOpacity={supportsOpacity}
      onValueChange={hex => setCurrent(parseColor(hex))}
      onClose={onClose}
      width={panelWidth}
      testID={testID ? `${testID}-sheet` : undefined}
    />
  );

  if (presentation === 'inline') {
    return (
      <Column verticalArrangement={{spacedBy: 12}} modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
        {presetBoxes.length > 0 ? <FlowRow verticalArrangement={{spacedBy: 8}} horizontalArrangement={{spacedBy: 8}}>{presetBoxes}</FlowRow> : null}
        <RNHostView matchContents>{panel(width - SHEET_INSET * 2)}</RNHostView>
      </Column>
    );
  }

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
        {menu ? null : presetBoxes}
        {menu ? (
          <DropdownMenu expanded={open} onDismissRequest={() => setOpen(false)}>
            <DropdownMenu.Trigger>{wellBox}</DropdownMenu.Trigger>
            <MenuItems items={swatchMenu(presets, value, allowsNone, supportsOpacity, onValueChange)} onClose={() => setOpen(false)}/>
          </DropdownMenu>
        ) : wellBox}
        {presentation === 'popover' ? (
          open ? (
            <BasicAlertDialog onDismissRequest={() => setOpen(false)}>
              <Column modifiers={[clip(Shapes.RoundedCorner(28)), background(fill), padding(SHEET_INSET, SHEET_INSET, SHEET_INSET, SHEET_INSET)]}>
                <RNHostView matchContents>{panel(DIALOG_WIDTH - SHEET_INSET * 2, () => setOpen(false))}</RNHostView>
              </Column>
            </BasicAlertDialog>
          ) : null
        ) : menu ? null : (
          <PickerSheet open={open} onClose={() => setOpen(false)}>
            {panel(width - SHEET_INSET * 2, () => setOpen(false))}
          </PickerSheet>
        )}
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
