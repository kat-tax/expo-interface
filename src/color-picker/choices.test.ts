import {Platform} from 'react-native';
import {NO_COLOR, SYSTEM_SWATCHES, sameColor, swatchMenu, swatchesOf} from './choices';

describe(`the color picker's choices (${Platform.OS})`, () => {
  it('takes the app\'s swatches named by their hex, the platform\'s palette for system, and none otherwise', () => {
    expect(swatchesOf(['#FF0000'])).toEqual([{color: '#FF0000', name: '#FF0000'}]);
    expect(swatchesOf(undefined)).toEqual([]);
    const palette = Platform.OS === 'android' ? SYSTEM_SWATCHES.material : Platform.OS === 'windows' ? SYSTEM_SWATCHES.fluent : SYSTEM_SWATCHES.apple;
    expect(swatchesOf('system')).toEqual(palette);
    expect(palette).toHaveLength(12);
  });

  it('tells two colors apart by their color alone, and no color from every color', () => {
    expect(sameColor('#FF000080', '#ff0000')).toBe(true);
    expect(sameColor('#FF0000', '#00FF00')).toBe(false);
    expect(sameColor(NO_COLOR, '#000000')).toBe(false);
    expect(sameColor('#000000', NO_COLOR)).toBe(false);
  });

  it('lists No color first when allowed, then each swatch with its dot, the current one checked, picked opaque', () => {
    const pick = vi.fn();
    const items = swatchMenu([{color: '#FF0000', name: 'Red'}, {color: '#00FF00', name: 'Green'}], '#FF000080', true, true, pick);
    expect(items.map(item => [item.label, item.swatch, item.active, item.separator === true])).toEqual([
      ['No color', undefined, false, false],
      ['Red', '#FF0000', true, true],
      ['Green', '#00FF00', false, false],
    ]);
    items[2].onPress?.();
    expect(pick).toHaveBeenLastCalledWith('#00FF00FF');
    items[0].onPress?.();
    expect(pick).toHaveBeenLastCalledWith(NO_COLOR);
    const plain = swatchMenu([{color: '#FF0000', name: 'Red'}], NO_COLOR, false, false, pick);
    expect(plain).toHaveLength(1);
    expect(plain[0]).toMatchObject({active: false, separator: false});
    plain[0].onPress?.();
    expect(pick).toHaveBeenLastCalledWith('#FF0000');
    // No color is the current choice when the value is empty.
    expect(swatchMenu([], NO_COLOR, true, true, pick)[0].active).toBe(true);
  });
});
