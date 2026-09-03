import {useCallback, useState} from 'react';

/** Color channels: `r`, `g`, `b` in `0…255`, `a` in `0…1`. */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Geometry of the iOS color well, in points: a 28pt circle ringed by hues. */
export const well = {size: 28, ring: 3, gap: 2} as const;

/** iOS color grid: 12 hue columns, a gray row above 9 lightness rows. */
export const grid = {columns: 12, rows: 10} as const;

const HUES = [0, 30, 55, 80, 120, 160, 190, 210, 240, 270, 300, 330];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const byte = (n: number) => clamp(Math.round(n), 0, 255);
const hex2 = (n: number) => byte(n).toString(16).padStart(2, '0').toUpperCase();

/** Parses `#RGB`, `#RGBA`, `#RRGGBB` or `#RRGGBBAA`; anything else is opaque black. */
export function parseColor(input: string): RGBA {
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim())?.[1];
  if (!hex) return {r: 0, g: 0, b: 0, a: 1};
  const long = hex.length <= 4 ? hex.split('').map(c => c + c).join('') : hex;
  const channel = (i: number) => parseInt(long.slice(i, i + 2), 16);
  return {
    r: channel(0),
    g: channel(2),
    b: channel(4),
    a: long.length === 8 ? channel(6) / 255 : 1,
  };
}

/** Formats as `#RRGGBBAA` when `alpha` is set, `#RRGGBB` otherwise (the iOS formats). */
export function toHex({r, g, b, a}: RGBA, alpha: boolean): string {
  const rgb = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  return alpha ? `${rgb}${hex2(a * 255)}` : rgb;
}

/** CSS `rgba()` for the color, usable in DOM and React Native styles. */
export function toCss({r, g, b, a}: RGBA): string {
  return `rgba(${byte(r)}, ${byte(g)}, ${byte(b)}, ${Math.round(a * 1000) / 1000})`;
}

/** Hue `0…360`, saturation and value `0…1`. */
export function rgbToHsv({r, g, b}: Pick<RGBA, 'r' | 'g' | 'b'>): {h: number; s: number; v: number} {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === r / 255) h = ((g - b) / 255 / delta) % 6;
    else if (max === g / 255) h = (b - r) / 255 / delta + 2;
    else h = (r - g) / 255 / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return {h, s: max === 0 ? 0 : delta / max, v: max};
}

export function hsvToRgb(h: number, s: number, v: number): Pick<RGBA, 'r' | 'g' | 'b'> {
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  const sector = Math.floor(hue / 60);
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector];
  return {r: byte((r + m) * 255), g: byte((g + m) * 255), b: byte((b + m) * 255)};
}

export function hslToRgb(h: number, s: number, l: number): Pick<RGBA, 'r' | 'g' | 'b'> {
  const v = l + s * Math.min(l, 1 - l);
  return hsvToRgb(h, v === 0 ? 0 : 2 * (1 - l / v), v);
}

/** Color of a cell of the iOS grid: grays on the first row, then hues from light to dark. */
export function gridColor(row: number, column: number): Pick<RGBA, 'r' | 'g' | 'b'> {
  if (row === 0) {
    const level = byte(255 * (1 - column / (grid.columns - 1)));
    return {r: level, g: level, b: level};
  }
  const lightness = 0.9 - ((row - 1) / (grid.rows - 2)) * 0.75;
  return hslToRgb(HUES[column], 1, lightness);
}

/**
 * Color at a point of the iOS spectrum: hue runs down the vertical axis, and
 * the horizontal axis goes from white through the pure hue to black.
 */
export function spectrumColor(x: number, y: number): Pick<RGBA, 'r' | 'g' | 'b'> {
  const fx = clamp(x, 0, 1);
  const h = clamp(y, 0, 1) * 360;
  return fx <= 0.5 ? hsvToRgb(h, fx * 2, 1) : hsvToRgb(h, 1, (1 - fx) * 2);
}

/** Closest spectrum point (`0…1` each) for a color. */
export function spectrumPosition(color: Pick<RGBA, 'r' | 'g' | 'b'>): {x: number; y: number} {
  const {h, s, v} = rgbToHsv(color);
  return {x: v < 1 ? 1 - v / 2 : s / 2, y: h / 360};
}

/** Base64 of an ASCII string (no `btoa` on every React Native runtime). */
function base64(ascii: string): string {
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < ascii.length; i += 3) {
    const a = ascii.charCodeAt(i);
    const b = ascii.charCodeAt(i + 1);
    const c = ascii.charCodeAt(i + 2);
    const bits = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += table[bits >> 18] + table[(bits >> 12) & 63];
    out += Number.isNaN(b) ? '=' : table[(bits >> 6) & 63];
    out += Number.isNaN(c) ? '=' : table[bits & 63];
  }
  return out;
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${base64(svg)}`;
}

/** Hue at a clockwise angle from the top of the well ring (yellow up, red right, blue down, green left). */
export const ringHue = (angle: number) => (60 - angle + 360) % 360;

/** The well's rainbow ring as an SVG: 60 arc segments around a transparent center. */
export function ringSvg(): string {
  const r = 50 - (well.ring / well.size) * 50;
  const stroke = (well.ring / well.size) * 100;
  const step = 6;
  const point = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  };
  let paths = '';
  for (let deg = 0; deg < 360; deg += step) {
    const {r: cr, g: cg, b: cb} = hsvToRgb(ringHue(deg + step / 2), 1, 1);
    paths += `<path d="M${point(deg)}A${r} ${r} 0 0 1 ${point(deg + step + 0.5)}" stroke="rgb(${cr},${cg},${cb})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke-width="${stroke}">${paths}</svg>`;
}

/** The spectrum as an SVG: a vertical hue gradient under a white→clear→black one. */
export function spectrumSvg(): string {
  const hues = [0, 60, 120, 180, 240, 300, 360]
    .map(h => {
      const {r, g, b} = hsvToRgb(h, 1, 1);
      return `<stop offset="${h / 3.6}%" stop-color="rgb(${r},${g},${b})"/>`;
    })
    .join('');
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    `<linearGradient id="h" x1="0" y1="0" x2="0" y2="1">${hues}</linearGradient>` +
    '<linearGradient id="l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/>' +
    '<stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#000"/></linearGradient>' +
    '<rect width="100" height="100" fill="url(#h)"/><rect width="100" height="100" fill="url(#l)"/></svg>'
  );
}

/** Checkerboard shown behind translucent colors. */
export function checkerSvg(): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">' +
    '<rect width="16" height="16" fill="#fff"/><rect width="8" height="8" fill="#d9d9d9"/>' +
    '<rect x="8" y="8" width="8" height="8" fill="#d9d9d9"/></svg>'
  );
}

/**
 * Controlled color state for the pickers: the picked color is kept locally so
 * the sheet follows the user's drag even before the parent re-renders, and
 * every change is reported in the iOS hex format.
 */
export function useColorValue(
  value: string,
  onValueChange: (hex: string) => void,
  supportsOpacity: boolean,
): [RGBA, (next: RGBA) => void] {
  const [current, setCurrent] = useState(() => parseColor(value));
  // Re-derive the local color when the controlling parent changes `value`.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setCurrent(parseColor(value));
  }
  const update = useCallback(
    (next: RGBA) => {
      const color = supportsOpacity ? next : {...next, a: 1};
      setCurrent(color);
      onValueChange(toHex(color, supportsOpacity));
    },
    [onValueChange, supportsOpacity],
  );
  return [current, update];
}
