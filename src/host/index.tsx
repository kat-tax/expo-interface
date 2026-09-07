import type {PropsWithChildren} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {createContext, useContext} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {Host} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {hostAccentProps} from '../screen/host-accent';

/** True below a native host — see {@link useNativeHost}. */
export const NativeHostContext = createContext(false);

/**
 * Whether this point in the tree is already inside a native host: a
 * `NativeHost`, a `Screen native`, a `Sheet`'s content. Components that
 * present natively (`Alert`) mount a host of their own when there is none,
 * so they can be rendered anywhere; nesting hosts is not allowed.
 */
export function useNativeHost(): boolean {
  return useContext(NativeHostContext);
}

export interface NativeHostProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /**
   * Size the host to its content on both axes (a group of buttons in a row);
   * by default only vertically, the width filling its container.
   * @default false
   */
  fit?: boolean;
  /**
   * Called when the native content has been laid out, with its size. Use it
   * to give the host an explicit React Native size where a parent lays out
   * before the platform toolkit has measured (a stack header's toolbar).
   */
  onLayoutContent?: (event: {nativeEvent: {width: number; height: number}}) => void;
  /**
   * Touch handling of the host view; `none` for a host that only presents
   * something (a dialog, a popup) and should not take presses itself.
   */
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

/**
 * An accent-seeded `@expo/ui` `Host` for controls that sit inside a React
 * Native layout: a toolbar next to a canvas, a search row, a floating
 * button. `Screen native` mounts the same host around a whole screen; this
 * one is for the places a screen cannot be native, sized to its content and
 * seeded like the screen would be (`hostAccentProps`). On web it is a plain
 * view carrying the `@expo/ui` palette.
 */
export function NativeHost({children, style, fit = false, onLayoutContent, pointerEvents}: NativeHostProps) {
  const seed = useAccentSeed();
  return (
    <NativeHostContext.Provider value={true}>
      <Host
        matchContents={fit ? true : {vertical: true}}
        // The universal host hugs its content on web as soon as
        // `matchContents` is set at all, on either axis; the default here is
        // a block that fills its container, as it is natively.
        // Touch handling goes in the style, where React Native has taken it
        // since 0.71; as a prop it warns on every render on web. Last, so an
        // explicit `pointerEvents` beats one the caller's own style carries.
        style={[fit ? styles.fit : styles.fill, style, pointerEvents ? {pointerEvents} : null]}
        onLayoutContent={onLayoutContent}
        {...hostAccentProps(seed)}>
        {children}
      </Host>
    </NativeHostContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {alignSelf: 'stretch'},
  /**
   * Hugging the content is `align-self: flex-start` in the universal host,
   * which also decides where the host sits: a row that centres its children
   * left this one at the top, where iOS and Android centre it. Sizing to the
   * content says the same thing without taking the alignment — a definite
   * cross size is never stretched, so a parent with an alignment of its own
   * gets to use it, and one without still gets a box the size of its content.
   * `fit-content` is CSS react-native-web passes through; the platform
   * toolkits size the host themselves, so there is nothing to say natively.
   */
  fit: Platform.OS === 'web'
    ? {alignSelf: 'auto', width: 'fit-content' as 'auto', height: 'fit-content' as 'auto'}
    : {},
});
