import {render} from '@testing-library/react';

const SCHEME = 'expo-interface:scheme';
const ACCENT = 'expo-interface:accent';

afterEach(() => {
  localStorage.clear();
  const root = document.documentElement;
  delete root.dataset.theme;
  root.removeAttribute('style');
  vi.unstubAllGlobals();
});

describe('a scheme an earlier visit forced (web)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is back when the kit loads, before anything renders, in the order the index loads the theme', async () => {
    localStorage.setItem(SCHEME, 'dark');
    const theme = await import('./theme');
    const {getColorSchemeMode} = await import('./scheme');
    expect(getColorSchemeMode()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--color-background')).toBe(theme.colors.dark.background);
    expect(theme.resolvedPalette().background).toBe(theme.colors.dark.background);
  });

  it('is passed over when it is not a scheme, when there is no storage, or when the storage throws', async () => {
    const {getColorSchemeMode, restoreColorScheme} = await import('./scheme');
    localStorage.setItem(SCHEME, 'sepia');
    restoreColorScheme();
    expect(getColorSchemeMode()).toBe('system');
    vi.stubGlobal('localStorage', undefined);
    restoreColorScheme();
    vi.unstubAllGlobals();
    expect(getColorSchemeMode()).toBe('system');
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    restoreColorScheme();
    getItem.mockRestore();
    expect(getColorSchemeMode()).toBe('system');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('is read from the storage key the app saves it under', async () => {
    const {getColorSchemeMode, restoreColorScheme, setColorScheme} = await import('./scheme');
    localStorage.setItem('my-scheme', 'light');
    restoreColorScheme('my-scheme');
    expect(getColorSchemeMode()).toBe('light');
    setColorScheme('system', 'my-scheme');
  });
});

describe('getThemeBootScript with a saved accent (web)', () => {
  async function boot() {
    const {getThemeBootScript} = await import('./scheme');
    // eslint-disable-next-line no-new-func -- the boot script is meant to run as inline HTML.
    new Function(getThemeBootScript())();
  }
  const variable = (name: string) => document.documentElement.style.getPropertyValue(name);

  it('applies the tint of a forced scheme, with the color drawn on it', async () => {
    localStorage.setItem(ACCENT, JSON.stringify({light: '#0040DD', dark: '#FFD60A'}));
    localStorage.setItem(SCHEME, 'dark');
    await boot();
    expect(variable('--color-tint')).toBe('#FFD60A');
    expect(variable('--color-on-tint')).toBe('#000000');
    localStorage.setItem(SCHEME, 'light');
    await boot();
    expect(variable('--color-tint')).toBe('#0040DD');
    expect(variable('--color-on-tint')).toBe('#FFFFFF');
  });

  it('applies the tint of the scheme the browser reports when none is forced, and reads a short hex', async () => {
    localStorage.setItem(ACCENT, JSON.stringify({light: '#00f', dark: '#ff0'}));
    vi.stubGlobal('matchMedia', (query: string) => ({matches: query === '(prefers-color-scheme: dark)'}));
    await boot();
    expect(variable('--color-tint')).toBe('#ff0');
    expect(variable('--color-on-tint')).toBe('#000000');
    vi.stubGlobal('matchMedia', () => ({matches: false}));
    await boot();
    expect(variable('--color-tint')).toBe('#00f');
    expect(variable('--color-on-tint')).toBe('#FFFFFF');
  });

  it('leaves the tint to the stylesheet with nothing saved, or something that is not an accent', async () => {
    await boot();
    expect(variable('--color-tint')).toBe('');
    localStorage.setItem(ACCENT, JSON.stringify({light: '#0040DD'}));
    await boot();
    expect(variable('--color-tint')).toBe('');
  });
});

describe('useColorScheme in a static export (web)', () => {
  it('hydrates in the light scheme the server rendered, then follows the browser', async () => {
    const {setColorScheme, useColorScheme} = await import('./scheme');
    const {serverScheme} = await import('./scheme-store');
    function Probe() {
      return <div data-scheme={useColorScheme()}/>;
    }
    // What the static export holds: the server has no scheme to read.
    expect(serverScheme()).toBe('light');
    const container = document.createElement('div');
    container.innerHTML = '<div data-scheme="light"></div>';
    document.body.append(container);
    setColorScheme('dark');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const {unmount} = render(<Probe/>, {container, hydrate: true});
    // React does not patch an attribute that differs in hydration; the render after it does.
    expect(container.firstElementChild!.getAttribute('data-scheme')).toBe('dark');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    unmount();
    container.remove();
    setColorScheme('system');
  });
});
