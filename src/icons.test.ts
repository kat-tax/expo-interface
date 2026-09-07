import {icon} from './icons';

describe('icon', () => {
  it('wraps a single symbol name', () => {
    expect(icon('star')).toEqual({symbol: 'star', drawable: undefined, fill: undefined});
  });

  it('keeps a per-platform symbol map and drawable', () => {
    const symbol = {ios: 'square.and.arrow.up', android: 'share', web: 'share'} as const;
    expect(icon(symbol, 42)).toEqual({symbol, drawable: 42, fill: undefined});
  });

  it('carries the solid form of a symbol', () => {
    expect(icon('star', 42, {fill: true})).toEqual({symbol: 'star', drawable: 42, fill: true});
    expect(icon('star', 42, {})).toEqual({symbol: 'star', drawable: 42, fill: undefined});
  });
});
