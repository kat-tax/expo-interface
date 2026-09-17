import {highContrastPalette} from './contrast-palette';

const black = {
  background: '#000000',
  text: '#FFFFFF',
  highlight: '#1AEBFF',
  highlightText: '#000000',
  buttonFace: '#000000',
  buttonText: '#FFFFFF',
  link: '#FFFF00',
  disabledText: '#3FF23F',
};

describe('high contrast (not windows)', () => {
  it('is off on the other platforms', async () => {
    // The platform resolution would take `./contrast` to the Windows file; the extension pins the plain one.
    const plain = './contrast' + '.ts';
    const contrast = await import(/* @vite-ignore */ plain);
    expect(contrast.useHighContrast()).toEqual({enabled: false, scheme: '', colors: null});
  });

  it('maps the palette to a theme: text and separators in its text, surfaces in its faces, the accent its highlight', () => {
    const palette = highContrastPalette(black);
    expect(palette.label).toBe('#FFFFFF');
    expect(palette.secondaryLabel).toBe('#FFFFFF');
    expect(palette.tertiaryLabel).toBe('#3FF23F');
    expect(palette.separator).toBe('#FFFFFF');
    expect(palette.background).toBe('#000000');
    expect(palette.backgroundElement).toBe('#000000');
    expect(palette.backgroundSelected).toBe('#000000');
    expect(palette.tint).toBe('#1AEBFF');
    expect(palette.onTint).toBe('#000000');
    expect(palette.switchOn).toBe('#1AEBFF');
    expect(palette.destructive).toBe('#FFFFFF');
    expect(palette.onDestructive).toBe('#000000');
    expect(Object.keys(palette)).toHaveLength(15);
  });
});
