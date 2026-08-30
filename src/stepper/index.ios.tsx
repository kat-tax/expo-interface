import type {StepperProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {HStack, Spacer, Stepper as SwiftUIStepper, Text} from '@expo/ui/swift-ui';
import {disabled as disabledMod, foregroundStyle, labelsHidden} from '@expo/ui/swift-ui/modifiers';
import {fillWidth} from '../fill';
import {useColor} from '../theme';
import {clampStep} from './shared';

/**
 * iOS renders SwiftUI's `Stepper`. Its own label is hidden so the row can be
 * composed like the other platforms — label leading, value and the `− +`
 * control trailing — exactly the iOS Settings look. Drop it straight into a
 * `FieldGroup.Section`.
 */
export function Stepper({
  label,
  value,
  onValueChange,
  step = 1,
  min,
  max,
  formatValue,
  disabled,
  testID,
}: StepperProps) {
  const labelColor = useColor(disabled ? 'secondaryLabel' : 'label');
  const valueColor = useColor('secondaryLabel');
  const modifiers: ViewModifier[] = [labelsHidden()];
  if (disabled) modifiers.push(disabledMod(true));

  const control = (
    <SwiftUIStepper
      label={label ?? ''}
      value={value}
      step={step}
      min={min}
      max={max}
      onValueChange={next => onValueChange(clampStep(next, min, max))}
      modifiers={modifiers}
      testID={testID}
    />
  );

  return (
    <HStack spacing={12} modifiers={fillWidth}>
      {label != null ? <Text modifiers={[foregroundStyle(labelColor)]}>{label}</Text> : null}
      <Spacer/>
      <Text modifiers={[foregroundStyle(valueColor)]}>
        {formatValue ? formatValue(value) : String(value)}
      </Text>
      {control}
    </HStack>
  );
}
