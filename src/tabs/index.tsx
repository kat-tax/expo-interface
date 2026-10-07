import type {TabBarProps} from './types';
import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {Platform, StyleSheet, View} from 'react-native';
import {useColor} from '../theme';
import {AccessoryAction, FloatingAction, TAB_ACTION_LIFT} from './action';
import {tabBadge} from './badge';
import {NativeTabsContext, TabActionLiftContext} from './context';
import {HideTabsContext, useHiddenTabs} from './hide';
import {routeSymbol} from './icon';

/** Whether UIKit gives the tab bar a bottom accessory, which it does from iOS 26. */
function hasAccessory(): boolean {
  return Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
}

export function Tabs({routes, hidden: hiddenProp = false, action, badgeMax = 99}: TabBarProps) {
  // Hidden by the prop, or while a focused screen renders `HideTabs`.
  const {hider, hidden} = useHiddenTabs(hiddenProp);
  const rippleColor = useColor('pillBackground');
  const indicatorColor = useColor('backgroundElement');
  const labelColor = useColor('label');

  // Where the platform has no place for it in the bar, the action floats above it.
  const accessory = hasAccessory();
  const floating = action != null && !accessory;
  return (
    <NativeTabsContext.Provider value={true}>
      <HideTabsContext.Provider value={hider}>
      <TabActionLiftContext.Provider value={floating && !hidden ? TAB_ACTION_LIFT : 0}>
      <View style={styles.root}>
      <NativeTabs
        hidden={hidden}
        backgroundColor="transparent"
        indicatorColor={indicatorColor}
        rippleColor={rippleColor}
        labelStyle={{selected: {color: labelColor}}}
        // Monochrome selected icon to match the label (and the web tab bar);
        // without it iOS falls back to the default system tint.
        iconColor={{selected: labelColor}}>
        {action && accessory ? (
          <NativeTabs.BottomAccessory>
            <AccessoryAction action={action}/>
          </NativeTabs.BottomAccessory>
        ) : null}
        {routes.map(route => {
          const symbol = routeSymbol(route.icon);
          const badge = tabBadge(route.badge, badgeMax);
          return (
          <NativeTabs.Trigger
            key={route.name}
            name={route.name}>
            <NativeTabs.Trigger.Label>
              {route.label}
            </NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={symbol.ios}
              md={symbol.android}
            />
            {badge != null ? (
              <NativeTabs.Trigger.Badge>{badge}</NativeTabs.Trigger.Badge>
            ) : null}
          </NativeTabs.Trigger>
          );
        })}
      </NativeTabs>
      {floating && !hidden ? <FloatingAction action={action}/> : null}
      </View>
      </TabActionLiftContext.Provider>
      </HideTabsContext.Provider>
    </NativeTabsContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
