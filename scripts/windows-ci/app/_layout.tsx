import {ThemeProvider} from 'expo-router';
import {AccentProvider, Stack, useNavTheme, useWindowChrome} from 'expo-interface';

function Navigation() {
  useWindowChrome({extend: true});
  return (
    <ThemeProvider value={useNavTheme()}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
        <Stack.Screen name="edit" options={{title: 'Edit drop', presentation: 'modal'}}/>
      </Stack>
    </ThemeProvider>
  );
}

export default function Layout() {
  return (
    <AccentProvider seed="#8959EA">
      <Navigation/>
    </AccentProvider>
  );
}
