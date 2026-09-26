import type {ReactNode} from 'react';
import type {ViewStyle} from 'react-native';
import {useLayoutEffect, useState} from 'react';
import {Animated, Easing} from 'react-native';

/**
 * A screen's `animation`, in the native stack's words, so a layout written
 * for iOS and Android says the same thing on Windows.
 */
export type StackAnimation =
  | 'default'
  | 'fade'
  | 'fade_from_bottom'
  | 'flip'
  | 'none'
  | 'simple_push'
  | 'slide_from_bottom'
  | 'slide_from_right'
  | 'slide_from_left'
  | 'ios_from_right'
  | 'ios_from_left';

/**
 * The page motions WinUI's `Frame` has: drill in, for going deeper; page
 * refresh, for a top-level change; a slide from a side, for siblings; a
 * slide from the bottom; a fade; or none.
 */
export type Transition = 'drill' | 'refresh' | 'slide_right' | 'slide_left' | 'slide_bottom' | 'fade' | 'none';

/** Forward goes deeper or onward; backward returns. The same motion plays reversed. */
export type Direction = 'forward' | 'backward';

/** Which screen of the pair a motion is for. */
export type Role = 'arriving' | 'leaving';

/** What a track animates. */
export type Property = 'opacity' | 'scale' | 'translateX' | 'translateY';

type EasingFunction = (value: number) => number;

/**
 * One property's motion over a transition: held at `from` for `delay`
 * milliseconds, then to `to` over `duration` along `easing`. A duration of
 * zero is a jump, as WinUI's discrete key frames are.
 */
export interface Track {
  property: Property;
  from: number;
  to: number;
  delay: number;
  duration: number;
  easing: EasingFunction;
}

/** The WinUI motion a stack animation asks for: a push is a drill in unless it says otherwise. */
export function resolveTransition(animation: StackAnimation = 'default'): Transition {
  switch (animation) {
    case 'fade':
    case 'flip':
      return 'fade';
    case 'fade_from_bottom':
      return 'refresh';
    case 'slide_from_bottom':
      return 'slide_bottom';
    case 'slide_from_right':
    case 'ios_from_right':
    case 'simple_push':
      return 'slide_right';
    case 'slide_from_left':
    case 'ios_from_left':
      return 'slide_left';
    case 'none':
      return 'none';
    default:
      return 'drill';
  }
}

/**
 * Whether a transition runs on the compositor. react-native-windows 0.84
 * animates a view's opacity and scale there, but a translation it animates
 * as `Translation.X` on a composition visual, which has no such property:
 * the view stays where the motion started. So what translates, the slides
 * and page refresh, runs on the JavaScript thread, and what fades and
 * scales, drill in and a fade, on the compositor.
 */
export function usesNativeDriver(transition: Transition): boolean {
  return transition === 'drill' || transition === 'fade' || transition === 'none';
}

/** The curves WinUI's `Frame` plays its page transitions along, as cubic Béziers. */
const CURVE = {
  /** What comes in: the spline of every entrance. */
  in: Easing.bezier(0.1, 0.9, 0.2, 1),
  /** What goes out under page refresh and the slides. */
  out: Easing.bezier(0.7, 0, 1, 0.5),
  /** Every fade of the drill. */
  opacity: Easing.bezier(0.17, 0.17, 0, 1),
  /** The screen a drill returns to, settling from a little large. */
  settle: Easing.bezier(0.12, 0, 0, 1),
};

/** XAML's `ExponentialEase` at an exponent, easing in; the bottom slide uses it at 6, in and out. */
function exponential(exponent: number): EasingFunction {
  const top = Math.exp(exponent) - 1;
  return value => (Math.exp(exponent * value) - 1) / top;
}
const BOTTOM_IN = Easing.out(exponential(6));
const BOTTOM_OUT = exponential(6);

/**
 * The key frames of WinUI's `Frame` transitions, for the screen arriving
 * and the one leaving, forward and back. Drill in: what leaves grows to 104%
 * and fades over 100 ms while what arrives settles from 94% over 783 ms,
 * fading in over 333 ms; back, what leaves shrinks to 96% over 100 ms and
 * what returns settles from 106% over 333 ms. Page refresh: what leaves
 * fades over 150 ms, then what arrives appears and rises from 140 points
 * over 300 ms; back, what leaves sinks 140 points over 150 ms and what
 * returns fades in over 300 ms. A horizontal slide: what leaves moves 150
 * points on over 150 ms and goes, then what arrives comes 200 points in
 * from the other side over 300 ms; back is the same the other way. The
 * bottom slide: what arrives waits 250 ms, then rises 200 points over 350;
 * what leaves sinks until it goes at 250 ms. A fade is page refresh without
 * the rise.
 */
