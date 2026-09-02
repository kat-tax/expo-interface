import {fireEvent, render, screen} from '@testing-library/react';
import {Switch} from '.';

describe('Switch (web)', () => {
  it('renders a labelled row with the native switch inside it', () => {
    render(<Switch label="Wi-Fi" value onValueChange={vi.fn()} testID="wifi"/>);
    const control = screen.getByRole('switch');
    expect(control).toBeChecked();
    expect(control).toBeEnabled();
    const row = screen.getByTestId('wifi');
    expect(row.contains(control)).toBe(true);
    expect(row.contains(screen.getByText('Wi-Fi'))).toBe(true);
    expect(screen.getByText('Wi-Fi')).not.toHaveStyle({opacity: 0.4});
  });

  it('reports the toggled value', () => {
    const onValueChange = vi.fn();
    render(<Switch label="Wi-Fi" value={false} onValueChange={onValueChange}/>);
    fireEvent.click(screen.getByRole('switch'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('disables the control and dims the label', () => {
    render(<Switch label="Bluetooth" value onValueChange={vi.fn()} disabled/>);
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByText('Bluetooth')).toHaveStyle({opacity: 0.4});
  });

  it('renders the bare switch carrying the testID without a label', () => {
    render(<Switch value={false} onValueChange={vi.fn()} testID="bare"/>);
    const control = screen.getByRole('switch');
    expect(control).not.toBeChecked();
    expect(screen.getByTestId('bare').contains(control)).toBe(true);
    expect(screen.queryByText('Wi-Fi')).toBeNull();
  });

  it('paints the on track with a custom accentColor', () => {
    const {rerender} = render(<Switch value onValueChange={vi.fn()} accentColor="#FF9500" testID="sw"/>);
    expect(screen.getByTestId('sw').innerHTML).toMatch(/rgb\(255, 149, 0\)/);
    rerender(<Switch value onValueChange={vi.fn()} testID="sw"/>);
    expect(screen.getByTestId('sw').innerHTML).not.toMatch(/rgb\(255, 149, 0\)/);
  });
});
