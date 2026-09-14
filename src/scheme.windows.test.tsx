import {Appearance} from 'react-native';
import {act, renderHook} from '@testing-library/react-native';
import {getColorSchemeMode, setColorScheme, useColorScheme} from './scheme';

describe('setColorScheme (windows)', () => {
  afterEach(() => {
    setColorScheme('system');
  });

  it('forces the scheme in JavaScript and asks the platform too', async () => {
    const native = vi.spyOn(Appearance, 'setColorScheme');
    const {result} = await renderHook(() => useColorScheme());
    expect(result.current).toBe('light');
    expect(getColorSchemeMode()).toBe('system');

    await act(async () => setColorScheme('dark'));
    expect(result.current).toBe('dark');
    expect(Appearance.getColorScheme()).toBe('dark');
    expect(getColorSchemeMode()).toBe('dark');
    expect(native).toHaveBeenCalledWith('dark');

    await act(async () => setColorScheme('system'));
    expect(result.current).toBe('light');
    expect(getColorSchemeMode()).toBe('system');
    expect(native).toHaveBeenCalledWith('unspecified');
    native.mockRestore();
  });

  it('tells every Appearance listener', async () => {
    const listener = vi.fn();
    const subscription = Appearance.addChangeListener(listener);
    await act(async () => setColorScheme('dark'));
    expect(listener).toHaveBeenCalledWith({colorScheme: 'dark'});
    subscription.remove();
    await act(async () => setColorScheme('light'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
