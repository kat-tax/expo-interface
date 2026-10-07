import type {View} from 'react-native';
import {act, renderHook} from '@testing-library/react';
import {useKeyboardInset} from '.';

/** A phone's visual viewport, which the test shrinks as a keyboard would. */
function viewport() {
  const target = new EventTarget();
  return Object.assign(target, {offsetTop: 0, height: 800});
}

/** A view whose bottom edge is at 700 in the page's viewport. */
const element = Object.assign(document.createElement('div'), {getBoundingClientRect: () => ({bottom: 700}) as DOMRect});
const view = {current: element as unknown as View};

describe('useKeyboardInset (web)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers what of the view the visual viewport no longer shows, as a keyboard shrinks it', () => {
    const visual = viewport();
    vi.stubGlobal('visualViewport', visual);
    vi.stubGlobal('innerHeight', 800);
    const {result, unmount} = renderHook(() => useKeyboardInset(view));
    expect(result.current).toBe(0);
    act(() => {
      visual.height = 500;
      visual.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(200);
    // Scrolled within the page, the visual viewport shows more of the view.
    act(() => {
      visual.offsetTop = 100;
      visual.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(100);
    unmount();
    act(() => {
      visual.height = 100;
      visual.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(100);
  });

  it('counts only the part of the view inside the page, and waits for a view', () => {
    const visual = viewport();
    vi.stubGlobal('visualViewport', visual);
    vi.stubGlobal('innerHeight', 600);
    const {result} = renderHook(() => useKeyboardInset(view));
    act(() => {
      visual.height = 500;
      visual.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(100);
    const {result: empty} = renderHook(() => useKeyboardInset({current: null}));
    act(() => {
      visual.dispatchEvent(new Event('resize'));
    });
    expect(empty.current).toBe(0);
  });

  it('answers nothing where the browser has no visual viewport', () => {
    vi.stubGlobal('visualViewport', undefined);
    const {result} = renderHook(() => useKeyboardInset(view));
    expect(result.current).toBe(0);
  });
});
