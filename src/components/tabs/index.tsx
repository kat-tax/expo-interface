import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {theme} from '@/ui/theme';
import routes from './routes';

export function Tabs() {
  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.backgroundElement}
      labelStyle={{selected: {color: theme.label}}}>
      {routes.map(route => (
        <NativeTabs.Trigger key={route.name} name={route.name}>
          <NativeTabs.Trigger.Label>{route.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={route.icon.ios} md={route.icon.android}/>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
