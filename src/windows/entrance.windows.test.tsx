import {renderHook} from '@testing-library/react-native';
import {Animated} from 'react-native';
import {useEntrance} from './entrance';

type Props = {key: string; kind: 'card' | 'dialog'; animation?: 'default' | 'fade' | 'none'};

function spyTiming() {
  const start = vi.fn();
  const timing = vi.spyOn(Animated, 'timing').mockReturnValue({start} as never);
  return {timing, start};
}

describe('useEntrance (windows)', () => {
  it('leaves a card where it is on its first mount, and plays the entrance when the key changes', async () => {
    const {timing, start} = spyTiming();
    const {result, rerender} = await renderHook((props: Props) => useEntrance(props.key, props.kind, props.animation), {
      initialProps: {key: 'index', kind: 'card'},
    });
    expect(timing).not.toHaveBeenCalled();
    expect(result.current.transform).toEqual([{translateY: expect.anything()}]);
    await rerender({key: 'index', kind: 'card'});
    expect(timing).not.toHaveBeenCalled();
    await rerender({key: 'detail', kind: 'card'});
    expect(timing).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenCalledWith(result.current.opacity, expect.objectContaining({toValue: 1, duration: 200, useNativeDriver: false}));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('plays a dialog on its mount, settling from a little larger', async () => {
    const {timing} = spyTiming();
    const {result} = await renderHook(() => useEntrance('sheet', 'dialog'));
    expect(timing).toHaveBeenCalledTimes(1);
    expect(result.current.transform).toEqual([{scale: expect.anything()}]);
  });

  it('fades alone, or arrives at once, as asked', async () => {
    const {timing} = spyTiming();
    const {result, rerender} = await renderHook((props: Props) => useEntrance(props.key, props.kind, props.animation), {
      initialProps: {key: 'a', kind: 'card', animation: 'fade'},
    });
    expect(result.current.transform).toBeUndefined();
    await rerender({key: 'b', kind: 'card', animation: 'fade'});
    expect(timing).toHaveBeenCalledTimes(1);
    await rerender({key: 'c', kind: 'card', animation: 'none'});
    expect(timing).toHaveBeenCalledTimes(1);
    expect(result.current.transform).toEqual([{translateY: expect.anything()}]);
  });
});
