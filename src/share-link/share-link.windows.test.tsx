import {TurboModuleRegistry} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {ShareLink} from '.';

/** The kit's own Windows module, which React Native's Share cannot stand in for. */
function stubModule(share: ReturnType<typeof vi.fn> | null) {
  return vi.spyOn(TurboModuleRegistry, 'get').mockImplementation((name: string) =>
    name === 'ExpoInterfaceShare' && share ? ({share, isAvailable: vi.fn()} as never) : null,
  );
}

describe('ShareLink (windows)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the system sheet through the kit\'s module, because RN\'s Share does not reach here', async () => {
    const share = vi.fn().mockResolvedValue(true);
    stubModule(share);
    const onShare = vi.fn();
    await render(<ShareLink label="Share" title="HIS-201" message="Look" url="https://example.com" onShare={onShare} testID="share"/>);
    await fireEvent.press(screen.getByTestId('share'));
    // Title, message and link as three fields: DataTransferManager takes a web
    // link of its own rather than folding it into the text.
    expect(share).toHaveBeenCalledWith('HIS-201', 'Look', 'https://example.com');
    expect(onShare).toHaveBeenCalledWith(true);
  });

  it('says the share did not happen rather than throwing, in a bundle without the native library', async () => {
    stubModule(null);
    const onShare = vi.fn();
    await render(<ShareLink label="Share" url="https://example.com" onShare={onShare} testID="share"/>);
    await fireEvent.press(screen.getByTestId('share'));
    expect(onShare).toHaveBeenCalledWith(false);
  });

  it('reports a sheet the platform refused to open', async () => {
    stubModule(vi.fn().mockResolvedValue(false));
    const onShare = vi.fn();
    await render(<ShareLink label="Share" url="https://example.com" onShare={onShare} testID="share"/>);
    await fireEvent.press(screen.getByTestId('share'));
    expect(onShare).toHaveBeenCalledWith(false);
  });

  it('is disabled with nothing to share', async () => {
    const share = vi.fn();
    stubModule(share);
    await render(<ShareLink label="Share" testID="share"/>);
    await fireEvent.press(screen.getByTestId('share'));
    expect(share).not.toHaveBeenCalled();
  });
});
