import {TurboModuleRegistry} from 'react-native';
import {ExpoKeepAwake} from './keep-awake';

describe('ExpoKeepAwake (windows)', () => {
  it('keeps the display awake through the library while any tag is active, and tells a tag\'s listeners of its release', async () => {
    const power = {getState: vi.fn(), setKeepAwake: vi.fn()};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsPower' ? power : null) as never);
    await expect(ExpoKeepAwake.isAvailableAsync()).resolves.toBe(true);
    const heard: unknown[] = [];
    const subscription = ExpoKeepAwake.addListenerForTag('a', event => heard.push(event));
    const other = ExpoKeepAwake.addListenerForTag('a', event => heard.push(['other', event]));
    await ExpoKeepAwake.activate('a');
    await ExpoKeepAwake.activate('b');
    expect(power.setKeepAwake.mock.calls).toEqual([[true], [true]]);
    await ExpoKeepAwake.deactivate('a');
    expect(power.setKeepAwake).toHaveBeenLastCalledWith(true);
    expect(heard).toEqual([{state: 'RELEASE'}, ['other', {state: 'RELEASE'}]]);
    // Deactivating a tag that is not active changes nothing and tells no one.
    await ExpoKeepAwake.deactivate('a');
    expect(power.setKeepAwake).toHaveBeenCalledTimes(3);
    await ExpoKeepAwake.deactivate('b');
    expect(power.setKeepAwake).toHaveBeenLastCalledWith(false);
    other.remove();
    subscription.remove();
    await ExpoKeepAwake.activate('a');
    await ExpoKeepAwake.deactivate('a');
    expect(heard).toHaveLength(2);
  });

  it('takes the tags without effect, and says so, without the library', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(ExpoKeepAwake.isAvailableAsync()).resolves.toBe(false);
    await expect(ExpoKeepAwake.activate('x')).resolves.toBeUndefined();
    await expect(ExpoKeepAwake.deactivate('x')).resolves.toBeUndefined();
  });
});
