import {Platform} from 'react-native';
import {forgetSwatches, swatchImage} from './swatch-file';

describe(`swatchImage (${Platform.OS})`, () => {
  it('writes a dot on iOS alone: the other platforms draw their swatch as a shape of their own', () => {
    if (Platform.OS !== 'ios') {
      expect(swatchImage('#FF0000')).toBeUndefined();
    }
    forgetSwatches();
  });
});
