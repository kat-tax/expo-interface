import type {ProgressProps} from './types';
import {ProgressView} from '@expo/ui/swift-ui';
import {tint} from '@expo/ui/swift-ui/modifiers';
import {useColor} from '../theme';

/**
 * iOS renders SwiftUI's `ProgressView` in its linear style (the default for a
 * determinate `value`). The bar is flexible-width and fills the available space
 * of its parent layout. `trackColor` has no SwiftUI equivalent and is ignored.
 */
export function Progress({value, color, testID}: ProgressProps) {
  const accent = useColor('tint');
  return (
    <ProgressView
      value={value ?? null}
      modifiers={[tint(color ?? accent)]}
      testID={testID}
    />
  );
}
