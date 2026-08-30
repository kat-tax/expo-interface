import type {ProgressProps} from './types';
import {ProgressView} from '@expo/ui/swift-ui';
import {progressViewStyle, tint} from '@expo/ui/swift-ui/modifiers';
import {useColor} from '../theme';

/**
 * iOS renders SwiftUI's `ProgressView` in its linear style (a flexible-width
 * bar that fills its parent) or circular style (the system ring / activity
 * spinner, at its native size). `trackColor` has no SwiftUI equivalent and is
 * ignored.
 */
export function Progress({value, variant = 'linear', color, testID}: ProgressProps) {
  const accent = useColor('tint');
  return (
    <ProgressView
      value={value ?? null}
      modifiers={[progressViewStyle(variant), tint(color ?? accent)]}
      testID={testID}
    />
  );
}
