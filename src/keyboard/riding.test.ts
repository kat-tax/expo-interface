import {clearRiding, publishRiding, ridingHeight, subscribeRiding} from './riding';

describe('the bars riding on the keyboard', () => {
  afterEach(() => {
    clearRiding('a');
    clearRiding('b');
  });

  it('sums the riding bars and tells its listeners of each change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRiding(listener);
    expect(ridingHeight()).toBe(0);
    publishRiding('a', 56);
    expect(ridingHeight()).toBe(56);
    expect(listener).toHaveBeenCalledTimes(1);
    // The same height again is no change.
    publishRiding('a', 56);
    expect(listener).toHaveBeenCalledTimes(1);
    publishRiding('a', 72);
    expect(ridingHeight()).toBe(72);
    expect(listener).toHaveBeenCalledTimes(2);
    publishRiding('b', 40);
    expect(ridingHeight()).toBe(112);
    expect(listener).toHaveBeenCalledTimes(3);
    clearRiding('a');
    expect(ridingHeight()).toBe(40);
    expect(listener).toHaveBeenCalledTimes(4);
    // A bar that is not riding has nothing to take back.
    clearRiding('a');
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
    clearRiding('b');
    expect(ridingHeight()).toBe(0);
    expect(listener).toHaveBeenCalledTimes(4);
  });
});
