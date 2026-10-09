import {act, render} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {byComposeTestID, host, nodes} from 'expo-vitest/native';
import {IconToggle} from '.';

/**
 * The tonal roles of a Material 3 palette, which the shared `expo` mock in
 * expo-vitest's native setup leaves out of its baseline: the toggle's
 * container and content colors are read from them, so the palette here
 * carries them. The rest is what the shared mock supplies for the Host.
 */
const PALETTE = {
  primary: '#6750A4FF',
  onPrimary: '#FFFFFFFF',
  surface: '#FEF7FFFF',
  onSurface: '#1D1B20FF',
  onSurfaceVariant: '#49454FFF',
  surfaceContainerHigh: '#ECE6F0FF',
  surfaceContainerHighest: '#E6E0E9FF',
  secondaryContainer: '#E8DEF8FF',
  onSecondaryContainer: '#4A4458FF',
  outline: '#79747EFF',
  error: '#B3261EFF',
};

// No `async` here, for the reason expo-vitest's own mock gives: React
// Native's Babel preset would hoist its helper above the mock.
vi.mock('expo', importOriginal => importOriginal<typeof import('expo')>().then(expo => {
  const ExpoUI = {
    completeRefresh() {},
    getMaterialColors: (options: {seedColor?: string} | null) => ({...PALETTE, primary: options?.seedColor ?? PALETTE.primary}),
  };
  return {
    ...expo,
    requireNativeModule: (name: string) => name === 'ExpoUI' ? ExpoUI : expo.requireNativeModule(name),
  };
}));

const FILLED = 'FilledIconToggleButton';

describe('IconToggle tonal (android)', () => {
  it('is the filled icon toggle in the tonal roles of the palette, and reports the press', async () => {
    const onValueChange = vi.fn();
    await render(
      <IconToggle label="Favourite" icon={icons.star} activeIcon={icons.starFilled} variant="tonal" value={false} onValueChange={onValueChange} testID="star"/>,
    );
    const toggle = byComposeTestID('star');
    expect(toggle.type).toContain(FILLED);
    expect(toggle.props.checked).toBe(false);
    expect(toggle.props.colors).toEqual({
      containerColor: PALETTE.surfaceContainerHighest,
      contentColor: PALETTE.onSurfaceVariant,
      checkedContainerColor: PALETTE.secondaryContainer,
      checkedContentColor: PALETTE.onSecondaryContainer,
    });
    // The icon is drawn in the content color of the container it is on.
    expect(host(p => p.contentDescription === 'Favourite').props.tint).toBe(PALETTE.onSurfaceVariant);
    await act(async () => {
      toggle.props.onCheckedChange({nativeEvent: {checked: true}});
    });
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('draws the on icon in the checked content color, and the two colors win over the roles', async () => {
    await render(
      <>
        <IconToggle label="Starred" icon={icons.star} activeIcon={icons.starFilled} variant="tonal" value onValueChange={vi.fn()} testID="on"/>
        <IconToggle label="Pinned" icon={icons.star} variant="tonal" value color="#8959EA" offColor="#FF9500" onValueChange={vi.fn()} testID="own"/>
      </>,
    );
    expect(byComposeTestID('on').props.checked).toBe(true);
    expect(host(p => p.contentDescription === 'Starred').props.tint).toBe(PALETTE.onSecondaryContainer);
    expect(byComposeTestID('own').props.colors).toMatchObject({contentColor: '#FF9500', checkedContentColor: '#8959EA'});
    expect(host(p => p.contentDescription === 'Pinned').props.tint).toBe('#8959EA');
  });

  it('keeps the plain toggle bare, without the container roles', async () => {
    await render(<IconToggle label="Favourite" icon={icons.star} value={false} onValueChange={vi.fn()} testID="plain"/>);
    const toggle = byComposeTestID('plain');
    expect(toggle.type).not.toContain(FILLED);
    expect(toggle.props.colors).not.toHaveProperty('containerColor');
    expect(nodes().some(n => n.type.includes(FILLED))).toBe(false);
  });
});
