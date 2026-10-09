import type {MaterialThickness} from './types';

/**
 * How far to blur what is behind a material, in pixels, for a platform that
 * takes a length rather than a named material. Chosen against iOS's own
 * materials so a sheet reads about the same on a phone and in a browser.
 */
export const BLUR_RADIUS: Record<Exclude<MaterialThickness, 'none'>, number> = {
  thin: 8,
  regular: 20,
  thick: 40,
};

/**
 * How much of the material's own fill is painted over the blur. A thin
 * material is mostly what is behind it; a thick one is mostly the fill.
 */
export const MATERIAL_OPACITY: Record<Exclude<MaterialThickness, 'none'>, number> = {
  thin: 0.5,
  regular: 0.72,
  thick: 0.88,
};

/** SwiftUI's own name for each of the kit's materials. */
export const IOS_MATERIAL: Record<Exclude<MaterialThickness, 'none'>, 'thin' | 'regular' | 'thick'> = {
  thin: 'thin',
  regular: 'regular',
  thick: 'thick',
};

/** Whether a material was asked for at all. */
export function hasMaterial(material: MaterialThickness | undefined): material is Exclude<MaterialThickness, 'none'> {
  return material != null && material !== 'none';
}
