import {Platform} from 'react-native';
import {playHaptic} from './play';
import {haptic} from '.';

vi.mock('./play', async importOriginal => ({
  ...(await importOriginal<typeof import('./play')>()),
  playHaptic: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe(`haptic pacing (${Platform.OS})`, () => {
  it('reads the monotonic clock and plays only the steps the pacer lets through', () => {
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(1000).mockReturnValueOnce(1050).mockReturnValueOnce(1200);
    haptic('lift');
    haptic('step');
    haptic('step');
    const played = vi.mocked(playHaptic).mock.calls.map(([kind]) => kind);
    expect(played).toEqual(Platform.OS === 'windows' ? [] : ['lift', 'step']);
  });
});
