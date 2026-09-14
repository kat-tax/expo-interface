import type {NativeHostProps} from './index';
import {StyleSheet, View} from 'react-native';
import {NativeHostContext} from './context';

/**
 * Windows has no `@expo/ui` host: every kit control is either a React Native
 * view or a XAML island of its own, and both sit in a React Native layout
 * directly. The host is therefore a plain view that keeps the contract —
 * `useNativeHost()` answers true below it, `fit` hugs the content, and
 * `onLayoutContent` reports the laid-out size — so components written for
 * every platform need no Windows branch.
 */
export function NativeHost({children, style, fit = false, onLayoutContent, pointerEvents}: NativeHostProps) {
  return (
    <NativeHostContext.Provider value={true}>
      <View
        style={[fit ? styles.fit : styles.fill, style, pointerEvents ? {pointerEvents} : null]}
        onLayout={onLayoutContent ? event => {
          const {width, height} = event.nativeEvent.layout;
          onLayoutContent({nativeEvent: {width, height}});
        } : undefined}>
        {children}
      </View>
    </NativeHostContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {alignSelf: 'stretch'},
  fit: {alignSelf: 'flex-start'},
});

export {NativeHostContext, useNativeHost} from './context';
export type {NativeHostProps} from './index';
