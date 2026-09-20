import {Platform, Text} from 'react-native';
import {renderApp} from 'expo-vitest/router';

// A `.test.tsx` runs on iOS, Android and web.
describe('a shared test', () => {
  it('stays off Windows', () => {
    expect(['ios', 'android', 'web']).toContain(Platform.OS);
  });

  it('mounts an in-memory Expo Router app', async () => {
    await renderApp({index: () => <Text>Home</Text>});
    if (Platform.OS === 'web') {
      const {screen} = await import('@testing-library/react');
      expect(await screen.findByText('Home')).toBeTruthy();
    } else {
      const {screen} = await import('@testing-library/react-native');
      expect(await screen.findByText('Home')).toBeOnTheScreen();
    }
  });
});
