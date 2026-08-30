import {Platform} from 'react-native';
import {fireEvent as fireDOM, screen as dom} from '@testing-library/react';
import {fireEvent, screen} from '@testing-library/react-native';
import {openBrowserAsync, WebBrowserPresentationStyle} from 'expo-web-browser';
import {renderApp} from '../__tests__/router';
import {ExternalLink} from './external-link';

vi.mock('expo-web-browser');

const app = {
  index: () => <ExternalLink href="https://expo.dev" testID="docs">Expo docs</ExternalLink>,
};

describe(`ExternalLink (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('renders an anchor that opens in a new tab', async () => {
      await renderApp(app);
      const link = dom.getByTestId('docs');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', 'https://expo.dev');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.textContent).toBe('Expo docs');
    });

    it('leaves navigation to the browser', async () => {
      await renderApp(app);
      fireDOM.click(dom.getByTestId('docs'));
      expect(openBrowserAsync).not.toHaveBeenCalled();
    });
  } else {
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
  }
});
