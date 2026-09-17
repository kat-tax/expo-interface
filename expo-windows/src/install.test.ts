import {Linking, TurboModuleRegistry} from 'react-native';
import * as runtime from './index';
import {nativeModuleClass, UnavailabilityError} from './modules/base';
import {registeredModules} from './modules/registry';

describe('install (windows)', () => {
  it('installs the expo global where there is none, then the modules, once, keeping React Native\'s fetch', async () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const previous = globalThis.expo;
    const saved = globalThis as {__expoWindowsFetch?: typeof globalThis.fetch};
    try {
      globalThis.expo = undefined as unknown as typeof globalThis.expo;
      delete saved.__expoWindowsFetch;
      await import('./install.windows');
      expect(globalThis.expo).toBeDefined();
      expect(typeof globalThis.expo.NativeModule).toBe('function');
      expect(globalThis.expo.uuidv4).toBe(runtime.uuidv4);
      expect(registeredModules()).toContain('ExpoLinking');
      expect(registeredModules()).toContain('ExponentConstants');
      expect(saved.__expoWindowsFetch).toBe(globalThis.fetch);
      // A fetch already saved — a second install in the same runtime — is kept.
      const marker = vi.fn() as unknown as typeof globalThis.fetch;
      saved.__expoWindowsFetch = marker;
      vi.resetModules();
      await import('./install.windows');
      expect(saved.__expoWindowsFetch).toBe(marker);
    } finally {
      globalThis.expo = previous;
      delete saved.__expoWindowsFetch;
    }
  });

  it('registers the app\'s scheme as a protocol through the library, and shrugs when that fails', async () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    const {TurboModuleRegistry} = await import('react-native');
    const registerProtocol = vi.fn(async () => {
      throw new Error('registration refused');
    });
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name =>
      (name === 'ExpoWindowsLinking' ? {getInitialUrl: async () => '', registerProtocol} : null) as never,
    );
    const saved = process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
    process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = JSON.stringify({name: 'WinKit', scheme: 'winkit'});
    try {
      vi.resetModules();
      await import('./install.windows');
      await Promise.resolve();
      await Promise.resolve();
      expect(registerProtocol).toHaveBeenCalledWith('winkit', 'WinKit');
    } finally {
      if (saved === undefined) delete process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
      else process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = saved;
    }
  });

  it('is nothing on the other platforms, and the package exports the registry', async () => {
    // The platform resolution would take `./install` to the Windows file; the extension pins the plain one.
    const plain = './install' + '.ts';
    expect(Object.keys(await import(/* @vite-ignore */ plain))).toEqual([]);
    expect(typeof runtime.registerModule).toBe('function');
    expect(typeof runtime.registerModules).toBe('function');
    expect(typeof runtime.registeredModules).toBe('function');
    expect(runtime.uuidv4()).toMatch(/-4[0-9a-f]{3}-/);
  });

  it('takes NativeModule from the global, and refuses without one', () => {
    expect(nativeModuleClass()).toBe(globalThis.expo.NativeModule);
    const previous = globalThis.expo;
    try {
      globalThis.expo = undefined as unknown as typeof globalThis.expo;
      expect(() => nativeModuleClass()).toThrow(/install runs first/);
    } finally {
      globalThis.expo = previous;
    }
  });

  it('describes an unavailable method the way Expo Modules Core does', () => {
    const error = new UnavailabilityError('Sharing', 'shareAsync');
    expect(error.name).toBe('UnavailabilityError');
    expect(error.code).toBe('ERR_UNAVAILABLE');
    expect(error.message).toBe(
      "The method or property Sharing.shareAsync is not available on windows, are you sure you've linked all the native dependencies properly?",
    );
  });
});
