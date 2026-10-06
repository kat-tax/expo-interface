import type {ReactNode} from 'react';
import type {SheetMaterial} from '../sheet/types';
import {Stack} from 'expo-router';
import {ConstrainedStackHeader} from '../stack-header';
import {StackHeaderContext} from '../stack-header/context';
import {useHeaderSlot} from '../tabs/context';
import {useNavTheme} from '../theme';

export interface TabStackProps {
  /** Title of the tab's root screen, in its native header. */
  title: string;
  /**
   * Content of the header's trailing slot: a `HeaderMenu`, a `HeaderAction`,
   * or several in a `HeaderActions`. On iOS and Android they become the
   * platform's bar items, read off the elements returned (a component of the
   * app's own around them is a custom view in the bar instead); on web and
   * Windows the drawn header row takes them in its trailing slot.
   */
  headerRight?: () => ReactNode;
  /**
   * iOS: the header as one of the kit's materials, the ones `Sheet` takes,
   * the system's material behind a translucent bar with the screens running
   * under it. The screens pay the header's height at the top (`Screen` does,
   * unless it is `underBar`, where the content's own top inset is
   * `useTabBarInset()`). Android has no bar material, and its bar's items and
   * menus take the header's colour, so its header stays the bar's opaque
   * fill with the screens below it. On web the bar a header folds into has
   * `Tabs webMaterial`, and a drawn header stays opaque, as Windows' does.
   * @default 'none'
   */
  material?: SheetMaterial;
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
  // A slot means the header is drawn by the bar above, not here.
  const folds = useHeaderSlot() !== null;

  return (
    <StackHeaderContext.Provider value={!folds}>
      <Stack
        screenOptions={{
          headerShown: true,
          header: ConstrainedStackHeader,
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
