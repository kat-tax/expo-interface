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

  it('puts a field in the dialog\'s body through a portal, and Enter in it presses the first action that is not the cancel', async () => {
    const onRename = vi.fn();
    const onDismiss = vi.fn();
    const onChangeText = vi.fn();
    await render(
      <Alert
        title="Rename"
        visible
        onDismiss={onDismiss}
        input={{placeholder: 'Name', value: 'Essay', onChangeText, testID: 'name'}}
        actions={[{label: 'Cancel', role: 'cancel'}, {label: 'Rename', onPress: onRename}]}
      />,
    );
    const dialog = island(DIALOG);
    expect(typeof dialog.props.slot).toBe('string');
    const portal = island('ExpoInterfacePortal');
    expect(portal.props.slot).toBe(dialog.props.slot);
    // The field mounts once the portal's island is connected.
    expect(screen.queryAllByTestId('name')).toHaveLength(0);
    await fireIsland(portal, 'ready', {connected: true});
    const box = island('ExpoInterfaceTextBox');
    expect(box.props).toMatchObject({placeholder: 'Name', value: 'Essay', testID: 'name'});
    await fireIsland(box, 'changeText', {text: 'Essay 2'});
    expect(onChangeText).toHaveBeenCalledWith('Essay 2');
    await fireIsland(box, 'submit', {text: 'Essay 2'});
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does nothing on Enter with only a cancel, and holds no field as an action sheet', async () => {
    const onDismiss = vi.fn();
    await render(<Alert title="Open by id" visible onDismiss={onDismiss} input={{placeholder: 'Identifier'}} actions={[{label: 'Cancel', role: 'cancel'}]}/>);
    await fireIsland(island('ExpoInterfacePortal'), 'ready', {connected: true});
    await fireIsland(island('ExpoInterfaceTextBox'), 'submit', {text: 'x'});
    expect(onDismiss).not.toHaveBeenCalled();
    await render(<Alert title="Share" visible sheet input={{placeholder: 'Name'}}/>);
    expect(island(DIALOG).props.slot).toBeUndefined();
  });

  it('survives a close with nothing to call', async () => {
    await render(<Alert title="Saved" visible/>);
    await fireIsland(island(DIALOG), 'close', {index: 0});
  });
});
