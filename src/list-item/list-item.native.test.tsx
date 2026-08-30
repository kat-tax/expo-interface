import {Platform, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {ListItem} from '.';

const isIOS = Platform.OS === 'ios';
const row = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
const slot = (name: string) => nodes().filter(n => n.props?.slotName === name);
const accessories = () => nodes().filter(n => n.props?.matchContents === true);

describe(`ListItem (${Platform.OS})`, () => {
  it('renders the headline as native text', async () => {
    await render(<ListItem testID="row">Wi-Fi</ListItem>);
    const {props} = row('row');
    if (isIOS) {
      expect(modifier(props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'plain'});
      expect(host(p => p.text === 'Wi-Fi')).toBeTruthy();
      expect(accessories()).toHaveLength(0);
    } else {
      expect(props.colors).toEqual({containerColor: '#00000000'});
      expect(modifier(props, 'clickable')).toBeUndefined();
      const [headline] = slot('headlineContent');
      expect(headline).toBeTruthy();
      const text = host(p => p.text === 'Wi-Fi', headline);
      expect(text.props.color).toBe(colors.light.label);
      expect(slot('leadingContent')).toHaveLength(0);
      expect(slot('trailingContent')).toHaveLength(0);
      expect(slot('supportingContent')).toHaveLength(0);
    }
  });

  it('renders supporting text in the secondary color', async () => {
    await render(<ListItem supporting="Connected" testID="row">Wi-Fi</ListItem>);
    const text = host(p => p.text === 'Connected');
    if (isIOS) {
      expect(modifier(text.props, 'foregroundStyle')).toMatchObject({color: 'secondaryLabel'});
    } else {
      expect(text.props.color).toBe(colors.light.secondaryLabel);
      expect(text.props.fontSize).toBe(14);
      expect(slot('supportingContent')[0].children).toContainEqual(text);
    }
  });

  it('places leading and trailing content in their slots', async () => {
    await render(
      <ListItem leading={<Text>L</Text>} trailing={<Text>T</Text>} testID="row">
        Head
      </ListItem>,
    );
    if (isIOS) {
      // Raw RN accessories are pinned to their measured size via RNHostView.
      const [leading, trailing] = accessories();
      expect(JSON.stringify(leading)).toContain('"L"');
      expect(JSON.stringify(trailing)).toContain('"T"');
      const stack = host(p => p.spacing === 12);
      expect(modifier(stack.props, 'contentShape')).toMatchObject({shape: 'rectangle'});
    } else {
      expect(JSON.stringify(slot('leadingContent')[0])).toContain('"L"');
      expect(JSON.stringify(slot('trailingContent')[0])).toContain('"T"');
    }
  });

  it('accepts rich supporting content', async () => {
    await render(<ListItem supporting={<Text>Rich</Text>} testID="row">Head</ListItem>);
    if (isIOS) {
      const stack = host(p => p.alignment === 'leading' && p.spacing === 2);
      expect(JSON.stringify(stack)).toContain('"Rich"');
    } else {
      expect(JSON.stringify(slot('supportingContent')[0])).toContain('"Rich"');
    }
  });

  it('wires up the press handler', async () => {
    const onPress = vi.fn();
    await render(<ListItem onPress={onPress} testID="row">Tap</ListItem>);
    if (isIOS) {
      await fireEvent.press(screen.getByTestId('row'));
      expect(onPress).toHaveBeenCalledTimes(1);
    } else {
      expect(modifier(row('row').props, 'clickable')).toMatchObject({$type: 'clickable'});
    }
  });
});
