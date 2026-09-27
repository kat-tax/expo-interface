import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A XAML island drawn on one of Windows' materials
 * (`windows/ExpoInterface/Portal.cpp`): Mica or acrylic as the island's
 * system backdrop, a tint over it, and its whole area a slot an
 * `ExpoInterfacePortal` with the same `slot` fills with React Native content.
 * The island takes the height the portal's content lays out to; without a
 * slot it is a box of material sized by its style.
 */
export interface NativeProps extends ViewProps {
  /** Names the content slot a portal connects into; unique per screen. */
  slot?: string;
  /**
   * The material. Mica (`mica`, `micaAlt`) is drawn from the desktop
   * wallpaper; acrylic (`acrylic`, `acrylicBase`, `acrylicThin`) from what is
   * behind the window. `none` draws the tint alone.
   */
  material?: CodegenTypes.WithDefault<'mica' | 'micaAlt' | 'acrylic' | 'acrylicBase' | 'acrylicThin' | 'none', 'acrylic'>;
  /** A color laid over the material (`#RRGGBB` or `#RRGGBBAA`). */
  tintColor?: string;
  /** The kit's accent seed (`#RRGGBB`). */
  accentColor?: string;
  /** The scheme the material and the content are drawn in; `system` follows the OS. */
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceMaterial');
