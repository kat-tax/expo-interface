import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {ShareLink} from '.';

const isIOS = Platform.OS === 'ios';
/** The kit's Button renders as a SwiftUI view on iOS and a Compose one on Android. */
const button = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

describe(`ShareLink (${Platform.OS})`, () => {
  if (isIOS) {
    it('is SwiftUI\'s own ShareLink, so the system presents the sheet', async () => {
      await render(<ShareLink label="Share" url="https://example.com" message="Look" title="HIS-201" testID="share"/>);
      // The kit draws the label; the presentation belongs to the platform.
      const link = host(props => props.item === 'https://example.com');
      expect(link.props.subject).toBe('HIS-201');
      expect(link.props.message).toBe('Look');
    });

    it('reports the press, though the sheet belongs to the platform', async () => {
      const onShare = vi.fn();
      await render(<ShareLink label="Share" url="https://example.com" onShare={onShare} testID="share"/>);
      // No message with the link: SwiftUI takes the item alone.
      expect(host(props => props.item === 'https://example.com').props.message).toBeUndefined();
      await fireEvent.press(screen.getByTestId('share'));
      expect(onShare).toHaveBeenCalledWith(true);
    });

    it('shares the message itself when there is no link', async () => {
      await render(<ShareLink label="Share" message="Look at this" testID="share"/>);
      expect(host(props => props.item === 'Look at this').props.message).toBeUndefined();
    });

    it('draws a plain disabled button when there is nothing to share', async () => {
      await render(<ShareLink label="Share" testID="share"/>);
      // No ShareLink at all: a sheet with nothing in it is no use.
      expect(nodes().some(node => node.props.item !== undefined)).toBe(false);
      expect(modifier(button('share').props, 'disabled')).toBeTruthy();
    });
    return;
  }

  it('draws the kit\'s button, which React Native\'s own Share opens the sheet from', async () => {
    await render(<ShareLink label="Share" url="https://example.com" testID="share"/>);
    // The press path itself is exercised on web, where a press can actually be
    // simulated; here the button only has to be there and be usable.
    expect(button('share').props.enabled).toBe(true);
  });

  it('dims itself when there is nothing to share, and takes no press', async () => {
    await render(<ShareLink label="Share" testID="share"/>);
    expect(button('share').props.enabled).toBe(false);
  });
});
