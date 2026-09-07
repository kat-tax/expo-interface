import type {ReactNode} from 'react';
import {Stack} from 'expo-router';
import {Platform} from 'react-native';
import {ConstrainedStackHeader} from '../stack-header';
import {StackHeaderContext} from '../stack-header/context';
import {useHeaderSlot} from '../tabs/context';
import {useNavTheme} from '../theme';

export interface TabStackProps {
  /** Title of the tab's root screen, in its native header. */
  title: string;
  /**
   * Content of the header's trailing slot. A `HeaderMenu` survives Android's
   * header re-parenting; a plain `Menu` in a host does not.
   */
  headerRight?: () => ReactNode;
}

/**
 * The stack inside a tab: the platform's header over the tab's screens. On
 * iOS and Android that is the native stack's own bar; on web it is
 * `ConstrainedStackHeader`, a row of the same content width as the screen,
 * so a screen reads the same everywhere — one header, one `headerRight`,
 * one back button — and `Screen` can tell there is a header above it
 * without being told.
 *
 * Under a web `Tabs` bar that takes headers, that row is the bar itself: the
 * header folds into it, and the screen pays the bar's inset as it would with
 * no header at all.
 */
export function TabStack({title, headerRight}: TabStackProps) {
  const {colors} = useNavTheme();
  // Web only: a slot means the header is drawn by the bar above, not here.
  const folds = useHeaderSlot() !== null;

  return (
    <StackHeaderContext.Provider value={!folds}>
      <Stack
        screenOptions={{
          headerShown: true,
          header: Platform.OS === 'web' ? ConstrainedStackHeader : undefined,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: colors.text,
          headerTitleStyle: {color: colors.text},
          headerStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen name="index" options={{title, headerRight}}/>
      </Stack>
    </StackHeaderContext.Provider>
  );
}
