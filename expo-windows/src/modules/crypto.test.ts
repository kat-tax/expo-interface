import {TurboModuleRegistry} from 'react-native';
import {base64Decode, base64Encode, utf8Encode} from '../bytes';
import {createCryptoAesModule, ExpoCrypto, uuidFromBytes} from './crypto';

/** A library that hashes by length, draws counted bytes, and "encrypts" by reversing. */
function withLibrary() {
  let next = 1;
  const library = {
    digest: vi.fn((algorithm: string, data: string) => {
      if (algorithm === 'MD4') return {error: 'The digest algorithm MD4 is not available on Windows'};
      const bytes = base64Decode(data);
      return {value: base64Encode(Uint8Array.from([bytes.length, algorithm.length]))};
    }),
    randomBytes: vi.fn((count: number) => ({value: base64Encode(Uint8Array.from({length: count}, () => next++ & 0xff))})),
    aesGcmEncrypt: vi.fn(async (_key: string, _iv: string, plaintext: string, aad: string) => ({
      ciphertext: base64Encode(base64Decode(plaintext).reverse()),
      tag: base64Encode(Uint8Array.from({length: 16}, (_, i) => i + aad.length)),
    })),
    aesGcmDecrypt: vi.fn(async (_key: string, _iv: string, ciphertext: string) => base64Encode(base64Decode(ciphertext).reverse())),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsCrypto' ? library : null) as never);
  return library;
}

describe('ExpoCrypto (windows)', () => {
  it('hashes bytes and text through the library, as bytes, hex or base64', async () => {
    const library = withLibrary();
    const digest = await ExpoCrypto.digestAsync('SHA-256', new Uint8Array([1, 2, 3]));
    expect(digest).toBeInstanceOf(ArrayBuffer);
    expect([...new Uint8Array(digest)]).toEqual([3, 7]);
    expect(library.digest).toHaveBeenCalledWith('SHA-256', base64Encode(new Uint8Array([1, 2, 3])));
    await ExpoCrypto.digestAsync('SHA-1', new Uint8Array([9, 9, 9, 9]).buffer);
    expect(library.digest).toHaveBeenLastCalledWith('SHA-1', base64Encode(new Uint8Array([9, 9, 9, 9])));
    await expect(ExpoCrypto.digestStringAsync('SHA-512', 'héllo')).resolves.toBe('0607');
    expect(library.digest).toHaveBeenLastCalledWith('SHA-512', base64Encode(utf8Encode('héllo')));
    await expect(ExpoCrypto.digestStringAsync('MD5', 'x', {encoding: 'base64'})).resolves.toBe(base64Encode(Uint8Array.from([1, 3])));
    await expect(ExpoCrypto.digestStringAsync('MD4', 'x')).rejects.toThrow(/MD4 is not available/);
  });

  it('fills an array with the library\'s random bytes and makes a version 4 UUID of sixteen', () => {
    withLibrary();
    const array = new Uint16Array(2);
    expect(ExpoCrypto.getRandomValues(array)).toBe(array);
    expect([...new Uint8Array(array.buffer)]).toEqual([1, 2, 3, 4]);
    expect(ExpoCrypto.randomUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidFromBytes(new Uint8Array(16))).toBe('00000000-0000-4000-8000-000000000000');
    expect(uuidFromBytes(new Uint8Array(16).fill(0xff))).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });

  it('pretends nothing without the library', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(ExpoCrypto.digestAsync('SHA-256', new Uint8Array(1))).rejects.toThrow(/Crypto\.digest/);
    await expect(ExpoCrypto.digestStringAsync('SHA-256', 'x')).rejects.toThrow(/Crypto\.digestStringAsync/);
    expect(() => ExpoCrypto.getRandomValues(new Uint8Array(1))).toThrow(/Crypto\.getRandomValues/);
    expect(() => ExpoCrypto.randomUUID()).toThrow(/Crypto\.randomUUID/);
  });
});

