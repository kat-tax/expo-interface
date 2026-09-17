import {base64Decode, base64Encode, bytesOf, hexDecode, hexEncode, utf8Decode, utf8Encode} from './bytes';

describe('base64 by hand (windows)', () => {
  it('encodes with padding and decodes with or without it', () => {
    expect(base64Encode(new Uint8Array([]))).toBe('');
    expect(base64Encode(new Uint8Array([0x4d]))).toBe('TQ==');
    expect(base64Encode(new Uint8Array([0x4d, 0x61]))).toBe('TWE=');
    expect(base64Encode(new Uint8Array([0x4d, 0x61, 0x6e]))).toBe('TWFu');
    expect(base64Encode(new Uint8Array([0xff, 0xfe, 0xfd, 0x00]))).toBe('//79AA==');
    expect([...base64Decode('TWFu')]).toEqual([0x4d, 0x61, 0x6e]);
    expect([...base64Decode('TQ==')]).toEqual([0x4d]);
    expect([...base64Decode('TQ')]).toEqual([0x4d]);
    expect([...base64Decode(' TW\nE= ')]).toEqual([0x4d, 0x61]);
    expect(() => base64Decode('T*')).toThrow(/Not a base64 character/);
    const bytes = Uint8Array.from({length: 300}, (_, i) => (i * 37) & 0xff);
    expect([...base64Decode(base64Encode(bytes))]).toEqual([...bytes]);
  });
});

describe('hex by hand (windows)', () => {
  it('encodes lower-case and decodes either case', () => {
    expect(hexEncode(new Uint8Array([0, 1, 0xab, 0xff]))).toBe('0001abff');
    expect([...hexDecode('0001ABff')]).toEqual([0, 1, 0xab, 0xff]);
    expect(() => hexDecode('abc')).toThrow(/Not a hex string/);
    expect(() => hexDecode('zz')).toThrow(/Not a hex string/);
  });
});

describe('bytesOf (windows)', () => {
  it('views a buffer whole and a view at its offset', () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
    expect([...bytesOf(buffer)]).toEqual([1, 2, 3, 4]);
    expect([...bytesOf(new Uint8Array(buffer, 1, 2))]).toEqual([2, 3]);
    expect([...bytesOf(new Uint16Array([0x0201]))]).toEqual([1, 2]);
  });
});

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
