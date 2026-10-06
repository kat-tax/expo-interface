import type {SheetMaterial} from '../sheet/types';
import type {TabStackProps} from './index';
import {Stack} from 'expo-router';
import {Platform} from 'react-native';
import {toolbarItems, useHeaderTints} from '../header/toolbar';
import {FloatingHeaderContext, StackHeaderContext} from '../stack-header/context';
import {hasMaterial} from '../sheet/shared';
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
export function TabStack({title, headerRight, material = 'none'}: TabStackProps) {
  const {colors} = useNavTheme();
  const tints = useHeaderTints();
  // iOS alone: Android has no bar material, and its bar's items and menus
  // take the header's colour (Expo Router paints its icon buttons and the
  // dropdown's surface with it), so a thinned fill there made the menus
  // translucent, or the items' backgrounds opaque squares over the content.
  const floating = Platform.OS === 'ios' && hasMaterial(material);

  return (
    <StackHeaderContext.Provider value={true}>
      <FloatingHeaderContext.Provider value={floating}>
        <Stack
          screenOptions={{
            headerShown: true,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: colors.text,
            headerTitleStyle: {color: colors.text},
            ...(floating ? materialOptions(material) : {headerStyle: {backgroundColor: colors.background}}),
          }}>
          <Stack.Screen name="index" options={{title}}>
            {headerRight ? <Stack.Toolbar placement="right">{toolbarItems(headerRight(), tints)}</Stack.Toolbar> : null}
          </Stack.Screen>
        </Stack>
      </FloatingHeaderContext.Provider>
    </StackHeaderContext.Provider>
  );
}

/** iOS's system material for each of the kit's, behind the translucent bar. */
const IOS_BLUR = {
  thin: 'systemThinMaterial',
  regular: 'systemMaterial',
  thick: 'systemThickMaterial',
} as const;

/**
 * The iOS stack's options for a header the screens run under
 * (`headerTransparent`): a blur of the system's material, whose background
 * the stack leaves clear.
 */
function materialOptions(material: Exclude<SheetMaterial, 'none'>) {
  return {headerTransparent: true, headerBlurEffect: IOS_BLUR[material]};
}

export type {TabStackProps} from './index';
