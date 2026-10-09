import type {View} from 'react-native';
import {Keyboard, Platform} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {clearRiding, publishRiding} from '../keyboard/riding';
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

describe(`useKeyboardInset (${Platform.OS})`, () => {
  afterEach(() => {
    clearRiding('bar');
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

  it('counts a bar riding on the keyboard over the view', async () => {
    const events = keyboard();
    const measure = vi.spyOn(view.current, 'measureInWindow');
    const {result, unmount} = await renderHook(() => useKeyboardInset(view));
    // A bar published while the keyboard is down is nothing to measure against.
    await act(async () => publishRiding('bar', 120));
    expect(measure).not.toHaveBeenCalled();
    expect(result.current).toBe(0);
    // The keyboard's top at 900 is below the view's bottom at 800; a bar riding on it reaches up to 780.
    await act(async () => events.show(900));
    expect(result.current).toBe(20);
    // The bar grows while the keyboard is up: measured again against the taller band.
    await act(async () => publishRiding('bar', 200));
    expect(result.current).toBe(100);
    // A band that ends under the view covers none of it.
    await act(async () => publishRiding('bar', 50));
    expect(result.current).toBe(0);
    await act(async () => clearRiding('bar'));
    expect(result.current).toBe(0);
    await act(async () => events.show(600));
    expect(result.current).toBe(200);
    await act(async () => publishRiding('bar', 100));
    expect(result.current).toBe(300);
    // Unmounted while the keyboard is up, the hook hears no more of the bar.
    await unmount();
    measure.mockClear();
    await act(async () => publishRiding('bar', 150));
    expect(measure).not.toHaveBeenCalled();
  });

  it('drops a measure that lands after the keyboard went', async () => {
    const events = keyboard();
    const measureInWindow = vi.fn<(callback: (x: number, y: number, width: number, height: number) => void) => void>();
    const slow = {current: {measureInWindow} as unknown as View};
    const {result} = await renderHook(() => useKeyboardInset(slow));
    await act(async () => events.show(600));
    const [callback] = measureInWindow.mock.calls[0];
    await act(async () => events.hide());
    await act(async () => callback(0, 500, 390, 300));
    expect(result.current).toBe(0);
  });
});
