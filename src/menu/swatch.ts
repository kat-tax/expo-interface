/**
 * A color dot as a PNG, for the one menu that only draws images: a SwiftUI
 * `Menu` renders its entries through `UIMenu`, which keeps the colors of an
 * image file where it draws a symbol in the menu's tint. The kit writes the
 * dot once per color (`swatch-file.ios.ts`) and hands the menu the file.
 *
 * The encoder is the smallest PNG there is: one IHDR, one IDAT holding a
 * zlib stream of stored blocks (no compression; a 48 by 48 dot is nine
 * kilobytes, and a menu holds a handful), and IEND, with the CRC and Adler
 * sums the format asks for. The circle is anti-aliased by the distance of
 * each pixel's centre from the dot's edge.
 */

/** The dot's size in pixels: 16 points at the 3x scale UIKit reads from the file's `@3x` name. */
export const SWATCH_PIXELS = 48;

/** The file the dot is kept under, by its color: `swatch-ff0000@3x.png`. */
export function swatchFileName(hex: string): string {
  return `swatch-${hex.replace('#', '').toLowerCase()}@3x.png`;
}

/** The red, green and blue of a `#rgb`, `#rrggbb` or `#rrggbbaa` color; black for anything else. */
export function swatchRgb(hex: string): [number, number, number] {
  let digits = hex.replace('#', '');
  if (digits.length === 3 || digits.length === 4) digits = [...digits].map(c => c + c).join('');
  const value = Number.parseInt(digits.slice(0, 6), 16);
  if (digits.length < 6 || Number.isNaN(value)) return [0, 0, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/** The CRC-32 a PNG chunk carries over its type and data. */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255]! ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/** The Adler-32 a zlib stream ends with. */
export function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function u32(value: number): number[] {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function chunk(type: string, data: number[]): number[] {
  const body = [...[...type].map(c => c.charCodeAt(0)), ...data];
  return [...u32(data.length), ...body, ...u32(crc32(Uint8Array.from(body)))];
}

/** `data` as a zlib stream of stored blocks: a header, blocks of at most 65535 bytes, the Adler sum. */
export function zlibStored(data: Uint8Array): number[] {
  const out = [0x78, 0x01];
  const size = 65535;
  for (let offset = 0; offset < data.length || offset === 0; offset += size) {
    const block = data.subarray(offset, offset + size);
    const last = offset + size >= data.length;
    out.push(last ? 1 : 0, block.length & 255, block.length >> 8, ~block.length & 255, (~block.length >> 8) & 255, ...block);
    if (data.length === 0) break;
  }
  out.push(...u32(adler32(data)));
  return out;
}

/** A PNG of a filled circle in the color, `pixels` wide, transparent around it. */
export function swatchPng(hex: string, pixels = SWATCH_PIXELS): Uint8Array {
  const [r, g, b] = swatchRgb(hex);
  const raw = new Uint8Array(pixels * (1 + pixels * 4));
  const radius = pixels / 2;
  for (let y = 0; y < pixels; y++) {
    const row = y * (1 + pixels * 4);
    raw[row] = 0;
    for (let x = 0; x < pixels; x++) {
      const distance = Math.hypot(x + 0.5 - radius, y + 0.5 - radius);
      // Full inside the edge, nothing a pixel beyond it, a slope in between.
      const coverage = Math.min(1, Math.max(0, radius - distance + 0.5));
      const at = row + 1 + x * 4;
      raw[at] = r;
      raw[at + 1] = g;
      raw[at + 2] = b;
      raw[at + 3] = Math.round(coverage * 255);
    }
  }
  const header = [...u32(pixels), ...u32(pixels), 8, 6, 0, 0, 0];
  return Uint8Array.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    ...chunk('IHDR', header),
    ...chunk('IDAT', zlibStored(raw)),
    ...chunk('IEND', []),
  ]);
}
