import {AccessibilityInfo, Animated, Platform} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {modifier} from 'expo-vitest/native';
import {NativeHostContext} from '../host';
import {PULSE_HALF, PULSE_LOW} from './pulse';
import {Badge} from '.';

/** Stands in for the opacity loop, to see it start and stop. */
function watchLoop() {
  const start = vi.fn();
  const stop = vi.fn();
  vi.spyOn(Animated, 'loop').mockReturnValue({start, stop, reset: vi.fn()} as never);
  return {start, stop};
}

/** The alpha Compose is told to animate toward, from the badge's graphics layer. */
const alpha = () => modifier(screen.container.queryAll(i => !!modifier(i.props, 'graphicsLayer'))[0]!.props, 'graphicsLayer')!.alpha;

describe(`Badge pulse (${Platform.OS})`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('loops its opacity down and back up on the native driver while it pulses, and stops when told', async () => {
    const loop = watchLoop();
    const timing = vi.spyOn(Animated, 'timing');
    const {rerender} = await render(<Badge dot pulse testID="typing"/>);
    expect(loop.start).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({toValue: PULSE_LOW, duration: PULSE_HALF, useNativeDriver: true}));
    await rerender(<Badge dot testID="typing"/>);
    expect(loop.stop).toHaveBeenCalledTimes(1);
  });

  it('schedules nothing in JavaScript to pace the drawn pulse', async () => {
    vi.useFakeTimers();
    watchLoop();
    await render(<Badge dot pulse testID="typing"/>);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops the loop once it reads that the user asks for less motion', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const loop = watchLoop();
    await render(<Badge dot pulse testID="typing"/>);
    await act(async () => {});
    expect(loop.start).toHaveBeenCalledTimes(1);
    expect(loop.stop).toHaveBeenCalledTimes(1);
  });

  if (Platform.OS !== 'android') return;

  describe('inside a host', () => {
    it('has Compose animate the alpha toward each end of the pulse in turn', async () => {
      vi.useFakeTimers();
      await render(<NativeHostContext.Provider value={true}><Badge dot pulse testID="typing"/></NativeHostContext.Provider>);
      expect(alpha()).toMatchObject({$animated: true, targetValue: 1});
      await act(async () => {
        await vi.advanceTimersByTimeAsync(PULSE_HALF);
      });
      expect(alpha()).toMatchObject({targetValue: PULSE_LOW, animationSpec: {durationMillis: PULSE_HALF}});
    });

    it('holds the alpha up while the user asks for less motion', async () => {
      vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      vi.useFakeTimers();
      await render(<NativeHostContext.Provider value={true}><Badge dot pulse testID="typing"/></NativeHostContext.Provider>);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(PULSE_HALF);
      });
      expect(alpha()).toMatchObject({targetValue: 1});
    });
  });
});
