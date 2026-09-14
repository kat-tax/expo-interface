import type {PopupMenuProps} from './types';
import {StyleSheet} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {useXamlProps} from '../windows';
import {menuItemsProp} from '../menu/windows';
import {filterItems} from './types';

/**
 * Windows: a WinUI 3 `MenuFlyout` opened at `at` from an island laid over
 * the parent, in the parent's own coordinates. The island takes no presses,
 * so the canvas, editor or view underneath keeps them.
 */
export function PopupMenu({items, at, filter, onDismiss, testID}: PopupMenuProps) {
  const xaml = useXamlProps();
  const entries = filterItems(items, filter);
  return (
    <XamlMenuFlyout
      items={menuItemsProp(entries)}
      open={at !== null}
      atPoint
      x={at?.x ?? 0}
      y={at?.y ?? 0}
      onSelect={event => entries[event.nativeEvent.index]?.onPress?.()}
      onOpenChange={event => {
        if (!event.nativeEvent.open) onDismiss?.();
      }}
      style={styles.overlay}
      testID={testID}
      {...xaml}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
});
