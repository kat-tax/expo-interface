import {ThemeProvider} from 'expo-router';
import {Tabs} from '@/components/tabs';
import {nav} from '@/ui/theme';

export default function Layout() {
  return (
    <ThemeProvider value={nav}>
      <Tabs/>
    </ThemeProvider>
  );
}
