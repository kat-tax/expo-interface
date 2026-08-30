import {fireEvent, render, screen} from '@testing-library/react';
import {Slider} from '.';

describe('Slider (web)', () => {
  it('renders a native range input in a labelled row', () => {
    render(<Slider label="Brightness" value={0.5} onValueChange={vi.fn()} testID="brightness"/>);
    const input = screen.getByRole('slider', {name: 'Brightness'});
    expect(input).toHaveAttribute('type', 'range');
    expect(input).toHaveClass('ui-slider__input');
    expect(input).toHaveValue('0.5');
    expect(screen.getByText('Brightness')).toBeInTheDocument();
    const row = screen.getByTestId('brightness');
    expect(row).toHaveClass('ui-slider');
    expect(row).not.toHaveClass('ui-slider--disabled');
    expect(row.contains(input)).toBe(true);
  });

  it('defaults to a continuous 0–1 range', () => {
    render(<Slider value={0.25} onValueChange={vi.fn()}/>);
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '1');
    expect(input).toHaveAttribute('step', 'any');
  });

  it('forwards min, max and step', () => {
    render(<Slider value={40} min={0} max={100} step={10} onValueChange={vi.fn()}/>);
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '10');
    expect(input).toHaveValue('40');
  });

  it('reports numeric values through onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Slider value={0.5} onValueChange={onValueChange}/>);
    fireEvent.change(screen.getByRole('slider'), {target: {value: '0.75'}});
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(0.75);
  });

  it('reports the final value when the thumb is released', () => {
    const onSlidingComplete = vi.fn();
    render(<Slider value={30} min={0} max={100} onValueChange={vi.fn()} onSlidingComplete={onSlidingComplete}/>);
    const input = screen.getByRole('slider');
    fireEvent.pointerUp(input);
    expect(onSlidingComplete).toHaveBeenLastCalledWith(30);
    fireEvent.keyUp(input, {key: 'ArrowRight'});
    expect(onSlidingComplete).toHaveBeenCalledTimes(2);
  });

  it('disables the input and marks the row', () => {
    render(<Slider label="Volume" value={0.5} onValueChange={vi.fn()} disabled testID="volume"/>);
    expect(screen.getByRole('slider')).toBeDisabled();
    expect(screen.getByTestId('volume')).toHaveClass('ui-slider--disabled');
  });

  it('exposes a custom accent through a CSS custom property', () => {
    render(<Slider value={0.5} onValueChange={vi.fn()} accentColor="#FF9500" testID="warm"/>);
    expect(screen.getByTestId('warm').style.getPropertyValue('--ui-slider-accent')).toBe('#FF9500');
  });

  it('omits the label text and accessible name without a label', () => {
    render(<Slider value={0.5} onValueChange={vi.fn()} testID="bare"/>);
    const input = screen.getByRole('slider');
    expect(input).not.toHaveAttribute('aria-label');
    expect(screen.getByTestId('bare').querySelector('span')).toBeNull();
  });

  it('flattens the row style into inline CSS', () => {
    render(<Slider value={0.5} onValueChange={vi.fn()} style={{opacity: 0.5}} testID="styled"/>);
    expect(screen.getByTestId('styled')).toHaveStyle({opacity: 0.5});
  });
});
