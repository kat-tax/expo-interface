import type {AlertAction} from './types';
import type {HostNode} from 'expo-vitest/native';
import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {Button} from '../button';
import {NativeHost} from '../host';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
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
  (isIOS ? it.skip : it)('carries the testID as a Compose modifier', async () => {
    await render(<Alert title="Hi" visible testID="alert"/>);
    expect(byComposeTestID('alert')).toBeTruthy();
  });

  it('mounts a host of its own outside one, and none inside', async () => {
    const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
    const hosts = () => nodes().filter(n => n.type === HOST).length;
    await render(<Alert title="Hi" visible testID="alert"/>);
    // Rendered in a React Native layout: the dialog needs a host of its own.
    expect(hosts()).toBe(1);
    await render(
      <NativeHost>
        <Alert title="Hi" visible testID="alert"/>
      </NativeHost>,
    );
    // Inside one already: nesting hosts is not allowed.
    expect(hosts()).toBe(1);
  });

  it('presents the native alert while visible', async () => {
    await render(<Alert title="Link copied" message="Share it anywhere." visible testID="alert"/>);
    if (isIOS) {
      const alert = screen.getByTestId('alert');
      expect(alert.props).toMatchObject({title: 'Link copied', isPresented: true});
      expect(alert.props.titleVisibility).toBeUndefined();
      expect(host(p => p.text === 'Share it anywhere.', slot('message'))).toBeTruthy();
    } else {
      expect(host(p => !!p.colors).props.colors).toEqual({containerColor: '#ECE6F0FF'});
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
      // Only the alert's own host is left: the dialog itself is unmounted.
      expect(hasSlot('title')).toBe(false);
    }
  });

  it('defaults to a single OK action', async () => {
    await render(<Alert title="Hi" visible testID="alert"/>);
    if (isIOS) {
      expect(children(slot('actions')).map(({props: {role, label}}) => ({role, label}))).toEqual([{role: 'cancel', label: 'OK'}]);
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
      expect(children(slot('actions')).map(({props: {role, label}}) => ({role, label}))).toEqual([
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

  (isIOS ? it : it.skip)('reports a sheet closed by a press outside it, with its cancel action disabled', async () => {
    const onDismiss = vi.fn();
    const onCancel = vi.fn();
    await render(
      <Alert
        title="Share drop"
        visible
        sheet
        onDismiss={onDismiss}
        testID="alert"
        actions={[{label: 'Cancel', role: 'cancel', disabled: true, onPress: onCancel}, {label: 'Delete', role: 'destructive'}]}
      />,
    );
    // SwiftUI closes the action sheet on a press outside it and reports the presented state.
    await fireEvent(screen.getByTestId('alert'), 'isPresentedChange', {nativeEvent: {isPresented: false}});
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('greys out a disabled action, which takes no press', async () => {
    const onRename = vi.fn();
    const onDismiss = vi.fn();
    const actions = (disabled: boolean): AlertAction[] => [
      {label: 'Cancel', role: 'cancel', disabled: true, onPress: vi.fn()},
      {label: 'Rename', disabled, onPress: onRename},
      {label: 'Keep', onPress: vi.fn()},
    ];
    const {rerender} = await render(<Alert title="Rename" visible onDismiss={onDismiss} testID="alert" actions={actions(true)}/>);
    if (isIOS) {
      // Every button carries the modifier, so enabling one changes its value.
      const state = () => children(slot('actions')).map(b => [modifier(b.props, 'disabled')?.disabled, typeof b.props.onButtonPress]);
      expect(state()).toEqual([[true, 'undefined'], [true, 'undefined'], [false, 'function']]);
      await rerender(<Alert title="Rename" visible onDismiss={onDismiss} testID="alert" actions={actions(false)}/>);
      expect(state()).toEqual([[true, 'undefined'], [false, 'function'], [false, 'function']]);
      const [rename] = screen.container.queryAll(i => i.props.label === 'Rename' && typeof i.props.onButtonPress === 'function');
      await fireEvent(rename, 'buttonPress');
      expect(onRename).toHaveBeenCalledTimes(1);
    } else {
      // A disabled Material button, with no press handler at all.
      const state = (name: string) => buttonsIn(name).map(b => [b.label, b.props.enabled, typeof b.props.onButtonPressed]);
      expect(state('confirmButton')).toEqual([['Rename', false, 'undefined'], ['Keep', true, 'function']]);
      expect(state('dismissButton')).toEqual([['Cancel', false, 'undefined']]);
      // The back gesture and a press outside still dismiss it.
      const [dialog] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
      await fireEvent(dialog, 'dismissRequest');
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }
  });

  it('puts a field where the platform\'s alert takes one: among the actions on iOS, under the message on Android', async () => {
    const onChangeText = vi.fn();
    await render(
      <Alert
        title="Rename"
        message="A name for the document."
        visible
        testID="alert"
        input={{placeholder: 'Name', value: 'Essay', onChangeText, autoCapitalize: 'words', autoCorrect: false, testID: 'name'}}
        actions={[{label: 'Cancel', role: 'cancel'}, {label: 'Rename'}]}
      />,
    );
    if (isIOS) {
      const field = host(p => p.placeholder === 'Name', slot('actions'));
      expect(field.props.autoFocus).toBe(true);
      expect(field.props.testID).toBe('name');
      expect(modifier(field.props, 'autocorrectionDisabled')).toEqual({$type: 'autocorrectionDisabled', disabled: true});
      expect(children(slot('actions')).map(b => b.props.label ?? b.props.placeholder)).toEqual(['Name', 'Cancel', 'Rename']);
    } else {
      const field = host(p => p.autoFocus === true, slot('text'));
      expect(modifier(field.props, 'testID')?.testID).toBe('name');
      expect(field.props.keyboardOptions.autoCorrectEnabled).toBe(false);
      expect(host(p => p.text === 'Name', field)).toBeTruthy();
      expect(host(p => p.text === 'A name for the document.', slot('text'))).toBeTruthy();
      // Material's outlined field, its outline and container Material's own (none overridden to
      // transparent), the cursor the kit's tint; the dialog's width, with no form inset to undo.
      expect(field.props.variant).toBe('outlined');
      expect(field.props.colors).toEqual({
        focusedTextColor: '#1D1B20FF',
        unfocusedTextColor: '#1D1B20FF',
        disabledTextColor: '#49454FFF',
        cursorColor: '#007AFF',
      });
      expect(modifier(field.props, 'fillMaxWidth')).toBeDefined();
      expect(modifier(field.props, 'offset')).toBeUndefined();
      expect(nodes(slot('text')).some(n => modifier(n.props, 'padding'))).toBe(false);
    }
  });

  it('draws the field without a message, not as an action sheet, and leaves the focus alone when asked', async () => {
    await render(<Alert title="Open by id" visible testID="alert" input={{placeholder: 'Identifier', autoFocus: false}}/>);
    if (isIOS) {
      expect(host(p => p.placeholder === 'Identifier', slot('actions')).props.autoFocus).toBe(false);
    } else {
      expect(host(p => p.autoFocus === false, slot('text'))).toBeTruthy();
    }
    await render(<Alert title="Share" visible sheet testID="alert" input={{placeholder: 'Name'}}/>);
    expect(nodes().some(n => n.props.placeholder === 'Name' || n.props.text === 'Name')).toBe(false);
  });

  it('renders only the confirm actions without a cancel action', async () => {
    await render(<Alert title="Saved" visible testID="alert" actions={[{label: 'Undo'}, {label: 'Got it'}]}/>);
    if (isIOS) {
      expect(children(slot('actions')).map(b => b.props.label)).toEqual(['Undo', 'Got it']);
    } else {
      expect(buttonsIn('confirmButton').map(b => b.label)).toEqual(['Undo', 'Got it']);
      expect(hasSlot('dismissButton')).toBe(false);
    }
  });
});
