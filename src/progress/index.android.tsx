import type {ProgressProps} from './types';
import {LinearProgressIndicator} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

/**
 * Android renders the Material 3 `LinearProgressIndicator`. It fills the row
 * width so it matches the iOS and web bars.
 */
export function Progress({value, color, trackColor, testID}: ProgressProps) {
  const accent = useColor('tint');
  const track = useColor('backgroundSelected');
  return (
    <LinearProgressIndicator
      progress={value ?? null}
      color={color ?? accent}
      trackColor={trackColor ?? track}
      modifiers={[
        fillMaxWidth(),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}
    />
  );
}
