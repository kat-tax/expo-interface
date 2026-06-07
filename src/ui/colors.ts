export type ColorTokens = keyof typeof Colors[keyof typeof Colors];
export type ColorValues = typeof Colors[keyof typeof Colors];

export const Colors = {
  light: {
    label: '#000000',
    secondaryLabel: '#60646C',
    tertiaryLabel: '#9094A0',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    separator: 'rgba(60, 60, 67, 0.29)',
    tint: '#208AEF',
    pillBackground: 'rgba(118, 118, 128, 0.12)',
  },
  dark: {
    label: '#ffffff',
    secondaryLabel: '#B0B4BA',
    tertiaryLabel: '#6E7378',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    separator: 'rgba(84, 84, 88, 0.6)',
    tint: '#0A84FF',
    pillBackground: 'rgba(118, 118, 128, 0.24)',
  },
} as const;

export function getWebColorCss(): string {
  return `
    :root {
      color-scheme: light dark;
      ${getColorVars(Colors.light)}
    }
    @media (prefers-color-scheme: dark) {
      :root {
        ${getColorVars(Colors.dark)}
      }
    }
  `;
}

const toVarName = (t: ColorTokens): string => `--color-${camelToKebab(t)}`;
const camelToKebab = (c: string): string => c.replace(/[A-Z]/g, v => `-${v.toLowerCase()}`);
const getColorVars = (v: ColorValues): string =>
  (Object.entries(v) as Array<[ColorTokens, string]>)
    .map(([k,v]) => `\t${toVarName(k)}: ${v};`).join('\n');
