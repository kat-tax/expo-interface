import type {ReactNode} from 'react';
import type {HostNode} from 'expo-vitest/native';
import {Platform, StyleSheet} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {setColorScheme} from 'vitest-native/helpers';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {MATERIAL_BADGE, UIKIT_BADGE} from './shared';
import {Badge} from '.';

const isIOS = Platform.OS === 'ios';

/** The geometry the badge is drawn to here: UIKit's capsule, or Material's. */
const drawn = isIOS ? UIKIT_BADGE : MATERIAL_BADGE;

/** Inside a native host, as a `ListItem`'s slots or a `NativeHost` are. */
const inHost = (node: ReactNode) => <NativeHostContext.Provider value={true}>{node}</NativeHostContext.Provider>;

/** The Compose `Badge` drawn inside a host. */
const composeBadge = () => nodes().find(n => n.type.endsWith('BadgeView'))!;

/** What the Compose `Text` inside the badge is carrying, if anything. */
const composeText = () => nodes(composeBadge()).map(n => n.props.text).filter((text): text is string => typeof text === 'string');

/** The transparent text in a hosted badge's end padding, which TalkBack reads after the number. */
const unseenText = () => nodes().filter(n => n.props.color === '#00000000').map(n => n.props.text);

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

  it('takes a palette token for its fill, resolved for the scheme, with a number that reads on it', async () => {
    await render(<Badge count={4} color="highlight" testID="token"/>);
    expect(StyleSheet.flatten(screen.getByTestId('token').props.style)).toMatchObject({backgroundColor: colors.light.highlight});
    // Highlight is pale, so the number is black.
    expect(StyleSheet.flatten(screen.getByText('4').props.style)).toMatchObject({color: '#000000'});
  });

  it('reads a color that is not hex to pick the number\'s black or white', async () => {
    await render(<Badge count={5} color="yellow" testID="named"/>);
    expect(StyleSheet.flatten(screen.getByText('5').props.style)).toMatchObject({color: '#000000'});
    await render(<Badge count={6} color="rgb(0, 0, 139)" testID="rgb"/>);
    expect(StyleSheet.flatten(screen.getByText('6').props.style)).toMatchObject({color: '#FFFFFF'});
  });

  it('judges a translucent fill as it shows over the screen\'s background', async () => {
    // pillBackground is a dark gray at 12%: near white over the light screen,
    // so its number is black, though the gray alone would pick white.
    await render(<Badge count={7} color="pillBackground" testID="pill"/>);
    expect(StyleSheet.flatten(screen.getByText('7').props.style)).toMatchObject({color: '#000000'});
    await render(<Badge count={8} color="rgba(0, 0, 0, 0.1)" testID="raw"/>);
    expect(StyleSheet.flatten(screen.getByText('8').props.style)).toMatchObject({color: '#000000'});
    // Over the dark screen the same token is near black.
    await act(() => setColorScheme('dark'));
    try {
      await render(<Badge count={9} color="pillBackground" testID="dark"/>);
      expect(StyleSheet.flatten(screen.getByText('9').props.style)).toMatchObject({color: '#FFFFFF'});
    } finally {
      await act(() => setColorScheme('light'));
    }
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

  it('is no element of its own with a null label, for a parent that speaks for it', async () => {
    await render(<Badge count={3} label={null} testID="spoken"/>);
    // Hidden as the testing library models assistive technology: found only
    // when hidden elements are asked for.
    expect(screen.queryByTestId('spoken')).toBeNull();
    const badge = screen.getByTestId('spoken', {includeHiddenElements: true});
    // On Android an accessible view inside another is a stop of its own, so
    // the parent and then the badge would each be read.
    expect(badge.props).toMatchObject({accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true});
    expect(badge.props.accessibilityLabel).toBeUndefined();
    expect(badge.props.accessibilityRole).toBeUndefined();
    expect(screen.getByText('3', {includeHiddenElements: true})).toBeOnTheScreen();
  });

  it('stands on its own in a React Native row, with no host of its own', async () => {
    await render(<Badge count={2} testID="free"/>);
    // Sized by Yoga like any view, so a strip of presence dots costs no hosts.
    expect(hosts()).toHaveLength(0);
    expect(nodes().some(n => n.type === 'ViewManagerAdapter_ExpoUI_BadgeView')).toBe(false);
    expect(screen.getByTestId('free')).toBeOnTheScreen();
  });

  if (isIOS) {
    describe('inside a host', () => {
      /** The SwiftUI text that is a hosted badge's number, by its testID. */
      const number = (testID: string) => host(p => p.testID === testID && typeof p.text === 'string');
      /** The SwiftUI circle that is a hosted dot, by its testID. */
      const circle = (testID: string) => host(p => p.testID === testID && p.text === undefined);

      it('is the capsule in SwiftUI, named for a screen reader, with no React Native view', async () => {
        await render(inHost(<Badge count={3} testID="unread"/>));
        // Not a React Native view, which the row's host would draw at no size
        // of its own: nothing carries the label as a prop.
        expect(screen.queryByLabelText('3 new')).toBeNull();
        expect(hosts()).toHaveLength(0);
        const badge = number('unread');
        expect(badge.type.endsWith('TextView')).toBe(true);
        expect(badge.props.text).toBe('3');
        expect(modifier(badge.props, 'accessibilityLabel')?.label).toBe('3 new');
        expect(modifier(badge.props, 'font')).toMatchObject({size: 11, weight: 'semibold'});
        // The number must not reflow when the count changes from 1 to 7.
        expect(modifier(badge.props, 'monospacedDigit')).toBeDefined();
        expect(modifier(badge.props, 'foregroundStyle')?.style.color).toBe('#FFFFFF');
        expect(modifier(badge.props, 'padding')?.horizontal).toBe(UIKIT_BADGE.padding);
        expect(modifier(badge.props, 'frame')).toMatchObject({minWidth: UIKIT_BADGE.count, height: UIKIT_BADGE.count});
        expect(modifier(badge.props, 'background')).toMatchObject({style: {type: 'color', color: colors.light.destructive}, shape: 'capsule'});
        // Still: nothing to animate.
        expect(modifier(badge.props, 'opacity')).toBeUndefined();
        expect(modifier(badge.props, 'animation')).toBeUndefined();
      });

      it('draws a dot as a circle of its own size: one element, named', async () => {
        await render(inHost(<Badge dot label="Unsaved" testID="dot"/>));
        const dot = circle('dot');
        expect(dot.type.endsWith('ZStackView')).toBe(true);
        expect(modifier(dot.props, 'frame')).toMatchObject({width: UIKIT_BADGE.dot, height: UIKIT_BADGE.dot});
        expect(modifier(dot.props, 'background')).toMatchObject({style: {type: 'color', color: colors.light.destructive}, shape: 'circle'});
        // The circle itself is what VoiceOver stops on, not the spacer that fills it.
        expect(modifier(dot.props, 'accessibilityElement')).toBeDefined();
        expect(modifier(dot.props, 'accessibilityLabel')?.label).toBe('Unsaved');
        expect(nodes().some(n => typeof n.props.text === 'string')).toBe(false);
      });

      it('takes a fill and a text color of its own, and a palette token resolved for the scheme', async () => {
        await render(inHost(<Badge count={1} color="#FFFFFF" testID="light"/>));
        // White fill, so the number must be black to be readable.
        expect(modifier(number('light').props, 'background')?.style.color).toBe('#FFFFFF');
        expect(modifier(number('light').props, 'foregroundStyle')?.style.color).toBe('#000000');
        await render(inHost(<Badge count={1} color="#FFFFFF" textColor="#FF0000" testID="told"/>));
        expect(modifier(number('told').props, 'foregroundStyle')?.style.color).toBe('#FF0000');
        await render(inHost(<Badge count={4} color="highlight" testID="token"/>));
        expect(modifier(number('token').props, 'background')?.style.color).toBe(colors.light.highlight);
        expect(modifier(number('token').props, 'foregroundStyle')?.style.color).toBe('#000000');
      });

      it('stops at the cap, takes the caller\'s wording, and draws nothing for a count of nothing', async () => {
        await render(inHost(<Badge count={150} label="Many unread" testID="many"/>));
        expect(number('many').props.text).toBe('99+');
        expect(modifier(number('many').props, 'accessibilityLabel')?.label).toBe('Many unread');
        const {toJSON} = await render(inHost(<Badge count={0}/>));
        expect(toJSON()).toBeNull();
      });

      it('renders without a testID at all', async () => {
        await render(inHost(<Badge count={2}/>));
        expect(host(p => p.text === '2').props.testID).toBeUndefined();
      });

      it('is hidden from VoiceOver with a null label, for a parent that speaks for it', async () => {
        await render(inHost(<Badge count={3} label={null} testID="spoken"/>));
        expect(modifier(number('spoken').props, 'accessibilityHidden')?.hidden).toBe(true);
        expect(modifier(number('spoken').props, 'accessibilityLabel')).toBeUndefined();
        await render(inHost(<Badge dot label={null} testID="quiet"/>));
        expect(modifier(circle('quiet').props, 'accessibilityHidden')?.hidden).toBe(true);
        expect(modifier(circle('quiet').props, 'accessibilityLabel')).toBeUndefined();
      });
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
      expect(unseenText()).toEqual(['new']);
    });

    it('puts the rest of its label in its end padding as unseen text, which TalkBack reads after the number', async () => {
      await render(inHost(<Badge count={3} label="3 unread messages" testID="unread"/>));
      // A box the badge sizes, with the text after the badge in the tree.
      const [box] = nodes().filter(n => n.type.endsWith('BoxView'));
      expect(box.props.contentAlignment).toBe('center');
      const [badge, words] = (box.children ?? []) as HostNode[];
      expect(modifier(badge.props, 'testID')?.testID).toBe('unread');
      expect(words.props).toMatchObject({text: 'unread messages', color: '#00000000', maxLines: 1});
      // At the end edge, as wide as Material's padding beside the number and as
      // high as a dot: it covers none of the number, which an unmerged tree
      // would otherwise leave out, and comes after it by position too. Not
      // the badge's own size, which would lay it over the number.
      expect(modifier(words.props, 'align')?.alignment).toBe('centerEnd');
      expect(modifier(words.props, 'size')).toMatchObject({width: MATERIAL_BADGE.padding, height: MATERIAL_BADGE.dot});
      expect(modifier(words.props, 'matchParentSize')).toBeUndefined();
    });

    it('adds no unseen text when the label is the number alone', async () => {
      await render(inHost(<Badge count={3} label="3" testID="bare"/>));
      expect(composeText()).toEqual(['3']);
      expect(unseenText()).toEqual([]);
    });

    it('puts in no words at all with a null label, and keeps the number Compose reads', async () => {
      await render(inHost(<Badge count={3} label={null} testID="spoken"/>));
      expect(composeText()).toEqual(['3']);
      expect(unseenText()).toEqual([]);
      // A dot's whole label is its words, so a dot its parent speaks for says nothing.
      await render(inHost(<Badge dot label={null} testID="quiet"/>));
      expect(byComposeTestID('quiet')).toBeTruthy();
      expect(unseenText()).toEqual([]);
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
      // A dot draws no number, so its whole label is the unseen text.
      expect(unseenText()).toEqual(['New']);
    });

    it('takes a fill and a text color of its own', async () => {
      await render(inHost(<Badge count={1} color="#FFFFFF" testID="light"/>));
      // White fill, so the number must be black to be readable.
      expect(byComposeTestID('light').props).toMatchObject({containerColor: '#FFFFFF', contentColor: '#000000'});
      await render(inHost(<Badge count={1} color="#FFFFFF" textColor="#FF0000" testID="told"/>));
      expect(byComposeTestID('told').props).toMatchObject({contentColor: '#FF0000'});
    });

    it('takes a palette token for its fill, resolved for the scheme', async () => {
      await render(inHost(<Badge count={4} color="highlight" testID="token"/>));
      expect(byComposeTestID('token').props).toMatchObject({containerColor: colors.light.highlight, contentColor: '#000000'});
    });

    it('reads a color that is not hex to pick the number\'s black or white', async () => {
      await render(inHost(<Badge count={5} color="hsl(60, 100%, 50%)" testID="hsl"/>));
      expect(byComposeTestID('hsl').props).toMatchObject({containerColor: 'hsl(60, 100%, 50%)', contentColor: '#000000'});
    });

    it('judges a translucent fill as it shows over the screen\'s background', async () => {
      await render(inHost(<Badge count={7} color="pillBackground" testID="pill"/>));
      expect(byComposeTestID('pill').props).toMatchObject({containerColor: colors.light.pillBackground, contentColor: '#000000'});
    });

    it('stops at the cap, and draws nothing for a count of nothing', async () => {
      await render(inHost(<Badge count={150} testID="many"/>));
      expect(composeText()).toEqual(['99+']);
      expect(unseenText()).toEqual(['new']);
      const {toJSON} = await render(inHost(<Badge count={0}/>));
      expect(toJSON()).toBeNull();
    });

    it('renders without a testID at all', async () => {
      await render(inHost(<Badge count={2}/>));
      expect(host(props => props.containerColor === colors.light.destructive)).toBeTruthy();
    });
  });
});
