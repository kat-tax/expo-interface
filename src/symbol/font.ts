/** The family the kit's stylesheet draws filled icons with on the web (`symbol.css`). */
export const SYMBOL_FONT_FAMILY = 'Material Symbols Outlined';

/**
 * The `@font-face` that registers the variable Material Symbols font the
 * kit draws filled icons with on the web, for `+html.tsx`, beside
 * `getThemeCSS()`. `url` is where the app serves the file
 * `expo-interface-symbols --font` writes, from its own bundle rather than a
 * CDN so an offline build still draws. Blocked rather than swapped, so the
 * icon's name is never painted as words while the font loads.
 *
 * ```tsx
 * <style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2')}}/>
 * ```
 */
export function getSymbolFontCSS(url: string, family = SYMBOL_FONT_FAMILY): string {
  return `@font-face { font-family: '${family}'; src: url('${url}') format('woff2-variations'); font-weight: 100 700; font-display: block; }`;
}
