import {render} from '@testing-library/react-native';
import {host, nodes} from 'expo-vitest/native';
import {HeaderHost} from './shared';
import {TextAction, TextMenu} from './toolbar';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

/**
 * The control Android's app bar cannot draw itself: an action or a menu with
 * no drawable to be an icon button with. The bar's custom view holds the
 * kit's own text button, in a host of its own, at the header's size.
 */
describe('Android text header controls', () => {
  it('draws a text action as the kit\'s button in a host, at the header size', async () => {
    await render(
      <HeaderHost>
        <TextAction label="Save" onPress={vi.fn()}/>
      </HeaderHost>,
    );
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(1);
    const text = host(p => p.text === 'Save');
    expect(text.props.color).toBe('#007AFF');
    // Material's text button: the press is the Button's own wiring.
    const button = nodes().find(n => n.type.endsWith('TextButton'))!;
    expect(button.props.colors).toEqual({contentColor: '#007AFF'});
    expect(button.props.enabled).toBe(true);
  });

  it('draws a text menu likewise, in the label tone and disabled when asked', async () => {
    await render(
      <HeaderHost>
        <TextMenu label="New" items={[{label: 'Blank document'}]} tone="label" disabled/>
      </HeaderHost>,
    );
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(1);
    expect(nodes().some(n => n.type.includes('DropdownMenu'))).toBe(true);
    const button = nodes().find(n => n.type.endsWith('TextButton'))!;
    expect(button.props.colors).toEqual({contentColor: '#000000'});
    expect(button.props.enabled).toBe(false);
    expect(host(p => p.text === 'Blank document')).toBeTruthy();
  });
});
