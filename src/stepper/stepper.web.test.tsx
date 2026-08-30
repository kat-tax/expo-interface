import {fireEvent, render, screen} from '@testing-library/react';
import {Stepper} from '.';

const decrement = () => screen.getByRole('button', {name: 'Decrement'});
const increment = () => screen.getByRole('button', {name: 'Increment'});

describe('Stepper (web)', () => {
  it('renders the label, value and two native buttons', () => {
    render(<Stepper label="Quantity" value={3} onValueChange={jest.fn()} testID="qty"/>);
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('group', {name: 'Quantity'})).toHaveClass('ui-stepper__buttons');
    expect(decrement()).toHaveAttribute('type', 'button');
    expect(increment()).toHaveAttribute('type', 'button');
    expect(decrement()).toHaveClass('ui-stepper__button');
    const row = screen.getByTestId('qty');
    expect(row).toHaveClass('ui-stepper');
    expect(row).not.toHaveClass('ui-stepper--disabled');
  });

  it('steps by 1 by default', () => {
    const onValueChange = jest.fn();
    render(<Stepper value={3} onValueChange={onValueChange}/>);
    fireEvent.click(increment());
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    fireEvent.click(decrement());
    expect(onValueChange).toHaveBeenLastCalledWith(2);
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('steps by a custom amount and rounds float drift', () => {
    const onValueChange = jest.fn();
    render(<Stepper value={0.3} step={0.1} onValueChange={onValueChange}/>);
    fireEvent.click(increment());
    expect(onValueChange).toHaveBeenLastCalledWith(0.4);
    fireEvent.click(decrement());
    expect(onValueChange).toHaveBeenLastCalledWith(0.2);
  });

  it('disables the decrement button at min and the increment button at max', () => {
    const onValueChange = jest.fn();
    const {rerender} = render(<Stepper value={1} min={1} max={5} onValueChange={onValueChange}/>);
    expect(decrement()).toBeDisabled();
    expect(increment()).toBeEnabled();

    rerender(<Stepper value={5} min={1} max={5} onValueChange={onValueChange}/>);
    expect(decrement()).toBeEnabled();
    expect(increment()).toBeDisabled();

    rerender(<Stepper value={3} min={1} max={5} onValueChange={onValueChange}/>);
    expect(decrement()).toBeEnabled();
    expect(increment()).toBeEnabled();
  });

  it('clamps a step that would overshoot the bounds', () => {
    const onValueChange = jest.fn();
    const {rerender} = render(<Stepper value={9} step={5} max={10} onValueChange={onValueChange}/>);
    fireEvent.click(increment());
    expect(onValueChange).toHaveBeenLastCalledWith(10);

    rerender(<Stepper value={2} step={5} min={0} onValueChange={onValueChange}/>);
    fireEvent.click(decrement());
    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it('formats the displayed value', () => {
    render(<Stepper label="Zoom" value={150} formatValue={v => `${v}%`} onValueChange={jest.fn()}/>);
    expect(screen.getByText('150%')).toBeInTheDocument();
    expect(screen.queryByText('150')).toBeNull();
  });

  it('disables both buttons and marks the row when disabled', () => {
    render(<Stepper label="Guests" value={2} min={0} max={5} onValueChange={jest.fn()} disabled testID="guests"/>);
    expect(decrement()).toBeDisabled();
    expect(increment()).toBeDisabled();
    expect(screen.getByTestId('guests')).toHaveClass('ui-stepper--disabled');
  });

  it('renders without a label', () => {
    render(<Stepper value={2} onValueChange={jest.fn()} testID="bare"/>);
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-label');
    expect(screen.getByTestId('bare').querySelectorAll('span')).toHaveLength(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('flattens the row style into inline CSS', () => {
    render(<Stepper value={2} onValueChange={jest.fn()} style={{opacity: 0.5}} testID="styled"/>);
    expect(screen.getByTestId('styled')).toHaveStyle({opacity: 0.5});
  });
});
