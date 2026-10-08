import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable, splitPadding} from './expo-glass-effect';

const MATERIAL = 'ExpoInterfaceMaterial';
const PORTAL = 'ExpoInterfacePortal';

describe('expo-glass-effect (windows)', () => {
  it('draws a glass view on an acrylic island, the content inside it through a portal once connected', async () => {
    await render(
      <GlassView testID="glass" style={{borderRadius: 12, padding: 8, width: 200}}>
        <Text>Inside</Text>
      </GlassView>,
    );
    const material = island(MATERIAL);
    expect(material.props.material).toBe('acrylic');
    expect(material.props.tintColor).toBeUndefined();
    expect(material.props.theme).toBe('light');
    expect(island(PORTAL).props.slot).toBe(material.props.slot);
    // The box keeps the style but the padding, which the content takes.
    expect(screen.getByTestId('glass')).toHaveStyle({borderRadius: 12, width: 200, overflow: 'hidden'});
    expect(screen.getByTestId('glass')).not.toHaveStyle({padding: 8});
    expect(screen.queryByText('Inside')).toBeNull();
    await fireIsland(island(PORTAL), 'ready', {connected: true});
    expect(screen.getByText('Inside').parent).toHaveStyle({padding: 8});
  });

  it('maps the clear style, a config object, the tint and the color scheme', async () => {
    await render(
      <GlassView glassEffectStyle={{style: 'clear', animate: true}} tintColor="rgba(255, 0, 0, 0.5)" colorScheme="dark" isInteractive>
        <Text>Tinted</Text>
      </GlassView>,
    );
    const material = island(MATERIAL);
    expect(material.props.material).toBe('acrylicThin');
    expect(material.props.tintColor).toBe('#FF000080');
    expect(material.props.theme).toBe('dark');
  });

  it('is a plain view for the none style, and a container is a view', async () => {
    await render(
      <GlassContainer spacing={4} testID="container">
        <GlassView glassEffectStyle="none" testID="plain" style={{padding: 4}}>
          <Text>Plain</Text>
        </GlassView>
      </GlassContainer>,
    );
    expect(screen.getByTestId('container')).toBeOnTheScreen();
    expect(screen.getByTestId('plain')).toHaveStyle({padding: 4});
    expect(screen.getByText('Plain')).toBeOnTheScreen();
    expect(() => island(MATERIAL)).toThrow();
  });

  it('reports glass available, since the platform draws it', () => {
    expect(isLiquidGlassAvailable()).toBe(true);
    expect(isGlassEffectAPIAvailable()).toBe(true);
  });

  it('splits the padding off, and nothing for none', () => {
    expect(splitPadding(undefined)).toEqual([{}, {}]);
    expect(splitPadding([{margin: 2}, {paddingHorizontal: 6}])).toEqual([{margin: 2}, {paddingHorizontal: 6}]);
  });
});
