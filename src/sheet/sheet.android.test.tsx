import {Text} from 'react-native';
import {render} from '@testing-library/react-native';
import {useMaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider, ACCENT_SEED} from '../accent';
import {Sheet} from '.';

// The shared `ExpoUI` mock in vitest/setup.native.ts returns a full baseline
// palette; override it to echo just the seed (and scheme) back so the exact
// palette assertions below can tell the seeded overlay from the sheet Host.
vi.mock('../../node_modules/@expo/ui/src/jetpack-compose/ExpoUIModule', () => ({
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
    const onPalette = vi.fn();
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
    const onPalette = vi.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}}>
        <Probe onPalette={onPalette}/>
      </Sheet>,
    );
    expect(onPalette).toHaveBeenLastCalledWith({primary: ACCENT_SEED, scheme: 'light'});
  });
});
