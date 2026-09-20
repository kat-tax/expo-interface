import {render} from '@testing-library/react-native';
import {Platform, Pressable} from 'react-native';
import {fireIsland, island, islands} from 'expo-vitest/windows';

// A `.windows.test.tsx` runs on Windows only.
describe('a Windows test', () => {
  it('is told it is Windows', () => {
    expect(Platform.OS).toBe('windows');
    expect(Platform.select({windows: 'w', default: 'd'})).toBe('w');
    expect(process.env.EXPO_OS).toBe('windows');
  });

  it('finds a host view by its name and fires its events', async () => {
    const onPress = vi.fn();
    await render(<Pressable onPress={onPress} testID="target"/>);
    expect(islands('RCTView').length).toBeGreaterThan(0);
    await fireIsland(island('RCTView'), 'press');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(() => island('NoSuchIsland')).toThrow('No NoSuchIsland island (0 rendered)');
  });

  it('refuses a module the project forbids', async () => {
    await expect(import('expo-image')).rejects.toThrow('expo-image has no Windows implementation');
  });
});
