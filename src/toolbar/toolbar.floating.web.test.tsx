import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Toolbar} from '.';

const commands = [
  {label: 'Bold', icon: icons.add, hideLabel: true, active: true},
  {label: 'Link', icon: icons.share, hideLabel: true, active: false},
  {label: 'Clear', icon: icons.trash, hideLabel: true},
];

describe('Toolbar floating (web)', () => {
  it('draws its toggles as pressed buttons in a raised capsule', () => {
    render(<Toolbar floating commands={commands} testID="bar"/>);
    expect(screen.getByRole('button', {name: 'Bold'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', {name: 'Link'})).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', {name: 'Clear'})).not.toHaveAttribute('aria-pressed');
    const bar = screen.getByTestId('bar');
    expect(getComputedStyle(bar).borderTopLeftRadius).toBe('999px');
    expect(getComputedStyle(bar).boxShadow).not.toBe('');
  });

  it('floats beside a rectangle once placed, and takes no presses before', () => {
    render(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} commands={commands} testID="bar"/>);
    const bounds = screen.getByTestId('bar-bounds');
    // react-native-web writes box-none as none on the box and auto on what is in it.
    expect(getComputedStyle(bounds).pointerEvents).toBe('none');
    const placed = bounds.firstElementChild as HTMLElement;
    expect(getComputedStyle(placed).opacity).toBe('0');
    expect(placed.contains(screen.getByRole('button', {name: 'Bold'}))).toBe(true);
    fireEvent.click(screen.getByRole('button', {name: 'Bold'}));
  });
});
