import {TurboModuleRegistry} from 'react-native';
import {createClipboardModule} from './clipboard';

describe('ExpoClipboard (windows)', () => {
  it('reads and writes text through react-native-windows\' clipboard module', async () => {
    const getString = vi.fn(async () => 'pasted');
    const setString = vi.fn();
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue({getString, setString} as never);
    const clipboard = createClipboardModule();
    await expect(clipboard.getStringAsync()).resolves.toBe('pasted');
    await expect(clipboard.hasStringAsync()).resolves.toBe(true);
    await expect(clipboard.setStringAsync('copied')).resolves.toBe(true);
    expect(setString).toHaveBeenCalledWith('copied');
    expect(clipboard.isPasteButtonAvailable).toBe(false);
  });

  it('is empty, and cannot write, without the native module', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const clipboard = createClipboardModule();
    await expect(clipboard.getStringAsync()).resolves.toBe('');
    await expect(clipboard.hasStringAsync()).resolves.toBe(false);
    await expect(clipboard.setStringAsync('copied')).resolves.toBe(false);
  });

  it('leaves the URL and image methods out, so the package reports them unavailable', () => {
    const clipboard = createClipboardModule() as unknown as Record<string, unknown>;
    for (const method of ['getUrlAsync', 'setUrlAsync', 'hasUrlAsync', 'getImageAsync', 'setImageAsync', 'hasImageAsync']) {
      expect(clipboard[method]).toBeUndefined();
    }
  });
});
