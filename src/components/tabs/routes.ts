import type {Href} from 'expo-router';
import type {SFSymbol, AndroidSymbol} from 'expo-symbols';

export interface TabRoute {
  /** Route segment, matching the file name in `src/app`. */
  name: string;
  /** Navigation target used by the web tab bar. */
  href: Href;
  /** Visible tab label. */
  label: string;
  /** Symbol name per platform. */
  icon: {
    ios: SFSymbol;
    android: AndroidSymbol;
    web: AndroidSymbol;
  };
}

export default <readonly TabRoute[]> [
  {
    href: '/',
    name: 'index',
    label: 'Drops',
    icon: {ios: 'house', android: 'home', web: 'home'},
  },
  {
    href: '/settings',
    name: 'settings',
    label: 'Settings',
    icon: {ios: 'gearshape', android: 'settings', web: 'settings'},
  },
];
