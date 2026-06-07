type PaletteKey = keyof typeof Colors.light;

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
      ${getThemeCss(Colors.light)}
    }
    @media (prefers-color-scheme: dark) {
      :root {
        ${getThemeCss(Colors.dark)}
      }
    }
  `;
}

const toColorName = (key: PaletteKey): string => `--color-${camelToKebab(key)}`;
const camelToKebab = (key: string): string => key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
function getThemeCss(palette: (typeof Colors)['light'] | (typeof Colors)['dark']): string {
  return (Object.keys(palette) as PaletteKey[])
    .map((key) => `  ${toColorName(key)}: ${palette[key]};`)
    .join('\n');
}
