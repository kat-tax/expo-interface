import {TurboModuleRegistry} from 'react-native';
import {createImageModule, ImageRef} from './image';

describe('ExpoImage module (windows)', () => {
  it('answers requireNativeModule callers with the statics, the reference class, no thumbhash and a cache that is not configurable', async () => {
    const loader = {prefetch: vi.fn(async () => true), getCachePath: vi.fn(async () => null)};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsImageLoader' ? loader : null) as never);
    const module = createImageModule();
    expect(module.Image).toBe(ImageRef);
    await expect(module.prefetch(['https://x/a.png'])).resolves.toBe(true);
    expect(loader.prefetch).toHaveBeenCalledWith(['https://x/a.png'], 'memory-disk', null);
    await expect(module.getCachePathAsync('k')).resolves.toBeNull();
    await expect(module.readFromCacheAsync('k')).resolves.toBeNull();
    await expect(module.generateThumbhashAsync()).rejects.toThrow(/generateThumbhashAsync/);
    expect(module.configureCache()).toBeUndefined();
    await expect(module.loadAsync(null as never)).rejects.toThrow(/needs a source with a URI/);
    await expect(module.loadAsync({} as never)).rejects.toThrow(/needs a source with a URI/);
    await expect(module.loadAsync({uri: ''})).rejects.toThrow(/needs a source with a URI/);
  });
});
