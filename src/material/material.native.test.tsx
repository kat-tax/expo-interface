import {Platform} from 'react-native';
import {materialAttributes, materialProps} from '.';

describe(`materialProps (${Platform.OS})`, () => {
  it('draws nothing natively, where the platform bars have materials of their own', () => {
    expect(materialProps('regular', 'element', 'all')).toEqual({});
    expect(materialProps('none', 'background', 'bottom')).toEqual({});
  });

  it('attributes nothing natively, where there is no DOM element to attribute', () => {
    expect(materialAttributes('regular', 'element', 'float')).toEqual({});
    expect(materialAttributes('none', 'element', 'float')).toEqual({});
  });
});
