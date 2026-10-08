// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {AlertAction} from './types';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {Alert} from '.';

type DialogPrototype = Omit<HTMLDialogElement, 'showModal' | 'close'> & {showModal?: () => void; close?: () => void};
const proto = HTMLDialogElement.prototype as DialogPrototype;
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
const close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
});

const confirm: AlertAction[] = [
  {label: 'Cancel', role: 'cancel'},
  {label: 'Delete', role: 'destructive'},
];

const dialog = () => screen.getByTestId('alert');
const actionButtons = () => within(dialog()).getAllByRole('button');

describe('Alert (web)', () => {
  beforeAll(() => {
    // jsdom does not implement the <dialog> methods.
    proto.showModal = showModal;
    proto.close = close;
  });

  afterAll(() => {
    delete proto.showModal;
    delete proto.close;
  });

  it('renders the trigger in place and a closed <dialog>', () => {
    render(
      <Alert title="Delete account?" message="This cannot be undone." visible={false} testID="alert">
        <button type="button">Delete account</button>
      </Alert>,
    );
    expect(screen.getByRole('button', {name: 'Delete account'})).toBeInTheDocument();
    const element = dialog();
    expect(element.tagName).toBe('DIALOG');
    expect(element).toHaveClass('ui-alert');
    expect(element).not.toHaveAttribute('open');
    expect(showModal).not.toHaveBeenCalled();
    expect(element).toHaveAttribute('aria-label', 'Delete account?');
    expect(screen.getByTestId('alert-title')).toHaveTextContent('Delete account?');
    expect(element).toHaveTextContent('This cannot be undone.');
  });

  it('opens modally while visible and closes when hidden', () => {
    const {rerender} = render(<Alert title="Hi" visible testID="alert"/>);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog()).toHaveAttribute('open');

    rerender(<Alert title="Hi" visible={false} testID="alert"/>);
    expect(close).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toHaveAttribute('open');

    rerender(<Alert title="Hi" visible={false} testID="alert"/>);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('defaults to a single OK action', () => {
    render(<Alert title="Link copied" visible testID="alert"/>);
    const [ok] = actionButtons();
    expect(actionButtons()).toHaveLength(1);
    expect(ok).toHaveTextContent('OK');
    expect(ok).toHaveClass('ui-button--text');
  });

  it('renders text-style actions with the cancel action last', () => {
    render(
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
    const buttons = actionButtons();
    expect(buttons.map(b => b.textContent)).toEqual(["Don't save", 'Save', 'Cancel']);
    expect(buttons[0]).toHaveClass('ui-button--text', 'ui-button--destructive');
    expect(buttons[1]).not.toHaveClass('ui-button--destructive');
    expect(buttons[2]).not.toHaveClass('ui-button--destructive');
  });

  it('draws a field under the message, and Enter in it presses the first action that is not the cancel', () => {
    const onRename = vi.fn();
    const onChangeText = vi.fn();
    render(
      <Alert
        title="Rename"
        message="A name for the document."
        visible
        testID="alert"
        input={{placeholder: 'Name', value: 'Essay', onChangeText, autoCorrect: false, autoFocus: false, testID: 'name'}}
        actions={[{label: 'Cancel', role: 'cancel'}, {label: 'Rename', onPress: onRename}]}
      />,
    );
    const field = within(dialog()).getByRole('textbox', {name: 'Name'});
    expect(field).toHaveValue('Essay');
    expect(field).toHaveAttribute('autocorrect', 'off');
    expect(field).toHaveAttribute('spellcheck', 'false');
    expect(field.parentElement).toHaveClass('ui-alert__field');
    expect(document.activeElement).not.toBe(field);
    fireEvent.change(field, {target: {value: 'Essay 2'}});
    expect(onChangeText).toHaveBeenCalledWith('Essay 2');
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalled();
  });

  it('greys out a disabled action, which neither a click nor Enter presses, until it is enabled', () => {
    const onRename = vi.fn();
    const actions = (disabled: boolean): AlertAction[] => [{label: 'Cancel', role: 'cancel'}, {label: 'Rename', disabled, onPress: onRename}];
    const {rerender} = render(<Alert title="Rename" visible testID="alert" input={{placeholder: 'Name', value: ''}} actions={actions(true)}/>);
    const rename = screen.getByRole('button', {name: 'Rename'});
    expect(rename).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeEnabled();
    const closes = close.mock.calls.length;
    fireEvent.click(rename);
    expect(onRename).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(closes);
    const field = within(dialog()).getByRole('textbox', {name: 'Name'});
    vi.useFakeTimers();
    try {
      field.focus();
      fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
      // react-native-web blurs a one-line field a moment after Enter unless told not to: the user keeps typing.
      vi.advanceTimersByTime(1);
      expect(document.activeElement).toBe(field);
    } finally {
      vi.useRealTimers();
    }
    expect(onRename).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(closes);
    rerender(<Alert title="Rename" visible testID="alert" input={{placeholder: 'Name', value: 'Essay'}} actions={actions(false)}/>);
    expect(screen.getByRole('button', {name: 'Rename'})).toBeEnabled();
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(closes + 1);
  });

  it('focuses the field as the alert opens, and does nothing on Enter with only a cancel', () => {
    render(<Alert title="Open by id" visible testID="alert" input={{placeholder: 'Identifier'}} actions={[{label: 'Cancel', role: 'cancel'}]}/>);
    const field = within(dialog()).getByRole('textbox', {name: 'Identifier'});
    expect(document.activeElement).toBe(field);
    const closes = close.mock.calls.length;
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(close).toHaveBeenCalledTimes(closes);
  });

  it('holds no field as an action sheet', () => {
    render(<Alert title="Share" visible sheet testID="alert" input={{placeholder: 'Name'}}/>);
    expect(within(dialog()).queryByRole('textbox')).toBeNull();
  });

  it('renders the sheet variant anchored at the bottom with stacked outlined actions', () => {
    render(<Alert title="Share drop" visible sheet testID="alert" actions={confirm}/>);
    expect(dialog()).toHaveClass('ui-alert', 'ui-alert--sheet');
    for (const button of actionButtons()) {
      expect(button).toHaveClass('ui-button--outlined');
    }
  });

  it('runs the action handler, closes and reports the dismissal', () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Alert
        title="Delete?"
        visible
        onDismiss={onDismiss}
        testID="alert"
        actions={[{label: 'Cancel', role: 'cancel'}, {label: 'Delete', role: 'destructive', onPress}]}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Delete'}));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toHaveAttribute('open');
  });

  it('reports nothing when the app closes it, and the user\'s next dismissal again', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<Alert title="Hi" visible onDismiss={onDismiss} testID="alert"/>);
    const closes = close.mock.calls.length;
    rerender(<Alert title="Hi" visible={false} onDismiss={onDismiss} testID="alert"/>);
    expect(close).toHaveBeenCalledTimes(closes + 1);
    expect(onDismiss).not.toHaveBeenCalled();
    rerender(<Alert title="Hi" visible onDismiss={onDismiss} testID="alert"/>);
    fireEvent(dialog(), new Event('close'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('reports the dismissal when the dialog closes on its own (Escape)', () => {
    const onDismiss = vi.fn();
    render(<Alert title="Hi" visible onDismiss={onDismiss} testID="alert"/>);
    fireEvent(dialog(), new Event('close'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('closes on a backdrop click but not on a click inside the alert', () => {
    render(<Alert title="Hi" message="Body" visible testID="alert"/>);
    fireEvent.click(screen.getByText('Body'));
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(dialog());
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('is dismissed by Escape and the backdrop with its cancel action disabled', () => {
    const onDismiss = vi.fn();
    const onCancel = vi.fn();
    render(<Alert title="Hi" visible onDismiss={onDismiss} testID="alert" actions={[{label: 'Cancel', role: 'cancel', disabled: true, onPress: onCancel}, {label: 'Rename', disabled: true}]}/>);
    fireEvent(dialog(), new Event('close'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    fireEvent.click(dialog());
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('keeps the accessible name without a testID and omits a missing message', () => {
    render(<Alert title="Only a title" visible/>);
    const element = screen.getByRole('dialog');
    expect(element).toHaveAccessibleName('Only a title');
    expect(element.querySelector('.ui-alert__body')?.childElementCount).toBe(1);
  });

  it('renders only the confirm actions without a cancel action', () => {
    render(<Alert title="Saved" visible testID="alert" actions={[{label: 'Undo'}, {label: 'Got it'}]}/>);
    expect(actionButtons().map(b => b.textContent)).toEqual(['Undo', 'Got it']);
  });
});
