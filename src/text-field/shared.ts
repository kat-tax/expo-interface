import type {RefObject} from 'react';
import type {NativeSyntheticEvent, TextInput, TextInputKeyPressEventData} from 'react-native';
import type {ObservableState} from '@expo/ui';
import type {TextFieldKeyboard, TextFieldProps, TextFieldSubmitBehavior} from './types';
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

/** The `inputmode` a browser takes for each keyboard variant. */
export type WebInputMode = 'email' | 'numeric' | 'tel' | 'decimal' | 'url';

/**
 * Maps the conformed keyboard variant to the field's `inputmode` on web.
 * react-native-web drops `type` on a `<textarea>`, so a multi-line field
 * shows the keyboard asked for only through `inputmode`; on a one-line
 * `<input>` it also sets the matching `type`.
 * @param type - The cross-platform keyboard variant.
 * @returns The `inputmode`, or `undefined` for the default keyboard.
 */
export function inputModeFor(type: TextFieldKeyboard | undefined): WebInputMode | undefined {
  switch (type) {
    case 'email':
      return 'email';
    case 'number':
      return 'numeric';
    case 'phone':
      return 'tel';
    case 'decimal':
      return 'decimal';
    case 'url':
      return 'url';
    case 'default':
    default:
      return undefined;
  }
}

/**
 * Names a key the way every platform names it: react-native-windows reports
 * a key by the character it types, so Escape arrives as U+001B. Enter and
 * Backspace it already names.
 * @param key - The key as the `TextInput` reported it.
 * @returns The key's name.
 */
export function keyNameOf(key: string): string {
  return key === '\u001b' ? 'Escape' : key;
}

/**
 * A key press as React Native reports it, with what a browser's keyboard
 * event adds on web: the Shift key, and whether an input method is composing.
 */
export type KeyPressEvent = NativeSyntheticEvent<TextInputKeyPressEventData & {shiftKey?: boolean; isComposing?: boolean; keyCode?: number}>;

/**
 * Whether a key arrives while an input method is composing text: the Enter
 * that commits a Japanese or Chinese word, say. Browsers mark it with
 * `isComposing`, and Safari with the key code 229 alone, as react-native-web
 * checks before it submits.
 */
function composing(event: KeyPressEvent): boolean {
  return event.nativeEvent.isComposing === true || event.nativeEvent.keyCode === 229;
}

/**
 * The `onKeyPress` handler of the React Native fields (`inline`, `bare` and
 * the web row): each key goes to `onKeyPress` by its name (`keyNameOf`) with
 * whether Shift was held. On web a multi-line field that submits takes Enter
 * itself and submits, keeping the focus: react-native-web submits a
 * multi-line field on Enter only when it may blur it afterwards, so the key
 * is taken here, before the browser inserts the line. Shift+Enter still
 * breaks the line, and an Enter that commits an input method's text commits
 * it and submits nothing.
 * @param props - The field's props that decide what a key does.
 * @param text - The field's current text, which Enter submits.
 * @returns The handler, or `undefined` when no key needs one.
 */
export function keyPressFor(
  {multiline, submitBehavior, disabled, onSubmit, onKeyPress}: Pick<TextFieldProps, 'multiline' | 'submitBehavior' | 'disabled' | 'onSubmit' | 'onKeyPress'>,
  text: string,
): ((event: KeyPressEvent) => void) | undefined {
  const entersSubmit = Platform.OS === 'web' && multiline === true && submitBehavior === 'submit' && !disabled && onSubmit !== undefined;
  if (!onKeyPress && !entersSubmit) return undefined;
  return event => {
    const shift = event.nativeEvent.shiftKey === true;
    if (entersSubmit && event.nativeEvent.key === 'Enter' && !shift && !composing(event)) {
      event.preventDefault();
      onSubmit(text);
      return;
    }
    onKeyPress?.(keyNameOf(event.nativeEvent.key), shift);
  };
}

/**
 * The `blurOnSubmit` react-native-web reads in place of `submitBehavior`,
 * which it does not know: `submit` keeps the field focused through Enter,
 * `blurAndSubmit` gives the focus up. Left unset, it keeps react-native-web's
 * defaults, which are React Native's: a one-line field blurs as it submits,
 * a multi-line one breaks the line.
 * @param behavior - The field's `submitBehavior`.
 * @returns Whether the field blurs on submit, or `undefined` for the default.
 */
export function blurOnSubmitFor(behavior: TextFieldSubmitBehavior | undefined): boolean | undefined {
  return behavior === undefined ? undefined : behavior === 'blurAndSubmit';
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
