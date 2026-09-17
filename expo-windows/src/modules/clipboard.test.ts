import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {createClipboardModule} from './clipboard';

function withNative(modules: Record<string, object>) {
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (modules[name] ?? null) as never);
}

describe('ExpoClipboard (windows)', () => {
  it('reads and writes text through react-native-windows\' clipboard module without the library', async () => {
    const getString = vi.fn(async () => 'pasted');
    const setString = vi.fn();
    withNative({Clipboard: {getString, setString}});
    const clipboard = createClipboardModule();
    await expect(clipboard.getStringAsync()).resolves.toBe('pasted');
    await expect(clipboard.hasStringAsync()).resolves.toBe(true);
    await expect(clipboard.setStringAsync('copied')).resolves.toBe(true);
    expect(setString).toHaveBeenCalledWith('copied');
    expect(clipboard.isPasteButtonAvailable).toBe(false);
  });

  it('is empty, and cannot write, without any native module', async () => {
    withNative({});
    const clipboard = createClipboardModule();
    await expect(clipboard.getStringAsync()).resolves.toBe('');
    await expect(clipboard.hasStringAsync()).resolves.toBe(false);
    await expect(clipboard.setStringAsync('copied')).resolves.toBe(false);
  });

  it('reports the URL and image methods unavailable without the library, as the package expects', async () => {
    withNative({});
    const clipboard = createClipboardModule();
    await expect(clipboard.getUrlAsync()).rejects.toThrow(/Clipboard.getUrlAsync is not available on windows/);
    await expect(clipboard.setUrlAsync('https://expo.dev')).rejects.toThrow(/setUrlAsync/);
    await expect(clipboard.hasUrlAsync()).rejects.toThrow(/hasUrlAsync/);
    await expect(clipboard.getImageAsync()).rejects.toThrow(/getImageAsync/);
    await expect(clipboard.setImageAsync('AAAA')).rejects.toThrow(/setImageAsync/);
    await expect(clipboard.hasImageAsync()).rejects.toThrow(/hasImageAsync/);
  });

  it('goes through the library for text, links and images when it is there', async () => {
    const library = {
      getString: vi.fn(async () => 'from the library'),
      setString: vi.fn(async () => true),
      hasString: vi.fn(async () => true),
      getUrl: vi.fn(async () => 'https://expo.dev/'),
      setUrl: vi.fn(async () => {}),
      hasUrl: vi.fn(async () => true),
      getImage: vi.fn(async () => ({data: 'data:image/png;base64,AAAA', size: {width: 2, height: 1}})),
      setImage: vi.fn(async () => {}),
      hasImage: vi.fn(async () => false),
    };
    withNative({ExpoWindowsClipboard: library});
    const clipboard = createClipboardModule();
    await expect(clipboard.getStringAsync({preferredFormat: 'html'})).resolves.toBe('from the library');
    expect(library.getString).toHaveBeenCalledWith('html');
    await expect(clipboard.getStringAsync()).resolves.toBe('from the library');
    expect(library.getString).toHaveBeenLastCalledWith('plainText');
    await expect(clipboard.setStringAsync('<b>x</b>', {inputFormat: 'html'})).resolves.toBe(true);
    expect(library.setString).toHaveBeenCalledWith('<b>x</b>', 'html');
    await clipboard.setStringAsync('plain');
    expect(library.setString).toHaveBeenLastCalledWith('plain', 'plainText');
    await expect(clipboard.hasStringAsync()).resolves.toBe(true);
    await expect(clipboard.getUrlAsync()).resolves.toBe('https://expo.dev/');
    await clipboard.setUrlAsync('https://expo.dev/');
    expect(library.setUrl).toHaveBeenCalledWith('https://expo.dev/');
    await expect(clipboard.hasUrlAsync()).resolves.toBe(true);
    await expect(clipboard.getImageAsync()).resolves.toEqual({data: 'data:image/png;base64,AAAA', size: {width: 2, height: 1}});
    await clipboard.setImageAsync('AAAA');
    expect(library.setImage).toHaveBeenCalledWith('AAAA');
    await expect(clipboard.hasImageAsync()).resolves.toBe(false);
    // No link on the clipboard is null, as the package says.
    library.getUrl.mockResolvedValueOnce('');
    await expect(clipboard.getUrlAsync()).resolves.toBeNull();
  });

  // Expo Modules Core's emitter calls `startObserving` on the first listener
  // and `stopObserving` after the last; the harness's stand-in does not, so
  // the hooks are driven here and the emit is watched.
  it('forwards the library\'s change event as onClipboardChanged while observed', () => {
    withNative({});
    const clipboard = createClipboardModule();
    const emit = vi.spyOn(clipboard, 'emit').mockImplementation(() => {});
    clipboard.startObserving();
    clipboard.startObserving();
    DeviceEventEmitter.emit('onClipboardChanged', {contentTypes: ['plain-text']});
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('onClipboardChanged', {contentTypes: ['plain-text']});
    clipboard.stopObserving();
    clipboard.stopObserving();
    DeviceEventEmitter.emit('onClipboardChanged', {contentTypes: ['image']});
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
