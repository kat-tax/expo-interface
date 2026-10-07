import type {PropsWithChildren, ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {Platform, StyleSheet} from 'react-native';
import {Column, Host, Row} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {hostAccentProps} from '../screen/host-accent';
import {NativeHostContext, useNativeHost} from './context';

// The context lives in its own module so Windows (`index.windows.tsx`, which
// has no `@expo/ui` to host) shares it without importing the host.
export {NativeHostContext, useNativeHost} from './context';

/**
 * Which axes a host sizes to its content. `true` is both; `'width'` hugs
 * the width and fills the height, for a vertical rule in a row; `false` is
 * the default, the height of the content and the width of the container.
 */
export type NativeHostFit = boolean | 'width' | 'fill';

export interface NativeHostProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /**
   * Size the host to its content on both axes (a group of buttons in a row),
   * or on the width alone (`'width'`, a vertical rule); by default only
   * vertically, the width filling its container. `'fill'` takes the size the
   * layout gives on both axes, for content that scrolls inside the host (a
   * `List`), which has no height of its own to match.
   * @default false
   */
  fit?: NativeHostFit;
  /**
   * Lay the children out as one native row or column, so a group of controls
   * is a single native view rather than a stack of them. Without it the
   * children are placed as they are.
   */
  direction?: 'row' | 'column';
  /** The space between the children of a `direction`, in points. */
  spacing?: number;
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

/** What `matchContents` the host asks for, per `fit`. */
export function matchContentsFor(fit: NativeHostFit): boolean | {vertical?: boolean; horizontal?: boolean} {
  if (fit === true) return true;
  if (fit === 'width') return {horizontal: true};
  if (fit === 'fill') return false;
  return {vertical: true};
}

/**
 * An accent-seeded `@expo/ui` `Host` for controls that sit inside a React
 * Native layout: a toolbar next to a canvas, a search row, a floating
 * button. `Screen native` mounts the same host around a whole screen; this
 * one is for the places a screen cannot be native, sized to its content and
 * seeded like the screen would be (`hostAccentProps`). On web it is a plain
 * view carrying the `@expo/ui` palette.
 */
export function NativeHost({children, style, fit = false, direction, spacing, onLayoutContent, pointerEvents}: NativeHostProps) {
  const seed = useAccentSeed();
  return (
    <NativeHostContext.Provider value={true}>
      <Host
        matchContents={matchContentsFor(fit)}
        // The universal host hugs its content on web as soon as
        // `matchContents` is set at all, on either axis; the default here is
        // a block that fills its container, as it is natively.
        // Touch handling goes in the style, where React Native has taken it
        // since 0.71; as a prop it warns on every render on web. Last, so an
        // explicit `pointerEvents` beats one the caller's own style carries.
        style={[fit === true ? styles.fit : fit === 'width' ? styles.fitWidth : fit === 'fill' ? styles.fillBoth : styles.fill, style, pointerEvents ? {pointerEvents} : null]}
        onLayoutContent={onLayoutContent}
        {...hostAccentProps(seed)}>
        {arranged(direction, spacing, children)}
      </Host>
    </NativeHostContext.Provider>
  );
}

/** The children in one native row or column when a direction was asked for, as they are otherwise. */
export function arranged(direction: 'row' | 'column' | undefined, spacing: number | undefined, children: ReactNode): ReactNode {
  if (direction === 'row') return <Row alignment="center" spacing={spacing}>{children}</Row>;
  if (direction === 'column') return <Column spacing={spacing}>{children}</Column>;
  return children;
}

/**
 * The children in a host of their own where there is none above, and as they
 * are inside one. What every control that draws natively does on iOS and
 * Android, so it can be placed in a React Native layout like any element:
 * a button in a row of the app's own, a switch beside drawn text, a divider
 * between two views. `fit` is the host's; a control that fills its width
 * leaves it off.
 */
export function SelfHosted({fit = true, style, children}: PropsWithChildren<{fit?: NativeHostFit; style?: StyleProp<ViewStyle>}>) {
  const hosted = useNativeHost();
  if (hosted) return <>{children}</>;
  return <NativeHost fit={fit} style={style}>{children}</NativeHost>;
}

const styles = StyleSheet.create({
  fill: {alignSelf: 'stretch'},
  /** The size the layout gives, on both axes: nothing matches the content. */
  fillBoth: {flex: 1, alignSelf: 'stretch'},
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
  /** The width of the content; the height is the row's, as a vertical rule's is. */
  fitWidth: Platform.OS === 'web'
    ? {alignSelf: 'stretch', width: 'fit-content' as 'auto'}
    : {alignSelf: 'stretch'},
});
