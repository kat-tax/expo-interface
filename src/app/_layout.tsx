import {useEffect} from 'react';
import {useColorScheme} from 'react-native';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {ThemeProvider} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {nav, colors} from '@/ui/theme';
import {Tabs} from '@/components/tabs';

export default function TabLayout() {
  const scheme = useColorScheme();

  useEffect(() => {
    const isDark = scheme === 'dark';
    const barStyle = isDark ? 'light' : 'dark';
    const rootStyle = colors[isDark ? 'dark' : 'light'];
    StatusBar.setStyle(barStyle);
    setBackgroundColorAsync(rootStyle.background);
  }, [scheme]);

  return (
    <ThemeProvider value={nav}>
      <Tabs/>
    </ThemeProvider>
  );
}
