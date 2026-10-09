import {readFileSync} from 'node:fs';
import path from 'node:path';
import {render, screen} from '@testing-library/react';
import {Text} from 'react-native';
import {BLUR_RADIUS, MATERIAL_OPACITY} from './shared';
import {Material, materialAttributes, materialProps} from '.';

describe('materialProps (web)', () => {
  it('names the material, its fill and its edge for the stylesheet', () => {
    expect(materialProps('regular', 'element', 'all')).toEqual({dataSet: {material: 'regular', materialFill: 'element', materialEdge: 'all'}});
    expect(materialProps('thin', 'background', 'bottom')).toEqual({dataSet: {material: 'thin', materialFill: 'background', materialEdge: 'bottom'}});
  });

  it('says nothing for no material, which leaves the view its own background', () => {
    expect(materialProps('none', 'element', 'all')).toEqual({});
    expect(materialProps(undefined, 'element', 'all')).toEqual({});
  });

  it('names the same three things as attributes for a DOM element, and nothing for no material', () => {
    expect(materialAttributes('regular', 'element', 'float')).toEqual({'data-material': 'regular', 'data-material-fill': 'element', 'data-material-edge': 'float'});
    expect(materialAttributes('thick', 'background', 'top')).toEqual({'data-material': 'thick', 'data-material-fill': 'background', 'data-material-edge': 'top'});
    expect(materialAttributes('none', 'element', 'float')).toEqual({});
    expect(materialAttributes(undefined, 'element', 'float')).toEqual({});
  });

  it('floats an overlay on the hairline all round and the raised surface\'s shadow', () => {
    const css = readFileSync(path.join(__dirname, 'material.css'), 'utf8');
    const rule = css.slice(css.indexOf('[data-material][data-material-edge="float"]'));
    expect(rule).toContain('box-shadow: inset 0 0 0 1px var(--color-separator), 0 8px 24px rgba(0, 0, 0, 0.18);');
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
    // Each edge but none has a rule.
    for (const edge of ['all', 'top', 'bottom', 'float']) expect(css).toContain(`[data-material][data-material-edge="${edge}"]`);
    expect(css).not.toContain('[data-material-edge="none"]');
  });
});

describe('Material (web)', () => {
  it('draws a view on the stylesheet material, with its children on top', () => {
    render(
      <Material kind="thin" fill="element" edge="all" radius={16} testID="material">
        <Text>Over</Text>
      </Material>,
    );
    const view = screen.getByTestId('material');
    expect(view.dataset).toMatchObject({material: 'thin', materialFill: 'element', materialEdge: 'all'});
    expect(getComputedStyle(view).borderTopLeftRadius).toBe('16px');
    expect(screen.getByText('Over')).toBeTruthy();
  });

  it('is the regular material on the screen fill with no hairline by default, glass the regular one', () => {
    render(
      <>
        <Material testID="plain"/>
        <Material kind="glass" testID="glass"/>
      </>,
    );
    expect(screen.getByTestId('plain').dataset).toMatchObject({material: 'regular', materialFill: 'background', materialEdge: 'none'});
    expect(screen.getByTestId('glass').dataset.material).toBe('regular');
  });
});
