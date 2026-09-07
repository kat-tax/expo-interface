import type {NativeSyntheticEvent, TextInputKeyPressEventData} from 'react-native';
import type {TextFieldProps} from './types';
import {useRef} from 'react';
import {StyleSheet, TextInput} from 'react-native';
import {fonts, fontWeights, spacing, useColor} from '../theme';
import {keyboardTypeFor, useAutoFocus, useTextValue} from './shared';

/**
 * The `inline` variant: a borderless React Native `TextInput` on every
 * platform, for a field that sits inside a React Native layout (a search
 * row in a toolbar, a prompt in a bar) where the native form control would
 * need a host of its own. It grows to the room it is given, focuses on
 * mount when asked (and makes sure the keyboard came on Android), and steps
 * with the keyboard's action key (`returnKeyType` with `submitBehavior`).
 */
export function InlineTextField({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onKeyPress,
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
      onKeyPress={onKeyPress ? (event: NativeSyntheticEvent<TextInputKeyPressEventData & {shiftKey?: boolean}>) =>
        onKeyPress(event.nativeEvent.key, event.nativeEvent.shiftKey === true) : undefined}
      aria-label={placeholder}
      testID={testID}
      style={[styles.input, {color: label}, disabled && styles.disabled, style]}
    />
  );
}

const styles = StyleSheet.create({
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
