import {blurOnSubmitFor, inputModeFor, keyboardTypeFor, keyNameOf} from './shared';

describe('inputModeFor', () => {
  it('maps every conformed keyboard variant to the browser\'s inputmode', () => {
    expect(inputModeFor('email')).toBe('email');
    expect(inputModeFor('number')).toBe('numeric');
    expect(inputModeFor('phone')).toBe('tel');
    expect(inputModeFor('decimal')).toBe('decimal');
    expect(inputModeFor('url')).toBe('url');
    expect(inputModeFor('default')).toBeUndefined();
    expect(inputModeFor(undefined)).toBeUndefined();
  });
});

describe('keyNameOf', () => {
  it('names Escape from the character react-native-windows reports, and keeps every other key', () => {
    expect(keyNameOf('\u001b')).toBe('Escape');
    expect(keyNameOf('a')).toBe('a');
    expect(keyNameOf('Enter')).toBe('Enter');
  });
});

describe('blurOnSubmitFor', () => {
  it('blurs for blurAndSubmit, keeps the focus for submit, and leaves the default alone', () => {
    expect(blurOnSubmitFor('blurAndSubmit')).toBe(true);
    expect(blurOnSubmitFor('submit')).toBe(false);
    expect(blurOnSubmitFor(undefined)).toBeUndefined();
  });
});

describe('keyboardTypeFor', () => {
  it('maps every conformed keyboard variant to its React Native / SwiftUI type', () => {
    expect(keyboardTypeFor('email')).toBe('email-address');
    expect(keyboardTypeFor('number')).toBe('numeric');
    expect(keyboardTypeFor('phone')).toBe('phone-pad');
    expect(keyboardTypeFor('decimal')).toBe('decimal-pad');
    expect(keyboardTypeFor('url')).toBe('url');
    expect(keyboardTypeFor('default')).toBe('default');
  });

  it('falls back to the default keyboard when no variant is given', () => {
    expect(keyboardTypeFor(undefined)).toBe('default');
  });
});
