import type {MenuProps} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {useXamlProps} from '../windows';
import {Button} from '../button';
import {menuItemsProp} from './windows';

/**
 * Windows: the kit's button (a XAML island of its own) with a WinUI 3
 * `MenuFlyout` opened below it. The flyout is shown from a second island
 * laid over the button — an empty anchor that takes no presses — so the
 * menu is placed against the trigger's rectangle, and the platform owns the
 * flyout: its light dismiss, its keyboard navigation, its position on
 * screen. `trigger="link"` is the text variant here.
 */
export function Menu({label, icon, items, trigger = 'button', onOpenChange, testID, ...button}: MenuProps) {
  const xaml = useXamlProps();
  const [open, setOpen] = useState(false);
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
  // Over the trigger, so the flyout is placed against its rectangle; the
  // trigger keeps the presses.
  flyout: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
});
