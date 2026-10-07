import {AccessibilityInfo, Animated, Platform} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {modifier} from 'expo-vitest/native';
import {Badge} from '.';

const isIOS = Platform.OS === 'ios';

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

  if (isIOS) {
    it('loops its opacity down and back up while it pulses, and stops when told', async () => {
      const loop = watchLoop();
      const {rerender} = await render(<Badge dot pulse testID="typing"/>);
      expect(loop.start).toHaveBeenCalledTimes(1);
      await rerender(<Badge dot testID="typing"/>);
      expect(loop.stop).toHaveBeenCalledTimes(1);
    });

    it('stops the loop once it reads that the user asks for less motion', async () => {
      vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      const loop = watchLoop();
      await render(<Badge dot pulse testID="typing"/>);
      await act(async () => {});
      expect(loop.start).toHaveBeenCalledTimes(1);
      expect(loop.stop).toHaveBeenCalledTimes(1);
    });
    return;
  }

  it('has Compose animate the alpha toward each end of the pulse in turn', async () => {
    vi.useFakeTimers();
    await render(<Badge dot pulse testID="typing"/>);
    expect(alpha()).toMatchObject({$animated: true, targetValue: 1});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(alpha()).toMatchObject({targetValue: 0.35, animationSpec: {durationMillis: 450}});
  });

  it('holds the alpha up while the user asks for less motion', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    vi.useFakeTimers();
    await render(<Badge dot pulse testID="typing"/>);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(alpha()).toMatchObject({targetValue: 1});
  });
});
