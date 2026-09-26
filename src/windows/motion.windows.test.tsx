import type {Drawn} from './motion';
import {act, renderHook} from '@testing-library/react-native';
import {Animated, Text} from 'react-native';
import {DURATION, motionStyle, resolveTransition, timingOf, useArrival, useScreenMotion, usesNativeDriver} from './motion';

const ROOM = {width: 800, height: 600};

/** `Animated.timing` that completes at once, or never, so a departure can be seen out or seen. */
function spyTiming(completes: boolean) {
  const start = vi.fn((callback?: (result: {finished: boolean}) => void) => {
    if (completes) callback?.({finished: true});
  });
  const timing = vi.spyOn(Animated, 'timing').mockReturnValue({start} as never);
  return {timing, start};
}

/** The output range an interpolated value was built with. */
function rangeOf(value: unknown): number[] {
  return (value as {_config: {outputRange: number[]}})._config.outputRange;
}

describe('the stack animations on Windows', () => {
  it('maps the native stack\'s words onto WinUI\'s motions', () => {
    expect(resolveTransition()).toBe('drill');
    expect(resolveTransition('default')).toBe('drill');
    expect(resolveTransition('fade')).toBe('fade');
    expect(resolveTransition('flip')).toBe('fade');
    expect(resolveTransition('fade_from_bottom')).toBe('refresh');
    expect(resolveTransition('slide_from_bottom')).toBe('slide_bottom');
    expect(resolveTransition('slide_from_right')).toBe('slide_right');
    expect(resolveTransition('ios_from_right')).toBe('slide_right');
    expect(resolveTransition('simple_push')).toBe('slide_right');
    expect(resolveTransition('slide_from_left')).toBe('slide_left');
    expect(resolveTransition('ios_from_left')).toBe('slide_left');
    expect(resolveTransition('none')).toBe('none');
  });

  it('runs what fades and scales on the compositor, and what translates on the JavaScript thread', () => {
    expect(usesNativeDriver('drill')).toBe(true);
    expect(usesNativeDriver('fade')).toBe(true);
    expect(usesNativeDriver('none')).toBe(true);
    expect(usesNativeDriver('refresh')).toBe(false);
    expect(usesNativeDriver('slide_right')).toBe(false);
    expect(usesNativeDriver('slide_left')).toBe(false);
    expect(usesNativeDriver('slide_bottom')).toBe(false);
  });

  it('times an arrival at WinUI\'s normal duration, a departure at its fast one, and a slide as one sheet', () => {
    expect(timingOf('drill', 'arriving').duration).toBe(DURATION.arriving);
    expect(timingOf('drill', 'leaving').duration).toBe(DURATION.leaving);
    expect(timingOf('slide_right', 'leaving').duration).toBe(DURATION.slide);
    expect(timingOf('slide_bottom', 'arriving').duration).toBe(DURATION.slide);
    expect(timingOf('fade', 'arriving').easing(0.5)).toBeGreaterThan(0.5);
    expect(timingOf('fade', 'leaving').easing(0.5)).toBeLessThan(0.5);
  });

  it('shapes each role of each motion, forward and back', () => {
    const progress = new Animated.Value(0);
    expect(motionStyle('none', 'arriving', 'forward', progress, ROOM)).toEqual({});
    expect(motionStyle('fade', 'arriving', 'forward', progress, ROOM)).toEqual({opacity: progress});
    expect(rangeOf(motionStyle('fade', 'leaving', 'forward', progress, ROOM).opacity)).toEqual([1, 0]);
    const refresh = motionStyle('refresh', 'arriving', 'backward', progress, ROOM);
    expect(rangeOf((refresh.transform as {translateY: unknown}[])[0].translateY)).toEqual([24, 0]);
    expect(motionStyle('refresh', 'leaving', 'forward', progress, ROOM).transform).toBeUndefined();
    const scaleOf = (transition: 'drill', role: 'arriving' | 'leaving', direction: 'forward' | 'backward') =>
      rangeOf((motionStyle(transition, role, direction, progress, ROOM).transform as {scale: unknown}[])[0].scale);
    expect(scaleOf('drill', 'arriving', 'forward')).toEqual([0.95, 1]);
    expect(scaleOf('drill', 'leaving', 'forward')).toEqual([1, 1.05]);
    expect(scaleOf('drill', 'arriving', 'backward')).toEqual([1.05, 1]);
    expect(scaleOf('drill', 'leaving', 'backward')).toEqual([1, 0.95]);
    const xOf = (transition: 'slide_right' | 'slide_left', role: 'arriving' | 'leaving', direction: 'forward' | 'backward') =>
      rangeOf((motionStyle(transition, role, direction, progress, ROOM).transform as {translateX: unknown}[])[0].translateX);
    expect(xOf('slide_right', 'arriving', 'forward')).toEqual([800, 0]);
    expect(xOf('slide_right', 'leaving', 'forward')).toEqual([0, -800]);
    expect(xOf('slide_right', 'arriving', 'backward')).toEqual([-800, 0]);
    expect(xOf('slide_right', 'leaving', 'backward')).toEqual([0, 800]);
    expect(xOf('slide_left', 'arriving', 'forward')).toEqual([-800, 0]);
    expect(xOf('slide_left', 'leaving', 'backward')).toEqual([0, -800]);
    const yOf = (role: 'arriving' | 'leaving', direction: 'forward' | 'backward') =>
      (motionStyle('slide_bottom', role, direction, progress, ROOM).transform as {translateY: unknown}[] | undefined)?.[0].translateY;
    expect(rangeOf(yOf('arriving', 'forward'))).toEqual([600, 0]);
    expect(yOf('leaving', 'forward')).toBeUndefined();
    expect(yOf('arriving', 'backward')).toBeUndefined();
    expect(rangeOf(yOf('leaving', 'backward'))).toEqual([0, 600]);
  });
});

