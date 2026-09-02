import {create} from 'storybook/theming';

/**
 * Monochrome, Expo-style Storybook themes: pure black on white and pure white
 * on black, with the kit's own greys (`src/theme.ts` palettes) for secondary
 * text, borders and raised surfaces. The manager is bundled without
 * react-native, so the values are mirrored here rather than imported.
 */
const FONT_BASE = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const FONT_CODE = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';
const BRAND_URL = 'https://github.com/kat-tax/expo-interface';

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

export const light = create({
  base: 'light',
  brandTitle: 'expo-interface',
  brandUrl: BRAND_URL,
  brandImage: logo('#000000'),
  brandTarget: '_self',
  colorPrimary: '#000000',
  colorSecondary: '#000000',
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appHoverBg: '#F0F0F3',
  appBorderColor: '#E0E1E6',
  appBorderRadius: 8,
  fontBase: FONT_BASE,
  fontCode: FONT_CODE,
  textColor: '#000000',
  textInverseColor: '#ffffff',
  textMutedColor: '#60646C',
  barTextColor: '#60646C',
  barHoverColor: '#000000',
  barSelectedColor: '#000000',
  barBg: '#ffffff',
  buttonBg: '#F0F0F3',
  buttonBorder: '#E0E1E6',
  booleanBg: '#F0F0F3',
  booleanSelectedBg: '#ffffff',
  inputBg: '#ffffff',
  inputBorder: '#E0E1E6',
  inputTextColor: '#000000',
  inputBorderRadius: 6,
});

export const dark = create({
  base: 'dark',
  brandTitle: 'expo-interface',
  brandUrl: BRAND_URL,
  brandImage: logo('#ffffff'),
  brandTarget: '_self',
  colorPrimary: '#ffffff',
  colorSecondary: '#ffffff',
  appBg: '#000000',
  appContentBg: '#000000',
  appPreviewBg: '#000000',
  appHoverBg: '#212225',
  appBorderColor: '#2E3135',
  appBorderRadius: 8,
  fontBase: FONT_BASE,
  fontCode: FONT_CODE,
  textColor: '#ffffff',
  textInverseColor: '#000000',
  textMutedColor: '#B0B4BA',
  barTextColor: '#B0B4BA',
  barHoverColor: '#ffffff',
  barSelectedColor: '#ffffff',
  barBg: '#000000',
  buttonBg: '#212225',
  buttonBorder: '#2E3135',
  booleanBg: '#212225',
  booleanSelectedBg: '#000000',
  inputBg: '#000000',
  inputBorder: '#2E3135',
  inputTextColor: '#ffffff',
  inputBorderRadius: 6,
});

/** Follows the OS scheme, like the kit does. */
export function prefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function preferredTheme() {
  return prefersDark() ? dark : light;
}
