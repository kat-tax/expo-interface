import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Composer} from '.';

describe('Composer (web)', () => {
  it('sends the trimmed text from the button and from Enter, and clears what it keeps itself', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} testID="c"/>);
    const field = screen.getByRole('textbox', {name: 'Message'});
    const send = screen.getByRole('button', {name: 'Send'});
    // Nothing to send: the button waits.
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.change(field, {target: {value: '  hello  '}});
    expect(send).toBeEnabled();
    fireEvent.click(send);
    expect(onSend).toHaveBeenLastCalledWith('hello');
    expect(field).toHaveValue('');
    fireEvent.change(field, {target: {value: 'again'}});
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onSend).toHaveBeenLastCalledWith('again');
    expect(onSend).toHaveBeenCalledTimes(2);
    // The bare field: no padding of its own, no focus ring; the capsule draws both.
    expect(getComputedStyle(field).paddingLeft).toBe('0px');
    expect(getComputedStyle(field).outlineWidth).toBe('0px');
  });

  it('is a stop button while busy, and leaves a controlled text to the app', () => {
    const onStop = vi.fn();
    const onSend = vi.fn();
    const onChangeText = vi.fn();
    const {rerender} = render(<Composer value="draft" onChangeText={onChangeText} onSend={onSend} onStop={onStop} busy testID="c"/>);
    expect(screen.queryByRole('button', {name: 'Send'})).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Stop'}));
    expect(onStop).toHaveBeenCalledTimes(1);
    // Enter waits while busy, and the text stays to be sent later.
    const field = screen.getByRole('textbox', {name: 'Message'});
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onSend).not.toHaveBeenCalled();
    expect(field).toHaveValue('draft');
    rerender(<Composer value="draft" onChangeText={onChangeText} onSend={onSend} testID="c"/>);
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onSend).toHaveBeenCalledWith('draft');
    fireEvent.click(screen.getByRole('button', {name: 'Send'}));
    expect(onSend).toHaveBeenCalledTimes(2);
    expect(onChangeText).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', {name: 'Message'})).toHaveValue('draft');
  });

  it('waits while busy with nothing to stop, and shows the notice under the capsule', () => {
    render(<Composer onSend={() => {}} busy notice="Shift+Enter for a new line" placeholder="Reply" testID="c"/>);
    expect(screen.getByRole('button', {name: 'Stop'})).toBeDisabled();
    expect(screen.getByTestId('c')).toHaveTextContent('Shift+Enter for a new line');
    expect(screen.getByRole('textbox', {name: 'Reply'})).toBeInTheDocument();
  });

  it('needs no test identifier', () => {
    const onSend = vi.fn();
    const {rerender} = render(<Composer onSend={onSend} busy onStop={() => {}}/>);
    expect(screen.getByRole('button', {name: 'Stop'})).not.toHaveAttribute('data-testid');
    expect(screen.getByRole('textbox', {name: 'Message'})).not.toHaveAttribute('data-testid');
    rerender(<Composer onSend={onSend}/>);
    expect(screen.getByRole('button', {name: 'Send'})).not.toHaveAttribute('data-testid');
  });

  it('takes a menu at the leading edge of the capsule, which a disabled composer disables', () => {
    const {rerender} = render(<Composer onSend={() => {}} menu={{label: 'Send to', icon: icons.share, items: [{label: 'Everyone'}]}}/>);
    expect(screen.getByRole('button', {name: 'Send to'})).toBeEnabled();
    expect(screen.getByRole('menuitem', {name: 'Everyone', hidden: true})).toBeInTheDocument();
    rerender(<Composer onSend={() => {}} disabled menu={{label: 'Send to', icon: icons.share, items: [{label: 'Everyone'}]}}/>);
    expect(screen.getByRole('button', {name: 'Send to'})).toBeDisabled();
  });

  it('disables writing and sending', () => {
    const onSend = vi.fn();
    render(<Composer value="ready" onSend={onSend} disabled testID="c"/>);
    expect(screen.getByRole('textbox', {name: 'Message'})).toHaveAttribute('readonly');
    expect(screen.getByRole('button', {name: 'Send'})).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('textbox', {name: 'Message'}), {key: 'Enter', keyCode: 13});
    expect(onSend).not.toHaveBeenCalled();
  });
});
