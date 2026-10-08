import type {LayoutChangeEvent} from 'react-native';
import {I18nManager} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {fromLeft, useAnchored} from './anchored';

const layout = (width: number, height: number) => ({nativeEvent: {layout: {x: 0, y: 0, width, height}}}) as LayoutChangeEvent;

describe('useAnchored', () => {
  it('takes the card\'s width from its layout when it is not known before', async () => {
    const {result} = await renderHook(() => useAnchored({at: {x: 390, y: 40}}));
    // Nothing measured yet: the card sits under the rectangle, unclamped, and is not placed.
    expect(result.current).toMatchObject({left: 390, top: 48, above: false, placed: false});
    await act(async () => result.current.onBounds(layout(400, 600)));
    await act(async () => result.current.onCard(layout(120, 44)));
    // Clamped by the width the card reported: 400 - 8 - 120.
    expect(result.current).toMatchObject({left: 272, placed: true});
    // The same sizes again change nothing.
    const before = result.current;
    await act(async () => result.current.onCard(layout(120, 44)));
    await act(async () => result.current.onBounds(layout(400, 600)));
    expect(result.current.left).toBe(before.left);
  });

  it('lines the card up with the rectangle\'s right edge for end, still kept inside the parent', async () => {
    let at: {x: number; y: number; width?: number; height?: number} = {x: 100, y: 200, width: 80, height: 20};
    const {result, rerender} = await renderHook(() => useAnchored({at, align: 'end'}));
    await act(async () => result.current.onBounds(layout(400, 600)));
    await act(async () => result.current.onCard(layout(120, 44)));
    // Its right edge on the rectangle's: 100 + 80 - 120.
    expect(result.current.left).toBe(60);
    // A rectangle near the left edge: clamped to the gap.
    at = {x: 0, y: 200, width: 50};
    await rerender({});
    expect(result.current.left).toBe(8);
    // A point: the card ends at it.
    at = {x: 300, y: 200};
    await rerender({});
    expect(result.current.left).toBe(180);
  });

  it('places nothing without a rectangle', async () => {
    const {result} = await renderHook(() => useAnchored({at: null, width: 200}));
    expect(result.current).toMatchObject({left: 0, top: 0, above: false});
  });
});

describe('fromLeft', () => {
  const constants = (isRTL: boolean, doLeftAndRightSwapInRTL: boolean) =>
    vi.spyOn(I18nManager, 'getConstants').mockReturnValue({isRTL, doLeftAndRightSwapInRTL});

  afterEach(() => vi.restoreAllMocks());

  it('sets left in a left-to-right layout', () => {
    constants(false, true);
    expect(fromLeft(80)).toEqual({left: 80});
  });

  it('sets right under a right-to-left layout that swaps them, which React Native reads as the end edge, the left', () => {
    constants(true, true);
    expect(fromLeft(80)).toEqual({right: 80});
  });

  it('sets left under a right-to-left layout that does not swap them', () => {
    constants(true, false);
    expect(fromLeft(80)).toEqual({left: 80});
  });
});
