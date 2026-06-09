import './progress.css';
import type {CSSProperties} from 'react';
import type {ProgressProps} from './types';
import {useColor} from '@/ui/theme';

/**
 * On web the bar is a native `<meter>` element. Its bar/track colors are driven
 * by the `--ui-progress-*` custom properties consumed in `global.css`, since the
 * meter pseudo-elements can't be styled inline. Indeterminate meters don't
 * exist on the web platform, so an undefined `value` renders an empty bar.
 */
export function Progress({value, color, trackColor, testID}: ProgressProps) {
  const tint = useColor('tint');
  const track = useColor('backgroundSelected');
  const clamped = Math.max(0, Math.min(1, value ?? 0));
  const vars = {
    '--ui-progress-bar': color ?? tint,
    '--ui-progress-track': trackColor ?? track,
  } as CSSProperties;
  return (
    <meter
      className="ui-progress"
      min={0}
      max={1}
      value={clamped}
      data-testid={testID}
      style={vars}
    />
  );
}
