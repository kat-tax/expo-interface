import type {ColorPickerProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {useWindowDimensions} from 'react-native';
import {Button, ColorPicker as SwiftUIColorPicker, HStack, Spacer, Text, VStack, ZStack} from '@expo/ui/swift-ui';
import {accessibilityLabel, background, buttonStyle, disabled as disabledMod, frame, labelsHidden, shapes} from '@expo/ui/swift-ui/modifiers';
import {useColor} from '../theme';
import {chunk, parseColor, swatchesPerLine, toHex} from './shared';

/** Diameter of a preset swatch, and of its ring when selected. */
const SWATCH = 30;
const SWATCH_INNER = 28;
const SWATCH_SELECTED = 22;
const NONE = '#00000000';
/** Width the label and the well take from a row the swatches share with them. */
const INLINE_RESERVED = 180;
/** Width the form's insets take from a line of swatches of its own. */
const LINE_RESERVED = 64;

/**
 * iOS renders SwiftUI's `ColorPicker`: the label with the rainbow-ringed
 * color well at the trailing edge, which opens the system color picker.
 * SwiftUI reports the selection as `#RRGGBBAA` when opacity is supported and
 * `#RRGGBB` otherwise; the other platforms mirror both formats. With
 * `swatches` the row is composed by hand: the label, a spacer, the preset
 * circles (the selected one ringed in the label color) and the picker's
 * well with its own label hidden. More swatches than fit beside the label
 * move to lines of their own beneath it (SwiftUI has no flow layout, so the
 * lines are cut from the window's width).
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
  const {width} = useWindowDimensions();
  const labelColor = useColor('label');
  const modifiers: ViewModifier[] = [];
  if (disabled) modifiers.push(disabledMod(true));
  if (!swatches?.length) {
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
  const current = parseColor(value);
  const currentHex = toHex({...current, a: 1}, false);
  const swatch = (seed: string) => {
    const selected = toHex(parseColor(seed), false) === currentHex;
    const inner = selected ? SWATCH_SELECTED : SWATCH_INNER;
    return (
      <Button
        key={seed}
        onPress={() => onValueChange(toHex({...parseColor(seed), a: current.a}, supportsOpacity))}
        modifiers={[buttonStyle('plain'), accessibilityLabel(`Color ${seed}`)]}>
        <ZStack modifiers={[frame({width: SWATCH, height: SWATCH}), background(selected ? labelColor : NONE, shapes.circle())]}>
          <ZStack modifiers={[frame({width: inner, height: inner}), background(seed, shapes.circle())]}>
            <Spacer/>
          </ZStack>
        </ZStack>
      </Button>
    );
  };
  const labelText = label != null ? <Text>{label}</Text> : null;
  const wellPicker = (
    <SwiftUIColorPicker
      label={label}
      selection={value}
      supportsOpacity={supportsOpacity}
      onSelectionChange={onValueChange}
      modifiers={[labelsHidden()]}
      testID={testID ? `${testID}-well` : undefined}
    />
  );

  // The swatches share the row with the label and the well until they no
  // longer fit — a phone is too narrow for a palette of eight — and then
  // move to lines of their own under it.
  if (swatches.length <= swatchesPerLine(width, INLINE_RESERVED)) {
    return (
      <HStack spacing={8} modifiers={modifiers} testID={testID}>
        {labelText}
        <Spacer/>
        {swatches.map(swatch)}
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
      {chunk(swatches, swatchesPerLine(width, LINE_RESERVED)).map((line, index) => (
        <HStack key={index} spacing={8}>
          {line.map(swatch)}
          <Spacer/>
        </HStack>
      ))}
    </VStack>
  );
}
