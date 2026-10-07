import {Platform} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {ACCENT_SEED, AccentProvider, onAccent, useAccentSeed} from './accent';
import {setColorScheme} from './scheme';
import {colors, isColorToken, resolvedPalette} from './theme';

/** Changes the scheme the way the platform would (see `scheme.test.tsx`). */
async function changeScheme(scheme: 'light' | 'dark' | 'system') {
  if (Platform.OS === 'web') {
    setColorScheme(scheme);
    return;
  }
  const {setColorScheme: setNative} = await import('vitest-native/helpers');
  setNative(scheme === 'system' ? 'light' : scheme);
}

describe(`resolvedPalette (${Platform.OS})`, () => {
  it('is the palette of the scheme with the default accent before any provider', () => {
    expect(resolvedPalette()).toEqual({...colors.light, tint: ACCENT_SEED, onTint: onAccent(ACCENT_SEED)});
  });

  it('follows the scheme and the accent the app last provided, outside React', async () => {
    await renderHook(() => useAccentSeed(), {
      wrapper: ({children}) => <AccentProvider seed={{light: '#0040DD', dark: '#FFD60A'}}>{children}</AccentProvider>,
    });
    expect(resolvedPalette()).toMatchObject({background: colors.light.background, tint: '#0040DD', onTint: '#FFFFFF'});
    await act(async () => changeScheme('dark'));
    expect(resolvedPalette()).toMatchObject({background: colors.dark.background, tint: '#FFD60A', onTint: '#000000'});
    await act(async () => changeScheme('system'));
  });
});

describe('isColorToken', () => {
  it('tells a palette token from a color', () => {
    expect(isColorToken('opaqueSeparator')).toBe(true);
    expect(isColorToken('tint')).toBe(true);
    expect(isColorToken('#C6C6C8')).toBe(false);
    expect(isColorToken('toString')).toBe(false);
  });
});
