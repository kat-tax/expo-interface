import {icon} from './icons';

describe('icon', () => {
  it('wraps a single symbol name', () => {
    expect(icon('star')).toEqual({symbol: 'star', drawable: undefined});
  });

  it('keeps a per-platform symbol map and drawable', () => {
    const symbol = {ios: 'square.and.arrow.up', android: 'share', web: 'share'} as const;
    expect(icon(symbol, 42)).toEqual({symbol, drawable: 42});
  });
});
