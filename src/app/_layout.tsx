import {ThemeProvider, Stack} from 'expo-router';
import {AccentProvider} from '@/ui/accent';
import {useNavTheme} from '@/ui/theme';

/** Separate component so useNavTheme reads the accent seed from the provider. */
function Navigation() {
  return (
    <ThemeProvider value={useNavTheme()}>
      <Stack screenOptions={{headerShown: false}}/>
    </ThemeProvider>
  );
}

export default function Layout() {
  // Pass a `seed` prop here to apply a user-supplied accent color.
  return (
    <AccentProvider>
      <Navigation/>
    </AccentProvider>
  );
}
