import zlib from 'node:zlib';
import {describe, expect, it} from 'vitest';
import {comparePng, decodePng, encodePng} from './png.ts';
import type {Image} from './png.ts';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A PNG built by hand, so the decoder is read against something it did not write. */
function build(width: number, height: number, colorType: number, rows: number[][], {depth = 8, interlace = 0, palette}: {depth?: number; interlace?: number; palette?: number[]} = {}): Buffer {
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  const crc = (buffer: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buffer) c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, body: Buffer) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length, 0);
    head.write(type, 4, 'ascii');
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, tail]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = depth;
  header[9] = colorType;
  header[12] = interlace;
  const parts = [SIGNATURE, chunk('IHDR', header)];
  if (palette) parts.push(chunk('PLTE', Buffer.from(palette)));
  parts.push(chunk('IDAT', zlib.deflateSync(Buffer.from(rows.flat()))));
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

function image(width: number, height: number, fill: [number, number, number, number]): Image {
  const pixels = Buffer.alloc(width * height * 4);
  for (let at = 0; at < width * height; at++) pixels.set(fill, at * 4);
  return {width, height, pixels};
}

describe('decodePng', () => {
  it('round-trips what encodePng writes', () => {
    const original = image(4, 3, [10, 20, 30, 255]);
    original.pixels.set([1, 2, 3, 4], 0);
    const decoded = decodePng(encodePng(original));
    expect(decoded.width).toBe(4);
    expect(decoded.height).toBe(3);
    expect(Buffer.compare(decoded.pixels, original.pixels)).toBe(0);
  });

  it('reads the colour types a screenshot arrives in', () => {
    // Truecolour without alpha, as GDI+ writes it: filter byte then RGB.
    const rgb = decodePng(build(2, 1, 2, [[0, 255, 0, 0, 0, 0, 255]]));
    expect([...rgb.pixels]).toEqual([255, 0, 0, 255, 0, 0, 255, 255]);
    // Greyscale, and greyscale with alpha.
    expect([...decodePng(build(1, 1, 0, [[0, 128]])).pixels]).toEqual([128, 128, 128, 255]);
    expect([...decodePng(build(1, 1, 4, [[0, 128, 64]])).pixels]).toEqual([128, 128, 128, 64]);
    // Palette.
    expect([...decodePng(build(1, 1, 3, [[0, 1]], {palette: [0, 0, 0, 9, 8, 7]})).pixels]).toEqual([9, 8, 7, 255]);
  });

  it('undoes every scanline filter', () => {
    // Greyscale rows of three, one per filter, each restoring to known values.
    // Worked through by hand from the PNG specification, so the decoder is
    // checked against the format rather than against itself.
    const png = build(3, 6, 0, [
      [0, 10, 20, 30], // None:    as written
      [1, 5, 5, 5], // Sub:     each byte adds the one restored to its left
      [2, 1, 2, 3], // Up:      adds the row above
      [0, 5, 5, 5], // None:    a flat row, to set the next one up
      [4, 2, 0, 0], // Paeth:   picks the row above, then the byte to the left
      [3, 0, 0, 0], // Average: half of left plus above, rounded down
    ]);
    const {pixels} = decodePng(png);
    const row = (y: number) => [0, 1, 2].map(x => pixels[(y * 3 + x) * 4]);
    expect(row(0)).toEqual([10, 20, 30]);
    expect(row(1)).toEqual([5, 10, 15]);
    expect(row(2)).toEqual([6, 12, 18]);
    expect(row(3)).toEqual([5, 5, 5]);
    expect(row(4)).toEqual([7, 7, 7]);
    expect(row(5)).toEqual([3, 5, 6]);
  });

  it('refuses what it cannot read, rather than returning wrong pixels', () => {
    expect(() => decodePng(Buffer.from('not a png'))).toThrow(/not a PNG/);
    expect(() => decodePng(build(1, 1, 0, [[0, 0]], {depth: 16}))).toThrow(/8-bit/);
    expect(() => decodePng(build(1, 1, 0, [[0, 0]], {interlace: 1}))).toThrow(/non-interlaced/);
    expect(() => decodePng(build(1, 1, 7, [[0, 0]]))).toThrow(/colour type/);
    expect(() => decodePng(build(1, 1, 3, [[0, 0]]))).toThrow(/palette/);
  });
});

describe('comparePng', () => {
  it('says nothing differs between a picture and itself', () => {
    const png = encodePng(image(3, 3, [1, 2, 3, 255]));
    const result = comparePng(png, png);
    expect(result).toMatchObject({comparable: true, different: 0, total: 9, ratio: 0});
    expect(result.diff).toBeUndefined();
  });

  it('counts what differs and draws it', () => {
    const before = image(2, 1, [0, 0, 0, 255]);
    const after = image(2, 1, [0, 0, 0, 255]);
    after.pixels.set([255, 255, 255, 255], 0);
    const result = comparePng(encodePng(before), encodePng(after));
    expect(result.different).toBe(1);
    expect(result.ratio).toBe(0.5);
    // The diff is a readable PNG with the changed pixel in red.
    const drawn = decodePng(result.diff as Buffer);
    expect([...drawn.pixels.subarray(0, 4)]).toEqual([255, 0, 0, 255]);
  });

  it('lets a channel drift within the tolerance, which text rendering needs', () => {
    const before = encodePng(image(2, 1, [100, 100, 100, 255]));
    const after = encodePng(image(2, 1, [104, 100, 100, 255]));
    expect(comparePng(before, after, {tolerance: 8}).different).toBe(0);
    expect(comparePng(before, after, {tolerance: 2}).different).toBe(2);
  });

  it('will not compare two different sizes, and says why', () => {
    const result = comparePng(encodePng(image(2, 2, [0, 0, 0, 255])), encodePng(image(3, 2, [0, 0, 0, 255])));
    expect(result.comparable).toBe(false);
    expect(result.ratio).toBe(1);
    expect(result.reason).toMatch(/2x2 and this is 3x2/);
  });
});
