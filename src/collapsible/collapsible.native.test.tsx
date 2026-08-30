import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from '@expo/ui';
import {host, modifier, nodes} from '../__tests__/native';
import {Collapsible} from '.';


const isIOS = Platform.OS === 'ios';
/** Whether the native disclosure is open: SwiftUI `isExpanded` / Compose `AnimatedVisibility.visible`. */
const isOpen = () => isIOS
  ? screen.getByTestId('more').props.isExpanded
  : host(p => Array.isArray(p.enterTransition)).props.visible;

describe(`Collapsible (${Platform.OS})`, () => {
  it('renders the label row with the content beneath', async () => {
    await render(
      <Collapsible label="Version 1.0.0" testID="more">
        <Text>Built with expo-interface.</Text>
      </Collapsible>,
    );
    if (isIOS) {
      const label = host(p => p.text === 'Version 1.0.0', host(p => p.name === 'label'));
      expect(modifier(label.props, 'foregroundStyle')).toMatchObject({color: '#000000'});
      expect(host(p => p.text === 'Built with expo-interface.')).toBeTruthy();
    } else {
      const label = host(p => p.text === 'Version 1.0.0', host(p => p.slotName === 'headlineContent'));
      expect(label.props.color).toBe('#000000');
      expect(host(p => p.text === 'Built with expo-interface.')).toBeTruthy();
    }
    expect(isOpen()).toBe(false);
  });

  it('starts open with defaultExpanded', async () => {
    await render(<Collapsible label="More" defaultExpanded testID="more"/>);
    expect(isOpen()).toBe(true);
  });

  it('follows the expanded prop when controlled', async () => {
    const {rerender} = await render(<Collapsible label="More" expanded={false} testID="more"/>);
    expect(isOpen()).toBe(false);
    await rerender(<Collapsible label="More" expanded testID="more"/>);
    expect(isOpen()).toBe(true);
  });

  (isIOS ? it : it.skip)('toggles its own state when uncontrolled and reports the change', async () => {
    const onExpandedChange = vi.fn();
    await render(<Collapsible label="More" onExpandedChange={onExpandedChange} testID="more"/>);
    await fireEvent(screen.getByTestId('more'), 'isExpandedChange', {nativeEvent: {isExpanded: true}});
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(isOpen()).toBe(true);
  });

  (isIOS ? it : it.skip)('reports but does not apply the change when controlled', async () => {
    const onExpandedChange = vi.fn();
    await render(<Collapsible label="More" expanded={false} onExpandedChange={onExpandedChange} testID="more"/>);
    await fireEvent(screen.getByTestId('more'), 'isExpandedChange', {nativeEvent: {isExpanded: true}});
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(isOpen()).toBe(false);
  });

  (isIOS ? it.skip : it)('renders the Material expandable list item', async () => {
    await render(<Collapsible label="More" testID="more"/>);
    const [card] = nodes();
    expect(modifier(card.props, 'clip')).toMatchObject({shape: {type: 'roundedCorner', radius: 16}});
    const row = host(p => modifier(p, 'clickable') !== undefined);
    expect(row.props.colors).toEqual({containerColor: 'transparent'});
    expect(host(p => p.slotName === 'trailingContent')).toBeTruthy();
  });
});
