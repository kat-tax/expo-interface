import {TurboModuleRegistry} from 'react-native';
import {DEFAULT_SERVICE, ExpoSecureStore, KEYCHAIN_ACCESSIBILITY} from './secure-store';

/** A library keeping values in a map per service, verifying as told. */
function withLibrary(verifies = true, canVerify = true) {
  const values = new Map<string, string>();
  const library = {
    getValue: vi.fn((key: string, service: string) => ({value: values.get(`${service}/${key}`) ?? null})),
    setValue: vi.fn((value: string, key: string, service: string) => {
      values.set(`${service}/${key}`, value);
      return {value: null};
    }),
    deleteValue: vi.fn((key: string, service: string) => {
      values.delete(`${service}/${key}`);
      return {value: null};
    }),
    verify: vi.fn(async () => verifies),
    canVerify: vi.fn(() => canVerify),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsSecureStore' ? library : null) as never);
  return library;
}

describe('ExpoSecureStore (windows)', () => {
  it('keeps, reads and deletes values through the library, under the service as a folder', async () => {
    const library = withLibrary();
    const getValueWithKeyAsync = ExpoSecureStore.getValueWithKeyAsync as NonNullable<typeof ExpoSecureStore.getValueWithKeyAsync>;
    await ExpoSecureStore.setValueWithKeyAsync('secret', 'token');
    await expect(getValueWithKeyAsync('token')).resolves.toBe('secret');
    expect(library.setValue).toHaveBeenCalledWith('secret', 'token', DEFAULT_SERVICE);
    await ExpoSecureStore.setValueWithKeyAsync('other', 'token', {keychainService: 'app.auth'});
    await expect(getValueWithKeyAsync('token', {keychainService: 'app.auth'})).resolves.toBe('other');
    await expect(getValueWithKeyAsync('token')).resolves.toBe('secret');
    await ExpoSecureStore.deleteValueWithKeyAsync('token');
    await expect(getValueWithKeyAsync('token')).resolves.toBeNull();
    expect(library.verify).not.toHaveBeenCalled();
    ExpoSecureStore.setValueWithKeySync('now', 'sync', {keychainService: ''});
    expect(ExpoSecureStore.getValueWithKeySync('sync')).toBe('now');
    expect(library.getValue).toHaveBeenLastCalledWith('sync', DEFAULT_SERVICE);
    expect(ExpoSecureStore.canUseBiometricAuthentication()).toBe(true);
    expect(ExpoSecureStore.AFTER_FIRST_UNLOCK).toBe(KEYCHAIN_ACCESSIBILITY.AFTER_FIRST_UNLOCK);
  });

  it('asks Windows Hello first for a value that requires authentication, and refuses when the user does not verify', async () => {
    const library = withLibrary();
    await ExpoSecureStore.setValueWithKeyAsync('v', 'guarded', {requireAuthentication: true, authenticationPrompt: 'Unlock the vault'});
    expect(library.verify).toHaveBeenCalledWith('Unlock the vault');
    await (ExpoSecureStore.getValueWithKeyAsync as NonNullable<typeof ExpoSecureStore.getValueWithKeyAsync>)('guarded', {requireAuthentication: true});
    expect(library.verify).toHaveBeenLastCalledWith('Verify it is you');
    const refusing = withLibrary(false);
    await expect(ExpoSecureStore.deleteValueWithKeyAsync('guarded', {requireAuthentication: true})).rejects.toMatchObject({code: 'ERR_SECURESTORE_AUTH_FAILED'});
    expect(refusing.deleteValue).not.toHaveBeenCalled();
    expect(() => ExpoSecureStore.getValueWithKeySync('guarded', {requireAuthentication: true})).toThrow(/asynchronous call asks Windows Hello/);
    expect(() => ExpoSecureStore.setValueWithKeySync('v', 'guarded', {requireAuthentication: true})).toThrow(/asynchronous call asks Windows Hello/);
  });

  it('surfaces the library\'s error as an exception', async () => {
    const library = withLibrary();
    library.setValue.mockReturnValueOnce({error: 'The value could not be written'} as never);
    await expect(ExpoSecureStore.setValueWithKeyAsync('v', 'k')).rejects.toThrow('The value could not be written');
  });

  it('is absent, as the package reads availability, without the library', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(ExpoSecureStore.getValueWithKeyAsync).toBeUndefined();
    await expect(ExpoSecureStore.setValueWithKeyAsync('v', 'k')).rejects.toThrow(/SecureStore\.setItemAsync/);
    expect(() => ExpoSecureStore.getValueWithKeySync('k')).toThrow(/SecureStore\.getItem/);
    expect(ExpoSecureStore.canUseBiometricAuthentication()).toBe(false);
    withLibrary(true, false);
    expect(ExpoSecureStore.canUseBiometricAuthentication()).toBe(false);
  });
});
