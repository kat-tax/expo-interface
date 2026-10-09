import type {ReactNode} from 'react';
import {AccessibilityInfo, Animated, Platform} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {host, modifier, nodes} from 'expo-vitest/native';
import {NativeHostContext} from '../host';
import {PULSE_HALF, PULSE_LOW} from './pulse';
import {Badge} from '.';

const isAndroid = Platform.OS === 'android';

/** Inside a native host, where the badge is Compose's or SwiftUI's. */
const inHost = (node: ReactNode) => <NativeHostContext.Provider value={true}>{node}</NativeHostContext.Provider>;

/** Stands in for the opacity loop, to see it start and stop. */
function watchLoop() {
  const start = vi.fn();
  const stop = vi.fn();
  vi.spyOn(Animated, 'loop').mockReturnValue({start, stop, reset: vi.fn()} as never);
  return {start, stop};
}

/** The alpha Compose is told to animate toward, from the badge's graphics layer. */
const alpha = () => modifier(screen.container.queryAll(i => !!modifier(i.props, 'graphicsLayer'))[0]!.props, 'graphicsLayer')!.alpha;

/** The SwiftUI view whose opacity pulses. */
const fading = () => host(p => !!modifier(p, 'opacity'));

/** The end of the pulse the hosted badge is heading for: Compose's alpha target, or SwiftUI's opacity. */
const level = () => isAndroid ? alpha().targetValue : modifier(fading().props, 'opacity')!.value;

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

  describe('inside a host', () => {
    it('has the toolkit animate the opacity toward each end of the pulse in turn', async () => {
      vi.useFakeTimers();
      await render(inHost(<Badge dot pulse testID="typing"/>));
      expect(level()).toBe(1);
      if (isAndroid) {
        expect(alpha()).toMatchObject({$animated: true, targetValue: 1});
      } else {
        // SwiftUI tweens the opacity change the `animation` modifier after it sees.
        expect(modifier(fading().props, 'animation')).toMatchObject({animation: {type: 'easeInOut', duration: PULSE_HALF / 1000}, animatedValue: 1});
      }
      await act(async () => {
        await vi.advanceTimersByTimeAsync(PULSE_HALF);
      });
      expect(level()).toBe(PULSE_LOW);
      if (isAndroid) {
        expect(alpha()).toMatchObject({targetValue: PULSE_LOW, animationSpec: {durationMillis: PULSE_HALF}});
      } else {
        expect(modifier(fading().props, 'animation')?.animatedValue).toBe(PULSE_LOW);
      }
    });

    it('holds the opacity up while the user asks for less motion', async () => {
      vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      vi.useFakeTimers();
      await render(inHost(<Badge dot pulse testID="typing"/>));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(PULSE_HALF);
      });
      expect(level()).toBe(1);
    });

    it('animates nothing on a badge that does not pulse', async () => {
      await render(inHost(<Badge count={3} testID="still"/>));
      expect(nodes().some(n => modifier(n.props, 'graphicsLayer') !== undefined || modifier(n.props, 'opacity') !== undefined)).toBe(false);
    });
  });
});
