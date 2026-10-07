import type {PropsWithChildren} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {NativeHostFit, NativeHostProps} from './index';
import {StyleSheet, View} from 'react-native';
import {NativeHostContext} from './context';

/**
 * Windows has no `@expo/ui` host: every kit control is either a React Native
 * view or a XAML island of its own, and both sit in a React Native layout
 * directly. The host is therefore a plain view that keeps the contract —
 * `useNativeHost()` answers true below it, `fit` hugs the content, a
 * `direction` lays the children out in a row or a column, and
 * `onLayoutContent` reports the laid-out size — so components written for
 * every platform need no Windows branch.
 */
export function NativeHost({children, style, fit = false, direction, spacing, onLayoutContent, pointerEvents}: NativeHostProps) {
  return (
    <NativeHostContext.Provider value={true}>
      <View
        style={[
          fit === true ? styles.fit : fit === 'width' ? styles.fitWidth : styles.fill,
          direction === 'row' ? styles.row : direction === 'column' ? styles.column : null,
          direction && spacing != null ? {gap: spacing} : null,
          style,
          pointerEvents ? {pointerEvents} : null,
        ]}
        onLayout={onLayoutContent ? event => {
          const {width, height} = event.nativeEvent.layout;
          onLayoutContent({nativeEvent: {width, height}});
        } : undefined}>
        {children}
      </View>
    </NativeHostContext.Provider>
  );
}

/**
 * Windows: the children as they are. Every control here is an island or a
 * React Native view of its own, which needs nothing to be placed in a layout,
 * so there is no host to mount; the contract is kept for the shared files.
 */
export function SelfHosted({children}: PropsWithChildren<{fit?: NativeHostFit; style?: StyleProp<ViewStyle>}>) {
  return <>{children}</>;
}

const styles = StyleSheet.create({
  fill: {alignSelf: 'stretch'},
  fit: {alignSelf: 'flex-start'},
  fitWidth: {alignSelf: 'stretch'},
  row: {flexDirection: 'row', alignItems: 'center'},
  column: {flexDirection: 'column'},
});

export {NativeHostContext, useNativeHost} from './context';
export type {NativeHostFit, NativeHostProps} from './index';
