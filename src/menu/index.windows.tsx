import type {MenuProps} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {useXamlProps} from '../windows';
import {Button} from '../button';
import {menuItemsProp, useMenuShortcuts} from './windows';

/**
 * Windows: the kit's button (a XAML island of its own) with a WinUI 3
 * `MenuFlyout` opened below it. The flyout is shown from a second island —
 * an empty anchor, a strip along the trigger's bottom edge — so the menu is
 * placed right under the trigger, and the platform owns the flyout: its
 * light dismiss, its keyboard navigation, its position on screen. The anchor
 * is not laid over the trigger: an island takes the pointer for itself,
 * whatever React Native's hit testing says. `trigger="link"` is the text
 * variant here.
 */
export function Menu({label, icon, items, trigger = 'button', onOpenChange, testID, ...button}: MenuProps) {
  const xaml = useXamlProps();
  const [open, setOpen] = useState(false);
  useMenuShortcuts(items);
  const show = (next: boolean) => {
    if (next === open) return;
    setOpen(next);
    onOpenChange?.(next);
  };
  return (
    <View style={styles.anchor}>
      <Button
        {...button}
        variant={trigger === 'link' ? 'text' : button.variant}
        label={label}
        prefixIcon={icon}
        onPress={() => show(true)}
        testID={testID}
      />
      <XamlMenuFlyout
        items={menuItemsProp(items)}
        open={open}
        onSelect={event => items[event.nativeEvent.index]?.onPress?.()}
        onOpenChange={event => show(event.nativeEvent.open)}
        style={styles.flyout}
        {...xaml}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignSelf: 'flex-start',
  },
  // A strip along the trigger's bottom edge, so the flyout is placed right
  // below it. Not over the trigger: an island takes the pointer for itself,
  // whatever React Native's hit testing says, and would swallow the press.
  flyout: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    pointerEvents: 'none',
  },
});
