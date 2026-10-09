import type {PropsWithChildren} from 'react';
import type {LayoutChangeEvent, StyleProp, ViewStyle} from 'react-native';
import type {KeyboardLibrary} from './types';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {useColor} from '../theme';
import {loadKeyboardController} from './library';
import {clearRiding, publishRiding} from './riding';

/** The keyboard library, when the app has it: loaded once, natively only. */
const library = loadKeyboardController();

export interface KeyboardBarProps extends PropsWithChildren {
  /**
   * The keyboard's height from the screen's bottom edge once it is up, `0`
   * once it is away, for the screen's content to pad or scroll by (it is
   * not resized: the bar rides over it). The keyboard's height alone: what
   * the bar itself covers above the keyboard while it rides, its own
   * height, `useKeyboardInset` counts for a view the bar rides over.
   */
  onKeyboard?: (height: number) => void;
  /** Style of the bar (its background is the screen's, opaque). */
  style?: StyleProp<ViewStyle>;
}

/**
 * A bottom bar that sticks to the keyboard: it rides up on it by a
 * transform animated with the keyboard on the UI thread, so the layout never
 * changes (no resize, no lines shaking with the animation), and reports the
 * keyboard's height instead so the content can keep its caret above it.
 * Opaque in `background`, since it rides over the content's bottom. While
 * it rides it covers its own height above the keyboard as well, which
 * `useKeyboardInset` adds for a view the bar rides over, so an editor there
 * scrolls its caret clear of the bar too.
 *
 * Needs `react-native-keyboard-controller` (an optional peer, whose
 * `KeyboardProvider` the kit's `AccentProvider` mounts natively); without it,
 * and on web, where the browser keeps the page above the keyboard itself,
 * the bar is a plain view.
 */
export function KeyboardBar({children, onKeyboard, style}: KeyboardBarProps) {
  const background = useColor('background');
  if (!library) {
    return <View style={[{backgroundColor: background}, style]}>{children}</View>;
  }
  return (
    <Sticky library={library} background={background} onKeyboard={onKeyboard} style={style}>
      {children}
    </Sticky>
  );
}

interface StickyProps extends KeyboardBarProps {
  library: KeyboardLibrary;
  background: string;
}

function Sticky({library: {KeyboardStickyView, useKeyboardState}, background, children, onKeyboard, style}: StickyProps) {
  const height = useKeyboardState(s => (s.isVisible ? s.height : 0));
  useEffect(() => {
    onKeyboard?.(height);
  }, [height, onKeyboard]);
  // The keyboard's height is from the window's bottom edge, the bar sits
  // above the navigation inset: the sticky translation is corrected by what
  // lies under the bar. That is measured on a wrapper around the sticky view,
  // which the keyboard never moves, so the measure holds whenever the bar is
  // laid out, including on a screen that mounts while the keyboard is up.
  const window = useWindowDimensions().height;
  const view = useRef<View>(null);
  const [below, setBelow] = useState(0);
  const onLayout = useCallback(() => {
    view.current?.measureInWindow((_x, y, _w, h) => setBelow(Math.max(0, window - (y + h))));
  }, [window]);
  // While the bar rides it covers its own height above the keyboard's top:
  // published for `useKeyboardInset` to count over a view the bar rides
  // over, and taken back once the keyboard goes or the bar unmounts.
  const id = useId();
  const [own, setOwn] = useState(0);
  const onBarLayout = useCallback((event: LayoutChangeEvent) => setOwn(event.nativeEvent.layout.height), []);
  useEffect(() => {
    if (height > 0) publishRiding(id, own);
    else clearRiding(id);
  }, [id, height, own]);
  useEffect(() => () => clearRiding(id), [id]);
  return (
    <View ref={view} onLayout={onLayout} style={styles.bar}>
      <KeyboardStickyView offset={{opened: below}}>
        <View style={[styles.bar, {backgroundColor: background}, style]} onLayout={onBarLayout}>
          {children}
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {width: '100%'},
});

export type {KeyboardLibrary, KeyboardState} from './types';
