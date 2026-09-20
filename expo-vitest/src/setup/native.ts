// Shared setup for the iOS and Android projects (see vitest.config.mts).
// @testing-library/react-native's matchers are registered by vitest-expo.

/**
 * The `ExpoUI` native module is mocked at the native boundary, but `@expo/ui`
 * also needs two things the generic mock lacks:
 * - `ObservableState`, the observable behind `useNativeState` (text fields,
 *   menus, alerts, collapsibles);
 * - `getMaterialColors`, which the Compose `Host` and `useMaterialColors`
 *   call on Android to build the seeded Material 3 palette.
 *
 * The palette is the Material 3 baseline (light) with the seed as `primary`.
 * A test file can still `vi.mock('expo', ...)` itself to override this.
 */
vi.mock('expo', async importOriginal => {
  const expo = await importOriginal<typeof import('expo')>();

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
