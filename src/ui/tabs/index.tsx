import type {TabBarProps} from './types';
import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {useColor} from '@/ui/theme';

export function Tabs({routes}: TabBarProps) {
  const rippleColor = useColor('pillBackground');
  const indicatorColor = useColor('backgroundElement');
  const labelColor = useColor('label');

  return (
    <NativeTabs
      backgroundColor="transparent"
      indicatorColor={indicatorColor}
      rippleColor={rippleColor}
      labelStyle={{selected: {color: labelColor}}}
      // Monochrome selected icon to match the label (and the web tab bar);
      // without it iOS falls back to the default system tint.
      iconColor={{selected: labelColor}}>
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
