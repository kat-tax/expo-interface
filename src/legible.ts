/** A `#RGB`, `#RRGGBB` or `#RRGGBBAA` color's red, green and blue, 0 to 255; `null` for anything else. */
export function parseHex(color: string): [number, number, number] | null {
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return null;
  const n = parseInt(hex.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** A color's relative luminance, as WCAG measures it, 0 for black to 1 for white. */
export function luminance(color: string): number {
  const rgb = parseHex(color) ?? [0, 0, 0];
  const [r, g, b] = rgb.map(channel => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast ratio between two colors, 1 to 21, as WCAG measures it. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * An accent made legible on every one of its backgrounds: the same hue and
 * saturation, its lightness moved away from them (lighter on dark ones,
 * darker on light ones) until its contrast with each reaches `min`, so the
 * stricter background decides. A seed that already reaches it on all of them
 * is kept as it is; one that cannot is white or black. The first background
 * decides the direction, and the rest lie on its side of mid-gray, as a
 * scheme's do.
 */
export function legibleTint(seed: string, backgrounds: readonly string[], min: number): string {
  const rgb = parseHex(seed);
  const legible = (color: string) => backgrounds.every(background => contrastRatio(color, background) >= min);
  if (!rgb || legible(seed)) return seed;
  const lighter = luminance(backgrounds[0]) < 0.5;
  const [h, s, l] = toHsl(rgb);
  for (let step = 1; step <= 100; step++) {
    const lightness = lighter ? Math.min(1, l + step / 100) : Math.max(0, l - step / 100);
    const candidate = toHex(fromHsl(h, s, lightness));
    if (legible(candidate)) return candidate;
  }
  return lighter ? '#FFFFFF' : '#000000';
}

function toHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const [red, green, blue] = [r / 255, g / 255, b / 255];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === red ? (green - blue) / d + (green < blue ? 6 : 0) : max === green ? (blue - red) / d + 2 : (red - green) / d + 4;
  return [h / 6, s, l];
}

function fromHsl(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (u < 1 / 6) return p + (q - p) * 6 * u;
    if (u < 1 / 2) return q;
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
    return p;
  };
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
