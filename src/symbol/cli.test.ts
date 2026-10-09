import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {
  FONT_AXES,
  FONT_FAMILY,
  FONT_FILLS,
  KIT_FILLED,
  KIT_NAMES,
  KIT_WEB_NAMES,
  cutFont,
  drawablesModule,
  filledUrl,
  fontFaceCSS,
  fontNames,
  fontPlan,
  fontToolsHelp,
  identifier,
  loadFontTools,
  outlinedUrl,
  packagedNames,
  scanFiles,
  scanSource,
  shaperOf,
  sourceFiles,
  stubModule,
  subsetVariableFont,
} from '../../bin/symbols-lib.mjs';
import {getSymbolFontCSS} from './font';

/** An OpenType tag HarfBuzz was handed, as its four letters. */
const tagName = (value: number) => String.fromCharCode(value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);

/**
 * HarfBuzz's subsetter as `cutFont` drives it: every call logged with its
 * arguments, the sets it fills kept, and the cut's bytes waiting in its
 * memory. `axes` are the font's; `fails` makes the cut itself fail.
 */
function fakeSubsetter({axes = ['FILL', 'wght', 'GRAD', 'opsz'], fails = false} = {}) {
  const memory = {buffer: new ArrayBuffer(64)};
  const heap = new Uint8Array(memory.buffer);
  // The cut, where its blob's data lies.
  heap.set([7, 8, 9], 40);
  const log: [string, ...number[]][] = [];
  // The layout features, the characters and the glyphs.
  const sets: Record<number, (string | number)[]> = {10: [], 11: [], 12: []};
  const hasAxis = (_input: number, _face: number, axis: number) => Number(axes.includes(tagName(axis)));
  const calls: Record<string, (...args: number[]) => number | undefined> = {
    malloc: () => 8,
    free: () => undefined,
    hb_blob_create: () => 1,
    hb_blob_destroy: () => undefined,
    hb_blob_get_data: () => 40,
    hb_blob_get_length: () => 3,
    hb_face_create: () => 2,
    hb_face_destroy: () => undefined,
    hb_face_reference_blob: () => 21,
    hb_set_add: (set, value) => {
      sets[set].push(value);
      return undefined;
    },
    hb_set_clear: set => {
      sets[set].push('clear');
      return undefined;
    },
    hb_set_invert: set => {
      sets[set].push('invert');
      return undefined;
    },
    hb_subset_input_create_or_fail: () => 3,
    hb_subset_input_destroy: () => undefined,
    hb_subset_input_get_flags: () => 0x1,
    hb_subset_input_glyph_set: () => 12,
    hb_subset_input_pin_axis_location: hasAxis,
    hb_subset_input_set: () => 10,
    hb_subset_input_set_axis_range: hasAxis,
    hb_subset_input_set_flags: () => undefined,
    hb_subset_input_unicode_set: () => 11,
    hb_subset_or_fail: () => (fails ? 0 : 20),
  };
  const wasm = Object.fromEntries(
    Object.entries(calls).map(([name, call]) => [
      name,
      (...args: number[]) => {
        log.push([name, ...args]);
        return call(...args);
      },
    ]),
  );
  return {wasm: {...wasm, memory}, log, sets, heap};
}

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
    expect(KIT_NAMES).toEqual(['arrow_back', 'arrow_upward', 'close', 'keyboard_arrow_down', 'keyboard_arrow_up', 'more_horiz', 'more_vert', 'star', 'stop']);
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

  it('tells an app without the font tools how to install them, and one with the wrong ones what they lack', async () => {
    const install = '--font needs harfbuzzjs 1 and fontverter: npm i -D harfbuzzjs fontverter';
    const dir = mkdtempSync(path.join(tmpdir(), 'symbols-'));
    try {
      // Nothing to resolve from an empty folder.
      expect(fontToolsHelp(await loadFontTools(dir).catch((error: unknown) => error))).toBe(install);
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
    expect(fontToolsHelp(new Error('harfbuzzjs is not the 1.x line this drives: it has no hb_set_invert'))).toBe(
      `${install}\nharfbuzzjs is not the 1.x line this drives: it has no hb_set_invert`,
    );
    expect(fontToolsHelp('no wasm')).toBe(`${install}\nno wasm`);
  });

  it('cuts the font to the names found, the kit\'s web names and the filled names, each once', () => {
    expect(fontNames(['share', 'star'], ['favorite', 'star'])).toEqual([...new Set(['favorite', 'share', ...KIT_WEB_NAMES])].sort());
    expect(fontNames([], [])).toEqual(KIT_WEB_NAMES);
  });

  it('shapes each name in a font of its own fill, the other axes pinned, and answers the glyph ids', () => {
    const fonts: FakeFont[] = [];
    const buffers: FakeBuffer[] = [];
    class FakeFont {
      face: unknown;
      variations: [string, number][] = [];
      constructor(face: unknown) {
        this.face = face;
        fonts.push(this);
      }
      setVariations(variations: {tag: string; value: number}[]) {
        this.variations = variations.map(({tag, value}) => [tag, value]);
      }
    }
    class FakeBuffer {
      text = '';
      guessed = false;
      infos: {codepoint: number}[] = [];
      constructor() {
        buffers.push(this);
      }
      addText(text: string) {
        this.text = text;
      }
      guessSegmentProperties() {
        this.guessed = true;
      }
      getGlyphInfos() {
        return this.infos;
      }
    }
    const hb = {
      Blob: class {
        bytes: Uint8Array;
        constructor(bytes: Uint8Array) {
          this.bytes = bytes;
        }
      },
      Face: class {
        blob: unknown;
        constructor(blob: unknown) {
          this.blob = blob;
        }
      },
      Variation: class {
        tag: string;
        value: number;
        constructor(tag: string, value: number) {
          this.tag = tag;
          this.value = value;
        }
      },
      Font: FakeFont,
      Buffer: FakeBuffer,
      // `star` is a ligature, swapped for its solid glyph at FILL 1; anything else is its letters.
      shape(font: FakeFont, buffer: FakeBuffer) {
        const fill = font.variations.find(([axis]) => axis === 'FILL')![1];
        buffer.infos = buffer.text === 'star' ? [{codepoint: 5590 + fill}] : [...buffer.text].map(char => ({codepoint: char.charCodeAt(0)}));
      },
    };
    const sfnt = new Uint8Array([1, 2]);
    const shape = shaperOf(hb, sfnt);
    expect(shape('star', 0)).toEqual([5590]);
    expect(shape('star', 1)).toEqual([5591]);
    expect(shape('ab', 1)).toEqual([97, 98]);
    // One font for each fill, of one face over the font's bytes, at the kit's axes and that fill.
    expect(fonts.map(font => font.variations)).toEqual(
      FONT_FILLS.map(fill => [['wght', 400], ['GRAD', 0], ['opsz', 24], ['FILL', fill]]),
    );
    expect(fonts[0].face).toBe(fonts[1].face);
    expect(fonts[0].face).toEqual({blob: {bytes: sfnt}});
    expect(buffers.map(buffer => [buffer.text, buffer.guessed])).toEqual([['star', true], ['star', true], ['ab', true]]);
  });

  it('cuts by the plan\'s characters and glyphs, with every layout feature and no layout closure, and frees what it made', () => {
    const {wasm, log, sets, heap} = fakeSubsetter();
    const cut = cutFont(wasm, new Uint8Array([1, 2, 3]), 'ar', [4000, 5591], FONT_AXES);
    expect([...cut]).toEqual([7, 8, 9]);
    // The font is copied into HarfBuzz's memory, and a writable blob made over it.
    expect(heap.slice(8, 11)).toEqual(new Uint8Array([1, 2, 3]));
    expect(log).toContainEqual(['malloc', 3]);
    expect(log).toContainEqual(['hb_blob_create', 8, 3, 2, 0, 0]);
    // Every layout feature stays: the feature set is cleared, then inverted to all of them.
    expect(log).toContainEqual(['hb_subset_input_set', 3, 6]);
    expect(sets[10]).toEqual(['clear', 'invert']);
    // No layout closure, so the kept letters' other ligatures stay out; the input's own flags stay set.
    expect(log).toContainEqual(['hb_subset_input_set_flags', 3, 0x1 | 0x200]);
    // The characters, and the glyphs, by id.
    expect(sets[11]).toEqual([0x61, 0x72]);
    expect(sets[12]).toEqual([4000, 5591]);
    // FILL keeps its range; the other axes are pinned at the kit's defaults.
    expect(log.filter(([name]) => name.includes('_axis_')).map(([name, input, face, axis, ...rest]) => [name, input, face, tagName(axis as number), ...rest])).toEqual([
      ['hb_subset_input_set_axis_range', 3, 2, 'FILL', 0, 1, Number.NaN],
      ['hb_subset_input_pin_axis_location', 3, 2, 'wght', 400],
      ['hb_subset_input_pin_axis_location', 3, 2, 'GRAD', 0],
      ['hb_subset_input_pin_axis_location', 3, 2, 'opsz', 24],
    ]);
    expect(log).toContainEqual(['hb_subset_or_fail', 2, 3]);
    expect(log.filter(([name]) => /destroy|free/.test(name))).toEqual([
      ['hb_blob_destroy', 1],
      ['hb_blob_destroy', 21],
      ['hb_face_destroy', 20],
      ['hb_subset_input_destroy', 3],
      ['hb_face_destroy', 2],
      ['free', 8],
    ]);
  });

  it('throws for an axis the font lacks and for a cut HarfBuzz refuses, and frees what it made either way', () => {
    const noFill = fakeSubsetter({axes: ['wght', 'GRAD', 'opsz']});
    expect(() => cutFont(noFill.wasm, new Uint8Array([1]), 'a', [1], FONT_AXES)).toThrow('the font has no FILL axis');
    const noSize = fakeSubsetter({axes: ['FILL', 'wght', 'GRAD']});
    expect(() => cutFont(noSize.wasm, new Uint8Array([1]), 'a', [1], FONT_AXES)).toThrow('the font has no opsz axis');
    const refused = fakeSubsetter({fails: true});
    expect(() => cutFont(refused.wasm, new Uint8Array([1]), 'a', [1], FONT_AXES)).toThrow('harfbuzz could not cut the font');
    for (const {log} of [noFill, noSize, refused]) {
      expect(log.filter(([name]) => /destroy|free/.test(name))).toEqual([['hb_blob_destroy', 1], ['hb_subset_input_destroy', 3], ['hb_face_destroy', 2], ['free', 8]]);
    }
  });

  it('always writes into the font every name the kit\'s own sources draw on the web through Icon', () => {
    const kit = path.join(__dirname, '..');
    // The names a kit source spells that the web does not draw through `Icon`, by file.
    const elsewhere: Record<string, string[]> = {
      // JSDoc examples.
      'icons.ts': ['share', 'star'],
      'tabs/types.ts': ['home', 'settings'],
      // The native field's `SymbolView`; the web field is the browser's own input, with no glyph of the kit's.
      'search-field/index.tsx': ['cancel', 'search'],
      // Windows draws Segoe, and the native strip is not the one the web draws.
      'screen/header.windows.tsx': ['arrow_back'],
      'tab-view/draw.tsx': ['add', 'close', 'grid_view'],
      // Android's card overflow; the web draws the card's menu with `more_horiz`.
      'card/shared.ts': ['more_vert'],
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

  it('always writes every name the kit\'s own sources draw on Android as a drawable, and the docs list each', () => {
    const kit = path.join(__dirname, '..');
    // The names a kit source spells that Android does not draw through `drawableOf`, by file.
    const elsewhere: Record<string, string[]> = {
      // JSDoc examples.
      'icons.ts': ['share', 'star'],
      'tabs/types.ts': ['home', 'settings'],
      // `SymbolView` and the kit's `Icon`, which draw the font `expo-symbols` ships, never a drawable.
      'search-field/index.tsx': ['cancel', 'search'],
      'tab-view/draw.tsx': ['add', 'close', 'grid_view'],
      // The open action of the drawn header search, which only the web and Windows draw.
      'header-search/shared.ts': ['search'],
      // The web's and Windows' own files.
      'tab-view/index.web.tsx': ['add', 'close', 'grid_view'],
      'screen/header.windows.tsx': ['arrow_back'],
    };
    const names = new Set<string>();
    const filled = new Set<string>();
    for (const file of sourceFiles([kit])) {
      const relative = path.relative(kit, file).split(path.sep).join('/');
      // The stories' tokens stand in for an app's.
      if (relative.startsWith('__stories__/')) continue;
      const found = scanFiles([file]);
      for (const name of found.names) if (!elsewhere[relative]?.includes(name)) names.add(name);
      for (const name of found.filled) if (!elsewhere[relative]?.includes(name)) filled.add(name);
    }
    // A new chrome glyph fails here until KIT_NAMES (and KIT_FILLED, for a solid one) holds it.
    expect([...names].sort()).toEqual(KIT_NAMES);
    expect([...filled].sort()).toEqual(KIT_FILLED);
    // The table of them in the icons page names each, and nothing else.
    const page = readFileSync(path.join(kit, '..', 'docs', 'icons.md'), 'utf8');
    const table = page.split('| Name | Drawn by |')[1].split('\n\n')[0];
    const listed = [...table.matchAll(/^\| ([^|]+) \|/gm)].flatMap(([, cell]) => [...cell.matchAll(/`([a-z0-9_]+)`/g)].map(([, name]) => name));
    expect(listed.sort()).toEqual(KIT_NAMES);
  });

  it('writes the same font face the kit registers, under the kit\'s family or the app\'s', () => {
    expect(fontFaceCSS('/f.woff2')).toBe(getSymbolFontCSS('/f.woff2'));
    expect(fontFaceCSS('/f.woff2', 'App Symbols')).toBe(getSymbolFontCSS('/f.woff2', 'App Symbols'));
    expect(fontFaceCSS('/f.woff2', 'App Symbols')).toContain(':root { --ui-symbol-font: \'App Symbols\'; }');
  });
});
