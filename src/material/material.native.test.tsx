import {Platform} from 'react-native';
import {materialProps} from '.';

describe(`materialProps (${Platform.OS})`, () => {
  it('draws nothing natively, where the platform bars have materials of their own', () => {
    expect(materialProps('regular', 'element', 'all')).toEqual({});
    expect(materialProps('none', 'background', 'bottom')).toEqual({});
  });
});
