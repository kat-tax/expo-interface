import type {PopupMenuProps} from './types';
import {useRef} from 'react';
import {StyleSheet} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {useXamlProps} from '../windows';
import {menuItemsProp, useMenuShortcuts} from '../menu/windows';
import {anchorPoint, filterItems} from './types';

/**
 * Windows: a WinUI 3 `MenuFlyout` opened at `at` from an island at the
 * parent's origin, in the parent's own coordinates. The island is one point,
 * not laid over the parent: an island takes the pointer for itself, whatever
 * React Native's hit testing says, and the canvas, editor or view underneath
 * keeps its presses this way.
 */
export function PopupMenu({items, at, preferredEdge = 'auto', filter, onDismiss, testID}: PopupMenuProps) {
  const xaml = useXamlProps();
  useMenuShortcuts(items);
  const entries = filterItems(items, filter);
  // A pick closes the flyout too; the close that follows one is a selection.
  const picked = useRef(false);
  const point = anchorPoint(at, preferredEdge);
  return (
    <XamlMenuFlyout
      items={menuItemsProp(entries)}
      open={at !== null}
      atPoint
      x={point.x}
      y={point.y}
      edge={preferredEdge === 'top' ? 'top' : 'bottom'}
      onSelect={event => {
        picked.current = true;
        entries[event.nativeEvent.index]?.onPress?.();
      }}
      onOpenChange={event => {
        if (event.nativeEvent.open) {
          picked.current = false;
          return;
        }
        // A close after the app cleared `at` is the app's own, and it knows.
        if (at !== null) onDismiss?.(picked.current ? 'select' : 'dismiss');
        picked.current = false;
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
