import {fireEvent as fireDOM, screen as dom} from '@testing-library/react';
import {openBrowserAsync} from 'expo-web-browser';
import {renderApp} from 'expo-vitest/router';
import {ExternalLink} from './external-link';

vi.mock('expo-web-browser');

const app = {
  index: () => <ExternalLink href="https://expo.dev" testID="docs">Expo docs</ExternalLink>,
};

describe('ExternalLink (web)', () => {
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
});