export function tracksOf(transition: Transition, role: Role, direction: Direction): Track[] {
  const arriving = role === 'arriving';
  const forward = direction === 'forward';
  const track = (property: Property, from: number, to: number, delay: number, duration: number, easing: EasingFunction = Easing.linear): Track =>
    ({property, from, to, delay, duration, easing});
  switch (transition) {
    case 'none':
      return [];
    case 'drill':
      if (forward) {
        return arriving
          ? [track('scale', 0.94, 1, 0, 783, CURVE.in), track('opacity', 0, 1, 0, 333, CURVE.opacity)]
          : [track('scale', 1, 1.04, 0, 100, CURVE.in), track('opacity', 1, 0, 0, 100, CURVE.opacity)];
      }
      return arriving
        ? [track('scale', 1.06, 1, 0, 333, CURVE.settle), track('opacity', 0, 1, 0, 333, CURVE.opacity)]
        : [track('scale', 1, 0.96, 0, 100, CURVE.in), track('opacity', 1, 0, 0, 100, CURVE.opacity)];
    case 'refresh':
      if (forward) {
        return arriving
          ? [track('opacity', 0, 1, 150, 0), track('translateY', 140, 0, 150, 300, CURVE.in)]
          : [track('opacity', 1, 0, 0, 150, CURVE.out)];
      }
      return arriving
        ? [track('opacity', 0, 1, 150, 300, CURVE.in)]
        : [track('opacity', 1, 0, 150, 0), track('translateY', 0, 140, 0, 150, CURVE.out)];
    case 'fade':
      return arriving ? [track('opacity', 0, 1, 150, 300, CURVE.in)] : [track('opacity', 1, 0, 0, 150, CURVE.out)];
    case 'slide_right':
    case 'slide_left': {
      // WinUI's factor: from the left is 1, from the right is -1; what leaves moves on 150, what arrives comes 200 in.
      const side = transition === 'slide_left' ? 1 : -1;
      if (forward) {
        return arriving
          ? [track('opacity', 0, 1, 150, 0), track('translateX', -200 * side, 0, 150, 300, CURVE.in)]
          : [track('opacity', 1, 0, 150, 0), track('translateX', 0, 150 * side, 0, 150, CURVE.out)];
      }
      return arriving
        ? [track('opacity', 0, 1, 150, 0), track('translateX', 150 * side, 0, 150, 300, CURVE.in)]
        : [track('opacity', 1, 0, 150, 0), track('translateX', 0, -200 * side, 0, 150, CURVE.out)];
    }
    case 'slide_bottom':
      if (forward) {
        return arriving
          ? [track('opacity', 0, 1, 250, 0), track('translateY', 200, 0, 250, 350, BOTTOM_IN)]
          : [track('opacity', 1, 0, 250, 0), track('translateY', 0, 200, 0, 600, BOTTOM_OUT)];
      }
      return arriving ? [track('opacity', 0, 1, 250, 0)] : [track('opacity', 1, 0, 250, 0), track('translateY', 0, 200, 0, 600, BOTTOM_OUT)];
  }
}

/** How long a role of a transition takes: the end of its last track. */
export function durationOf(transition: Transition, role: Role, direction: Direction): number {
  return Math.max(0, ...tracksOf(transition, role, direction).map(track => track.delay + track.duration));
}

type Values = Record<Property, Animated.Value>;

/** A value per property, starting where its track starts, or at rest. */
function valuesFor(tracks: Track[]): Values {
  const values: Values = {opacity: new Animated.Value(1), scale: new Animated.Value(1), translateX: new Animated.Value(0), translateY: new Animated.Value(0)};
  for (const track of tracks) values[track.property].setValue(track.from);
  return values;
}

/** The animated style of the properties the tracks move. */
export function styleOf(values: Values, tracks: Track[]): Animated.WithAnimatedObject<ViewStyle> {
  const moved = new Set(tracks.map(track => track.property));
  const transform: ({translateX: Animated.Value} | {translateY: Animated.Value} | {scale: Animated.Value})[] = [];
  if (moved.has('translateX')) transform.push({translateX: values.translateX});
  if (moved.has('translateY')) transform.push({translateY: values.translateY});
  if (moved.has('scale')) transform.push({scale: values.scale});
  return {
    ...(moved.has('opacity') ? {opacity: values.opacity} : {}),
    ...(transform.length > 0 ? {transform} : {}),
  };
}

/**
 * Plays every track of a role at once, each after its delay, on the driver
 * the transition takes, and says when the last has ended, or that one was
 * stopped short.
 */
function play(values: Values, tracks: Track[], transition: Transition, onEnd?: (result: {finished: boolean}) => void) {
  const native = usesNativeDriver(transition);
  let left = tracks.length;
  let finished = true;
  for (const track of tracks) {
    Animated.timing(values[track.property], {toValue: track.to, delay: track.delay, duration: track.duration, easing: track.easing, useNativeDriver: native}).start(result => {
      finished = finished && result.finished;
      left -= 1;
      if (left === 0) onEnd?.({finished});
    });
  }
}

/**
 * What a stack has drawn: the route, its place in the stack, what was
 * rendered for it, and its motion. `route` is the navigation state's own
 * route object: a new one means the state changed under the same key (a
 * nested navigator moved, options were set), and what was rendered is then
 * taken again, so that the screen seen out later is the one that was there.
 */
