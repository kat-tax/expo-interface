import {AccessibilityInfo, Platform} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {useReducedMotion} from './motion';

describe(`useReducedMotion (${Platform.OS})`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the setting, and follows it as it changes', async () => {
    let changed = (_reduced: boolean) => {};
    const remove = vi.fn();
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    vi.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((_name: string, listener: (reduced: boolean) => void) => {
      changed = listener;
      return {remove};
    }) as never);
    const {result, unmount} = await renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    await act(async () => changed(false));
    expect(result.current).toBe(false);
    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('keeps motion when the setting cannot be read, or arrives after the screen went', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(new Error('unavailable'));
    const {result} = await renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    let settle = (_reduced: boolean) => {};
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(resolve => {
      settle = resolve;
    }));
    const late = await renderHook(() => useReducedMotion());
    await late.unmount();
    await act(async () => settle(true));
    expect(late.result.current).toBe(false);
  });
});
