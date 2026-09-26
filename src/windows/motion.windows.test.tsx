import type {Drawn, Track} from './motion';
import {act, renderHook} from '@testing-library/react-native';
import {Animated, Text} from 'react-native';
import {durationOf, resolveTransition, tracksOf, useArrival, useScreenMotion, usesNativeDriver} from './motion';

/** `Animated.timing` that completes at once, or never, so a departure can be seen out or seen. */
function spyTiming(completes: boolean) {
  const start = vi.fn((callback?: (result: {finished: boolean}) => void) => {
    if (completes) callback?.({finished: true});
  });
  const timing = vi.spyOn(Animated, 'timing').mockReturnValue({start, stop: vi.fn(), reset: vi.fn()} as never);
  return {timing, start};
}

/** A track without its curve, for comparing with WinUI's key frames. */
function frames(tracks: Track[]): Omit<Track, 'easing'>[] {
  return tracks.map(({easing: _easing, ...frame}) => frame);
}

describe('the stack animations on Windows', () => {
  it("maps the native stack's words onto WinUI's motions", () => {
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

  it("plays the Frame's drill in and out, key frame for key frame", () => {
    expect(frames(tracksOf('drill', 'arriving', 'forward'))).toEqual([
      {property: 'scale', from: 0.94, to: 1, delay: 0, duration: 783},
      {property: 'opacity', from: 0, to: 1, delay: 0, duration: 333},
    ]);
    expect(frames(tracksOf('drill', 'leaving', 'forward'))).toEqual([
      {property: 'scale', from: 1, to: 1.04, delay: 0, duration: 100},
      {property: 'opacity', from: 1, to: 0, delay: 0, duration: 100},
    ]);
    expect(frames(tracksOf('drill', 'arriving', 'backward'))).toEqual([
      {property: 'scale', from: 1.06, to: 1, delay: 0, duration: 333},
      {property: 'opacity', from: 0, to: 1, delay: 0, duration: 333},
    ]);
    expect(frames(tracksOf('drill', 'leaving', 'backward'))).toEqual([
      {property: 'scale', from: 1, to: 0.96, delay: 0, duration: 100},
      {property: 'opacity', from: 1, to: 0, delay: 0, duration: 100},
    ]);
    expect(durationOf('drill', 'arriving', 'forward')).toBe(783);
    expect(durationOf('drill', 'leaving', 'forward')).toBe(100);
  });

  it("plays the Frame's page refresh: what leaves fades over 150 ms, then what arrives rises 140 points over 300", () => {
    expect(frames(tracksOf('refresh', 'leaving', 'forward'))).toEqual([{property: 'opacity', from: 1, to: 0, delay: 0, duration: 150}]);
    expect(frames(tracksOf('refresh', 'arriving', 'forward'))).toEqual([
      {property: 'opacity', from: 0, to: 1, delay: 150, duration: 0},
      {property: 'translateY', from: 140, to: 0, delay: 150, duration: 300},
    ]);
    expect(frames(tracksOf('refresh', 'leaving', 'backward'))).toEqual([
      {property: 'opacity', from: 1, to: 0, delay: 150, duration: 0},
      {property: 'translateY', from: 0, to: 140, delay: 0, duration: 150},
    ]);
    expect(frames(tracksOf('refresh', 'arriving', 'backward'))).toEqual([{property: 'opacity', from: 0, to: 1, delay: 150, duration: 300}]);
    expect(durationOf('refresh', 'arriving', 'forward')).toBe(450);
    // A fade is page refresh without the rise.
    expect(frames(tracksOf('fade', 'arriving', 'forward'))).toEqual([{property: 'opacity', from: 0, to: 1, delay: 150, duration: 300}]);
    expect(frames(tracksOf('fade', 'leaving', 'backward'))).toEqual([{property: 'opacity', from: 1, to: 0, delay: 0, duration: 150}]);
    expect(tracksOf('none', 'arriving', 'forward')).toEqual([]);
    expect(durationOf('none', 'leaving', 'backward')).toBe(0);
  });

  it("plays the Frame's horizontal slide: what leaves moves 150 points on and goes, then what arrives comes 200 in", () => {
    // From the right, forward: what leaves goes left, what arrives comes from the right.
    expect(frames(tracksOf('slide_right', 'leaving', 'forward'))).toEqual([
      {property: 'opacity', from: 1, to: 0, delay: 150, duration: 0},
      {property: 'translateX', from: 0, to: -150, delay: 0, duration: 150},
    ]);
    expect(frames(tracksOf('slide_right', 'arriving', 'forward'))).toEqual([
      {property: 'opacity', from: 0, to: 1, delay: 150, duration: 0},
      {property: 'translateX', from: 200, to: 0, delay: 150, duration: 300},
    ]);
    // Back: what leaves goes right, what arrives comes from the left.
    expect(frames(tracksOf('slide_right', 'leaving', 'backward'))).toEqual([
      {property: 'opacity', from: 1, to: 0, delay: 150, duration: 0},
      {property: 'translateX', from: 0, to: 200, delay: 0, duration: 150},
    ]);
    expect(frames(tracksOf('slide_right', 'arriving', 'backward'))).toEqual([
      {property: 'opacity', from: 0, to: 1, delay: 150, duration: 0},
      {property: 'translateX', from: -150, to: 0, delay: 150, duration: 300},
    ]);
    // From the left is the mirror.
    expect(frames(tracksOf('slide_left', 'leaving', 'forward'))[1]).toMatchObject({from: 0, to: 150});
    expect(frames(tracksOf('slide_left', 'arriving', 'forward'))[1]).toMatchObject({from: -200, to: 0});
    expect(frames(tracksOf('slide_left', 'leaving', 'backward'))[1]).toMatchObject({from: 0, to: -200});
    expect(frames(tracksOf('slide_left', 'arriving', 'backward'))[1]).toMatchObject({from: 150, to: 0});
    expect(durationOf('slide_right', 'arriving', 'forward')).toBe(450);
  });

  it("plays the Frame's bottom slide: what arrives waits 250 ms and rises 200 points over 350, what leaves sinks until it goes", () => {
    expect(frames(tracksOf('slide_bottom', 'arriving', 'forward'))).toEqual([
      {property: 'opacity', from: 0, to: 1, delay: 250, duration: 0},
      {property: 'translateY', from: 200, to: 0, delay: 250, duration: 350},
    ]);
    expect(frames(tracksOf('slide_bottom', 'leaving', 'forward'))).toEqual([
      {property: 'opacity', from: 1, to: 0, delay: 250, duration: 0},
      {property: 'translateY', from: 0, to: 200, delay: 0, duration: 600},
    ]);
    expect(frames(tracksOf('slide_bottom', 'arriving', 'backward'))).toEqual([{property: 'opacity', from: 0, to: 1, delay: 250, duration: 0}]);
    expect(frames(tracksOf('slide_bottom', 'leaving', 'backward'))).toEqual([
      {property: 'opacity', from: 1, to: 0, delay: 250, duration: 0},
      {property: 'translateY', from: 0, to: 200, delay: 0, duration: 600},
    ]);
    // The exponential ease at 6: in starts slow, out ends slow.
    const [, rise] = tracksOf('slide_bottom', 'arriving', 'forward');
    const [, sink] = tracksOf('slide_bottom', 'leaving', 'forward');
    expect(rise.easing(0.5)).toBeGreaterThan(0.9);
    expect(sink.easing(0.5)).toBeLessThan(0.1);
    expect(rise.easing(1)).toBeCloseTo(1);
    expect(sink.easing(0)).toBeCloseTo(0);
  });
});

describe('useScreenMotion (windows)', () => {
  const drawn = (key: string, index: number, animation?: Drawn['animation']): Drawn => ({key, index, route: {key}, animation, element: <Text>{key}</Text>});

  it('leaves the first screen where it is, then sees a pushed screen in and the one before out, and the reverse on a pop', async () => {
    const {timing, start} = spyTiming(false);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current), {
      initialProps: {current: drawn('index', 0)},
    });
    expect(timing).not.toHaveBeenCalled();
    expect(result.current.arriving).toEqual({});
    expect(result.current.leaving).toBeNull();
    await rerender({current: drawn('detail', 1)});
    // A track each for the arrival's scale and opacity and the departure's, on the compositor.
    expect(timing).toHaveBeenCalledTimes(4);
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({toValue: 1, duration: 783, delay: 0, useNativeDriver: true}));
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({toValue: 1.04, duration: 100, useNativeDriver: true}));
    expect(start).toHaveBeenCalledTimes(4);
    expect(result.current.leaving).toMatchObject({key: 'index', transition: 'drill', onTop: false});
    expect(result.current.arriving.transform).toEqual([{scale: expect.anything()}]);
    expect(result.current.arriving.opacity).toBeDefined();
    // Back: the detail leaves on top; the index settles from a little large.
    await rerender({current: drawn('index', 0)});
    expect(result.current.leaving).toMatchObject({key: 'detail', onTop: true});
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({toValue: 0.96, duration: 100}));
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({toValue: 1, duration: 333}));
  });

  it('takes the motion from the screen arriving forward and from the one leaving back, and clears the departure when its motion ends', async () => {
    const {timing, start} = spyTiming(true);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current), {
      initialProps: {current: drawn('index', 0, 'fade')},
    });
    await rerender({current: drawn('detail', 1, 'slide_from_right')});
    // A slide, on the JavaScript thread: the arrival's move in, then the departure's move out; seen out at once, the departure is over.
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({toValue: 0, delay: 150, duration: 300, useNativeDriver: false}));
    expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: -150, delay: 0, duration: 150, useNativeDriver: false}));
    expect(start).toHaveBeenCalled();
    expect(result.current.leaving).toBeNull();
    expect(result.current.arriving.transform).toEqual([{translateX: expect.anything()}]);
    await rerender({current: drawn('index', 0, 'fade')});
    // Back: the detail's own slide, reversed, not the index's fade.
    expect(result.current.arriving.transform).toEqual([{translateX: expect.anything()}]);
  });

  it('plays nothing for a screen that asks for none, and lets nothing leave then', async () => {
    const {timing} = spyTiming(false);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current), {
      initialProps: {current: drawn('index', 0)},
    });
    await rerender({current: drawn('still', 1, 'none')});
    expect(timing).not.toHaveBeenCalled();
    expect(result.current.leaving).toBeNull();
    expect(result.current.arriving).toEqual({});
  });

  it('plays a first screen on request, and sees the last one out when there is nothing to draw', async () => {
    const {timing} = spyTiming(false);
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current, true), {
      initialProps: {current: drawn('card', 1)},
    });
    expect(timing).toHaveBeenCalledTimes(2);
    expect(result.current.arriving.transform).toEqual([{scale: expect.anything()}]);
    await rerender({current: null});
    expect(result.current.leaving).toMatchObject({key: 'card', onTop: true, transition: 'drill'});
    expect(result.current.arriving).toEqual({});
  });
});

