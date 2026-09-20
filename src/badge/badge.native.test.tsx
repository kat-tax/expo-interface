import {Platform, StyleSheet} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {byComposeTestID, host, nodes} from 'expo-vitest/native';
import {Badge} from '.';

const isIOS = Platform.OS === 'ios';

/** What the Compose `Text` inside the badge is carrying, if anything. */
const composeText = () => nodes().map(n => n.props.text).filter((text): text is string => typeof text === 'string');

describe(`Badge (${Platform.OS})`, () => {
  if (isIOS) {
    it('draws a capsule in the destructive red, named for a screen reader', async () => {
      await render(<Badge count={3} testID="unread"/>);
      const badge = screen.getByTestId('unread');
      expect(StyleSheet.flatten(badge.props.style)).toMatchObject({
        backgroundColor: colors.light.destructive,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
      });
      // Named, because a bare "3" read out in the middle of a row says nothing.
      expect(badge.props.accessibilityLabel).toBe('3 new');
      expect(screen.getByText('3')).toBeOnTheScreen();
    });

    it('draws a dot with nothing in it, at the dot size', async () => {
      await render(<Badge dot label="Unsaved" testID="dot"/>);
      const badge = screen.getByTestId('dot');
      expect(StyleSheet.flatten(badge.props.style)).toMatchObject({minWidth: 8, height: 8, borderRadius: 4});
      expect(badge.props.accessibilityLabel).toBe('Unsaved');
      expect(badge.props.children).toBeFalsy();
    });

    it('contrasts the number against a fill of its own, and takes one when told', async () => {
      await render(<Badge count={1} color="#FFFFFF" testID="light"/>);
      expect(StyleSheet.flatten(screen.getByText('1').props.style)).toMatchObject({color: '#000000'});
      await render(<Badge count={1} color="#FFFFFF" textColor="#FF0000" testID="told"/>);
      expect(StyleSheet.flatten(screen.getByText('1').props.style)).toMatchObject({color: '#FF0000'});
    });

    it('stops at the cap, and draws nothing for a count of nothing', async () => {
      await render(<Badge count={150} testID="many"/>);
      expect(screen.getByText('99+')).toBeOnTheScreen();
      const {toJSON} = await render(<Badge count={0}/>);
      expect(toJSON()).toBeNull();
    });
    return;
  }

  it('hosts the Material 3 Badge, filled with the destructive red', async () => {
    await render(<Badge count={3} testID="unread"/>);
    const badge = byComposeTestID('unread');
    expect(badge.props).toMatchObject({
      containerColor: colors.light.destructive,
      contentColor: '#FFFFFF',
    });
    // Compose's Text carries its content as a prop, not as an RN text node.
    expect(composeText()).toEqual(['3']);
  });

  it('draws a dot as a badge with nothing in it, which is how Compose draws one', async () => {
    await render(<Badge dot testID="dot"/>);
    expect(byComposeTestID('dot')).toBeTruthy();
    expect(composeText()).toEqual([]);
  });

  it('takes a fill and a text color of its own', async () => {
    await render(<Badge count={1} color="#FFFFFF" testID="light"/>);
    // White fill, so the number must be black to be readable.
    expect(byComposeTestID('light').props).toMatchObject({containerColor: '#FFFFFF', contentColor: '#000000'});
    await render(<Badge count={1} color="#FFFFFF" textColor="#FF0000" testID="told"/>);
    expect(byComposeTestID('told').props).toMatchObject({contentColor: '#FF0000'});
  });

  it('stops at the cap, and draws nothing for a count of nothing', async () => {
    await render(<Badge count={150} testID="many"/>);
    expect(composeText()).toEqual(['99+']);
    const {toJSON} = await render(<Badge count={0}/>);
    expect(toJSON()).toBeNull();
  });

  it('renders without a testID at all', async () => {
    await render(<Badge count={2}/>);
    expect(host(props => props.containerColor === colors.light.destructive)).toBeTruthy();
  });
});
