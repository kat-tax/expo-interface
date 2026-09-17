import {TurboModuleRegistry} from 'react-native';
import {createLocalAuthenticationModule} from './local-authentication';

function withHello(availability: string, verification: string | Error = 'Verified') {
  const library = {
    checkAvailability: vi.fn(async () => availability),
    verify: vi.fn(async () => {
      if (verification instanceof Error) throw verification;
      return verification;
    }),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsLocalAuthentication' ? library : null) as never);
  return library;
}

describe('ExpoLocalAuthentication (windows)', () => {
  it('answers from Windows Hello\'s availability: hardware, enrolment, types and level', async () => {
    withHello('Available');
    const module = createLocalAuthenticationModule();
    await expect(module.hasHardwareAsync?.()).resolves.toBe(true);
    await expect(module.isEnrolledAsync?.()).resolves.toBe(true);
    await expect(module.supportedAuthenticationTypesAsync?.()).resolves.toEqual([1, 2]);
    await expect(module.getEnrolledLevelAsync?.()).resolves.toBe(1);
    withHello('NotConfiguredForUser');
    const notSetUp = createLocalAuthenticationModule();
    await expect(notSetUp.hasHardwareAsync?.()).resolves.toBe(true);
    await expect(notSetUp.isEnrolledAsync?.()).resolves.toBe(false);
    await expect(notSetUp.getEnrolledLevelAsync?.()).resolves.toBe(0);
    withHello('DeviceNotPresent');
    const none = createLocalAuthenticationModule();
    await expect(none.hasHardwareAsync?.()).resolves.toBe(false);
    await expect(none.supportedAuthenticationTypesAsync?.()).resolves.toEqual([]);
  });

  it('verifies with the prompt, and names the package\'s error for each other answer', async () => {
    const library = withHello('Available');
    const module = createLocalAuthenticationModule();
    await expect(module.authenticateAsync?.({promptMessage: 'Unlock the vault'})).resolves.toEqual({success: true});
    expect(library.verify).toHaveBeenCalledWith('Unlock the vault');
    await module.authenticateAsync?.({});
    expect(library.verify).toHaveBeenLastCalledWith('Authenticate');
    for (const [answer, error] of [
      ['Canceled', 'user_cancel'],
      ['DeviceNotPresent', 'not_available'],
      ['NotConfiguredForUser', 'not_enrolled'],
      ['DisabledByPolicy', 'not_available'],
      ['DeviceBusy', 'unable_to_process'],
      ['RetriesExhausted', 'lockout'],
      ['Mystery', 'unknown'],
    ]) {
      library.verify.mockResolvedValueOnce(answer);
      await expect(module.authenticateAsync?.({promptMessage: 'x'})).resolves.toEqual({success: false, error});
    }
    library.verify.mockRejectedValueOnce(new Error('The app has no window yet'));
    await expect(module.authenticateAsync?.({promptMessage: 'x'})).resolves.toEqual({success: false, error: 'unknown', warning: 'The app has no window yet'});
    library.verify.mockRejectedValueOnce('gone');
    await expect(module.authenticateAsync?.({promptMessage: 'x'})).resolves.toEqual({success: false, error: 'unknown', warning: 'gone'});
    // A native rejection is a plain object with the message beside a code.
    library.verify.mockRejectedValueOnce({code: 'EUNSPECIFIED', message: 'Element not found.'});
    await expect(module.authenticateAsync?.({promptMessage: 'x'})).resolves.toEqual({success: false, error: 'unknown', warning: 'Element not found.'});
  });

  it('has no methods, as the package reads availability, without the library', () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(createLocalAuthenticationModule()).toEqual({});
  });
});
