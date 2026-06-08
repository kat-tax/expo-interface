import type {TabRoute} from '@/components/tabs/types';
import {ThemeProvider} from 'expo-router';
import {Tabs} from '@/components/tabs';
import {nav} from '@/ui/theme';

export default function Layout() {
  return (
    <ThemeProvider value={nav}>
      <Tabs {...{routes}}/>
    </ThemeProvider>
  );
}

const routes: readonly TabRoute[] = [
  {
    href: '/',
    name: 'index',
    label: 'Drops',
    icon: {ios: 'arrow.down.square', android: 'download', web: 'download'},
  },
  {
    href: '/settings',
    name: 'settings',
    label: 'Settings',
    icon: {ios: 'gearshape', android: 'settings', web: 'settings'},
  },
];
