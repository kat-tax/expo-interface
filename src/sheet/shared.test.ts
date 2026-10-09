import {describe, expect, it} from 'vitest';
import {BLUR_RADIUS, IOS_MATERIAL, MATERIAL_OPACITY, contentPaddingEdges, fillsMaxHeight, hasMaterial, skipsPartiallyExpanded} from './shared';

describe('the material scale', () => {
  it('lets less through as it thickens', () => {
    expect(BLUR_RADIUS.thin).toBeLessThan(BLUR_RADIUS.regular);
    expect(BLUR_RADIUS.regular).toBeLessThan(BLUR_RADIUS.thick);
    // A thin material is mostly what is behind it; a thick one mostly the sheet.
    expect(MATERIAL_OPACITY.thin).toBeLessThan(MATERIAL_OPACITY.regular);
    expect(MATERIAL_OPACITY.regular).toBeLessThan(MATERIAL_OPACITY.thick);
    expect(MATERIAL_OPACITY.thick).toBeLessThan(1);
  });

  it('names each one the way SwiftUI does', () => {
    expect(IOS_MATERIAL).toEqual({thin: 'thin', regular: 'regular', thick: 'thick'});
  });
});

describe('hasMaterial', () => {
  it('is false for a sheet that asked for none, which is the default', () => {
    expect(hasMaterial(undefined)).toBe(false);
    expect(hasMaterial('none')).toBe(false);
    expect(hasMaterial('regular')).toBe(true);
  });
});

describe('contentPaddingEdges', () => {
  const fallback = {top: 0, bottom: 0, left: 16, right: 16};

  it('is the fallback when no padding is given', () => {
    expect(contentPaddingEdges(undefined, fallback)).toBe(fallback);
  });

  it('puts a number on every edge', () => {
    expect(contentPaddingEdges(8, fallback)).toEqual({top: 8, bottom: 8, left: 8, right: 8});
  });

  it('takes what an object says, and 0 for an edge it leaves out', () => {
    expect(contentPaddingEdges({top: 4}, fallback)).toEqual({top: 4, bottom: 0, left: 0, right: 0});
    expect(contentPaddingEdges({top: 1, bottom: 2, left: 3, right: 4}, fallback)).toEqual({top: 1, bottom: 2, left: 3, right: 4});
  });
});

describe('the states an Android sheet opens in', () => {
  it('skips the half-way stop without snap points, so a tall sheet opens whole', () => {
    expect(skipsPartiallyExpanded(undefined)).toBe(true);
    expect(skipsPartiallyExpanded([])).toBe(true);
  });

  it('keeps the stop for a snap point that asks for one: half, a fraction under 1, a height', () => {
    expect(skipsPartiallyExpanded(['half'])).toBe(false);
    expect(skipsPartiallyExpanded([{fraction: 0.4}, 'full'])).toBe(false);
    expect(skipsPartiallyExpanded([{height: 300}])).toBe(false);
    expect(skipsPartiallyExpanded(['full'])).toBe(true);
    expect(skipsPartiallyExpanded([{fraction: 1}])).toBe(true);
  });

  it('fills the window for a full snap point or a fraction of all of it, and fits its content otherwise', () => {
    expect(fillsMaxHeight(undefined)).toBe(false);
    expect(fillsMaxHeight([])).toBe(false);
    expect(fillsMaxHeight(['half'])).toBe(false);
    expect(fillsMaxHeight([{fraction: 0.5}])).toBe(false);
    expect(fillsMaxHeight([{height: 300}])).toBe(false);
    expect(fillsMaxHeight(['full'])).toBe(true);
    expect(fillsMaxHeight([{fraction: 1}])).toBe(true);
  });
});
