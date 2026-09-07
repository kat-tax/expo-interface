import {Appearance, Platform} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {colors} from './theme';
import {
  SCHEME_STORAGE_KEY,
  getColorSchemeMode,
  getThemeBootScript,
  setColorScheme,
  useColorScheme,
} from './scheme';

const isWeb = Platform.OS === 'web';

/**
 * Changes the scheme the way the platform would: on web the kit's own
 * `setColorScheme` (which patches `Appearance`); natively the test harness's
 * helper, which drives the native appearance module and its change event
 * (the real `Appearance.setColorScheme` only asks the native side to).
 */
async function changeScheme(scheme: 'light' | 'dark' | 'system') {
  if (isWeb) {
    setColorScheme(scheme);
    return;
  }
  const {setColorScheme: setNative} = await import('vitest-native/helpers');
  setNative(scheme === 'system' ? 'light' : scheme);
}

describe(`useColorScheme (${Platform.OS})`, () => {
  afterEach(async () => {
    await act(async () => changeScheme('system'));
  });

  it('answers light by default and follows the scheme', async () => {
    const {result} = await renderHook(() => useColorScheme());
    expect(result.current).toBe('light');
    await act(async () => changeScheme('dark'));
    expect(result.current).toBe('dark');
    await act(async () => changeScheme('light'));
    expect(result.current).toBe('light');
  });

  it('subscribes once and unsubscribes on unmount', async () => {
    const add = vi.spyOn(Appearance, 'addChangeListener');
    const {result, rerender, unmount} = await renderHook(() => useColorScheme());
    const calls = add.mock.calls.length;
    await rerender({});
    expect(add).toHaveBeenCalledTimes(calls);
    await unmount();
    await act(async () => changeScheme('dark'));
    expect(result.current).toBe('light');
    add.mockRestore();
  });
});

describe(`setColorScheme (${Platform.OS})`, () => {
  afterEach(() => {
    setColorScheme('system');
  });

  if (isWeb) {
    const root = document.documentElement;

    it('writes the forced palette, color-scheme and data-theme on the root element and remembers the choice', () => {
      setColorScheme('dark');
      expect(root.dataset.theme).toBe('dark');
      expect(root.style.colorScheme).toBe('dark');
      expect(root.style.getPropertyValue('--color-background')).toBe(colors.dark.background);
      expect(root.style.getPropertyValue('--color-label')).toBe(colors.dark.label);
      // The accent is left to `AccentProvider`.
      expect(root.style.getPropertyValue('--color-tint')).toBe('');
      expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe('dark');
      expect(Appearance.getColorScheme()).toBe('dark');
      expect(getColorSchemeMode()).toBe('dark');
    });

    it('clears everything when following the system again', () => {
      setColorScheme('light');
      setColorScheme('system');
      expect(root.dataset.theme).toBeUndefined();
      expect(root.style.colorScheme).toBe('');
      expect(root.style.getPropertyValue('--color-background')).toBe('');
      expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBeNull();
      expect(getColorSchemeMode()).toBe('system');
    });

    it('uses a custom storage key', () => {
      setColorScheme('light', 'my-scheme');
      expect(localStorage.getItem('my-scheme')).toBe('light');
      setColorScheme('system', 'my-scheme');
      expect(localStorage.getItem('my-scheme')).toBeNull();
    });

    it('tells Appearance listeners about a forced change, and only while following the system about a system one', () => {
      const listener = vi.fn();
      const subscription = Appearance.addChangeListener(listener);
      setColorScheme('dark');
      expect(listener).toHaveBeenLastCalledWith({colorScheme: 'dark'});
      setColorScheme('system');
      expect(listener).toHaveBeenLastCalledWith({colorScheme: 'light'});
      subscription.remove();
      setColorScheme('dark');
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('survives storage that throws', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      expect(() => setColorScheme('dark')).not.toThrow();
      expect(root.dataset.theme).toBe('dark');
      setItem.mockRestore();
    });

    it('applies without a document (the server render)', () => {
      const original = globalThis.document;
      vi.stubGlobal('document', undefined);
      try {
        expect(() => setColorScheme('dark')).not.toThrow();
        expect(getColorSchemeMode()).toBe('dark');
      } finally {
        vi.stubGlobal('document', original);
      }
    });
  } else {
    it('forwards to Appearance.setColorScheme, unspecified for the system', () => {
      const set = vi.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
      try {
        setColorScheme('dark');
        expect(set).toHaveBeenLastCalledWith('dark');
        setColorScheme('system');
        expect(set).toHaveBeenLastCalledWith('unspecified');
        // Natively the forced scheme is Appearance's own.
        expect(getColorSchemeMode()).toBe('system');
      } finally {
        set.mockRestore();
      }
    });
  }
});

describe('getThemeBootScript', () => {
  it('reads the saved scheme from localStorage before the bundle runs', () => {
    const script = getThemeBootScript();
    expect(script).toContain(`localStorage.getItem(${JSON.stringify(SCHEME_STORAGE_KEY)})`);
    expect(script).toContain('dataset.theme');
    expect(script).toContain('style.colorScheme');
    expect(getThemeBootScript('my-scheme')).toContain('localStorage.getItem("my-scheme")');
  });

  (isWeb ? it : it.skip)('applies a saved scheme to the root element when run', () => {
    localStorage.setItem(SCHEME_STORAGE_KEY, 'dark');
    // eslint-disable-next-line no-new-func -- the boot script is meant to run as inline HTML.
    new Function(getThemeBootScript())();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    localStorage.removeItem(SCHEME_STORAGE_KEY);
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = '';
  });
});
