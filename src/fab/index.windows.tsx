import type {FabProps} from './types';
import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import XamlMenuFlyout from '../windows/specs/ExpoInterfaceMenuFlyoutNativeComponent';
import {useXamlProps} from '../windows';
import {menuItemsProp} from '../menu/windows';
import {pressFeedback} from '../surface/shared';
import {Symbol} from '../symbol';
import {onAccent} from '../accent';
import {fonts, fontWeights, useColor} from '../theme';
import {FAB_EXTENDED_PADDING, FAB_GAP, FAB_ICON, FAB_RADIUS, FAB_SIZE} from './shared';

const SHADOW = '0 4px 12px rgba(0, 0, 0, 0.24)';

/**
 * Windows draws the floating action button, as iOS does: Fluent has no
 * such control, so it is the Material geometry — a rounded square or a
 * circle, the extended capsule with its label — filled with the accent seed
 * and raised on a shadow, with a Segoe glyph. With `items` a press opens a
 * WinUI 3 `MenuFlyout` above the button, from an island laid over it.
 */
export function Fab({label, icon, onPress, items, size = 'regular', shape = 'rounded', disabled, onOpenChange, testID}: FabProps) {
  const xaml = useXamlProps();
  const tint = useColor('tint');
  const [open, setOpen] = useState(false);
  const show = (next: boolean) => {
    if (next === open) return;
    setOpen(next);
    onOpenChange?.(next);
  };
  const extended = size === 'extended';
  const side = FAB_SIZE[size];
  const radius = shape === 'circle' ? side / 2 : FAB_RADIUS[size];
  const contrast = onAccent(tint);
  return (
    <View style={styles.anchor}>
      <Pressable
        role="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={items ? () => show(true) : onPress}
        style={state => [
          styles.button,
          {height: side, minWidth: side, borderRadius: radius, backgroundColor: tint},
          extended && styles.extended,
          disabled && styles.disabled,
          pressFeedback(state),
        ]}
        testID={testID}>
        <Symbol icon={icon} size={FAB_ICON[size]} tintColor={contrast}/>
        {extended ? <Text style={[styles.label, {color: contrast}]}>{label}</Text> : null}
      </Pressable>
      {items ? (
        <XamlMenuFlyout
          items={menuItemsProp(items)}
          open={open}
          onSelect={event => items[event.nativeEvent.index]?.onPress?.()}
          onOpenChange={event => show(event.nativeEvent.open)}
          style={styles.flyout}
          {...xaml}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignSelf: 'flex-start',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    boxShadow: SHADOW,
  },
  extended: {
    paddingHorizontal: FAB_EXTENDED_PADDING,
    gap: FAB_GAP,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
  flyout: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
});
