import type {ReactElement, ReactNode} from 'react';
import type {PickerItemProps, PickerOption, PickerValue} from './types';
import {Children, isValidElement, useCallback, useState} from 'react';

/**
 * Data-only option marker. Rendered as `<Picker.Item label value />` and never
 * mounts anything itself — the parent `Picker` reads its props to build the
 * platform-native list of options.
 */
export function PickerItem<T extends PickerValue>(_props: PickerItemProps<T>): null {
  return null;
}

/**
 * Walks `<Picker>` children and extracts each `<Picker.Item>`'s props.
 * Non-`PickerItem` children are ignored.
 * @param children - The picker children.
 * @returns The list of options declared by the children.
 */
export function extractItems<T extends PickerValue>(children: ReactNode): PickerOption<T>[] {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<PickerItemProps<T>> =>
        isValidElement(child) && child.type === PickerItem,
    )
    .map(child => ({label: child.props.label, value: child.props.value}));
}

/**
 * Bridges controlled and uncontrolled usage, mirroring `useDateValue`. When
 * `selectedValue` is provided the component is controlled; otherwise it falls
 * back to internal state seeded with `fallback` (typically the first option).
 * @param value - The current value of the picker.
 * @param onChange - The function to call when the picker value changes.
 * @param fallback - The value used when neither `value` nor internal state is set.
 * @returns The current value and the function to call when the picker value changes.
 */
export function useSelectedValue<T extends PickerValue>(
  value: T | undefined,
  onChange: ((value: T) => void) | undefined,
  fallback: T | undefined,
): [T | undefined, (next: T) => void] {
  const [internal, setInternal] = useState<T | undefined>(value);
  const current = value ?? internal ?? fallback;

  const setValue = useCallback(
    (next: T) => {
      if (value === undefined) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [value, onChange],
  );

  return [current, setValue];
}

/**
 * Finds the display label for the currently selected value.
 * @param options - The available options.
 * @param value - The selected value.
 * @returns The matching label, or an empty string when nothing matches.
 */
export function labelFor<T extends PickerValue>(
  options: PickerOption<T>[],
  value: T | undefined,
): string {
  return options.find(option => option.value === value)?.label ?? '';
}
