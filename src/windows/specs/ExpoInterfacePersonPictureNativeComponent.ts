import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A WinUI 3 `PersonPicture` hosted in a XAML island: the Windows avatar, a
 * circle with initials, filled with the color the kit hashes from the name.
 */
export interface NativeProps extends ViewProps {
  initials: string;
  /** Accessible name. */
  displayName: string;
  /** Fill (`#RRGGBB`). */
  color: string;
  /** Diameter in points. */
  size?: CodegenTypes.WithDefault<CodegenTypes.Double, 28>;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfacePersonPicture');
