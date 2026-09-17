import {DeviceEventEmitter, Linking, TurboModuleRegistry} from 'react-native';
import {native} from '../native';
import {ExpoDevice} from './device';
import {createFontLoaderModule} from './font-loader';
import {createLinkingModule, registerAppProtocol} from './linking';
import {ExpoSharing} from './sharing';
import {ExpoWindows} from './window';

/** The runtime's TurboModules as the test wants them, by name; anything else absent. */
function withNative(modules: Record<string, object>) {
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (modules[name] ?? null) as never);
}

describe('the runtime\'s TurboModules (windows)', () => {
  it('are asked for by name at the time of use, and null without the library', () => {
    withNative({});
    expect(native.window()).toBeNull();
    expect(native.device()).toBeNull();
    expect(native.clipboard()).toBeNull();
    expect(native.sharing()).toBeNull();
    expect(native.linking()).toBeNull();
    expect(native.fonts()).toBeNull();
    expect(native.accessibility()).toBeNull();
  });
});

describe('ExpoWindows high contrast (windows)', () => {
  it('reads the setting and the system colours through the library, and reports it off without it', async () => {
    const state = {
      enabled: true,
      scheme: 'High Contrast Black',
      colors: {
        background: '#000000',
        text: '#FFFFFF',
        highlight: '#1AEBFF',
        highlightText: '#000000',
        buttonFace: '#000000',
        buttonText: '#FFFFFF',
        link: '#FFFF00',
        disabledText: '#3FF23F',
      },
    };
    withNative({ExpoWindowsAccessibility: {getHighContrast: async () => state}});
    await expect(ExpoWindows.getHighContrastAsync()).resolves.toEqual(state);
    withNative({});
    const off = await ExpoWindows.getHighContrastAsync();
    expect(off.enabled).toBe(false);
    expect(off.scheme).toBe('');
    expect(off.colors.background).toBe('');
  });

  it('tells a listener when the library reports a change, until it is removed', () => {
    const listener = vi.fn();
    const subscription = ExpoWindows.addHighContrastListener(listener);
    DeviceEventEmitter.emit('onHighContrastChanged', {enabled: false, scheme: '', colors: {}});
    expect(listener).toHaveBeenCalledWith({enabled: false, scheme: '', colors: {}});
    subscription.remove();
    DeviceEventEmitter.emit('onHighContrastChanged', {enabled: true, scheme: 'High Contrast #1', colors: {}});
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('ExpoWindows (windows)', () => {
  it('sets and reads the window title through the library, and is quiet without it', async () => {
    const setTitle = vi.fn();
    withNative({ExpoWindowsWindow: {setTitle, getTitle: async () => 'Drops – Files'}});
    ExpoWindows.setWindowTitle('Drops – Files');
    expect(setTitle).toHaveBeenCalledWith('Drops – Files');
    await expect(ExpoWindows.getWindowTitleAsync()).resolves.toBe('Drops – Files');
    withNative({});
    expect(() => ExpoWindows.setWindowTitle('x')).not.toThrow();
    await expect(ExpoWindows.getWindowTitleAsync()).resolves.toBe('');
  });

  it('extends the content into the title bar, reports the insets, sets the drag region and the background through the library', async () => {
    const library = {
      setChrome: vi.fn(async () => true),
      getTitleBarInsets: vi.fn(async () => ({left: 0, right: 138, height: 32})),
      setDragRegion: vi.fn(),
      setBackground: vi.fn(),
    };
    withNative({ExpoWindowsWindow: library});
    await expect(ExpoWindows.setWindowChromeAsync({extend: true, theme: 'dark'})).resolves.toBe(true);
    expect(library.setChrome).toHaveBeenCalledWith(true, 'dark');
    await ExpoWindows.setWindowChromeAsync({extend: false});
    expect(library.setChrome).toHaveBeenLastCalledWith(false, 'light');
    await expect(ExpoWindows.getTitleBarInsetsAsync()).resolves.toEqual({left: 0, right: 138, height: 32});
    ExpoWindows.setDragRegion({x: 1, y: 2, width: 300, height: 48});
    expect(library.setDragRegion).toHaveBeenCalledWith(1, 2, 300, 48);
    ExpoWindows.setWindowBackground('#202020');
    ExpoWindows.setWindowBackground(null);
    expect(library.setBackground).toHaveBeenNthCalledWith(1, '#202020');
    expect(library.setBackground).toHaveBeenNthCalledWith(2, '');
    // `expo-system-ui` paints the window through the same call.
    const {ExpoSystemUI} = await import('./system-ui');
    await ExpoSystemUI.setBackgroundColorAsync('#101010');
    expect(library.setBackground).toHaveBeenLastCalledWith('#101010');
    // Without the library the chrome is not taken, and the insets are nothing.
    withNative({});
    await expect(ExpoWindows.setWindowChromeAsync({extend: true})).resolves.toBe(false);
    await expect(ExpoWindows.getTitleBarInsetsAsync()).resolves.toEqual({left: 0, right: 0, height: 0});
    expect(() => ExpoWindows.setDragRegion({x: 0, y: 0, width: 0, height: 0})).not.toThrow();
    expect(() => ExpoWindows.setWindowBackground('#000')).not.toThrow();
  });
});

describe('ExpoDevice with the library (windows)', () => {
  it('reports the machine from the library\'s constants, and the uptime', async () => {
    withNative({
      ExpoWindowsDevice: {
        getConstants: () => ({
          deviceName: 'DESKTOP-1',
          manufacturer: 'Framework',
          brand: 'Framework',
          modelName: 'Laptop 13',
          productName: 'Laptop 13',
          modelId: 'FRANDACP',
          designName: 'A7',
          osVersion: '10.0.22631',
          osBuildId: '22631.4317',
          totalMemory: 34359738368,
          supportedCpuArchitectures: ['x64'],
        }),
        getUptime: async () => 123456,
      },
    });
    expect(ExpoDevice).toMatchObject({
      deviceName: 'DESKTOP-1',
      manufacturer: 'Framework',
      brand: 'Framework',
      modelName: 'Laptop 13',
      productName: 'Laptop 13',
      modelId: 'FRANDACP',
      designName: 'A7',
      osVersion: '10.0.22631',
      osBuildId: '22631.4317',
      osInternalBuildId: '22631.4317',
      totalMemory: 34359738368,
      supportedCpuArchitectures: ['x64'],
      osName: 'Windows',
      deviceType: 3,
    });
    await expect(ExpoDevice.getUptimeAsync()).resolves.toBe(123456);
    // A library that answers with nothing leaves the fields null, and the version to react-native-windows.
    withNative({ExpoWindowsDevice: {getConstants: () => ({}), getUptime: async () => 1}});
    for (const field of ['brand', 'manufacturer', 'modelName', 'modelId', 'designName', 'productName', 'totalMemory', 'supportedCpuArchitectures', 'osBuildId', 'osInternalBuildId', 'deviceName'] as const) {
      expect(ExpoDevice[field]).toBeNull();
    }
    expect(typeof ExpoDevice.osVersion).toBe('string');
  });
});

describe('ExpoSharing with the library (windows)', () => {
  it('opens the share sheet with the file and the dialog title', async () => {
    const share = vi.fn(async () => {});
    withNative({ExpoWindowsSharing: {isAvailable: async () => true, share}});
    await expect(ExpoSharing.isAvailableAsync()).resolves.toBe(true);
    await ExpoSharing.shareAsync('file:///C:/drops/a.txt', {dialogTitle: 'Send the drop'});
    await ExpoSharing.shareAsync('file:///C:/drops/b.txt');
    expect(share).toHaveBeenNthCalledWith(1, 'file:///C:/drops/a.txt', 'Send the drop');
    expect(share).toHaveBeenNthCalledWith(2, 'file:///C:/drops/b.txt', '');
  });
});

describe('ExpoFontLoader with the library (windows)', () => {
  it('registers the file with the process by family, from a string or an asset, and unloads it', async () => {
    const load = vi.fn(async () => {});
    const unload = vi.fn(async () => {});
    withNative({ExpoWindowsFonts: {load, unload}});
    const loader = createFontLoaderModule();
    await loader.loadAsync('Inter', 'http://localhost:8081/assets/Inter.ttf');
    await loader.loadAsync('Lora', {uri: 'file:///C:/fonts/Lora.ttf'});
    await loader.loadAsync('Nowhere', {});
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenNthCalledWith(1, 'Inter', 'http://localhost:8081/assets/Inter.ttf');
    expect(load).toHaveBeenNthCalledWith(2, 'Lora', 'file:///C:/fonts/Lora.ttf');
    expect(loader.getLoadedFonts()).toEqual(['Inter', 'Lora', 'Nowhere']);
    await loader.unloadAsync('Inter');
    await loader.unloadAsync('Inter');
    expect(unload).toHaveBeenCalledTimes(1);
    await loader.unloadAllAsync();
    expect(unload).toHaveBeenCalledTimes(3);
    expect(loader.getLoadedFonts()).toEqual([]);
  });

  it('lets a failed load reject, as the package promises', async () => {
    withNative({ExpoWindowsFonts: {load: async () => { throw new Error('The font file could not be loaded.'); }, unload: async () => {}}});
    const loader = createFontLoaderModule();
    await expect(loader.loadAsync('Broken', 'file:///C:/x.ttf')).rejects.toThrow(/could not be loaded/);
    expect(loader.isLoaded('Broken')).toBe(false);
  });
});

describe('ExpoLinking with the library (windows)', () => {
  it('takes the launch URL from the library first, then from React Native', async () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue('winkit://from-react-native');
    withNative({ExpoWindowsLinking: {getInitialUrl: async () => 'winkit://from-the-library', registerProtocol: async () => {}}});
    const fromLibrary = createLinkingModule();
    await vi.waitFor(() => expect(fromLibrary.getLinkingURL()).toBe('winkit://from-the-library'));
    withNative({ExpoWindowsLinking: {getInitialUrl: async () => '', registerProtocol: async () => {}}});
    const fromReactNative = createLinkingModule();
    await vi.waitFor(() => expect(fromReactNative.getLinkingURL()).toBe('winkit://from-react-native'));
  });

  it('registers the app\'s scheme as a protocol, named after the app, only with the library and a scheme', async () => {
    const registerProtocol = vi.fn(async () => {});
    const saved = process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
    try {
      withNative({ExpoWindowsLinking: {getInitialUrl: async () => '', registerProtocol}});
      process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = JSON.stringify({name: 'WinKit', scheme: ['winkit', 'wk']});
      await expect(registerAppProtocol()).resolves.toBe(true);
      expect(registerProtocol).toHaveBeenCalledWith('winkit', 'WinKit');
      process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = JSON.stringify({scheme: 'wk'});
      await expect(registerAppProtocol()).resolves.toBe(true);
      expect(registerProtocol).toHaveBeenLastCalledWith('wk', 'wk');
      process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = JSON.stringify({name: 'No scheme'});
      await expect(registerAppProtocol()).resolves.toBe(false);
      withNative({});
      process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = JSON.stringify({scheme: 'wk'});
      await expect(registerAppProtocol()).resolves.toBe(false);
      expect(registerProtocol).toHaveBeenCalledTimes(2);
    } finally {
      if (saved === undefined) delete process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
      else process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = saved;
    }
  });
});
