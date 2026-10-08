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
    expect(legibleTint('#0040DD', ['#ffffff'], 4.5)).toBe('#0040DD');
    expect(legibleTint('#007AFF', ['#000000'], 4.5)).toBe('#007AFF');
    expect(legibleTint('tomato', ['#000000'], 4.5)).toBe('tomato');
  });

  it('darkens a seed on a light background and lightens one on a dark background, keeping its hue', () => {
    const light = legibleTint('#007AFF', ['#ffffff'], 4.5);
    expect(contrastRatio(light, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light, '#ffffff')).toBeLessThan(4.7);
    const [r, g, b] = parseHex(light)!;
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
    const dark = legibleTint('#3A0CA3', ['#000000'], 4.5);
    expect(contrastRatio(dark, '#000000')).toBeGreaterThanOrEqual(4.5);
    expect(luminance(dark)).toBeGreaterThan(luminance('#3A0CA3'));
  });

  it('measures against every background, and moves the seed until the stricter one reaches the ratio', () => {
    // #1a56db's tint for black alone is 4.5:1 there but 3.4:1 on the dark raised fill.
    expect(legibleTint('#1a56db', ['#000000'], 4.5)).toBe('#376DE7');
    const dark = legibleTint('#1a56db', ['#000000', '#212225'], 4.5);
    expect(dark).toBe('#5785EB');
    expect(contrastRatio(dark, '#000000')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark, '#212225')).toBeGreaterThanOrEqual(4.5);
    // systemBlue passes black and fails the raised fill, so it moves.
    expect(legibleTint('#007AFF', ['#000000'], 4.5)).toBe('#007AFF');
    expect(legibleTint('#007AFF', ['#000000', '#212225'], 4.5)).not.toBe('#007AFF');
    // A seed that passes both is kept.
    expect(legibleTint('#34C759', ['#000000', '#212225'], 4.5)).toBe('#34C759');
  });

  it('moves every hue and a gray, light and dark, until each reaches the ratio on both of the scheme backgrounds', () => {
    const seeds = ['#FF0080', '#FF8000', '#80FF00', '#00FF80', '#0080FF', '#8000FF', '#FFB0C0', '#808080'];
    const schemes = [
      ['#ffffff', '#F0F0F3'],
      ['#000000', '#212225'],
    ];
    for (const seed of seeds) {
      for (const backgrounds of schemes) {
        const tint = legibleTint(seed, backgrounds, 7);
        expect(backgrounds.every(background => contrastRatio(tint, background) >= 7)).toBe(true);
      }
    }
  });

  it('ends at white or black when no lightness reaches the ratio', () => {
    expect(legibleTint('#007AFF', ['#000000'], 22)).toBe('#FFFFFF');
    expect(legibleTint('#007AFF', ['#ffffff'], 22)).toBe('#000000');
  });
});
