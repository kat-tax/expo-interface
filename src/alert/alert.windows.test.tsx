import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {Alert} from '.';

const DIALOG = 'ExpoInterfaceContentDialog';

describe('Alert (windows)', () => {
  it('renders the ContentDialog island from a zero-size anchor, with the trigger in place', async () => {
    await render(
      <Alert title="Delete file?" message="This cannot be undone." visible={false} testID="confirm">
        <Text>Trigger</Text>
      </Alert>,
    );
    expect(screen.getByText('Trigger')).toBeOnTheScreen();
    const dialog = island(DIALOG);
    expect(dialog.props).toMatchObject({open: false, title: 'Delete file?', message: 'This cannot be undone.', testID: 'confirm'});
    expect(dialog.props.style).toMatchObject({position: 'absolute', width: 0, height: 0});
    expect(JSON.parse(dialog.props.actions)).toEqual([{label: 'OK', role: 'cancel'}]);
  });

  it('passes the actions with their roles', async () => {
    await render(
      <Alert
        title="Delete file?"
        visible
        actions={[{label: 'Cancel', role: 'cancel'}, {label: 'Delete', role: 'destructive'}, {label: 'Keep'}]}
      />,
    );
    expect(island(DIALOG).props.open).toBe(true);
    expect(JSON.parse(island(DIALOG).props.actions)).toEqual([
      {label: 'Cancel', role: 'cancel'},
      {label: 'Delete', role: 'destructive'},
      {label: 'Keep', role: 'default'},
    ]);
  });

  it('calls the picked action, then onDismiss; a plain close only dismisses', async () => {
    const onDelete = vi.fn();
    const onDismiss = vi.fn();
    await render(
      <Alert title="Delete file?" visible onDismiss={onDismiss} actions={[{label: 'Delete', role: 'destructive', onPress: onDelete}, {label: 'Cancel', role: 'cancel'}]}/>,
    );
    await fireIsland(island(DIALOG), 'close', {index: 0});
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await fireIsland(island(DIALOG), 'close', {index: -1});
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('survives a close with nothing to call', async () => {
    await render(<Alert title="Saved" visible/>);
    await fireIsland(island(DIALOG), 'close', {index: 0});
  });
});
