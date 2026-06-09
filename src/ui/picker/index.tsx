import type {ChangeEvent, CSSProperties} from 'react';
import type {PickerProps, PickerValue} from './types';

import {Pressable, StyleSheet, View} from 'react-native';
import {Label} from '@/ui/typography';
import {theme} from '@/ui/theme';
import {extractItems, labelFor, PickerItem, useSelectedValue} from './shared';

/**
 * On web the row mirrors the native iOS/Android pill: a label on the leading
 * edge and a rounded pill showing the selected value plus an up/down chevron,
 * with a transparent native `<select>` layered on top. Clicking the pill opens
 * the browser's built-in option list.
 */
function PickerComponent<T extends PickerValue>({
  style,
  label,
  testID,
  children,
  disabled,
  accentColor,
  selectedValue,
  onValueChange,
}: PickerProps<T>) {
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const item = items[event.target.selectedIndex];
    if (item) setValue(item.value);
  };

  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <Pressable disabled={disabled} style={[styles.pill, disabled && styles.disabled]}>
        <Label
          color="secondaryLabel"
          style={[styles.value, accentColor != null && {color: accentColor}]}>
          {labelFor(items, current)}
        </Label>
        <Chevron />
        <select
          value={current != null ? String(current) : undefined}
          disabled={disabled}
          aria-label={label ?? 'Select option'}
          onChange={handleChange}
          style={{...overlayStyle, cursor: disabled ? 'default' : 'pointer'}}>
          {items.map(item => (
            <option key={String(item.value)} value={String(item.value)} style={optionStyle}>
              {item.label}
            </option>
          ))}
        </select>
      </Pressable>
    </View>
  );
}

PickerComponent.Item = PickerItem;

export {PickerComponent as Picker};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  label: {
    flexShrink: 1,
  },
  pill: {
    position: 'relative',
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: theme.pillBackground,
  },
  value: {
    flexShrink: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});

const overlayStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
  border: 'none',
  opacity: 0,
  appearance: 'none',
  // The native options popup derives its colors from the select's own
  // background/color (not `:root`), so theme them via CSS vars. `opacity: 0`
  // keeps the overlay box invisible; the popup still uses these colors.
  colorScheme: 'light dark',
  color: 'var(--color-label)',
  background: 'var(--color-background)',
};

const optionStyle: CSSProperties = {
  color: 'var(--color-label)',
  background: 'var(--color-background)',
};

function Chevron() {
  return (
    <svg width="11" height="16" viewBox="0 0 11 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.5 L5.5 3.5 L8.5 6.5"
        stroke={theme.tertiaryLabel as string}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 9.5 L5.5 12.5 L8.5 9.5"
        stroke={theme.tertiaryLabel as string}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
