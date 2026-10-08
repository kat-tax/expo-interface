import type {ReactNode} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {byComposeTestID, host, nodes} from 'expo-vitest/native';
import {hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {MATERIAL_BADGE, UIKIT_BADGE} from './shared';
import {Badge} from '.';

const isIOS = Platform.OS === 'ios';

/** The geometry the badge is drawn to here: UIKit's capsule, or Material's. */
const drawn = isIOS ? UIKIT_BADGE : MATERIAL_BADGE;

/** Inside a native host, as a `ListItem`'s slots or a `NativeHost` are. */
const inHost = (node: ReactNode) => <NativeHostContext.Provider value={true}>{node}</NativeHostContext.Provider>;

/** What the Compose `Text` inside the badge is carrying, if anything. */
const composeText = () => nodes().map(n => n.props.text).filter((text): text is string => typeof text === 'string');

describe(`Badge (${Platform.OS})`, () => {
  it('draws a capsule in the destructive red, named for a screen reader', async () => {
    await render(<Badge count={3} testID="unread"/>);
    const badge = screen.getByTestId('unread');
    expect(StyleSheet.flatten(badge.props.style)).toMatchObject({
      backgroundColor: colors.light.destructive,
      minWidth: drawn.count,
      height: drawn.count,
      borderRadius: drawn.count / 2,
      paddingHorizontal: drawn.padding,
    });
    // Named, because a bare "3" read out in the middle of a row says nothing.
    expect(badge.props.accessibilityLabel).toBe('3 new');
    const number = screen.getByText('3');
    expect(number).toBeOnTheScreen();
    const type = StyleSheet.flatten(number.props.style);
    expect(type).toMatchObject({fontWeight: drawn.fontWeight, lineHeight: drawn.lineHeight});
    // Material's Label Small is tracked; UIKit's number is set as the font has it.
    expect(type.letterSpacing).toBe(isIOS ? undefined : 0.5);
  });

  it('draws a dot with nothing in it, at the dot size', async () => {
    await render(<Badge dot label="Unsaved" testID="dot"/>);
    const badge = screen.getByTestId('dot');
    expect(StyleSheet.flatten(badge.props.style)).toMatchObject({minWidth: drawn.dot, height: drawn.dot, borderRadius: drawn.dot / 2, paddingHorizontal: 0});
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

  it('takes the caller\'s style on its own view', async () => {
    await render(<Badge count={2} style={{marginStart: 4}} testID="styled"/>);
    expect(StyleSheet.flatten(screen.getByTestId('styled').props.style)).toMatchObject({marginStart: 4});
  });

  it('stands on its own in a React Native row, with no host of its own', async () => {
    await render(<Badge count={2} testID="free"/>);
    // Sized by Yoga like any view, so a strip of presence dots costs no hosts.
    expect(hosts()).toHaveLength(0);
    expect(nodes().some(n => n.type === 'ViewManagerAdapter_ExpoUI_BadgeView')).toBe(false);
    expect(screen.getByTestId('free')).toBeOnTheScreen();
  });

  if (isIOS) {
    it('is drawn inside a host too, where SwiftUI\'s own badge would paint nothing', async () => {
      await render(inHost(<Badge count={3} testID="hosted"/>));
      expect(screen.getByTestId('hosted').props.accessibilityLabel).toBe('3 new');
    });
    return;
  }

  describe('inside a host', () => {
    it('is the Material 3 Badge, filled with the destructive red', async () => {
      await render(inHost(<Badge count={3} testID="unread"/>));
      const badge = byComposeTestID('unread');
      expect(badge.props).toMatchObject({
        containerColor: colors.light.destructive,
        contentColor: '#FFFFFF',
      });
      // Compose's Text carries its content as a prop, not as an RN text node.
      expect(composeText()).toEqual(['3']);
    });

    it('sets the number in Label Small, the type the drawn badge copies', async () => {
      await render(inHost(<Badge count={3} testID="unread"/>));
      const number = nodes().find(n => n.props.text === '3');
      // Named outright: @expo/ui's Text passes a style of its own, which drops
      // the type Compose's Badge provides, so nothing else would set it.
      expect(number?.props).toMatchObject({typography: 'labelSmall'});
      expect(number?.props.fontSize).toBeUndefined();
      expect(number?.props.fontWeight).toBeUndefined();
    });

    it('draws a dot as a badge with nothing in it, which is how Compose draws one', async () => {
      await render(inHost(<Badge dot testID="dot"/>));
      expect(byComposeTestID('dot')).toBeTruthy();
      expect(composeText()).toEqual([]);
    });

    it('takes a fill and a text color of its own', async () => {
      await render(inHost(<Badge count={1} color="#FFFFFF" testID="light"/>));
      // White fill, so the number must be black to be readable.
      expect(byComposeTestID('light').props).toMatchObject({containerColor: '#FFFFFF', contentColor: '#000000'});
      await render(inHost(<Badge count={1} color="#FFFFFF" textColor="#FF0000" testID="told"/>));
      expect(byComposeTestID('told').props).toMatchObject({contentColor: '#FF0000'});
    });

    it('stops at the cap, and draws nothing for a count of nothing', async () => {
      await render(inHost(<Badge count={150} testID="many"/>));
      expect(composeText()).toEqual(['99+']);
      const {toJSON} = await render(inHost(<Badge count={0}/>));
      expect(toJSON()).toBeNull();
    });

    it('renders without a testID at all', async () => {
      await render(inHost(<Badge count={2}/>));
      expect(host(props => props.containerColor === colors.light.destructive)).toBeTruthy();
    });
  });
});
