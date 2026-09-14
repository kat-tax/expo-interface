import type {ColorValue} from 'react-native';
import {renderHook} from '@testing-library/react-native';
import {colors, fonts, getPlatformToken, inset, theme, useColor, usePalette, variants} from './theme';

describe('theme (windows)', () => {
  it('resolves the tokens with a Fluent twin to platform colors', () => {
    for (const token of ['label', 'secondaryLabel', 'tertiaryLabel', 'background', 'backgroundElement', 'backgroundSelected', 'separator', 'pillBackground', 'segmentSelected', 'switchTrack'] as const) {
      expect(typeof theme[token]).toBe('object');
    }
  });

  it('keeps the literal for the tokens without one', () => {
    expect(theme.tint).toBe(colors.light.tint);
    expect(theme.onTint).toBe(colors.light.onTint);
    expect(theme.switchOn).toBe(colors.light.switchOn);
    expect(theme.destructive).toBe(colors.light.destructive);
    expect(theme.onDestructive).toBe(colors.light.onDestructive);
  });

  it('takes the windows entry of a token, or its default', () => {
    const specifics = {default: '#111111', ios: () => '#222222' as ColorValue, android: '#333333', web: '#444444'};
    expect(getPlatformToken(specifics)).toBe('#111111');
    expect(getPlatformToken({...specifics, windows: () => '#555555' as ColorValue})).toBe('#555555');
  });

  it('uses the Fluent type ramp and faces, with no bar inset', () => {
    expect(fonts).toEqual({sans: 'Segoe UI Variable Text', serif: 'Cambria', mono: 'Cascadia Mono', rounded: 'Segoe UI Variable Text'});
    expect(variants.body).toEqual({fontSize: 14, fontWeight: 'normal', lineHeight: 20});
    expect(variants.largeTitle.fontSize).toBe(40);
    expect(inset.topBar).toBe(0);
    expect(inset.bottomTab).toBe(0);
  });

  it('answers the palette as plain colors', async () => {
    const {result} = await renderHook(() => [useColor('label'), useColor('tint'), usePalette().background]);
    expect(result.current).toEqual([colors.light.label, colors.light.tint, colors.light.background]);
  });
});
