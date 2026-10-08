import {Platform} from 'react-native';
import {hexColor, hexOver} from './hex-color';

describe(`hexColor (${Platform.OS})`, () => {
  it('writes any color React Native reads as #RRGGBBAA', () => {
    expect(hexColor('#F00')).toBe('#FF0000FF');
    expect(hexColor('#0A84FF')).toBe('#0A84FFFF');
    expect(hexColor('rgba(0, 0, 255, 0.25)')).toBe('#0000FF40');
    expect(hexColor('rgb(0, 122, 255)')).toBe('#007AFFFF');
    expect(hexColor('hsl(0, 100%, 50%)')).toBe('#FF0000FF');
    expect(hexColor('yellow')).toBe('#FFFF00FF');
  });

  it('is nothing for no color, or for one it cannot read', () => {
    expect(hexColor(undefined)).toBeUndefined();
    expect(hexColor('not a color')).toBeUndefined();
    expect(hexColor('var(--brand)')).toBeUndefined();
  });
});

describe(`hexOver (${Platform.OS})`, () => {
  it('writes an opaque color as it is', () => {
    expect(hexOver('#0A84FF', '#FFFFFF')).toBe('#0A84FFFF');
    expect(hexOver('yellow', '#000000')).toBe('#FFFF00FF');
  });

  it('blends a translucent color into what is beneath it', () => {
    // The palette's pillBackground in each scheme, over that scheme's background.
    expect(hexOver('rgba(118, 118, 128, 0.12)', '#ffffff')).toBe('#EEEEF0FF');
    expect(hexOver('rgba(118, 118, 128, 0.24)', '#000000')).toBe('#1C1C1FFF');
    // Nothing of a fully transparent color shows.
    expect(hexOver('transparent', '#F0F0F3')).toBe('#F0F0F3FF');
  });

  it('is nothing for a color it cannot read, and the color without its alpha over one it cannot read', () => {
    expect(hexOver(undefined, '#FFFFFF')).toBeUndefined();
    expect(hexOver('var(--brand)', '#FFFFFF')).toBeUndefined();
    expect(hexOver('rgba(0, 0, 255, 0.25)', 'var(--background)')).toBe('#0000FFFF');
  });
});
