import type {TextFieldKeyboard, TextFieldProps} from './types';
import {StyleSheet} from 'react-native';
import XamlTextBox from '../windows/specs/ExpoInterfaceTextBoxNativeComponent';
import {useXamlProps} from '../windows';
import {InlineTextField} from './inline';
import {useTextValue} from './shared';

/** The WinUI input scope a keyboard variant asks for on a touch device. */
export function inputScopeFor(type: TextFieldKeyboard | undefined): 'default' | 'email' | 'number' | 'phone' | 'decimal' | 'url' {
  switch (type) {
    case 'email':
    case 'number':
    case 'phone':
    case 'decimal':
    case 'url':
      return type;
    case 'default':
    default:
      return 'default';
  }
}

/**
 * The `row` variant is a WinUI 3 `TextBox` (or `PasswordBox` for a secure
 * entry) in a XAML island, stripped of its chrome so it sits flush in a
 * `FieldGroup.Section` as the borderless row the other platforms draw;
 * `inline` is the React Native `TextInput` every platform uses for a field
 * inside a React Native layout. `autoCapitalize` has no Windows equivalent
 * and `submitBehavior` is the control's own (Enter submits and keeps the
 * focus).
 */
export function TextField(props: TextFieldProps) {
  if (props.variant === 'inline') return <InlineTextField {...props}/>;
  return <RowTextField {...props}/>;
}

function RowTextField({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onKeyPress,
  disabled,
  secureTextEntry,
  keyboardType,
  autoCorrect = true,
  multiline,
  autoFocus,
  maxLength,
  accentColor,
  testID,
}: TextFieldProps) {
  const xaml = useXamlProps();
  const [current, setValue] = useTextValue(value, onChangeText);
  return (
    <XamlTextBox
      value={current}
      placeholder={placeholder}
      disabled={disabled}
      password={secureTextEntry}
      multiline={multiline}
      maxLength={maxLength ?? 0}
      inputScope={inputScopeFor(keyboardType)}
      spellCheck={autoCorrect}
      autoFocus={autoFocus}
      borderless
      label={placeholder}
      onChangeText={event => setValue(event.nativeEvent.text)}
      onSubmit={onSubmit ? event => onSubmit(event.nativeEvent.text) : undefined}
      onKeyPress={onKeyPress ? event => onKeyPress(event.nativeEvent.key, event.nativeEvent.shiftKey) : undefined}
      style={styles.field}
      testID={testID}
      {...xaml}
      accentColor={accentColor ?? xaml.accentColor}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: 'stretch',
  },
});
