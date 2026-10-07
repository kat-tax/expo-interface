const KEY = 'expo-interface:accent';

describe('the accent an earlier visit saved (web)', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is the accent before any provider mounts, for the palette outside React', async () => {
    localStorage.setItem(KEY, JSON.stringify({light: '#0040DD', dark: '#FFD60A'}));
    const {currentAccent} = await import('./accent');
    const {resolvedPalette} = await import('./theme');
    expect(currentAccent()).toEqual({light: '#0040DD', dark: '#FFD60A', onLight: '#FFFFFF', onDark: '#000000'});
    expect(resolvedPalette().tint).toBe('#0040DD');
  });

  it('is the default with nothing saved, something that is not an accent, or no storage', async () => {
    for (const saved of [null, 'not json', JSON.stringify({light: 1, dark: '#000'}), JSON.stringify({light: '#000'})]) {
      vi.resetModules();
      if (saved == null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, saved);
      const {ACCENT_SEED, currentAccent} = await import('./accent');
      expect(currentAccent().light).toBe(ACCENT_SEED);
    }
    vi.resetModules();
    vi.stubGlobal('localStorage', undefined);
    const {ACCENT_SEED, currentAccent} = await import('./accent');
    expect(currentAccent().dark).toBe(ACCENT_SEED);
  });
});
