import {Platform} from 'react-native';
import {fireEvent, screen} from '@testing-library/react-native';
import {openBrowserAsync, WebBrowserPresentationStyle} from 'expo-web-browser';
import {renderApp} from 'expo-vitest/router';
import {ExternalLink} from './external-link';

vi.mock('expo-web-browser');

const app = {
  index: () => <ExternalLink href="https://expo.dev" testID="docs">Expo docs</ExternalLink>,
};

describe(`ExternalLink (${Platform.OS})`, () => {
  it('renders a link with the external href', async () => {
    await renderApp(app);
    const link = screen.getByTestId('docs');
    expect(link.props).toMatchObject({href: 'https://expo.dev', role: 'link'});
    expect(screen.getByText('Expo docs')).toBeOnTheScreen();
  });

  it('opens an in-app browser instead of leaving the app', async () => {
    await renderApp(app);
    await fireEvent.press(screen.getByTestId('docs'));
    expect(openBrowserAsync).toHaveBeenCalledTimes(1);
    expect(openBrowserAsync).toHaveBeenCalledWith('https://expo.dev', {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  });
});
