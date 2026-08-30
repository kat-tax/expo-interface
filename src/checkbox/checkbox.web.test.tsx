import {fireEvent, render, screen} from '@testing-library/react';
import {Checkbox} from '.';

describe('Checkbox (web)', () => {
  it('renders a native checkbox wrapped in a <label> row', () => {
    render(<Checkbox label="Remember me" value onValueChange={vi.fn()} testID="remember"/>);
    const input = screen.getByRole('checkbox', {name: 'Remember me'});
    expect(input).toBeChecked();
    expect(input).toHaveClass('ui-checkbox__input');
    expect(screen.getByLabelText('Remember me')).toBe(input);
    const row = screen.getByTestId('remember');
    expect(row.tagName).toBe('LABEL');
    expect(row).toHaveClass('ui-checkbox');
    expect(row).not.toHaveClass('ui-checkbox--disabled');
    expect(row.contains(input)).toBe(true);
  });

  it('reports the next checked state through onValueChange', () => {
    const onValueChange = vi.fn();
    const {rerender} = render(<Checkbox label="Terms" value={false} onValueChange={onValueChange}/>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onValueChange).toHaveBeenCalledWith(true);

    rerender(<Checkbox label="Terms" value onValueChange={onValueChange}/>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onValueChange).toHaveBeenLastCalledWith(false);
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('toggles when the label text is clicked', () => {
    const onValueChange = vi.fn();
    render(<Checkbox label="Newsletter" value={false} onValueChange={onValueChange}/>);
    fireEvent.click(screen.getByText('Newsletter'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('disables the input and marks the row', () => {
    render(<Checkbox label="Updates" value onValueChange={vi.fn()} disabled testID="updates"/>);
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByTestId('updates')).toHaveClass('ui-checkbox--disabled');
  });

  it('exposes a custom accent through a CSS custom property on the row', () => {
    render(<Checkbox label="Highlight" value onValueChange={vi.fn()} accentColor="#FF9500" testID="row"/>);
    expect(screen.getByTestId('row').style.getPropertyValue('--ui-checkbox-accent')).toBe('#FF9500');
  });

  it('renders the bare input when there is no label', () => {
    const {container} = render(
      <Checkbox value={false} onValueChange={vi.fn()} accentColor="#34C759" testID="bare"/>,
    );
    const input = screen.getByTestId('bare');
    expect(input).toBe(screen.getByRole('checkbox'));
    expect(input).not.toBeChecked();
    expect(container.querySelector('label')).toBeNull();
    expect(input.style.getPropertyValue('--ui-checkbox-accent')).toBe('#34C759');
  });

  it('flattens the row style into inline CSS', () => {
    render(<Checkbox label="Styled" value onValueChange={vi.fn()} style={{opacity: 0.5}} testID="styled"/>);
    expect(screen.getByTestId('styled')).toHaveStyle({opacity: 0.5});
  });
});
