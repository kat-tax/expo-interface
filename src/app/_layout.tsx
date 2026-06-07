import {ThemeProvider} from 'expo-router';
import {Tabs} from '@/components/tabs';
import {nav} from '@/ui/theme';

export default function TabLayout() {
  return (
    <ThemeProvider value={nav}>
      <Tabs/>
    </ThemeProvider>
  );
}
