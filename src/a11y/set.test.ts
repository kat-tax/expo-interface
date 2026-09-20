import {Platform} from 'react-native';
import {inSet} from './set';

describe(`inSet (${Platform.OS})`, () => {
  it('numbers an item within its set where the platform has somewhere to put it', () => {
    if (Platform.OS === 'windows') {
      // The two props react-native-windows answers PositionInSet and
      // SizeOfSet from, which Narrator says out loud.
      expect(inSet(3, 7)).toEqual({accessibilityPosInSet: 3, accessibilitySetSize: 7});
    } else {
      // Nothing to set: iOS derives it, Android has no React Native prop for
      // it, and the kit's web files write a real `tablist` that carries it.
      expect(inSet(3, 7)).toEqual({});
    }
  });
});
