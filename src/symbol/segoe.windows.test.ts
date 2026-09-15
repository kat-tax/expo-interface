import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {CURATED, generate, segoeKey} from '../../scripts/segoe-glyphs';
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
    expect(names.filter(name => !SEGOE_GLYPHS[name])).toEqual([]);
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
