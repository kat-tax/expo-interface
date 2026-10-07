import type {NativeSyntheticEvent, TextInputKeyPressEventData} from 'react-native';
import type {TextFieldProps} from './types';
import {useImperativeHandle, useRef} from 'react';
import {Platform, StyleSheet, TextInput} from 'react-native';
import {fonts, fontWeights, spacing, useColor} from '../theme';
import {keyboardTypeFor, useAutoFocus, useTextValue} from './shared';

/**
 * The `inline` variant: a borderless React Native `TextInput` on every
 * platform, for a field that sits inside a React Native layout (a search
 * row in a toolbar, a prompt in a bar) where the native form control would
 * need a host of its own. It grows to the room it is given, focuses on
 * mount when asked (and makes sure the keyboard came on Android), steps
 * with the keyboard's action key (`returnKeyType` with `submitBehavior`),
 * reports the focus coming and going, and takes it through the `ref`.
 */
export function InlineTextField({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onKeyPress,
  onFocus,
  onBlur,
  ref,
  disabled,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  multiline,
  autoFocus,
  returnKeyType,
  submitBehavior,
  maxLength,
  accentColor,
  variant,
  testID,
  style,
}: TextFieldProps) {
  const input = useRef<TextInput>(null);
  const [current, setValue] = useTextValue(value, onChangeText);
  const label = useColor('label');
  const placeholderColor = useColor('tertiaryLabel');
  const tint = useColor('tint');
  const cursor = accentColor ?? tint;
  useAutoFocus(input, autoFocus);
  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    blur: () => input.current?.blur(),
  }));

  // A multi-line field that submits keeps the focus on web: react-native-web
  // submits a multi-line field on Enter only when it may blur it afterwards,
  // so the key is taken here instead, before the browser inserts the line.
  const entersSubmit = Platform.OS === 'web' && multiline === true && submitBehavior === 'submit' && !disabled && onSubmit !== undefined;
  const onKey = onKeyPress || entersSubmit
    ? (event: NativeSyntheticEvent<TextInputKeyPressEventData & {shiftKey?: boolean}>) => {
      const shift = event.nativeEvent.shiftKey === true;
      if (entersSubmit && event.nativeEvent.key === 'Enter' && !shift) {
        event.preventDefault();
        onSubmit(current);
        return;
      }
      onKeyPress?.(event.nativeEvent.key, shift);
    }
    : undefined;

  return (
    <TextInput
      ref={input}
      value={current}
      onChangeText={setValue}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      editable={!disabled}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardTypeFor(keyboardType)}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      multiline={multiline}
      maxLength={maxLength}
      cursorColor={cursor}
      selectionColor={cursor}
      returnKeyType={returnKeyType}
      submitBehavior={submitBehavior}
      onSubmitEditing={onSubmit ? event => onSubmit(event.nativeEvent.text) : undefined}
      onKeyPress={onKey}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={placeholder}
      testID={testID}
      style={[styles.input, variant === 'bare' && styles.bare, {color: label}, disabled && styles.disabled, style]}
    />
  );
}

const styles = StyleSheet.create({
  // The box around a bare field draws the padding and the focus ring; the
  // outline width is what react-native-web turns the browser's ring off with.
  bare: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    outlineWidth: 0,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    margin: 0,
    paddingVertical: spacing.one,
    paddingHorizontal: spacing.two,
    fontSize: 14,
    fontFamily: fonts?.sans,
    fontWeight: fontWeights.normal,
  },
  disabled: {
    opacity: 0.4,
  },
});
