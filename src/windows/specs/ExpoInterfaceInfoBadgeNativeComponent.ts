import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A WinUI 3 `InfoBadge` hosted in a XAML island: the platform's own count or
 * dot, which takes Fluent's shape, its minimum size and its type ramp rather
 * than a drawn approximation of them.
 */
export interface NativeProps extends ViewProps {
  /**
   * The number to show. Negative draws the control's dot form.
   *
   * A number and not a string, because that is all `InfoBadge` takes: it has
   * a `Value` and an `IconSource`, and no content of its own. An overflowing
   * count therefore reads as the cap (`99`) here where the other platforms
   * draw `99+`; `label` carries the true wording for a screen reader.
   */
  value?: CodegenTypes.WithDefault<CodegenTypes.Int32, -1>;
  /** Fill color (`#RRGGBB`); defaults to Fluent's critical fill. */
  color?: string;
  /** Color of the number; defaults to whichever of black or white reads on `color`. */
  textColor?: string;
  /** What a screen reader says, which is better than the bare number. */
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceInfoBadge');
