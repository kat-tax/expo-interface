import type {TabRoute} from '@/ui/tabs/types';
import {Tabs} from '@/ui/tabs';

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
    <Tabs webLogo="icon-only" routes={routes}/>
  );
}
