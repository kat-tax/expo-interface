import type {ColorPickerProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Button, ColorPicker as SwiftUIColorPicker, HStack, Spacer, Text, ZStack} from '@expo/ui/swift-ui';
import {accessibilityLabel, background, buttonStyle, disabled as disabledMod, frame, labelsHidden, shapes} from '@expo/ui/swift-ui/modifiers';
import {useColor} from '../theme';
import {parseColor, toHex} from './shared';

/** Diameter of a preset swatch, and of its ring when selected. */
const SWATCH = 30;
const SWATCH_INNER = 28;
const SWATCH_SELECTED = 22;
const NONE = '#00000000';

/**
 * iOS renders SwiftUI's `ColorPicker`: the label with the rainbow-ringed
 * color well at the trailing edge, which opens the system color picker.
 * SwiftUI reports the selection as `#RRGGBBAA` when opacity is supported and
 * `#RRGGBB` otherwise; the other platforms mirror both formats. With
 * `swatches` the row is composed by hand: the label, a spacer, the preset
 * circles (the selected one ringed in the label color) and the picker's
 * well with its own label hidden.
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
  return (
    <HStack spacing={8} modifiers={modifiers} testID={testID}>
      {label != null ? <Text>{label}</Text> : null}
      <Spacer/>
      {swatches.map(seed => {
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
      })}
      <SwiftUIColorPicker
        label={label}
        selection={value}
        supportsOpacity={supportsOpacity}
        onSelectionChange={onValueChange}
        modifiers={[labelsHidden()]}
        testID={testID ? `${testID}-well` : undefined}
      />
    </HStack>
  );
}
