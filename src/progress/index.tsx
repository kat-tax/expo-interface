import './progress.css';
import type {CSSProperties} from 'react';
import type {ProgressProps} from './types';
import {useColor} from '../theme';

const STROKE = 3;

/**
 * On web the linear bar is a native `<meter>` element whose bar/track colors
 * are driven by the `--ui-progress-*` custom properties (meter pseudo-elements
 * can't be styled inline). Indeterminate meters don't exist on the web
 * platform, so an undefined `value` renders an empty bar. The circular
 * variant is an SVG ring; without a `value` it spins as an activity indicator.
 */
export function Progress({value, variant = 'linear', size = 24, color, trackColor, testID}: ProgressProps) {
  const tint = useColor('tint');
  const track = useColor('backgroundSelected');
  const vars = {
    '--ui-progress-bar': color ?? tint,
    '--ui-progress-track': trackColor ?? track,
  } as CSSProperties;

  if (variant === 'circular') {
    const indeterminate = value == null;
    const clamped = indeterminate ? 0.25 : Math.max(0, Math.min(1, value));
    const radius = (size - STROKE) / 2;
    const circumference = 2 * Math.PI * radius;
    return (
      <svg
        className={['ui-progress-ring', indeterminate && 'ui-progress-ring--indeterminate'].filter(Boolean).join(' ')}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={indeterminate ? undefined : clamped}
        data-testid={testID}
        style={vars}>
        <circle className="ui-progress-ring__track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={STROKE}/>
        <circle
          className="ui-progress-ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>
    );
  }

  const clamped = Math.max(0, Math.min(1, value ?? 0));
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
