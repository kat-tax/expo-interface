import {create} from 'storybook/theming';

/**
 * Monochrome, Expo-style Storybook themes: pure black on white and pure white
 * on black, with the kit's own greys (`src/theme.ts` palettes) for secondary
 * text, borders and raised surfaces, and the accent seed for the selection
 * color (highlighted sidebar item, links, focus rings). The manager is
 * bundled without react-native, so the values are mirrored here rather than
 * imported.
 */
const FONT_BASE = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const FONT_CODE = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';
const BRAND_URL = 'https://github.com/kat-tax/expo-interface';

/** Mirrors `ACCENT_SEED` in `src/accent.tsx` (iOS systemBlue). */
export const ACCENT_SEED = '#007AFF';

/** Toolbar presets: the iOS system colors. */
export const ACCENT_PRESETS: readonly {name: string; value: string}[] = [
  {name: 'Blue', value: ACCENT_SEED},
  {name: 'Indigo', value: '#5856D6'},
  {name: 'Purple', value: '#AF52DE'},
  {name: 'Pink', value: '#FF2D55'},
  {name: 'Red', value: '#FF3B30'},
  {name: 'Orange', value: '#FF9500'},
  {name: 'Yellow', value: '#FFCC00'},
  {name: 'Green', value: '#34C759'},
  {name: 'Teal', value: '#30B0C7'},
  {name: 'Graphite', value: '#8E8E93'},
];

export type Scheme = 'light' | 'dark';

/** Storybook globals the themes derive from (see `preview.tsx` `globalTypes`). */
export interface ThemeGlobals {
  /** `system` (default), `light` or `dark`. */
  scheme?: unknown;
  /** Accent seed as a hex color. */
  accent?: unknown;
}

/** Wordmark as an SVG data URL so it needs no static asset or base path. */
export function logo(color: string, withText = true): string {
  const text = withText
    ? `<text x="38" y="19.5" font-family="${FONT_BASE.replace(/"/g, '')}" font-size="17" font-weight="700" letter-spacing="-0.4" fill="${color}">expo<tspan font-weight="400">-interface</tspan></text>`
    : '';
  const width = withText ? 160 : 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28">`
    + `<rect x="1.5" y="1.5" width="25" height="25" rx="7.5" fill="none" stroke="${color}" stroke-width="3"/>`
    + `<rect x="8" y="8" width="12" height="3" rx="1.5" fill="${color}"/>`
    + `<rect x="8" y="14" width="7" height="3" rx="1.5" fill="${color}"/>`
    + `<circle cx="18.5" cy="18.5" r="2.5" fill="${color}"/>`
    + text
    + '</svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalizes a hex color to `#RRGGBB`; anything else falls back to the default seed. */
export function normalizeAccent(value: unknown): string {
  if (typeof value !== 'string') return ACCENT_SEED;
  const match = HEX.exec(value.trim());
  if (!match) return ACCENT_SEED;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return `#${hex.toUpperCase()}`;
}

/**
 * The accent, darkened until white text reads on top of it. Storybook draws
 * the highlighted sidebar item (and other selections) as `colorSecondary`
 * behind fixed white text, so light accents such as yellow need a deeper
 * shade there while the preview keeps the seed itself.
 */
export function selectionColor(accent: string): string {
  const hex = normalizeAccent(accent).slice(1);
  let [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  while (0.299 * r + 0.587 * g + 0.114 * b > 153) {
    r = Math.floor(r * 0.85);
    g = Math.floor(g * 0.85);
    b = Math.floor(b * 0.85);
  }
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

export function createTheme(base: Scheme, accent: string = ACCENT_SEED) {
  const dark = base === 'dark';
  const fg = dark ? '#ffffff' : '#000000';
  const bg = dark ? '#000000' : '#ffffff';
  const muted = dark ? '#B0B4BA' : '#60646C';
  const raised = dark ? '#212225' : '#F0F0F3';
  const border = dark ? '#2E3135' : '#E0E1E6';
  const selection = selectionColor(accent);
  return create({
    base,
    brandTitle: 'expo-interface',
    brandUrl: BRAND_URL,
    brandImage: logo(fg),
    brandTarget: '_self',
    colorPrimary: fg,
    colorSecondary: selection,
    appBg: bg,
    appContentBg: bg,
    appPreviewBg: bg,
    appHoverBg: raised,
    appBorderColor: border,
    appBorderRadius: 8,
    fontBase: FONT_BASE,
    fontCode: FONT_CODE,
    textColor: fg,
    textInverseColor: bg,
    textMutedColor: muted,
    barTextColor: muted,
    barHoverColor: fg,
    barSelectedColor: selection,
    barBg: bg,
    buttonBg: raised,
    buttonBorder: border,
    booleanBg: raised,
    booleanSelectedBg: bg,
    inputBg: bg,
    inputBorder: border,
    inputTextColor: fg,
    inputBorderRadius: 6,
  });
}

/** Follows the OS scheme, like the kit does. */
export function prefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Resolves the toolbar's scheme choice (`system` follows the OS). */
export function resolveScheme(scheme: unknown): Scheme {
  if (scheme === 'light' || scheme === 'dark') return scheme;
  return prefersDark() ? 'dark' : 'light';
}

/** Theme for the current globals; the OS scheme when they are not known yet. */
export function themeFor(globals: ThemeGlobals = {}) {
  return createTheme(resolveScheme(globals.scheme), normalizeAccent(globals.accent));
}

/** Listens for OS scheme changes; returns the unsubscribe function. */
export function onPrefersDarkChange(listener: () => void): () => void {
  const query = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!query) return () => {};
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
