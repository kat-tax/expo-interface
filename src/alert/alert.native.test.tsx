import type {AlertAction} from './types';
import type {HostNode} from '../__tests__/native';
import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {Button} from '../button';
import {host, modifier, nodes} from '../__tests__/native';
import {Alert} from '.';


const isIOS = Platform.OS === 'ios';
const children = (node: HostNode) => (node.children ?? []).filter((c): c is HostNode => typeof c === 'object');
/** SwiftUI slot (`name`) or Compose slot (`slotName`) of the dialog. */
const slot = (name: string) => host(p => (isIOS ? p.name : p.slotName) === name);
const hasSlot = (name: string) => nodes().some(n => (isIOS ? n.props.name : n.props.slotName) === name);
/** Compose text buttons inside a slot, with the label they show. */
const buttonsIn = (name: string) => nodes(slot(name))
  .filter(n => n.props.contentPadding)
  .map(n => ({label: host(p => typeof p.text === 'string', n).props.text, props: n.props}));

const confirm: AlertAction[] = [
  {label: 'Cancel', role: 'cancel'},
  {label: 'Delete', role: 'destructive'},
];

describe(`Alert (${Platform.OS})`, () => {
  it('presents the native alert while visible', async () => {
    await render(<Alert title="Link copied" message="Share it anywhere." visible testID="alert"/>);
    if (isIOS) {
      const alert = screen.getByTestId('alert');
      expect(alert.props).toMatchObject({title: 'Link copied', isPresented: true});
      expect(alert.props.titleVisibility).toBeUndefined();
      expect(host(p => p.text === 'Share it anywhere.', slot('message'))).toBeTruthy();
    } else {
      expect(nodes()[0].props.colors).toEqual({containerColor: '#ECE6F0FF'});
      expect(host(p => p.text === 'Link copied', slot('title')).props).toMatchObject({
        color: '#1D1B20FF',
        typography: 'headlineSmall',
      });
      expect(host(p => p.text === 'Share it anywhere.', slot('text')).props).toMatchObject({
        color: '#49454FFF',
        typography: 'bodyMedium',
      });
    }
  });

  it('stays mounted but hidden when not visible', async () => {
    await render(<Alert title="Hi" visible={false} testID="alert"/>);
    if (isIOS) {
      expect(screen.getByTestId('alert').props.isPresented).toBe(false);
    } else {
      expect(screen.toJSON()).toBeNull();
    }
  });

  it('defaults to a single OK action', async () => {
    await render(<Alert title="Hi" visible testID="alert"/>);
    if (isIOS) {
      expect(children(slot('actions')).map(b => b.props)).toEqual([{role: 'cancel', label: 'OK'}]);
      expect(hasSlot('message')).toBe(false);
    } else {
      expect(buttonsIn('dismissButton').map(b => b.label)).toEqual(['OK']);
      expect(hasSlot('confirmButton')).toBe(false);
      expect(hasSlot('text')).toBe(false);
    }
  });

  it('maps the action roles', async () => {
    await render(
      <Alert
        title="Unsaved changes"
        visible
        testID="alert"
        actions={[
          {label: 'Cancel', role: 'cancel'},
          {label: "Don't save", role: 'destructive'},
          {label: 'Save'},
        ]}
      />,
    );
    if (isIOS) {
      expect(children(slot('actions')).map(b => b.props)).toEqual([
        {role: 'cancel', label: 'Cancel'},
        {role: 'destructive', label: "Don't save"},
        {role: 'default', label: 'Save'},
      ]);
    } else {
      const others = buttonsIn('confirmButton');
      expect(others.map(b => b.label)).toEqual(["Don't save", 'Save']);
      expect(others[0].props.colors).toEqual({contentColor: '#FF3B30'});
      expect(others[1].props.colors).toEqual({contentColor: '#007AFF'});
      expect(buttonsIn('dismissButton').map(b => b.label)).toEqual(['Cancel']);
    }
  });

  it('renders the sheet variant', async () => {
    await render(<Alert title="Share drop" visible sheet testID="alert" actions={confirm}/>);
    if (isIOS) {
      const dialog = screen.getByTestId('alert');
      expect(dialog.props).toMatchObject({title: 'Share drop', isPresented: true, titleVisibility: 'visible'});
    } else {
      // The confirm slot stacks the actions in a Column instead of a Row.
      const [stack] = children(slot('confirmButton'));
      expect(host(p => p.text === 'Delete', stack)).toBeTruthy();
      expect(buttonsIn('dismissButton').map(b => b.label)).toEqual(['Cancel']);
    }
  });

  it('anchors the presentation on the trigger, or an invisible spacer', async () => {
    const {rerender} = await render(
      <Alert title="Hi" visible={false} testID="alert">
        <Button label="Open" testID="open"/>
      </Alert>,
    );
    if (isIOS) {
      expect(host(p => p.label === 'Open', slot('trigger'))).toBeTruthy();
      await rerender(<Alert title="Hi" visible={false} testID="alert"/>);
      const [spacer] = children(slot('trigger'));
      expect(modifier(spacer.props, 'frame')).toEqual({$type: 'frame', width: 0, height: 0});
    } else {
      expect(host(p => p.text === 'Open')).toBeTruthy();
      expect(nodes().some(n => n.props.slotName === 'title')).toBe(false);
    }
  });

  (isIOS ? it.skip : it)('tints the actions with the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Alert title="Hi" visible actions={[{label: 'Cancel', role: 'cancel'}, {label: 'Save'}]}/>
      </AccentProvider>,
    );
    expect(buttonsIn('confirmButton')[0].props.colors).toEqual({contentColor: '#8959EA'});
    expect(buttonsIn('dismissButton')[0].props.colors).toEqual({contentColor: '#8959EA'});
  });

  it('reports the dismissal', async () => {
    const onDismiss = vi.fn();
    const onDelete = vi.fn();
    await render(
      <Alert
        title="Delete?"
        visible
        onDismiss={onDismiss}
        testID="alert"
        actions={[{label: 'Cancel', role: 'cancel'}, {label: 'Delete', role: 'destructive', onPress: onDelete}]}
      />,
    );
    if (isIOS) {
      // SwiftUI dismisses the alert itself and reports the presented state.
      await fireEvent(screen.getByTestId('alert'), 'isPresentedChange', {nativeEvent: {isPresented: true}});
      expect(onDismiss).not.toHaveBeenCalled();
      await fireEvent(screen.getByTestId('alert'), 'isPresentedChange', {nativeEvent: {isPresented: false}});
      expect(onDismiss).toHaveBeenCalledTimes(1);
    } else {
      const [dialog] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
      await fireEvent(dialog, 'dismissRequest');
      expect(onDismiss).toHaveBeenCalledTimes(1);
      const [remove] = screen.container.queryAll(
        i => typeof i.props.onButtonPressed === 'function' && i.props.colors?.contentColor === '#FF3B30',
      );
      await fireEvent(remove, 'buttonPressed');
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(2);
    }
  });
});
