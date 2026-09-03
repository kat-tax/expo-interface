import './gauge.css';
import type {CSSProperties} from 'react';
import type {GaugeProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {flatten} from '../theme';
import {fraction, gauge, markerOffset} from './shared';

const polar = (angle: number, radius: number, center: number) => ({
  x: center + radius * Math.cos((angle * Math.PI) / 180),
  y: center + radius * Math.sin((angle * Math.PI) / 180),
});

/**
 * On web each SwiftUI gauge style is redrawn with DOM elements (the bars)
 * and inline SVG (the rings), sized in CSS pixels to the geometry measured
 * from iOS. Colors flow through custom properties: the accent tints the
 * indicator and the value labels, the descriptive label keeps the label
 * color, and the marker knockout paints the scheme background.
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
  style,
}: GaugeProps) {
  const f = fraction(value, min, max);
  const vars = {
    ...(accentColor ? {'--ui-gauge-accent': accentColor} : null),
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  const meter = {
    role: 'meter',
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': Math.min(max, Math.max(min, value)),
    'aria-valuetext': currentValueLabel,
  } as const;
  const bounds = {
    min: minimumValueLabel != null ? <span className="ui-gauge__bound">{minimumValueLabel}</span> : null,
    max: maximumValueLabel != null ? <span className="ui-gauge__bound">{maximumValueLabel}</span> : null,
  };

  if (variant === 'circular' || variant === 'circularCapacity') {
    const {size, stroke, arcStart, arcSweep, dot, knockout} = gauge.ring;
    const center = size / 2;
    const radius = (size - stroke) / 2;
    const start = polar(arcStart, radius, center);
    const end = polar(arcStart + arcSweep, radius, center);
    const marker = markerOffset(f);
    const circumference = 2 * Math.PI * radius;
    const text = currentValueLabel ?? label;
    return (
      <div
        {...meter}
        className={`ui-gauge-ring ui-gauge-ring--${variant}`}
        style={{...vars, width: size, height: size}}
        data-testid={testID}>
        <svg className="ui-gauge-ring__svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          {variant === 'circular' ? (
            <>
              <path
                className="ui-gauge-ring__arc"
                // The 240° sweep is always the large arc, drawn clockwise.
                d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
              />
              <circle className="ui-gauge-ring__knockout" cx={center + marker.x} cy={center + marker.y} r={knockout / 2}/>
              <circle className="ui-gauge-ring__dot" cx={center + marker.x} cy={center + marker.y} r={dot / 2}/>
            </>
          ) : (
            <>
              <circle className="ui-gauge-ring__track" cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke}/>
              {f > 0 ? (
                <circle
                  className="ui-gauge-ring__fill"
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${f * circumference} ${circumference}`}
                  transform={`rotate(-90 ${center} ${center})`}
                />
              ) : null}
            </>
          )}
        </svg>
        {text != null ? (
          <span className={['ui-gauge-ring__center', currentValueLabel == null && 'ui-gauge-ring__center--label'].filter(Boolean).join(' ')}>
            {text}
          </span>
        ) : null}
        {variant === 'circular' && (bounds.min || bounds.max) ? (
          <span className="ui-gauge-ring__bounds">
            {bounds.min ?? <span/>}
            {bounds.max ?? <span/>}
          </span>
        ) : null}
      </div>
    );
  }

  if (variant === 'linear') {
    return (
      <div {...meter} className="ui-gauge ui-gauge--linear" style={vars} data-testid={testID}>
        {bounds.min}
        <span className="ui-gauge__track">
          <span className="ui-gauge__marker" style={{left: `calc(${gauge.linear.dot / 2}px + ${f} * (100% - ${gauge.linear.dot}px))`}}>
            <span className="ui-gauge__dot"/>
          </span>
        </span>
        {bounds.max}
      </div>
    );
  }

  const fill = <span className="ui-gauge__fill" style={{width: `${f * 100}%`}}/>;

  if (variant === 'linearCapacity') {
    // A grid whose columns exist only for the bounds that are set, so the
    // stacked label and current value start exactly at the bar's leading edge.
    const columns = [bounds.min && 'auto', 'minmax(0, 1fr)', bounds.max && 'auto'].filter(Boolean).join(' ');
    const barColumn = bounds.min ? 2 : 1;
    const barRow = label != null ? 2 : 1;
    const stacked = {gridColumn: barColumn} as const;
    return (
      <div
        {...meter}
        className="ui-gauge ui-gauge--linear-capacity"
        style={{...vars, gridTemplateColumns: columns}}
        data-testid={testID}>
        {label != null ? <span className="ui-gauge__label" style={{...stacked, gridRow: 1}}>{label}</span> : null}
        {bounds.min ? <span className="ui-gauge__bound" style={{gridColumn: 1, gridRow: barRow}}>{minimumValueLabel}</span> : null}
        <span className="ui-gauge__track" style={{...stacked, gridRow: barRow}}>{fill}</span>
        {bounds.max ? <span className="ui-gauge__bound" style={{gridColumn: barColumn + 1, gridRow: barRow}}>{maximumValueLabel}</span> : null}
        {currentValueLabel != null ? (
          <span className="ui-gauge__current" style={{...stacked, gridRow: barRow + 1}}>{currentValueLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div {...meter} className="ui-gauge ui-gauge--automatic" style={vars} data-testid={testID}>
      {label != null ? <span className="ui-gauge__label">{label}</span> : null}
      <span className="ui-gauge__row">
        {bounds.min}
        <span className="ui-gauge__track">{fill}</span>
        {bounds.max}
      </span>
      {currentValueLabel != null ? <span className="ui-gauge__current">{currentValueLabel}</span> : null}
    </div>
  );
}
