import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A WinUI 3 `ProgressBar` or `ProgressRing` hosted in a XAML island. A
 * negative `value` is indeterminate: the bar's dots run, the ring spins.
 */
export interface NativeProps extends ViewProps {
  variant?: CodegenTypes.WithDefault<'linear' | 'circular', 'linear'>;
  /** `0…1`, or negative for indeterminate. */
  value?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  /** Diameter of the ring in points. */
  size?: CodegenTypes.WithDefault<CodegenTypes.Double, 24>;
  /** Fill color (`#RRGGBB`); defaults to `accentColor`. */
  color?: string;
  /** Track color (`#RRGGBB`); defaults to the Fluent track. */
  trackColor?: string;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceProgress');
