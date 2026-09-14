import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A WinUI 3 `Button` hosted in a XAML island (`windows/ExpoInterface/Button.cpp`).
 *
 * The control measures itself: the island reports the button's desired size
 * to Yoga, so the component hugs its content like a native button unless a
 * style stretches it. Colors are the Fluent theme's; `accentColor` seeds the
 * accent brushes (a `filled` button's fill, the text of `text` and
 * `outlined` ones) so a kit accent reads the same here as on iOS.
 */
export interface NativeProps extends ViewProps {
  /** Text of the button; the accessible name when `iconOnly`. */
  label: string;
  /** Segoe Fluent Icons code point (`E72D`) drawn before the label. */
  glyph?: string;
  /** Segoe Fluent Icons code point drawn after the label. */
  glyphAfter?: string;
  /** Only the glyph is drawn; `label` names the button. */
  iconOnly?: boolean;
  variant?: CodegenTypes.WithDefault<'filled' | 'outlined' | 'text', 'filled'>;
  /** `destructive` draws the button in the critical color (`role` is a view prop already). */
  buttonRole?: CodegenTypes.WithDefault<'default' | 'destructive', 'default'>;
  /** The `text` variant's content color: the accent, or the label color. */
  tone?: CodegenTypes.WithDefault<'accent' | 'label', 'accent'>;
  /** Explicit accent (`#RRGGBB`); defaults to `accentColor`. */
  color?: string;
  size?: CodegenTypes.WithDefault<'inline' | 'small' | 'medium' | 'large', 'medium'>;
  shape?: CodegenTypes.WithDefault<'default' | 'rounded' | 'pill' | 'circle', 'default'>;
  /** Glyph size in points. */
  glyphSize?: CodegenTypes.Double;
  /** Stretch to the width Yoga gives, rather than hugging the content. */
  fillWidth?: boolean;
  disabled?: boolean;
  /** The kit's accent seed (`#RRGGBB`). */
  accentColor?: string;
  /** The scheme the control is drawn in; `system` follows the OS. */
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onPress?: CodegenTypes.BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceButton');
