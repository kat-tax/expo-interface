import type {PointerEvent} from 'react-native';
import type {ContextMenuProps} from '../menu/types';
import {useEffect, useState} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {keyHandlers, useXamlProps} from '../windows';
import {menuItemsProp, useMenuShortcuts} from '../menu/windows';

/** The secondary (right) button of a pointer, as pointer events number them. */
const SECONDARY_BUTTON = 2;

/**
 * Windows: a WinUI 3 `MenuFlyout` opened at the pointer on a right click
 * (the platform's context gesture), a touch long-press, the keyboard's Menu
 * key or Shift+F10 while the content has the focus (at its centre, where
 * WinUI opens a keyboard context menu), or the point `at` reports. The
 * content is wrapped in a pressable that reads the pointer and the keys;
 * the flyout is shown from an island laid over it that takes no presses.
 *
 * **The right click and the Menu key open it whichever `trigger` says.** They
 * are what a Windows user and Narrator both reach for, and a prop that took
 * them away would cost more than it gives. `trigger: 'tap'` moves the menu
 * onto the press and drops the long-press, so a touch screen has one gesture
 * for it rather than two.
 */
export function ContextMenu({items, children, onPress, disabled, at, onDismiss, onOpenChange, trigger = 'longPress', testID}: ContextMenuProps) {
  const xaml = useXamlProps();
  useMenuShortcuts(items);
  const [point, setPoint] = useState<{x: number; y: number} | null>(null);
  const [size, setSize] = useState({width: 0, height: 0});

  const open = (x: number, y: number) => {
    setPoint({x, y});
    onOpenChange?.(true);
  };
  const close = () => {
    setPoint(null);
    onOpenChange?.(false);
    onDismiss?.();
  };

  // A point the content reports (a canvas's own right click), in its coordinates.
  useEffect(() => {
    if (!at || disabled) return;
    setPoint({x: at.x, y: at.y});
    onOpenChange?.(true);
    // The handler is the caller's to keep stable; the point is what opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, disabled]);

  const onPointerDown = (event: PointerEvent) => {
    if (disabled || event.nativeEvent.button !== SECONDARY_BUTTON) return;
    open(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
  };

  const keyboard = keyHandlers({
    onKeyDown: event => {
      const {key, shiftKey} = event.nativeEvent;
      if (disabled || !(key === 'ContextMenu' || (key === 'F10' && shiftKey))) return;
      open(size.width / 2, size.height / 2);
    },
  });

  const tap = trigger === 'tap';
  return (
    <Pressable
      disabled={disabled}
      onPress={tap
        ? event => open(event.nativeEvent.locationX, event.nativeEvent.locationY)
        : onPress}
      onLongPress={disabled || tap ? undefined : event => open(event.nativeEvent.locationX, event.nativeEvent.locationY)}
      onPointerDown={onPointerDown}
      onLayout={event => setSize(event.nativeEvent.layout)}
      testID={testID}
      {...keyboard}>
      {children}
      <XamlMenuFlyout
        items={menuItemsProp(items)}
        open={point !== null}
        atPoint
        x={point?.x ?? 0}
        y={point?.y ?? 0}
        onSelect={event => items[event.nativeEvent.index]?.onPress?.()}
        onOpenChange={event => {
          if (!event.nativeEvent.open) close();
        }}
        style={styles.flyout}
        {...xaml}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // One point at the content's origin: the flyout is placed at `x`/`y` from it, and the
  // island is not over the content, whose presses and right clicks it would take.
  flyout: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    pointerEvents: 'none',
  },
});
