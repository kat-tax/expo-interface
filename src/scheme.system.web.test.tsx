import type {ColorSchemeName} from 'react-native';
import {Appearance} from 'react-native';
import {setColorScheme} from './scheme';

/**
 * react-native-web's `Appearance` never fires in jsdom (no `matchMedia`), so
 * the system side is a fake registry the test drives: what the kit patches
 * over at load, since the mock is hoisted above the import.
 */
const system = vi.hoisted(() => {
  const listeners = new Set<(preferences: {colorScheme: ColorSchemeName}) => void>();
  return {
    scheme: 'light' as ColorSchemeName | null,
    listeners,
    change(colorScheme: ColorSchemeName) {
      for (const listener of listeners) listener({colorScheme});
    },
  };
});
vi.mock('react-native', async importOriginal => {
  const rn = await importOriginal<typeof import('react-native')>();
  return {
    ...rn,
    Appearance: {
      ...rn.Appearance,
      getColorScheme: () => system.scheme,
      addChangeListener: (listener: (preferences: {colorScheme: ColorSchemeName}) => void) => {
        system.listeners.add(listener);
        return {remove: () => system.listeners.delete(listener)};
      },
    },
  };
});

describe('setColorScheme against the system (web)', () => {
  afterEach(() => {
    setColorScheme('system');
    system.scheme = 'light';
  });

  it('passes system changes through while following the system, and swallows them while forced', () => {
    const listener = vi.fn();
    const subscription = Appearance.addChangeListener(listener);
    system.change('dark');
    expect(listener).toHaveBeenLastCalledWith({colorScheme: 'dark'});

    setColorScheme('light');
    listener.mockClear();
    system.change('dark');
    expect(listener).not.toHaveBeenCalled();

    setColorScheme('system');
    expect(listener).toHaveBeenLastCalledWith({colorScheme: 'light'});
    subscription.remove();
    system.change('light');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('answers the forced scheme, then the system one again', () => {
    system.scheme = 'dark';
    expect(Appearance.getColorScheme()).toBe('dark');
    setColorScheme('light');
    expect(Appearance.getColorScheme()).toBe('light');
    setColorScheme('system');
    expect(Appearance.getColorScheme()).toBe('dark');
  });

  it('reports light to listeners when the system has no scheme', () => {
    const listener = vi.fn();
    Appearance.addChangeListener(listener);
    system.scheme = null;
    setColorScheme('system');
    expect(listener).toHaveBeenLastCalledWith({colorScheme: 'light'});
  });
});
