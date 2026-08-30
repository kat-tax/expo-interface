import type {AlertAction} from './types';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {Alert} from '.';

type DialogPrototype = Omit<HTMLDialogElement, 'showModal' | 'close'> & {showModal?: () => void; close?: () => void};
const proto = HTMLDialogElement.prototype as DialogPrototype;
const showModal = jest.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
const close = jest.fn(function (this: HTMLDialogElement) {
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
    expect(element).toHaveAttribute('aria-labelledby', 'alert-title');
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

  it('renders the sheet variant anchored at the bottom with stacked outlined actions', () => {
    render(<Alert title="Share drop" visible sheet testID="alert" actions={confirm}/>);
    expect(dialog()).toHaveClass('ui-alert', 'ui-alert--sheet');
    for (const button of actionButtons()) {
      expect(button).toHaveClass('ui-button--outlined');
    }
  });

  it('runs the action handler, closes and reports the dismissal', () => {
    const onPress = jest.fn();
    const onDismiss = jest.fn();
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

  it('reports the dismissal when the dialog closes on its own (Escape)', () => {
    const onDismiss = jest.fn();
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

  it('omits the message and the aria label without one', () => {
    render(<Alert title="Only a title" visible/>);
    const element = screen.getByRole('dialog');
    expect(element).not.toHaveAttribute('aria-labelledby');
    expect(element.querySelector('.ui-alert__body')?.childElementCount).toBe(1);
  });
});
