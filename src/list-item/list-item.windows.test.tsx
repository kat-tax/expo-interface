import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
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

  it('is a pressable when it has onPress', async () => {
    const onPress = vi.fn();
    await render(<ListItem onPress={onPress} testID="row">Open</ListItem>);
    const row = screen.getByTestId('row');
    expect(row.props.role).toBe('button');
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
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
