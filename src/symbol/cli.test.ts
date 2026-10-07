import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {
  FONT_FAMILY,
  KIT_FILLED,
  KIT_NAMES,
  drawablesModule,
  filledUrl,
  fontFaceCSS,
  identifier,
  outlinedUrl,
  packagedNames,
  scanFiles,
  scanSource,
  sourceFiles,
  stubModule,
  subsetVariableFont,
} from '../../bin/symbols-lib.mjs';

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
    expect(KIT_NAMES).toEqual(['arrow_back', 'arrow_upward', 'close', 'more_horiz', 'star', 'stop']);
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

  it('subsets the variable font to the names, keeping the fill axis and pinning the rest', async () => {
    const subset = vi.fn(async (_font: Buffer, text: string, options: object) => Buffer.from(`${text}|${JSON.stringify(options)}`));
    const result = await subsetVariableFont(new Uint8Array([1, 2]), ['share', 'sticky_note'], subset);
    expect(result.toString()).toContain('share sticky_note share sticky note');
    expect(result.toString()).toContain('"FILL":{"min":0,"max":1}');
    expect(result.toString()).toContain('"wght":400');
  });
});