describe('useScreenMotion (windows)', () => {
  const drawn = (key: string, index: number, animation?: Drawn['animation']): Drawn => ({key, index, animation, element: <Text>{key}</Text>});

  it('leaves the first screen where it is, then sees a pushed screen in and the one before out, and the reverse on a pop', async () => {
    const {timing, start} = spyTiming(false);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current, ROOM), {
      initialProps: {current: drawn('index', 0)},
    });
    expect(timing).not.toHaveBeenCalled();
    expect(result.current.arriving).toEqual({});
    expect(result.current.leaving).toBeNull();
    await rerender({current: drawn('detail', 1)});
    // The arrival and the departure, each on the native driver at its own duration.
    expect(timing).toHaveBeenCalledTimes(2);
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({duration: DURATION.arriving, useNativeDriver: true}));
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({duration: DURATION.leaving, useNativeDriver: true}));
    expect(start).toHaveBeenCalledTimes(2);
    expect(result.current.leaving).toMatchObject({key: 'index', transition: 'drill', onTop: false});
    expect(rangeOf((result.current.arriving.transform as {scale: unknown}[])[0].scale)).toEqual([0.95, 1]);
    // Back: the detail leaves on top, shrinking away; the index settles from a little large.
    await rerender({current: drawn('index', 0)});
    expect(result.current.leaving).toMatchObject({key: 'detail', onTop: true});
    expect(rangeOf((result.current.leaving!.style.transform as {scale: unknown}[])[0].scale)).toEqual([1, 0.95]);
    expect(rangeOf((result.current.arriving.transform as {scale: unknown}[])[0].scale)).toEqual([1.05, 1]);
  });

  it('takes the motion from the screen arriving forward and from the one leaving back, and clears the departure when its motion ends', async () => {
    const {timing, start} = spyTiming(true);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current, ROOM), {
      initialProps: {current: drawn('index', 0, 'fade')},
    });
    await rerender({current: drawn('detail', 1, 'slide_from_right')});
    // A slide, on the JavaScript thread; seen out at once: the departure is over.
    expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({useNativeDriver: false}));
    expect(start).toHaveBeenCalled();
    expect(result.current.leaving).toBeNull();
    expect((result.current.arriving.transform as {translateX: unknown}[])[0].translateX).toBeDefined();
    await rerender({current: drawn('index', 0, 'fade')});
    // Back: the detail's own slide, reversed, not the index's fade.
    expect(result.current.arriving.opacity).toBeUndefined();
    expect((result.current.arriving.transform as {translateX: unknown}[])[0].translateX).toBeDefined();
  });

  it('plays nothing for a screen that asks for none, and lets nothing leave then', async () => {
    const {timing} = spyTiming(false);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current, ROOM), {
      initialProps: {current: drawn('index', 0)},
    });
    await rerender({current: drawn('still', 1, 'none')});
    expect(timing).not.toHaveBeenCalled();
    expect(result.current.leaving).toBeNull();
  });

  it('plays a first screen on request, and sees the last one out when there is nothing to draw', async () => {
    const {timing} = spyTiming(false);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current, ROOM, true), {
      initialProps: {current: drawn('card', 1)},
    });
    expect(timing).toHaveBeenCalledTimes(1);
    expect(rangeOf((result.current.arriving.transform as {scale: unknown}[])[0].scale)).toEqual([0.95, 1]);
    await rerender({current: null});
    expect(result.current.leaving).toMatchObject({key: 'card', onTop: true, transition: 'drill'});
    expect(result.current.arriving).toEqual({});
  });
});

