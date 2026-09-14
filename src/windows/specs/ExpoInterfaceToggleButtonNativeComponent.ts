import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ValueEvent = Readonly<{value: boolean}>;

/**
 * A WinUI 3 `ToggleButton` holding a `FontIcon`, hosted in a XAML island:
 * the icon toggle. The glyph swaps with the state, and the button's own
 * checked look is replaced by the two colors, since that is how the toggle
 * reads on the other platforms.
 */
export interface NativeProps extends ViewProps {
  value: boolean;
  /** Segoe Fluent Icons code point while off. */
  glyph: string;
  /** Segoe Fluent Icons code point while on; defaults to `glyph`. */
  activeGlyph?: string;
  /** Glyph size in points. */
  size?: CodegenTypes.WithDefault<CodegenTypes.Double, 24>;
  /** Color while on (`#RRGGBB`); defaults to `accentColor`. */
  color?: string;
  /** Color while off (`#RRGGBB`); defaults to the secondary text color. */
  offColor?: string;
  label: string;
  disabled?: boolean;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onValueChange?: CodegenTypes.DirectEventHandler<ValueEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceToggleButton');
