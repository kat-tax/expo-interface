import {SYMBOL_FONT_FAMILY, getSymbolFontCSS} from './font';

describe('getSymbolFontCSS', () => {
  it('registers the variable family the stylesheet draws filled icons with', () => {
    expect(getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2')).toBe(
      `@font-face { font-family: '${SYMBOL_FONT_FAMILY}'; src: url('/symbols/MaterialSymbolsOutlined.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; }`,
    );
  });

  it('takes a family of the app\'s own, for --ui-symbol-font', () => {
    expect(getSymbolFontCSS('/f.woff2', 'App Symbols')).toContain("font-family: 'App Symbols'");
  });
});
