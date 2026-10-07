import {icon} from '../icons';
import {isToken, routeSymbol, routeToken} from './icon';

const map = {ios: 'house', android: 'home', web: 'home'} as const;

describe('a route\'s icon', () => {
  it('is the bare map or one of the app\'s tokens', () => {
    expect(isToken(map)).toBe(false);
    expect(isToken(icon(map))).toBe(true);
    expect(routeToken(map)).toEqual({symbol: map});
    expect(routeToken(icon(map))).toEqual(icon(map));
  });

  it('names the symbols the platforms\' own bars take, the solid SF Symbol for a filled token', () => {
    expect(routeSymbol(map)).toBe(map);
    expect(routeSymbol(icon(map))).toEqual({ios: 'house', android: 'home', web: 'home'});
    expect(routeSymbol(icon(map, undefined, {fill: true}))).toEqual({ios: 'house.fill', android: 'home', web: 'home'});
    // A bare SF Symbol name has no Material twin for Android's bar.
    expect(routeSymbol(icon('house'))).toEqual({ios: 'house', android: undefined, web: undefined});
  });
});
