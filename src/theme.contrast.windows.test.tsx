import {renderHook} from '@testing-library/react-native';
import {colors, useColor, useNavTheme, usePalette} from './theme';

/** The system's high contrast setting, as the test wants it. */
const contrast = vi.hoisted(() => ({
  state: {enabled: false, scheme: '', colors: null as Record<string, string> | null},
}));
vi.mock('./windows/contrast', async importOriginal => ({
  ...(await importOriginal<typeof import('./windows/contrast')>()),
  useHighContrast: () => contrast.state,
}));

const black = {
  background: '#000000',
  text: '#FFFFFF',
  highlight: '#1AEBFF',
  highlightText: '#000000',
  buttonFace: '#000000',
  buttonText: '#FFFFFF',
  link: '#FFFF00',
  disabledText: '#3FF23F',
};

describe('the palette in high contrast (windows)', () => {
  afterEach(() => {
    contrast.state = {enabled: false, scheme: '', colors: null};
  });

  it('takes the theme\'s colours while one is on, in the palette, each colour and the navigation theme', async () => {
    contrast.state = {enabled: true, scheme: 'High Contrast Black', colors: black};
    const palette = await renderHook(() => usePalette());
    expect(palette.result.current.label).toBe('#FFFFFF');
    expect(palette.result.current.background).toBe('#000000');
    expect(palette.result.current.tint).toBe('#1AEBFF');
    const color = await renderHook(() => useColor('separator'));
    expect(color.result.current).toBe('#FFFFFF');
    const tint = await renderHook(() => useColor('tint'));
    expect(tint.result.current).toBe('#1AEBFF');
    const nav = await renderHook(() => useNavTheme());
    expect(nav.result.current.colors.primary).toBe('#1AEBFF');
    expect(nav.result.current.colors.background).toBe('#000000');
    expect(nav.result.current.colors.text).toBe('#FFFFFF');
  });

  it('keeps the scheme\'s palette while it is off', async () => {
    const palette = await renderHook(() => usePalette());
    expect(palette.result.current.label).toBe(colors.light.label);
    const nav = await renderHook(() => useNavTheme());
    expect(nav.result.current.colors.primary).toBe(colors.light.tint);
    expect(nav.result.current.colors.background).toBe(colors.light.background);
  });
});
