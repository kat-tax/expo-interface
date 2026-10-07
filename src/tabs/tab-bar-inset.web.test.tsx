import {renderHook} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {inset} from '../theme';
import {BarRowsContext, TabBarContext, useTabBarInset} from './context';

describe('useTabBarInset (web)', () => {
  it('is nothing without a bar, the bar\'s inset under one, and the search row\'s height on top of it', () => {
    const under = (bar: boolean, search: number) =>
      renderHook(() => useTabBarInset(), {
        wrapper: ({children}) => (
          <SafeAreaProvider>
            <TabBarContext.Provider value={bar}>
              <BarRowsContext.Provider value={search}>{children}</BarRowsContext.Provider>
            </TabBarContext.Provider>
          </SafeAreaProvider>
        ),
      }).result.current;
    expect(under(false, 0)).toBe(0);
    expect(under(true, 0)).toBe(inset.topBar);
    expect(under(true, 56)).toBe(inset.topBar + 56);
    // A search row only ever comes with a bar: without one, nothing is paid.
    expect(under(false, 56)).toBe(0);
  });
});
