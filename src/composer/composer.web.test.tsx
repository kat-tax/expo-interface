import type {TextFieldCommands} from '../text-field/types';
import {createRef} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Composer} from '.';

describe('Composer (web)', () => {
  it('sends the trimmed text from the button and from Enter, and clears what it keeps itself', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} testID="c"/>);
    const field = screen.getByRole('textbox', {name: 'Message'});
    const send = screen.getByRole('button', {name: 'Send'});
    // One line tall to start: the capsule's 44 is a line of 20 between the paddings.
    expect(field).toHaveAttribute('rows', '1');
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
  });

  it('draws the focus ring on the capsule while the field has the focus, and none on the field', () => {
    // Chrome's focus ring is `outline-style: auto`, which no width turns off.
    const ring = document.createElement('style');
    ring.textContent = 'input, textarea { outline-style: auto; }';
    document.head.append(ring);
    try {
      render(<Composer onSend={() => {}} testID="c"/>);
      const field = screen.getByRole('textbox', {name: 'Message'});
      // The bare field: no padding of its own, no focus ring; the capsule draws both.
      expect(getComputedStyle(field).paddingLeft).toBe('0px');
      expect(getComputedStyle(field).outlineStyle).toBe('none');
      const capsule = field.parentElement!;
      expect(getComputedStyle(capsule).outlineStyle).not.toBe('solid');
      fireEvent.focus(field);
      expect(getComputedStyle(capsule).outlineStyle).toBe('solid');
      expect(getComputedStyle(capsule).outlineWidth).toBe('2px');
      expect(capsule.style.outlineColor).toBe('var(--color-tint)');
      fireEvent.blur(field);
      expect(getComputedStyle(capsule).outlineStyle).not.toBe('solid');
    } finally {
      ring.remove();
    }
  });

  it('is a stop button while busy, and leaves a controlled text to the app', () => {
    const onStop = vi.fn();
    const onSend = vi.fn();
    const onChangeText = vi.fn();
    const {rerender} = render(<Composer value="draft" onChangeText={onChangeText} onSend={onSend} onStop={onStop} busy testID="c"/>);
    expect(screen.queryByRole('button', {name: 'Send'})).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Stop'}));
    expect(onStop).toHaveBeenCalledTimes(1);
    // Enter does nothing while busy, and the text stays for the next send.
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

  it('keeps the text it holds itself while busy, and sends it only on the next Enter', () => {
    const onSend = vi.fn();
    const {rerender} = render(<Composer onSend={onSend} onStop={() => {}} testID="c"/>);
    const field = screen.getByRole('textbox', {name: 'Message'});
    fireEvent.change(field, {target: {value: 'draft'}});
    rerender(<Composer onSend={onSend} onStop={() => {}} busy testID="c"/>);
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onSend).not.toHaveBeenCalled();
    expect(field).toHaveValue('draft');
    // Nothing goes out when the work ends: the text waits for the user.
    rerender(<Composer onSend={onSend} onStop={() => {}} testID="c"/>);
    expect(onSend).not.toHaveBeenCalled();
    expect(field).toHaveValue('draft');
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onSend).toHaveBeenCalledWith('draft');
    expect(field).toHaveValue('');
  });

  it('waits while busy with nothing to stop, and shows the notice under the capsule', () => {
    render(<Composer onSend={() => {}} busy notice="Shift+Enter for a new line" placeholder="Reply" testID="c"/>);
    expect(screen.getByRole('button', {name: 'Stop'})).toBeDisabled();
    expect(screen.getByTestId('c')).toHaveTextContent('Shift+Enter for a new line');
    expect(screen.getByText('Shift+Enter for a new line').style.color).toBe('var(--color-secondary-label)');
    expect(screen.getByRole('textbox', {name: 'Reply'})).toBeInTheDocument();
  });

  it('keeps the notice in a polite live region, mounted before the first notice, with the gap under the capsule', () => {
    const {rerender} = render(<Composer onSend={() => {}} testID="c"/>);
    const region = screen.getByTestId('c').querySelector('[aria-live="polite"]')!;
    expect(region).toBeEmptyDOMElement();
    rerender(<Composer onSend={() => {}} notice="Could not send." noticeColor="destructive" testID="c"/>);
    const line = screen.getByText('Could not send.');
    expect(line.parentElement).toBe(region);
    expect(getComputedStyle(line).marginTop).toBe('6px');
  });

  it('takes its own labels, icons and keys, colors an error notice, and passes the field its traits', () => {
    const onSend = vi.fn();
    const onKeyPress = vi.fn();
    const props = {
      onSend,
      onStop: () => {},
      sendLabel: 'Ask',
      stopLabel: 'Cancel',
      sendIcon: icons.star,
      stopIcon: icons.trash,
      notice: 'Could not send.',
      noticeColor: 'destructive' as const,
      autoCapitalize: 'none' as const,
      autoCorrect: false,
      keyboardType: 'email' as const,
      onKeyPress,
    };
    const {rerender} = render(<Composer {...props}/>);
    expect(screen.getByRole('button', {name: 'Ask'}).querySelector('.ui-symbol')).toHaveTextContent('star');
    expect(screen.getByText('Could not send.').style.color).toBe('var(--color-destructive)');
    const field = screen.getByRole('textbox', {name: 'Message'});
    expect(field).toHaveAttribute('autocapitalize', 'none');
    expect(field).toHaveAttribute('autocorrect', 'off');
    expect(field).toHaveAttribute('spellcheck', 'false');
    expect(field).toHaveAttribute('inputmode', 'email');
    fireEvent.keyDown(field, {key: 'Escape'});
    expect(onKeyPress).toHaveBeenLastCalledWith('Escape', false);
    fireEvent.keyDown(field, {key: 'Enter', shiftKey: true});
    expect(onKeyPress).toHaveBeenLastCalledWith('Enter', true);
    expect(onSend).not.toHaveBeenCalled();
    // The Enter that sends stays the composer's.
    fireEvent.change(field, {target: {value: 'hi'}});
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    expect(onSend).toHaveBeenCalledWith('hi');
    expect(onKeyPress).not.toHaveBeenCalledWith('Enter', false);
    rerender(<Composer {...props} busy/>);
    expect(screen.getByRole('button', {name: 'Cancel'}).querySelector('.ui-symbol')).toHaveTextContent('delete');
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

  it('leaves the stop button live while disabled, and hands the field\'s commands to the ref', () => {
    const ref = createRef<TextFieldCommands>();
    const onStop = vi.fn();
    render(
      <Composer
        ref={ref}
        value="ready"
        onSend={() => {}}
        onStop={onStop}
        busy
        disabled
        menu={{label: 'Send to', icon: icons.share, items: [{label: 'Everyone'}]}}
      />,
    );
    const field = screen.getByRole('textbox', {name: 'Message'});
    expect(field).toHaveAttribute('readonly');
    expect(screen.getByRole('button', {name: 'Send to'})).toBeDisabled();
    const stop = screen.getByRole('button', {name: 'Stop'});
    expect(stop).toBeEnabled();
    fireEvent.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
    ref.current!.focus();
    expect(document.activeElement).toBe(field);
    ref.current!.blur();
    expect(document.activeElement).not.toBe(field);
  });
});
