import {DarkTheme, DefaultTheme, ThemeProvider} from 'expo-router';
import {useColorScheme} from 'react-native';
import {Tabs} from '@/components/tabs';

export default function TabLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tabs/>
    </ThemeProvider>
  );
}
