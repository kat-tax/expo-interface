import {
  checkerSvg,
  grid,
  gridColor,
  hslToRgb,
  hsvToRgb,
  parseColor,
  rgbToHsv,
  ringHue,
  ringSvg,
  spectrumColor,
  spectrumPosition,
  spectrumSvg,
  svgDataUri,
  toCss,
  toHex,
  well,
} from './shared';

describe('ColorPicker shared', () => {
  it('parses every hex form and falls back to opaque black', () => {
    expect(parseColor('#FF6347')).toEqual({r: 255, g: 99, b: 71, a: 1});
    expect(parseColor('#FF634780')).toEqual({r: 255, g: 99, b: 71, a: 128 / 255});
    expect(parseColor('#abc')).toEqual({r: 170, g: 187, b: 204, a: 1});
    expect(parseColor('#abcd')).toEqual({r: 170, g: 187, b: 204, a: 221 / 255});
    expect(parseColor(' ff6347 ')).toEqual({r: 255, g: 99, b: 71, a: 1});
    expect(parseColor('tomato')).toEqual({r: 0, g: 0, b: 0, a: 1});
    expect(parseColor('')).toEqual({r: 0, g: 0, b: 0, a: 1});
  });

  it('formats the iOS hex strings and CSS rgba', () => {
    const color = {r: 255, g: 99, b: 71, a: 0.5};
    expect(toHex(color, false)).toBe('#FF6347');
    expect(toHex(color, true)).toBe('#FF634780');
    expect(toHex({r: 300, g: -1, b: 7.4, a: 1}, true)).toBe('#FF0007FF');
    expect(toCss(color)).toBe('rgba(255, 99, 71, 0.5)');
    expect(toCss({r: 0, g: 0, b: 0, a: 1 / 3})).toBe('rgba(0, 0, 0, 0.333)');
  });

  it('converts between RGB and HSV in every hue sector', () => {
    expect(rgbToHsv({r: 128, g: 128, b: 128})).toEqual({h: 0, s: 0, v: 128 / 255});
    expect(rgbToHsv({r: 0, g: 0, b: 0})).toEqual({h: 0, s: 0, v: 0});
    expect(rgbToHsv({r: 255, g: 0, b: 0}).h).toBe(0);
    expect(rgbToHsv({r: 0, g: 255, b: 0}).h).toBe(120);
    expect(rgbToHsv({r: 0, g: 0, b: 255}).h).toBe(240);
    expect(rgbToHsv({r: 255, g: 0, b: 255}).h).toBe(300);
    for (const h of [0, 60, 120, 180, 240, 300, 359]) {
      const rgb = hsvToRgb(h, 1, 1);
      expect(rgbToHsv(rgb).h).toBeCloseTo(h, 0);
    }
    expect(hsvToRgb(-60, 1, 1)).toEqual(hsvToRgb(300, 1, 1));
    expect(hsvToRgb(0, 0, 0.5)).toEqual({r: 128, g: 128, b: 128});
  });

  it('converts HSL, including black', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual({r: 255, g: 0, b: 0});
    expect(hslToRgb(120, 1, 0.9)).toEqual({r: 204, g: 255, b: 204});
    expect(hslToRgb(200, 1, 0)).toEqual({r: 0, g: 0, b: 0});
  });

  it('builds the iOS grid: grays on top, hues from light to dark below', () => {
    expect(gridColor(0, 0)).toEqual({r: 255, g: 255, b: 255});
    expect(gridColor(0, grid.columns - 1)).toEqual({r: 0, g: 0, b: 0});
    const light = gridColor(1, 0);
    const dark = gridColor(grid.rows - 1, 0);
    expect(rgbToHsv(light).h).toBe(0);
    expect(rgbToHsv(light).v).toBeGreaterThan(rgbToHsv(dark).v);
    expect(rgbToHsv(gridColor(5, 4)).h).toBeCloseTo(120, 0);
  });

  it('maps spectrum points to colors and back', () => {
    expect(spectrumColor(0, 0)).toEqual({r: 255, g: 255, b: 255});
    expect(spectrumColor(0.5, 0)).toEqual({r: 255, g: 0, b: 0});
    expect(spectrumColor(1, 0.5)).toEqual({r: 0, g: 0, b: 0});
    expect(spectrumColor(0.5, 1 / 3)).toEqual({r: 0, g: 255, b: 0});
    expect(spectrumColor(-1, 2)).toEqual({r: 255, g: 255, b: 255});
    expect(spectrumPosition({r: 255, g: 0, b: 0})).toEqual({x: 0.5, y: 0});
    expect(spectrumPosition({r: 0, g: 128, b: 0})).toEqual({x: 1 - 128 / 255 / 2, y: 120 / 360});
    expect(spectrumPosition({r: 255, g: 128, b: 128}).x).toBeCloseTo(127 / 255 / 2);
  });

  it('encodes SVG data URIs with base64 padding', () => {
    expect(svgDataUri('<svg/>')).toBe('data:image/svg+xml;base64,PHN2Zy8+');
    expect(svgDataUri('a')).toBe('data:image/svg+xml;base64,YQ==');
    expect(svgDataUri('ab')).toBe('data:image/svg+xml;base64,YWI=');
    expect(svgDataUri('abc')).toBe('data:image/svg+xml;base64,YWJj');
  });

  it('draws the well ring with yellow up, red right, blue down and green left', () => {
    expect(ringHue(0)).toBe(60);
    expect(ringHue(90)).toBe(330);
    expect(ringHue(180)).toBe(240);
    expect(ringHue(270)).toBe(150);
    const svg = ringSvg();
    expect(svg.match(/<path /g)).toHaveLength(60);
    expect(svg).toContain(`stroke-width="${(well.ring / well.size) * 100}"`);
    expect(svg).toContain('stroke="rgb(255,');
  });

  it('draws the spectrum and checkerboard SVGs', () => {
    const spectrum = spectrumSvg();
    expect(spectrum.match(/<stop /g)).toHaveLength(7 + 4);
    expect(spectrum).toContain('stop-color="rgb(255,0,0)"');
    expect(spectrum).toContain('preserveAspectRatio="none"');
    expect(checkerSvg()).toContain('fill="#d9d9d9"');
  });
});
