import {createBlobModule, utf8Decode, utf8Encode} from './blob';

describe('UTF-8 by hand (windows)', () => {
  it('encodes and decodes one-, two-, three- and four-byte characters', () => {
    const text = 'aé€\u{1F600}';
    const bytes = utf8Encode(text);
    expect([...bytes]).toEqual([0x61, 0xc3, 0xa9, 0xe2, 0x82, 0xac, 0xf0, 0x9f, 0x98, 0x80]);
    expect(utf8Decode(bytes)).toBe(text);
    expect(utf8Decode(utf8Encode(''))).toBe('');
  });

  it('replaces a lone surrogate and an invalid sequence with the replacement character', () => {
    expect([...utf8Encode('\ud83d')]).toEqual([0xef, 0xbf, 0xbd]);
    expect([...utf8Encode('\ud83dx')]).toEqual([0xef, 0xbf, 0xbd, 0x78]);
    expect(utf8Decode(Uint8Array.from([0xff, 0x41]))).toBe('�A'); // an invalid lead byte
    expect(utf8Decode(Uint8Array.from([0xe2, 0x82]))).toBe('��'); // a truncated sequence
    expect(utf8Decode(Uint8Array.from([0xc3, 0x41]))).toBe('�A'); // a bad continuation byte
  });
});

describe('ExpoBlob (windows)', () => {
  const {Blob} = createBlobModule();

  it('joins the parts as bytes: strings as UTF-8, buffers and views copied, blobs by their bytes', async () => {
    const view = new Uint8Array([0, 1, 2, 3, 4]).subarray(1, 3);
    const inner = new Blob(['xy']);
    const blob = new Blob(['aé', new Uint8Array([7]).buffer, view, inner, {size: 99}], {type: 'text/plain'});
    expect(blob.size).toBe(3 + 1 + 2 + 2);
    expect(blob.type).toBe('text/plain');
    expect([...(await blob.bytes())]).toEqual([0x61, 0xc3, 0xa9, 7, 1, 2, 0x78, 0x79]);
    expect(blob).toBeInstanceOf(globalThis.expo.SharedObject);
    const empty = new Blob();
    expect(empty.size).toBe(0);
    expect(empty.type).toBe('');
    await expect(empty.text()).resolves.toBe('');
  });

  it('makes the line endings Windows\' own when asked', async () => {
    await expect(new Blob(['a\nb\r\nc\rd'], {endings: 'native'}).text()).resolves.toBe('a\r\nb\r\nc\r\nd');
    await expect(new Blob(['a\nb'], {endings: 'transparent'}).text()).resolves.toBe('a\nb');
  });

  it('slices the way the specification reads the indices, and copies its bytes out', async () => {
    const blob = new Blob(['0123456789']);
    await expect(blob.slice().text()).resolves.toBe('0123456789');
    await expect(blob.slice(2, 5).text()).resolves.toBe('234');
    await expect(blob.slice(-3).text()).resolves.toBe('789');
    await expect(blob.slice(-30, -8).text()).resolves.toBe('01');
    await expect(blob.slice(4, 2).text()).resolves.toBe('');
    await expect(blob.slice(8, 30).text()).resolves.toBe('89');
    await expect(blob.slice(Number.NaN, 2).text()).resolves.toBe('01');
    expect(blob.slice(1, 2, 'text/html').type).toBe('text/html');
    expect(blob.slice(1, 2).type).toBe('');
    const bytes = await blob.bytes();
    bytes[0] = 0;
    await expect(blob.text()).resolves.toBe('0123456789');
  });
});
