/**
 * Android, web and Windows draw a menu's swatch as a colored shape of their
 * own, so no image is ever written: there is no file here. iOS alone has
 * `swatch-file.ios.ts`.
 */
export function swatchImage(_hex: string): string | undefined {
  return undefined;
}

export function forgetSwatches(): void {}