describe('useScreenMotion departures (windows)', () => {
  it('keeps a departure that did not finish, and a newer one when an older one finishes late', async () => {
    const callbacks: ((result: {finished: boolean}) => void)[] = [];
    vi.spyOn(Animated, 'timing').mockImplementation(() => ({start: (callback?: (result: {finished: boolean}) => void) => {
      if (callback) callbacks.push(callback);
    }, stop: vi.fn(), reset: vi.fn()}) as never);
    const element = <Text>screen</Text>;
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current), {
      initialProps: {current: {key: 'a', index: 0, route: {}, element, animation: 'fade' as const}},
    });
    await rerender({current: {key: 'b', index: 1, route: {}, element, animation: 'fade' as const}});
    expect(result.current.leaving?.key).toBe('a');
    // A fade has one track a role: the arrival's, then the departure's.
    expect(callbacks).toHaveLength(2);
    const [, first] = callbacks.splice(0);
    await rerender({current: {key: 'c', index: 2, route: {}, element, animation: 'fade' as const}});
    expect(result.current.leaving?.key).toBe('b');
    const [, second] = callbacks.splice(0);
    // The older departure finishing does not take the newer one away, nor does the newer one stopping short.
    await act(async () => first({finished: true}));
    expect(result.current.leaving?.key).toBe('b');
    await act(async () => second({finished: false}));
    expect(result.current.leaving?.key).toBe('b');
    // The next departure, finishing, goes.
    await rerender({current: {key: 'd', index: 3, route: {}, element, animation: 'fade' as const}});
    expect(result.current.leaving?.key).toBe('c');
    const [, third] = callbacks.splice(0);
    await act(async () => third({finished: true}));
    expect(result.current.leaving).toBeNull();
  });
});

