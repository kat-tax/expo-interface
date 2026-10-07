import type {AndroidSymbol, SFSymbol} from 'expo-symbols';
import type {IconToken} from '../icons';
import type {TabIcon, TabRoute} from './types';
import {symbolName} from '../icons';

/** Whether a route's icon is one of the kit's tokens rather than the bare map. */
export function isToken(icon: TabRoute['icon']): icon is IconToken {
  return 'symbol' in icon;
}

/** A route's icon as a token, whichever way it was given, for the platforms that draw from one. */
export function routeToken(icon: TabRoute['icon']): IconToken {
  return isToken(icon) ? icon : {symbol: icon};
}

/**
 * The names the platforms' own tab bars take: the SF Symbol (a filled
 * token's `.fill` form) and the Material name. A token naming a bare SF
 * Symbol has no Material name, and Android's bar draws nothing for it.
 */
export function routeSymbol(icon: TabRoute['icon']): Partial<TabIcon> {
  if (!isToken(icon)) return icon;
  return {
    ios: symbolName(icon, 'ios') as SFSymbol | undefined,
    android: symbolName(icon, 'android') as AndroidSymbol | undefined,
    web: symbolName(icon, 'web') as AndroidSymbol | undefined,
  };
}
