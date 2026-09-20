import {Platform} from 'react-native';
import {where} from '.';

// A `.test.ts` runs on every platform, Windows included.
describe('a platform file', () => {
  it('is the one the platform resolves', () => {
    expect(['ios', 'android', 'web', 'windows']).toContain(Platform.OS);
    expect(where).toBe(Platform.OS);
  });
});
