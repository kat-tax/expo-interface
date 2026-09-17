import {UnavailabilityError} from './base';
import {DENIED} from './permissions';
import {registeredModules, registerModule} from './registry';
import {registerUnavailableModules, UNAVAILABLE, unavailableClass, unavailableMethod, unavailableModule} from './unavailable';

describe('an unavailable member (windows)', () => {
  it('is a method that throws the package\'s error, or a class that throws when constructed', () => {
    expect(() => unavailableMethod('Crypto', 'digest')()).toThrow(UnavailabilityError);
    expect(() => unavailableMethod('Crypto', 'digest')()).toThrow(/Crypto\.digest is not available on windows/);
    const File = unavailableClass('FileSystem', 'FileSystemFile');
    expect(File.name).toBe('FileSystemFile');
    expect(() => new File()).toThrow(/FileSystem\.FileSystemFile/);
    // A package may subclass it, or patch its prototype, before anything is constructed.
    class Sub extends File {}
    (File.prototype as {patched?: number}).patched = 1;
    expect(() => new Sub()).toThrow(UnavailabilityError);
  });

  it('is a NativeModule with listeners, the methods, the classes, the constants and the answers of its spec', async () => {
    const module = unavailableModule({
      package: 'Thing',
      methods: ['doAsync'],
      classes: ['Handle'],
      constants: {LIMIT: 3},
      answers: {isAvailableAsync: async () => false},
    }) as {
      doAsync(): never;
      Handle: new () => object;
      LIMIT: number;
      isAvailableAsync(): Promise<boolean>;
      addListener(name: string, listener: () => void): {remove(): void};
      listenerCount(name: string): number;
    };
    expect(() => module.doAsync()).toThrow(/Thing\.doAsync/);
    expect(() => new module.Handle()).toThrow(/Thing\.Handle/);
    expect(module.LIMIT).toBe(3);
    await expect(module.isAvailableAsync()).resolves.toBe(false);
    const subscription = module.addListener('change', () => {});
    expect(module.listenerCount('change')).toBe(1);
    subscription.remove();
    expect(module.listenerCount('change')).toBe(0);
    // React Native's legacy emitter wants this beside `addListener`, or it warns at every wrap.
    expect((module as unknown as {removeListeners(count: number): void}).removeListeners(1)).toBeUndefined();
    // A spec with nothing in it adds only the legacy emitter's hook (the base keeps its listener store).
    expect(Object.keys(unavailableModule({package: 'Bare'})).filter(key => !key.startsWith('_'))).toEqual(['removeListeners']);
  });
});

describe('the unavailable table (windows)', () => {
  it('names every module after its package and answers each member as the spec says', async () => {
    for (const [name, spec] of Object.entries(UNAVAILABLE)) {
      const module = unavailableModule(spec) as Record<string, unknown>;
      for (const method of spec.methods ?? []) {
        expect(() => (module[method] as () => unknown)(), `${name}.${method}`).toThrow(new RegExp(`${spec.package}\\.${method} is not available on windows`));
      }
      for (const cls of spec.classes ?? []) {
        const Entry = module[cls] as new () => object;
        expect(Entry.name).toBe(cls);
        expect(() => new Entry(), `${name}.${cls}`).toThrow(UnavailabilityError);
      }
      for (const [key, value] of Object.entries(spec.constants ?? {})) expect(module[key], `${name}.${key}`).toEqual(value);
      for (const [key, value] of Object.entries(spec.answers ?? {})) {
        const answer = module[key];
        expect(typeof answer, `${name}.${key}`).toBe('function');
        const result = await (answer as () => unknown)();
        if (/Permissions/.test(key)) expect(result, `${name}.${key}`).toBe(DENIED);
        else if (/^(isAvailableAsync|hasHardwareAsync|isEnrolledAsync|hasServicesEnabledAsync|canUseBiometricAuthentication)$/.test(key)) expect(result, `${name}.${key}`).toBe(false);
        else expect(result, `${name}.${key}`).not.toBeInstanceOf(Error);
        expect(value).toBe(answer);
      }
    }
  });

  it('answers the sensors as absent, the device motion with gravity, and the pedometer with denied steps', async () => {
    const accelerometer = unavailableModule(UNAVAILABLE.ExponentAccelerometer) as {isAvailableAsync(): Promise<boolean>; setUpdateInterval(ms: number): void};
    await expect(accelerometer.isAvailableAsync()).resolves.toBe(false);
    expect(accelerometer.setUpdateInterval(16)).toBeUndefined();
    expect((unavailableModule(UNAVAILABLE.ExponentDeviceMotion) as {Gravity: number}).Gravity).toBeCloseTo(9.80665);
    const pedometer = unavailableModule(UNAVAILABLE.ExponentPedometer) as {getStepCountAsync(): never; getPermissionsAsync(): Promise<unknown>};
    expect(() => pedometer.getStepCountAsync()).toThrow(/Pedometer\.getStepCountAsync/);
    await expect(pedometer.getPermissionsAsync()).resolves.toBe(DENIED);
  });

  it('registers under every name, after the real modules, which it never shadows', () => {
    const previous = globalThis.expo;
    const expo = {...previous, modules: {}} as typeof globalThis.expo;
    globalThis.expo = expo;
    try {
      const real = {getCurrentPositionAsync: () => 'real'};
      registerModule('ExpoLocation', real);
      registerUnavailableModules();
      expect(registeredModules().sort()).toEqual(Object.keys(UNAVAILABLE).sort());
      expect(expo.modules.ExpoLocation).toBe(real);
      expect(() => (expo.modules.ExpoSQLite as {deleteDatabaseSync(): never}).deleteDatabaseSync()).toThrow(/SQLite\.deleteDatabaseSync/);
    } finally {
      globalThis.expo = previous;
    }
  });
});
