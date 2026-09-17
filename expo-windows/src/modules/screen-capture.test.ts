import {TurboModuleRegistry} from 'react-native';
import {DENIED} from './permissions';
import {createScreenCaptureModule} from './screen-capture';

describe('ExpoScreenCapture (windows)', () => {
  it('keeps the window out of captures and lets it back in through the window library', async () => {
    const window = {setCaptureExcluded: vi.fn(async () => true)};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsWindow' ? window : null) as never);
    const module = createScreenCaptureModule();
    await expect(module.preventScreenCapture?.()).resolves.toBeUndefined();
    await expect(module.allowScreenCapture?.()).resolves.toBeUndefined();
    expect(window.setCaptureExcluded.mock.calls).toEqual([[true], [false]]);
    await expect(module.getPermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.requestPermissionsAsync()).resolves.toBe(DENIED);
    expect(module).not.toHaveProperty('enableAppSwitcherProtection');
  });

  it('is absent, as the package reads availability, without the library', () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createScreenCaptureModule();
    expect(module.preventScreenCapture).toBeUndefined();
    expect(module.allowScreenCapture).toBeUndefined();
  });
});
