import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A WinUI 3 `Expander` in a XAML island (`windows/ExpoInterface/Portal.cpp`)
 * whose content area is a slot an `ExpoInterfacePortal` with the same `slot`
 * fills with React Native content. The island reports the control's size to
 * Yoga, holds it while the content area closes so the content can slide up
 * under the header, and hands the portal the element WinUI clips its own
 * content to, so the React content is clipped the same way.
 */
export interface NativeProps extends ViewProps {
  header: string;
  /** Names the content slot a portal connects into; unique per screen. */
  slot: string;
  expanded?: boolean;
  /** The kit's accent seed (`#RRGGBB`). */
  accentColor?: string;
  /** The scheme the control is drawn in; `system` follows the OS. */
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onToggle?: CodegenTypes.BubblingEventHandler<Readonly<{expanded: boolean}>>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceExpander');
