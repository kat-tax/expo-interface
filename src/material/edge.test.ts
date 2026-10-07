import {Platform, StyleSheet} from 'react-native';
import {edgeStyle} from './edge';

describe(`edgeStyle (${Platform.OS})`, () => {
  it('draws the hairline all round, along the top or the bottom, and nowhere for none', () => {
    const width = StyleSheet.hairlineWidth;
    expect(edgeStyle('all', 'red')).toEqual({borderWidth: width, borderColor: 'red'});
    expect(edgeStyle('top', 'red')).toEqual({borderTopWidth: width, borderColor: 'red'});
    expect(edgeStyle('bottom', 'red')).toEqual({borderBottomWidth: width, borderColor: 'red'});
    expect(edgeStyle('none', 'red')).toBeNull();
  });
});
