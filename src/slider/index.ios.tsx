import type {SliderProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {HStack, Slider as SwiftUISlider, Text} from '@expo/ui/swift-ui';
import {disabled as disabledMod, foregroundStyle, tint} from '@expo/ui/swift-ui/modifiers';
import {useColor} from '../theme';

/**
 * iOS renders SwiftUI's `Slider`. The Host-level `tint` cascade colors it with
 * the accent seed; `accentColor` overrides that per instance. With a `label`
 * the row is an `HStack` of the label and the slider, the Form row look the
 * other platforms emulate. Drop it straight into a `FieldGroup.Section`.
 */
export function Slider({
  label,
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 1,
  step,
  disabled,
  accentColor,
  testID,
}: SliderProps) {
  const labelColor = useColor(disabled ? 'secondaryLabel' : 'label');
  const modifiers: ViewModifier[] = [];
  if (accentColor) modifiers.push(tint(accentColor));
  if (disabled) modifiers.push(disabledMod(true));

  const slider = (
    <SwiftUISlider
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
      onEditingChanged={
        onSlidingComplete ? editing => { if (!editing) onSlidingComplete(value); } : undefined
      }
      modifiers={modifiers}
      testID={testID}
    />
  );

  if (label == null) return slider;

  return (
    <HStack spacing={12}>
      <Text modifiers={[foregroundStyle(labelColor)]}>{label}</Text>
      {slider}
    </HStack>
  );
}
