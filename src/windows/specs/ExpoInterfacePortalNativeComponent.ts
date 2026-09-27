import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A react-native-windows portal whose child renders inside another island's
 * content slot, in the same React tree (`windows/ExpoInterface/Portal.cpp`).
 * `slot` names the slot a hosting island registered. The portal takes the
 * slot's width, hands the child's height back to the slot, follows the slot
 * while its control animates, and carries focus in and out.
 */
export interface NativeProps extends ViewProps {
  slot: string;
  /**
   * The portal's island is connected into the slot. Children mount after
   * this: react-native-windows aborts when an island mounts under a root
   * whose island is not connected yet.
   */
  onReady?: CodegenTypes.BubblingEventHandler<Readonly<{connected: boolean}>>;
  /**
   * The slot's content area was hidden or shown by its control. The content
   * stays mounted and laid out (unmounting or `display: none` would destroy
   * the nested islands, after which react-native-windows' UI Automation tree
   * enumerates nothing on the page); the portal hides it on the compositor,
   * and the React side takes it out of the accessibility tree meanwhile.
   */
  onVisibleChange?: CodegenTypes.BubblingEventHandler<Readonly<{visible: boolean}>>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfacePortal');