describe('ExpoCryptoAES (windows)', () => {
  it('generates, imports and encodes keys of the AES sizes', async () => {
    withLibrary();
    const {EncryptionKey} = createCryptoAesModule();
    const key = await EncryptionKey.generate();
    expect((key as {size: number}).size).toBe(256);
    expect((await (key as {bytes(): Promise<Uint8Array>}).bytes()).length).toBe(32);
    expect((await EncryptionKey.generate(128) as {size: number}).size).toBe(128);
    await expect(EncryptionKey.generate(100)).rejects.toMatchObject({code: 'ERR_INVALID_KEY_SIZE'});
    const imported = (await EncryptionKey.import('00'.repeat(16))) as {size: number; encoded(encoding: 'hex' | 'base64'): Promise<string>};
    expect(imported.size).toBe(128);
    await expect(imported.encoded('hex')).resolves.toBe('00'.repeat(16));
    await expect(imported.encoded('base64')).resolves.toBe(base64Encode(new Uint8Array(16)));
    const fromBase64 = (await EncryptionKey.import(base64Encode(new Uint8Array(24)), 'base64')) as {size: number};
    expect(fromBase64.size).toBe(192);
    const fromBytes = (await EncryptionKey.import(new Uint8Array(32))) as {size: number};
    expect(fromBytes.size).toBe(256);
    await expect(EncryptionKey.import(new Uint8Array(5))).rejects.toMatchObject({code: 'ERR_INVALID_KEY_SIZE'});
    expect(key).toBeInstanceOf(globalThis.expo.SharedObject);
  });

  it('holds sealed data as one buffer and hands out its parts', async () => {
    withLibrary();
    const {SealedData} = createCryptoAesModule();
    type Sealed = {
      ivSize: number;
      tagSize: number;
      combinedSize: number;
      iv(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string>;
      tag(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string>;
      combined(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string>;
      ciphertext(options?: {includeTag?: boolean; encoding?: 'bytes' | 'base64'}): Promise<Uint8Array | string>;
    };
    const iv = new Uint8Array([1, 2, 3]);
    const cipher = new Uint8Array([4, 5]);
    const tag = new Uint8Array([6, 7, 8, 9]);
    const parts = SealedData.fromParts(iv, cipher, tag) as Sealed;
    expect([parts.ivSize, parts.tagSize, parts.combinedSize]).toEqual([3, 4, 9]);
    expect([...((await parts.iv()) as Uint8Array)]).toEqual([1, 2, 3]);
    expect(await parts.iv('base64')).toBe(base64Encode(iv));
    expect([...((await parts.tag()) as Uint8Array)]).toEqual([6, 7, 8, 9]);
    expect(await parts.tag('base64')).toBe(base64Encode(tag));
    expect([...((await parts.ciphertext()) as Uint8Array)]).toEqual([4, 5]);
    expect([...((await parts.ciphertext({includeTag: true})) as Uint8Array)]).toEqual([4, 5, 6, 7, 8, 9]);
    expect(await parts.ciphertext({encoding: 'base64'})).toBe(base64Encode(cipher));
    expect([...((await parts.combined()) as Uint8Array)]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(await parts.combined('base64')).toBe(base64Encode(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])));
    // Ciphertext with the tag inside it, and the tag's length given or the default.
    const tagged = SealedData.fromParts(iv, new Uint8Array([4, 5, 6, 7, 8, 9]), 4) as Sealed;
    expect([tagged.ivSize, tagged.tagSize, tagged.combinedSize]).toEqual([3, 4, 9]);
    expect((SealedData.fromParts(base64Encode(iv), base64Encode(new Uint8Array(20))) as Sealed).tagSize).toBe(16);
    // The combined form, read back with the default or a given layout.
    const combined = SealedData.fromCombined(new Uint8Array(30)) as Sealed;
    expect([combined.ivSize, combined.tagSize]).toEqual([12, 16]);
    expect((SealedData.fromCombined(base64Encode(new Uint8Array(9)), {ivLength: 3, tagLength: 4}) as Sealed).combinedSize).toBe(9);
    expect(() => SealedData.fromCombined(new Uint8Array(5))).toThrow(expect.objectContaining({code: 'ERR_INVALID_SEALED_DATA_CONFIG'}));
  });

  it('seals and opens through the library, with a drawn or given nonce, additional data and a tag length', async () => {
    const library = withLibrary();
    const module = createCryptoAesModule();
    const key = await module.EncryptionKey.import(new Uint8Array(16));
    const sealed = (await module.encryptAsync(new Uint8Array([10, 11, 12]), key)) as {ivSize: number; tagSize: number; combined(): Promise<Uint8Array>};
    expect([sealed.ivSize, sealed.tagSize]).toEqual([12, 16]);
    expect([...(await sealed.combined())].slice(12, 15)).toEqual([12, 11, 10]);
    expect(library.aesGcmEncrypt).toHaveBeenCalledWith(base64Encode(new Uint8Array(16)), expect.any(String), base64Encode(new Uint8Array([10, 11, 12])), '');
    const given = (await module.encryptAsync(base64Encode(new Uint8Array([1])), key, {nonce: new Uint8Array([7, 7]), tagLength: 12, additionalData: base64Encode(new Uint8Array([3]))})) as {ivSize: number; tagSize: number; iv(): Promise<Uint8Array>};
    expect([given.ivSize, given.tagSize]).toEqual([2, 12]);
    expect([...(await given.iv())]).toEqual([7, 7]);
    expect(library.aesGcmEncrypt).toHaveBeenLastCalledWith(expect.any(String), base64Encode(new Uint8Array([7, 7])), base64Encode(new Uint8Array([1])), base64Encode(new Uint8Array([3])));
    const withLength = (await module.encryptAsync(new Uint8Array([1]), key, {nonce: 16})) as {ivSize: number};
    expect(withLength.ivSize).toBe(16);
    expect([...((await module.decryptAsync(sealed, key)) as Uint8Array)]).toEqual([10, 11, 12]);
    expect(library.aesGcmDecrypt).toHaveBeenCalledWith(base64Encode(new Uint8Array(16)), expect.any(String), base64Encode(new Uint8Array([12, 11, 10])), expect.any(String), '');
    await expect(module.decryptAsync(sealed, key, {output: 'base64', additionalData: new Uint8Array([3])})).resolves.toBe(base64Encode(new Uint8Array([10, 11, 12])));
    expect(library.aesGcmDecrypt).toHaveBeenLastCalledWith(expect.any(String), expect.any(String), expect.any(String), expect.any(String), base64Encode(new Uint8Array([3])));
    await expect(module.encryptAsync(new Uint8Array(1), {})).rejects.toMatchObject({code: 'ERR_INVALID_KEY'});
  });

  it('is unavailable for the cipher without the library, while the key and the sealed data shapes still work', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createCryptoAesModule();
    const key = await module.EncryptionKey.import(new Uint8Array(16));
    await expect(module.EncryptionKey.generate()).rejects.toThrow(/AESEncryptionKey\.generate/);
    await expect(module.encryptAsync(new Uint8Array(1), key)).rejects.toThrow(/Crypto\.aesEncryptAsync/);
    await expect(module.decryptAsync(module.SealedData.fromCombined(new Uint8Array(28)), key)).rejects.toThrow(/Crypto\.aesDecryptAsync/);
  });
});
