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
 * opens the iOS picker redrawn in the kit's `Sheet`.
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
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
  return (
    <>
      <button
        type="button"
        className={['ui-color-picker', disabled && 'ui-color-picker--disabled'].filter(Boolean).join(' ')}
        style={vars}
        disabled={disabled}
        aria-label={label == null ? 'Color' : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        data-testid={testID}>
        {label != null ? <Label color="label" style={{flexShrink: 1}}>{label}</Label> : null}
        <span className="ui-color-picker__well" aria-hidden="true">
          <span className="ui-color-picker__swatch"/>
        </span>
      </button>
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
    </>
  );
}
