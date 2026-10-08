import {Platform} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {ACCENT_SEED, ACCENT_STORAGE_KEY, AccentProvider, currentAccent, onAccent, resolveAccent, useAccentSeed} from './accent';
import {contrastRatio} from './legible';
import {colors} from './palette';
import {setColorScheme} from './scheme';

const isWeb = Platform.OS === 'web';

/** Changes the scheme the way the platform would (see `scheme.test.tsx`). */
async function changeScheme(scheme: 'light' | 'dark' | 'system') {
  if (isWeb) {
    setColorScheme(scheme);
    return;
  }
  const {setColorScheme: setNative} = await import('vitest-native/helpers');
  setNative(scheme === 'system' ? 'light' : scheme);
}

describe('onAccent', () => {
  it('picks white text on dark seeds and black on light ones', () => {
    expect(onAccent('#007AFF')).toBe('#FFFFFF');
    expect(onAccent('#000000')).toBe('#FFFFFF');
    expect(onAccent('#FFFFFF')).toBe('#000000');
    expect(onAccent('#FFD60A')).toBe('#000000');
  });

  it('expands 3-digit hex', () => {
    expect(onAccent('#fff')).toBe(onAccent('#ffffff'));
    expect(onAccent('#000')).toBe(onAccent('#000000'));
  });

  it('falls back to white for unparseable input', () => {
    expect(onAccent('not-a-color')).toBe('#FFFFFF');
  });
});

describe('AccentProvider', () => {
  it('provides the default seed when none is given', async () => {
    const {result} = await renderHook(() => useAccentSeed());
    expect(result.current).toBe(ACCENT_SEED);
  });

  it('provides a user-supplied seed', async () => {
    const {result} = await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA">{children}</AccentProvider>,
    });
    expect(result.current).toBe('#8959EA');
  });

  const web = Platform.OS === 'web' ? it : it.skip;

  web('mirrors a custom seed to CSS custom properties on web', async () => {
    const root = document.documentElement;
    const {unmount} = await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA">{children}</AccentProvider>,
    });
    expect(root.style.getPropertyValue('--color-tint')).toBe('#8959EA');
    expect(root.style.getPropertyValue('--color-on-tint')).toBe(onAccent('#8959EA'));
    await unmount();
  });

  web('clears the overrides for the default seed on web', async () => {
    const root = document.documentElement;
    root.style.setProperty('--color-tint', '#123456');
    root.style.setProperty('--color-on-tint', '#123456');
    await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider>{children}</AccentProvider>,
    });
    expect(root.style.getPropertyValue('--color-tint')).toBe('');
    expect(root.style.getPropertyValue('--color-on-tint')).toBe('');
  });
});

describe('resolveAccent', () => {
  it('uses one seed for both schemes, or one for each, with the color drawn on each', () => {
    expect(resolveAccent('#8959EA')).toEqual({light: '#8959EA', dark: '#8959EA', onLight: '#FFFFFF', onDark: '#FFFFFF'});
    expect(resolveAccent({light: '#0040DD', dark: '#FFD60A'})).toEqual({light: '#0040DD', dark: '#FFD60A', onLight: '#FFFFFF', onDark: '#000000'});
  });

  it('makes a seed legible on the backgrounds of a scheme where it falls short, and keeps it where it does not', () => {
    // systemBlue is 4.0:1 on white, 5.2:1 on black, 3.5:1 on the light raised fill and 4.0:1 on the dark one.
    const accent = resolveAccent(ACCENT_SEED, 4.5);
    expect(accent.light).not.toBe(ACCENT_SEED);
    expect(contrastRatio(accent.light, colors.light.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(accent.light, colors.light.backgroundElement)).toBeGreaterThanOrEqual(4.5);
    expect(accent.dark).not.toBe(ACCENT_SEED);
    expect(contrastRatio(accent.dark, colors.dark.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(accent.dark, colors.dark.backgroundElement)).toBeGreaterThanOrEqual(4.5);
    // Navy is 8.7:1 on the light raised fill, so the light scheme keeps it.
    const navy = resolveAccent({light: '#1C3D8F', dark: '#1C3D8F'}, 4.5);
    expect(navy.light).toBe('#1C3D8F');
    expect(contrastRatio(navy.dark, colors.dark.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(navy.dark, colors.dark.backgroundElement)).toBeGreaterThanOrEqual(4.5);
    expect(navy.onDark).toBe(onAccent(navy.dark));
  });

  it('measures the tint against the raised background as well as the screen', () => {
    // On black alone #1a56db would be #376DE7, which is 3.4:1 on the dark raised fill.
    const accent = resolveAccent('#1a56db', 4.5);
    expect(accent).toEqual({light: '#1a56db', dark: '#5785EB', onLight: onAccent('#1a56db'), onDark: onAccent('#5785EB')});
    expect(contrastRatio(accent.dark, colors.dark.backgroundElement)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(accent.light, colors.light.backgroundElement)).toBeGreaterThanOrEqual(4.5);
  });
});

describe(`AccentProvider per scheme (${Platform.OS})`, () => {
  afterEach(async () => {
    await act(async () => changeScheme('system'));
  });

  it('hands out the seed of the scheme the app is drawn in', async () => {
    const {result} = await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed={{light: '#0040DD', dark: '#FFD60A'}}>{children}</AccentProvider>,
    });
    expect(result.current).toBe('#0040DD');
    await act(async () => changeScheme('dark'));
    expect(result.current).toBe('#FFD60A');
  });

  it('hands out the legible tint, and keeps the accent for code outside React', async () => {
    const {result} = await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider minContrast={4.5}>{children}</AccentProvider>,
    });
    expect(result.current).toBe(resolveAccent(ACCENT_SEED, 4.5).light);
    expect(currentAccent()).toEqual(resolveAccent(ACCENT_SEED, 4.5));
  });

  if (!isWeb) return;
  const root = () => document.documentElement;

  it('mirrors the tint of the scheme to the CSS custom properties', async () => {
    await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed={{light: '#0040DD', dark: '#FFD60A'}}>{children}</AccentProvider>,
    });
    expect(root().style.getPropertyValue('--color-tint')).toBe('#0040DD');
    expect(root().style.getPropertyValue('--color-on-tint')).toBe('#FFFFFF');
    await act(async () => changeScheme('dark'));
    expect(root().style.getPropertyValue('--color-tint')).toBe('#FFD60A');
    expect(root().style.getPropertyValue('--color-on-tint')).toBe('#000000');
  });

  it('keeps a custom accent in the browser storage, and forgets it for the default', async () => {
    const {unmount} = await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA">{children}</AccentProvider>,
    });
    expect(JSON.parse(localStorage.getItem(ACCENT_STORAGE_KEY)!)).toEqual({light: '#8959EA', dark: '#8959EA'});
    await unmount();
    await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider>{children}</AccentProvider>,
    });
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBeNull();
  });

  it('leaves the storage alone when asked not to keep the accent', async () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, 'theirs');
    await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA" persist={false}>{children}</AccentProvider>,
    });
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('theirs');
    expect(root().style.getPropertyValue('--color-tint')).toBe('#8959EA');
    localStorage.removeItem(ACCENT_STORAGE_KEY);
  });

  it('still applies the accent when the storage throws', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed="#34C759">{children}</AccentProvider>,
    });
    expect(root().style.getPropertyValue('--color-tint')).toBe('#34C759');
    setItem.mockRestore();
  });
});
