import {SYMBOL_FILL_FONT_FAMILY, SYMBOL_FONT_FAMILY, getSymbolFontCSS} from './font';

describe('getSymbolFontCSS', () => {
  it('registers the variable family the stylesheet draws every icon with first', () => {
    expect(getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2')).toBe(
      `@font-face { font-family: '${SYMBOL_FONT_FAMILY}'; src: url('/symbols/MaterialSymbolsOutlined.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; }`,
    );
  });

  it('takes a family of the app\'s own, and names it in --ui-symbol-font so every icon draws with it', () => {
    expect(getSymbolFontCSS('/f.woff2', 'App Symbols')).toBe(
      "@font-face { font-family: 'App Symbols'; src: url('/f.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; } :root { --ui-symbol-font: 'App Symbols'; }",
    );
    // The family as an option is the same as the family on its own.
    expect(getSymbolFontCSS('/f.woff2', {family: 'App Symbols'})).toBe(getSymbolFontCSS('/f.woff2', 'App Symbols'));
    // The stylesheet names the kit's own family already.
    expect(getSymbolFontCSS('/f.woff2', SYMBOL_FONT_FAMILY)).toBe(getSymbolFontCSS('/f.woff2'));
  });

  it('registers the font for filled icons alone, under the family the stylesheet tries first for them', () => {
    expect(SYMBOL_FILL_FONT_FAMILY).toBe('Material Symbols Filled');
    expect(getSymbolFontCSS('/f.woff2', {filled: true})).toBe(
      `@font-face { font-family: '${SYMBOL_FILL_FONT_FAMILY}'; src: url('/f.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; }`,
    );
    // A family of the app's own, named in --ui-symbol-fill-font, which only a filled token tries.
    expect(getSymbolFontCSS('/f.woff2', {filled: true, family: 'App Filled'})).toBe(
      "@font-face { font-family: 'App Filled'; src: url('/f.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; } :root { --ui-symbol-fill-font: 'App Filled'; }",
    );
    expect(getSymbolFontCSS('/f.woff2', {filled: true, family: SYMBOL_FILL_FONT_FAMILY})).toBe(getSymbolFontCSS('/f.woff2', {filled: true}));
    // Not filled: the family every icon draws with.
    expect(getSymbolFontCSS('/f.woff2', {filled: false})).toContain(`font-family: '${SYMBOL_FONT_FAMILY}'`);
  });
});
