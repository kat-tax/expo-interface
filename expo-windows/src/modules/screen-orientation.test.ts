import {Dimensions} from 'react-native';
import {createScreenOrientationModule, LANDSCAPE_LEFT, LOCK_ALL, LOCK_DEFAULT, orientationOf, PORTRAIT_UP} from './screen-orientation';

type Listener = (event: {window: {width: number; height: number}}) => void;

/** A window of the size, and a hand on its resize listener. */
function window(width: number, height: number) {
  vi.spyOn(Dimensions, 'get').mockReturnValue({width, height, scale: 1, fontScale: 1});
  const listeners: Listener[] = [];
  const remove = vi.fn();
  vi.spyOn(Dimensions, 'addEventListener').mockImplementation((_type, listener) => {
    listeners.push(listener as Listener);
    return {remove} as never;
  });
  return {resize: (w: number, h: number) => listeners.forEach(listener => listener({window: {width: w, height: h}})), listeners, remove};
}

describe('ExpoScreenOrientation (windows)', () => {
  it('reads the orientation from the window\'s shape', async () => {
    expect(orientationOf({width: 1024, height: 768})).toBe(LANDSCAPE_LEFT);
    expect(orientationOf({width: 500, height: 800})).toBe(PORTRAIT_UP);
    expect(orientationOf({width: 600, height: 600})).toBe(LANDSCAPE_LEFT);
    window(1024, 768);
    const module = createScreenOrientationModule();
    await expect(module.getOrientationAsync()).resolves.toBe(LANDSCAPE_LEFT);
    await expect(module.getOrientationLockAsync()).resolves.toBe(LOCK_DEFAULT);
    await expect(module.getPlatformOrientationLockAsync()).resolves.toBe(LOCK_DEFAULT);
  });

  it('takes the locks that constrain nothing and refuses the rest with the package\'s code', async () => {
    window(1024, 768);
    const module = createScreenOrientationModule();
    await expect(module.supportsOrientationLockAsync(LOCK_DEFAULT)).resolves.toBe(true);
    await expect(module.supportsOrientationLockAsync(LOCK_ALL)).resolves.toBe(true);
    await expect(module.supportsOrientationLockAsync(5)).resolves.toBe(false);
    await module.lockAsync(LOCK_ALL);
    await expect(module.getOrientationLockAsync()).resolves.toBe(LOCK_ALL);
    await module.lockPlatformAsync(LOCK_DEFAULT);
    await expect(module.getPlatformOrientationLockAsync()).resolves.toBe(LOCK_DEFAULT);
    await expect(module.lockAsync(5)).rejects.toMatchObject({code: 'ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK'});
    await expect(module.lockPlatformAsync(6)).rejects.toThrow(/cannot be locked/);
  });

  it('reports a resize that changes the shape as the dimensions event, while observed', () => {
    const {resize, listeners, remove} = window(1024, 768);
    // Expo Modules Core's emitter calls `startObserving` with the first listener and `stopObserving` after the last.
    const module = createScreenOrientationModule() as ReturnType<typeof createScreenOrientationModule> & {startObserving(): void; stopObserving(): void};
    const listener = vi.fn();
    module.addListener('expoDidUpdateDimensions', listener);
    module.startObserving();
    expect(listeners).toHaveLength(1);
    module.startObserving(); // a second start subscribes nothing more
    expect(listeners).toHaveLength(1);
    resize(1200, 700); // still landscape: nothing to report
    expect(listener).not.toHaveBeenCalled();
    resize(500, 900);
    expect(listener).toHaveBeenCalledWith({orientationLock: LOCK_DEFAULT, orientationInfo: {orientation: PORTRAIT_UP}});
    module.stopObserving();
    expect(remove).toHaveBeenCalledTimes(1);
    module.stopObserving(); // nothing left to remove
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
