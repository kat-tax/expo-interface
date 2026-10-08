import {Platform, StyleSheet, Text as RNText} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {Button} from '../button';
import {Divider} from '../divider';
import {TextField} from '../text-field';
import {colors, spacing} from '../theme';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {Toolbar} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const hosts = () => nodes().filter(n => n.type === HOST);

/**
 * The space each native row puts between its controls, in tree order: SwiftUI
 * takes it as `spacing`, Compose as a `spacedBy` arrangement.
 */
const rowSpacings = () => nodes()
  .filter(node => /HStackView|RowView/.test(node.type))
  .map(node => node.props.spacing ?? node.props.horizontalArrangement?.spacedBy);

describe(`Toolbar (${Platform.OS})`, () => {
  it('puts every control in one native view, with a rule on the content side', async () => {
    await render(
      <Toolbar
        leading={<><Button label="Bold" variant="text"/><Divider vertical/></>}
        trailing={<Button label="Export" variant="text"/>}
        testID="bar"
      />,
    );
    expect(hosts()).toHaveLength(1);
    expect(StyleSheet.flatten(screen.getByTestId('bar').props.style)).toMatchObject({
      backgroundColor: colors.light.background,
      borderRadius: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      width: '100%',
    });
  });

  it('puts the rule under a bar that sits at the top', async () => {
    await render(<Toolbar placement="top" leading={<Button label="Bold"/>} testID="bar"/>);
    const style = StyleSheet.flatten(screen.getByTestId('bar').props.style);
    expect(style.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
    expect(style.borderTopWidth).toBeUndefined();
  });

  it('splits into two hosts around a React Native field', async () => {
    await render(
      <Toolbar
        leading={<Button label="Bold" variant="text"/>}
        field={<TextField placeholder="Search" variant="inline"/>}
        trailing={<Button label="Next" variant="text"/>}
        testID="bar"
      />,
    );
    expect(hosts()).toHaveLength(2);
    expect(screen.getByPlaceholderText('Search')).toBeOnTheScreen();
  });

  it('leaves out the group a side has no controls for', async () => {
    await render(<Toolbar field={<TextField placeholder="Search" variant="inline"/>} testID="bar"/>);
    expect(hosts()).toHaveLength(0);
  });

  it('packs the controls tighter and pulls in the ends when it is compact', async () => {
    await render(
      <>
        <Toolbar leading={<Button label="Bold" variant="text"/>} testID="regular"/>
        <Toolbar density="compact" leading={<Button label="Bold" variant="text"/>} testID="compact"/>
      </>,
    );
    const regular = StyleSheet.flatten(screen.getByTestId('regular').props.style);
    const compact = StyleSheet.flatten(screen.getByTestId('compact').props.style);
    expect(regular.paddingHorizontal).toBe(16);
    expect(compact.paddingHorizontal).toBe(8);
    // The bar is no shorter for it: only the space across it changes.
    expect(compact.paddingVertical).toBe(regular.paddingVertical);
    // No padding above and below on Android, where Material's icon buttons
    // carry a 48dp container of their own and the bar is that container.
    expect(regular.paddingVertical).toBe(Platform.OS === 'android' ? 0 : spacing.two);
    // And the controls inside the host move with the ends, in that order.
    expect(rowSpacings()).toEqual([8, 2]);
  });

  it('carries the compact spacing into both groups around a field', async () => {
    await render(
      <Toolbar
        density="compact"
        leading={<Button label="Bold" variant="text"/>}
        field={<TextField placeholder="Search" variant="inline"/>}
        trailing={<Button label="Next" variant="text"/>}
        testID="bar"
      />,
    );
    expect(rowSpacings()).toEqual([2, 2]);
    // The React Native row holding the two hosts and the field between them.
    const gaps = nodes()
      .map(node => StyleSheet.flatten(node.props?.style))
      .filter(style => style?.flexDirection === 'row' && style.gap != null)
      .map(style => style.gap);
    expect(gaps).toEqual([2]);
  });

  it('takes a second row under the controls', async () => {
    await render(
      <Toolbar leading={<Button label="Bold"/>} testID="bar">
        <RNText>3 peers</RNText>
      </Toolbar>,
    );
    expect(screen.getByText('3 peers')).toBeOnTheScreen();
  });
});

describe('commands', () => {
  const isIOS = Platform.OS === 'ios';
  const labelOf = (node: {props: Record<string, unknown>}) =>
    (isIOS ? node.props.label : node.props.text) as string | undefined;
  /**
   * Whether a command is drawn on the bar itself.
   *
   * The overflow menu's entries are in the tree too — SwiftUI's `Menu` and
   * Compose's `DropdownMenu` both render their items as buttons whether the
   * menu is open or not — so a label found anywhere is not enough. What is
   * inside the menu is subtracted.
   */
  const onBar = (label: string) => {
    const menu = nodes().find(node => node.type.includes('Menu'));
    const overflow = new Set(menu ? nodes(menu).map(labelOf).filter(Boolean) : []);
    return nodes().some(node => labelOf(node) === label) && !overflow.has(label);
  };

  it('draws what belongs on the bar, and hides the rest behind one menu', async () => {
    const onPress = vi.fn();
    await render(
      <Toolbar
        commands={[{label: 'Undo', onPress}, {label: 'Redo'}, {label: 'Export', secondary: true}]}
        testID="bar"
      />,
    );
    expect(onBar('Undo')).toBe(true);
    expect(onBar('Redo')).toBe(true);
    // The secondary command is not on the bar at all: it is in the overflow
    // menu's items, which the platform's own menu draws when it opens.
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(true);
  });

  it('shows no overflow when nothing asked to be hidden', async () => {
    await render(<Toolbar commands={[{label: 'Undo'}]}/>);
    expect(onBar('Undo')).toBe(true);
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(false);
  });

  it('draws nothing on the bar when every command asked to be hidden', async () => {
    await render(<Toolbar commands={[{label: 'Export', secondary: true}]} testID="bar"/>);
    expect(onBar('Export')).toBe(false);
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(true);
  });

  it('draws a rule before a command that asks for one, and none before the first', async () => {
    await render(<Toolbar commands={[{label: 'Bold', separator: true}, {label: 'Italic'}, {label: 'Undo', separator: true}]}/>);
    const tree = nodes();
    // iOS: SwiftUI's Divider, vertical in the row's HStack; Android: Material's VerticalDivider.
    const rules = tree.filter(node => node.type.endsWith(isIOS ? 'DividerView' : 'VerticalDividerView'));
    expect(rules).toHaveLength(1);
    const at = (label: string) => tree.findIndex(node => labelOf(node) === label);
    const rule = tree.indexOf(rules[0]!);
    expect(at('Italic')).toBeLessThan(rule);
    expect(rule).toBeLessThan(at('Undo'));
    // Still one host: the rule draws inside the bar's row.
    expect(hosts()).toHaveLength(1);
  });

  it('keeps a toggle\'s state in the overflow as the menu\'s check', async () => {
    await render(<Toolbar commands={[{label: 'Undo'}, {label: 'Spellcheck', secondary: true, active: true}, {label: 'Wrap', secondary: true, active: false}]}/>);
    const menu = nodes().find(node => node.type.includes('Menu'))!;
    if (isIOS) {
      // A checked toggle is how a SwiftUI menu shows the current state; one that is off is a plain entry.
      expect(nodes(menu).find(node => node.props.label === 'Spellcheck')).toMatchObject({type: expect.stringContaining('Toggle'), props: {isOn: true}});
      expect(nodes(menu).find(node => node.props.label === 'Wrap')?.type).toContain('Button');
    } else {
      const entry = (label: string) => nodes(menu).find(node => node.type.endsWith('DropdownMenuItemView') && nodes(node).some(child => child.props.text === label))!;
      expect(host(p => p.text === '✓', entry('Spellcheck'))).toBeTruthy();
      expect(nodes(entry('Wrap')).some(node => node.props.text === '✓')).toBe(false);
    }
  });

  it('still takes the two slots when it was given no commands', async () => {
    await render(<Toolbar leading={<Button label="Bold" variant="text"/>} testID="bar"/>);
    expect(onBar('Bold')).toBe(true);
  });

  it('draws a command at the bar metrics of the platform, a toggle filled while on, in the label tone when asked', async () => {
    await render(
      <Toolbar
        commands={[
          {label: 'Pen', icon: icons.add, hideLabel: true, active: true, testID: 'pen'},
          {label: 'Erase', icon: icons.trash, hideLabel: true, tone: 'label', testID: 'erase'},
          {label: 'More tools', icon: icons.settings, secondary: true},
        ]}
      />,
    );
    const button = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
    const pen = button('pen').props;
    const erase = button('erase').props;
    // The commands sit in a row of their own at the bar's pitch, whatever the
    // density: 44pt on iOS (a 22pt symbol and 22 beside it), Android's 48dp
    // containers with nothing between them. The outer row keeps the density's gap.
    expect(rowSpacings()).toEqual(isIOS ? [8, 22] : [8, 0]);
    if (isIOS) {
      // The bar button's control size with a 22pt symbol, as the header's actions.
      expect(modifier(pen, 'controlSize')?.size).toBe('large');
      expect(modifier(pen, 'buttonStyle')?.style).toBe('borderedProminent');
      // VoiceOver hears the toggle that is on as selected.
      expect(modifier(pen, 'accessibilityAddTraits')?.traits).toEqual(['isSelected']);
      expect(modifier(erase, 'buttonStyle')?.style).toBe('plain');
      expect(modifier(erase, 'accessibilityAddTraits')).toBeUndefined();
      expect(modifier(erase, 'tint')?.tint.color).toBe('#000000');
      expect(modifier(pen, 'accessibilityLabel')?.label).toBe('Pen');
      expect(modifier(host(p => p.systemName === 'plus').props, 'font')?.size).toBe(22);
      expect(modifier(host(p => p.systemName === 'ellipsis').props, 'font')?.size).toBe(22);
    } else {
      // A toggle is Material's icon toggle button, checked while on, its
      // checked state in the semantics tree; the label color for the plain tool.
      expect(pen.checked).toBe(true);
      expect(pen.colors).toEqual({containerColor: '#00000000', contentColor: '#007AFF', checkedContainerColor: '#007AFF', checkedContentColor: '#FFFFFF'});
      expect(erase.colors).toEqual({contentColor: '#000000'});
      expect(host(p => p.contentDescription === 'Pen').props.size).toBe(22);
    }
  });
});
