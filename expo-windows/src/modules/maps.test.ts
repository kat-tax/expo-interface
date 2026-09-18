import {TurboModuleRegistry} from 'react-native';
import {ExpoMaps} from './maps';
import {DENIED, GRANTED} from './permissions';

describe('ExpoMaps (windows)', () => {
  it('answers the location permission as the system grants it', async () => {
    const library = {requestAccess: vi.fn(async () => 'Allowed')};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsLocation' ? library : null) as never);
    await expect(ExpoMaps.getPermissionsAsync()).resolves.toBe(GRANTED);
    library.requestAccess.mockResolvedValueOnce('Denied');
    await expect(ExpoMaps.requestPermissionsAsync()).resolves.toBe(DENIED);
    library.requestAccess.mockResolvedValueOnce('Unspecified');
    await expect(ExpoMaps.getPermissionsAsync()).resolves.toMatchObject({status: 'undetermined', canAskAgain: true});
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(ExpoMaps.getPermissionsAsync()).resolves.toBe(DENIED);
  });
});
