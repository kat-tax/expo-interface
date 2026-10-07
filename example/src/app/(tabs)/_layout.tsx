import {type TabRoute, Tabs} from 'expo-interface';
import * as icons from '@/icons';
import {usePane} from '@/profile/pane';

// The sections' icons are the app's own tokens, as every other icon in it is.
export const routes: TabRoute[] = [
  {href: '/', name: '(drops)', label: 'Drops', icon: icons.home},
  {href: '/settings', name: 'settings', label: 'Settings', icon: icons.settings},
];

export default function TabsLayout() {
  // Windows only: the pane the Settings screen picks; the other platforms draw their own tabs.
  const pane = usePane();
  return (
    <Tabs webLogo="icon-only" webIcon={require('@/assets/images/icon.png')} routes={routes} windowsPane={pane}/>
  );
}
