import {ThemeProvider, Stack} from 'expo-router';
import {AccentProvider, useNavTheme} from 'expo-interface';

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
  // i.e. <AccentProvider seed="#8959EA">
  return (
    <AccentProvider>
      <Navigation/>
    </AccentProvider>
  );
}
