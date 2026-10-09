import type {TextFieldKeyboard, TextFieldProps, TextFieldReturnKey} from './types';
import type {TextFieldColors, TextFieldImeAction, TextFieldKeyboardActions, TextFieldKeyboardType} from '@expo/ui/jetpack-compose';

import {OutlinedTextField, TextField as ComposeTextField, Text, useMaterialColors, useNativeState} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, offset, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';
import {InlineTextField} from './inline';
import {useSyncedState} from './shared';

const TRANSPARENT = 'transparent';

/** The row's Material container and indicator, in every state, stripped to transparent. */
const BORDERLESS: TextFieldColors = {
  focusedContainerColor: TRANSPARENT,
  unfocusedContainerColor: TRANSPARENT,
  disabledContainerColor: TRANSPARENT,
  errorContainerColor: TRANSPARENT,
  focusedIndicatorColor: TRANSPARENT,
  unfocusedIndicatorColor: TRANSPARENT,
  disabledIndicatorColor: TRANSPARENT,
};

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
 * The `row` variant is the Compose field; `inline` is a React Native
 * `TextInput` for fields inside a React Native layout.
 */
export function TextField(props: TextFieldProps) {
  if (props.variant === 'inline' || props.variant === 'bare') return <InlineTextField {...props}/>;
  return <RowTextField {...props}/>;
}

/**
 * The field in a dialog, the `Alert`'s: Material's `OutlinedTextField`, the
 * way Android's own dialogs draw an input, with Material's outline and
 * container and the row field's keyboard, state and submit logic, placeholder
 * colour and cursor tint. A dialog has no form inset to line up with, so the
 * field is not shifted. Android only.
 */
export function DialogTextField(props: TextFieldProps) {
  return <RowTextField {...props} dialog/>;
}

/**
 * Android's Material `TextField` ships with a filled background and a bottom
 * indicator line that clash with the iOS `Form` look. Here those are stripped
 * to transparent so the field reads as a plain borderless row, the placeholder
 * doubling as the label, living natively inside the surrounding
 * `Host`/`FieldGroup`. In a `dialog` the field is Material's outlined one
 * with its own outline and container kept: there the outline is what shows
 * it is a field. The keyboard's action key is `returnKeyType` (`done`
 * when there is only an `onSubmit`); Compose keeps the field focused after
 * it, so `submitBehavior` has nothing to add here.
 */
function RowTextField({
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
  returnKeyType,
  maxLength,
  accentColor,
  testID,
  dialog,
}: TextFieldProps & {dialog?: boolean}) {
  const colors = useMaterialColors();
  const tint = useColor('tint');
  // Placeholder uses the app palette's tertiaryLabel (like web and iOS's
  // `placeholderText`) instead of Material's onSurfaceVariant, which reads
  // too bright in dark mode next to the other platforms.
  const placeholderColor = useColor('tertiaryLabel');
  const text = useNativeState(value ?? '');
  useSyncedState(text, value);

  const Field = dialog ? OutlinedTextField : ComposeTextField;
  const fieldColors: TextFieldColors = {
    ...(dialog ? {} : BORDERLESS),
    focusedTextColor: colors.onSurface,
    unfocusedTextColor: colors.onSurface,
    disabledTextColor: colors.onSurfaceVariant,
    // Live accent seed by default, matching the web cursor (`theme.tint`) and
    // the iOS field tint, even inside sheets whose native host is unseeded.
    cursorColor: accentColor ?? tint,
  };

  return (
    <Field
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
        imeAction: imeActionFor(returnKeyType, !!onSubmit),
      }}
      keyboardActions={onSubmit ? keyboardActionsFor(onSubmit) : undefined}
      colors={fieldColors}
      textStyle={{fontSize: 16, color: colors.onSurface}}
      modifiers={[
        fillMaxWidth(),
        ...(dialog ? [] : [offset(-CONTENT_PADDING, 0)]),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}>
      {placeholder != null ? (
        <Field.Placeholder>
          <Text color={placeholderColor}>{placeholder}</Text>
        </Field.Placeholder>
      ) : null}
    </Field>
  );
}

/** The action key: the requested one, `done` for a bare `onSubmit`, the default otherwise. */
export function imeActionFor(returnKeyType: TextFieldReturnKey | undefined, hasSubmit: boolean): TextFieldImeAction {
  if (returnKeyType) return returnKeyType;
  return hasSubmit ? 'done' : 'default';
}

/** Every action key reports through `onSubmit`, whichever `imeAction` is shown. */
export function keyboardActionsFor(onSubmit: (text: string) => void): TextFieldKeyboardActions {
  return {onDone: onSubmit, onGo: onSubmit, onNext: onSubmit, onSearch: onSubmit, onSend: onSubmit};
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
