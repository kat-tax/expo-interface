import type {SymbolViewProps} from 'expo-symbols';

/**
 * `expo-symbols` on Windows: `withWindows` resolves the package to this
 * file. `SymbolView` is a native view of SF Symbols and Material Symbols,
 * neither of which Windows has; its module throws at import. The view draws
 * nothing here — the kit's own `Icon` draws Segoe Fluent Icons for the
 * icon tokens the kit takes, which is where an app's icons should come
 * from on Windows — and the types stay the package's own.
 */
export type {AndroidSymbol, SFSymbol, SymbolViewProps} from 'expo-symbols';

export function SymbolView(_props: SymbolViewProps) {
  return null;
}
