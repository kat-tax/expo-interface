import type {SharedObject} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';
import type {NativeCrypto} from '../native';
import {base64Decode, base64Encode, bytesOf, hexDecode, hexEncode, utf8Encode} from '../bytes';
import {native, unwrap} from '../native';
import {UnavailabilityError} from './base';

function library(method: string): NativeCrypto {
  const crypto = native.crypto();
  if (!crypto) throw new UnavailabilityError('Crypto', method);
  return crypto;
}

/** `count` bytes from the system's generator. */
export function randomBytes(count: number, method: string): Uint8Array {
  return base64Decode(unwrap(library(method).randomBytes(count)));
}

/** A version 4 UUID from 16 random bytes (RFC 4122 §4.4). */
export function uuidFromBytes(bytes: Uint8Array): string {
  const b = bytes.slice(0, 16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = hexEncode(b);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * `ExpoCrypto`, what `expo-crypto` hashes and draws random bytes through:
 * the system's `HashAlgorithmProvider` (MD5, SHA-1, SHA-256, SHA-384,
 * SHA-512; MD2 and MD4 are Apple's) and `CryptographicBuffer.GenerateRandom`,
 * over the runtime's library. The bytes cross as base64. Without the
 * library nothing here pretends: `Math.random` is not a source of secrets.
 */
export const ExpoCrypto = {
  async digestAsync(algorithm: string, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer> {
    const hash = base64Decode(unwrap(library('digest').digest(algorithm, base64Encode(bytesOf(data)))));
    return hash.buffer as ArrayBuffer;
  },
  async digestStringAsync(algorithm: string, text: string, options?: {encoding?: 'hex' | 'base64'}): Promise<string> {
    const hash = unwrap(library('digestStringAsync').digest(algorithm, base64Encode(utf8Encode(text))));
    return options?.encoding === 'base64' ? hash : hexEncode(base64Decode(hash));
  },
  getRandomValues<T extends ArrayBufferView>(array: T): T {
    bytesOf(array).set(randomBytes(array.byteLength, 'getRandomValues'));
    return array;
  },
  randomUUID(): string {
    return uuidFromBytes(randomBytes(16, 'randomUUID'));
  },
};

/** What the package hands over: bytes, or base64 in a string. */
export type Binary = Uint8Array | ArrayBuffer | string;
type Encoding = 'hex' | 'base64';
type SealedConfig = {ivLength: number; tagLength: number};

const DEFAULT_IV_LENGTH = 12;
const DEFAULT_TAG_LENGTH = 16;
const KEY_SIZES = [16, 24, 32];

function toBytes(input: Binary): Uint8Array {
  return typeof input === 'string' ? base64Decode(input) : bytesOf(input);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function out(bytes: Uint8Array, encoding?: 'bytes' | 'base64'): Uint8Array | string {
  return encoding === 'base64' ? base64Encode(bytes) : bytes.slice();
}

function coded(code: string, message: string): Error & {code: string} {
  return Object.assign(new Error(message), {code});
}

export interface ExpoCryptoAesModule {
  EncryptionKey: {
    generate(size?: number): Promise<object>;
    import(input: Binary, encoding?: Encoding): Promise<object>;
  };
  SealedData: {
    fromCombined(combined: Binary, config?: SealedConfig): object;
    fromParts(iv: Binary, ciphertext: Binary, tag?: Binary | number): object;
  };
  encryptAsync(plaintext: Binary, key: object, options?: {nonce?: number | Binary; tagLength?: number; additionalData?: Binary}): Promise<object>;
  decryptAsync(sealed: object, key: object, options?: {output?: 'bytes' | 'base64'; additionalData?: Binary}): Promise<Uint8Array | string>;
}

/**
 * `ExpoCryptoAES`, the AES-GCM half of `expo-crypto`: the key and the
 * sealed data as objects the package subclasses, their bytes held in
 * JavaScript the way the package's own web module holds them, and the
 * cipher itself over the runtime's library (`CryptographicEngine`'s
 * authenticated encryption). Windows takes tags of 12 to 16 bytes; a
 * shorter tag is refused at decryption.
 */
export function createCryptoAesModule(): ExpoCryptoAesModule {
  const Shared = globalThis.expo.SharedObject as typeof SharedObject;
  const keyBytes = new WeakMap<object, Uint8Array>();
  const keyOf = (key: object, method: string): string => {
    const bytes = keyBytes.get(key);
    if (!bytes) throw coded('ERR_INVALID_KEY', `${method} wants a key from AESEncryptionKey.generate or import`);
    return base64Encode(bytes);
  };

  class EncryptionKey extends Shared {
    private constructor(bytes: Uint8Array) {
      super();
      keyBytes.set(this, bytes);
    }
    static async generate(size = 256): Promise<EncryptionKey> {
      if (!KEY_SIZES.includes(size / 8)) throw coded('ERR_INVALID_KEY_SIZE', `An AES key is 128, 192 or 256 bits, not ${size}`);
      return new EncryptionKey(randomBytes(size / 8, 'AESEncryptionKey.generate'));
    }
    static async import(input: Binary, encoding?: Encoding): Promise<EncryptionKey> {
      const bytes = typeof input === 'string' ? (encoding === 'base64' ? base64Decode(input) : hexDecode(input)) : bytesOf(input).slice();
      if (!KEY_SIZES.includes(bytes.length)) throw coded('ERR_INVALID_KEY_SIZE', `An AES key is 16, 24 or 32 bytes, not ${bytes.length}`);
      return new EncryptionKey(bytes);
    }
    async bytes(): Promise<Uint8Array> {
      return (keyBytes.get(this) as Uint8Array).slice();
    }
    async encoded(encoding: Encoding): Promise<string> {
      const bytes = keyBytes.get(this) as Uint8Array;
      return encoding === 'base64' ? base64Encode(bytes) : hexEncode(bytes);
    }
    get size(): number {
      return (keyBytes.get(this) as Uint8Array).length * 8;
    }
  }

  class SealedData extends Shared {
    private constructor(
      private readonly data: Uint8Array,
      private readonly config: SealedConfig,
    ) {
      super();
    }
    static fromCombined(combined: Binary, config: SealedConfig = {ivLength: DEFAULT_IV_LENGTH, tagLength: DEFAULT_TAG_LENGTH}): SealedData {
      const bytes = toBytes(combined).slice();
      if (bytes.length < config.ivLength + config.tagLength) {
        throw coded('ERR_INVALID_SEALED_DATA_CONFIG', `Sealed data is ${bytes.length} bytes, too short to hold a ${config.ivLength}-byte IV and a ${config.tagLength}-byte tag`);
      }
      return new SealedData(bytes, config);
    }
    static fromParts(iv: Binary, ciphertext: Binary, tag?: Binary | number): SealedData {
      const ivBytes = toBytes(iv);
      const cipher = toBytes(ciphertext);
      if (tag === undefined || typeof tag === 'number') {
        return new SealedData(concat([ivBytes, cipher]), {ivLength: ivBytes.length, tagLength: tag ?? DEFAULT_TAG_LENGTH});
      }
      const tagBytes = toBytes(tag);
      return new SealedData(concat([ivBytes, cipher, tagBytes]), {ivLength: ivBytes.length, tagLength: tagBytes.length});
    }
    get ivSize(): number {
      return this.config.ivLength;
    }
    get tagSize(): number {
      return this.config.tagLength;
    }
    get combinedSize(): number {
      return this.data.length;
    }
    async iv(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string> {
      return out(this.data.subarray(0, this.ivSize), encoding);
    }
    async tag(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string> {
      const offset = this.combinedSize - this.tagSize;
      return out(this.data.subarray(offset, offset + this.tagSize), encoding);
    }
    async combined(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string> {
      return out(this.data, encoding);
    }
    async ciphertext(options?: {includeTag?: boolean; encoding?: 'bytes' | 'base64'}): Promise<Uint8Array | string> {
      const tagged = this.combinedSize - this.ivSize;
      const length = options?.includeTag ? tagged : tagged - this.tagSize;
      return out(this.data.subarray(this.ivSize, this.ivSize + length), options?.encoding);
    }
  }

  return {
    EncryptionKey,
    SealedData,
    async encryptAsync(plaintext, key, options = {}) {
      const crypto = library('aesEncryptAsync');
      const nonce = options.nonce ?? DEFAULT_IV_LENGTH;
      const iv = typeof nonce === 'number' ? randomBytes(nonce, 'aesEncryptAsync') : toBytes(nonce);
      const aad = options.additionalData === undefined ? '' : base64Encode(toBytes(options.additionalData));
      const {ciphertext, tag} = await crypto.aesGcmEncrypt(keyOf(key, 'aesEncryptAsync'), base64Encode(iv), base64Encode(toBytes(plaintext)), aad);
      return SealedData.fromParts(iv, base64Decode(ciphertext), base64Decode(tag).subarray(0, options.tagLength ?? DEFAULT_TAG_LENGTH));
    },
    async decryptAsync(sealed, key, options = {}) {
      const crypto = library('aesDecryptAsync');
      const data = sealed as SealedData;
      const aad = options.additionalData === undefined ? '' : base64Encode(toBytes(options.additionalData));
      const plaintext = await crypto.aesGcmDecrypt(
        keyOf(key, 'aesDecryptAsync'),
        (await data.iv('base64')) as string,
        (await data.ciphertext({encoding: 'base64'})) as string,
        (await data.tag('base64')) as string,
        aad,
      );
      return options.output === 'base64' ? plaintext : base64Decode(plaintext);
    },
  };
}
