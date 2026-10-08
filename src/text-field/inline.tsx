import type {TextStyle} from 'react-native';
import type {TextFieldProps} from './types';
import {useImperativeHandle, useRef} from 'react';
import {Platform, StyleSheet, TextInput} from 'react-native';
import {fonts, fontWeights, spacing, useColor} from '../theme';
import {blurOnSubmitFor, inputModeFor, keyboardTypeFor, keyPressFor, useAutoFocus, useTextValue} from './shared';

/** A key react-native-windows submits a multi-line field on, with the modifiers that must be held. */
interface WindowsSubmitKey {
  code: string;
  shiftKey?: boolean;
}

/**
 * The keys react-native-windows submits a multi-line field on: Enter with no
 * modifier held, so Shift+Enter still breaks the line. Without them it
 * submits only a one-line field, and Enter in a multi-line one always breaks
 * the line, whatever `submitBehavior` says.
 */
const SUBMIT_KEYS: readonly WindowsSubmitKey[] = [{code: 'Enter'}];

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

  const web = Platform.OS === 'web';

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
      // On web a `<textarea>` takes the keyboard only through `inputmode`.
      inputMode={web ? inputModeFor(keyboardType) : undefined}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      // react-native-windows keeps checking the spelling unless `spellCheck`
      // is off as well as `autoCorrect`. iOS and the web already take
      // `spellCheck` from `autoCorrect`, so this changes nothing there.
      spellCheck={autoCorrect}
      multiline={multiline}
      maxLength={maxLength}
      cursorColor={cursor}
      selectionColor={cursor}
      returnKeyType={returnKeyType}
      submitBehavior={submitBehavior}
      // react-native-web reads `blurOnSubmit`, not `submitBehavior`.
      blurOnSubmit={web ? blurOnSubmitFor(submitBehavior) : undefined}
      {...(Platform.OS === 'windows' && multiline === true && submitBehavior !== undefined ? {submitKeyEvents: SUBMIT_KEYS} : null)}
      onSubmitEditing={onSubmit ? event => onSubmit(event.nativeEvent.text) : undefined}
      onKeyPress={keyPressFor({multiline, submitBehavior, disabled, onSubmit, onKeyPress}, current)}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={placeholder}
      testID={testID}
      style={[styles.input, variant === 'bare' && styles.bare, {color: label}, disabled && styles.disabled, style]}
    />
  );
}

/**
 * The box around a bare field draws the padding and the focus ring. The
 * browser draws its ring with `outline-style: auto`, which no width turns
 * off, so on web the style itself is turned off. The native renderers parse
 * only a solid, dotted or dashed outline, and draw none unless told.
 */
const NO_RING = Platform.select<TextStyle>({web: {outlineStyle: 'none'} as unknown as TextStyle, default: {}});

const styles = StyleSheet.create({
  bare: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...NO_RING,
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
