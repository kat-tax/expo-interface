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
 * The page motions WinUI has: drill in, for going deeper; page refresh,
 * for a top-level change; a slide from a side, for siblings; a slide from
 * the bottom; a fade; or none.
 */
export type Transition = 'drill' | 'refresh' | 'slide_right' | 'slide_left' | 'slide_bottom' | 'fade' | 'none';

/** Forward goes deeper or onward; backward returns. The same motion plays reversed. */
export type Direction = 'forward' | 'backward';

/** Which screen of the pair a style is for. */
export type Role = 'arriving' | 'leaving';

export interface Size {
  width: number;
  height: number;
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
 * WinUI's durations: `ControlNormalAnimationDuration` for what arrives,
 * `ControlFastAnimationDuration` for what leaves, and a slide moves both
 * screens as one sheet for the normal time.
 */
export const DURATION = {arriving: 250, leaving: 167, slide: 250} as const;

/** Fluent's easings: fast out, slow in for what enters the scene; slow out, fast in for what leaves it. */
export const DECELERATE = Easing.bezier(0, 0, 0, 1);
export const ACCELERATE = Easing.bezier(1, 0, 1, 1);

/** Page refresh rises by this much; drill in settles from this far from full size. */
const REFRESH_OFFSET = 24;
const DRILL_SCALE = 0.05;

/** How long a role of a transition plays, and along which curve. */
export function timingOf(transition: Transition, role: Role): {duration: number; easing: (value: number) => number} {
  const slide = transition === 'slide_right' || transition === 'slide_left' || transition === 'slide_bottom';
  if (slide) return {duration: DURATION.slide, easing: DECELERATE};
  if (role === 'arriving') return {duration: DURATION.arriving, easing: DECELERATE};
  return {duration: DURATION.leaving, easing: ACCELERATE};
}

/**
 * The animated style of one screen of a pair while the motion runs from
 * `progress` 0 to 1. Drill in is deeper is closer: what arrives settles
 * from a little small, what leaves grows past the eye and fades, and back
 * is the reverse. Page refresh rises and fades in, and what it replaces
 * fades. A slide moves both screens across the width, or the arriving one
 * up from the bottom over what stays. A fade fades both.
 */
export function motionStyle(transition: Transition, role: Role, direction: Direction, progress: Animated.Value, size: Size): Animated.WithAnimatedObject<ViewStyle> {
  const range = (from: number, to: number) => progress.interpolate({inputRange: [0, 1], outputRange: [from, to]});
  const arriving = role === 'arriving';
  const forward = direction === 'forward';
  switch (transition) {
    case 'none':
      return {};
    case 'fade':
      return {opacity: arriving ? progress : range(1, 0)};
    case 'refresh':
      return arriving ? {opacity: progress, transform: [{translateY: range(REFRESH_OFFSET, 0)}]} : {opacity: range(1, 0)};
    case 'drill': {
      const near = 1 + DRILL_SCALE;
      const far = 1 - DRILL_SCALE;
      if (arriving) return {opacity: progress, transform: [{scale: range(forward ? far : near, 1)}]};
      return {opacity: range(1, 0), transform: [{scale: range(1, forward ? near : far)}]};
    }
    case 'slide_right':
    case 'slide_left': {
      // Forward comes from the side named; back comes from the other. What leaves goes out the opposite side.
      const side = (transition === 'slide_right') === forward ? 1 : -1;
      return {transform: [{translateX: arriving ? range(side * size.width, 0) : range(0, -side * size.width)}]};
    }
    case 'slide_bottom':
      if (forward) return arriving ? {transform: [{translateY: range(size.height, 0)}]} : {};
      return arriving ? {} : {transform: [{translateY: range(0, size.height)}]};
  }
}

/** What a stack has drawn: the route, its place in the stack, what was rendered for it, and its motion. */
export interface Drawn {
  key: string;
  index: number;
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

/** What plays for the key drawn now, settled when the key changed and kept for the whole motion. */
interface Latched {
  key: string | null;
  index: number;
  element: ReactNode;
  animation?: StackAnimation;
  transition: Transition;
  direction: Direction;
}

interface Departure {
  key: string;
  element: ReactNode;
  transition: Transition;
  direction: Direction;
  progress: Animated.Value;
}

const UNLATCHED: Latched = {key: null, index: -1, element: null, transition: 'none', direction: 'forward'};

/**
 * The motion of a stack's screens: what is drawn now arrives, and what was
 * drawn before leaves, each along its role of the transition, on the
 * native driver. Forward is a push, or a first screen when `playsOnMount`;
 * a lower index, or nothing to draw, is back. The arriving screen's
 * animation names the motion forward, the leaving one's back, as the
 * native stack does. What is settled when the key changes holds for the
 * whole motion, so a render in the middle of it changes no curve, and the
 * screen leaving is known in that same render, so it never leaves the tree.
 */
export function useScreenMotion(current: Drawn | null, size: Size, playsOnMount = false): {arriving: Animated.WithAnimatedObject<ViewStyle>; leaving: Leaving | null} {
  const [progress] = useState(() => new Animated.Value(1));
  const [stored, setStored] = useState<Latched>(UNLATCHED);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const key = current?.key ?? null;
  let latched = stored;
  let leaving = departure;
  if (stored.key !== key) {
    const direction: Direction = current === null || (stored.key !== null && stored.index > current.index) ? 'backward' : 'forward';
    const animation = direction === 'forward' ? current?.animation : stored.animation;
    latched = {
      key,
      index: current?.index ?? -1,
      element: current?.element ?? null,
      animation: current?.animation,
      direction,
      transition: stored.key === null && !playsOnMount ? 'none' : resolveTransition(animation),
    };
    setStored(latched);
    leaving = stored.key !== null && latched.transition !== 'none'
      ? {key: stored.key, element: stored.element, transition: latched.transition, direction, progress: new Animated.Value(0)}
      : null;
    setDeparture(leaving);
  }
  const {transition, direction} = latched;
  useLayoutEffect(() => {
    if (transition === 'none') {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const {duration, easing} = timingOf(transition, 'arriving');
    Animated.timing(progress, {toValue: 1, duration, easing, useNativeDriver: true}).start();
    // The motion settles with the key; the transition was settled then too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, progress]);
  useLayoutEffect(() => {
    if (!departure) return;
    const {duration, easing} = timingOf(departure.transition, 'leaving');
    Animated.timing(departure.progress, {toValue: 1, duration, easing, useNativeDriver: true}).start(({finished}) => {
      if (finished) setDeparture(gone => (gone === departure ? null : gone));
    });
  }, [departure]);
  return {
    arriving: key === null ? {} : motionStyle(transition, 'arriving', direction, progress, size),
    leaving: leaving
      ? {
          key: leaving.key,
          element: leaving.element,
          transition: leaving.transition,
          style: motionStyle(leaving.transition, 'leaving', leaving.direction, leaving.progress, size),
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
export function useArrival(key: string, transition: Transition, direction: Direction, size: Size): Animated.WithAnimatedObject<ViewStyle> {
  const [progress] = useState(() => new Animated.Value(1));
  const [stored, setStored] = useState<Latched>(UNLATCHED);
  let latched = stored;
  if (stored.key !== key) {
    latched = {key, index: 0, element: null, direction, transition: stored.key === null ? 'none' : transition};
    setStored(latched);
  }
  const played = latched.transition;
  useLayoutEffect(() => {
    if (played === 'none') {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const {duration, easing} = timingOf(played, 'arriving');
    Animated.timing(progress, {toValue: 1, duration, easing, useNativeDriver: true}).start();
    // Plays once per key; what plays was settled with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, progress]);
  return motionStyle(played, 'arriving', latched.direction, progress, size);
}
