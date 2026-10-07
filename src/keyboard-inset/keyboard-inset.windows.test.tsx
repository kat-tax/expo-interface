import type {View} from 'react-native';
import {Keyboard, Platform} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {useKeyboardInset} from '.';

type Listener = (event?: {endCoordinates: {screenY: number}}) => void;

/** React Native's keyboard events, raised from the test; the events it listens to are named per platform. */
function keyboard() {
  const listeners = new Map<string, Listener>();
  const remove = vi.fn();
  vi.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, listener: Listener) => {
    listeners.set(name, listener);
    return {remove};
  }) as never);
  const ios = Platform.OS === 'ios';
  return {
    remove,
    show: (screenY: number) => listeners.get(ios ? 'keyboardWillChangeFrame' : 'keyboardDidShow')!({endCoordinates: {screenY}}),
    hide: () => listeners.get(ios ? 'keyboardWillHide' : 'keyboardDidHide')!(),
  };
}

/** A view 300 points tall whose top is at 500 in the window. */
const view = {current: {measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 500, 390, 300)} as unknown as View};

describe('useKeyboardInset (windows)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures the view against the keyboard\'s top edge, and answers nothing once it goes', async () => {
    const events = keyboard();
    const {result, unmount} = await renderHook(() => useKeyboardInset(view));
    expect(result.current).toBe(0);
    await act(async () => events.show(600));
    expect(result.current).toBe(200);
    // A keyboard below the view covers none of it.
    await act(async () => events.show(900));
    expect(result.current).toBe(0);
    await act(async () => events.show(650));
    await act(async () => events.hide());
    expect(result.current).toBe(0);
    await unmount();
    expect(events.remove).toHaveBeenCalledTimes(2);
  });

  it('waits for a view to measure', async () => {
    const events = keyboard();
    const {result} = await renderHook(() => useKeyboardInset({current: null}));
    await act(async () => events.show(600));
    expect(result.current).toBe(0);
  });
});
