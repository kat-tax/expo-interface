import type {TextFieldKeyboard, TextFieldProps} from './types';
import type {TextFieldColors, TextFieldKeyboardType} from '@expo/ui/jetpack-compose';

import {TextField as ComposeTextField, Text, useMaterialColors, useNativeState} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, offset, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';
import {useSyncedState} from './shared';

const TRANSPARENT = 'transparent';

/**
 * Material 3's filled `TextField` bakes a 16dp horizontal content padding into
 * the field itself (`TextFieldDefaults.contentPaddingWithoutLabel`), which the
 * published `@expo/ui` does not expose (`BasicTextField` is documented for
 * v56 but not shipped yet). Inside a `FieldGroup` row that padding stacks on
 * the row's own 16dp inset, pushing the text 16dp right of sibling rows — so
 * the field is shifted back by the same amount to line up.
 */
const CONTENT_PADDING = 16;

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
  const tint = useColor('tint');
  // Placeholder uses the app palette's tertiaryLabel (like web and iOS's
  // `placeholderText`) instead of Material's onSurfaceVariant, which reads
  // too bright in dark mode next to the other platforms.
  const placeholderColor = useColor('tertiaryLabel');
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
    // Live accent seed by default — matches the web cursor (`theme.tint`) and
    // the iOS field tint, even inside sheets whose native host is unseeded.
    cursorColor: accentColor ?? tint,
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
      modifiers={[
        fillMaxWidth(),
        offset(-CONTENT_PADDING, 0),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}>
      {placeholder != null ? (
        <ComposeTextField.Placeholder>
          <Text color={placeholderColor}>{placeholder}</Text>
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
