import type {ReactNode} from 'react';
import {useState} from 'react';
import {View} from 'react-native';
import NativePortal from './specs/ExpoInterfacePortalNativeComponent';

export interface PortalProps {
  /** The slot a hosting island registered under the same name. */
  slot: string;
  children?: ReactNode;
}

/**
 * React Native content inside a XAML control's content slot, in the same
 * React tree (`ExpoInterfacePortal`, see `windows/ExpoInterface/Portal.cpp`).
 *
 * The children mount once the portal's island is connected: an island among
 * them mounted earlier aborts the app. While the control hides its content
 * area the children stay mounted and laid out, hidden on the compositor, and
 * leave the accessibility tree: unmounting them or `display: none` would
 * destroy or zero the nested islands, after which react-native-windows' UI
 * Automation tree enumerates nothing on the page. The wrapping view is the
 * portal's one direct child, the one whose height the slot takes.
 */
export function Portal({slot, children}: PortalProps) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  return (
    <NativePortal
      slot={slot}
      onReady={() => setReady(true)}
      onVisibleChange={event => setVisible(event.nativeEvent.visible)}>
      {ready ? (
        <View accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}>
          {children}
        </View>
      ) : null}
    </NativePortal>
  );
}
