import {contrastRatio, legibleTint, luminance, parseHex} from './legible';

describe('parseHex', () => {
  it('reads three, six and eight digits, with or without the hash, and nothing else', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('007AFF')).toEqual([0, 122, 255]);
    expect(parseHex('#007AFF80')).toEqual([0, 122, 255]);
    expect(parseHex('rgb(0, 0, 0)')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
  });
});

describe('contrast', () => {
  it('measures luminance and the ratio as WCAG does', () => {
    expect(luminance('#ffffff')).toBe(1);
    expect(luminance('#000000')).toBe(0);
    expect(luminance('not a color')).toBe(0);
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(contrastRatio('#ffffff', '#000000')).toBe(21);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });
});

describe('legibleTint', () => {
  it('keeps a seed that already reaches the ratio, and one it cannot read', () => {
    expect(legibleTint('#0040DD', '#ffffff', 4.5)).toBe('#0040DD');
    expect(legibleTint('#007AFF', '#000000', 4.5)).toBe('#007AFF');
    expect(legibleTint('tomato', '#000000', 4.5)).toBe('tomato');
  });

  it('darkens a seed on a light background and lightens one on a dark background, keeping its hue', () => {
    const light = legibleTint('#007AFF', '#ffffff', 4.5);
    expect(contrastRatio(light, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light, '#ffffff')).toBeLessThan(4.7);
    const [r, g, b] = parseHex(light)!;
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
    const dark = legibleTint('#3A0CA3', '#000000', 4.5);
    expect(contrastRatio(dark, '#000000')).toBeGreaterThanOrEqual(4.5);
    expect(luminance(dark)).toBeGreaterThan(luminance('#3A0CA3'));
  });

  it('moves every hue and a gray, light and dark, until each reaches the ratio', () => {
    const seeds = ['#FF0080', '#FF8000', '#80FF00', '#00FF80', '#0080FF', '#8000FF', '#FFB0C0', '#808080'];
    for (const seed of seeds) {
      for (const background of ['#ffffff', '#000000']) {
        expect(contrastRatio(legibleTint(seed, background, 7), background)).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it('ends at white or black when no lightness reaches the ratio', () => {
    expect(legibleTint('#007AFF', '#000000', 22)).toBe('#FFFFFF');
    expect(legibleTint('#007AFF', '#ffffff', 22)).toBe('#000000');
  });
});
