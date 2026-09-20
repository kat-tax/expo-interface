import {describe, expect, it} from 'vitest';
import {BLUR_RADIUS, IOS_MATERIAL, MATERIAL_OPACITY, hasMaterial} from './shared';

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
