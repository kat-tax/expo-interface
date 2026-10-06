import type {TabStackProps} from './index';
import {Stack} from 'expo-router';
import {toolbarItems, useHeaderTints} from '../header/toolbar';
import {StackHeaderContext} from '../stack-header/context';
import {useNavTheme} from '../theme';

/**
 * iOS and Android: the native stack's own bar over the tab's screens. The
 * trailing slot's controls become the index screen's bar items, declared
 * with the screen the way Expo Router takes a `Stack.Toolbar` inside a
 * `Stack.Screen` in a layout: read off the elements `headerRight` returns,
 * never rendered, so the stack holds no React Native view in the bar. A
 * `HeaderAction`, a `HeaderMenu` or a `HeaderActions` of them is read; any
 * other element is a custom view in the bar.
 */
export function TabStack({title, headerRight}: TabStackProps) {
  const {colors} = useNavTheme();
  const tints = useHeaderTints();

  return (
    <StackHeaderContext.Provider value={true}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: colors.text,
          headerTitleStyle: {color: colors.text},
          headerStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen name="index" options={{title}}>
          {headerRight ? <Stack.Toolbar placement="right">{toolbarItems(headerRight(), tints)}</Stack.Toolbar> : null}
        </Stack.Screen>
      </Stack>
    </StackHeaderContext.Provider>
  );
}

export type {TabStackProps} from './index';
