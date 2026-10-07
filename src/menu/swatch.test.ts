import {adler32, crc32, swatchFileName, swatchPng, swatchRgb, zlibStored} from './swatch';

/** A big-endian 32-bit number at `at`. */
function u32(bytes: Uint8Array, at: number): number {
  return ((bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!) >>> 0;
}

describe('swatch', () => {
  it('names the file by the color at the 3x scale UIKit reads from the name', () => {
    expect(swatchFileName('#FF0000')).toBe('swatch-ff0000@3x.png');
    expect(swatchFileName('abc')).toBe('swatch-abc@3x.png');
  });

  it('reads a color\'s channels, short forms included, and black for nonsense', () => {
    expect(swatchRgb('#FF8000')).toEqual([255, 128, 0]);
    expect(swatchRgb('#F80')).toEqual([255, 136, 0]);
    expect(swatchRgb('#F80F')).toEqual([255, 136, 0]);
    expect(swatchRgb('#FF800080')).toEqual([255, 128, 0]);
    expect(swatchRgb('red')).toEqual([0, 0, 0]);
    expect(swatchRgb('#12')).toEqual([0, 0, 0]);
  });

  it('sums the way PNG and zlib check their bytes', () => {
    // The known checksums of the format's own fixtures.
    expect(crc32(Uint8Array.from([0x49, 0x45, 0x4E, 0x44]))).toBe(0xAE426082);
    expect(adler32(new Uint8Array(0))).toBe(1);
    expect(adler32(Uint8Array.from([0x61, 0x62, 0x63]))).toBe(0x024D0127);
  });

  it('stores data in zlib blocks, the last one marked, and an empty stream as one empty block', () => {
    const empty = zlibStored(new Uint8Array(0));
    expect(empty.slice(0, 7)).toEqual([0x78, 0x01, 1, 0, 0, 255, 255]);
    expect(u32(Uint8Array.from(empty), 7)).toBe(1);
    const long = zlibStored(new Uint8Array(70000));
    // Two blocks: a full one that is not the last, and the rest.
    expect(long[2]).toBe(0);
    expect(long[2 + 5 + 65535]).toBe(1);
  });

  it('encodes a circle in the color, transparent around it, as a valid PNG', () => {
    const png = swatchPng('#FF0000', 8);
    expect(Array.from(png.slice(0, 8))).toEqual([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    // IHDR: 8 by 8, 8 bits, RGBA.
    expect(String.fromCharCode(...png.slice(12, 16))).toBe('IHDR');
    expect(u32(png, 16)).toBe(8);
    expect(u32(png, 20)).toBe(8);
    expect(Array.from(png.slice(24, 29))).toEqual([8, 6, 0, 0, 0]);
    expect(u32(png, 29)).toBe(crc32(png.slice(12, 29)));
    // IDAT's stored scanlines: the centre pixel is opaque red, the corner transparent.
    const idat = 33 + 8;
    const raw = idat + 2 + 5;
    const pixel = (x: number, y: number) => Array.from(png.slice(raw + y * 33 + 1 + x * 4, raw + y * 33 + 1 + x * 4 + 4));
    expect(pixel(4, 4)).toEqual([255, 0, 0, 255]);
    expect(pixel(0, 0)).toEqual([255, 0, 0, 0]);
    expect(String.fromCharCode(...png.slice(png.length - 8, png.length - 4))).toBe('IEND');
    expect(swatchPng('#00FF00').length).toBeGreaterThan(48 * 48 * 4);
  });
});
