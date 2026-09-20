/**
 * Just enough PNG to compare two screenshots, on Node's own zlib.
 *
 * The alternative was two dependencies (`pngjs` and `pixelmatch`) for what is
 * a chunk walk, an inflate and five filter cases. Every screenshot the harness
 * takes comes from Chromium, GDI+ or `adb`, which all write 8-bit non-interlaced
 * PNGs, so those are what this reads; anything else says so rather than
 * returning wrong pixels.
 */
import zlib from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface Image {
  width: number;
  height: number;
  /** Row-major RGBA, four bytes a pixel. */
  pixels: Buffer;
}

/** Channels per pixel for the colour types this reads. */
const CHANNELS: Record<number, number> = {0: 1, 2: 3, 4: 2, 6: 4};

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function decodePng(buffer: Buffer): Image {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG');
  let at = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let interlace = 0;
  const data: Buffer[] = [];
  let palette: Buffer | null = null;
  while (at + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(at);
    const type = buffer.toString('ascii', at + 4, at + 8);
    const body = buffer.subarray(at + 8, at + 8 + length);
    at += 12 + length;
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8] ?? 0;
      colorType = body[9] ?? 0;
      interlace = body[12] ?? 0;
    } else if (type === 'PLTE') {
      palette = Buffer.from(body);
    } else if (type === 'IDAT') {
      data.push(Buffer.from(body));
    } else if (type === 'IEND') {
      break;
    }
  }
  if (depth !== 8) throw new Error(`this reads 8-bit PNGs; this one is ${depth}-bit`);
  if (interlace !== 0) throw new Error('this reads non-interlaced PNGs');
  const channels = colorType === 3 ? 1 : CHANNELS[colorType];
  if (!channels) throw new Error(`unsupported PNG colour type ${colorType}`);
  if (colorType === 3 && !palette) throw new Error('a palette PNG without a palette');

  const raw = zlib.inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  const line = Buffer.alloc(stride);
  const previous = Buffer.alloc(stride);
  let read = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[read++] ?? 0;
    raw.copy(line, 0, read, read + stride);
    read += stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? (line[x - channels] ?? 0) : 0;
      const up = previous[x] ?? 0;
      const upLeft = x >= channels ? (previous[x - channels] ?? 0) : 0;
      const value = line[x] ?? 0;
      let restored = value;
      if (filter === 1) restored = value + left;
      else if (filter === 2) restored = value + up;
      else if (filter === 3) restored = value + ((left + up) >> 1);
      else if (filter === 4) restored = value + paeth(left, up, upLeft);
      line[x] = restored & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const source = x * channels;
      const target = (y * width + x) * 4;
      if (colorType === 6) {
        line.copy(pixels, target, source, source + 4);
      } else if (colorType === 2) {
        line.copy(pixels, target, source, source + 3);
        pixels[target + 3] = 255;
      } else if (colorType === 0) {
        const grey = line[source] ?? 0;
        pixels.fill(grey, target, target + 3);
        pixels[target + 3] = 255;
      } else if (colorType === 4) {
        const grey = line[source] ?? 0;
        pixels.fill(grey, target, target + 3);
        pixels[target + 3] = line[source + 1] ?? 255;
      } else {
        const entry = (line[source] ?? 0) * 3;
        pixels[target] = palette?.[entry] ?? 0;
        pixels[target + 1] = palette?.[entry + 1] ?? 0;
        pixels[target + 2] = palette?.[entry + 2] ?? 0;
        pixels[target + 3] = 255;
      }
    }
    line.copy(previous);
  }
  return {width, height, pixels};
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

/** An RGBA image as a PNG, for the diff a failing comparison leaves behind. */
export function encodePng({width, height, pixels}: Image): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([SIGNATURE, chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

export interface Comparison {
  /** Whether the two are the same size at all. */
  comparable: boolean;
  width: number;
  height: number;
  different: number;
  total: number;
  /** Differing pixels as a fraction of the whole, 0 to 1. */
  ratio: number;
  /** What differs, in red over a faded copy; only when something does. */
  diff?: Buffer;
  reason?: string;
}

/**
 * Two screenshots compared pixel by pixel. `tolerance` is how far a single
 * channel may drift before a pixel counts as different, which absorbs the
 * one-off rounding that text rendering produces between runs.
 */
export function comparePng(before: Buffer, after: Buffer, {tolerance = 8}: {tolerance?: number} = {}): Comparison {
  const a = decodePng(before);
  const b = decodePng(after);
  if (a.width !== b.width || a.height !== b.height) {
    return {
      comparable: false,
      width: b.width,
      height: b.height,
      different: 0,
      total: 0,
      ratio: 1,
      reason: `the baseline is ${a.width}x${a.height} and this is ${b.width}x${b.height}`,
    };
  }
  const total = a.width * a.height;
  const diff = Buffer.alloc(total * 4);
  let different = 0;
  for (let at = 0; at < total; at++) {
    const p = at * 4;
    const apart =
      Math.abs((a.pixels[p] ?? 0) - (b.pixels[p] ?? 0)) > tolerance ||
      Math.abs((a.pixels[p + 1] ?? 0) - (b.pixels[p + 1] ?? 0)) > tolerance ||
      Math.abs((a.pixels[p + 2] ?? 0) - (b.pixels[p + 2] ?? 0)) > tolerance ||
      Math.abs((a.pixels[p + 3] ?? 0) - (b.pixels[p + 3] ?? 0)) > tolerance;
    if (apart) {
      different++;
      diff[p] = 255;
      diff[p + 1] = 0;
      diff[p + 2] = 0;
      diff[p + 3] = 255;
    } else {
      // The unchanged picture, faded, so the red reads against it.
      diff[p] = 255 - ((255 - (b.pixels[p] ?? 0)) >> 2);
      diff[p + 1] = 255 - ((255 - (b.pixels[p + 1] ?? 0)) >> 2);
      diff[p + 2] = 255 - ((255 - (b.pixels[p + 2] ?? 0)) >> 2);
      diff[p + 3] = 255;
    }
  }
  return {
    comparable: true,
    width: a.width,
    height: a.height,
    different,
    total,
    ratio: total === 0 ? 0 : different / total,
    diff: different > 0 ? encodePng({width: a.width, height: a.height, pixels: diff}) : undefined,
  };
}
