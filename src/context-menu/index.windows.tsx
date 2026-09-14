import type {PointerEvent} from 'react-native';
import type {ContextMenuProps} from '../menu/types';
import {useEffect, useState} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {useXamlProps} from '../windows';
import {menuItemsProp} from '../menu/windows';

/** The secondary (right) button of a pointer, as pointer events number them. */
const SECONDARY_BUTTON = 2;

/**
 * Windows: a WinUI 3 `MenuFlyout` opened at the pointer on a right click
 * (the platform's context gesture), a touch long-press, or the point `at`
 * reports. The content is wrapped in a pressable that reads the pointer;
 * the flyout is shown from an island laid over it that takes no presses.
 */
export function ContextMenu({items, children, onPress, disabled, at, onDismiss, onOpenChange, testID}: ContextMenuProps) {
  const xaml = useXamlProps();
  const [point, setPoint] = useState<{x: number; y: number} | null>(null);

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

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={disabled ? undefined : event => open(event.nativeEvent.locationX, event.nativeEvent.locationY)}
      onPointerDown={onPointerDown}
      testID={testID}>
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
  flyout: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
});