export interface Drawn {
  key: string;
  index: number;
  route: object;
  element: ReactNode;
  animation?: StackAnimation;
}

/**
 * A screen on its way out, drawn until its motion ends. Drawn under the
 * same key, beside what arrives, so its state stays with it while it goes:
 * the leaving entry is what it was, not a fresh copy.
 */
export interface Leaving {
  key: string;
  element: ReactNode;
  transition: Transition;
  style: Animated.WithAnimatedObject<ViewStyle>;
  /** Over the arriving screen (back: the closer screen recedes) or under it (forward: the new screen comes over). */
  onTop: boolean;
}

/**
 * What plays for the key drawn now, settled when the key changed and kept
 * for the whole motion, with values of its own: a value once driven by the
 * compositor cannot be driven from JavaScript afterwards, and each
 * transition picks its driver.
 */
interface Latched {
  key: string | null;
  index: number;
  route: object | null;
  element: ReactNode;
  animation?: StackAnimation;
  transition: Transition;
  direction: Direction;
  tracks: Track[];
  values: Values;
}

interface Departure {
  key: string;
  element: ReactNode;
  transition: Transition;
  direction: Direction;
  tracks: Track[];
  values: Values;
}

const UNLATCHED: Latched = {key: null, index: -1, route: null, element: null, transition: 'none', direction: 'forward', tracks: [], values: valuesFor([])};

/**
 * The motion of a stack's screens: what is drawn now arrives, and what was
 * drawn before leaves, each along its role of the transition. Forward is a
 * push, or a first screen when `playsOnMount`; a lower index, or nothing to
 * draw, is back. The arriving screen's animation names the motion forward,
 * the leaving one's back, as the native stack does. What is settled when
 * the key changes holds for the whole motion, so a render in the middle of
 * it changes no curve, and the screen leaving is known in that same render,
 * so it never leaves the tree.
 */
export function useScreenMotion(current: Drawn | null, playsOnMount = false): {arriving: Animated.WithAnimatedObject<ViewStyle>; leaving: Leaving | null} {
  const [stored, setStored] = useState<Latched>(UNLATCHED);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const key = current?.key ?? null;
  let latched = stored;
  let leaving = departure;
  if (stored.key !== key) {
    const direction: Direction = current === null || (stored.key !== null && stored.index > current.index) ? 'backward' : 'forward';
    const animation = direction === 'forward' ? current?.animation : stored.animation;
    const transition = stored.key === null && !playsOnMount ? 'none' : resolveTransition(animation);
    const tracks = key === null ? [] : tracksOf(transition, 'arriving', direction);
    latched = {
      key,
      index: current?.index ?? -1,
      route: current?.route ?? null,
      element: current?.element ?? null,
      animation: current?.animation,
      direction,
      transition,
      tracks,
      values: valuesFor(tracks),
    };
    setStored(latched);
    if (stored.key !== null && transition !== 'none') {
      const gone = tracksOf(transition, 'leaving', direction);
      leaving = {key: stored.key, element: stored.element, transition, direction, tracks: gone, values: valuesFor(gone)};
    } else {
      leaving = null;
    }
    setDeparture(leaving);
  } else if (current !== null && stored.route !== current.route) {
    // The same screen, drawn again after its state changed: what would leave is what is there now.
    latched = {...stored, route: current.route, element: current.element};
    setStored(latched);
  }
  useLayoutEffect(() => {
    if (latched.tracks.length > 0) play(latched.values, latched.tracks, latched.transition);
    // The motion settles with the key; its tracks and values were settled then too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useLayoutEffect(() => {
    if (!departure) return;
    play(departure.values, departure.tracks, departure.transition, ({finished}) => {
      if (finished) setDeparture(gone => (gone === departure ? null : gone));
    });
  }, [departure]);
  return {
    arriving: styleOf(latched.values, latched.tracks),
    leaving: leaving
      ? {
          key: leaving.key,
          element: leaving.element,
          transition: leaving.transition,
          style: styleOf(leaving.values, leaving.tracks),
          onTop: leaving.direction === 'backward',
        }
      : null,
  };
}

/**
 * The arrival alone, for content that replaces what was there without a
 * screen to see out: the tabs' content on a selection. Plays when `key`
 * changes, with the transition and direction given then; the first content
 * is simply there.
 */
export function useArrival(key: string, transition: Transition, direction: Direction): Animated.WithAnimatedObject<ViewStyle> {
  const [stored, setStored] = useState<Latched>(UNLATCHED);
  let latched = stored;
  if (stored.key !== key) {
    const played = stored.key === null ? 'none' : transition;
    const tracks = tracksOf(played, 'arriving', direction);
    latched = {key, index: 0, route: null, element: null, direction, transition: played, tracks, values: valuesFor(tracks)};
    setStored(latched);
  }
  useLayoutEffect(() => {
    if (latched.tracks.length > 0) play(latched.values, latched.tracks, latched.transition);
    // Plays once per key; what plays, and its values, were settled with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return styleOf(latched.values, latched.tracks);
}
