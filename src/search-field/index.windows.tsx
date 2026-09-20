import type {SearchFieldProps} from './types';
import XamlAutoSuggestBox from '../windows/specs/ExpoInterfaceAutoSuggestBoxNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {SEARCH_LABEL} from './shared';

/** The height a WinUI text box asks for at its standard size. */
const FIELD_HEIGHT = 32;

/**
 * Windows hosts a WinUI 3 `AutoSuggestBox` — the platform's own search field.
 * The control draws the box, its query glyph, its clear button and the
 * suggestion list, and places and sizes that list itself; the kit only says
 * what is in it.
 *
 * `clearable` is ignored here for the same reason as on web: the control
 * already has a clear button, and drawing a second beside it would be worse
 * than honouring the prop.
 */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  suggestions = [],
  disabled,
  testID,
  style,
}: SearchFieldProps) {
  const xaml = useXamlProps();
  return (
    <XamlAutoSuggestBox
      text={value}
      placeholder={placeholder ?? SEARCH_LABEL}
      suggestions={jsonProp(suggestions)}
      disabled={disabled}
      onTextChange={event => onChangeText(event.nativeEvent.text)}
      onSubmit={event => onSubmit?.(event.nativeEvent.text)}
      style={[{height: FIELD_HEIGHT}, style]}
      testID={testID}
      {...xaml}
    />
  );
}
