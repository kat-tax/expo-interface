import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {bandsOf, BlurTargetView, BlurView, MeshGradientView, tintColor} from './expo-effects';

describe('expo-blur and expo-mesh-gradient (windows)', () => {
  it('stands the blur in as a tinted translucent surface, and the mesh as bands of its colours', async () => {
    expect(tintColor()).toBe('rgba(255,255,255,0.425)');
    expect(tintColor('dark', 100)).toBe('rgba(20,20,20,0.850)');
    expect(tintColor('systemThinMaterialDark', 200)).toBe('rgba(20,20,20,0.850)');
    expect(tintColor('light', -5)).toBe('rgba(255,255,255,0.000)');
    expect(bandsOf(undefined)).toEqual([]);
    expect(bandsOf(['a', 'b', 'c', 'd'], 2)).toEqual(['a', 'c']);
    expect(bandsOf(['a', 'b', 'c'])).toEqual(['a']);
    expect(bandsOf(['a', 'b', 'c'], 0)).toEqual(['a']);
    await render(
      <>
        <BlurView tint="dark" intensity={80} testID="blur">
          <Text>Over</Text>
        </BlurView>
        <BlurTargetView testID="target">
          <Text>Behind</Text>
        </BlurTargetView>
        <MeshGradientView columns={2} rows={2} colors={['red', 'blue', 'green', 'yellow']} testID="mesh">
          <Text>On top</Text>
        </MeshGradientView>
      </>,
    );
    expect(screen.getByTestId('blur')).toHaveStyle({backgroundColor: 'rgba(20,20,20,0.680)'});
    for (const text of ['Over', 'Behind', 'On top']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.getByTestId('mesh')).toHaveStyle({overflow: 'hidden'});
  });
});
