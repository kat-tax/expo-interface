import type {ColorValue} from 'react-native';
import {colors, getPlatformToken, theme} from './theme';

// On a platform that is neither iOS, Android nor web, `getPlatformToken`
// falls through to each token's `default` value. Mocking `Platform.OS` on
// the web alias is the only way to reach that path in the suite.
vi.mock('react-native', async importOriginal => {
  const rn = await importOriginal<typeof import('react-native')>();
  return {...rn, Platform: {...rn.Platform, OS: 'windows'}};
});

describe('theme on other platforms', () => {
  it('falls back to the default token values', () => {
    const token = getPlatformToken({
      default: '#111111',
      ios: () => '#222222' as ColorValue,
      android: '#333333',
      web: '#444444',
    });
    expect(token).toBe('#111111');
    expect(theme.label).toBe(colors.light.label);
    expect(theme.tint).toBe(colors.light.tint);
    expect(theme.onDestructive).toBe(colors.light.onDestructive);
  });
});
