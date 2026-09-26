import {type TabRoute, Tabs} from 'expo-interface';
import {usePane} from '@/profile/pane';

export const routes: TabRoute[] = [
  {
    href: '/',
    name: '(drops)',
    label: 'Drops',
    icon: {
      ios: 'arrow.down.square',
      android: 'download',
      web: 'download',
    },
  },
  {
    href: '/settings',
    name: 'settings',
    label: 'Settings',
    icon: {
      ios: 'gearshape',
      android: 'settings',
      web: 'settings',
    },
  },
];

export default function TabsLayout() {
  // Windows only: the pane the Settings screen picks; the other platforms draw their own tabs.
  const pane = usePane();
  return (
    <Tabs webLogo="icon-only" webIcon={require('@/assets/images/icon.png')} routes={routes} windowsPane={pane}/>
  );
}
