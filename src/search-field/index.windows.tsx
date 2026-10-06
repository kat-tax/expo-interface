import type {ComponentRef} from 'react';
import type {SearchFieldProps} from './types';
import {useImperativeHandle, useRef} from 'react';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import XamlAutoSuggestBox from '../windows/specs/ExpoInterfaceAutoSuggestBoxNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {SEARCH_LABEL} from './shared';

/** The height a WinUI text box asks for at its standard size. */
const FIELD_HEIGHT = 32;

type Box = ComponentRef<typeof XamlAutoSuggestBox>;

/** react-native-windows' focus commands on a view, which an island hands on to the control it holds. */
const BoxCommands = codegenNativeCommands<{focus: (view: Box) => void; blur: (view: Box) => void}>({supportedCommands: ['focus', 'blur']});

/**
 * Windows hosts a WinUI 3 `AutoSuggestBox` — the platform's own search field.
 * The control draws the box, its query glyph, its clear button and the
 * suggestion list, and places and sizes that list itself; the kit only says
 * what is in it.
 *
 * `clearable` is ignored here for the same reason as on web: the control
 * already has a clear button, and drawing a second beside it would be worse
 * than honouring the prop. `autoCapitalize` has no Windows equivalent.
 */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  suggestions = [],
  disabled,
  autoFocus,
  onFocus,
  onBlur,
  onKeyPress,
  ref,
  testID,
  style,
}: SearchFieldProps) {
  const xaml = useXamlProps();
  const box = useRef<Box>(null);
  const command = (name: 'focus' | 'blur') => {
    if (!box.current) return;
    try {
      BoxCommands[name](box.current);
    } catch {
      // A renderer without the command (the test harness) leaves the focus where it is.
    }
  };
  useImperativeHandle(ref, () => ({
    focus: () => command('focus'),
    blur: () => command('blur'),
  }));
  return (
    <XamlAutoSuggestBox
      ref={box}
      text={value}
      placeholder={placeholder ?? SEARCH_LABEL}
      suggestions={jsonProp(suggestions)}
      disabled={disabled}
      autoFocus={autoFocus}
      onTextChange={event => onChangeText(event.nativeEvent.text)}
      onSubmit={event => onSubmit?.(event.nativeEvent.text)}
      onFocusChange={event => (event.nativeEvent.focused ? onFocus : onBlur)?.()}
      onKeyPress={onKeyPress ? event => onKeyPress(event.nativeEvent.key) : undefined}
      style={[{height: FIELD_HEIGHT}, style]}
      testID={testID}
      {...xaml}
    />
  );
}
