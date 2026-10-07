import {drawableOf, icon, materialName, registerDrawables, symbolName} from './icons';

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

describe('symbolName', () => {
  const share = icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'});
  const star = icon({ios: 'star', android: 'star', web: 'star'}, undefined, {fill: true});

  it('names the icon each platform draws', () => {
    expect(symbolName(share, 'ios')).toBe('square.and.arrow.up');
    expect(symbolName(share, 'android')).toBe('share');
    expect(symbolName(share, 'web')).toBe('share');
    // The Segoe Fluent twin of the Material name.
    expect(symbolName(share, 'windows')).toBe('E72D');
  });

  it('names the solid form where the platform has one', () => {
    expect(symbolName(star, 'ios')).toBe('star.fill');
    expect(symbolName(star, 'windows')).toBe('E735');
    // A name that is solid already keeps it.
    expect(symbolName(icon('star.slash.fill', undefined, {fill: true}), 'ios')).toBe('star.slash.fill');
  });

  it('answers nothing for a platform the token names no icon on', () => {
    const bare = icon('star');
    expect(symbolName(bare, 'ios')).toBe('star');
    expect(symbolName(bare, 'android')).toBeUndefined();
    expect(symbolName(bare, 'web')).toBeUndefined();
    expect(symbolName(bare, 'windows')).toBeUndefined();
    expect(symbolName({symbol: {web: 'home'} as never}, 'ios')).toBeUndefined();
    expect(materialName(bare)).toBeUndefined();
    expect(materialName(share)).toBe('share');
    expect(materialName({symbol: {ios: 'house', web: 'home'} as never})).toBe('home');
  });
});

describe('drawables', () => {
  const share = icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'});
  const star = icon({ios: 'star', android: 'star', web: 'star'});
  const starFilled = icon({ios: 'star', android: 'star', web: 'star'}, undefined, {fill: true});

  it('finds a token\'s drawable in the registry by its Material name, the filled one for a filled token', () => {
    expect(drawableOf(share)).toBeUndefined();
    registerDrawables({share: 1, star: 2}, {star: 3});
    expect(drawableOf(share)).toBe(1);
    expect(drawableOf(star)).toBe(2);
    expect(drawableOf(starFilled)).toBe(3);
  });

  it('keeps a token\'s own drawable, and falls back to the outline for a filled token without one', () => {
    registerDrawables({favorite: 4});
    expect(drawableOf(icon({ios: 'heart', android: 'favorite', web: 'favorite'}, 9))).toBe(9);
    expect(drawableOf(icon({ios: 'heart', android: 'favorite', web: 'favorite'}, undefined, {fill: true}))).toBe(4);
  });

  it('answers nothing for a bare symbol, an unknown name, or no token', () => {
    expect(drawableOf(icon('star'))).toBeUndefined();
    expect(drawableOf(icon({ios: 'bolt', android: 'bolt', web: 'bolt'}))).toBeUndefined();
    expect(drawableOf(undefined)).toBeUndefined();
  });
});
