import AppTabs from '@/components/app-tabs';
import {DarkTheme, DefaultTheme, ThemeProvider} from 'expo-router';
import {useColorScheme} from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
