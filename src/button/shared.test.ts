import {androidContentPadding, iosSymbol, swiftBorderShape, swiftControlSize} from './shared';

describe('button shared helpers', () => {
  it('resolves the SF Symbol from a string or a per-platform map', () => {
    expect(iosSymbol({symbol: 'star'})).toBe('star');
    expect(iosSymbol({symbol: {ios: 'trash', android: 'delete', web: 'delete'}})).toBe('trash');
    expect(iosSymbol({symbol: {android: 'delete', web: 'delete'}})).toBe('questionmark');
  });

  it('maps sizes and shapes onto SwiftUI modifiers', () => {
    expect(swiftControlSize('small')).toBe('small');
    expect(swiftControlSize('medium')).toBe('regular');
    expect(swiftControlSize('large')).toBe('large');
    expect(swiftBorderShape('rounded')).toBe('roundedRectangle');
    expect(swiftBorderShape('pill')).toBe('capsule');
    expect(swiftBorderShape('circle')).toBe('circle');
  });

  it('tightens the leading padding of Compose buttons that carry an icon', () => {
    expect(androidContentPadding('small')).toEqual({start: 16, top: 6, end: 16, bottom: 6});
    expect(androidContentPadding('small', true)).toEqual({start: 12, top: 6, end: 16, bottom: 6});
    expect(androidContentPadding('medium')).toEqual({start: 24, top: 10, end: 24, bottom: 10});
    expect(androidContentPadding('medium', true)).toEqual({start: 16, top: 10, end: 24, bottom: 10});
    expect(androidContentPadding('large')).toEqual({start: 28, top: 14, end: 28, bottom: 14});
    expect(androidContentPadding('large', true)).toEqual({start: 20, top: 14, end: 28, bottom: 14});
  });
});
