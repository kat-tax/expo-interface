import './color-picker.css';
import type {CSSProperties} from 'react';
import type {ColorPickerProps} from './types';

import {useState} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {Label} from '../typography';
import {Sheet} from '../sheet';
import {flatten} from '../theme';
import {ColorPickerSheet} from './sheet';
import {parseColor, toCss, toHex, useColorValue} from './shared';

/**
 * On web the row is a native `<button>` holding the label and the color
 * well — a conic rainbow ring around the selected color, as on iOS — which
 * opens the iOS picker redrawn in the kit's `Sheet`. With `swatches` the row
 * is a `<div>` instead, so each preset and the well are buttons of their
 * own (buttons cannot nest).
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  swatches,
  disabled,
  testID,
  style,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useColorValue(value, onValueChange, supportsOpacity);
  const vars = {
    '--ui-color-picker-value': toCss(current),
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  const className = ['ui-color-picker', disabled && 'ui-color-picker--disabled'].filter(Boolean).join(' ');
  const well = (
    <span className="ui-color-picker__well" aria-hidden="true">
      <span className="ui-color-picker__swatch"/>
    </span>
  );
  const sheet = (
    <Sheet isPresented={open} onDismiss={() => setOpen(false)}>
      <ColorPickerSheet
        title={label ?? 'Colors'}
        value={toHex(current, true)}
        supportsOpacity={supportsOpacity}
        onValueChange={hex => setCurrent(parseColor(hex))}
        onClose={() => setOpen(false)}
        testID={testID ? `${testID}-sheet` : undefined}
      />
    </Sheet>
  );

  if (swatches?.length) {
    const currentHex = toHex({...current, a: 1}, false);
    return (
      <>
        <div className={`${className} ui-color-picker--presets`} style={vars} data-testid={testID}>
          {label != null ? <Label color="label" style={{flexShrink: 1}}>{label}</Label> : null}
          <span className="ui-color-picker__presets">
            {swatches.map(seed => {
              const selected = toHex(parseColor(seed), false) === currentHex;
              return (
                <button
                  key={seed}
                  type="button"
                  className={['ui-color-picker__preset', selected && 'ui-color-picker__preset--selected'].filter(Boolean).join(' ')}
                  style={{'--ui-color-picker-preset': seed} as CSSProperties}
                  aria-label={`Color ${seed}`}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => setCurrent({...parseColor(seed), a: current.a})}
                />
              );
            })}
            <button
              type="button"
              className="ui-color-picker__open"
              aria-label={label ?? 'Color'}
              aria-haspopup="dialog"
              aria-expanded={open}
              disabled={disabled}
              onClick={() => setOpen(true)}>
              {well}
            </button>
          </span>
        </div>
        {sheet}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={vars}
        disabled={disabled}
        aria-label={label == null ? 'Color' : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        data-testid={testID}>
        {label != null ? <Label color="label" style={{flexShrink: 1}}>{label}</Label> : null}
        {well}
      </button>
      {sheet}
    </>
  );
}
