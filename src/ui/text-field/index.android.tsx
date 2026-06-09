import type {TextFieldKeyboard, TextFieldProps} from './types';
import type {TextFieldColors, TextFieldKeyboardType} from '@expo/ui/jetpack-compose';

import {TextField as ComposeTextField, Text, useMaterialColors, useNativeState} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useSyncedState} from './shared';

const TRANSPARENT = 'transparent';

/**
 * Android's Material `TextField` ships with a filled background and a bottom
 * indicator line that clash with the iOS `Form` look. Here those are stripped
 * to transparent so the field reads as a plain borderless row — the placeholder
 * doubles as the label — living natively inside the surrounding
 * `Host`/`FieldGroup`.
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
  const colors = useMaterialColors();
  const text = useNativeState(value ?? '');
  useSyncedState(text, value);

  const fieldColors: TextFieldColors = {
    focusedContainerColor: TRANSPARENT,
    unfocusedContainerColor: TRANSPARENT,
    disabledContainerColor: TRANSPARENT,
    errorContainerColor: TRANSPARENT,
    focusedIndicatorColor: TRANSPARENT,
    unfocusedIndicatorColor: TRANSPARENT,
    disabledIndicatorColor: TRANSPARENT,
    focusedTextColor: colors.onSurface,
    unfocusedTextColor: colors.onSurface,
    disabledTextColor: colors.onSurfaceVariant,
    ...(accentColor ? {cursorColor: accentColor} : null),
  };

  return (
    <ComposeTextField
      value={text}
      onValueChange={onChangeText}
      enabled={disabled !== true}
      singleLine={!multiline}
      autoFocus={autoFocus}
      maxLength={maxLength}
      visualTransformation={secureTextEntry ? 'password' : 'none'}
      keyboardOptions={{
        keyboardType: keyboardTypeFor(keyboardType, secureTextEntry),
        capitalization: autoCapitalize,
        autoCorrectEnabled: autoCorrect,
        imeAction: onSubmit ? 'done' : 'default',
      }}
      keyboardActions={onSubmit ? {onDone: onSubmit} : undefined}
      colors={fieldColors}
      textStyle={{fontSize: 16, color: colors.onSurface}}
      modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
      {placeholder != null ? (
        <ComposeTextField.Placeholder>
          <Text color={colors.onSurfaceVariant}>{placeholder}</Text>
        </ComposeTextField.Placeholder>
      ) : null}
    </ComposeTextField>
  );
}

function keyboardTypeFor(
  type: TextFieldKeyboard | undefined,
  secure: boolean | undefined,
): TextFieldKeyboardType {
  if (secure) {
    return type === 'number' ? 'numberPassword' : 'password';
  }
  switch (type) {
    case 'email':
      return 'email';
    case 'number':
      return 'number';
    case 'phone':
      return 'phone';
    case 'decimal':
      return 'decimal';
    case 'url':
      return 'uri';
    case 'default':
    default:
      return 'text';
  }
}
