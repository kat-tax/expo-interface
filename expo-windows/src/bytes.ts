/**
 * Bytes to and from text, by hand: the runtime's modules hand binary data
 * to the Windows library as base64 (the bridge carries strings), and Hermes
 * has `TextEncoder` but no `TextDecoder` on every version.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const VALUES = new Map([...ALPHABET].map((char, index) => [char, index]));

export function base64Encode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += ALPHABET[triple >> 18] + ALPHABET[(triple >> 12) & 63];
    out += b === undefined ? '=' : ALPHABET[(triple >> 6) & 63];
    out += c === undefined ? '=' : ALPHABET[triple & 63];
  }
  return out;
}

/** The bytes of a base64 string; padding is optional and whitespace ignored, an invalid character throws. */
export function base64Decode(text: string): Uint8Array {
  const chars = text.replace(/[\s=]/g, '');
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of chars) {
    const index = VALUES.get(char);
    if (index === undefined) throw new Error(`Not a base64 character: ${JSON.stringify(char)}`);
    value = (value << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

export function hexEncode(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

export function hexDecode(text: string): Uint8Array {
  if (text.length % 2 || /[^0-9a-fA-F]/.test(text)) throw new Error('Not a hex string');
  const out = new Uint8Array(text.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(text.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** The bytes a buffer or a view holds, as one Uint8Array over them (no copy). */
export function bytesOf(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  return data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

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
