import {Platform, StyleSheet, Text as RNText} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {Button} from '../button';
import {Divider} from '../divider';
import {TextField} from '../text-field';
import {colors} from '../theme';
import {nodes} from '../__tests__/native';
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
