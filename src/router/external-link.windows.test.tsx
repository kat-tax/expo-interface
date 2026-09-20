import {Linking} from 'react-native';
import {fireEvent, screen} from '@testing-library/react-native';
import {renderApp} from 'expo-vitest/router';
import {ExternalLink} from './external-link';

const app = {
  index: () => <ExternalLink href="https://expo.dev" testID="docs">Expo docs</ExternalLink>,
};

/**
 * A press whose `preventDefault` marks the event, as React Native's synthetic
 * event does; the harness's stub is a no-op, which would let Expo Router
 * treat the press as unhandled and open the href a second time.
 */
const press = {
  defaultPrevented: false,
  preventDefault(this: {defaultPrevented: boolean}) {
    this.defaultPrevented = true;
  },
};

describe('ExternalLink (windows)', () => {
  it('renders a link with the external href', async () => {
    await renderApp(app);
    const link = screen.getByTestId('docs');
    expect(link.props).toMatchObject({href: 'https://expo.dev', role: 'link'});
    expect(screen.getByText('Expo docs')).toBeOnTheScreen();
  });

  it('opens the default browser through Linking, once', async () => {
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderApp(app);
    await fireEvent.press(screen.getByTestId('docs'), press);
    // The press is prevented, so Expo Router does not open the href as well.
    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith('https://expo.dev');
  });
});
