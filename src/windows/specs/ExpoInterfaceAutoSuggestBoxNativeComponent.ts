import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type TextEvent = Readonly<{text: string}>;

/**
 * A WinUI 3 `AutoSuggestBox` hosted in a XAML island: the platform's own
 * search field, with the query box, the clear button and the suggestion list
 * the system draws and places.
 */
export interface NativeProps extends ViewProps {
  /** What is in the box. The kit owns it; the control follows. */
  text: string;
  placeholder?: string;
  /** JSON array of the completions to offer. Empty draws no list. */
  suggestions: string;
  disabled?: boolean;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  /** The text a person typed — never a change the kit itself made. */
  onTextChange?: CodegenTypes.DirectEventHandler<TextEvent>;
  /** Enter, the search glyph, or a suggestion taken from the list. */
  onSubmit?: CodegenTypes.DirectEventHandler<TextEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceAutoSuggestBox');
