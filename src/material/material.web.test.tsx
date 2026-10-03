import {readFileSync} from 'node:fs';
import path from 'node:path';
import {BLUR_RADIUS, MATERIAL_OPACITY} from '../sheet/shared';
import {materialProps} from '.';

describe('materialProps (web)', () => {
  it('names the material, its fill and its edge for the stylesheet', () => {
    expect(materialProps('regular', 'element', 'all')).toEqual({dataSet: {material: 'regular', materialFill: 'element', materialEdge: 'all'}});
    expect(materialProps('thin', 'background', 'bottom')).toEqual({dataSet: {material: 'thin', materialFill: 'background', materialEdge: 'bottom'}});
  });

  it('says nothing for no material, which leaves the view its own background', () => {
    expect(materialProps('none', 'element', 'all')).toEqual({});
    expect(materialProps(undefined, 'element', 'all')).toEqual({});
  });

  it('thins and blurs by the same scale as the sheet', () => {
    // The stylesheet cannot read the constants, so it repeats them: this
    // keeps the two from drifting apart.
    const css = readFileSync(path.join(__dirname, 'material.css'), 'utf8');
    const percent = (opacity: number) => `${Math.round(opacity * 100)}%`;
    expect(css).toContain(`--ui-material-opacity: ${percent(MATERIAL_OPACITY.regular)};`);
    expect(css).toContain(`--ui-material-blur: ${BLUR_RADIUS.regular}px;`);
    for (const thickness of ['thin', 'thick'] as const) {
      const block = css.slice(css.indexOf(`[data-material="${thickness}"]`));
      expect(block).toContain(`--ui-material-opacity: ${percent(MATERIAL_OPACITY[thickness])};`);
      expect(block).toContain(`--ui-material-blur: ${BLUR_RADIUS[thickness]}px;`);
    }
    // Solid where the blur cannot be had or is not wanted.
    expect(css).toContain('@supports not (backdrop-filter: blur(1px))');
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)');
    expect(css).toContain('@media (forced-colors: active)');
  });
});
