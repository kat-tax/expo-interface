import {Platform} from 'react-native';
import {caretPoint} from '.';

describe(`caretPoint (${Platform.OS})`, () => {
  it('answers nothing, because no platform but the web will say where a caret is', () => {
    // Whatever it is handed: there is no rectangle to be had from React
    // Native's TextInput, which reports the selection as character offsets.
    expect(caretPoint(null)).toBeNull();
    expect(caretPoint(undefined)).toBeNull();
    expect(caretPoint({value: 'abc', selectionStart: 1} as unknown as HTMLInputElement)).toBeNull();
  });
});
