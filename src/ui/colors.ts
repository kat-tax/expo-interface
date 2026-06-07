export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#60646C',
    textTertiary: '#9094A0',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    separator: 'rgba(60, 60, 67, 0.29)',
    tint: '#208AEF',
    pillBackground: 'rgba(118, 118, 128, 0.12)',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#B0B4BA',
    textTertiary: '#6E7378',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    separator: 'rgba(84, 84, 88, 0.6)',
    tint: '#0A84FF',
    pillBackground: 'rgba(118, 118, 128, 0.24)',
  },
} as const;

type PaletteKey = keyof typeof Colors.light;

const WEB_COLOR_VARS: {var: string; key: PaletteKey}[] = [
  {var: '--color-label', key: 'text'},
  {var: '--color-secondary-label', key: 'textSecondary'},
  {var: '--color-tertiary-label', key: 'textTertiary'},
  {var: '--color-background', key: 'background'},
  {var: '--color-background-element', key: 'backgroundElement'},
  {var: '--color-background-selected', key: 'backgroundSelected'},
  {var: '--color-separator', key: 'separator'},
  {var: '--color-tint', key: 'tint'},
  {var: '--color-pill-background', key: 'pillBackground'},
];

function paletteVars(palette: (typeof Colors)['light'] | (typeof Colors)['dark']): string {
  return WEB_COLOR_VARS.map(({var: name, key}) => `  ${name}: ${palette[key]};`).join('\n');
}

/** CSS custom properties for web, derived from the shared palette. */
export function getWebColorVariablesCss(): string {
  return `:root {
  color-scheme: light dark;
${paletteVars(Colors.light)}
}

@media (prefers-color-scheme: dark) {
  :root {
${paletteVars(Colors.dark)}
  }
}`;
}
