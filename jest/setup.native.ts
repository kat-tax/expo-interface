// Shared setup for the iOS and Android projects (see jest.config.js).
// @testing-library/react-native registers its matchers automatically.

/**
 * jest-expo's automatic mock of the `ExpoUI` native module only stubs
 * `completeRefresh`, but `@expo/ui` also needs:
 * - `ObservableState`, the observable behind `useNativeState` (text fields,
 *   menus, alerts, collapsibles);
 * - `getMaterialColors`, which the Compose `Host` and `useMaterialColors`
 *   call on Android to build the seeded Material 3 palette.
 *
 * The palette is the Material 3 baseline (light) with the seed as `primary`.
 * A test file can still `jest.mock('expo', ...)` itself to override this.
 */
jest.mock('expo', () => {
  const expo = jest.requireActual<typeof import('expo')>('expo');

  class ObservableState<T> {
    private current: T;
    constructor({value}: {value: T}) {
      this.current = value;
    }
    getValue() {
      return this.current;
    }
    setValue({value}: {value: T}) {
      this.current = value;
    }
    setOnChange() {}
    release() {}
  }

  const BASELINE = {
    primary: '#6750A4FF',
    onPrimary: '#FFFFFFFF',
    surface: '#FEF7FFFF',
    onSurface: '#1D1B20FF',
    onSurfaceVariant: '#49454FFF',
    surfaceContainerHigh: '#ECE6F0FF',
    outline: '#79747EFF',
    error: '#B3261EFF',
  };

  const ExpoUI = {
    completeRefresh() {},
    ObservableState,
    getMaterialColors: (options: {seedColor?: string} | null) => ({
      ...BASELINE,
      primary: options?.seedColor ?? BASELINE.primary,
    }),
  };

  return {
    ...expo,
    requireNativeModule: (name: string) =>
      name === 'ExpoUI' ? ExpoUI : expo.requireNativeModule(name),
  };
});
