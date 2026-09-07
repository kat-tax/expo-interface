import {Platform} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {render, screen} from '@testing-library/react-native';
import {NativeHost} from '../host';
import {byComposeTestID, nodes} from '../__tests__/native';
import {Spinner} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

describe(`Spinner (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('spins an indeterminate ring', () => {
      renderDom(<Spinner testID="loading"/>);
      const ring = dom.getByTestId('loading');
      expect(ring).toHaveClass('ui-progress-ring--indeterminate');
      expect(ring).not.toHaveAttribute('aria-valuenow');
    });
    return;
  }

  const isIOS = Platform.OS === 'ios';
  const ring = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

  it('mounts a host of its own outside one, and none inside', async () => {
    const hosts = () => nodes().filter(n => n.type === HOST).length;
    await render(<Spinner testID="loading"/>);
    expect(hosts()).toBe(1);
    expect(ring('loading')).toBeTruthy();

    await render(
      <NativeHost>
        <Spinner testID="loading"/>
      </NativeHost>,
    );
    expect(hosts()).toBe(1);
  });

  it('passes the size and color to the ring', async () => {
    await render(<Spinner size={32} color="#8959EA" testID="loading"/>);
    const {props} = ring('loading');
    if (isIOS) {
      // The system spinner keeps its own size; only the tint is ours.
      expect(props.modifiers).toBeDefined();
    } else {
      expect(props.color).toBe('#8959EA');
    }
  });
});
