// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Chip} from '.';

describe('Chip (web)', () => {
  it('is a toggle button when it has a state, and says so with aria-pressed', () => {
    render(<Chip label="Unread" selected onPress={() => {}} testID="c"/>);
    const chip = screen.getByRole('button', {name: 'Unread'});
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveClass('ui-chip--on');
  });

  it('is a plain button when it has none — not one permanently unpressed', () => {
    render(<Chip label="Add tag" onPress={() => {}} testID="c"/>);
    const chip = screen.getByTestId('c');
    expect(chip).not.toHaveAttribute('aria-pressed');
    expect(chip).not.toHaveClass('ui-chip--on');
  });

  it('reports the state a press moves it to, not the one it had', () => {
    const onPress = vi.fn();
    const view = render(<Chip label="Unread" selected={false} onPress={onPress} testID="c"/>);
    fireEvent.click(screen.getByTestId('c'));
    expect(onPress).toHaveBeenLastCalledWith(true);
    view.rerender(<Chip label="Unread" selected onPress={onPress} testID="c"/>);
    fireEvent.click(screen.getByTestId('c'));
    expect(onPress).toHaveBeenLastCalledWith(false);
  });

  it('draws a leading icon beside the label', () => {
    render(<Chip label="Starred" icon={icons.add} onPress={() => {}} testID="c"/>);
    expect(screen.getByTestId('c').querySelector('.ui-symbol')).not.toBeNull();
  });

  it('takes no presses while it is off', () => {
    const onPress = vi.fn();
    render(<Chip label="Unread" disabled onPress={onPress} testID="c"/>);
    expect(screen.getByTestId('c')).toBeDisabled();
    fireEvent.click(screen.getByTestId('c'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('can be pressed without anyone listening', () => {
    render(<Chip label="Unread" testID="c"/>);
    fireEvent.click(screen.getByTestId('c'));
    expect(screen.getByTestId('c')).toBeInTheDocument();
  });
});
