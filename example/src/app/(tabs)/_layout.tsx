import {type TabRoute, Tabs} from 'expo-interface';

export const routes: Array<TabRoute> = [
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
  return (
    <Tabs webLogo="icon-only" webIcon={require('@/assets/images/icon.png')} routes={routes}/>
  );
}
