import {ThemeProvider} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {Tabs} from '@/components/tabs';
import {nav} from '@/ui/theme';

export default function Layout() {
  return (
    <ThemeProvider value={nav}>
      <StatusBar/>
      <Tabs/>
    </ThemeProvider>
  );
}
