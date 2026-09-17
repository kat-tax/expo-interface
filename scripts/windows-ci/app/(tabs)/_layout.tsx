import {type TabRoute, Tabs} from 'expo-interface';

const routes: TabRoute[] = [
  {href: '/', name: '(home)', label: 'Harness', icon: {ios: 'house', android: 'home', web: 'home'}, badge: 3},
  {href: '/help', name: 'help', label: 'Help', icon: {ios: 'questionmark.circle', android: 'help', web: 'help'}, badge: 'new', windowsPlacement: 'footer'},
  {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}, windowsPlacement: 'settings'},
];

export default function TabsLayout() {
  return <Tabs routes={routes} windowsPane="auto"/>;
}
