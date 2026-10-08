import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {
  FONT_FAMILY,
  FONT_FILLS,
  KIT_FILLED,
  KIT_NAMES,
  KIT_WEB_NAMES,
  drawablesModule,
  filledUrl,
  fontFaceCSS,
  fontPlan,
  identifier,
  loadFontTools,
  outlinedUrl,
  packagedNames,
  scanFiles,
  scanSource,
  sourceFiles,
  stubModule,
  subsetVariableFont,
} from '../../bin/symbols-lib.mjs';
import {getSymbolFontCSS} from './font';

describe('expo-interface-symbols', () => {
  it('reads the Material names a source uses, and which tokens ask for the solid form', () => {
    const source = `
      export const share = icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'}, drawables.share);
      export const star = icon({ios: 'star', android: 'star', web: 'star'});
      export const starFilled = icon(
        {ios: 'star', android: 'star', web: 'star'},
        undefined,
        {fill: true},
      );
      export const bare = icon('heart');
      const tab = {ios: 'house', android: 'home', web: 'home'};
    `;
    const {names, filled} = scanSource(source);
    expect([...names].sort()).toEqual(['home', 'share', 'star']);
    expect([...filled]).toEqual(['star']);
    // A fill option on a token without a Material name asks for nothing.
    expect([...scanSource("icon({ios: 'heart'}, undefined, {fill: true})").filled]).toEqual([]);
  });

  it('always writes the names the kit\'s own controls draw: the bar and composer buttons, the ellipsis and the star, filled too', () => {
    expect(KIT_NAMES).toEqual(['arrow_back', 'arrow_upward', 'close', 'keyboard_arrow_down', 'keyboard_arrow_up', 'more_horiz', 'star', 'stop']);
    expect(KIT_FILLED).toEqual(['star']);
  });

  it('walks the sources under the roots, tests and stories left out, and merges their names', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'symbols-'));
    try {
      mkdirSync(path.join(dir, 'src', 'node_modules', 'dep'), {recursive: true});
      writeFileSync(path.join(dir, 'src', 'icons.ts'), "icon({ios: 'star', android: 'star', web: 'star'}, undefined, {fill: true})");
      writeFileSync(path.join(dir, 'src', 'tabs.tsx'), "const icon = {ios: 'house', android: 'home', web: 'home'};");
      writeFileSync(path.join(dir, 'src', 'icons.test.ts'), "icon({ios: 'x', android: 'not_this', web: 'not_this'})");
      writeFileSync(path.join(dir, 'src', 'icons.stories.tsx'), "icon({ios: 'x', android: 'nor_this', web: 'nor_this'})");
      writeFileSync(path.join(dir, 'src', 'types.d.ts'), "android: 'nor_that'");
      writeFileSync(path.join(dir, 'src', 'node_modules', 'dep', 'index.ts'), "android: 'never'");
      const files = sourceFiles(['src', 'missing'], dir);
      expect(files.map(file => path.basename(file))).toEqual(['icons.ts', 'tabs.tsx']);
      expect(scanFiles(files)).toEqual({names: ['home', 'star'], filled: ['star']});
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('writes the Android module from the package where it has the vector, and from a file beside it otherwise', () => {
    const module = drawablesModule({names: ['delete', 'share', 'sticky_note_2'], filled: ['star'], packaged: new Set(['share', 'delete'])});
    expect(module).toContain("import delete_icon from '@expo/material-symbols/delete.xml';");
    expect(module).toContain("import share from '@expo/material-symbols/share.xml';");
    expect(module).toContain("import sticky_note_2 from './sticky_note_2.xml';");
    expect(module).toContain("import star_fill from './star_fill.xml';");
    expect(module).toContain('  delete: delete_icon,');
    expect(module).toContain('  share,');
    expect(module).toContain('export const filledDrawables');
    expect(module).toContain('  star: star_fill,');
    expect(stubModule()).toContain('export const drawables: Record<string, ImageSourcePropType | undefined> = {};');
  });

  it('turns a Material name into an identifier the module can hold', () => {
    expect(identifier('share')).toBe('share');
    expect(identifier('delete')).toBe('delete_icon');
    expect(identifier('3d_rotation')).toBe('icon_3d_rotation');
  });

  it('knows the vectors the installed package ships', () => {
    const packaged = packagedNames(['share', 'no_such_icon_here'], process.cwd());
    expect([...packaged]).toEqual(['share']);
    // Nowhere to resolve the package from: nothing is packaged.
    expect([...packagedNames(['share'], tmpdir())]).toEqual([]);
  });

  it('names the CDN files and the font face the kit draws with', () => {
    expect(outlinedUrl('share')).toBe('https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/share/default/24px.xml');
    expect(filledUrl('star')).toBe('https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/star/fill1/24px.xml');
    expect(fontFaceCSS('/assets/MaterialSymbolsOutlined.woff2')).toBe(
      `@font-face { font-family: '${FONT_FAMILY}'; src: url('/assets/MaterialSymbolsOutlined.woff2') format('woff2-variations'); font-weight: 100 700; font-display: block; }`,
    );
  });

  it('keeps each name\'s glyph at both fills and its letters, and leaves out a name the font does not have', () => {
    // The font swaps most icons for a solid glyph of their own at FILL 1.
    const shape = (name: string, fill: number) => {
      if (name === 'star') return [5590 + fill];
      if (name === 'stop') return [4000 + fill];
      // Not a ligature in the font: its letters.
      if (name === 'not_an_icon') return [1, 2, 3];
      // One glyph at one fill only is not a whole icon either.
      return fill === 0 ? [9] : [7, 8];
    };
    expect(fontPlan(['star', 'stop', 'not_an_icon', 'outline_only'], shape)).toEqual({
      text: 'aoprst',
      glyphs: [4000, 4001, 5590, 5591],
      missing: ['not_an_icon', 'outline_only'],
    });
    expect(FONT_FILLS).toEqual([0, 1]);
  });

  it('cuts the variable font to those glyphs, keeping the fill axis and pinning the rest', async () => {
    const tools = {
      decode: vi.fn(async (font: Uint8Array) => new Uint8Array([...font, 0])),
      shaper: vi.fn(() => (name: string, fill: number) => [name.length * 10 + fill]),
      subset: vi.fn(() => new Uint8Array([9])),
      encode: vi.fn(async (sfnt: Uint8Array) => Buffer.from([...sfnt, 2])),
    };
    const {woff2, missing} = await subsetVariableFont(new Uint8Array([1]), ['share', 'stop'], tools);
    expect(tools.shaper).toHaveBeenCalledWith(new Uint8Array([1, 0]));
    expect(tools.subset).toHaveBeenCalledWith(new Uint8Array([1, 0]), 'aehoprst', [40, 41, 50, 51], {FILL: {min: 0, max: 1}, wght: 400, GRAD: 0, opsz: 24});
    expect([...woff2]).toEqual([9, 2]);
    expect(missing).toEqual([]);
  });

  it('refuses a harfbuzzjs without the shaping API and the subsetter it drives, before cutting anything', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'symbols-'));
    try {
      const hb = path.join(dir, 'node_modules', 'harfbuzzjs');
      mkdirSync(path.join(hb, 'dist'), {recursive: true});
      writeFileSync(
        path.join(hb, 'package.json'),
        JSON.stringify({name: 'harfbuzzjs', type: 'module', exports: {'.': './dist/index.mjs', './dist/*.wasm': './dist/*.wasm'}}),
      );
      // Another line's API: the files are where 1.x keeps them, the calls are not.
      writeFileSync(path.join(hb, 'dist', 'index.mjs'), 'export const createFace = () => {};\n');
      // An empty WebAssembly module, which exports nothing.
      writeFileSync(path.join(hb, 'dist', 'harfbuzz-subset.wasm'), new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
      mkdirSync(path.join(dir, 'node_modules', 'fontverter'));
      writeFileSync(path.join(dir, 'node_modules', 'fontverter', 'index.js'), 'module.exports = {};\n');
      await expect(loadFontTools(dir)).rejects.toThrow(
        /^harfbuzzjs is not the 1\.x line this drives: it has no Blob, Buffer, Face, Font, Variation, shape, _initialize, free, .*, malloc, memory$/,
      );
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('always writes into the font every name the kit\'s own sources draw on the web through Icon', () => {
    const kit = path.join(__dirname, '..');
    // The names a kit source spells that the web does not draw through `Icon`, by file.
    const elsewhere: Record<string, string[]> = {
      // JSDoc examples.
      'icons.ts': ['share', 'star'],
      'tabs/types.ts': ['home', 'settings'],
      // `SymbolView`, which draws from the static instance `expo-symbols` ships, never the cut.
      'screen/header.tsx': ['arrow_back'],
      'search-field/index.tsx': ['cancel', 'search'],
      'tabs/index.web.tsx': ['arrow_back'],
      // Windows draws Segoe, and the native strip is not the one the web draws.
      'screen/header.windows.tsx': ['arrow_back'],
      'tab-view/draw.tsx': ['add', 'close', 'grid_view'],
    };
    const drawn = new Set<string>();
    for (const file of sourceFiles([kit])) {
      const relative = path.relative(kit, file).split(path.sep).join('/');
      // The stories' tokens stand in for an app's.
      if (relative.startsWith('__stories__/')) continue;
      for (const name of scanFiles([file]).names) {
        if (!elsewhere[relative]?.includes(name)) drawn.add(name);
      }
    }
    // A new name drawn through `Icon` fails here until KIT_WEB_NAMES holds it.
    expect([...drawn].sort()).toEqual(KIT_WEB_NAMES);
  });

  it('writes the same font face the kit registers', () => {
    expect(fontFaceCSS('/f.woff2')).toBe(getSymbolFontCSS('/f.woff2'));
  });
});
