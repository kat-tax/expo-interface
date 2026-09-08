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

  it('renders a trailing text action natively, after the trailing content', async () => {
    const onSignIn = vi.fn();
    await render(
      <ListItem trailing={<Text>T</Text>} action={{label: 'Sign in', onPress: onSignIn}} testID="row">
        Account
      </ListItem>,
    );
    if (isIOS) {
      // The kit's text button rides in the trailing accessory with the trailing content.
      const button = host(p => p.label === 'Sign in');
      expect(modifier(button.props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'plain'});
      expect(modifier(button.props, 'controlSize')).toEqual({$type: 'controlSize', size: 'small'});
      expect(modifier(button.props, 'tint')?.color).toBe(colors.light.tint);
      expect(JSON.stringify(accessories().at(-1))).toContain('"T"');
      await fireEvent.press(screen.container.queryAll(i => i.props.label === 'Sign in')[0]);
      expect(onSignIn).toHaveBeenCalledTimes(1);
    } else {
      const [trailing] = slot('trailingContent');
      expect(JSON.stringify(trailing)).toContain('"T"');
      const button = host(p => typeof p.onButtonPressed === 'function', trailing);
      expect(button.props.colors).toEqual({contentColor: colors.light.tint});
      expect(host(p => p.text === 'Sign in', button).props.color).toBe(colors.light.tint);
      await fireEvent(screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function')[0], 'buttonPressed');
      expect(onSignIn).toHaveBeenCalledTimes(1);
      // The row itself stays inert without an onPress.
      expect(modifier(row('row').props, 'clickable')).toBeUndefined();
    }
  });

  it('draws a filled action as a rounded control in the accent', async () => {
    await render(<ListItem action={{label: 'Sign in', variant: 'filled', onPress: vi.fn()}} testID="row">Account</ListItem>);
    if (isIOS) {
      const button = host(p => p.label === 'Sign in');
      expect(modifier(button.props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'borderedProminent'});
      expect(modifier(button.props, 'buttonBorderShape')).toMatchObject({shape: 'roundedRectangle'});
    } else {
      const button = host(p => typeof p.onButtonPressed === 'function');
      expect(button.props.colors).toEqual({containerColor: colors.light.tint, contentColor: colors.light.onTint});
      expect(button.props.contentPadding).toEqual({start: 16, top: 6, end: 16, bottom: 6});
      expect(host(p => p.text === 'Sign in', button).props.color).toBe(colors.light.onTint);
    }
  });

  it('greys out a disabled action and colors a destructive one', async () => {
    const onPress = vi.fn();
    await render(
      <>
        <ListItem action={{label: 'Signing in…', onPress, disabled: true}} testID="busy">Account</ListItem>
        <ListItem action={{label: 'Sign out', onPress, role: 'destructive'}} testID="out">Account</ListItem>
      </>,
    );
    if (isIOS) {
      expect(modifier(host(p => p.label === 'Signing in…').props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      expect(modifier(host(p => p.label === 'Sign out').props, 'tint')?.color).toBe(colors.light.destructive);
      expect(host(p => p.label === 'Sign out').props.role).toBe('destructive');
    } else {
      const [busy, out] = nodes().filter(n => typeof n.props.onButtonPressed === 'function' || n.props.enabled === false);
      expect(busy.props.enabled).toBe(false);
      expect(host(p => p.text === 'Signing in…').props.color).toBe(colors.light.tertiaryLabel);
      expect(out.props.colors).toEqual({contentColor: colors.light.destructive});
      expect(host(p => p.text === 'Sign out').props.color).toBe(colors.light.destructive);
    }
  });

  (isIOS ? it.skip : it)('lays a row without its own inset out as a plain Row', async () => {
    await render(
      <ListItem inset={false} leading={<Text>L</Text>} supporting="Signed out" testID="row">
        Account
      </ListItem>,
    );
    // No Compose ListItem: its 16dp inset is baked in and would double the container's.
    expect(slot('headlineContent')).toHaveLength(0);
    const text = host(p => p.text === 'Account');
    expect(text.props.color).toBe(colors.light.label);
    expect(host(p => p.text === 'Signed out').props.color).toBe(colors.light.secondaryLabel);
    expect(JSON.stringify(nodes()[0])).toContain('"L"');
    expect(modifier(byComposeTestID('row').props, 'testID')).toBeTruthy();
    // No padding: the container hands down a minimum height and centers the
    // row in it, so padding here would stand the row taller than its siblings.
    expect(modifier(byComposeTestID('row').props, 'padding')).toBeUndefined();
  });

  (isIOS ? it.skip : it)('passes numeric and element headlines through without a testID', async () => {
    const {rerender} = await render(<ListItem>{42}</ListItem>);
    expect(nodes()[0].props.modifiers).toEqual([]);
    expect(host(p => String(p.text) === '42').props.color).toBe(colors.light.label);
    await rerender(<ListItem><Text>Rich</Text></ListItem>);
    expect(JSON.stringify(slot('headlineContent')[0])).toContain('"Rich"');
  });
});
