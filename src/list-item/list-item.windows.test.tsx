import {fireEvent, render, screen} from '@testing-library/react-native';
import {PlatformColor, Text} from 'react-native';
import {island, islands} from '../__tests__/windows';
import {ListItem} from '.';

const BUTTON = 'ExpoInterfaceButton';

describe('ListItem (windows)', () => {
  it('draws the headline, supporting text and slots in an inset row', async () => {
    await render(
      <ListItem leading={<Text>L</Text>} trailing={<Text>T</Text>} supporting="Every hour" testID="row">
        Sync
      </ListItem>,
    );
    const row = screen.getByTestId('row');
    expect(row).toHaveStyle({minHeight: 48, paddingHorizontal: 16});
    for (const text of ['L', 'Sync', 'Every hour', 'T']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(islands(BUTTON)).toHaveLength(0);
  });

  it('takes node children and supporting content, without the inset', async () => {
    await render(
      <ListItem inset={false} supporting={<Text>Detail</Text>} testID="row">
        <Text>Custom</Text>
      </ListItem>,
    );
    expect(screen.getByTestId('row')).not.toHaveStyle({paddingHorizontal: 16});
    expect(screen.getByText('Custom')).toBeOnTheScreen();
    expect(screen.getByText('Detail')).toBeOnTheScreen();
  });

  it('is a pressable named after a text headline when it has onPress', async () => {
    const onPress = vi.fn();
    await render(<ListItem onPress={onPress} testID="row">Open</ListItem>);
    const row = screen.getByTestId('row');
    expect(row.props.role).toBe('button');
    expect(row.props.accessibilityLabel).toBe('Open');
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('leaves the name to node children, and draws a number as its text', async () => {
    await render(
      <>
        <ListItem onPress={vi.fn()} testID="node"><Text>Custom</Text></ListItem>
        <ListItem onPress={vi.fn()} testID="count">{42}</ListItem>
      </>,
    );
    expect(screen.getByTestId('node').props.accessibilityLabel).toBeUndefined();
    expect(screen.getByTestId('count').props.accessibilityLabel).toBe('42');
    expect(screen.getByText('42')).toBeOnTheScreen();
  });

  it('takes the subtle fill under the pointer and while pressed', async () => {
    await render(<ListItem onPress={vi.fn()} testID="row">Open</ListItem>);
    const row = screen.getByTestId('row');
    await fireEvent(row, 'hoverIn');
    expect(row).toHaveStyle({backgroundColor: PlatformColor('SubtleFillColorSecondary')});
    await fireEvent(row, 'hoverOut');
    expect(row).not.toHaveStyle({backgroundColor: PlatformColor('SubtleFillColorSecondary')});
  });

  it('renders the action as the kit button, text or filled', async () => {
    const onSignOut = vi.fn();
    await render(
      <>
        <ListItem action={{label: 'Sign out', onPress: onSignOut, role: 'destructive'}}>Account</ListItem>
        <ListItem action={{label: 'Upgrade', onPress: vi.fn(), variant: 'filled', disabled: true}}>Plan</ListItem>
      </>,
    );
    const [signOut, upgrade] = islands(BUTTON);
    expect(signOut.props).toMatchObject({label: 'Sign out', variant: 'text', buttonRole: 'destructive', size: 'small'});
    expect(signOut.props.shape).toBe('default');
    expect(upgrade.props).toMatchObject({label: 'Upgrade', variant: 'filled', shape: 'rounded', disabled: true, buttonRole: 'default'});
    await fireEvent(island(BUTTON), 'press');
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('row actions (windows)', () => {
  const actions = [{label: 'Share', onPress: vi.fn()}, {label: 'Delete', role: 'destructive' as const, onPress: vi.fn()}];

  it('puts them in a real MenuFlyout, because SwipeControl needs XAML content to swipe', async () => {
    await render(<ListItem swipeActions={actions} testID="row">Essay</ListItem>);
    // The row is drawn in React Native here, so there is nothing for WinUI's
    // SwipeControl to hold; the platform's context menu is the answer instead.
    expect(islands('ExpoInterfaceMenuFlyout').length).toBeGreaterThan(0);
  });

  it('leaves the row alone when it has no actions of its own', async () => {
    await render(<ListItem testID="plain">Essay</ListItem>);
    expect(islands('ExpoInterfaceMenuFlyout')).toHaveLength(0);
  });
});
