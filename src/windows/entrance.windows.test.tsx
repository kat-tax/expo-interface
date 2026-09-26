import {renderHook} from '@testing-library/react-native';
import {Animated} from 'react-native';
import {dialogEntrance, useEntrance} from './entrance';

function spyTiming() {
  const start = vi.fn();
  const timing = vi.spyOn(Animated, 'timing').mockReturnValue({start} as never);
  return {timing, start};
}

describe('useEntrance (windows)', () => {
  it('plays a dialog on its mount, settling from a little larger, on the native driver', async () => {
    const {timing, start} = spyTiming();
    const {result} = await renderHook(() => useEntrance());
    expect(timing).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenCalledWith(result.current.opacity, expect.objectContaining({toValue: 1, duration: 250, useNativeDriver: true}));
    expect(start).toHaveBeenCalledTimes(1);
    expect(result.current.transform).toEqual([{scale: expect.anything()}]);
  });

  it('fades alone, or arrives at once, as asked', async () => {
    const {timing} = spyTiming();
    const faded = await renderHook(() => useEntrance('fade'));
    expect(timing).toHaveBeenCalledTimes(1);
    expect(faded.result.current.transform).toBeUndefined();
    const still = await renderHook(() => useEntrance('none'));
    expect(timing).toHaveBeenCalledTimes(1);
    expect(still.result.current.opacity).toBeDefined();
  });

  it('reads the stack animations as a dialog does: a flip is a fade, a slide is the dialog\'s own', () => {
    expect(dialogEntrance('flip')).toBe('fade');
    expect(dialogEntrance('fade')).toBe('fade');
    expect(dialogEntrance('none')).toBe('none');
    expect(dialogEntrance('slide_from_bottom')).toBe('default');
    expect(dialogEntrance()).toBe('default');
  });
});
