import {ThemeProvider} from 'expo-router';
import {Tabs} from '@/ui/tabs';
import {nav} from '@/ui/theme';

export default function Layout() {
  return (
    <ThemeProvider value={nav}>
      <Tabs webLogo="icon-only" routes={[
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
      ]}/>
    </ThemeProvider>
  );
}
