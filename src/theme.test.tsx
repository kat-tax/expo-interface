import {Platform} from 'react-native';
import {renderHook} from '@testing-library/react-native';
import {AccentProvider, onAccent} from './accent';
import {clamp, colors, flatten, getThemeCSS, theme, useColor, useNavTheme} from './theme';

const TOKENS = Object.keys(colors.light) as (keyof typeof colors.light)[];

describe('colors', () => {
  it('defines every token in both schemes', () => {
    expect(Object.keys(colors.dark).sort()).toEqual([...TOKENS].sort());
  });

  it('derives onTint from the seed', () => {
    expect(colors.light.onTint).toBe(onAccent(colors.light.tint));
    expect(colors.dark.onTint).toBe(onAccent(colors.dark.tint));
  });
});

describe('theme', () => {
  it('has a platform value for every token', () => {
    for (const token of TOKENS) {
      expect(theme[token]).toBeDefined();
    }
  });

  if (Platform.OS === 'web') {
    it('resolves to CSS custom properties on web', () => {
      expect(theme.label).toBe('var(--color-label)');
      expect(theme.backgroundElement).toBe('var(--color-background-element)');
      expect(theme.onDestructive).toBe('var(--color-on-destructive)');
    });
  }
});

describe('getThemeCSS', () => {
  const css = getThemeCSS();

  it('emits a kebab-cased variable per token for light and dark', () => {
    expect(css).toContain('--color-label: #000000;');
    expect(css).toContain('--color-secondary-label: #60646C;');
    expect(css).toContain('--color-on-tint: #FFFFFF;');
    expect(css).toContain('--color-background: #ffffff;');
    expect(css).toContain('--color-background: #000000;');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('color-scheme: light dark;');
  });

  it('declares every token once per scheme', () => {
    for (const token of TOKENS) {
      const name = `--color-${token.replace(/[A-Z]/g, v => `-${v.toLowerCase()}`)}:`;
      expect(css.split(name).length - 1).toBe(2);
    }
  });
});

describe('useColor', () => {
  const wrapper = ({children}: React.PropsWithChildren) => (
    <AccentProvider seed="#8959EA">{children}</AccentProvider>
  );

  if (Platform.OS === 'web') {
    it('returns the CSS variable so CSS stays reactive', async () => {
      const {result} = await renderHook(() => useColor('tint'), {wrapper});
      expect(result.current).toBe('var(--color-tint)');
    });
  } else {
    it('returns the live accent seed for tint and its contrast for onTint', async () => {
      const {result} = await renderHook(() => [useColor('tint'), useColor('onTint')], {wrapper});
      expect(result.current).toEqual(['#8959EA', onAccent('#8959EA')]);
    });

    it('returns the light palette value for other tokens', async () => {
      const {result} = await renderHook(() => useColor('secondaryLabel'));
      expect(result.current).toBe(colors.light.secondaryLabel);
    });
  }
});

describe('useNavTheme', () => {
  it('maps the palette onto the React Navigation theme', async () => {
    const {result} = await renderHook(() => useNavTheme(), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA">{children}</AccentProvider>,
    });
    if (Platform.OS === 'web') {
      expect(result.current.colors.primary).toBe('var(--color-tint)');
    } else {
      expect(result.current.colors.primary).toBe('#8959EA');
      expect(result.current.colors.background).toBe(colors.light.background);
    }
    expect(result.current.fonts.bold.fontWeight).toBe('700');
  });
});

describe('flatten', () => {
  it('returns an empty object for no style', () => {
    expect(flatten()).toEqual({});
  });

  it('keeps only layout, opacity and string colors', () => {
    expect(flatten({
      width: 10,
      marginTop: 4,
      opacity: 0.5,
      color: 'red',
      fontSize: 99,
      backgroundColor: 'blue',
    } as never)).toEqual({width: 10, marginTop: 4, opacity: 0.5, color: 'red'});
  });

  it('expands vertical/horizontal shorthands', () => {
    expect(flatten({marginVertical: 8, paddingHorizontal: 2})).toEqual({
      marginTop: 8,
      marginBottom: 8,
      paddingLeft: 2,
      paddingRight: 2,
    });
  });
});

describe('clamp', () => {
  it('uses ellipsis for a single line and line-clamp otherwise', () => {
    expect(clamp()).toEqual({});
    expect(clamp(1)).toMatchObject({whiteSpace: 'nowrap', textOverflow: 'ellipsis'});
    expect(clamp(3)).toMatchObject({WebkitLineClamp: 3, display: '-webkit-box'});
  });
});
