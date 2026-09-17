import type {SharedObject} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';

export type BlobPart = string | ArrayBuffer | ArrayBufferView | {readonly size: number};
export type BlobOptions = {type?: string; endings?: 'transparent' | 'native'};

/** UTF-8, by hand: Hermes has `TextEncoder` but no `TextDecoder` on every version. */
export function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (code >= 0xd800 && code <= 0xdfff) code = 0xfffd; // a lone surrogate
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  return Uint8Array.from(out);
}

export function utf8Decode(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; ) {
    const first = bytes[i];
    const length = first < 0x80 ? 1 : first >> 5 === 0b110 ? 2 : first >> 4 === 0b1110 ? 3 : first >> 3 === 0b11110 ? 4 : 0;
    let code = length === 1 ? first : length === 2 ? first & 0x1f : length === 3 ? first & 0x0f : first & 0x07;
    let valid = length > 0 && i + length <= bytes.length;
    for (let j = 1; valid && j < length; j++) {
      const next = bytes[i + j];
      if (next >> 6 !== 0b10) valid = false;
      else code = (code << 6) | (next & 0x3f);
    }
    if (!valid) {
      text += '�';
      i++;
      continue;
    }
    text += String.fromCodePoint(code);
    i += length;
  }
  return text;
}

const bytesOf = new WeakMap<object, Uint8Array>();

function partBytes(part: BlobPart, endings: BlobOptions['endings']): Uint8Array {
  if (typeof part === 'string') return utf8Encode(endings === 'native' ? part.replace(/\r\n|\r|\n/g, '\r\n') : part);
  if (part instanceof ArrayBuffer) return new Uint8Array(part.slice(0));
  if (ArrayBuffer.isView(part)) return new Uint8Array(part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength));
  return bytesOf.get(part) ?? new Uint8Array(0);
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** A slice index the way `Blob.slice` reads one: negative from the end, clamped. */
function index(value: number | undefined, size: number, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Math.trunc(value) || 0;
  return n < 0 ? Math.max(size + n, 0) : Math.min(n, size);
}

export interface BlobLike {
  readonly size: number;
  readonly type: string;
  slice(start?: number, end?: number, contentType?: string): BlobLike;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
}

export interface ExpoBlobModule {
  Blob: new (parts?: BlobPart[], options?: BlobOptions) => InstanceType<typeof SharedObject> & BlobLike;
}

/**
 * `ExpoBlob`, the class `expo-blob`'s `Blob` extends: the bytes of its
 * parts, held in JavaScript. iOS and Android keep them native and web uses
 * the browser's `Blob`; Hermes has no `Blob` of its own, so the bytes live
 * here, joined once at construction — strings as UTF-8, with the line
 * endings made Windows' own when asked — and copied out on every read, as
 * the specification wants. The package adds `stream`, `arrayBuffer` and the
 * subclass behaviour on top.
 */
export function createBlobModule(): ExpoBlobModule {
  const Shared = globalThis.expo.SharedObject as typeof SharedObject;
  class Blob extends Shared {
    readonly size: number;
    readonly type: string;

    constructor(parts: BlobPart[] = [], options: BlobOptions = {}) {
      super();
      const bytes = concat(parts.map(part => partBytes(part, options.endings)));
      bytesOf.set(this, bytes);
      this.size = bytes.length;
      this.type = options.type ?? '';
    }

    slice(start?: number, end?: number, contentType = ''): Blob {
      const bytes = bytesOf.get(this) as Uint8Array;
      const from = index(start, this.size, 0);
      const to = Math.max(index(end, this.size, this.size), from);
      return new Blob([bytes.subarray(from, to)], {type: contentType});
    }

    async bytes(): Promise<Uint8Array> {
      return (bytesOf.get(this) as Uint8Array).slice();
    }

    async text(): Promise<string> {
      return utf8Decode(bytesOf.get(this) as Uint8Array);
    }
  }
  return {Blob};
}
