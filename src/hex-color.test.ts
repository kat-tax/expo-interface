import {Platform} from 'react-native';
import {hexColor} from './hex-color';

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
