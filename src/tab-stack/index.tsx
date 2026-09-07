import type {ReactNode} from 'react';
import {Stack} from 'expo-router';
import {Platform} from 'react-native';
import {useNavTheme} from '../theme';

export interface TabStackProps {
  /** Title of the tab's root screen, in its native header. */
  title: string;
  /**
   * Content of the header's trailing slot on iOS and Android (the web shows
   * no header for a tab root: its actions go in the tab bar). A `HeaderMenu`
   * survives Android's header re-parenting; a plain `Menu` in a host does
   * not.
   */
  headerRight?: () => ReactNode;
}

export function TabStack({title, headerRight}: TabStackProps) {
  const {colors} = useNavTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS !== 'web',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.text,
        headerTitleStyle: {color: colors.text},
        headerStyle: {backgroundColor: colors.background},
      }}>
      <Stack.Screen name="index" options={{title, headerRight}}/>
    </Stack>
  );
}
