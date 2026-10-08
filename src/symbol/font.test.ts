import {SYMBOL_FILL_FONT_FAMILY, SYMBOL_FONT_FAMILY, getSymbolFontCSS} from './font';

describe('getSymbolFontCSS', () => {
  it('registers the variable family the stylesheet draws filled icons with', () => {
    expect(getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2')).toBe(
      `@font-face { font-family: '${SYMBOL_FONT_FAMILY}'; src: url('/symbols/MaterialSymbolsOutlined.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; }`,
    );
  });

  it('takes a family of the app\'s own, for --ui-symbol-font', () => {
    expect(getSymbolFontCSS('/f.woff2', 'App Symbols')).toContain("font-family: 'App Symbols'");
    // The family as an option is the same as the family on its own.
    expect(getSymbolFontCSS('/f.woff2', {family: 'App Symbols'})).toBe(getSymbolFontCSS('/f.woff2', 'App Symbols'));
  });

  it('registers the font for filled icons alone, under the family the stylesheet tries first for them', () => {
    expect(SYMBOL_FILL_FONT_FAMILY).toBe('Material Symbols Filled');
    expect(getSymbolFontCSS('/f.woff2', {filled: true})).toBe(
      `@font-face { font-family: '${SYMBOL_FILL_FONT_FAMILY}'; src: url('/f.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; }`,
    );
    // A family of the app's own, for --ui-symbol-fill-font.
    expect(getSymbolFontCSS('/f.woff2', {filled: true, family: 'App Filled'})).toContain("font-family: 'App Filled'");
    // Not filled: the family every icon draws with.
    expect(getSymbolFontCSS('/f.woff2', {filled: false})).toContain(`font-family: '${SYMBOL_FONT_FAMILY}'`);
  });
});
