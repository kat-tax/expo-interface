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
   * A family of the app's own to register the font under. The rule then
   * also names it on `:root` in `--ui-symbol-font` (`--ui-symbol-fill-font`
   * with `filled`), the variable the stylesheet draws with, so icons take
   * it with nothing more from the app: every icon, or with `filled` the
   * filled ones alone. By default `SYMBOL_FONT_FAMILY`, or
   * `SYMBOL_FILL_FONT_FAMILY` with `filled`, which the stylesheet already
   * names.
   */
  family?: string;
}

/**
 * The `@font-face` that registers the variable Material Symbols font that
 * `expo-interface-symbols --font` writes, for `+html.tsx`, beside
 * `getThemeCSS()`. `url` is where the app serves the file, from its own
 * bundle rather than a CDN so an offline build still draws. Blocked rather
 * than swapped, so the icon's name is never painted as words while the font
 * loads.
 *
 * Registered as it is, every icon draws from the font first, so a name the
 * cut does not hold draws as its letters. With `{filled: true}` only a
 * filled icon does, and outlined icons keep the static instance
 * `expo-symbols` ships. A family name in place of the options is the same
 * as `{family}`: the rule names it in `--ui-symbol-font`, and every icon,
 * outlined and filled, draws from that cut. A cut of filled icons alone is
 * registered with `{filled: true}`, and with `family` as well to keep a
 * name of its own.
 *
 * ```tsx
 * <style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2')}}/>
 * // or, for filled icons alone:
 * <style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2', {filled: true})}}/>
 * // or, for filled icons alone under a name of the app's own:
 * <style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2', {filled: true, family: 'App Symbols Filled'})}}/>
 * ```
 */
export function getSymbolFontCSS(url: string, options: string | SymbolFontOptions = {}): string {
  const resolved: SymbolFontOptions = typeof options === 'string' ? {family: options} : options;
  const {filled = false} = resolved;
  const standard = filled ? SYMBOL_FILL_FONT_FAMILY : SYMBOL_FONT_FAMILY;
  const {family = standard} = resolved;
  const face = `@font-face { font-family: '${family}'; src: url('${url}') format('woff2-variations'); font-weight: 100 700; font-display: block; }`;
  if (family === standard) return face;
  // A family of the app's own, named where the stylesheet looks for it.
  return `${face} :root { ${filled ? '--ui-symbol-fill-font' : '--ui-symbol-font'}: '${family}'; }`;
}
