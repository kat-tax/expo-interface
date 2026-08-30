import type {TextFieldKeyboard} from './types';
import type {ObservableState} from '@expo/ui';
import {useCallback, useEffect, useState} from 'react';

/**
 * Keyboard variants understood by both React Native's `keyboardType` prop and
 * SwiftUI's `keyboardType` modifier — the overlap the web and iOS fields share.
 */
type AppleKeyboardType =
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'phone-pad'
  | 'decimal-pad'
  | 'url';

/**
 * Bridges controlled and uncontrolled usage on web, mirroring `useDateValue`.
 * When `value` is provided the component is controlled; otherwise it falls back
 * to internal state seeded with an empty string.
 * @param value - The current value of the field.
 * @param onChangeText - The function to call when the text changes.
 * @returns The current text and the function to call when the text changes.
 */
export function useTextValue(
  value: string | undefined,
  onChangeText: ((text: string) => void) | undefined,
): [string, (next: string) => void] {
  const [internal, setInternal] = useState(value ?? '');
  const current = value ?? internal;

  const setValue = useCallback(
    (next: string) => {
      if (value === undefined) {
        setInternal(next);
      }
      onChangeText?.(next);
    },
    [value, onChangeText],
  );

  return [current, setValue];
}

/**
 * Pushes a controlled `value` prop into a native `useNativeState` observable so
 * parent-driven updates reflect in the field. Uncontrolled fields (no `value`)
 * are left to manage their own state. The native field writes user input back
 * into the same observable, so this only fires for external changes.
 * @param state - The observable bound to the native field's text.
 * @param value - The controlled value, or `undefined` when uncontrolled.
 */
export function useSyncedState(state: ObservableState<string>, value: string | undefined): void {
  useEffect(() => {
    if (value !== undefined && state.value !== value) {
      state.value = value;
    }
  }, [state, value]);
}

/**
 * Maps the conformed keyboard variant to the React Native / SwiftUI keyboard
 * type, shared by the web and iOS implementations.
 * @param type - The cross-platform keyboard variant.
 * @returns The matching `KeyboardTypeOptions` value.
 */
export function keyboardTypeFor(type: TextFieldKeyboard | undefined): AppleKeyboardType {
  switch (type) {
    case 'email':
      return 'email-address';
    case 'number':
      return 'numeric';
    case 'phone':
      return 'phone-pad';
    case 'decimal':
      return 'decimal-pad';
    case 'url':
      return 'url';
    case 'default':
    default:
      return 'default';
  }
}
