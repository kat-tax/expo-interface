import type {ProgressProps} from './types';
import {CircularProgressIndicator, LinearProgressIndicator} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, size as sizeMod, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

const STROKE = 3;

/**
 * Android renders the Material 3 `LinearProgressIndicator` (filling the row
 * width to match the iOS and web bars) or `CircularProgressIndicator` sized
 * to `size`.
 */
export function Progress({value, variant = 'linear', size = 24, color, trackColor, testID}: ProgressProps) {
  const accent = useColor('tint');
  const track = useColor('backgroundSelected');
  const testMods = testID ? [testIDModifier(testID)] : [];

  if (variant === 'circular') {
    return (
      <CircularProgressIndicator
        progress={value ?? null}
        color={color ?? accent}
        trackColor={trackColor ?? track}
        strokeWidth={STROKE}
        modifiers={[sizeMod(size, size), ...testMods]}
      />
    );
  }

  return (
    <LinearProgressIndicator
      progress={value ?? null}
      color={color ?? accent}
      trackColor={trackColor ?? track}
      modifiers={[fillMaxWidth(), ...testMods]}
    />
  );
}
