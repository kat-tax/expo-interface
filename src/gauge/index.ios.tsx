import type {GaugeProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Gauge as SwiftUIGauge, Text} from '@expo/ui/swift-ui';
import {gaugeStyle, tint} from '@expo/ui/swift-ui/modifiers';

/**
 * iOS renders SwiftUI's `Gauge` (iOS 16+) in the requested `gaugeStyle`. The
 * Host-level `tint` cascade colors it with the accent seed; `accentColor`
 * overrides that per instance. Each text label is a SwiftUI `Text` in the
 * matching gauge slot, so SwiftUI picks the fonts and placement.
 */
export function Gauge({
  value,
  min = 0,
  max = 1,
  variant = 'automatic',
  label,
  currentValueLabel,
  minimumValueLabel,
  maximumValueLabel,
  accentColor,
  testID,
}: GaugeProps) {
  const modifiers: ViewModifier[] = [gaugeStyle(variant)];
  if (accentColor) modifiers.push(tint(accentColor));
  return (
    <SwiftUIGauge
      value={value}
      min={min}
      max={max}
      currentValueLabel={currentValueLabel != null ? <Text>{currentValueLabel}</Text> : undefined}
      minimumValueLabel={minimumValueLabel != null ? <Text>{minimumValueLabel}</Text> : undefined}
      maximumValueLabel={maximumValueLabel != null ? <Text>{maximumValueLabel}</Text> : undefined}
      modifiers={modifiers}
      testID={testID}>
      {label != null ? <Text>{label}</Text> : undefined}
    </SwiftUIGauge>
  );
}
