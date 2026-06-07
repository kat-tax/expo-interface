import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {usePalette} from '@/ui/theme';

export default function AppTabs() {
  const palette = usePalette();
  return (
    <NativeTabs
      backgroundColor={palette.background}
      indicatorColor={palette.backgroundElement}
      labelStyle={{selected: {color: palette.label}}}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/home.png')} renderingMode="template"/>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/explore.png')} renderingMode="template"/>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
