import {Text} from 'react-native';
import {render} from '@testing-library/react-native';
import {useMaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider, ACCENT_SEED} from '../accent';
import {Sheet} from '.';

// jest-expo's auto-mock of the `ExpoUI` native module has no
// `getMaterialColors`; echo the seed back so tests can tell palettes apart.
jest.mock('../../node_modules/@expo/ui/src/jetpack-compose/ExpoUIModule', () => ({
  ExpoUIModule: {
    getMaterialColors: (options: {seedColor?: string; scheme?: string} | null) => ({
      primary: options?.seedColor ?? 'baseline',
      scheme: options?.scheme,
    }),
  },
}));

/** Reads the palette exactly like a Compose control inside the sheet would. */
function Probe({onPalette}: {onPalette: (palette: unknown) => void}) {
  onPalette(useMaterialColors());
  return <Text>probe</Text>;
}

describe('Sheet (android palette)', () => {
  it('overlays the accent-seeded Material palette over the unseeded sheet Host', async () => {
    const onPalette = jest.fn();
    await render(
      <AccentProvider seed="#8959EA">
        <Sheet isPresented onDismiss={() => {}}>
          <Probe onPalette={onPalette}/>
        </Sheet>
      </AccentProvider>,
    );
    expect(onPalette).toHaveBeenLastCalledWith({primary: '#8959EA', scheme: 'light'});
  });

  it('falls back to the default accent seed', async () => {
    const onPalette = jest.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}}>
        <Probe onPalette={onPalette}/>
      </Sheet>,
    );
    expect(onPalette).toHaveBeenLastCalledWith({primary: ACCENT_SEED, scheme: 'light'});
  });
});
