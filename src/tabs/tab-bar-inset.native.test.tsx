import {Platform} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {setInsets} from 'vitest-native/helpers';
import {FloatingHeaderContext} from '../stack-header/context';
import {inset} from '../theme';
import {useTabBarInset} from './context';

describe(`useTabBarInset (${Platform.OS})`, () => {
  it('is nothing under an opaque header, with the tab bar at the bottom', async () => {
    const {result} = await renderHook(() => useTabBarInset());
    expect(result.current).toBe(0);
  });

  it('is the status bar and the header under a header the screens run under', async () => {
    await act(async () => setInsets({top: 47, left: 0, right: 0, bottom: 0}));
    try {
      const {result} = await renderHook(() => useTabBarInset(), {
        wrapper: ({children}) => <FloatingHeaderContext.Provider value={true}>{children}</FloatingHeaderContext.Provider>,
      });
      // The navigation bar's height on iOS, the top app bar's on Android.
      expect(inset.header).toBe(Platform.OS === 'ios' ? 44 : 56);
      expect(result.current).toBe(47 + inset.header);
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });
});
