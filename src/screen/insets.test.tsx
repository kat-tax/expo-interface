import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {renderHook as renderDomHook} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {setInsets} from 'vitest-native/helpers';
import {FloatingHeaderContext} from '../stack-header/context';
import {TabBarContext} from '../tabs/context';
import {inset} from '../theme';
import {Screen} from '.';
import {useScrollInsets} from './insets';

describe(`useScrollInsets (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('is the floating bar\'s inset under a Screen that runs under it, and nothing elsewhere', () => {
      // Web `SafeAreaView` requires a provider.
      const under = ({children}: PropsWithChildren) => (
        <SafeAreaProvider>
          <TabBarContext.Provider value={true}>
            <Screen underBar>{children}</Screen>
          </TabBarContext.Provider>
        </SafeAreaProvider>
      );
      expect(renderDomHook(() => useScrollInsets(), {wrapper: under}).result.current).toEqual({top: inset.topBar, bottom: 0, automatic: false});
      const beside = ({children}: PropsWithChildren) => (
        <SafeAreaProvider>
          <TabBarContext.Provider value={true}>
            <Screen>{children}</Screen>
          </TabBarContext.Provider>
        </SafeAreaProvider>
      );
      expect(renderDomHook(() => useScrollInsets(), {wrapper: beside}).result.current).toEqual({top: 0, bottom: 0, automatic: false});
      expect(renderDomHook(() => useScrollInsets({top: 8, bottom: 4})).result.current).toEqual({top: 8, bottom: 4, automatic: false});
    });
    return;
  }

  it('is the header\'s inset under a Screen that runs under a floating header, plus the caller\'s own, and on iOS the platform\'s own', async () => {
    await act(async () => setInsets({top: 47, left: 0, right: 0, bottom: 0}));
    try {
      const under = ({children}: PropsWithChildren) => (
        <FloatingHeaderContext.Provider value={true}>
          <Screen underBar>{children}</Screen>
        </FloatingHeaderContext.Provider>
      );
      const {result} = await renderHook(() => useScrollInsets({top: 8, bottom: 20}), {wrapper: under});
      // iOS insets scroll content by the header itself, following a native search bar; the kit adds only the caller's own.
      expect(result.current).toEqual(Platform.OS === 'ios'
        ? {top: 8, bottom: 20, automatic: true}
        : {top: 47 + inset.header + 8, bottom: 20, automatic: false});
      const beside = ({children}: PropsWithChildren) => <Screen>{children}</Screen>;
      expect((await renderHook(() => useScrollInsets(), {wrapper: beside})).result.current).toEqual({top: 0, bottom: 0, automatic: false});
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });
});
