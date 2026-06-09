import type {TabBarProps} from './types';
import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {theme, useColor} from '@/ui/theme';

export function Tabs({routes}: TabBarProps) {
  const rippleColor = useColor('pillBackground');

  return (
    <NativeTabs
      backgroundColor="transparent"
      indicatorColor={theme.backgroundElement}
      rippleColor={rippleColor}
      labelStyle={{selected: {color: theme.label}}}>
      {routes.map(route => (
        <NativeTabs.Trigger
          key={route.name}
          name={route.name}>
          <NativeTabs.Trigger.Label>
            {route.label}
          </NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={route.icon.ios}
            md={route.icon.android}
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
