/** The family the kit's stylesheet draws every icon with first on the web (`symbol.css`). */
export const SYMBOL_FONT_FAMILY = 'Material Symbols Outlined';

/**
 * The family the kit's stylesheet draws a filled icon with first on the web,
 * ahead of `SYMBOL_FONT_FAMILY` (`symbol.css`).
 */
export const SYMBOL_FILL_FONT_FAMILY = 'Material Symbols Filled';

/** How `getSymbolFontCSS` registers the font. */
export interface SymbolFontOptions {
  /**
   * Registers the font for filled icons alone, under
   * `SYMBOL_FILL_FONT_FAMILY`, so outlined icons keep the static instance
   * `expo-symbols` ships, which holds every name. A filled icon still draws
   * from the font first, so its name has to be in it.
   * @default false
   */
  filled?: boolean;
  /**
   * A family of the app's own, which then also goes in `--ui-symbol-font`
   * (or `--ui-symbol-fill-font` with `filled`). By default
   * `SYMBOL_FONT_FAMILY`, or `SYMBOL_FILL_FONT_FAMILY` with `filled`.
   */
  family?: string;
}

/**
 * The `@font-face` that registers the variable Material Symbols font the
 * kit draws filled icons with on the web, for `+html.tsx`, beside
 * `getThemeCSS()`. `url` is where the app serves the file
 * `expo-interface-symbols --font` writes, from its own bundle rather than a
 * CDN so an offline build still draws. Blocked rather than swapped, so the
 * icon's name is never painted as words while the font loads.
 *
 * Registered as it is, every icon draws from the font first. With
 * `{filled: true}` only a filled icon does. A family name in place of the
 * options is the same as `{family}`.
 *
 * ```tsx
 * <style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2')}}/>
 * // or, for filled icons alone:
 * <style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2', {filled: true})}}/>
 * ```
 */
export function getSymbolFontCSS(url: string, options: string | SymbolFontOptions = {}): string {
  const resolved: SymbolFontOptions = typeof options === 'string' ? {family: options} : options;
  const {filled = false, family = filled ? SYMBOL_FILL_FONT_FAMILY : SYMBOL_FONT_FAMILY} = resolved;
  return `@font-face { font-family: '${family}'; src: url('${url}') format('woff2-variations'); font-weight: 100 700; font-display: block; }`;
}
