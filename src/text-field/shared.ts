import type {RefObject} from 'react';
import type {TextInput} from 'react-native';
import type {ObservableState} from '@expo/ui';
import type {TextFieldKeyboard} from './types';
import {useCallback, useEffect, useState} from 'react';
import {Keyboard, Platform} from 'react-native';

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

/** How long after the mount the keyboard is looked for (`focusField`). */
export const FOCUS_RETRY_MS = 150;

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
      // Writing `.value` is the `@expo/ui` observable's API, not a prop mutation.
      // eslint-disable-next-line react-hooks/immutability
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

/**
 * Focuses a React Native `TextInput` that just mounted, and makes sure its
 * keyboard came: on Android the first focus asks for the keyboard before the
 * field is laid out and served by the input method ("Ignoring
 * showSoftInput() as view is not served"), which leaves a caret in the field
 * and no keyboard; and a second `focus()` on a focused field is a no-op in
 * React Native. So a moment later, if the keyboard is still down, the field
 * is blurred and focused again, a fresh request the input method takes.
 * Returns the effect's cleanup.
 */
export function focusField(input: RefObject<TextInput | null>): () => void {
  input.current?.focus();
  if (Platform.OS !== 'android') return () => undefined;
  const again = setTimeout(() => {
    const field = input.current;
    if (!field || Keyboard.isVisible()) return;
    field.blur();
    field.focus();
  }, FOCUS_RETRY_MS);
  return () => clearTimeout(again);
}

/**
 * Focuses the field once it is mounted when `autoFocus` is set (see
 * `focusField`), for the React Native based fields (web, `inline`).
 */
export function useAutoFocus(input: RefObject<TextInput | null>, autoFocus: boolean | undefined): void {
  useEffect(() => {
    if (!autoFocus) return;
    return focusField(input);
  }, [autoFocus, input]);
}
