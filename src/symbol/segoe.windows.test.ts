import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {CURATED, describeCandidates, generate, readCatalogue, segoeKey} from '../../scripts/segoe-glyphs';
import {SEGOE_GLYPHS} from './segoe';

/** Every `android: '…'` and `web: '…'` Material name in the sources under `roots`, tests left out. */
function materialNamesIn(roots: string[]): string[] {
  const names = new Set<string>();
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') visit(file);
      } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        for (const [, name] of readFileSync(file, 'utf8').matchAll(/\b(?:android|web): '([a-z0-9_]+)'/g)) names.add(name);
      }
    }
  };
  roots.forEach(visit);
  return [...names].sort();
}

describe('SEGOE_GLYPHS (windows)', () => {
  it('is the table the generator writes from the two catalogues', () => {
    expect(SEGOE_GLYPHS).toEqual(generate().table);
  });

  it('draws every Material name the kit, its stories and the example use', () => {
    const names = materialNamesIn([path.resolve(__dirname, '..'), path.resolve(__dirname, '../../example/src')]);
    expect(names.length).toBeGreaterThan(20);
    const missing = names.filter(name => !SEGOE_GLYPHS[name]);
    // The failure says what to do about it. Without this it reads
    // `expected ['sticky_note_2'] to deeply equal []`, which is true and
    // useless: the fix is a line in CURATED, and the hard part is knowing
    // which glyph — so the candidates go in the message.
    expect(missing, missing.length === 0 ? '' : [
      `${missing.length} Material name(s) used here have no Segoe Fluent glyph.`,
      'Add each to CURATED in scripts/segoe-glyphs.ts, then `bun run segoe:windows`.',
      ...missing.map(name => `  ${describeCandidates(name, readCatalogue())}`),
    ].join('\n')).toEqual([]);
  });

  it('names the glyphs to choose from when a name has none', () => {
    const catalogue = readCatalogue();
    expect(describeCandidates('experiment', catalogue)).toBe('experiment: Beaker=F196');
    // A variant asks about its base: nothing is tagged `sticky note 2`, and
    // curating `sticky_note` brings every variant of it along.
    expect(describeCandidates('sticky_note_2', catalogue)).toBe('sticky_note_2: QuickNote=E70B');
    expect(describeCandidates('blender', catalogue)).toBe('blender: no glyph is tagged or named for it');
  });

  it('takes a variant of a name as the same glyph, since Segoe has one per idea', () => {
    // Material draws a concept several ways; Segoe draws it once.
    expect(SEGOE_GLYPHS.sticky_note_2).toEqual(SEGOE_GLYPHS.sticky_note);
    expect(SEGOE_GLYPHS.delete_outline).toEqual(SEGOE_GLYPHS.delete);
    // `_filled` asks for the solid form where the family has one, and then
    // carries no second form of its own — it already is the filled one.
    expect(SEGOE_GLYPHS.home).toEqual(['E80F', 'EA8A']);
    expect(SEGOE_GLYPHS.home_filled).toEqual(['EA8A']);
  });

  it('keeps a solid form only where the family has one', () => {
    expect(SEGOE_GLYPHS.star).toEqual(['E734', 'E735']);
    expect(SEGOE_GLYPHS.settings).toEqual(['E713', 'F8B0']);
    expect(SEGOE_GLYPHS.share).toEqual(['E72D']);
  });

  it('prefers the curated twin over the glyph of the same name', () => {
    // Segoe's `Pin` is the pushpin; Material's `pin` is the PIN pad.
    expect(CURATED.pin).toBe('PINPad');
    expect(SEGOE_GLYPHS.pin).toEqual(['EF3E']);
    expect(SEGOE_GLYPHS.push_pin).toEqual(['E840', 'E842']);
  });

  it('tokenises Segoe names the way Material names are written', () => {
    expect(segoeKey('ZoomIn')).toBe('zoom_in');
    expect(segoeKey('QRCode')).toBe('qr_code');
    expect(segoeKey('Photo2')).toBe('photo_2');
    expect(segoeKey('GIF')).toBe('gif');
  });
});
