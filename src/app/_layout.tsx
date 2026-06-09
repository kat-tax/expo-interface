import {ThemeProvider, Stack} from 'expo-router';
import {useNavTheme} from '@/ui/theme';

export default function Layout() {
  return (
    <ThemeProvider value={useNavTheme()}>
      <Stack screenOptions={{headerShown: false}}/>
    </ThemeProvider>
  );
}
