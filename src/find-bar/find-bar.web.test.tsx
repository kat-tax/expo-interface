import {fireEvent, render, screen} from '@testing-library/react';
import {FindBar} from '.';

describe('FindBar (web)', () => {
  it('is a bar of a search field, the count in a live region, and previous, next and close', () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onClose = vi.fn();
    render(<FindBar value="teh" matches={{current: 2, total: 5}} onNext={onNext} onPrevious={onPrevious} onClose={onClose} testID="find"/>);
    const field = screen.getByRole('textbox', {name: 'Find'});
    expect(document.activeElement).toBe(field);
    expect(field).toHaveAttribute('enterkeyhint', 'search');
    const count = screen.getByTestId('find-count');
    expect(count).toHaveTextContent('2 of 5');
    expect(count.parentElement).toHaveAttribute('aria-live', 'polite');
    fireEvent.click(screen.getByRole('button', {name: 'Next match'}));
    fireEvent.click(screen.getByRole('button', {name: 'Previous match'}));
    fireEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('goes forward on Enter, back on Shift+Enter, and closes on Escape', () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onClose = vi.fn();
    render(<FindBar onNext={onNext} onPrevious={onPrevious} onClose={onClose}/>);
    const field = screen.getByRole('textbox', {name: 'Find'});
    fireEvent.change(field, {target: {value: 'teh'}});
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13});
    fireEvent.keyDown(field, {key: 'Enter', keyCode: 13, shiftKey: true});
    fireEvent.keyDown(field, {key: 'Escape'});
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(field).toHaveValue('teh');
  });

  it('disables previous and next with nothing to step through', () => {
    render(<FindBar value="teh" matches={{current: 0, total: 0}}/>);
    expect(screen.getByRole('button', {name: 'Next match'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Previous match'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Close'})).toBeEnabled();
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });
});
