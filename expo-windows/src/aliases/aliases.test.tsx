import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {GlassContainer, GlassView, isLiquidGlassAvailable} from './expo-glass-effect';
import {SymbolView} from './expo-symbols';

describe('expo-glass-effect (windows)', () => {
  it('is a plain view with its children, and unavailable', async () => {
    await render(
      <GlassContainer testID="container">
        <GlassView testID="glass"><Text>Inside</Text></GlassView>
      </GlassContainer>,
    );
    expect(screen.getByTestId('container')).toBeOnTheScreen();
    expect(screen.getByTestId('glass')).toBeOnTheScreen();
    expect(screen.getByText('Inside')).toBeOnTheScreen();
    expect(isLiquidGlassAvailable()).toBe(false);
  });
});

describe('expo-symbols (windows)', () => {
  it('draws nothing', async () => {
    await render(<SymbolView name="star" tintColor="#F00"/>);
    expect(screen.toJSON()).toBeNull();
  });
});