describe('useArrival (windows)', () => {
  it('leaves the first content where it is and plays what a change asks for, along the direction given then', async () => {
    const {timing} = spyTiming(false);
    const {result, rerender} = await renderHook(
      (props: {key: string; transition: 'slide_right' | 'refresh' | 'none'; direction: 'forward' | 'backward'}) => useArrival(props.key, props.transition, props.direction, ROOM),
      {initialProps: {key: 'a', transition: 'slide_right', direction: 'forward'}},
    );
    expect(timing).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
    await rerender({key: 'b', transition: 'slide_right', direction: 'backward'});
    expect(timing).toHaveBeenCalledTimes(1);
    expect(rangeOf((result.current.transform as {translateX: unknown}[])[0].translateX)).toEqual([-800, 0]);
    // A render in the middle of the motion changes no curve.
    await rerender({key: 'b', transition: 'refresh', direction: 'forward'});
    expect(rangeOf((result.current.transform as {translateX: unknown}[])[0].translateX)).toEqual([-800, 0]);
    await rerender({key: 'c', transition: 'none', direction: 'forward'});
    expect(timing).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({});
  });
});

describe('useScreenMotion departures (windows)', () => {
  it("keeps a departure that did not finish, and a newer one when an older one finishes late", async () => {
    const callbacks: ((result: {finished: boolean}) => void)[] = [];
    vi.spyOn(Animated, 'timing').mockImplementation(() => ({start: (callback?: (result: {finished: boolean}) => void) => {
      if (callback) callbacks.push(callback);
    }}) as never);
    const element = <Text>screen</Text>;
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current, ROOM), {
      initialProps: {current: {key: 'a', index: 0, element}},
    });
    await rerender({current: {key: 'b', index: 1, element}});
    expect(result.current.leaving?.key).toBe('a');
    const first = callbacks.shift()!;
    await rerender({current: {key: 'c', index: 2, element}});
    expect(result.current.leaving?.key).toBe('b');
    const second = callbacks.shift()!;
    // The older departure finishing does not take the newer one away, nor does the newer one stopping short.
    await act(async () => first({finished: true}));
    expect(result.current.leaving?.key).toBe('b');
    await act(async () => second({finished: false}));
    expect(result.current.leaving?.key).toBe('b');
    await act(async () => second({finished: true}));
    expect(result.current.leaving).toBeNull();
  });
});
