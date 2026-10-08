import {blurOnSubmitFor, keyboardTypeFor} from './shared';

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
