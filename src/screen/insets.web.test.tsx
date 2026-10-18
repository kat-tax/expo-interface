import type {PropsWithChildren} from 'react';
import {renderHook as renderDomHook} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {TabBarContext} from '../tabs/context';
import {inset} from '../theme';
import {Screen} from '.';
import {useScrollInsets} from './insets';

describe('useScrollInsets (web)', () => {
  it('is the floating bar\'s inset under a Screen that runs under it, and nothing elsewhere', () => {
    // Web `SafeAreaView` requires a provider.
    const under = ({children}: PropsWithChildren) => (
      <SafeAreaProvider>
        <TabBarContext.Provider value={true}>
          <Screen underBar>{children}</Screen>
        </TabBarContext.Provider>
      </SafeAreaProvider>
    );
    expect(renderDomHook(() => useScrollInsets(), {wrapper: under}).result.current).toEqual({top: inset.topBar, bottom: 0, left: 0, right: 0, automatic: false});
    const beside = ({children}: PropsWithChildren) => (
      <SafeAreaProvider>
        <TabBarContext.Provider value={true}>
          <Screen>{children}</Screen>
        </TabBarContext.Provider>
      </SafeAreaProvider>
    );
    expect(renderDomHook(() => useScrollInsets(), {wrapper: beside}).result.current).toEqual({top: 0, bottom: 0, left: 0, right: 0, automatic: false});
    // The caller's own on every side: a screen keeps nothing at the sides.
    expect(renderDomHook(() => useScrollInsets({top: 8, bottom: 4, left: 2, right: 6})).result.current).toEqual({top: 8, bottom: 4, left: 2, right: 6, automatic: false});
  });
});
