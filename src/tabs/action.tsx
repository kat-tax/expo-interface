import type {TabBarAction} from './types';
import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Button} from '../button';
import {Fab} from '../fab';
import {Menu} from '../menu';
import {inset, spacing} from '../theme';

/** The room a floating action takes above the tab bar: the button and its gap. */
export const TAB_ACTION_LIFT = 56 + spacing.three;

/**
 * iOS 26: the action in the tab bar's bottom accessory, a button or a menu
 * drawn plainly in the accessory's glass. UIKit renders the accessory twice,
 * wide over the tab bar and inline in a minimized one; the inline one shows
 * the icon alone, its label kept as the accessible name.
 */
export function AccessoryAction({action}: {action: TabBarAction}) {
  const inline = NativeTabs.BottomAccessory.usePlacement() === 'inline';
  return (
    <View style={styles.accessory}>
      {action.items ? (
        <Menu label={action.label} icon={action.icon} items={action.items} variant="text" tone="label" hideLabel={inline}/>
      ) : (
        <Button label={action.label} prefixIcon={action.icon} onPress={action.onPress} variant="text" tone="label" hideLabel={inline}/>
      )}
    </View>
  );
}

/**
 * Android, and iOS before 26: the action as a floating action button at
 * the bottom trailing corner, above the tab bar, over every tab's screens,
 * as Material places a FAB beside its navigation bar.
 */
export function FloatingAction({action}: {action: TabBarAction}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.floating, {right: spacing.three + insets.right, bottom: inset.bottomTab + insets.bottom + spacing.three}]} testID="tab-action-slot">
      <Fab label={action.label} icon={action.icon} onPress={action.onPress} items={action.items} testID="tab-action"/>
    </View>
  );
}

const styles = StyleSheet.create({
  accessory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floating: {
    position: 'absolute',
    // Only the button takes presses, not the slot it sits in.
    pointerEvents: 'box-none',
  },
});
