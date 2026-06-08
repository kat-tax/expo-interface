import type {TextFieldCapitalize, TextFieldProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {SecureField, TextField as SwiftUITextField, useNativeState} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  disabled as disabledMod,
  keyboardType as keyboardTypeMod,
  onSubmit as onSubmitMod,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import {keyboardTypeFor, useSyncedState} from './shared';

export * from './types';

/**
 * iOS renders the field inline using SwiftUI's `TextField` (or `SecureField`
 * for masked input), which is exactly the borderless `Form` row look the other
 * platforms emulate: a placeholder that doubles as the label and the value
 * filling the row. Drop it straight into a `FieldGroup.Section`.
 */
export function TextField({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  disabled,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  multiline,
  autoFocus,
  maxLength,
  accentColor,
  testID,
}: TextFieldProps) {
  const text = useNativeState(value ?? '');
  useSyncedState(text, value);

  const modifiers: ViewModifier[] = [];
  if (accentColor) modifiers.push(tint(accentColor));
  if (keyboardType) modifiers.push(keyboardTypeMod(keyboardTypeFor(keyboardType)));
  if (autoCorrect === false) modifiers.push(autocorrectionDisabled(true));
  if (autoCapitalize) modifiers.push(textInputAutocapitalization(autocapitalizationFor(autoCapitalize)));
  if (onSubmit) modifiers.push(onSubmitMod(() => onSubmit(text.value)));
  if (disabled) modifiers.push(disabledMod(true));

  if (secureTextEntry) {
    return (
      <SecureField
        text={text}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onTextChange={onChangeText}
        modifiers={modifiers}
        testID={testID}
      />
    );
  }

  return (
    <SwiftUITextField
      text={text}
      placeholder={placeholder}
      autoFocus={autoFocus}
      maxLength={maxLength}
      axis={multiline ? 'vertical' : 'horizontal'}
      onTextChange={onChangeText}
      modifiers={modifiers}
      testID={testID}
    />
  );
}

function autocapitalizationFor(
  value: TextFieldCapitalize,
): 'never' | 'words' | 'sentences' | 'characters' {
  return value === 'none' ? 'never' : value;
}
