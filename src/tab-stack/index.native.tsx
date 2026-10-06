import type {ColorValue} from 'react-native';
import type {SheetMaterial} from '../sheet/types';
import type {TabStackProps} from './index';
import {Stack} from 'expo-router';
import {Platform} from 'react-native';
import {toolbarItems, useHeaderTints} from '../header/toolbar';
import {FloatingHeaderContext, StackHeaderContext} from '../stack-header/context';
import {MATERIAL_OPACITY, hasMaterial} from '../sheet/shared';
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
  const floating = hasMaterial(material);

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
            ...(floating ? materialOptions(material, colors.background) : {headerStyle: {backgroundColor: colors.background}}),
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
 * The native stack's options for a header the screens run under
 * (`headerTransparent`): on iOS a blur of the system's material, whose
 * background the stack leaves clear; on Android, which has no bar material,
 * the bar's own fill thinned to the material's opacity over the content.
 */
function materialOptions(material: Exclude<SheetMaterial, 'none'>, background: ColorValue) {
  if (Platform.OS === 'ios') {
    return {headerTransparent: true, headerBlurEffect: IOS_BLUR[material]};
  }
  return {headerTransparent: true, headerStyle: {backgroundColor: withAlpha(background, MATERIAL_OPACITY[material])}};
}

/**
 * A palette color at an opacity, as `rgba()`. The navigation theme's colors
 * are the palette's own `#rrggbb` strings (`useNavTheme` resolves them, since
 * a native header takes no platform color token); any other value is left
 * as it is.
 */
export function withAlpha(color: ColorValue, alpha: number): ColorValue {
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return color;
  const [r, g, b] = [1, 3, 5].map(at => parseInt(color.slice(at, at + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type {TabStackProps} from './index';
