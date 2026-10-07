import type {LayoutChangeEvent} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {useAnchored} from './anchored';

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

  it('places nothing without a rectangle', async () => {
    const {result} = await renderHook(() => useAnchored({at: null, width: 200}));
    expect(result.current).toMatchObject({left: 0, top: 0, above: false});
  });
});