describe('useArrival (windows)', () => {
  it('leaves the first content where it is and plays what a change asks for, along the direction given then', async () => {
    const {timing} = spyTiming(false);
    const {result, rerender} = await renderHook(
      (props: {key: string; transition: 'slide_right' | 'refresh' | 'none'; direction: 'forward' | 'backward'}) => useArrival(props.key, props.transition, props.direction),
      {initialProps: {key: 'a', transition: 'slide_right', direction: 'forward'}},
    );
    expect(timing).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
    await rerender({key: 'b', transition: 'slide_right', direction: 'backward'});
    // The jump into view and the move in from the left.
    expect(timing).toHaveBeenCalledTimes(2);
    expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: 0, delay: 150, duration: 300, useNativeDriver: false}));
    expect(result.current.transform).toEqual([{translateX: expect.anything()}]);
    // A render in the middle of the motion changes no curve.
    await rerender({key: 'b', transition: 'refresh', direction: 'forward'});
    expect(result.current.transform).toEqual([{translateX: expect.anything()}]);
    await rerender({key: 'c', transition: 'none', direction: 'forward'});
    expect(timing).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({});
  });
});

describe('useScreenMotion freshness (windows)', () => {
  it('sees out the screen as it last was, not as it first was, when its state changed under the same key', async () => {
    spyTiming(false);
    const first = {key: 'r'};
    const later = {key: 'r'};
    const {result, rerender} = await renderHook((props: {current: Drawn | null}) => useScreenMotion(props.current), {
      initialProps: {current: {key: 'index', index: 0, route: first, element: <Text>first</Text>}},
    });
    // The same route object drawn again changes nothing; a new one takes what was rendered for it.
    await rerender({current: {key: 'index', index: 0, route: first, element: <Text>again</Text>}});
    await rerender({current: {key: 'index', index: 0, route: later, element: <Text>later</Text>}});
    await rerender({current: {key: 'detail', index: 1, route: {}, element: <Text>detail</Text>}});
    expect(result.current.leaving?.element).toEqual(<Text>later</Text>);
  });
});
