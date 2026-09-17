import {TurboModuleRegistry} from 'react-native';
import {createFontLoaderModule} from './font-loader';

// Without the runtime's Windows library: the harness's registry would otherwise answer with a stand-in.
beforeEach(() => {
  vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
});

describe('ExpoFontLoader (windows)', () => {
  it('keeps the families an app loads and reports them loaded', async () => {
    const loader = createFontLoaderModule();
    expect(loader.getLoadedFonts()).toEqual([]);
    expect(loader.isLoaded('Inter')).toBe(false);
    await loader.loadAsync('Inter', 'https://localhost:8081/assets/Inter.ttf');
    await loader.loadAsync('Segoe Fluent Icons', {uri: 'file://x'});
    expect(loader.getLoadedFonts()).toEqual(['Inter', 'Segoe Fluent Icons']);
    expect(loader.isLoaded('Inter')).toBe(true);
    await loader.unloadAsync('Inter');
    expect(loader.isLoaded('Inter')).toBe(false);
    await loader.unloadAllAsync();
    expect(loader.getLoadedFonts()).toEqual([]);
  });
});
