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

  it('takes a second row under the controls', async () => {
    await render(
      <Toolbar leading={<Button label="Bold"/>} testID="bar">
        <RNText>3 peers</RNText>
      </Toolbar>,
    );
    expect(screen.getByText('3 peers')).toBeOnTheScreen();
  });
});
