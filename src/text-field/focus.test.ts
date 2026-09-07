import type {TextInput} from 'react-native';
import {Keyboard, Platform} from 'react-native';
import {FOCUS_RETRY_MS, focusField} from './shared';

const isAndroid = Platform.OS === 'android';

function fakeInput() {
  return {focus: vi.fn(), blur: vi.fn()} as unknown as TextInput;
}

describe(`focusField (${Platform.OS})`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('focuses the field at once', () => {
    const input = fakeInput();
    const cleanup = focusField({current: input});
    expect(input.focus).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('does nothing without a field', () => {
    expect(() => focusField({current: null})()).not.toThrow();
  });

  (isAndroid ? it : it.skip)('focuses again when the keyboard has not come a moment later', () => {
    const visible = vi.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const input = fakeInput();
    focusField({current: input});
    vi.advanceTimersByTime(FOCUS_RETRY_MS);
    expect(input.blur).toHaveBeenCalledTimes(1);
    expect(input.focus).toHaveBeenCalledTimes(2);
    visible.mockRestore();
  });

  (isAndroid ? it : it.skip)('leaves a field alone once the keyboard is up, or when it has unmounted', () => {
    const visible = vi.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const input = fakeInput();
    focusField({current: input});
    vi.advanceTimersByTime(FOCUS_RETRY_MS);
    expect(input.blur).not.toHaveBeenCalled();
    expect(input.focus).toHaveBeenCalledTimes(1);

    visible.mockReturnValue(false);
    const ref = {current: fakeInput() as TextInput | null};
    focusField(ref);
    ref.current = null;
    expect(() => vi.advanceTimersByTime(FOCUS_RETRY_MS)).not.toThrow();
    visible.mockRestore();
  });

  (isAndroid ? it : it.skip)('cancels the retry through the cleanup', () => {
    const visible = vi.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const input = fakeInput();
    focusField({current: input})();
    vi.advanceTimersByTime(FOCUS_RETRY_MS);
    expect(input.focus).toHaveBeenCalledTimes(1);
    visible.mockRestore();
  });

  (isAndroid ? it.skip : it)('never retries off Android', () => {
    const input = fakeInput();
    focusField({current: input});
    vi.advanceTimersByTime(FOCUS_RETRY_MS * 2);
    expect(input.focus).toHaveBeenCalledTimes(1);
    expect(input.blur).not.toHaveBeenCalled();
  });
});
