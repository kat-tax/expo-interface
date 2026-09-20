// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import {Share} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react';
import {ShareLink} from '.';

describe('ShareLink (web)', () => {
  it('hands the link and the message to React Native\'s Share, which is navigator.share here', async () => {
    const share = vi.spyOn(Share, 'share').mockResolvedValue({action: Share.sharedAction} as never);
    const onShare = vi.fn();
    render(<ShareLink label="Share" url="https://example.com" message="Look" onShare={onShare} testID="share"/>);
    fireEvent.click(screen.getByTestId('share'));
    await vi.waitFor(() => expect(onShare).toHaveBeenCalled());
    // Android has no separate slot for a link, so it rides in the message too.
    expect(share).toHaveBeenCalledWith(
      {title: 'Share', message: 'Look\nhttps://example.com', url: 'https://example.com'},
      {dialogTitle: 'Share'},
    );
    expect(onShare).toHaveBeenCalledWith(true);
    share.mockRestore();
  });

  it('takes its own title for the sheet when it was given one', async () => {
    const share = vi.spyOn(Share, 'share').mockResolvedValue({action: Share.sharedAction} as never);
    render(<ShareLink label="Share" title="HIS-201" url="https://example.com" testID="share"/>);
    fireEvent.click(screen.getByTestId('share'));
    await vi.waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0]![0]).toMatchObject({title: 'HIS-201', message: 'https://example.com'});
    share.mockRestore();
  });

  it('reports a sheet that was dismissed, and one that never opened', async () => {
    const share = vi.spyOn(Share, 'share').mockResolvedValue({action: Share.dismissedAction} as never);
    const onShare = vi.fn();
    render(<ShareLink label="Share" url="https://example.com" onShare={onShare} testID="share"/>);
    fireEvent.click(screen.getByTestId('share'));
    await vi.waitFor(() => expect(onShare).toHaveBeenLastCalledWith(false));

    share.mockRejectedValue(new Error('no sheet'));
    fireEvent.click(screen.getByTestId('share'));
    // A sheet that cannot open is a share that did not happen, not a throw.
    await vi.waitFor(() => expect(onShare).toHaveBeenCalledTimes(2));
    expect(onShare).toHaveBeenLastCalledWith(false);
    share.mockRestore();
  });

  it('shares a message on its own, with no link to hand over', async () => {
    const share = vi.spyOn(Share, 'share').mockResolvedValue({action: Share.sharedAction} as never);
    render(<ShareLink label="Share" message="Look at this" testID="share"/>);
    fireEvent.click(screen.getByTestId('share'));
    await vi.waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0]![0]).toEqual({title: 'Share', message: 'Look at this', url: undefined});
    share.mockRestore();
  });

  it('is disabled with nothing to share', () => {
    render(<ShareLink label="Share" testID="share"/>);
    expect(screen.getByTestId('share')).toBeDisabled();
  });
});
