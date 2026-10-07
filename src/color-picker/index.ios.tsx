import type {ReactNode} from 'react';
import type {ColorPickerProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {useWindowDimensions} from 'react-native';
import {Button, ColorPicker as SwiftUIColorPicker, HStack, Menu as SwiftUIMenu, Spacer, Text, VStack, ZStack} from '@expo/ui/swift-ui';
import {accessibilityLabel, background, buttonStyle, disabled as disabledMod, frame, labelsHidden, rotationEffect, shapes} from '@expo/ui/swift-ui/modifiers';
import {MenuItems} from '../menu/index.ios';
import {useColor} from '../theme';
import {NO_COLOR, sameColor, swatchMenu, swatchesOf} from './choices';
import {chunk, parseColor, swatchesPerLine, toHex} from './shared';

/** Diameter of a preset swatch, and of its ring when selected. */
const SWATCH = 30;
const SWATCH_INNER = 28;
const SWATCH_SELECTED = 22;
const NONE = '#00000000';
/** Diameter of the well a swatch menu opens from, and of the color inside its ring. */
const WELL = 28;
const WELL_INNER = 24;
/** Width the label and the well take from a row the swatches share with them. */
const INLINE_RESERVED = 180;
/** Width the form's insets take from a line of swatches of its own. */
const LINE_RESERVED = 64;

/**
 * iOS renders SwiftUI's `ColorPicker`: the label with the rainbow-ringed
 * color well at the trailing edge, which opens the system color picker.
 * SwiftUI reports the selection as `#RRGGBBAA` when opacity is supported and
 * `#RRGGBB` otherwise; the other platforms mirror both formats. With
 * `swatches` (or `allowsNone`) the row is composed by hand: the label, a
 * spacer, the preset circles (the selected one ringed in the label color)
 * and the picker's well with its own label hidden. More swatches than fit
 * beside the label move to lines of their own beneath it (SwiftUI has no
 * flow layout, so the lines are cut from the window's width).
 *
 * The system picker is presented the system's way, a popover on an iPad and
 * a sheet on a phone, and SwiftUI cannot draw it in place: `popover` and
 * `inline` are the row as it is. `menu` opens SwiftUI's own `Menu` of the
 * swatches from a well.
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
  const {width} = useWindowDimensions();
  const labelColor = useColor('label');
  const separator = useColor('separator');
  const backdrop = useColor('background');
  const stroke = useColor('destructive');
  const current = parseColor(value);
  const none = value === NO_COLOR;
  const presets = swatchesOf(swatches);
  const modifiers: ViewModifier[] = [];
  if (disabled) modifiers.push(disabledMod(true));

  /** A crossed-out circle: no color. */
  const crossed = (diameter: number) => (
    <ZStack modifiers={[frame({width: diameter, height: diameter}), background(backdrop, shapes.circle())]}>
      <ZStack modifiers={[frame({width: 2, height: diameter}), background(stroke), rotationEffect(45)]}>
        <Spacer/>
      </ZStack>
    </ZStack>
  );
  const circle = (color: string, diameter: number) => (
    <ZStack modifiers={[frame({width: diameter, height: diameter}), background(color, shapes.circle())]}>
      <Spacer/>
    </ZStack>
  );
  const preset = (key: string, name: string, selected: boolean, onPress: () => void, inner: ReactNode) => (
    <Button key={key} onPress={onPress} modifiers={[buttonStyle('plain'), accessibilityLabel(name)]}>
      <ZStack modifiers={[frame({width: SWATCH, height: SWATCH}), background(selected ? labelColor : NONE, shapes.circle())]}>
        {inner}
      </ZStack>
    </Button>
  );
  const presetButtons = [
    ...(allowsNone ? [preset('none', 'No color', none, () => onValueChange(NO_COLOR), crossed(none ? SWATCH_SELECTED : SWATCH_INNER))] : []),
    ...presets.map(({color, name}) => {
      const selected = sameColor(color, value);
      return preset(color, `Color ${name}`, selected, () => onValueChange(toHex({...parseColor(color), a: current.a}, supportsOpacity)), circle(color, selected ? SWATCH_SELECTED : SWATCH_INNER));
    }),
  ];
  const labelText = label != null ? <Text>{label}</Text> : null;

  if (presentation === 'menu') {
    return (
      <HStack spacing={8} modifiers={modifiers} testID={testID}>
        {labelText}
        <Spacer/>
        <SwiftUIMenu
          label={(
            <ZStack modifiers={[frame({width: WELL, height: WELL}), background(separator, shapes.circle())]}>
              {none ? crossed(WELL_INNER) : circle(toHex(current, supportsOpacity), WELL_INNER)}
            </ZStack>
          )}
          modifiers={[buttonStyle('plain'), accessibilityLabel(label ?? 'Color')]}
          testID={testID ? `${testID}-well` : undefined}>
          <MenuItems items={swatchMenu(presets, value, allowsNone, supportsOpacity, onValueChange)}/>
        </SwiftUIMenu>
      </HStack>
    );
  }

  const lines = (reserved: number) => chunk(presetButtons, swatchesPerLine(width, reserved)).map((line, index) => (
    <HStack key={index} spacing={8}>
      {line}
      <Spacer/>
    </HStack>
  ));

  if (presetButtons.length === 0) {
    return (
      <SwiftUIColorPicker
        label={label}
        selection={value}
        supportsOpacity={supportsOpacity}
        onSelectionChange={onValueChange}
        modifiers={modifiers}
        testID={testID}
      />
    );
  }
  const wellPicker = (
    <SwiftUIColorPicker
      label={label}
      selection={none ? NONE : value}
      supportsOpacity={supportsOpacity}
      onSelectionChange={onValueChange}
      modifiers={[labelsHidden()]}
      testID={testID ? `${testID}-well` : undefined}
    />
  );

  // The swatches share the row with the label and the well until they no
  // longer fit — a phone is too narrow for a palette of eight — and then
  // move to lines of their own under it.
  if (presetButtons.length <= swatchesPerLine(width, INLINE_RESERVED)) {
    return (
      <HStack spacing={8} modifiers={modifiers} testID={testID}>
        {labelText}
        <Spacer/>
        {presetButtons}
        {wellPicker}
      </HStack>
    );
  }

  return (
    <VStack spacing={8} modifiers={modifiers} testID={testID}>
      <HStack spacing={8}>
        {labelText}
        <Spacer/>
        {wellPicker}
      </HStack>
      {lines(LINE_RESERVED)}
    </VStack>
  );
}
