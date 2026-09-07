import type {TextFieldProps} from './types';
import type {NativeSyntheticEvent, TextInputKeyPressEventData, TextStyle} from 'react-native';

import {useRef} from 'react';
import {StyleSheet, TextInput} from 'react-native';
import {fonts, fontWeights, theme, variants} from '../theme';
import {InlineTextField} from './inline';
import {keyboardTypeFor, useAutoFocus, useTextValue} from './shared';

/**
 * The `row` variant is the form row below; `inline` is the borderless field
 * for a React Native layout (the same `TextInput`, sized to its room).
 */
export function TextField(props: TextFieldProps) {
  if (props.variant === 'inline') return <InlineTextField {...props}/>;
  return <RowTextField {...props}/>;
}

/**
 * On web the field mirrors the native iOS/Android row: a borderless, full-width
 * input whose placeholder doubles as the label, styled with the shared body
 * typography so it sits flush inside a `FieldGroup.Section`. The browser focus
 * outline is suppressed to match the chromeless iOS `Form` look.
 */
function RowTextField({
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
  const cursor = accentColor ?? (theme.tint as string);
  useAutoFocus(input, autoFocus);

  return (
    <TextInput
      ref={input}
      value={current}
      onChangeText={setValue}
      placeholder={placeholder}
      placeholderTextColor={theme.tertiaryLabel}
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
      style={[styles.input, disabled && styles.disabled, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    margin: 0,
    paddingVertical: 0,
    // `label` (14px) matches the sibling rows in a `FieldGroup.Section`:
    // `@expo/ui`'s universal `Text` renders at react-native-web's 14px
    // default, and rows like `DateTimePicker` use the `label` variant.
    fontSize: variants.label.fontSize,
    lineHeight: variants.label.lineHeight,
    fontFamily: fonts?.sans,
    fontWeight: fontWeights.normal,
    color: theme.label,
    // Web-only: drop the default browser focus ring so the field stays flush
    // with the surrounding card, matching the iOS Form row.
    ...({outlineStyle: 'none'} as unknown as TextStyle),
  },
  disabled: {
    opacity: 0.4,
  },
});
