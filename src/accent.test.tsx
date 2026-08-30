import {Platform} from 'react-native';
import {renderHook} from '@testing-library/react-native';
import {ACCENT_SEED, AccentProvider, onAccent, useAccentSeed} from './accent';

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
