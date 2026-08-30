import type {SliderProps} from './types';

import {Row, Slider as ComposeSlider, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, testID as testIDModifier, weight} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

/**
 * Android renders the Material 3 `Slider`, colored with the live accent seed
 * (matching the iOS `tint` cascade and the web `accent-color`) instead of the
 * host's tonal M3 primary. With a `label` the row fills the available width
 * and the slider takes the remaining space, mirroring the iOS Form row.
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
  const colors = useMaterialColors();
  const tint = useColor('tint');
  const track = useColor('backgroundSelected');
  const accent = accentColor ?? tint;

  // Compose `steps` is the number of discrete intervals between min and max
  // (exclusive); the universal `step` is an increment size.
  let steps: number | undefined;
  if (step != null && step > 0) {
    steps = Math.max(0, Math.round((max - min) / step) - 1);
  }
  const snap = (next: number) =>
    step != null && step > 0 ? Math.round((next - min) / step) * step + min : next;

  const slider = (
    <ComposeSlider
      value={value}
      min={min}
      max={max}
      steps={steps}
      enabled={!disabled}
      onValueChange={disabled ? undefined : next => onValueChange(snap(next))}
      onValueChangeFinished={onSlidingComplete ? () => onSlidingComplete(value) : undefined}
      colors={{
        thumbColor: accent,
        activeTrackColor: accent,
        inactiveTrackColor: track,
        activeTickColor: track,
        inactiveTickColor: accent,
      }}
      modifiers={[
        ...(label != null ? [weight(1)] : [fillMaxWidth()]),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}
    />
  );

  if (label == null) return slider;

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{spacedBy: 12}}
      modifiers={[fillMaxWidth()]}>
      <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      {slider}
    </Row>
  );
}
