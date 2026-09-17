import type {PopupMenuProps} from './types';
import {StyleSheet} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {useXamlProps} from '../windows';
import {menuItemsProp, useMenuShortcuts} from '../menu/windows';
import {filterItems} from './types';

/**
 * Windows: a WinUI 3 `MenuFlyout` opened at `at` from an island at the
 * parent's origin, in the parent's own coordinates. The island is one point,
 * not laid over the parent: an island takes the pointer for itself, whatever
 * React Native's hit testing says, and the canvas, editor or view underneath
 * keeps its presses this way.
 */
export function PopupMenu({items, at, filter, onDismiss, testID}: PopupMenuProps) {
  const xaml = useXamlProps();
  useMenuShortcuts(items);
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
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    pointerEvents: 'none',
  },
});
